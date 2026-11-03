
IF NOT EXISTS (
    SELECT 1 FROM sys.tables
    WHERE object_id = OBJECT_ID(N'dbo.PatientInsurance')
)
BEGIN
    CREATE TABLE dbo.PatientInsurance (
        InsuranceId INT IDENTITY(1,1) PRIMARY KEY,

        PatientId INT NOT NULL,

        InsuranceCompany NVARCHAR(150) NOT NULL,
        MemberId NVARCHAR(100) NOT NULL,
        GroupNumber NVARCHAR(100) NULL,

        PolicyholderName NVARCHAR(200) NOT NULL,
        PolicyholderDateOfBirth DATE NULL,

        InsurancePriority NVARCHAR(20) NOT NULL
            CHECK (InsurancePriority IN ('primary', 'secondary')),

        CoverageStartDate DATE NULL,
        CoverageEndDate DATE NULL,

        VerificationStatus NVARCHAR(30) NOT NULL
            DEFAULT 'unverified'
            CHECK (VerificationStatus IN (
                'unverified',
                'verified_active',
                'verified_inactive',
                'unable_to_verify'
            )),

        CONSTRAINT FK_PatientInsurance_Patients
            FOREIGN KEY (PatientId)
            REFERENCES dbo.Patients(PatientId),

        CONSTRAINT CK_PatientInsurance_CoverageDates
            CHECK (
                CoverageStartDate IS NULL
                OR CoverageEndDate IS NULL
                OR CoverageEndDate >= CoverageStartDate
            )
    );
END
GO
