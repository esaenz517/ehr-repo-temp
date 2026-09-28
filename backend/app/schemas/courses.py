from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, computed_field

class CourseBase(BaseModel):
    subject_code: str = Field(min_length=1, max_length=10)
    course_number: str = Field(min_length=1, max_length=10)
    title: str = Field(min_length=1, max_length=200)
    term: Literal["Fall", "Spring", "Summer"]
    term_year: int = Field(ge=2000, le=2100)
    is_active: bool = True
    
class CourseCreate(CourseBase):
    pass

class Course(CourseBase):
    course_id: int
    created_at: datetime

    # Display labels built from the stored fields, e.g. "PHAR 5310" and
    # "PHAR 5310 – Pharmacotherapy I (Fall 2026)". Not DB columns.
    @computed_field
    @property
    def short_label(self) -> str:
        return f"{self.subject_code} {self.course_number}"

    @computed_field
    @property
    def label(self) -> str:
        return f"{self.short_label} – {self.title} ({self.term} {self.term_year})"

    class Config:
        from_attributes = True
        
#Used for deactivating courses
class CourseUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    is_active: bool | None = None