'''
Deleiton Audit Schemas
Request shapes for reporting a deletion the user cancelled in the browser
'''

from pydantic import BaseModel, Field

class DeletionCancelled(BaseModel):
    # API path the Delete button would have called, such as "/patients/12"
    path: str = Field(min_length=1, max_length=500, pattern=r"^/")
    # What the user saw in the confirmation, such as "patient Jane Doe"
    label: str | None = Field(default=None, max_length=500)