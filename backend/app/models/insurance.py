from sqlalchemy import CheckConstraint, Column, Date, ForeignKey, Integer, String

from app.database import Base


class PatientInsurance(Base):
    __tablename__ = "PatientInsurance"
    __table_args__ = (
        CheckConstraint(
            "CoverageStartDate IS NULL OR CoverageEndDate IS NULL "
            "OR CoverageEndDate >= CoverageStartDate",
            name="CK_PatientInsurance_CoverageDates",
        ),
        {"schema": "dbo"},
    )

    insurance_id = Column("InsuranceId", Integer, primary_key=True, index=True)

    patient_id = Column(
        "PatientId",
        Integer,
        ForeignKey("dbo.Patients.PatientId"),
        nullable=False,
    )

    insurance_company = Column("InsuranceCompany", String(150), nullable=False)
    member_id = Column("MemberId", String(100), nullable=False)
    group_number = Column("GroupNumber", String(100), nullable=True)

    policyholder_name = Column("PolicyholderName", String(200), nullable=False)
    policyholder_date_of_birth = Column(
        "PolicyholderDateOfBirth", Date, nullable=True
    )

    insurance_priority = Column("InsurancePriority", String(20), nullable=False)

    coverage_start_date = Column("CoverageStartDate", Date, nullable=True)
    coverage_end_date = Column("CoverageEndDate", Date, nullable=True)

    verification_status = Column(
        "VerificationStatus",
        String(30),
        nullable=False,
        default="unverified",
    )
