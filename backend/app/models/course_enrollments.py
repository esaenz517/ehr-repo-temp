"""
Course Enrollments Model
SQLAlchemy ORM class mapped to the dbo.CourseEnrollments table.
Who is in which course offering: students and the instructors who teach it.
"""

from sqlalchemy import Column, DateTime, ForeignKey, Integer
from sqlalchemy.sql import func

from app.database import Base


class CourseEnrollment(Base):
    __tablename__ = "CourseEnrollments"
    __table_args__ = {"schema": "dbo"}

    course_id = Column(
        "CourseId", Integer, ForeignKey("dbo.Courses.CourseId"), primary_key=True
    )
    staff_id = Column(
        "StaffId", Integer, ForeignKey("dbo.Staff.StaffId"), primary_key=True
    )
    enrolled_at = Column(
        "EnrolledAt", DateTime, nullable=False, server_default=func.sysutcdatetime()
    )
