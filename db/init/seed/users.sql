-- PEOPLE SEED
-- Users, their roles, and their logins (a Staff row + a T_Login row each).
-- Included by init.sql with :r, after the Staff and T_Login tables exist.
-- Every block skips rows that already exist, so re-running is safe.

-- DEMO STUDENT AND INSTRUCTOR USERS
-- Passwords live in dbo.T_Login (seeded below), so PasswordHash stays NULL.
MERGE dbo.Users AS target
USING (
    VALUES
        ('Sam Student',     'student@example.local',    'Nursing'),
        ('Emmanuel Saenz',     'esaenz16@miners.utep.edu',    'Nursing'),
        ('Daniel Marin',     'djmarin1@miners.utep.edu',    'Physician'),
        ('Jacob Silva',     'jasilva6@miners.utep.edu',    'Physical Therapy'),
        ('Kinley Wangyel',     'ktwangyel@miners.utep.edu',    'Psychiatry'),
        ('Zachary Wittmann',     'zawittmann@miners.utep.edu',    'Nursing'),
        ('Daniel Mejia',  'instructor@example.local', 'Nursing')
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
    VALUES (N'Daniel', NULL, N'Mejia', N'Nursing', 0, 0)

    INSERT INTO dbo.T_Login (username, password_hash, staffid, userid)
    VALUES (
        N'instructor',
        N'$2b$12$IEeerdd1YbKnoui2WeZLHOoZgh7shNXg/6wA2Z4Z7uTzwCK5BGaSG',
        SCOPE_IDENTITY(),
        (SELECT UserId FROM dbo.Users WHERE Email = 'instructor@example.local')
    );
END
GO

-- STUDENT LOGINS: username is the first name, password is the first name in lowercase
-- "emmanuel" / "emmanuel"
IF NOT EXISTS (SELECT * FROM dbo.T_Login WHERE username = N'emmanuel')
BEGIN
    INSERT INTO dbo.Staff (FirstName, MiddleName, LastName, Specialization, Student, Admin)
    VALUES (N'Emmanuel', NULL, N'Saenz', N'Nursing', 1, 0)

    INSERT INTO dbo.T_Login (username, password_hash, staffid, userid)
    VALUES (
        N'emmanuel',
        N'$2b$12$5OCsrcn4pEVdHYP8xHkGRODzNM.XhR.2uI6XMPI8F3OPqtwuV4Vca',
        SCOPE_IDENTITY(),
        (SELECT UserId FROM dbo.Users WHERE Email = 'esaenz16@miners.utep.edu')
    );
END
GO

-- "daniel" / "daniel"
IF NOT EXISTS (SELECT * FROM dbo.T_Login WHERE username = N'daniel')
BEGIN
    INSERT INTO dbo.Staff (FirstName, MiddleName, LastName, Specialization, Student, Admin)
    VALUES (N'Daniel', NULL, N'Marin', N'Physician', 1, 0)

    INSERT INTO dbo.T_Login (username, password_hash, staffid, userid)
    VALUES (
        N'daniel',
        N'$2b$12$b6FN9us0SmgbUhj./CY9W.kt9QPxc/GrPoGuao4rZfBFdYO901h1a',
        SCOPE_IDENTITY(),
        (SELECT UserId FROM dbo.Users WHERE Email = 'djmarin1@miners.utep.edu')
    );
END
GO

-- "jacob" / "jacob"
IF NOT EXISTS (SELECT * FROM dbo.T_Login WHERE username = N'jacob')
BEGIN
    INSERT INTO dbo.Staff (FirstName, MiddleName, LastName, Specialization, Student, Admin)
    VALUES (N'Jacob', NULL, N'Silva', N'Physical Therapy', 1, 0)

    INSERT INTO dbo.T_Login (username, password_hash, staffid, userid)
    VALUES (
        N'jacob',
        N'$2b$12$9ViNyGrsjoMQUuJfs4Uzhul9WWdJIYA24dpwh8lOeOhbTTt/UTr7q',
        SCOPE_IDENTITY(),
        (SELECT UserId FROM dbo.Users WHERE Email = 'jasilva6@miners.utep.edu')
    );
END
GO

-- "kinley" / "kinley"
IF NOT EXISTS (SELECT * FROM dbo.T_Login WHERE username = N'kinley')
BEGIN
    INSERT INTO dbo.Staff (FirstName, MiddleName, LastName, Specialization, Student, Admin)
    VALUES (N'Kinley', NULL, N'Wangyel', N'Psychiatry', 1, 0)

    INSERT INTO dbo.T_Login (username, password_hash, staffid, userid)
    VALUES (
        N'kinley',
        N'$2b$12$2IuPgPE7VvZF7tpa0vGgfuOSPxuOfnAtdgPEsy7HPgY84qeaEKc.a',
        SCOPE_IDENTITY(),
        (SELECT UserId FROM dbo.Users WHERE Email = 'ktwangyel@miners.utep.edu')
    );
END
GO

-- "zachary" / "zachary"
IF NOT EXISTS (SELECT * FROM dbo.T_Login WHERE username = N'zachary')
BEGIN
    INSERT INTO dbo.Staff (FirstName, MiddleName, LastName, Specialization, Student, Admin)
    VALUES (N'Zachary', NULL, N'Wittmann', N'Nursing', 1, 0)

    INSERT INTO dbo.T_Login (username, password_hash, staffid, userid)
    VALUES (
        N'zachary',
        N'$2b$12$Ie/ipuMHu4WiPnO9T8Mnxud/AxGNKMwjdKS3B1IZGVpEkAa9uCGfq',
        SCOPE_IDENTITY(),
        (SELECT UserId FROM dbo.Users WHERE Email = 'zawittmann@miners.utep.edu')
    );
END
GO
