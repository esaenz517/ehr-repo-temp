'''
Drugs Router
This file defines API endpoints for managing drugs. It includes routes for listing, retrieving, creating, and deleting drugs.
'''

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.crud import drugs as crud
from app.database import get_db
from app.schemas.drugs import Drug, DrugCreate

router = APIRouter(prefix="/drugs", tags=["drugs"])


@router.get("", response_model=list[Drug])
def list_drugs(db: Session = Depends(get_db)):
    return crud.list_drugs(db)


@router.get("/{drug_id}", response_model=Drug)
def get_drug(drug_id: int, db: Session = Depends(get_db)):
    drug = crud.get_drug(db, drug_id)
    if drug is None:
        raise HTTPException(status_code=404, detail="Drug not found")
    return drug


@router.post("", response_model=Drug, status_code=201)
def create_drug(drug: DrugCreate, db: Session = Depends(get_db)):
    return crud.create_drug(db, drug)


@router.delete("/{drug_id}", status_code=204)
def delete_drug(drug_id: int, db: Session = Depends(get_db)):
    deleted = crud.delete_drug(db, drug_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Drug not found")
