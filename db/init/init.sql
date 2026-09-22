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

-- USERS
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
BEGIN
    CREATE TABLE dbo.Users (
        UserId INT IDENTITY(1,1) PRIMARY KEY,
        Name NVARCHAR(200) NOT NULL,
        Email NVARCHAR(320) NOT NULL UNIQUE,
        PasswordHash NVARCHAR(500) NULL,
        AccountStatus NVARCHAR(20) NOT NULL DEFAULT 'active',
        Discipline NVARCHAR(100) NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

        CONSTRAINT CK_Users_AccountStatus
            CHECK (AccountStatus IN ('active', 'disabled', 'locked'))
    );
END
GO


-- ROLES
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Roles')
BEGIN
    CREATE TABLE dbo.Roles (
        RoleId INT IDENTITY(1,1) PRIMARY KEY,
        RoleName NVARCHAR(100) NOT NULL UNIQUE,
        DisplayName NVARCHAR(150) NOT NULL,
        Discipline NVARCHAR(100) NULL,
        IsActive BIT NOT NULL DEFAULT 1
    );
END
GO


-- PERMISSIONS
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Permissions')
BEGIN
    CREATE TABLE dbo.Permissions (
        PermissionId INT IDENTITY(1,1) PRIMARY KEY,
        PermissionCode NVARCHAR(150) NOT NULL UNIQUE,

        ResourceType NVARCHAR(100) NOT NULL,
        Action NVARCHAR(50) NOT NULL,

        RequiredDiscipline NVARCHAR(100) NULL,
        SensitivityLevel NVARCHAR(100) NULL,
        NoteTypeRestriction NVARCHAR(100) NULL,
        CareContext NVARCHAR(50) NULL,

        IsActive BIT NOT NULL DEFAULT 1
    );
END
GO


-- USER <-> ROLE
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'UserRoles')
BEGIN
    CREATE TABLE dbo.UserRoles (
        UserId INT NOT NULL,
        RoleId INT NOT NULL,

        CONSTRAINT PK_UserRoles PRIMARY KEY (UserId, RoleId),

        CONSTRAINT FK_UserRoles_User
            FOREIGN KEY (UserId) REFERENCES dbo.Users(UserId),

        CONSTRAINT FK_UserRoles_Role
            FOREIGN KEY (RoleId) REFERENCES dbo.Roles(RoleId)
    );
END
GO


-- ROLE <-> PERMISSION
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'RolePermissions')
BEGIN
    CREATE TABLE dbo.RolePermissions (
        RoleId INT NOT NULL,
        PermissionId INT NOT NULL,

        CONSTRAINT PK_RolePermissions
            PRIMARY KEY (RoleId, PermissionId),

        CONSTRAINT FK_RolePermissions_Role
            FOREIGN KEY (RoleId) REFERENCES dbo.Roles(RoleId),

        CONSTRAINT FK_RolePermissions_Permission
            FOREIGN KEY (PermissionId)
            REFERENCES dbo.Permissions(PermissionId)
    );
END
GO

MERGE dbo.Roles AS target
USING (
    VALUES
        ('ADMIN',              'Admin',                NULL),
        ('FACULTY_INSTRUCTOR', 'Faculty / Instructor', NULL),
        ('PHYSICIAN',          'Physician',            NULL),
        ('NURSE',              'Nurse',                'Nursing'),
        ('PSYCHIATRY',         'Psychiatry',           'Psychiatry'),
        ('PHYSICAL_THERAPY',   'Physical Therapy',     'Physical Therapy'),
        ('ALLIED_HEALTH',      'Other Allied Health',  NULL)
) AS source (RoleName, DisplayName, Discipline)

ON target.RoleName = source.RoleName

WHEN NOT MATCHED THEN
    INSERT (RoleName, DisplayName, Discipline)
    VALUES (
        source.RoleName,
        source.DisplayName,
        source.Discipline
    );
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
