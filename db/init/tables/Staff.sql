-- STAFF TABLE
-- The person: name, role, discipline, and department. Students are people too.
-- UserId links to the person's account (dbo.Users); it is NULL for people who
-- cannot sign in. Cases, assignments, enrollments, and grades refer to StaffId.
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Staff' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.Staff (
        StaffId      INT IDENTITY(1,1) PRIMARY KEY,
        UserId       INT NULL
            CONSTRAINT FK_Staff_Users REFERENCES dbo.Users(UserId),
        FirstName    NVARCHAR(100) NOT NULL,
        MiddleName   NVARCHAR(100) NULL,
        LastName     NVARCHAR(100) NOT NULL,
        RoleId       INT NOT NULL
            CONSTRAINT FK_Staff_Roles REFERENCES dbo.Roles(RoleId),
        DisciplineId INT NULL
            CONSTRAINT FK_Staff_Disciplines REFERENCES dbo.Disciplines(DisciplineId),
        DepartmentId INT NULL
            CONSTRAINT FK_Staff_Departments REFERENCES dbo.Departments(DepartmentId)
    );
END
GO

-- One person per account. Filtered, because a plain UNIQUE in SQL Server
-- allows only a single NULL and many people have no account.
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'UX_Staff_UserId' AND object_id = OBJECT_ID('dbo.Staff'))
BEGIN
    CREATE UNIQUE INDEX UX_Staff_UserId ON dbo.Staff (UserId) WHERE UserId IS NOT NULL;
END
GO

-- STAFF DATA: people without a login (people with logins are in seed/users.sql)
IF NOT EXISTS (SELECT * FROM dbo.Staff)
BEGIN
    INSERT INTO dbo.Staff (FirstName, MiddleName, LastName, RoleId, DisciplineId, DepartmentId)
    SELECT s.FirstName, s.MiddleName, s.LastName, r.RoleId, d.DisciplineId, dep.DepartmentId
    FROM (
        VALUES
            (N'Emily',  NULL,  N'Carter', 'FACULTY_INSTRUCTOR', N'NURSE',     N'NURS'),
            (N'Daniel', N'J',  N'Brooks', 'FACULTY_INSTRUCTOR', N'PHYSICIAN', N'IHS'),
            (N'Sophia', NULL,  N'Nguyen', 'STUDENT',            N'NURSE',     N'NURS'),
            (N'Alex',   NULL,  N'Morgan', 'ADMIN',              NULL,         NULL)
    ) AS s (FirstName, MiddleName, LastName, RoleName, DisciplineCode, DepartmentCode)
    JOIN dbo.Roles r            ON r.RoleName = s.RoleName
    LEFT JOIN dbo.Disciplines d ON d.Code = s.DisciplineCode
    LEFT JOIN dbo.Departments dep ON dep.Code = s.DepartmentCode;
END
GO
