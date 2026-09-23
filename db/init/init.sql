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
                     CHECK (Status IN ('outpatient', 'inpatient'))
    );
END
GO
-- PATIENTS DATA
IF NOT EXISTS (SELECT * FROM dbo.Patients)
BEGIN
    INSERT INTO dbo.Patients (Mrn, FirstName, MiddleName, LastName, DateOfBirth, Gender, Status) VALUES
        ('MRN000001', 'James',    'Robert',   'Carter',     '1984-03-12', 'Male',        'outpatient'),
        ('MRN000002', 'Maria',    'Elena',    'Gonzalez',   '1992-07-25', 'Female',      'inpatient'),
        ('MRN000003', 'David',    NULL,       'Nguyen',     '1978-11-02', 'Male',        'outpatient'),
        ('MRN000004', 'Sarah',    'Jane',     'Thompson',   '2001-01-19', 'Female',      'outpatient'),
        ('MRN000005', 'Michael',  'A',        'Johnson',    '1965-09-30', 'Male',        'inpatient'),
        ('MRN000006', 'Aisha',    NULL,       'Patel',      '1989-05-14', 'Female',      'outpatient');
END
GO

-- ROOMS TABLE
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Rooms')
BEGIN
    CREATE TABLE dbo.Rooms (
        RoomId      INT IDENTITY(1,1) PRIMARY KEY,
        RoomNumber  INT  NOT NULL UNIQUE,
        Unit        NVARCHAR(100)  NULL, --Verify requirements to see the units that will be used
        --RoomType    NVARCHAR(100)  NULL, --Verify requirements to see how to label rooms types based on inpatient or outpatient
        Status       NVARCHAR(20)  NOT NULL DEFAULT 'available'
                     CHECK (Status IN ('available', 'occupied'))
    );
END
GO

-- ROOMS DATA
IF NOT EXISTS (SELECT * FROM dbo.Rooms)
BEGIN
    INSERT INTO dbo.Rooms (RoomNumber, Unit, Status) VALUES
        ('100', 'General',    'available'),
        ('101', 'General',    'available'),
        ('102', 'ICU',        'available'),
        ('103', 'ICU',        'available'),
        ('104', 'Pediatrics', 'available'),
        ('105', 'Pediatrics', 'available');
END
GO

-- ROOM ASSIGNMENTS TABLE (Auditing Purposes, might discard later) (No seed data for the moment)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'RoomAssignments')
BEGIN
    CREATE TABLE dbo.RoomAssignments (
        AssignmentId INT IDENTITY(1,1) PRIMARY KEY,
        RoomId       INT NOT NULL REFERENCES dbo.Rooms(RoomId), --Foreign key to Rooms table
        PatientId    INT NOT NULL REFERENCES dbo.Patients(PatientId), --Foreign key to Patients table
        AssignedAt   DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        DischargedAt DATETIME2 NULL, --NULL means patient is still assigned to the room
    );
END 
GO