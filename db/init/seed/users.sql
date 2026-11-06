-- PEOPLE SEED
-- Each demo person gets an account (dbo.Users), a person row (dbo.Staff) with their
-- role, discipline, and department, and a login (dbo.T_Login).
-- Included by init.sql with :r, after the Staff and T_Login tables exist.
-- Every block skips rows that already exist, so re-running is safe.
--
-- Logins (username / password):
--   instructor / instructor123   Nursing instructor
--   pharmacy   / pharmacy123     Pharmacy instructor
--   therapy    / therapy123      Physical therapy instructor
--   admin      / admin123        Administrator
--   student    / student123      Nursing student
--   emmanuel, daniel, jacob, kinley, zachary, ana, luis: password is the username
--   james      / james           Patient portal (James Carter, MRN000001)

IF OBJECT_ID('tempdb..#People') IS NOT NULL DROP TABLE #People;

CREATE TABLE #People (
    Username       NVARCHAR(254),
    PasswordHash   NVARCHAR(100),
    Email          NVARCHAR(320),
    FirstName      NVARCHAR(100),
    LastName       NVARCHAR(100),
    RoleName       NVARCHAR(100),
    DisciplineCode NVARCHAR(50),
    DepartmentCode NVARCHAR(10)
);

INSERT INTO #People VALUES
    -- Instructors
    (N'instructor', N'$2b$12$IEeerdd1YbKnoui2WeZLHOoZgh7shNXg/6wA2Z4Z7uTzwCK5BGaSG', N'instructor@example.local',          N'Daniel',   N'Mejia',    N'FACULTY_INSTRUCTOR', N'NURSE',            N'NURS'),
    (N'pharmacy',   N'$2b$12$PatfTvI0ezc6sY5O14S8BOE8QKn7OOyXoqsUEmiP7.5YkQGgCLcoG', N'pharmacy.instructor@example.local', N'Maria',    N'Alvarez',  N'FACULTY_INSTRUCTOR', N'PHARMACY',         N'PHAR'),
    (N'therapy',    N'$2b$12$AVrcPD8oAWz3jsXnzLTR8.7gF8/qipfrVdMoY4Arru6l0xnQsyAIi', N'therapy.instructor@example.local',  N'Robert',   N'Chen',     N'FACULTY_INSTRUCTOR', N'PHYSICAL_THERAPY', N'PT'),
    -- Administrator (no discipline or department: sees all departments)
    (N'admin',      N'$2b$12$A9vbFqkRvQ0LQ72dVNyure12xBdeAJEvobNYQEDUXmWImFX0MPMPu', N'admin@example.local',               N'Jordan',   N'Reyes',    N'ADMIN',              NULL,               NULL),
    -- Students
    (N'student',    N'$2b$12$i.woXWQz6qB2m17SC2fYneRExFaPefSJ1hEfL6spySNCFDlrovVky', N'student@example.local',             N'Sam',      N'Student',  N'STUDENT',            N'NURSE',            N'NURS'),
    (N'emmanuel',   N'$2b$12$5OCsrcn4pEVdHYP8xHkGRODzNM.XhR.2uI6XMPI8F3OPqtwuV4Vca', N'esaenz16@miners.utep.edu',          N'Emmanuel', N'Saenz',    N'STUDENT',            N'NURSE',            N'NURS'),
    (N'daniel',     N'$2b$12$b6FN9us0SmgbUhj./CY9W.kt9QPxc/GrPoGuao4rZfBFdYO901h1a', N'djmarin1@miners.utep.edu',          N'Daniel',   N'Marin',    N'STUDENT',            N'PHYSICIAN',        N'IHS'),
    (N'jacob',      N'$2b$12$9ViNyGrsjoMQUuJfs4Uzhul9WWdJIYA24dpwh8lOeOhbTTt/UTr7q', N'jasilva6@miners.utep.edu',          N'Jacob',    N'Silva',    N'STUDENT',            N'PHYSICAL_THERAPY', N'PT'),
    (N'kinley',     N'$2b$12$2IuPgPE7VvZF7tpa0vGgfuOSPxuOfnAtdgPEsy7HPgY84qeaEKc.a', N'ktwangyel@miners.utep.edu',         N'Kinley',   N'Wangyel',  N'STUDENT',            N'PSYCHIATRY',       N'IHS'),
    (N'zachary',    N'$2b$12$Ie/ipuMHu4WiPnO9T8Mnxud/AxGNKMwjdKS3B1IZGVpEkAa9uCGfq', N'zawittmann@miners.utep.edu',        N'Zachary',  N'Wittmann', N'STUDENT',            N'NURSE',            N'NURS'),
    (N'ana',        N'$2b$12$rZpJGhONrwWM67Dp5u5VC.eh.yBMpP2aZjjYYWr2bzwAL3/RuByXe', N'ana.torres@example.local',          N'Ana',      N'Torres',   N'STUDENT',            N'PHARMACY',         N'PHAR'),
    (N'luis',       N'$2b$12$kgokr/bw6xqHzVoxCOaGueUXnJD8jC8m87MkiZFumsovdAI5BKI.u', N'luis.herrera@example.local',        N'Luis',     N'Herrera',  N'STUDENT',            N'PHARMACY',         N'PHAR');

-- ACCOUNTS
INSERT INTO dbo.Users (Email, PasswordHash, AccountStatus)
SELECT p.Email, NULL, 'active'
FROM #People p
WHERE NOT EXISTS (SELECT 1 FROM dbo.Users u WHERE u.Email = p.Email);

-- PEOPLE: one Staff row per account
INSERT INTO dbo.Staff (UserId, FirstName, MiddleName, LastName, RoleId, DisciplineId, DepartmentId)
SELECT u.UserId, p.FirstName, NULL, p.LastName, r.RoleId, d.DisciplineId, dep.DepartmentId
FROM #People p
JOIN dbo.Users u              ON u.Email = p.Email
JOIN dbo.Roles r              ON r.RoleName = p.RoleName
LEFT JOIN dbo.Disciplines d   ON d.Code = p.DisciplineCode
LEFT JOIN dbo.Departments dep ON dep.Code = p.DepartmentCode
WHERE NOT EXISTS (SELECT 1 FROM dbo.Staff s WHERE s.UserId = u.UserId);

-- LOGINS
INSERT INTO dbo.T_Login (username, password_hash, userid)
SELECT p.Username, p.PasswordHash, u.UserId
FROM #People p
JOIN dbo.Users u ON u.Email = p.Email
WHERE NOT EXISTS (SELECT 1 FROM dbo.T_Login l WHERE l.username = p.Username);

DROP TABLE #People;
GO

-- PATIENT PORTAL ACCOUNTS
-- A patient signs in with the same login page. Their account is linked from
-- dbo.Patients.UserId instead of dbo.Staff, so they get no staff role or permissions
-- and only see their own record through the /portal API.
IF OBJECT_ID('tempdb..#PortalPatients') IS NOT NULL DROP TABLE #PortalPatients;

CREATE TABLE #PortalPatients (
    Username     NVARCHAR(254),
    PasswordHash NVARCHAR(100),
    Email        NVARCHAR(320),
    Mrn          NVARCHAR(20)
);

INSERT INTO #PortalPatients VALUES
    (N'james', N'$2b$12$ej9r2Jxg6UFAoHLTc.PCDueZ02d4elvPh3I0vqGekNkZYZg8AUstK', N'james.carter@example.local', N'MRN000001');

INSERT INTO dbo.Users (Email, PasswordHash, AccountStatus)
SELECT pp.Email, NULL, 'active'
FROM #PortalPatients pp
WHERE NOT EXISTS (SELECT 1 FROM dbo.Users u WHERE u.Email = pp.Email);

UPDATE p SET UserId = u.UserId
FROM dbo.Patients p
JOIN #PortalPatients pp ON pp.Mrn = p.Mrn
JOIN dbo.Users u        ON u.Email = pp.Email
WHERE p.UserId IS NULL;

INSERT INTO dbo.T_Login (username, password_hash, userid)
SELECT pp.Username, pp.PasswordHash, u.UserId
FROM #PortalPatients pp
JOIN dbo.Users u ON u.Email = pp.Email
WHERE NOT EXISTS (SELECT 1 FROM dbo.T_Login l WHERE l.username = pp.Username);

DROP TABLE #PortalPatients;
GO
