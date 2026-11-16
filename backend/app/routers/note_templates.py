"""
Note Templates Router
Lists every clinical note type with its fields and security policy, so the
frontend can build its template dropdown and editors from one source.
"""

from fastapi import APIRouter, Depends

from app.note_templates import TEMPLATES, template_summary
from app.schemas.note_templates import NoteTemplateOut
from app.security.current_user import get_current_user

router = APIRouter(prefix="/note-templates", tags=["note-templates"])


# Any signed-in staff member; the list holds no patient data.
@router.get("", response_model=list[NoteTemplateOut])
def list_note_templates(user=Depends(get_current_user)):
    return [template_summary(t) for t in TEMPLATES.values()]