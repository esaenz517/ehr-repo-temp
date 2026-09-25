'''
Login Model
SQLAlchemy ORM class mapped to the dbo.T_Login table.
Describes the table already in the database. Must be added in SQL server before declaring it here.
'''

from sqlalchemy import ForeignKey, Column, Integer, String

from app.database import Base

class Login(Base):
    __tablename__ = "T_Login"
    __table_args__ = {"schema": "dbo"}

    username = Column("username", String(254), nullable=False, primary_key=True)
    password_hash = Column("password_hash", String(100), nullable=False)
    staffid = Column("staffid", Integer, ForeignKey("dbo.Staff.StaffId"), nullable=False)