'''
Rooms Model
SQLAlchemy ORM class mapped to the dbo.Rooms table.
'''

from sqlalchemy import Column, Integer, String
from app.database import Base

class Room(Base):
    __tablename__ = "Rooms"
    __table_args__ = {"schema": "dbo"}

    room_id = Column("RoomId", Integer, primary_key=True, index=True)
    room_number = Column("RoomNumber", Integer, unique=True, nullable=False)
    room_type = Column("RoomType", String(50), nullable=False)
    unit = Column("Unit", String(100), nullable=True)
    status = Column("Status", String(20), nullable=False, default="available")