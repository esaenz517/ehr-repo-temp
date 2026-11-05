'''
Login Model
SQLAlchemy ORM class mapped to the dbo.T_Login table.
Describes the table already in the database. Must be added in SQL server before declaring it here.

A username and password for an account. The person is found through the
account: dbo.Staff.UserId = userid.
'''

from sqlalchemy import ForeignKey, Column, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.staff import Staff

class Login(Base):
    __tablename__ = "T_Login"
    __table_args__ = {"schema": "dbo"}

    username = Column("username", String(254), nullable=False, primary_key=True)
    password_hash = Column("password_hash", String(100), nullable=False)
    userid = Column("userid", Integer, ForeignKey("dbo.Users.UserId"), nullable=False)

    # The person behind the account (read-only; the link is stored on Staff.UserId)
    staff = relationship(
        Staff,
        primaryjoin="foreign(Staff.user_id) == Login.userid",
        viewonly=True,
        uselist=False,
        lazy="joined",
    )

    @property
    def staffid(self) -> int | None:
        """StaffId of the signed-in person; cases and assignments refer to it."""
        return self.staff.staffid if self.staff else None
