"""S3-compatible storage client (MinIO locally, S3/R2 in cloud).

On ECS, prefer an empty S3_ACCESS_KEY / S3_SECRET_KEY so boto3 uses the
task IAM role — no long-lived access keys in the container environment.

Mock `/mock-upload` disk storage is development-only. Enabling it on ECS
writes into the task's ephemeral filesystem (lost on deploy/scale/crash).
"""
import logging

from apps.api.core.config import settings

logger = logging.getLogger(__name__)

s3_client = None


def _build_s3_client():
    import boto3
    from botocore.config import Config

    endpoint = (settings.S3_ENDPOINT or "").strip() or None
    # Local MinIO defaults use localhost; cloud AWS S3 should omit custom endpoint.
    if (
        not settings.is_development
        and endpoint
        and ("localhost" in endpoint or "127.0.0.1" in endpoint)
    ):
        endpoint = None

    kwargs: dict = {
        "service_name": "s3",
        "config": Config(
            signature_version="s3v4",
            s3={
                "addressing_style": "path"
                if settings.S3_FORCE_PATH_STYLE and endpoint
                else "auto"
            },
        ),
        "region_name": (settings.S3_REGION or "ap-southeast-2").strip() or "ap-southeast-2",
    }
    if endpoint:
        kwargs["endpoint_url"] = endpoint

    if settings.uses_iam_role_for_s3 and not settings.is_development:
        # ECS task role / instance profile / env AWS_WEB_IDENTITY — no static keys.
        logger.info(
            "Building S3 client with default credential chain (IAM role), bucket=%s region=%s",
            settings.S3_BUCKET,
            kwargs["region_name"],
        )
    else:
        kwargs["aws_access_key_id"] = settings.S3_ACCESS_KEY or None
        kwargs["aws_secret_access_key"] = settings.S3_SECRET_KEY or None

    return boto3.client(**kwargs)


try:
    s3_client = _build_s3_client()
    # Cheap connectivity check — HeadBucket if possible, else list.
    try:
        s3_client.head_bucket(Bucket=settings.S3_BUCKET)
    except Exception:
        s3_client.list_buckets()
    logger.info(
        "Object storage connected (endpoint=%s bucket=%s iam_role=%s)",
        settings.S3_ENDPOINT or "aws-default",
        settings.S3_BUCKET,
        settings.uses_iam_role_for_s3 and not settings.is_development,
    )
except Exception:
    s3_client = None
    if settings.allow_mock_storage:
        logger.warning(
            "S3/MinIO not available — using development mock storage under local_uploads/"
        )
    else:
        logger.error(
            "Object storage unavailable in APP_ENV=%s — configure S3_BUCKET + task IAM "
            "role (or S3_* keys for R2/MinIO). Mock disk storage is disabled outside "
            "local development.",
            settings.APP_ENV,
        )


def _mock_base() -> str:
    base = (settings.BACKEND_URL or "http://127.0.0.1:8000").rstrip("/")
    if "localhost" in base:
        base = base.replace("localhost", "127.0.0.1")
    return base


def _require_s3():
    if s3_client:
        return s3_client
    if settings.allow_mock_storage:
        return None
    raise RuntimeError(
        "Object storage is not configured. On ECS: set S3_BUCKET, attach a task role "
        "with s3:PutObject/GetObject on that bucket, leave access keys empty, and set "
        "ALLOW_MOCK_STORAGE=false. For R2/MinIO set S3_ENDPOINT + keys."
    )


def generate_presigned_upload_url(key: str, content_type: str, expires: int = 3600) -> str:
    client = _require_s3()
    if client:
        return client.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": settings.S3_BUCKET,
                "Key": key,
                "ContentType": content_type,
            },
            ExpiresIn=expires,
        )
    return f"{_mock_base()}/mock-upload/{key}"


def generate_presigned_download_url(key: str, expires: int = 3600) -> str:
    client = _require_s3()
    if client:
        return client.generate_presigned_url(
            "get_object",
            Params={"Bucket": settings.S3_BUCKET, "Key": key},
            ExpiresIn=expires,
        )
    return f"{_mock_base()}/mock-download/{key}"


def delete_object(key: str) -> None:
    client = _require_s3()
    if client:
        client.delete_object(Bucket=settings.S3_BUCKET, Key=key)


def storage_backend_label() -> str:
    if s3_client:
        return "s3"
    if settings.allow_mock_storage:
        return "mock_local_disk"
    return "unavailable"
