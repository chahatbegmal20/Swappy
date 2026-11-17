"""S3-compatible storage client (MinIO locally, R2/S3 in staging/production).

In development, if S3 is unreachable, mock presigned URLs point at the local
API upload endpoint so the product flow still works without Docker.
Staging/production never fall back to mock storage.
"""
import logging

from apps.api.core.config import settings

logger = logging.getLogger(__name__)

s3_client = None


def _build_s3_client():
    import boto3
    from botocore.config import Config

    return boto3.client(
        "s3",
        endpoint_url=settings.S3_ENDPOINT or None,
        aws_access_key_id=settings.S3_ACCESS_KEY,
        aws_secret_access_key=settings.S3_SECRET_KEY,
        config=Config(
            signature_version="s3v4",
            s3={"addressing_style": "path" if settings.S3_FORCE_PATH_STYLE else "auto"},
        ),
        region_name=settings.S3_REGION or "auto",
    )


try:
    s3_client = _build_s3_client()
    s3_client.list_buckets()
    logger.info("S3-compatible storage connected (endpoint=%s)", settings.S3_ENDPOINT)
except Exception:
    s3_client = None
    if settings.is_development:
        logger.warning("S3/MinIO not available — using mock storage URLs")
    else:
        logger.error(
            "S3-compatible storage unavailable in APP_ENV=%s — uploads will fail until S3_* is fixed",
            settings.APP_ENV,
        )


def _mock_base() -> str:
    # Prefer 127.0.0.1 over "localhost" — on Windows, localhost can resolve to ::1 while
    # uvicorn is bound to IPv4 only, which makes browser/PowerShell uploads hang.
    base = (settings.BACKEND_URL or "http://127.0.0.1:8000").rstrip("/")
    if "localhost" in base:
        base = base.replace("localhost", "127.0.0.1")
    return base


def _require_s3():
    if s3_client:
        return s3_client
    if settings.is_development:
        return None
    raise RuntimeError(
        "Object storage is not configured. Set S3_ENDPOINT / S3_ACCESS_KEY / "
        "S3_SECRET_KEY / S3_BUCKET for staging and production."
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
