-- Creates the application database, a sample table, and seed data.
-- Run automatically by the `db-init` container in docker-compose once
-- SQL Server reports healthy. You can also open this in SSMS by connecting
-- to localhost,1433 with user "sa" and the password from docker-compose.yml.

-- Filtered indexes (CREATE INDEX ... WHERE, e.g. UX_Patients_Mrn) requires QUOTED_IDENTIFIER ON
SET QUOTED_IDENTIFIER ON;
GO

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
        ('ALLIED_HEALTH',      'Other Allied Health',  NULL),
        ('STUDENT',            'Student',              NULL)
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

        ('case.read',   'case',   'read'),
        ('case.create', 'case',   'create'),
        ('case.delete', 'case',   'delete'),

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

-- INSTRUCTOR AND STUDENT PERMISSIONS
-- Instructors build cases and manage the clinical catalog; staff.read lets
-- Create Case list students. Students only read what they need for their
-- assignments. Note permissions are granted with the note permissions below.
INSERT INTO dbo.RolePermissions (
    RoleId,
    PermissionId
)
SELECT
    r.RoleId,
    p.PermissionId
FROM (
    VALUES
        ('FACULTY_INSTRUCTOR', 'patient.read'),
        ('FACULTY_INSTRUCTOR', 'patient.create'),
        ('FACULTY_INSTRUCTOR', 'patient.delete'),
        ('FACULTY_INSTRUCTOR', 'case.read'),
        ('FACULTY_INSTRUCTOR', 'case.create'),
        ('FACULTY_INSTRUCTOR', 'case.delete'),
        ('FACULTY_INSTRUCTOR', 'staff.read'),
        ('FACULTY_INSTRUCTOR', 'provider.read'),
        ('FACULTY_INSTRUCTOR', 'provider.create'),
        ('FACULTY_INSTRUCTOR', 'provider.delete'),
        ('FACULTY_INSTRUCTOR', 'drug.read'),
        ('FACULTY_INSTRUCTOR', 'drug.create'),
        ('FACULTY_INSTRUCTOR', 'drug.delete'),
        ('FACULTY_INSTRUCTOR', 'room.read'),
        ('FACULTY_INSTRUCTOR', 'room.create'),
        ('FACULTY_INSTRUCTOR', 'room.update'),
        ('FACULTY_INSTRUCTOR', 'room.delete'),

        ('STUDENT', 'patient.read'),
        ('STUDENT', 'case.read'),
        ('STUDENT', 'drug.read')
) AS grants (RoleName, PermissionCode)
JOIN dbo.Roles r ON r.RoleName = grants.RoleName
JOIN dbo.Permissions p ON p.PermissionCode = grants.PermissionCode
WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.RolePermissions rp
    WHERE
        rp.RoleId = r.RoleId
        AND rp.PermissionId = p.PermissionId
);
GO

-- DEMO STUDENT AND INSTRUCTOR USERS
-- Passwords live in dbo.T_Login (seeded below), so PasswordHash stays NULL.
MERGE dbo.Users AS target
USING (
    VALUES
        ('Sam Student',     'student@example.local',    'Nursing'),
        ('Ivy Instructor',  'instructor@example.local', 'Nursing')
) AS source (Name, Email, Discipline)
ON target.Email = source.Email

WHEN NOT MATCHED THEN
    INSERT (Name, Email, PasswordHash, AccountStatus, Discipline)
    VALUES (source.Name, source.Email, NULL, 'active', source.Discipline);
GO

INSERT INTO dbo.UserRoles (
    UserId,
    RoleId
)
SELECT
    u.UserId,
    r.RoleId
FROM (
    VALUES
        ('student@example.local',    'STUDENT'),
        ('instructor@example.local', 'FACULTY_INSTRUCTOR')
) AS assignments (Email, RoleName)
JOIN dbo.Users u ON u.Email = assignments.Email
JOIN dbo.Roles r ON r.RoleName = assignments.RoleName
WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.UserRoles ur
    WHERE
        ur.UserId = u.UserId
        AND ur.RoleId = r.RoleId
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

-- STAFF TABLE
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Staff' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.Staff (
        StaffId    INT IDENTITY(1,1) PRIMARY KEY,
        FirstName    NVARCHAR(100) NOT NULL,
        MiddleName   NVARCHAR(100) NULL,
        LastName     NVARCHAR(100) NOT NULL,
        Specialization  NVARCHAR(100) NOT NULL,
        Student      BIT  NOT NULL DEFAULT 0,
        Admin        BIT  NOT NULL DEFAULT 0
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

-- LOGIN TABLE
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'T_Login')
BEGIN
    CREATE TABLE dbo.T_Login (
        username    NVARCHAR(254) NOT NULL PRIMARY KEY,
        password_hash NVARCHAR(100) NOT NULL, -- bcrypt hash
        staffid     INT NOT NULL UNIQUE REFERENCES dbo.Staff(StaffId), -- cases and assignments
        userid      INT NULL REFERENCES dbo.Users(UserId)              -- roles and permissions
    );
END
GO

-- Add userid (and its FK) to a T_Login table created before logins were linked to Users.
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.T_Login') AND name = 'userid')
BEGIN
    ALTER TABLE dbo.T_Login ADD userid INT NULL;
END
GO

IF NOT EXISTS (
    SELECT * FROM sys.foreign_keys
    WHERE parent_object_id = OBJECT_ID('dbo.T_Login')
      AND referenced_object_id = OBJECT_ID('dbo.Users')
)
BEGIN
    ALTER TABLE dbo.T_Login
        ADD CONSTRAINT FK_T_Login_Users FOREIGN KEY (userid) REFERENCES dbo.Users(UserId);
END
GO

-- DEV LOGIN SEED: Staff member plus login "dev" / "dev123", linked to the development admin user
IF NOT EXISTS (SELECT * FROM dbo.T_Login WHERE username = N'dev')
BEGIN
    INSERT INTO dbo.Staff (FirstName, MiddleName, LastName, Specialization, Student, Admin)
    VALUES (N'Dev', NULL, N'User', N'Development', 1, 1)

    INSERT INTO dbo.T_Login (username, password_hash, staffid, userid)
    VALUES (
        N'Dev',
        N'$2b$12$JiMOYxRva65eUaBh74GGfeyJTmACdFGT8zCuYfpyy7SfT7NjNkLt.',
        SCOPE_IDENTITY(),
        (SELECT UserId FROM dbo.Users WHERE Email = 'dev.admin@example.local')
    );
END
GO

-- Link a dev login seeded before T_Login had a userid column.
UPDATE dbo.T_Login
SET userid = (SELECT UserId FROM dbo.Users WHERE Email = 'dev.admin@example.local')
WHERE username = N'dev' AND userid IS NULL;
GO

-- DEMO STUDENT LOGIN: "student" / "student123"
IF NOT EXISTS (SELECT * FROM dbo.T_Login WHERE username = N'student')
BEGIN
    INSERT INTO dbo.Staff (FirstName, MiddleName, LastName, Specialization, Student, Admin)
    VALUES (N'Sam', NULL, N'Student', N'Nursing', 1, 0)

    INSERT INTO dbo.T_Login (username, password_hash, staffid, userid)
    VALUES (
        N'student',
        N'$2b$12$i.woXWQz6qB2m17SC2fYneRExFaPefSJ1hEfL6spySNCFDlrovVky',
        SCOPE_IDENTITY(),
        (SELECT UserId FROM dbo.Users WHERE Email = 'student@example.local')
    );
END
GO

-- DEMO INSTRUCTOR LOGIN: "instructor" / "instructor123"
IF NOT EXISTS (SELECT * FROM dbo.T_Login WHERE username = N'instructor')
BEGIN
    INSERT INTO dbo.Staff (FirstName, MiddleName, LastName, Specialization, Student, Admin)
    VALUES (N'Ivy', NULL, N'Instructor', N'Nursing', 0, 0)

    INSERT INTO dbo.T_Login (username, password_hash, staffid, userid)
    VALUES (
        N'instructor',
        N'$2b$12$IEeerdd1YbKnoui2WeZLHOoZgh7shNXg/6wA2Z4Z7uTzwCK5BGaSG',
        SCOPE_IDENTITY(),
        (SELECT UserId FROM dbo.Users WHERE Email = 'instructor@example.local')
    );
END
GO

-- SESSIONS TABLE
-- One row per signed-in browser. The browser holds a random token in an
-- HttpOnly cookie; only its SHA-256 hash is stored here, so a leaked table
-- can't be used to sign in. Rows are deleted on logout.
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Sessions')
BEGIN
    CREATE TABLE dbo.Sessions (
        SessionId   INT IDENTITY(1,1) PRIMARY KEY,
        TokenHash   CHAR(64) NOT NULL UNIQUE,
        Username    NVARCHAR(254) NOT NULL
                    REFERENCES dbo.T_Login(username) ON DELETE CASCADE,
        CreatedAt   DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        LastSeenAt  DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), -- for the idle timeout
        ExpiresAt   DATETIME2 NOT NULL                           -- absolute cutoff
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
        Route     NVARCHAR(20) NULL,
        Frequency NVARCHAR(50) NULL,
        CONSTRAINT PK_PatientDrugs PRIMARY KEY (PatientId, DrugId)
    );
END
GO

IF COL_LENGTH('dbo.PatientDrugs', 'Dosage') IS NULL
BEGIN
    ALTER TABLE dbo.PatientDrugs
    ADD Dosage    NVARCHAR(100) NULL
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


-- Case Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Cases')
BEGIN
    CREATE TABLE dbo.Cases (
        CaseId            INT IDENTITY(1,1) PRIMARY KEY,
        PatientId         INT NOT NULL REFERENCES dbo.Patients(PatientId),  -- the case's original patient
        ChiefComplaint    NVARCHAR(500)  NOT NULL,
        Narrative         NVARCHAR(4000) NULL,       -- "Case narrative / HPI seed"
        --SourceCaseId      INT NULL REFERENCES dbo.Cases(CaseId),  -- set when "Start from: Existing case"
        CreatedByStaffId  INT NOT NULL REFERENCES dbo.Staff(StaffId),
        CreatedAt         DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END
GO

-- ASSIGNMENT TABLE (must be initialized after CASE Table)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Assignment' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.Assignment (
        AssignmentId    INT IDENTITY(1,1) PRIMARY KEY,
        CaseId          INT NOT NULL REFERENCES dbo.Cases(CaseId), 
        EncounterStatus NVARCHAR(20) NOT NULL DEFAULT 'not_started'
                        CHECK (EncounterStatus IN ('not_started', 'in_progress', 'submitted', 'signed')),
        -- not_started: encounter assigned, student has not opened the encounter
        -- in_progress: student has opened the encounter, is working on it, or instructor has kicked back the submission for re-work
        -- submitted: student has completed encounter and submitted it for review
        -- signed: instructor has reviewed student's work and signed off on it (not kicked back for re-work)
        Course          NVARCHAR(100) NULL,
        DueDate         DATETIME2 NULL, --May not have due dates
        AssignmentType  NVARCHAR(10) NOT NULL DEFAULT 'graded'
                        CHECK(AssignmentType IN ('practice', 'graded')),
        -- practice: ungraded assignment, does not contribute to cumulative GPA
        -- graded: assignment contributes to cumulative GPA
        AssignedTo      INT NOT NULL REFERENCES dbo.Staff(StaffId), 
        AssignedBy      INT NOT NULL REFERENCES dbo.Staff(StaffId) 
    );
END
GO

-- SOAP sprint: encounter identity and chart context. Empty chart tables are intentional:
-- missing data must never be displayed as a normal result or 'no known allergies'.
IF OBJECT_ID(N'dbo.Encounters', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Encounters (
        EncounterId INT IDENTITY(1,1) PRIMARY KEY,
        PatientId INT NOT NULL REFERENCES dbo.Patients(PatientId),
        StartedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END
GO

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

IF OBJECT_ID(N'dbo.PatientVitals', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.PatientVitals (
        VitalId INT IDENTITY(1,1) PRIMARY KEY,
        PatientId INT NOT NULL REFERENCES dbo.Patients(PatientId),
        RecordedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        BloodPressure NVARCHAR(40) NULL,
        HeartRate INT NULL,
        RespiratoryRate INT NULL,
        TemperatureC DECIMAL(5,2) NULL,
        OxygenSaturation DECIMAL(5,2) NULL,
        HeightCm DECIMAL(7,2) NULL,
        WeightKg DECIMAL(7,2) NULL
    );
END
GO

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

-- The note type and sensitivity belong to the note, never to the patient.
-- Keep note types open for future editors; the API currently accepts SOAP only.
IF OBJECT_ID(N'dbo.ClinicalNotes', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ClinicalNotes (
        NoteId INT IDENTITY(1,1) PRIMARY KEY,
        PatientId INT NOT NULL REFERENCES dbo.Patients(PatientId),
        EncounterId INT NOT NULL REFERENCES dbo.Encounters(EncounterId),
        NoteType NVARCHAR(100) NOT NULL,
        Discipline NVARCHAR(100) NULL,
        AuthorUserId INT NOT NULL REFERENCES dbo.Users(UserId),
        ResponsibleProviderId INT NULL REFERENCES dbo.Providers(ProviderId),
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        LastModifiedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        Content NVARCHAR(MAX) NOT NULL,
        SensitivityClassification NVARCHAR(40) NOT NULL DEFAULT 'general',
        CurrentVersion INT NOT NULL DEFAULT 1,
        IsArchived BIT NOT NULL DEFAULT 0,
        CONSTRAINT CK_ClinicalNotes_Sensitivity
            CHECK (SensitivityClassification IN ('general', 'restricted')),
        CONSTRAINT CK_ClinicalNotes_Version
            CHECK (CurrentVersion >= 1)
    );

    CREATE INDEX IX_ClinicalNotes_Patient
        ON dbo.ClinicalNotes(PatientId, EncounterId);
END
GO

-- APPOINTMENTS TABLE
IF NOT EXISTS (
    SELECT * FROM sys.tables
    WHERE name = 'Appointments'
)
BEGIN
    CREATE TABLE dbo.Appointments (
        AppointmentId INT IDENTITY(1,1) PRIMARY KEY,

        PatientId INT NOT NULL,

        AppointmentDateTime DATETIME2 NOT NULL,

        Location NVARCHAR(200) NOT NULL,

        Status NVARCHAR(50) NOT NULL
            DEFAULT 'scheduled'
            CHECK (Status IN (
                'scheduled',
                'completed',
                'cancelled'
            )),

        CONSTRAINT FK_Appointments_Patients
            FOREIGN KEY (PatientId)
            REFERENCES dbo.Patients(PatientId)
    );
END
GO
IF OBJECT_ID(N'dbo.NoteVersions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.NoteVersions (
        VersionId INT IDENTITY(1,1) PRIMARY KEY,
        NoteId INT NOT NULL REFERENCES dbo.ClinicalNotes(NoteId),
        VersionNumber INT NOT NULL,
        ContentSnapshot NVARCHAR(MAX) NOT NULL,
        AuthorUserId INT NOT NULL REFERENCES dbo.Users(UserId),
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        ChangeSummary NVARCHAR(500) NULL,
        CONSTRAINT UQ_NoteVersions_NoteVersion
            UNIQUE (NoteId, VersionNumber)
    );
END
GO

-- Contextual note permissions: general grants do not cover restricted notes.
MERGE dbo.Permissions AS target
USING (
    VALUES
        ('note.read.general', 'read', 'general'),
        ('note.create.general', 'create', 'general'),
        ('note.update.general', 'update', 'general'),
        ('note.archive.general', 'archive', 'general'),
        ('note.read.restricted', 'read', 'restricted'),
        ('note.create.restricted', 'create', 'restricted'),
        ('note.update.restricted', 'update', 'restricted'),
        ('note.archive.restricted', 'archive', 'restricted')
) AS source (
    PermissionCode,
    Action,
    SensitivityLevel
)
ON target.PermissionCode = source.PermissionCode

WHEN NOT MATCHED THEN
    INSERT (
        PermissionCode,
        ResourceType,
        Action,
        SensitivityLevel,
        IsActive
    )
    VALUES (
        source.PermissionCode,
        'note',
        source.Action,
        source.SensitivityLevel,
        1
    );
GO

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
    p.ResourceType = 'note'
    AND (
        r.RoleName = 'ADMIN'
        OR (
            r.RoleName = 'FACULTY_INSTRUCTOR'
            AND p.Action = 'read'
        )
        OR (
            r.RoleName = 'STUDENT'
            AND p.SensitivityLevel = 'general'
            AND p.Action IN ('read', 'create', 'update')
        )
        OR (
            r.RoleName IN (
                'PHYSICIAN',
                'NURSE',
                'PSYCHIATRY',
                'PHYSICAL_THERAPY',
                'ALLIED_HEALTH'
            )
            AND p.SensitivityLevel = 'general'
        )
    )
    AND NOT EXISTS (
        SELECT 1
        FROM dbo.RolePermissions rp
        WHERE
            rp.RoleId = r.RoleId
            AND rp.PermissionId = p.PermissionId
    );
GO

IF NOT EXISTS (
    SELECT * FROM sys.tables
    WHERE name = 'BillingCharges'
)
BEGIN
    CREATE TABLE dbo.BillingCharges (
        ChargeId INT IDENTITY(1,1) PRIMARY KEY,

        PatientId INT NOT NULL,

        ChargeSummary NVARCHAR(500) NOT NULL,

        ChargeAmount DECIMAL(10,2) NOT NULL,

        CONSTRAINT FK_BillingCharges_Patients
            FOREIGN KEY (PatientId)
            REFERENCES dbo.Patients(PatientId)
    );
END
--Course Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Courses')
BEGIN
    CREATE TABLE dbo.Courses (
        CourseId      INT IDENTITY(1,1) PRIMARY KEY,
        SubjectCode   NVARCHAR(10)  NOT NULL,          -- 'PHAR', 'IHS'
        CourseNumber  NVARCHAR(10)  NOT NULL,          -- '5310'
        Title         NVARCHAR(200) NOT NULL,          -- 'Pharmacotherapy I'
        Term          NVARCHAR(10)  NOT NULL,          -- 'Fall', 'Spring', 'Summer'
        TermYear      INT           NOT NULL,          -- 2026
        IsActive      BIT           NOT NULL DEFAULT 1, -- hide past terms from the student dropdown
        CreatedAt     DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),

        CONSTRAINT CK_Courses_Term
            CHECK (Term IN ('Fall', 'Spring', 'Summer')),

        CONSTRAINT UQ_Courses_Offering
            UNIQUE (SubjectCode, CourseNumber, Term, TermYear)
    );
END
GO

IF NOT EXISTS (SELECT * FROM dbo.Courses)
BEGIN
    INSERT INTO dbo.Courses (SubjectCode, CourseNumber, Title, Term, TermYear, IsActive) VALUES
        (N'PHAR', N'5310', N'Pharmacotherapy I',                       N'Fall',   2026, 1),
        (N'IHS',  N'5100', N'Interprofessional Case Lab',              N'Fall',   2026, 1),
        (N'PHAR', N'5320', N'Pharmacotherapy II',                      N'Fall',   2026, 1),
        (N'PHAR', N'6150', N'Medication Therapy Management',           N'Fall',   2026, 1),
        (N'NURS', N'3310', N'Adult Health Nursing I',                  N'Fall',   2026, 1),
        (N'OT',   N'5150', N'Occupational Therapy Evaluation',         N'Fall',   2026, 1);
END
GO