-- PEOPLE SEED
-- Each demo person gets an account (dbo.Users), a person row (dbo.Staff) with their
-- role, discipline, and department, and a login (dbo.T_Login).
-- Included by init.sql with \ir, after the Staff and T_Login tables exist.
-- Every block skips rows that already exist, so re-running is safe.
-- Usernames are stored in lowercase: Postgres compares text case-sensitively.
--
-- Logins (username / password):
--   instructor / instructor123   Nursing instructor
--   pharmacy   / pharmacy123     Pharmacy instructor
--   therapy    / therapy123      Physical therapy instructor
--   admin      / admin123        Administrator
--   student    / student123      Nursing student
--   emmanuel, daniel, jacob, kinley, zachary, ana, luis: password is the username
--   james      / james           Patient portal (James Carter, MRN000001)

DROP TABLE IF EXISTS pg_temp.people;

CREATE TEMP TABLE people (
    Seq            INT,
    Username       VARCHAR(254),
    PasswordHash   VARCHAR(100),
    Email          VARCHAR(320),
    FirstName      VARCHAR(100),
    LastName       VARCHAR(100),
    RoleName       VARCHAR(100),
    DisciplineCode VARCHAR(50),
    DepartmentCode VARCHAR(10)
);

INSERT INTO people VALUES
    -- Instructors
    (1,  'instructor', '$2b$12$IEeerdd1YbKnoui2WeZLHOoZgh7shNXg/6wA2Z4Z7uTzwCK5BGaSG', 'instructor@example.local',          'Daniel',   'Mejia',    'FACULTY_INSTRUCTOR', 'NURSE',            'NURS'),
    (2,  'pharmacy',   '$2b$12$PatfTvI0ezc6sY5O14S8BOE8QKn7OOyXoqsUEmiP7.5YkQGgCLcoG', 'pharmacy.instructor@example.local', 'Maria',    'Alvarez',  'FACULTY_INSTRUCTOR', 'PHARMACY',         'PHAR'),
    (3,  'therapy',    '$2b$12$AVrcPD8oAWz3jsXnzLTR8.7gF8/qipfrVdMoY4Arru6l0xnQsyAIi', 'therapy.instructor@example.local',  'Robert',   'Chen',     'FACULTY_INSTRUCTOR', 'PHYSICAL_THERAPY', 'PT'),
    -- Administrator (no discipline or department: sees all departments)
    (4,  'admin',      '$2b$12$A9vbFqkRvQ0LQ72dVNyure12xBdeAJEvobNYQEDUXmWImFX0MPMPu', 'admin@example.local',               'Jordan',   'Reyes',    'ADMIN',              NULL,               NULL),
    -- Students
    (5,  'student',    '$2b$12$i.woXWQz6qB2m17SC2fYneRExFaPefSJ1hEfL6spySNCFDlrovVky', 'student@example.local',             'Sam',      'Student',  'STUDENT',            'NURSE',            'NURS'),
    (6,  'emmanuel',   '$2b$12$5OCsrcn4pEVdHYP8xHkGRODzNM.XhR.2uI6XMPI8F3OPqtwuV4Vca', 'esaenz16@miners.utep.edu',          'Emmanuel', 'Saenz',    'STUDENT',            'NURSE',            'NURS'),
    (7,  'daniel',     '$2b$12$b6FN9us0SmgbUhj./CY9W.kt9QPxc/GrPoGuao4rZfBFdYO901h1a', 'djmarin1@miners.utep.edu',          'Daniel',   'Marin',    'STUDENT',            'PHYSICIAN',        'IHS'),
    (8,  'jacob',      '$2b$12$9ViNyGrsjoMQUuJfs4Uzhul9WWdJIYA24dpwh8lOeOhbTTt/UTr7q', 'jasilva6@miners.utep.edu',          'Jacob',    'Silva',    'STUDENT',            'PHYSICAL_THERAPY', 'PT'),
    (9,  'kinley',     '$2b$12$2IuPgPE7VvZF7tpa0vGgfuOSPxuOfnAtdgPEsy7HPgY84qeaEKc.a', 'ktwangyel@miners.utep.edu',         'Kinley',   'Wangyel',  'STUDENT',            'PSYCHIATRY',       'IHS'),
    (10, 'zachary',    '$2b$12$Ie/ipuMHu4WiPnO9T8Mnxud/AxGNKMwjdKS3B1IZGVpEkAa9uCGfq', 'zawittmann@miners.utep.edu',        'Zachary',  'Wittmann', 'STUDENT',            'NURSE',            'NURS'),
    (11, 'ana',        '$2b$12$rZpJGhONrwWM67Dp5u5VC.eh.yBMpP2aZjjYYWr2bzwAL3/RuByXe', 'ana.torres@example.local',          'Ana',      'Torres',   'STUDENT',            'PHARMACY',         'PHAR'),
    (12, 'luis',       '$2b$12$kgokr/bw6xqHzVoxCOaGueUXnJD8jC8m87MkiZFumsovdAI5BKI.u', 'luis.herrera@example.local',        'Luis',     'Herrera',  'STUDENT',            'PHARMACY',         'PHAR');

-- ACCOUNTS
INSERT INTO dbo.Users (Email, PasswordHash, AccountStatus)
SELECT p.Email, NULL, 'active'
FROM people p
ORDER BY p.Seq
ON CONFLICT (Email) DO NOTHING;

-- PEOPLE: one Staff row per account
INSERT INTO dbo.Staff (UserId, FirstName, MiddleName, LastName, RoleId, DisciplineId, DepartmentId)
SELECT u.UserId, p.FirstName, NULL, p.LastName, r.RoleId, d.DisciplineId, dep.DepartmentId
FROM people p
JOIN dbo.Users u              ON u.Email = p.Email
JOIN dbo.Roles r              ON r.RoleName = p.RoleName
LEFT JOIN dbo.Disciplines d   ON d.Code = p.DisciplineCode
LEFT JOIN dbo.Departments dep ON dep.Code = p.DepartmentCode
WHERE NOT EXISTS (SELECT 1 FROM dbo.Staff s WHERE s.UserId = u.UserId)
ORDER BY p.Seq;

-- LOGINS
INSERT INTO dbo.T_Login (username, password_hash, userid)
SELECT p.Username, p.PasswordHash, u.UserId
FROM people p
JOIN dbo.Users u ON u.Email = p.Email
ORDER BY p.Seq
ON CONFLICT (username) DO NOTHING;

DROP TABLE people;

-- PATIENT PORTAL ACCOUNTS
-- A patient signs in with the same login page. Their account is linked from
-- dbo.Patients.UserId instead of dbo.Staff, so they get no staff role or permissions
-- and only see their own record through the /portal API.
DROP TABLE IF EXISTS pg_temp.portal_patients;

CREATE TEMP TABLE portal_patients (
    Username     VARCHAR(254),
    PasswordHash VARCHAR(100),
    Email        VARCHAR(320),
    Mrn          VARCHAR(20)
);

INSERT INTO portal_patients VALUES
    ('james', '$2b$12$ej9r2Jxg6UFAoHLTc.PCDueZ02d4elvPh3I0vqGekNkZYZg8AUstK', 'james.carter@example.local', 'MRN000001');

INSERT INTO dbo.Users (Email, PasswordHash, AccountStatus)
SELECT pp.Email, NULL, 'active'
FROM portal_patients pp
ON CONFLICT (Email) DO NOTHING;

UPDATE dbo.Patients p SET UserId = u.UserId
FROM portal_patients pp
JOIN dbo.Users u ON u.Email = pp.Email
WHERE pp.Mrn = p.Mrn AND p.UserId IS NULL;

INSERT INTO dbo.T_Login (username, password_hash, userid)
SELECT pp.Username, pp.PasswordHash, u.UserId
FROM portal_patients pp
JOIN dbo.Users u ON u.Email = pp.Email
ON CONFLICT (username) DO NOTHING;

DROP TABLE portal_patients;
