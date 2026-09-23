'''
Providers Model
SQLAlchemy ORM class mapped to the dbo.Providers table.
'''

from sqlalchemy import Column, Integer, String

from app.database import Base


class Provider(Base):
    __tablename__ = "Providers"
    __table_args__ = {"schema": "dbo"}

    provider_id = Column("ProviderId", Integer, primary_key=True, index=True)
    first_name = Column("FirstName", String(100), nullable=False)
    last_name = Column("LastName", String(100), nullable=False)
    specialty = Column("Specialty", String(100), nullable=True)
    phone = Column("Phone", String(20), nullable=True)
    email = Column("Email", String(200), nullable=True)
