-- Case Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Cases')
BEGIN
    CREATE TABLE dbo.Cases (
        CaseId            INT IDENTITY(1,1) PRIMARY KEY,
        PatientId         INT NOT NULL REFERENCES dbo.Patients(PatientId),  -- the case's original patient
        ChiefComplaint    NVARCHAR(500)  NOT NULL,
        Narrative         NVARCHAR(4000) NULL,       -- "Case narrative / HPI seed"
        --SourceCaseId      INT NULL REFERENCES dbo.Cases(CaseId),  -- set when "Start from: Existing case"
        CreatedByStaffId  INT NOT NULL REFERENCES dbo.Staff(StaffId),
        CreatedAt         DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END
GO
