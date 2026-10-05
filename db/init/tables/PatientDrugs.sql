-- PATIENT DRUGS TABLE (many-to-many: the drugs a patient may take)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PatientDrugs')
BEGIN
    CREATE TABLE dbo.PatientDrugs (
        PatientId INT NOT NULL REFERENCES dbo.Patients(PatientId) ON DELETE CASCADE,
        DrugId    INT NOT NULL REFERENCES dbo.Drugs(DrugId) ON DELETE CASCADE,
        Dosage    NVARCHAR(100) NULL,
        Route     NVARCHAR(20) NULL,
        Frequency NVARCHAR(50) NULL,
        CONSTRAINT PK_PatientDrugs PRIMARY KEY (PatientId, DrugId)
    );
END
GO

IF COL_LENGTH('dbo.PatientDrugs', 'Dosage') IS NULL
BEGIN
    ALTER TABLE dbo.PatientDrugs
    ADD Dosage NVARCHAR(100) NULL
END
GO

IF COL_LENGTH('dbo.PatientDrugs', 'Route') IS NULL
BEGIN
    ALTER TABLE dbo.PatientDrugs
    ADD Route NVARCHAR(20) NULL
END
GO

IF COL_LENGTH('dbo.PatientDrugs', 'Frequency') IS NULL
BEGIN
    ALTER TABLE dbo.PatientDrugs
    ADD Frequency NVARCHAR(50) NULL
END
GO

-- Seed data below assumes a fresh database where the patients/drugs above got ids 1-6 / 1-5.
IF NOT EXISTS (SELECT * FROM dbo.PatientDrugs)
BEGIN
    INSERT INTO dbo.PatientDrugs (PatientId, DrugId, Dosage) VALUES
        (1, 1, N'10mg daily'),
        (1, 3, N'20mg nightly'),
        (2, 2, N'500mg twice daily'),
        (4, 4, N'2 puffs as needed'),
        (5, 1, N'10mg daily'),
        (5, 2, N'500mg twice daily'),
        (6, 3, N'20mg nightly');
END
GO
