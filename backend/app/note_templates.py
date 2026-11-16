"""
Note Templates
The single list of clinical note types: what fields each one has and the
security policy it carries. The API serves it at GET /note-templates, note
routes check content and access against it, and the frontend builds its
template dropdown from it.

Every note type gets the baseline rules that apply to all notes: role-based
access, an audit row for every view and change (the note access log),
and signed notes locked (changes only by dated addendum).
"""

# AI was utilized to assist in building this section to ensure compliance with HIPAA and other necessary privacy regulations.

from dataclasses import dataclass
from datetime import date
from typing import Any, Literal

# How sensitive a type's content is:
#   >baseline: default sensitivity (open)
#   >sensitive: information requires restricted access
#   >psychotherapy: only accessible by author
#   >part2: refers to 42 CFR (Code of Federal Regulation) part 2, for SUD notes. Sensitive info
#   is segmented, requires restricted access (non-sensitive info can be shared); 
#   disclosure of sensitive info requires consent
PrivacyClass = Literal["baseline", "sensitive", "psychotherapy", "part2"]

# Who may open a note of this type, on top of role permissions:
#   >standard: anyone whose role grants the note permission
#   >care_team: the matching discipline AND involvement with the patient
#   >author_only: only the person who wrote it
Access = Literal["standard", "care_team", "author_only"]

# Patient portal visibility:
#   >default: shown once signed 
#   >review: only after a clinician releases it
#   >never: excluded (psychotherapy notes are not part of the record set)
Portal = Literal["default", "review", "never"]

# How a field is entered and checked. Every value is stored as text:
#   >text / longtext: a line or a box of free text
#   >date: "YYYY-MM-DD"
#   >select: one of the field's options
FieldType = Literal["text", "longtext", "date", "select"]

# Longest text accepted in one field; matches what the editors allow.
MAX_FIELD_LENGTH = 20000


@dataclass(frozen=True)
class TemplateField:
    key: str
    label: str
    type: FieldType = "longtext"
    max_length: int = MAX_FIELD_LENGTH
    # Must be filled in before the note is signed or submitted (drafts may be blank)
    required: bool = False
    # The allowed values of a select field
    options: tuple[str, ...] = ()
    # Short guidance shown under the field in the editor
    hint: str | None = None

@dataclass(frozen=True)
class TemplateSection:
    title: str
    fields: tuple[TemplateField, ...]

@dataclass(frozen=True)
class NoteTemplate:
    id: str
    label: str
    enabled: bool
    privacy_class: PrivacyClass
    access: Access
    portal: Portal
    purpose: str
    regulatory_basis: str
    version: int = 1
    sections: tuple[TemplateSection, ...] = ()
    # Restricted types (mental health). Besides the role's ordinary note
    # permission, only people with an author discipline may open them, whatever
    # their role (admins included); access="author_only" narrows that to the
    # author. The assigning instructor reviews them through the assignment.
    restriction: str | None = None
    # Who may write it, by discipline code (dbo.Disciplines.Code, as on the Staff
    # tab). Empty = anyone; ANY_DISCIPLINE = anyone with a discipline (not "No discipline").
    author_disciplines: tuple[str, ...] = ()

    @property
    def field_keys(self) -> tuple[str, ...]:
        return tuple(f.key for s in self.sections for f in s.fields)

    def fields_by_key(self) -> dict[str, TemplateField]:
        return {f.key: f for s in self.sections for f in s.fields}

# author_disciplines value: any discipline, but not people with "No discipline"
ANY_DISCIPLINE = "*"


def may_author(template: "NoteTemplate", discipline_code: str | None) -> bool:
    """Whether someone with this discipline code (None = no discipline) may write the type."""
    if not template.author_disciplines:
        return True
    if discipline_code is None:
        return False
    return ANY_DISCIPLINE in template.author_disciplines or discipline_code in template.author_disciplines


def _longtext(key: str, label: str, *, required: bool = False, hint: str | None = None) -> TemplateField:
    return TemplateField(key=key, label=label, required=required, hint=hint)


def _text(key: str, label: str, *, required: bool = False, hint: str | None = None) -> TemplateField:
    return TemplateField(key=key, label=label, type="text", max_length=500, required=required, hint=hint)

SOAP = NoteTemplate(
    id="SOAP",
    label="SOAP note",
    enabled=True,
    privacy_class="baseline",
    access="standard",
    portal="default",
    purpose="General structure (Subjective, Objective, Assessment, Plan) for one encounter",
    regulatory_basis="HIPAA baseline; inherits Part 2 or psychotherapy-note rules when that content is present",
    sections=(
        TemplateSection(
            "Subjective",
            (
                TemplateField("chief_complaint", "Chief complaint", "text"),
                _longtext("hpi", "History of present illness"),
                _longtext("past_medical_history", "Past medical history"),
                _longtext("past_surgical_history", "Past surgical history"),
                _longtext("family_history", "Family history"),
                _longtext("social_history", "Social history"),
            ),
        ),
        TemplateSection("Objective", (_longtext("physical_exam", "Physical exam"),)),
        TemplateSection("Assessment", (_longtext("assessment", "Assessment"),)),
        TemplateSection("Plan", (_longtext("plan", "Plan"),)),
    ),
)

PROGRESS = NoteTemplate(
    id="PROGRESS",
    label="Progress Note",
    enabled=True,
    privacy_class="baseline",
    access="standard",
    portal="default",
    author_disciplines=(ANY_DISCIPLINE,),
    purpose="Tracks change over time and updates the plan",
    regulatory_basis="HIPAA baseline; state laws on HIV, genetic, reproductive and minor-consent information",
    sections=(
        TemplateSection(
            "Interval history",
            (
                _longtext(
                    "interval_history",
                    "Interval history",
                    required=True,
                    hint="What changed since the last note: symptoms, events, the patient's report.",
                ),
            ),
        ),
        TemplateSection(
            "Objective",
            (
                _longtext(
                    "objective",
                    "Vitals, exam and new results",
                    hint="Current vitals and exam findings, and any labs or imaging since the last note.",
                ),
            ),
        ),
        TemplateSection("Assessment", (_longtext("assessment", "Assessment", required=True),)),
        TemplateSection("Plan", (_longtext("plan", "Plan", required=True),)),
    ),
)

NURSING_SHIFT = NoteTemplate(
    id="NURSING_SHIFT",
    label="Nursing Shift Note",
    enabled=True,
    privacy_class="baseline",
    access="standard",
    portal="default",
    author_disciplines=("NURSE",),
    purpose="Continuity between shifts; documents care given and status",
    regulatory_basis="HIPAA baseline; state nursing practice acts; CMS Conditions of Participation",
    sections=(
        TemplateSection(
            "Assessment by system",
            (
                _longtext("neuro", "Neurological"),
                _longtext("cardiovascular", "Cardiovascular"),
                _longtext("respiratory", "Respiratory"),
                _longtext("gi_gu", "GI / GU"),
                _longtext("skin", "Skin and wounds"),
            ),
        ),
        TemplateSection(
            "Pain",
            (
                TemplateField(
                    "pain_score",
                    "Pain score (0-10)",
                    "select",
                    20,
                    options=("Not assessed",) + tuple(str(n) for n in range(11)),
                ),
                _longtext("pain_notes", "Location, character and response to treatment"),
            ),
        ),
        TemplateSection(
            "Care given",
            (
                _longtext("interventions", "Interventions", required=True),
                _longtext("intake_output", "Intake and output"),
                _longtext("response_education", "Patient response and education"),
            ),
        ),
        TemplateSection(
            "Handoff (SBAR)",
            (
                _longtext("sbar_situation", "Situation"),
                _longtext("sbar_background", "Background"),
                _longtext("sbar_assessment", "Assessment"),
                _longtext("sbar_recommendation", "Recommendation"),
            ),
        ),
    ),
)

PT_ASSESSMENT = NoteTemplate(
    id="PT_ASSESSMENT",
    label="PT Assessment",
    enabled=True,
    privacy_class="baseline",
    access="standard",
    portal="default",
    author_disciplines=("PHYSICAL_THERAPY",),
    purpose="Functional baseline, measurable goals, plan of care",
    regulatory_basis="HIPAA baseline; 45 CFR 164.512(l) for workers' compensation disclosures",
    sections=(
        TemplateSection(
            "Referral",
            (
                _longtext("referral_reason", "Reason for referral", required=True),
                _longtext("prior_function", "Prior level of function"),
            ),
        ),
        TemplateSection(
            "Subjective",
            (_longtext("subjective", "Patient report", hint="Pain, goals, and what the patient finds hard to do."),),
        ),
        TemplateSection(
            "Objective",
            (
                _longtext("range_of_motion", "Range of motion"),
                _longtext("strength", "Strength (MMT)"),
                _longtext("balance", "Balance"),
                _longtext("gait", "Gait and mobility"),
                _longtext("special_tests", "Special tests"),
            ),
        ),
        TemplateSection("Assessment", (_longtext("assessment", "Assessment", required=True),)),
        TemplateSection(
            "Goals",
            (
                _longtext("short_term_goals", "Short-term goals", required=True, hint="Measurable, with a target date."),
                _longtext("long_term_goals", "Long-term goals", required=True, hint="Measurable, with a target date."),
            ),
        ),
        TemplateSection(
            "Plan of care",
            (
                _text("frequency_duration", "Frequency and duration", required=True, hint="e.g. 3 times a week for 6 weeks"),
                _longtext("planned_interventions", "Planned interventions"),
            ),
        ),
    ),
)

PSYCHIATRY = NoteTemplate(
    id="PSYCHIATRY",
    label="Psychiatry Note",
    enabled=True,
    privacy_class="sensitive",
    access="care_team",
    portal="review",
    restriction="PSYCHIATRY",
    author_disciplines=("PSYCHIATRY",),
    purpose="Psychiatric diagnosis, mental status exam, risk assessment, medication management",
    regulatory_basis="HIPAA baseline; state mental health confidentiality laws (Texas Health & Safety Code ch. 611); 45 CFR 164.524(a)(3)",
    sections=(
        TemplateSection(
            "Reason for visit",
            (
                _text("chief_complaint", "Chief complaint", required=True, hint="In the patient's own words."),
                _longtext("hpi", "History of present illness"),
            ),
        ),
        TemplateSection(
            "History",
            (
                _longtext("psychiatric_history", "Past psychiatric history", hint="Diagnoses, hospitalizations, past medications and therapy."),
                _longtext("substance_use", "Substance use"),
                _longtext("social_history", "Social history", hint="Living situation, supports, work or school, legal issues."),
            ),
        ),
        TemplateSection(
            "Mental status exam",
            (
                _longtext("appearance_behavior", "Appearance and behavior"),
                _text("speech", "Speech"),
                _text("mood", "Mood", hint="The patient's description, in quotes."),
                _text("affect", "Affect", hint="What you observe: range, congruence with mood."),
                _longtext("thought_process", "Thought process"),
                _longtext("thought_content", "Thought content", hint="Including suicidal or homicidal ideation, delusions, obsessions."),
                _text("perception", "Perception", hint="Hallucinations or none reported."),
                _text("cognition", "Cognition"),
                _text("insight", "Insight"),
                _text("judgment", "Judgment"),
            ),
        ),
        TemplateSection(
            "Risk assessment",
            (
                TemplateField(
                    "suicide_risk",
                    "Suicide risk",
                    "select",
                    20,
                    required=True,
                    options=("Low", "Moderate", "High"),
                ),
                TemplateField(
                    "violence_risk",
                    "Risk of harm to others",
                    "select",
                    20,
                    required=True,
                    options=("Low", "Moderate", "High"),
                ),
                _longtext("risk_factors", "Risk and protective factors"),
                _longtext("safety_plan", "Safety plan", hint="Required in practice when risk is moderate or high."),
            ),
        ),
        TemplateSection(
            "Assessment",
            (_longtext("assessment", "Diagnosis and formulation", required=True),),
        ),
        TemplateSection(
            "Plan",
            (
                _longtext("medications", "Medications", hint="Started, changed or stopped, with the reason."),
                _longtext("therapy_referrals", "Therapy and referrals"),
                _longtext("follow_up", "Follow-up", required=True),
            ),
        ),
    ),
)

PSYCHOTHERAPY = NoteTemplate(
    id="PSYCHOTHERAPY",
    label="Psychotherapy Note (process note)",
    enabled=True,
    privacy_class="psychotherapy",
    access="author_only",
    portal="never",
    restriction="PSYCHOTHERAPY",
    author_disciplines=("PSYCHIATRY",),
    purpose="Therapist's private analysis of session content",
    regulatory_basis="HIPAA 45 CFR 164.501, 164.508(a)(2), 164.524(a)(1)(i); excluded from EHI (45 CFR Part 171)",
    # HIPAA's definition excludes medications, session times, test results,
    # diagnosis, treatment plan and progress; those go in the psychiatry note.
    sections=(
        TemplateSection(
            "Session",
            (
                TemplateField("session_date", "Session date", "date", 10, required=True),
            ),
        ),
        TemplateSection(
            "Process notes",
            (
                _longtext(
                    "session_content",
                    "Session content and process",
                    required=True,
                    hint="Your private analysis of the conversation. Diagnosis, medications and the treatment plan belong in the Psychiatry Note.",
                ),
                _longtext("impressions", "Impressions and hypotheses"),
                _longtext("next_session", "To explore next session"),
            ),
        ),
    ),
)

DISCHARGE = NoteTemplate(
    id="DISCHARGE",
    label="Discharge Summary",
    enabled=True,
    privacy_class="baseline",
    access="standard",
    portal="default",
    author_disciplines=(ANY_DISCIPLINE,),
    purpose="Hand-off to outpatient care; legal summary of the stay",
    regulatory_basis="HIPAA baseline; 42 CFR Part 2 when SUD program records are included; state sensitive-data laws",
    sections=(
        TemplateSection(
            "Stay",
            (
                TemplateField("admission_date", "Admission date", "date", 10, required=True),
                TemplateField("discharge_date", "Discharge date", "date", 10, required=True),
            ),
        ),
        TemplateSection(
            "Diagnoses",
            (
                _longtext("admitting_diagnosis", "Admitting diagnosis", required=True),
                _longtext("discharge_diagnoses", "Discharge diagnoses", required=True),
            ),
        ),
        TemplateSection(
            "Hospital course",
            (
                _longtext("hospital_course", "Hospital course", required=True),
                _longtext("procedures", "Procedures"),
            ),
        ),
        TemplateSection(
            "At discharge",
            (
                TemplateField(
                    "discharge_condition",
                    "Condition at discharge",
                    "select",
                    20,
                    required=True,
                    options=("Improved", "Stable", "Unchanged", "Worse"),
                ),
                _longtext(
                    "medication_reconciliation",
                    "Medication reconciliation",
                    required=True,
                    hint="Medications started, changed and stopped, and the final list.",
                ),
                _longtext("follow_up", "Follow-up appointments", required=True),
                _longtext("patient_instructions", "Patient instructions", required=True),
                _longtext("pending_results", "Results pending at discharge"),
            ),
        ),
    ),
)

SUD_PART2 = NoteTemplate(
    id="SUD_PART2",
    label="SUD Treatment Note (Part 2 program)",
    enabled=True,
    privacy_class="part2",
    access="care_team",
    portal="default",  # patients may see their own records; disclosure needs consent
    restriction="PART2",
    author_disciplines=("PSYCHIATRY",),  # all mental health notes are psychiatry
    purpose="Substance use disorder treatment documentation",
    regulatory_basis="42 CFR Part 2 (2024 final rule); HIPAA",
    sections=(
        TemplateSection(
            "Substance use",
            (
                _longtext("substances", "Substances used", required=True, hint="Each substance, with amount, frequency and route."),
                _text("last_use", "Last use"),
                _longtext("withdrawal", "Withdrawal symptoms"),
                _longtext("use_history", "History of use and prior treatment"),
            ),
        ),
        TemplateSection(
            "Assessment",
            (
                TemplateField(
                    "severity",
                    "Use disorder severity",
                    "select",
                    20,
                    required=True,
                    options=("Mild", "Moderate", "Severe"),
                ),
                TemplateField(
                    "readiness",
                    "Readiness to change",
                    "select",
                    20,
                    options=("Precontemplation", "Contemplation", "Preparation", "Action", "Maintenance"),
                ),
                _longtext("assessment", "Assessment", required=True),
            ),
        ),
        TemplateSection(
            "Treatment",
            (
                _longtext("treatment_plan", "Treatment plan", required=True),
                _longtext("medications", "Medications for the use disorder"),
                _longtext("counseling", "Counseling and support groups"),
                _longtext("follow_up", "Follow-up", required=True),
            ),
        ),
    ),
)

OTHER = NoteTemplate(
    id="OTHER",
    label="Other discipline-defined template",
    enabled=False,
    privacy_class="baseline",  # each template must be classified before go-live
    access="standard",
    portal="default",
    purpose="Captures each discipline's required elements",
    regulatory_basis="HIPAA baseline plus any discipline-specific federal or state law",
)

TEMPLATES: dict[str, NoteTemplate] = {
    t.id: t
    for t in (
        SOAP,
        PROGRESS,
        NURSING_SHIFT,
        PT_ASSESSMENT,
        PSYCHIATRY,
        PSYCHOTHERAPY,
        DISCHARGE,
        SUD_PART2,
        OTHER,
    )
}

def get_template(note_type: str | None) -> NoteTemplate | None:
    return TEMPLATES.get(note_type or "")

class ContentError(ValueError):
    """Note content that doesn't fit its template (unknown field, wrong type, too long)."""

def clean_content(template: NoteTemplate, content: Any) -> dict[str, str]:
    """Checks note content against its template and returns it with every field
    present, in template order."""
    if not isinstance(content, dict):
        raise ContentError("Note content must be an object of fields")

    fields = template.fields_by_key()

    unknown = sorted(set(content) - set(fields))
    if unknown:
        raise ContentError(
            f"Unknown field(s) for a {template.label}: {', '.join(unknown)}"
        )

    cleaned: dict[str, str] = {}
    for key, spec in fields.items():
        value = content.get(key, "")
        if value is None:
            value = ""
        if not isinstance(value, str):
            raise ContentError(f"{spec.label} must be text")
        if len(value) > spec.max_length:
            raise ContentError(
                f"{spec.label} is longer than {spec.max_length} characters"
            )
        if value:
            _check_format(spec, value)
        cleaned[key] = value

    return cleaned


def _check_format(spec: TemplateField, value: str) -> None:
    """Dates, date-times and select values must be well formed (blank is fine)."""
    if spec.type == "date":
        try:
            date.fromisoformat(value)
        except ValueError:
            raise ContentError(f"{spec.label} must be a date (YYYY-MM-DD)")
    elif spec.type == "select" and value not in spec.options:
        raise ContentError(f"{spec.label} must be one of: {', '.join(spec.options)}")


def missing_required(template: NoteTemplate, content: dict) -> list[str]:
    """Labels of the fields that must be filled in before the note is submitted."""
    return [
        f.label
        for s in template.sections
        for f in s.fields
        if f.required and not str(content.get(f.key) or "").strip()
    ]

def template_summary(template: NoteTemplate) -> dict[str, Any]:
    """What GET /note-templates returns for one template."""
    return {
        "id": template.id,
        "label": template.label,
        "enabled": template.enabled,
        "version": template.version,
        "privacy_class": template.privacy_class,
        "access": template.access,
        "portal": template.portal,
        "author_disciplines": list(template.author_disciplines),
        "purpose": template.purpose,
        "regulatory_basis": template.regulatory_basis,
        "sections": [
            {
                "title": s.title,
                "fields": [
                    {
                        "key": f.key,
                        "label": f.label,
                        "type": f.type,
                        "max_length": f.max_length,
                        "required": f.required,
                        "options": list(f.options),
                        "hint": f.hint,
                    }
                    for f in s.fields
                ],
            }
            for s in template.sections
        ],
    }