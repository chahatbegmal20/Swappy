import uuid as uuid_mod
from uuid import UUID  # noqa: F401 — kept for potential future use

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.core.database import get_db
from apps.api.core.security import get_current_user
from apps.api.core.storage import generate_presigned_upload_url
from apps.api.models.database import ContentUpload, Project, User
from apps.api.models.schemas import (
    PresignRequest,
    PresignResponse,
    UploadCompleteRequest,
    UploadResponse,
)

router = APIRouter(prefix="/uploads", tags=["uploads"])


@router.post("/presign", response_model=PresignResponse, status_code=status.HTTP_201_CREATED)
async def presign_upload(
    body: PresignRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Project).where(Project.id == body.project_id, Project.user_id == current_user.id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    upload_id = str(uuid_mod.uuid4())
    s3_key = f"uploads/{current_user.id}/{body.project_id}/{upload_id}/{body.filename}"

    upload = ContentUpload(
        id=upload_id,
        project_id=body.project_id,
        content_type=body.content_type,
        s3_key=s3_key,
        original_filename=body.filename,
        mime_type=body.content_type,
        file_size_bytes=body.file_size_bytes,
        processing_status="awaiting_upload",
    )
    db.add(upload)
    await db.flush()

    upload_url = generate_presigned_upload_url(s3_key, body.content_type)
    return PresignResponse(upload_url=upload_url, s3_key=s3_key, upload_id=upload_id)


@router.post("/complete", response_model=UploadResponse)
async def complete_upload(
    body: UploadCompleteRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(ContentUpload).where(ContentUpload.id == body.upload_id))
    upload = result.scalar_one_or_none()
    if not upload:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Upload not found")

    proj_result = await db.execute(
        select(Project).where(Project.id == upload.project_id, Project.user_id == current_user.id)
    )
    if not proj_result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your upload")

    upload.content_type = body.content_type
    upload.metadata_ = body.metadata
    upload.processing_status = "processing"
    await db.flush()
    await db.refresh(upload)

    # In production, dispatch an async processing job here
    upload.processing_status = "completed"
    await db.flush()
    await db.refresh(upload)

    return UploadResponse.model_validate(upload)


@router.get("/{upload_id}/status", response_model=UploadResponse)
async def upload_status(
    upload_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(ContentUpload).where(ContentUpload.id == upload_id))
    upload = result.scalar_one_or_none()
    if not upload:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Upload not found")

    proj_result = await db.execute(
        select(Project).where(Project.id == upload.project_id, Project.user_id == current_user.id)
    )
    if not proj_result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your upload")

    return UploadResponse.model_validate(upload)
