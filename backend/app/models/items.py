'''
Items Model
SQLAlchemy ORM class mapped to the dbo.Items table.
Describes the table already in the database. Must be added in SQL server before declaring it here.
Use this file as a template to implement the model for a new feature/resource.
'''

from sqlalchemy import Column, DateTime, Integer, String
from sqlalchemy.sql import func

from app.database import Base


class Item(Base):
    __tablename__ = "Items"
    __table_args__ = {"schema": "dbo"}

    id = Column("Id", Integer, primary_key=True, index=True)
    name = Column("Name", String(200), nullable=False)
    description = Column("Description", String(1000), nullable=True)
    created_at = Column("CreatedAt", DateTime, server_default=func.sysutcdatetime())
