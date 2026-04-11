"""S3/MinIO storage client.

When S3 is not available (dev without Docker), returns mock presigned URLs
that point to a local file endpoint. Uploads won't actually persist files
but the full API flow still works end-to-end.
"""
import os
import logging

from apps.api.core.config import settings

logger = logging.getLogger(__name__)

s3_client = None

try:
    import boto3
    from botocore.config import Config

    s3_client = boto3.client(
        "s3",
        endpoint_url=settings.S3_ENDPOINT,
        aws_access_key_id=settings.S3_ACCESS_KEY,
        aws_secret_access_key=settings.S3_SECRET_KEY,
        config=Config(signature_version="s3v4"),
        region_name="us-east-1",
    )
    s3_client.list_buckets()
    logger.info("S3/MinIO connection established")
except Exception:
    s3_client = None
    logger.warning("S3/MinIO not available — using mock storage URLs")


def generate_presigned_upload_url(key: str, content_type: str, expires: int = 3600) -> str:
    if s3_client:
        return s3_client.generate_presigned_url(
            "put_object",
            Params={"Bucket": settings.S3_BUCKET, "Key": key, "ContentType": content_type},
            ExpiresIn=expires,
        )
    return f"http://localhost:8000/mock-upload/{key}"


def generate_presigned_download_url(key: str, expires: int = 3600) -> str:
    if s3_client:
        return s3_client.generate_presigned_url(
            "get_object",
            Params={"Bucket": settings.S3_BUCKET, "Key": key},
            ExpiresIn=expires,
        )
    return f"http://localhost:8000/mock-download/{key}"


def delete_object(key: str) -> None:
    if s3_client:
        s3_client.delete_object(Bucket=settings.S3_BUCKET, Key=key)
