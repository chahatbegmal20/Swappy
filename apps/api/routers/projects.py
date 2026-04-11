from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from apps.api.core.database import get_db
from apps.api.core.security import get_current_user
from apps.api.models.database import Project, User
from apps.api.models.schemas import (
    ProjectCreate,
    ProjectDetailResponse,
    ProjectMetadataUpdate,
    ProjectResponse,
)

router = APIRouter(prefix="/projects", tags=["projects"])


async def _get_owned_project(project_id: str, user: User, db: AsyncSession) -> Project:
    result = await db.execute(
        select(Project)
        .options(selectinload(Project.uploads), selectinload(Project.scores))
        .where(Project.id == project_id, Project.user_id == user.id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    body: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project = Project(
        user_id=current_user.id,
        name=body.name,
        description=body.description,
        target_platform=body.target_platform,
        target_audience=body.target_audience,
    )
    db.add(project)
    await db.flush()
    await db.refresh(project)
    return ProjectResponse.model_validate(project)


@router.get("/", response_model=list[ProjectResponse])
async def list_projects(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Project)
        .where(Project.user_id == current_user.id)
        .order_by(Project.updated_at.desc())
    )
    return [ProjectResponse.model_validate(p) for p in result.scalars().all()]


@router.get("/{project_id}", response_model=ProjectDetailResponse)
async def get_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project = await _get_owned_project(project_id, current_user, db)
    return ProjectDetailResponse.model_validate(project)


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    body: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project = await _get_owned_project(project_id, current_user, db)
    project.name = body.name
    project.description = body.description
    project.target_platform = body.target_platform
    project.target_audience = body.target_audience
    await db.flush()
    await db.refresh(project)
    return ProjectResponse.model_validate(project)


@router.patch("/{project_id}", response_model=ProjectResponse)
async def patch_project_metadata(
    project_id: str,
    body: ProjectMetadataUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project = await _get_owned_project(project_id, current_user, db)
    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(project, field, value)
    await db.flush()
    await db.refresh(project)
    return ProjectResponse.model_validate(project)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project = await _get_owned_project(project_id, current_user, db)
    await db.delete(project)
