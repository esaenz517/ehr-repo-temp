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
