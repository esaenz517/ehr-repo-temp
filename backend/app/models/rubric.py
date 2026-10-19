'''
Rubric Model
SQLAlchemy ORM class mapped to the dbo.CaseRubricItems and dbo.AssignmentRubricScores.
Describes the table already in the database. Must be added in SQL server before declaring it here.
'''

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.sql import func

from app.database import Base


# One gradable marker on a case
class CaseRubricItem(Base):
    __tablename__ = "CaseRubricItems"
    __table_args__ = {"schema": "dbo"}

    rubric_item_id = Column("RubricItemId", Integer, primary_key = True)
    case_id = Column("CaseId", Integer, ForeignKey("dbo.Cases.CaseId"), nullable = False)
    category = Column("Category", String(30), nullable = False, server_default = "other")
    label = Column("Label", String(300), nullable = False)
    points = Column("Points", Integer, nullable = False)
    guidance = Column("Guidance", String(1000), nullable = True)
    sort_order = Column("SortOrder", Integer, nullable = False, server_default = "0")

# Points one student scores on one rubric item
class AssignmentRubricScore(Base):
    __tablename__ = "AssignmentRubricScores"
    __table_args__ = {"schema": "dbo"}

    assignment_id = Column("AssignmentId", Integer, ForeignKey("dbo.Assignment.AssignmentId"), primary_key = True)
    rubric_item_id = Column("RubricItemId", Integer, ForeignKey("dbo.CaseRubricItems.RubricItemId"), primary_key = True)
    points_awarded = Column("PointsAwarded", Integer, nullable = False)
    comment = Column("Comment", String(1000), nullable = True)
    scored_at = Column("ScoredAt", DateTime, nullable = False, server_default = func.sysutcdatetime())
