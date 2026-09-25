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

-- PROVIDERS TABLE (a patient's medical provider)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Providers')
BEGIN
    CREATE TABLE dbo.Providers (
        ProviderId INT IDENTITY(1,1) PRIMARY KEY,
        FirstName  NVARCHAR(100) NOT NULL,
        LastName   NVARCHAR(100) NOT NULL,
        Specialty  NVARCHAR(100) NULL,
        Phone      NVARCHAR(20) NULL,
        Email      NVARCHAR(200) NULL
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

-- PERMISSIONS
-- Permission definitions are seeded here so all development environments
-- use the same permission codes. Role assignments can be changed separately.
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

-- PERMISSIONS DATA
MERGE dbo.Permissions AS target
USING (
    VALUES
        ('patient.read',   'patient',   'read'),
        ('patient.create', 'patient',   'create'),
        ('patient.delete', 'patient',   'delete'),

        ('staff.read',     'staff',     'read'),
        ('staff.create',   'staff',     'create'),
        ('staff.delete',   'staff',     'delete'),

        ('provider.read',   'provider',   'read'),
        ('provider.create', 'provider',   'create'),
        ('provider.delete', 'provider',   'delete'),

        ('drug.read',   'drug',   'read'),
        ('drug.create', 'drug',   'create'),
        ('drug.delete', 'drug',   'delete'),

        ('room.read',   'room',   'read'),
        ('room.create', 'room',   'create'),
        ('room.update', 'room',   'update'),
        ('room.delete', 'room',   'delete'),

        ('user.read',         'user', 'read'),
        ('user.create',       'user', 'create'),
        ('user.manage_roles', 'user', 'manage_roles'),

        ('role.read',               'role', 'read'),
        ('role.manage_permissions', 'role', 'manage_permissions'),

        ('permission.read', 'permission', 'read')
) AS source (
    PermissionCode,
    ResourceType,
    Action
)
ON target.PermissionCode = source.PermissionCode

WHEN NOT MATCHED THEN
    INSERT (
        PermissionCode,
        ResourceType,
        Action
    )
    VALUES (
        source.PermissionCode,
        source.ResourceType,
        source.Action
    );
GO

-- DEVELOPMENT USER FOR RBAC TESTING
-- Development-only user for testing RBAC. Replace with normal authentication
-- and user provisioning before production use.
IF NOT EXISTS (
    SELECT 1
    FROM dbo.Users
    WHERE Email = 'dev.admin@example.local'
)
BEGIN
    INSERT INTO dbo.Users (
        Name,
        Email,
        PasswordHash,
        AccountStatus,
        Discipline
    )
    VALUES (
        'Development Admin',
        'dev.admin@example.local',
        NULL,
        'active',
        NULL
    );
END
GO

-- ASSIGN DEVELOPMENT USER TO ADMIN ROLE
-- Development-only bootstrap access.
-- ADMIN receives all currently defined permissions so RBAC can be tested.
INSERT INTO dbo.UserRoles (
    UserId,
    RoleId
)
SELECT
    u.UserId,
    r.RoleId
FROM dbo.Users u
CROSS JOIN dbo.Roles r
WHERE
    u.Email = 'dev.admin@example.local'
    AND r.RoleName = 'ADMIN'
    AND NOT EXISTS (
        SELECT 1
        FROM dbo.UserRoles ur
        WHERE
            ur.UserId = u.UserId
            AND ur.RoleId = r.RoleId
    );
GO


-- DEVELOPMENT ADMIN RECEIVES ALL CURRENT PERMISSIONS
INSERT INTO dbo.RolePermissions (
    RoleId,
    PermissionId
)
SELECT
    r.RoleId,
    p.PermissionId
FROM dbo.Roles r
CROSS JOIN dbo.Permissions p
WHERE
    r.RoleName = 'ADMIN'
    AND NOT EXISTS (
        SELECT 1
        FROM dbo.RolePermissions rp
        WHERE
            rp.RoleId = r.RoleId
            AND rp.PermissionId = p.PermissionId
    );
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
        PatientId           INT IDENTITY(1,1) PRIMARY KEY,
        Mrn                 NVARCHAR(20)  NULL UNIQUE, -- medical record number
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
-- ROOMS DATA
IF NOT EXISTS (SELECT * FROM dbo.Rooms)
BEGIN
    INSERT INTO dbo.Rooms (RoomNumber, Unit, Status) VALUES
        (100, 'General',    'available'),
        (101, 'General',    'available'),
        (102, 'ICU',        'available'),
        (103, 'ICU',        'available'),
        (104, 'Pediatrics', 'available'),
        (105, 'Pediatrics', 'available');
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
        DischargedAt DATETIME2 NULL --NULL means patient is still assigned to the room
    );
END 
GO

-- STAFF TABLE
IF NOT EXISTS (
    SELECT *
    FROM sys.tables
    WHERE name = 'Staff'
      AND schema_id = SCHEMA_ID('dbo')
)
BEGIN
    CREATE TABLE dbo.Staff (
        StaffId        INT IDENTITY(1,1) PRIMARY KEY,
        FirstName      NVARCHAR(100) NOT NULL,
        MiddleName     NVARCHAR(100) NULL,
        LastName       NVARCHAR(100) NOT NULL,
        Specialization NVARCHAR(100) NOT NULL,
        Student        BIT NOT NULL DEFAULT 0,
        Admin          BIT NOT NULL DEFAULT 0
    );
END
GO

-- STAFF DATA
IF NOT EXISTS (SELECT * FROM dbo.Staff)
BEGIN
    INSERT INTO dbo.Staff
        (FirstName, MiddleName, LastName, Specialization, Student, Admin)
    VALUES
        (N'Emily',  NULL, N'Carter', N'Nursing',          0, 0),
        (N'Daniel', N'J', N'Brooks', N'Cardiology',       0, 0),
        (N'Sophia', NULL, N'Nguyen', N'Physical Therapy', 1, 0),
        (N'Alex',   NULL, N'Morgan', N'Administration',    0, 1);
END
GO

-- LOGIN TABLE (username/password credentials for staff; used by /auth/login)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'T_Login')
BEGIN
    CREATE TABLE dbo.T_Login (
        username      NVARCHAR(254) NOT NULL PRIMARY KEY,
        password_hash NVARCHAR(100) NOT NULL, -- bcrypt hash
        staffid       INT NOT NULL REFERENCES dbo.Staff(StaffId)
    );
END
GO
