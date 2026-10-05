-- MEDICAL HISTORY TABLE
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'MedicalHistory')
BEGIN
    CREATE TABLE dbo.MedicalHistory (
        MedicalHistoryId INT IDENTITY(1,1) PRIMARY KEY,
        PatientId        INT NOT NULL,
        Condition        NVARCHAR(200) NOT NULL,
        DiagnosisDate    DATE NULL,
        Notes            NVARCHAR(1000) NULL,

        CONSTRAINT FK_MedicalHistory_Patients
            FOREIGN KEY (PatientId)
            REFERENCES dbo.Patients(PatientId)
            ON DELETE CASCADE
);
END
GO
