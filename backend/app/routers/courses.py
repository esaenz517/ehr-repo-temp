from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.crud import courses as crud
from app.schemas.courses import Course, CourseCreate, CourseUpdate
from app.database import get_db

router = APIRouter(prefix="/courses", tags=["courses"])

# is_active omitted returns all courses; true/false filters to active/deactivated.
@router.get("", response_model=list[Course])
def list_courses(is_active: bool | None = None, db: Session = Depends(get_db)):
    return crud.list_courses(db, is_active)


@router.get("/{course_id}", response_model=Course)
def get_course(course_id: int, db: Session = Depends(get_db)):
    course = crud.get_course(db, course_id)
    if course is None:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


@router.post("", response_model=Course, status_code=201)
def create_course(course: CourseCreate, db: Session = Depends(get_db)):
    try:
        return crud.create_course(db, course)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="This course already exists for that term")


# Partial update, e.g. {"is_active": false} to deactivate a course.
@router.patch("/{course_id}", response_model=Course)
def update_course(course_id: int, changes: CourseUpdate, db: Session = Depends(get_db)):
    course = crud.update_course(db, course_id, changes)
    if course is None:
        raise HTTPException(status_code=404, detail="Course not found")
    return course
