from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base
from app.models.departments import Department

class Course(Base):
   __tablename__ = "Courses"
   __table_args__ = {"schema": "dbo"}

   course_id     = Column("CourseId", Integer, primary_key=True, index=True)
   subject_code  = Column("SubjectCode", String(10), nullable=False)
   course_number = Column("CourseNumber", String(10), nullable=False)
   title         = Column("Title", String(200), nullable=False)
   term          = Column("Term", String(10), nullable=False)
   term_year     = Column("TermYear", Integer, nullable=False)
   department_id = Column("DepartmentId", Integer, ForeignKey("dbo.Departments.DepartmentId"), nullable=False)
   is_active     = Column("IsActive", Boolean, nullable=False, server_default="1")
   created_at    = Column("CreatedAt", DateTime, nullable=False, server_default=func.sysutcdatetime())

   department = relationship(Department, lazy="joined")

   @property
   def department_name(self) -> str | None:
      return self.department.name if self.department else None

   @property
   def short_label(self) -> str:
      """How the course is shown on an assignment, e.g. "NURS 3310"."""
      return f"{self.subject_code} {self.course_number}"
