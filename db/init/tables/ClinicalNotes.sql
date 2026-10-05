-- The note type and sensitivity belong to the note, never to the patient.
-- Keep note types open for future editors; the API currently accepts SOAP only.
IF OBJECT_ID(N'dbo.ClinicalNotes', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ClinicalNotes (
        NoteId INT IDENTITY(1,1) PRIMARY KEY,
        PatientId INT NOT NULL REFERENCES dbo.Patients(PatientId),
        EncounterId INT NOT NULL REFERENCES dbo.Encounters(EncounterId),
        NoteType NVARCHAR(100) NOT NULL,
        Discipline NVARCHAR(100) NULL,
        AuthorUserId INT NOT NULL REFERENCES dbo.Users(UserId),
        ResponsibleProviderId INT NULL REFERENCES dbo.Providers(ProviderId),
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        LastModifiedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        Content NVARCHAR(MAX) NOT NULL,
        SensitivityClassification NVARCHAR(40) NOT NULL DEFAULT 'general',
        CurrentVersion INT NOT NULL DEFAULT 1,
        IsArchived BIT NOT NULL DEFAULT 0,
        CONSTRAINT CK_ClinicalNotes_Sensitivity
            CHECK (SensitivityClassification IN ('general', 'restricted')),
        CONSTRAINT CK_ClinicalNotes_Version
            CHECK (CurrentVersion >= 1)
    );

    CREATE INDEX IX_ClinicalNotes_Patient
        ON dbo.ClinicalNotes(PatientId, EncounterId);
END
GO
