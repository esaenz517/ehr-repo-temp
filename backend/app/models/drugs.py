'''
Drugs Model
SQLAlchemy ORM class mapped to the dbo.Drugs table.
'''

from sqlalchemy import Column, Integer, String

from app.database import Base


class Drug(Base):
    __tablename__ = "Drugs"
    __table_args__ = {"schema": "dbo"}

    drug_id = Column("DrugId", Integer, primary_key=True, index=True)
    name = Column("Name", String(200), nullable=False)
    description = Column("Description", String(1000), nullable=True)
