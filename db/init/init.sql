-- Creates the application database, a sample table, and seed data.
-- Run automatically by the `db-init` container in docker-compose once
-- SQL Server reports healthy. You can also open this in SSMS by connecting
-- to localhost,1433 with user "sa" and the password from docker-compose.yml.

-- App-facing login (used by backend/CloudBeaver instead of sa).
-- CHECK_POLICY = OFF because SQL Server's default password policy requires
-- 8+ chars from 3+ character classes, which the dev password doesn't meet.
IF NOT EXISTS (SELECT name FROM sys.server_principals WHERE name = N'dev')
BEGIN
    CREATE LOGIN dev WITH PASSWORD = N'dev123', CHECK_POLICY = OFF;
END
GO

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'AppDb')
BEGIN
    CREATE DATABASE AppDb;
END
GO

USE AppDb;
GO

IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = N'dev')
BEGIN
    CREATE USER dev FOR LOGIN dev;
    ALTER ROLE db_owner ADD MEMBER dev;
END
GO

-- ITEMS TABLE (TEMPLATE)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Items')
BEGIN
    CREATE TABLE dbo.Items (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Name NVARCHAR(200) NOT NULL,
        Description NVARCHAR(1000) NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END
GO

IF NOT EXISTS (SELECT * FROM dbo.Items)
BEGIN
    INSERT INTO dbo.Items (Name, Description) VALUES
        (N'First Item', N'This row was seeded by init.sql'),
        (N'Second Item', N'Edit db/init/init.sql to change seed data');
END
GO

-- PROVIDERS TABLE (a patient's medical provider)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Providers')
BEGIN
    CREATE TABLE dbo.Providers (
        ProviderId INT IDENTITY(1,1) PRIMARY KEY,
        FirstName  NVARCHAR(100) NOT NULL,
        LastName   NVARCHAR(100) NOT NULL,
        Specialty  NVARCHAR(100) NULL,
        Phone      NVARCHAR(20)  NULL,
        Email      NVARCHAR(200) NULL
    );
END
GO

IF NOT EXISTS (SELECT * FROM dbo.Providers)
BEGIN
    INSERT INTO dbo.Providers (FirstName, LastName, Specialty, Phone, Email) VALUES
        ('Susan', 'Lee',     'Cardiology',        '555-0101', 'susan.lee@clinic.example'),
        ('Mark',  'Feldman', 'Internal Medicine', '555-0102', 'mark.feldman@clinic.example'),
        ('Priya', 'Rao',     'Pediatrics',        '555-0103', 'priya.rao@clinic.example');
END
GO

-- DRUGS TABLE (catalog of drugs that can be prescribed to patients)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Drugs')
BEGIN
    CREATE TABLE dbo.Drugs (
        DrugId      INT IDENTITY(1,1) PRIMARY KEY,
        Name        NVARCHAR(200) NOT NULL,
        Description NVARCHAR(1000) NULL
    );
END
GO

IF NOT EXISTS (SELECT * FROM dbo.Drugs)
BEGIN
    INSERT INTO dbo.Drugs (Name, Description) VALUES
        (N'Lisinopril',   N'ACE inhibitor used to treat high blood pressure'),
        (N'Metformin',    N'Used to control blood sugar in type 2 diabetes'),
        (N'Atorvastatin', N'Statin used to lower cholesterol'),
        (N'Albuterol',    N'Bronchodilator used to treat asthma'),
        (N'Amoxicillin',  N'Penicillin-type antibiotic');
END
GO

-- PATIENTS TABLE
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Patients')
BEGIN
    CREATE TABLE dbo.Patients (
        PatientId    INT IDENTITY(1,1) PRIMARY KEY,
        Mrn          NVARCHAR(20)  NULL UNIQUE, -- medical record number
        FirstName    NVARCHAR(100) NOT NULL,
        MiddleName   NVARCHAR(100) NULL,
        LastName     NVARCHAR(100) NOT NULL,
        DateOfBirth  DATE          NOT NULL,
        Gender       NVARCHAR(20)  NULL,
        Status       NVARCHAR(20)  NOT NULL DEFAULT 'outpatient'
                     CHECK (Status IN ('outpatient', 'inpatient')),
        ProviderId   INT           NULL REFERENCES dbo.Providers(ProviderId) -- patient's medical provider
    );
END
GO

-- STAFF TABLE
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Staff')
BEGIN
    CREATE TABLE dbo.Staff (
        StaffId    INT IDENTITY(1,1) PRIMARY KEY,
        FirstName    NVARCHAR(100) NOT NULL,
        MiddleName   NVARCHAR(100) NULL,
        LastName     NVARCHAR(100) NOT NULL,
        Specialization  NVARCHAR(100) NOT NULL,
        Student      BIT  NOT NULL DEFAULT 1,
        Admin        BIT  NOT NULL DEFAULT 0,
    );
END
GO

-- T_LOGIN TABLE
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'T_Login')
BEGIN
    CREATE TABLE dbo.T_Login (
        username    NVARCHAR(254) NOT NULL PRIMARY KEY,
        password_hash NVARCHAR(100) NOT NULL,
        staffid     INT           NOT NULL UNIQUE REFERENCES dbo.Staff(StaffId),
    );
END
GO

-- DEV LOGIN SEED: Staff member plus login "dev" / "dev123"
IF NOT EXISTS (SELECT * FROM dbo.T_Login WHERE username = N'dev')
BEGIN
    INSERT INTO dbo.Staff (FirstName, MiddleName, LastName, Specialization, Student, Admin)
    VALUES (N'Dev', NULL, N'User', N'Development', 0, 1)

    INSERT INTO dbo.T_Login (username, password_hash, staffid)
    VALUES (N'Dev', N'$2b$12$JiMOYxRva65eUaBh74GGfeyJTmACdFGT8zCuYfpyy7SfT7NjNkLt.', SCOPE_IDENTITY());
END
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

IF NOT EXISTS (SELECT * FROM dbo.Patients)
BEGIN
    INSERT INTO dbo.Patients (Mrn, FirstName, MiddleName, LastName, DateOfBirth, Gender, Status, ProviderId) VALUES
        ('MRN000001', 'James',    'Robert',   'Carter',     '1984-03-12', 'Male',        'outpatient', 1),
        ('MRN000002', 'Maria',    'Elena',    'Gonzalez',   '1992-07-25', 'Female',      'inpatient',  2),
        ('MRN000003', 'David',    NULL,       'Nguyen',     '1978-11-02', 'Male',        'outpatient', 1),
        ('MRN000004', 'Sarah',    'Jane',     'Thompson',   '2001-01-19', 'Female',      'outpatient', 3),
        ('MRN000005', 'Michael',  'A',        'Johnson',    '1965-09-30', 'Male',        'inpatient',  2),
        ('MRN000006', 'Aisha',    NULL,       'Patel',      '1989-05-14', 'Female',      'outpatient', 3);
END
GO

-- PATIENT DRUGS TABLE (many-to-many: the drugs a patient may take)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PatientDrugs')
BEGIN
    CREATE TABLE dbo.PatientDrugs (
        PatientId INT NOT NULL REFERENCES dbo.Patients(PatientId) ON DELETE CASCADE,
        DrugId    INT NOT NULL REFERENCES dbo.Drugs(DrugId) ON DELETE CASCADE,
        Dosage    NVARCHAR(100) NULL,
        CONSTRAINT PK_PatientDrugs PRIMARY KEY (PatientId, DrugId)
    );
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