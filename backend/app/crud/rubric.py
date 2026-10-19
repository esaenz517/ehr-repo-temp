'''
Rubric CRUD
DB access for case rubric items and assignment scores
'''

from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.assignment import Assignment as AssignmentModel
from app.models.rubric import AssignmentRubricScore, CaseRubricItem
from app.schemas.rubric import RubricItemCreate, RubricScoreInput

# Adds a new case's rubric item
def add_items(db: Session, case_id: int, items: list[RubricItemCreate]):
    for order,item in enumerate(items):
        db.add(CaseRubricItem(
            case_id = case_id,
            category = item.category,
            label = item.label,
            points = item.points,
            guidance = (item.guidance or "").strip() or None,
            sort_order = order,
        ))

# Lists a case's rubric items
def list_items(db: Session, case_id: int):
    return(
        db.query(CaseRubricItem)
        .filter(CaseRubricItem.case_id == case_id)
        .order_by(CaseRubricItem.sort_order, CaseRubricItem.rubric_item_id)
        .all()
    )

# One assignment's scores
def scores_for(db: Session, assignment_id: int):
    rows = (
        db.query(AssignmentRubricScore)
        .filter(AssignmentRubricScore.assignment_id == assignment_id)
        .all()
    )
    return {row.rubric_item_id: row for row in rows}

# Rubric with assignment scores filled in
def grade(db: Session, row: AssignmentModel, include_guidance: bool):
    items = list_items(db, row.case_id)
    scores = scores_for(db, row.assignment_id)
    lines = []
    for item in items:
        score = scores.get(item.rubric_item_id)
        lines.append({
            "rubric_item_id": item.rubric_item_id,
            "category": item.category,
            "label": item.label,
            "points": item.points,
            "guidance": item.guidance if include_guidance else None,
            "points_awarded": score.points_awarded if score else None,
            "comment": score.comment if score else None,
        })
    return{
        "assignment_id": row.assignment_id,
        "released": True,
        "items": lines,
        "total_points": sum(item.points for item in items),
        "points_awarded": sum(line["points_awarded"] or 0 for line in lines),
        "scored_count": sum(1 for line in lines if line["points_awarded"] is not None),
    }

# Returns true when every rubric item is scored on an assigned case, or when there is no rubric
def fully_scored(db: Session, row: AssignmentModel):
    item_ids = {item.rubric_item_id for item in list_items(db, row.case_id)}
    return item_ids <= set(scores_for(db, row.assignment_id))

#Saves scores for an assignment
def save_scores(db: Session, row: AssignmentModel, scores: list[RubricScoreInput]):
    items = {item.rubric_item_id: item for item in list_items(db, row.case_id)}
    existing = scores_for(db, row.assignment_id)
    now = datetime.now(timezone.utc).replace(tzinfo = None)

    for score in scores:
        item = items.get(score.rubric_item_id)
        if item is None:
            return f"Rubric item {score.rubric_item_id} is not part of this case"
        if score.points_awarded > item.points:
            return f"'{item.label}' is worth at most {item.points} points"
    
    for score in scores:
        comment = (score.comment or "").strip() or None
        current = existing.get(score.rubric_item_id)
        if current is None:
            db.add(AssignmentRubricScore(
                assignment_id = row.assignment_id,
                rubric_item_id = score.rubric_item_id,
                points_awarded = score.points_awarded,
                comment = comment,
                scored_at = now,
            ))
        else:
            current.points_awarded = score.points_awarded
            current.comment = comment
            current.scored_at = now
    db.commit()
    return None

# Remove assignment scores
def delete_scores(db: Session, assignment_id: int):
    db.query(AssignmentRubricScore).filter(AssignmentRubricScore.assignment_id == assignment_id).delete()



