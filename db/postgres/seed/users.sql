-- PEOPLE SEED
-- Users, their roles, and their logins (a Staff row + a T_Login row each).
-- Included by init.sql with \ir, after the Staff and T_Login tables exist.
-- Every block skips rows that already exist, so re-running is safe.

-- DEMO STUDENT AND INSTRUCTOR USERS
-- Passwords live in dbo.T_Login (seeded below), so PasswordHash stays NULL.
INSERT INTO dbo.Users (Name, Email, PasswordHash, AccountStatus, Discipline) VALUES
    ('Sam Student',      'student@example.local',      NULL, 'active', 'Nursing'),
    ('Emmanuel Saenz',   'esaenz16@miners.utep.edu',   NULL, 'active', 'Nursing'),
    ('Daniel Marin',     'djmarin1@miners.utep.edu',   NULL, 'active', 'Physician'),
    ('Jacob Silva',      'jasilva6@miners.utep.edu',   NULL, 'active', 'Physical Therapy'),
    ('Kinley Wangyel',   'ktwangyel@miners.utep.edu',  NULL, 'active', 'Psychiatry'),
    ('Zachary Wittmann', 'zawittmann@miners.utep.edu', NULL, 'active', 'Nursing'),
    ('Daniel Mejia',     'instructor@example.local',   NULL, 'active', 'Nursing')
ON CONFLICT (Email) DO NOTHING;

INSERT INTO dbo.UserRoles (
    UserId,
    RoleId
)
SELECT
    u.UserId,
    r.RoleId
FROM (
    VALUES
        -- Students: STUDENT grants patient/case/drug read, the discipline role grants notes
        ('student@example.local',      'STUDENT'),
        ('student@example.local',      'NURSE'),
        ('esaenz16@miners.utep.edu',   'STUDENT'),
        ('esaenz16@miners.utep.edu',   'NURSE'),
        ('djmarin1@miners.utep.edu',   'STUDENT'),
        ('djmarin1@miners.utep.edu',   'PHYSICIAN'),
        ('jasilva6@miners.utep.edu',   'STUDENT'),
        ('jasilva6@miners.utep.edu',   'PHYSICAL_THERAPY'),
        ('ktwangyel@miners.utep.edu',  'STUDENT'),
        ('ktwangyel@miners.utep.edu',  'PSYCHIATRY'),
        ('zawittmann@miners.utep.edu', 'STUDENT'),
        ('zawittmann@miners.utep.edu', 'NURSE'),
        -- Faculty
        ('instructor@example.local',          'FACULTY_INSTRUCTOR')
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

-- LOGINS: one Staff row + one T_Login row per person, skipped if the username exists.
--   "student" / "student123", "instructor" / "instructor123",
--   students: username is the first name, password is the first name in lowercase.
-- Order matters only for StaffId numbering (matches the SQL Server seed).
DO $seed$
DECLARE
    l RECORD;
    new_staff_id INT;
BEGIN
    FOR l IN
        SELECT * FROM (
            VALUES
                ('student',    '$2b$12$i.woXWQz6qB2m17SC2fYneRExFaPefSJ1hEfL6spySNCFDlrovVky', 'Sam',      'Student',  'Nursing',          TRUE,  'student@example.local'),
                ('instructor', '$2b$12$IEeerdd1YbKnoui2WeZLHOoZgh7shNXg/6wA2Z4Z7uTzwCK5BGaSG', 'Daniel',   'Mejia',    'Nursing',          FALSE, 'instructor@example.local'),
                ('emmanuel',   '$2b$12$5OCsrcn4pEVdHYP8xHkGRODzNM.XhR.2uI6XMPI8F3OPqtwuV4Vca', 'Emmanuel', 'Saenz',    'Nursing',          TRUE,  'esaenz16@miners.utep.edu'),
                ('daniel',     '$2b$12$b6FN9us0SmgbUhj./CY9W.kt9QPxc/GrPoGuao4rZfBFdYO901h1a', 'Daniel',   'Marin',    'Physician',        TRUE,  'djmarin1@miners.utep.edu'),
                ('jacob',      '$2b$12$9ViNyGrsjoMQUuJfs4Uzhul9WWdJIYA24dpwh8lOeOhbTTt/UTr7q', 'Jacob',    'Silva',    'Physical Therapy', TRUE,  'jasilva6@miners.utep.edu'),
                ('kinley',     '$2b$12$2IuPgPE7VvZF7tpa0vGgfuOSPxuOfnAtdgPEsy7HPgY84qeaEKc.a', 'Kinley',   'Wangyel',  'Psychiatry',       TRUE,  'ktwangyel@miners.utep.edu'),
                ('zachary',    '$2b$12$Ie/ipuMHu4WiPnO9T8Mnxud/AxGNKMwjdKS3B1IZGVpEkAa9uCGfq', 'Zachary',  'Wittmann', 'Nursing',          TRUE,  'zawittmann@miners.utep.edu')
        ) AS v (Username, PasswordHash, FirstName, LastName, Specialization, IsStudent, Email)
    LOOP
        IF NOT EXISTS (SELECT 1 FROM dbo.T_Login WHERE lower(username) = l.Username) THEN
            INSERT INTO dbo.Staff (FirstName, MiddleName, LastName, Specialization, Student, Admin)
            VALUES (l.FirstName, NULL, l.LastName, l.Specialization, l.IsStudent, FALSE)
            RETURNING StaffId INTO new_staff_id;

            INSERT INTO dbo.T_Login (username, password_hash, staffid, userid)
            VALUES (
                l.Username,
                l.PasswordHash,
                new_staff_id,
                (SELECT UserId FROM dbo.Users WHERE Email = l.Email)
            );
        END IF;
    END LOOP;
END
$seed$;
