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
