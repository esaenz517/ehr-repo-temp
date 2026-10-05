IF OBJECT_ID(N'dbo.PatientAllergies', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.PatientAllergies (
        AllergyId INT IDENTITY(1,1) PRIMARY KEY,
        PatientId INT NOT NULL REFERENCES dbo.Patients(PatientId),
        Substance NVARCHAR(200) NOT NULL,
        Reaction NVARCHAR(500) NULL
    );
END
GO
