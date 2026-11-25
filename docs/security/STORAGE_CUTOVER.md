# Storage cutover — leave mock disk, use private S3

## Confirmed behaviour (source code)

When S3 is unreachable **and** mock mode is allowed, `generate_presigned_upload_url` returns:

```text
{BACKEND_URL}/mock-upload/uploads/{user}/{project}/{id}/{filename}
```

`PUT /mock-upload/...` writes bytes to:

```text
local_uploads/uploads/...
```

inside the **API process working directory**.

On ECS that is the **task container filesystem** — ephemeral. Files are lost when the task is replaced, scaled, crashes, or a new revision deploys.

Scoring also reads `local_uploads/{s3_key}` (`apps/api/routers/scoring.py`), so mock uploads only work while that same task still has the files on disk.

MongoDB only stores metadata (`s3_key`, filename, size) — **not** the file bytes.

## Your screenshot (`ALLOW_MOCK_STORAGE=true`, no S3_* vars)

That configuration means cloud uploads were almost certainly using **mock local disk**, not durable object storage.

## What we changed in code

1. **Mock storage is local-development only** — `ALLOW_MOCK_STORAGE=true` is ignored for behaviour outside `APP_ENV=development`, and staging/prod **refuse to boot** if the flag is still true.
2. **`PUT /mock-upload/*` returns 404** outside development.
3. Path traversal guards + 50 MiB cap remain for local mock.
4. Outside development, MinIO `localhost` / `minioadmin` defaults are cleared so boto3 can use the **ECS task IAM role**.
5. `/health` reports `storage` (`s3` | `mock_local_disk` | `unavailable`) and `mock_storage`.

## What you must do on ECS (now)

### A. Immediate (safety)

1. Set **`ALLOW_MOCK_STORAGE=false`** on the ECS task / Express env.
2. Redeploy this branch so `/mock-upload` is dead on the public API.
3. Assume any files uploaded while mock was on **may already be gone** after prior deploys. Check the running task only if you still have an old revision up:

   ```text
   ECS Exec / shell → ls local_uploads/
   ```

   Copy out anything you still need before replacing that task.

### B. Configure private S3 (preferred — no permanent access keys)

1. Create a private bucket, e.g. `swappy-prod-uploads` in `ap-southeast-2`.
2. Block public access; no public bucket policy.
3. Attach an IAM policy to the **ECS task role** (not a long-lived user key):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "SwappyObjectAccess",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::swappy-prod-uploads/uploads/*"
    },
    {
      "Sid": "SwappyListBucket",
      "Effect": "Allow",
      "Action": ["s3:ListBucket", "s3:HeadBucket"],
      "Resource": "arn:aws:s3:::swappy-prod-uploads"
    }
  ]
}
```

4. ECS task environment:

| Variable | Value |
|----------|--------|
| `ALLOW_MOCK_STORAGE` | `false` |
| `S3_BUCKET` | `swappy-prod-uploads` |
| `S3_REGION` | `ap-southeast-2` |
| `S3_ENDPOINT` | _(omit / empty)_ |
| `S3_ACCESS_KEY` | _(omit / empty)_ |
| `S3_SECRET_KEY` | _(omit / empty)_ |
| `S3_FORCE_PATH_STYLE` | `false` (or omit) |

5. Redeploy. `GET /health` should show `"storage": "s3"` and `"mock_storage": false`.

### C. CORS on the bucket (browser direct PUT)

Presigned PUT goes **browser → S3**, not through ECS. Add a bucket CORS rule allowing your frontend origin (`https://www.swappystudio.com`) for `PUT` / `HEAD` / `GET`.

## Why not put AWS access keys in ECS env?

The task role already provides temporary credentials via the instance metadata / ECS credential endpoint. Static keys in env are another secret to rotate and leak. Use the task role unless you are on R2/MinIO (then keys + endpoint are required).

## Verify

```text
GET  /health                         → storage=s3, mock_storage=false
PUT  /mock-upload/test               → 404
POST /api/v1/uploads/presign (auth)  → upload_url host is s3.amazonaws.com (or your region)
Browser PUT to that URL              → 200
Object appears in the private bucket
```
