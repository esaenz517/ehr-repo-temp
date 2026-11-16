"""
Note Template Schemas
Response shapes for GET /note-templates (see app/note_templates.py).
"""

from pydantic import BaseModel


class TemplateFieldOut(BaseModel):
    key: str
    label: str
    type: str
    max_length: int
    required: bool = False
    options: list[str] = []
    hint: str | None = None

class TemplateSectionOut(BaseModel):
    title: str
    fields: list[TemplateFieldOut]


class NoteTemplateOut(BaseModel):
    id: str
    label: str
    enabled: bool
    version: int
    privacy_class: str
    access: str
    portal: str
    author_disciplines: list[str]
    purpose: str
    regulatory_basis: str
    sections: list[TemplateSectionOut]
