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

-- TABLES
-- Each dbo table lives in tables/<Table>.sql with its CREATE TABLE, upgrades for
-- older databases, and seed data. Order matters: a table comes after the tables it
-- references, and seed data after the rows it depends on.
-- sqlcmd resolves :r paths from its working directory, so the paths are container paths.
:r /init/tables/Items.sql
:r /init/tables/Users.sql
:r /init/tables/Providers.sql
:r /init/tables/Roles.sql
:r /init/tables/Drugs.sql
:r /init/tables/Permissions.sql
:r /init/tables/UserRoles.sql
:r /init/tables/RolePermissions.sql
:r /init/tables/Patients.sql
:r /init/tables/Staff.sql
:r /init/tables/T_Login.sql

-- PEOPLE: Team users, roles, and logins
:r /init/seed/users.sql

:r /init/tables/Sessions.sql
:r /init/tables/PatientDrugs.sql
:r /init/tables/MedicalHistory.sql
:r /init/tables/Rooms.sql
:r /init/tables/FamilyHistory.sql
:r /init/tables/RoomAssignments.sql
:r /init/tables/Cases.sql
:r /init/tables/Assignment.sql

-- SOAP sprint: encounter identity and chart context. Empty chart tables are intentional:
-- missing data must never be displayed as a normal result or 'no known allergies'.
:r /init/tables/Encounters.sql
:r /init/tables/PatientAllergies.sql
:r /init/tables/PatientVitals.sql
:r /init/tables/PatientLabResults.sql
:r /init/tables/ClinicalNotes.sql
:r /init/tables/Appointments.sql
:r /init/tables/NoteVersions.sql
:r /init/tables/BillingCharges.sql
:r /init/tables/Courses.sql
