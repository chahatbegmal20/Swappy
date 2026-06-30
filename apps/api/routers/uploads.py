import uuid as uuid_mod

from fastapi import APIRouter, Depends, HTTPException, status

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


async def _get_owned_project(project_id: str, user: User) -> Project | None:
    project = await Project.get(project_id)
    if not project or project.user_id != user.id:
        return None
    return project


@router.post("/presign", response_model=PresignResponse, status_code=status.HTTP_201_CREATED)
async def presign_upload(
    body: PresignRequest,
    current_user: User = Depends(get_current_user),
):
    if not await _get_owned_project(body.project_id, current_user):
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
    await upload.insert()

    upload_url = generate_presigned_upload_url(s3_key, body.content_type)
    return PresignResponse(upload_url=upload_url, s3_key=s3_key, upload_id=upload_id)


@router.post("/complete", response_model=UploadResponse)
async def complete_upload(
    body: UploadCompleteRequest,
    current_user: User = Depends(get_current_user),
):
    upload = await ContentUpload.get(body.upload_id)
    if not upload:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Upload not found")

    if not await _get_owned_project(upload.project_id, current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your upload")

    upload.content_type = body.content_type
    upload.metadata_ = body.metadata
    # In production, dispatch an async processing job here.
    upload.processing_status = "completed"
    await upload.save()

    return UploadResponse.model_validate(upload)


@router.get("/{upload_id}/status", response_model=UploadResponse)
async def upload_status(
    upload_id: str,
    current_user: User = Depends(get_current_user),
):
    upload = await ContentUpload.get(upload_id)
    if not upload:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Upload not found")

    if not await _get_owned_project(upload.project_id, current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your upload")

    return UploadResponse.model_validate(upload)