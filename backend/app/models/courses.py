from sqlalchemy import Boolean, Column, DateTime, Integer, String
from sqlalchemy.sql import func

from app.database import Base

class Course(Base):
   __tablename__ = "Courses"
   __table_args__ = {"schema": "dbo"}
   
   course_id     = Column("CourseId", Integer, primary_key=True, index=True)
   subject_code  = Column("SubjectCode", String(10), nullable=False)
   course_number = Column("CourseNumber", String(10), nullable=False)
   title         = Column("Title", String(200), nullable=False)
   term          = Column("Term", String(10), nullable=False)
   term_year     = Column("TermYear", Integer, nullable=False)
   is_active     = Column("IsActive", Boolean, nullable=False, server_default="1")
   created_at    = Column("CreatedAt", DateTime, nullable=False, server_default=func.sysutcdatetime())