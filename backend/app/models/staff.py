'''
Staff Model
SQLAlchemy ORM class mapped to the dbo.Staff table.
Describes the table already in the database. Must be added in SQL server before declaring it here.

A Staff row is a person: name, role, discipline, and department. Students are
people too. user_id links to the person's account (dbo.Users) and is NULL for
people who cannot sign in.
'''

from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.departments import Department
from app.models.disciplines import Discipline
from app.models.roles import Role


# Role names, so code does not repeat the strings
ADMIN = "ADMIN"
FACULTY_INSTRUCTOR = "FACULTY_INSTRUCTOR"
STUDENT = "STUDENT"


class Staff(Base):
    __tablename__ = "Staff"
    __table_args__ = {"schema": "dbo"}

    staffid = Column("StaffId", Integer, primary_key=True, index=True)
    user_id = Column("UserId", Integer, ForeignKey("dbo.Users.UserId"), nullable=True)
    first_name = Column("FirstName", String(100), nullable=False)
    middle_name = Column("MiddleName", String(100), nullable=True)
    last_name = Column("LastName", String(100), nullable=False)
    role_id = Column("RoleId", Integer, ForeignKey("dbo.Roles.RoleId"), nullable=False)
    discipline_id = Column(
        "DisciplineId", Integer, ForeignKey("dbo.Disciplines.DisciplineId"), nullable=True
    )
    department_id = Column(
        "DepartmentId", Integer, ForeignKey("dbo.Departments.DepartmentId"), nullable=True
    )

    # Loaded with the row so responses can show names instead of ids
    role = relationship(Role, lazy="joined")
    discipline = relationship(Discipline, lazy="joined")
    department = relationship(Department, lazy="joined")

    @property
    def role_name(self) -> str | None:
        return self.role.role_name if self.role else None

    @property
    def discipline_name(self) -> str | None:
        return self.discipline.name if self.discipline else None

    @property
    def department_name(self) -> str | None:
        return self.department.name if self.department else None

    @property
    def department_code(self) -> str | None:
        return self.department.code if self.department else None

    @property
    def is_admin(self) -> bool:
        return self.role_name == ADMIN

    @property
    def is_instructor(self) -> bool:
        return self.role_name == FACULTY_INSTRUCTOR

    @property
    def is_student(self) -> bool:
        return self.role_name == STUDENT

    @property
    def full_name(self) -> str:
        return " ".join(
            part for part in (self.first_name, self.middle_name, self.last_name) if part
        )
