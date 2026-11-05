-- ROLES
-- What a person can do. Every person (dbo.Staff.RoleId) has exactly one role.
-- Clinical specialties are not roles: they live in dbo.Disciplines.
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Roles')
BEGIN
    CREATE TABLE dbo.Roles (
        RoleId      INT IDENTITY(1,1) PRIMARY KEY,
        RoleName    NVARCHAR(100) NOT NULL UNIQUE,
        DisplayName NVARCHAR(150) NOT NULL,
        IsActive    BIT NOT NULL DEFAULT 1
    );
END
GO

MERGE dbo.Roles AS target
USING (
    VALUES
        ('ADMIN',              'Admin'),
        ('FACULTY_INSTRUCTOR', 'Faculty / Instructor'),
        ('STUDENT',            'Student')
) AS source (RoleName, DisplayName)
ON target.RoleName = source.RoleName
WHEN NOT MATCHED THEN
    INSERT (RoleName, DisplayName) VALUES (source.RoleName, source.DisplayName);
GO

-- Older databases also had discipline and billing roles. They are kept for the
-- foreign keys but switched off; disciplines moved to dbo.Disciplines.
UPDATE dbo.Roles
SET IsActive = 0
WHERE RoleName NOT IN ('ADMIN', 'FACULTY_INSTRUCTOR', 'STUDENT') AND IsActive = 1;
GO
