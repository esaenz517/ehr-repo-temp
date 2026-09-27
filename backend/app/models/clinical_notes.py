"""Clinical documentation and patient chart context mapped to SQL Server tables."""

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    UnicodeText,
)

from app.database import Base


class Encounter(Base):
    __tablename__ = "Encounters"
    __table_args__ = {"schema": "dbo"}

    encounter_id = Column("EncounterId", Integer, primary_key=True)
    patient_id = Column(
        "PatientId",
        Integer,
        ForeignKey("dbo.Patients.PatientId"),
        nullable=False,
    )
    started_at = Column("StartedAt", DateTime, nullable=False)


class PatientAllergy(Base):
    __tablename__ = "PatientAllergies"
    __table_args__ = {"schema": "dbo"}

    allergy_id = Column("AllergyId", Integer, primary_key=True)
    patient_id = Column(
        "PatientId",
        Integer,
        ForeignKey("dbo.Patients.PatientId"),
        nullable=False,
    )
    substance = Column("Substance", String(200), nullable=False)
    reaction = Column("Reaction", String(500))


class PatientVital(Base):
    __tablename__ = "PatientVitals"
    __table_args__ = {"schema": "dbo"}

    vital_id = Column("VitalId", Integer, primary_key=True)
    patient_id = Column(
        "PatientId",
        Integer,
        ForeignKey("dbo.Patients.PatientId"),
        nullable=False,
    )
    recorded_at = Column("RecordedAt", DateTime, nullable=False)
    blood_pressure = Column("BloodPressure", String(40))
    heart_rate = Column("HeartRate", Integer)
    respiratory_rate = Column("RespiratoryRate", Integer)
    temperature_c = Column("TemperatureC", Numeric(5, 2))
    oxygen_saturation = Column("OxygenSaturation", Numeric(5, 2))
    height_cm = Column("HeightCm", Numeric(7, 2))
    weight_kg = Column("WeightKg", Numeric(7, 2))


class PatientLabResult(Base):
    __tablename__ = "PatientLabResults"
    __table_args__ = {"schema": "dbo"}

    lab_result_id = Column("LabResultId", Integer, primary_key=True)
    patient_id = Column(
        "PatientId",
        Integer,
        ForeignKey("dbo.Patients.PatientId"),
        nullable=False,
    )
    test_name = Column("TestName", String(200), nullable=False)
    result = Column("Result", String(200), nullable=False)
    unit = Column("Unit", String(50))
    flag = Column("Flag", String(40))
    collected_at = Column("CollectedAt", DateTime, nullable=False)


class ClinicalNote(Base):
    __tablename__ = "ClinicalNotes"
    __table_args__ = {"schema": "dbo"}

    note_id = Column("NoteId", Integer, primary_key=True)
    patient_id = Column(
        "PatientId",
        Integer,
        ForeignKey("dbo.Patients.PatientId"),
        nullable=False,
    )
    encounter_id = Column(
        "EncounterId",
        Integer,
        ForeignKey("dbo.Encounters.EncounterId"),
        nullable=False,
    )
    note_type = Column("NoteType", String(100), nullable=False)
    discipline = Column("Discipline", String(100))
    author_user_id = Column(
        "AuthorUserId",
        Integer,
        ForeignKey("dbo.Users.UserId"),
        nullable=False,
    )
    responsible_provider_id = Column(
        "ResponsibleProviderId",
        Integer,
        ForeignKey("dbo.Providers.ProviderId"),
    )
    created_at = Column("CreatedAt", DateTime, nullable=False)
    last_modified_at = Column("LastModifiedAt", DateTime, nullable=False)
    content = Column("Content", UnicodeText, nullable=False)
    sensitivity_classification = Column(
        "SensitivityClassification",
        String(40),
        nullable=False,
    )
    current_version = Column("CurrentVersion", Integer, nullable=False)
    is_archived = Column("IsArchived", Boolean, nullable=False)


class NoteVersion(Base):
    __tablename__ = "NoteVersions"
    __table_args__ = {"schema": "dbo"}

    version_id = Column("VersionId", Integer, primary_key=True)
    note_id = Column(
        "NoteId",
        Integer,
        ForeignKey("dbo.ClinicalNotes.NoteId"),
        nullable=False,
    )
    version_number = Column("VersionNumber", Integer, nullable=False)
    content_snapshot = Column("ContentSnapshot", UnicodeText, nullable=False)
    author_user_id = Column(
        "AuthorUserId",
        Integer,
        ForeignKey("dbo.Users.UserId"),
        nullable=False,
    )
    created_at = Column("CreatedAt", DateTime, nullable=False)
    change_summary = Column("ChangeSummary", String(500))
