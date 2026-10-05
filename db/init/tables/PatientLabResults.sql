IF OBJECT_ID(N'dbo.PatientLabResults', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.PatientLabResults (
        LabResultId INT IDENTITY(1,1) PRIMARY KEY,
        PatientId INT NOT NULL REFERENCES dbo.Patients(PatientId),
        TestName NVARCHAR(200) NOT NULL,
        Result NVARCHAR(200) NOT NULL,
        Unit NVARCHAR(50) NULL,
        Flag NVARCHAR(40) NULL,
        CollectedAt DATETIME2 NOT NULL
    );
END
GO
