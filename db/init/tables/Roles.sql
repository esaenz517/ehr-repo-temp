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
