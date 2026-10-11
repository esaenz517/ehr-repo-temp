-- PATIENTS TABLE
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Patients')
BEGIN
    CREATE TABLE dbo.Patients (
        PatientId           INT IDENTITY(1,1) PRIMARY KEY,
        Mrn                 NVARCHAR(20)  NULL, -- medical record number (unique when present; see index below)
        FirstName           NVARCHAR(100) NOT NULL,
        MiddleName          NVARCHAR(100) NULL,
        LastName            NVARCHAR(100) NOT NULL,
        PreferredName       NVARCHAR(50)  NULL,
        DateOfBirth         DATE          NOT NULL,
        GenderAtBirth       NVARCHAR(20)  NOT NULL,
        GenderIdentity      NVARCHAR(20)  NOT NULL,
        Pronouns            NVARCHAR(20)  NOT NULL,
        Status              NVARCHAR(20)  NOT NULL DEFAULT 'outpatient'
                            CHECK (Status IN ('outpatient', 'inpatient')),
        ProviderId          INT           NULL REFERENCES dbo.Providers(ProviderId) -- patient's medical provider
    );
END
GO

-- MRN must be unique when present, but many patients may have none.
-- (A plain UNIQUE constraint would allow only one NULL.)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'UX_Patients_Mrn')
BEGIN
    CREATE UNIQUE INDEX UX_Patients_Mrn ON dbo.Patients (Mrn) WHERE Mrn IS NOT NULL;
END
GO

-- Upgrade older Patients tables to the current patient demographic schema.

IF COL_LENGTH('dbo.Patients', 'PreferredName') IS NULL
BEGIN
    ALTER TABLE dbo.Patients
    ADD PreferredName NVARCHAR(50) NULL;
END
GO

IF COL_LENGTH('dbo.Patients', 'GenderAtBirth') IS NULL
BEGIN
    ALTER TABLE dbo.Patients
    ADD GenderAtBirth NVARCHAR(20) NULL;
END
GO

IF COL_LENGTH('dbo.Patients', 'GenderIdentity') IS NULL
BEGIN
    ALTER TABLE dbo.Patients
    ADD GenderIdentity NVARCHAR(20) NULL;
END
GO

IF COL_LENGTH('dbo.Patients', 'Pronouns') IS NULL
BEGIN
    ALTER TABLE dbo.Patients
    ADD Pronouns NVARCHAR(20) NULL;
END
GO

-- Backfill demographic fields for patients created under the older schema.
-- These fields are required by the current Patient API response.

UPDATE dbo.Patients
SET GenderAtBirth = N'Unknown'
WHERE GenderAtBirth IS NULL;
GO

UPDATE dbo.Patients
SET GenderIdentity = N'Unknown'
WHERE GenderIdentity IS NULL;
GO

UPDATE dbo.Patients
SET Pronouns = N'Unspecified'
WHERE Pronouns IS NULL;
GO

-- Bring upgraded databases in line with the current fresh-install schema.
ALTER TABLE dbo.Patients
ALTER COLUMN GenderAtBirth NVARCHAR(20) NOT NULL;
GO

ALTER TABLE dbo.Patients
ALTER COLUMN GenderIdentity NVARCHAR(20) NOT NULL;
GO

ALTER TABLE dbo.Patients
ALTER COLUMN Pronouns NVARCHAR(20) NOT NULL;
GO

-- Add ProviderId (and its FK) to a Patients table created before this relationship existed.
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Patients') AND name = 'ProviderId')
BEGIN
    ALTER TABLE dbo.Patients ADD ProviderId INT NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Patients_Providers')
BEGIN
    ALTER TABLE dbo.Patients
        ADD CONSTRAINT FK_Patients_Providers FOREIGN KEY (ProviderId) REFERENCES dbo.Providers(ProviderId);
END
GO

-- PATIENTS DATA
IF NOT EXISTS (SELECT * FROM dbo.Patients)
BEGIN
    INSERT INTO dbo.Patients (Mrn, FirstName, MiddleName, LastName, PreferredName, DateOfBirth, GenderAtBirth, GenderIdentity, Pronouns, Status, ProviderId) VALUES
        ('MRN000001', 'James',    'Robert',   'Carter',     'Jim',  '1984-03-12', 'Male',   'Man',       'he/him',    'outpatient', 1),
        ('MRN000002', 'Maria',    'Elena',    'Gonzalez',   NULL,   '1992-07-25', 'Female', 'Woman',     'she/her',   'inpatient',  2),
        ('MRN000003', 'David',    NULL,       'Nguyen',     NULL,   '1978-11-02', 'Male',   'Man',       'he/him',    'outpatient', 1),
        ('MRN000004', 'Sarah',    'Jane',     'Thompson',   'Sam',  '2001-01-19', 'Female', 'Nonbinary', 'they/them', 'outpatient', 3),
        ('MRN000005', 'Michael',  'A',        'Johnson',    'Mike', '1965-09-30', 'Male',   'Man',       'he/him',    'inpatient',  2),
        ('MRN000006', 'Aisha',    NULL,       'Patel',      NULL,   '1989-05-14', 'Female', 'Woman',     'she/her',   'outpatient', 3);
END
GO
