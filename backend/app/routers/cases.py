from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.crud import cases as crud
from app.database import get_db
from app.schemas.cases import Case, CaseCreate
from app.security.authorization import require_permission
from app.note_templates import get_template

router = APIRouter(prefix="/cases", tags=["cases"])


@router.get("", response_model=list[Case])
def list_cases(
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("case", "read")),
):
    return crud.list_cases(db)


@router.get("/{case_id}", response_model=Case)
def get_case(
    case_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("case", "read")),
):
    case = crud.get_case(db, case_id)

    if case is None:
        raise HTTPException(status_code=404, detail="Case not found")

    return case


@router.post("", response_model=Case, status_code=201)
def create_case(
    case: CaseCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("case", "create")),
):
    template = get_template(case.note_type)
    if template is None or not template.enabled:
        raise HTTPException(
            status_code=422,
            detail=f"Note type {case.note_type} is not available",
        )
    return crud.create_case(db, case)


@router.delete("/{case_id}", status_code=204)
def delete_case(
    case_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("case", "delete")),
):
    deleted = crud.delete_case(db, case_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Case not found")
