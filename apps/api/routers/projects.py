from fastapi import APIRouter, Depends, HTTPException, status

from apps.api.core.security import get_current_user
from apps.api.models.database import (
    ContentScore,
    ContentUpload,
    Project,
    User,
    utcnow,
)
from apps.api.models.schemas import (
    ProjectCreate,
    ProjectDetailResponse,
    ProjectMetadataUpdate,
    ProjectResponse,
    ScoreResponse,
    UploadResponse,
)

router = APIRouter(prefix="/projects", tags=["projects"])


async def _get_owned_project(project_id: str, user: User) -> Project:
    project = await Project.get(project_id)
    if not project or project.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    body: ProjectCreate,
    current_user: User = Depends(get_current_user),
):
    project = Project(
        user_id=current_user.id,
        name=body.name,
        description=body.description,
        target_platform=body.target_platform,
        target_audience=body.target_audience,
    )
    await project.insert()
    return ProjectResponse.model_validate(project)


@router.get("/", response_model=list[ProjectResponse])
async def list_projects(
    current_user: User = Depends(get_current_user),
):
    projects = (
        await Project.find(Project.user_id == current_user.id)
        .sort(-Project.updated_at)
        .to_list()
    )
    return [ProjectResponse.model_validate(p) for p in projects]


@router.get("/{project_id}", response_model=ProjectDetailResponse)
async def get_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
):
    project = await _get_owned_project(project_id, current_user)
    uploads = await ContentUpload.find(ContentUpload.project_id == project.id).to_list()
    scores = (
        await ContentScore.find(ContentScore.project_id == project.id)
        .sort(-ContentScore.scored_at)
        .to_list()
    )

    detail = ProjectResponse.model_validate(project).model_dump()
    detail["uploads"] = [UploadResponse.model_validate(u) for u in uploads]
    detail["scores"] = [ScoreResponse.model_validate(s) for s in scores]
    return ProjectDetailResponse(**detail)


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    body: ProjectCreate,
    current_user: User = Depends(get_current_user),
):
    project = await _get_owned_project(project_id, current_user)
    project.name = body.name
    project.description = body.description
    project.target_platform = body.target_platform
    project.target_audience = body.target_audience
    project.updated_at = utcnow()
    await project.save()
    return ProjectResponse.model_validate(project)


@router.patch("/{project_id}", response_model=ProjectResponse)
async def patch_project_metadata(
    project_id: str,
    body: ProjectMetadataUpdate,
    current_user: User = Depends(get_current_user),
):
    project = await _get_owned_project(project_id, current_user)
    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(project, field, value)
    project.updated_at = utcnow()
    await project.save()
    return ProjectResponse.model_validate(project)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
):
    project = await _get_owned_project(project_id, current_user)
    # No cascade in MongoDB — delete children explicitly.
    await ContentUpload.find(ContentUpload.project_id == project.id).delete()
    await ContentScore.find(ContentScore.project_id == project.id).delete()
    await project.delete()