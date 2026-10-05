IF OBJECT_ID(N'dbo.Encounters', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Encounters (
        EncounterId INT IDENTITY(1,1) PRIMARY KEY,
        PatientId INT NOT NULL REFERENCES dbo.Patients(PatientId),
        StartedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END
GO
