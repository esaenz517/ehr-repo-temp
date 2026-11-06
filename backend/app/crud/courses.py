from sqlalchemy.orm import Session

from app.models.course_enrollments import CourseEnrollment
from app.models.courses import Course as CourseModel
from app.models.departments import Department
from app.models.staff import Staff
from app.schemas.courses import CourseCreate, CourseUpdate

# Gets courses from the DB. is_active=None returns all courses;
# True/False returns only active/deactivated ones. department_id and staffid
# narrow the list to one department or to the courses a person is enrolled in.
def list_courses(
    db: Session,
    is_active: bool | None = None,
    department_id: int | None = None,
    staffid: int | None = None,
):
    query = db.query(CourseModel)
    if is_active is not None:
        query = query.filter(CourseModel.is_active == is_active)
    if department_id is not None:
        query = query.filter(CourseModel.department_id == department_id)
    if staffid is not None:
        query = query.join(
            CourseEnrollment, CourseEnrollment.course_id == CourseModel.course_id
        ).filter(CourseEnrollment.staff_id == staffid)
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
        if value is None:
            continue  # every editable column is NOT NULL
        setattr(db_course, field, value)

    db.commit()
    db.refresh(db_course)
    return db_course



# True if the department exists; courses must belong to one.
def department_exists(db: Session, department_id: int) -> bool:
    return db.get(Department, department_id) is not None


# People enrolled in a course (students and the instructors who teach it).
def list_enrollments(db: Session, course_id: int):
    return (
        db.query(Staff)
        .join(CourseEnrollment, CourseEnrollment.staff_id == Staff.staffid)
        .filter(CourseEnrollment.course_id == course_id)
        .order_by(Staff.last_name, Staff.first_name)
        .all()
    )


# True if the person is enrolled in (or teaches) the course.
def is_enrolled(db: Session, course_id: int, staffid: int) -> bool:
    return (
        db.query(CourseEnrollment)
        .filter(
            CourseEnrollment.course_id == course_id,
            CourseEnrollment.staff_id == staffid,
        )
        .first()
        is not None
    )


# Adds a person to a course. Already enrolled is fine.
def enroll(db: Session, course_id: int, staffid: int) -> None:
    if not is_enrolled(db, course_id, staffid):
        db.add(CourseEnrollment(course_id=course_id, staff_id=staffid))
        db.commit()


# Adds several people to a course in one commit. People already enrolled are
# skipped, so sending the same list twice is fine. Returns how many were added.
def enroll_many(db: Session, course_id: int, staff_ids: list[int]) -> int:
    already = {
        staff_id
        for (staff_id,) in db.query(CourseEnrollment.staff_id).filter(
            CourseEnrollment.course_id == course_id,
            CourseEnrollment.staff_id.in_(staff_ids),
        )
    }
    to_add = [staff_id for staff_id in dict.fromkeys(staff_ids) if staff_id not in already]
    db.add_all(CourseEnrollment(course_id=course_id, staff_id=staff_id) for staff_id in to_add)
    db.commit()
    return len(to_add)


# The ids in staff_ids that don't belong to anyone.
def missing_staff_ids(db: Session, staff_ids: list[int]) -> set[int]:
    found = {staffid for (staffid,) in db.query(Staff.staffid).filter(Staff.staffid.in_(staff_ids))}
    return set(staff_ids) - found


# Removes a person from a course. Returns False if they were not enrolled.
def unenroll(db: Session, course_id: int, staffid: int) -> bool:
    enrollment = (
        db.query(CourseEnrollment)
        .filter(
            CourseEnrollment.course_id == course_id,
            CourseEnrollment.staff_id == staffid,
        )
        .first()
    )
    if enrollment is None:
        return False
    db.delete(enrollment)
    db.commit()
    return True
