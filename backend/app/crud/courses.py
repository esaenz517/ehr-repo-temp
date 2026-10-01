from sqlalchemy.orm import Session

from app.models.courses import Course as CourseModel
from app.schemas.courses import CourseCreate, CourseUpdate

# Gets courses from the DB. is_active=None returns all courses;
# True/False returns only active/deactivated ones.
def list_courses(db: Session, is_active: bool | None = None):
    query = db.query(CourseModel)
    if is_active is not None:
        query = query.filter(CourseModel.is_active == is_active)
    return query.order_by(
        CourseModel.term_year.desc(),
        CourseModel.subject_code,
        CourseModel.course_number,
    ).all()


# Gets one course by id, or None if it doesn't exist.
def get_course(db: Session, course_id: int):
    return db.query(CourseModel).filter(CourseModel.course_id == course_id).first()


# Inserts a new course and returns it (with its new id and created_at).
# Raises IntegrityError if the same course already exists for that term.
def create_course(db: Session, course: CourseCreate):
    db_course = CourseModel(**course.model_dump())
    db.add(db_course)
    db.commit()
    db.refresh(db_course)
    return db_course


# Updates only the fields the client sent. Returns None if the course doesn't exist.
def update_course(db: Session, course_id: int, changes: CourseUpdate):
    db_course = get_course(db, course_id) #Check if course exists

    if db_course is None:
        return None

    for field, value in changes.model_dump(exclude_unset=True).items():
        setattr(db_course, field, value)

    db.commit()
    db.refresh(db_course)
    return db_course
