from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from app.security.authorization import require_permission
from app.security.current_user import get_current_login

from app.crud import courses as crud
from app.crud import staff as staff_crud
from app.models.login import Login
from app.schemas.courses import Course, CourseCreate, CourseUpdate, EnrollmentBatch, EnrollmentBatchResult
from app.schemas.staff import Staff
from app.database import get_db

router = APIRouter(prefix="/courses", tags=["courses"])

# is_active omitted returns all courses; true/false filters to active/deactivated.
# department_id narrows to one department.
@router.get("", response_model=list[Course])
def list_courses(
    is_active: bool | None = None,
    department_id: int | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("course", "read")),
):
    return crud.list_courses(db, is_active, department_id=department_id)


# The courses the signed-in person is enrolled in or teaches. Any signed-in
# person may ask, students included (they have no course.read).
@router.get("/mine", response_model=list[Course])
def my_courses(
    db: Session = Depends(get_db),
    login: Login = Depends(get_current_login),
):
    if login.staffid is None:
        return []
    return crud.list_courses(db, staffid=login.staffid)


@router.get("/{course_id}", response_model=Course)
def get_course(course_id: int, db: Session = Depends(get_db), current_user=Depends(require_permission("course", "read"))):
    course = crud.get_course(db, course_id)
    if course is None:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


@router.post("", response_model=Course, status_code=201)
def create_course(course: CourseCreate, db: Session = Depends(get_db), current_user=Depends(require_permission("course", "create"))):
    if not crud.department_exists(db, course.department_id):
        raise HTTPException(status_code=400, detail="Unknown department")
    try:
        return crud.create_course(db, course)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="This course already exists for that term")


# Partial update, e.g. {"is_active": false} to deactivate a course.
@router.patch("/{course_id}", response_model=Course)
def update_course(course_id: int, changes: CourseUpdate, db: Session = Depends(get_db), current_user=Depends(require_permission("course", "update"))):
    if changes.department_id is not None and not crud.department_exists(db, changes.department_id):
        raise HTTPException(status_code=400, detail="Unknown department")
    course = crud.update_course(db, course_id, changes)
    if course is None:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


# ENROLLMENTS: students in a course and the instructors who teach it
@router.get("/{course_id}/enrollments", response_model=list[Staff])
def list_enrollments(course_id: int, db: Session = Depends(get_db), current_user=Depends(require_permission("course", "read"))):
    if crud.get_course(db, course_id) is None:
        raise HTTPException(status_code=404, detail="Course not found")
    return crud.list_enrollments(db, course_id)


# Adds several people at once. Every id must exist or nothing is added.
@router.post("/{course_id}/enrollments", response_model=EnrollmentBatchResult)
def enroll_many(course_id: int, batch: EnrollmentBatch, db: Session = Depends(get_db), current_user=Depends(require_permission("course", "update"))):
    if crud.get_course(db, course_id) is None:
        raise HTTPException(status_code=404, detail="Course not found")
    missing = crud.missing_staff_ids(db, batch.staff_ids)
    if missing:
        raise HTTPException(status_code=404, detail=f"Staff members not found: {sorted(missing)}")
    return EnrollmentBatchResult(added=crud.enroll_many(db, course_id, batch.staff_ids))


@router.post("/{course_id}/enrollments/{staffid}", status_code=204)
def enroll(course_id: int, staffid: int, db: Session = Depends(get_db), current_user=Depends(require_permission("course", "update"))):
    if crud.get_course(db, course_id) is None:
        raise HTTPException(status_code=404, detail="Course not found")
    if staff_crud.get_staff(db, staffid) is None:
        raise HTTPException(status_code=404, detail="Staff member not found")
    crud.enroll(db, course_id, staffid)


@router.delete("/{course_id}/enrollments/{staffid}", status_code=204)
def unenroll(course_id: int, staffid: int, db: Session = Depends(get_db), current_user=Depends(require_permission("course", "update"))):
    if not crud.unenroll(db, course_id, staffid):
        raise HTTPException(status_code=404, detail="Enrollment not found")
