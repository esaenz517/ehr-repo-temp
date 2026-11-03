"""
Drugs Router
This file defines API endpoints for managing drugs. It includes routes for listing, retrieving, creating, updating, and deleting drugs.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.crud import drugs as crud
from app.crud.drug_suggestions import suggest_drugs
from app.database import get_db
from app.schemas.drugs import Drug, DrugCreate, DrugUpdate
from app.security.authorization import require_permission

router = APIRouter(prefix="/drugs", tags=["drugs"])


@router.get("", response_model=list[Drug])
def list_drugs(
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("drug", "read")),
):
    return crud.list_drugs(db)


# Medication autocomplete: GET /drugs/suggest?q=metf -> ["Metformin", ...]
# Suggests any medication (not only ones saved in the Drugs table), best match first.
# Must be declared before /{drug_id} so "suggest" isn't read as a drug id.
@router.get("/suggest", response_model=list[str])
def suggest(
    q: str = Query(default="", max_length=100),
    limit: int = Query(default=10, ge=1, le=25),
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("drug", "read")),
):
    return suggest_drugs(db, q, limit)


@router.get("/{drug_id}", response_model=Drug)
def get_drug(
    drug_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("drug", "read")),
):
    drug = crud.get_drug(db, drug_id)
    if drug is None:
        raise HTTPException(status_code=404, detail="Drug not found")
    return drug


@router.post("", response_model=Drug, status_code=201)
def create_drug(
    drug: DrugCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("drug", "create")),
):
    return crud.create_drug(db, drug)


# Partial update, e.g. {"name": "Metformin ER"}.
@router.patch("/{drug_id}", response_model=Drug)
def update_drug(
    drug_id: int,
    changes: DrugUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("drug", "update")),
):
    drug = crud.update_drug(db, drug_id, changes)
    if drug is None:
        raise HTTPException(status_code=404, detail="Drug not found")
    return drug


@router.delete("/{drug_id}", status_code=204)
def delete_drug(
    drug_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("drug", "delete")),
):
    deleted = crud.delete_drug(db, drug_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Drug not found")
