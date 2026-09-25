"""
Providers Router
This file defines API endpoints for managing providers. It includes routes for listing, retrieving, creating, and deleting providers.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.crud import providers as crud
from app.database import get_db
from app.schemas.providers import Provider, ProviderCreate
from app.security.authorization import require_permission

router = APIRouter(prefix="/providers", tags=["providers"])


@router.get("", response_model=list[Provider])
def list_providers(
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("providers", "read")),
):
    return crud.list_providers(db)


@router.get("/{provider_id}", response_model=Provider)
def get_provider(
    provider_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("providers", "read")),
):
    provider = crud.get_provider(db, provider_id)
    if provider is None:
        raise HTTPException(status_code=404, detail="Provider not found")
    return provider


@router.post("", response_model=Provider, status_code=201)
def create_provider(
    provider: ProviderCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("providers", "create")),
):
    return crud.create_provider(db, provider)


@router.delete("/{provider_id}", status_code=204)
def delete_provider(
    provider_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("providers", "delete")),
):
    deleted = crud.delete_provider(db, provider_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Provider not found")
