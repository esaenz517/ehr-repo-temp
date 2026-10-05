-- FAMILY HISTORY TABLE
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'FamilyHistory')
BEGIN
    CREATE TABLE dbo.FamilyHistory (
        FamilyHistoryId INT IDENTITY(1,1) PRIMARY KEY,
        PatientId       INT NOT NULL,
        Relationship    NVARCHAR(100) NOT NULL,
        Condition       NVARCHAR(200) NOT NULL,
        Notes           NVARCHAR(1000) NULL,

        CONSTRAINT FK_FamilyHistory_Patients
            FOREIGN KEY (PatientId)
            REFERENCES dbo.Patients(PatientId)
            ON DELETE CASCADE
    );
END
GO
