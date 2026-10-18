"""
Batch Students Router
Provides CSV preview and student batch creation.
"""

import csv
import io

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.crud.batch_students import run_batch
from app.database import get_db

from app.schemas.batch_students import (
    StudentBatchRequest,
    StudentBatchResult,
    StudentBatchRow,
    StudentSingleCreate,
)

from app.security.authorization import require_permission

router = APIRouter(
    prefix="/staff",
    tags=["staff"],
)


@router.post(
    "/batch",
    response_model=StudentBatchResult,
)
def batch_students(
    request: StudentBatchRequest,
    db: Session = Depends(get_db),
    staff_permission=Depends(require_permission("staff", "create")),
    user_permission=Depends(require_permission("user", "create")),
    role_permission=Depends(require_permission("user", "manage_roles")),
):
    return run_batch(
        db,
        request.csv_text,
        request.validate_only,
    )


@router.post(
    "/student",
    response_model=StudentBatchRow,
    status_code=201,
)
def create_single_student(
    student: StudentSingleCreate,
    db: Session = Depends(get_db),
    staff_permission=Depends(require_permission("staff", "create")),
    user_permission=Depends(require_permission("user", "create")),
    role_permission=Depends(require_permission("user", "manage_roles")),
):
    """
    Creates one student using the existing batch creation logic.
    """

    # Convert the submitted student into a single CSV row.
    # csv.writer handles commas, quotes, and escaping.
    output = io.StringIO(newline="")
    writer = csv.writer(output)

    writer.writerow(
        [
            "FirstName",
            "MiddleName",
            "LastName",
            "Specialization",
            "Email",
            "Username",
        ]
    )

    writer.writerow(
        [
            student.first_name,
            student.middle_name or "",
            student.last_name,
            student.specialization,
            student.email,
            student.username or "",
        ]
    )

    result = run_batch(
        db=db,
        csv_text=output.getvalue(),
        validate_only=False,
    )

    row = result.rows[0]

    if row.status == "existing":
        raise HTTPException(
            status_code=409,
            detail=row.message,
        )

    if row.status == "invalid":
        raise HTTPException(
            status_code=422,
            detail=row.message,
        )

    if row.status != "created":
        raise HTTPException(
            status_code=500,
            detail="Student account could not be created",
        )

    return row
