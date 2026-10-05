-- USER <-> ROLE
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'UserRoles')
BEGIN
    CREATE TABLE dbo.UserRoles (
        UserId INT NOT NULL,
        RoleId INT NOT NULL,

        CONSTRAINT PK_UserRoles PRIMARY KEY (UserId, RoleId),

        CONSTRAINT FK_UserRoles_User
            FOREIGN KEY (UserId) REFERENCES dbo.Users(UserId),

        CONSTRAINT FK_UserRoles_Role
            FOREIGN KEY (RoleId) REFERENCES dbo.Roles(RoleId)
    );
END
GO

-- ASSIGN DEVELOPMENT USER TO ADMIN ROLE
-- Development-only bootstrap access.
-- ADMIN receives all currently defined permissions so RBAC can be tested.
INSERT INTO dbo.UserRoles (
    UserId,
    RoleId
)
SELECT
    u.UserId,
    r.RoleId
FROM dbo.Users u
CROSS JOIN dbo.Roles r
WHERE
    u.Email = 'dev.admin@example.local'
    AND r.RoleName = 'ADMIN'
    AND NOT EXISTS (
        SELECT 1
        FROM dbo.UserRoles ur
        WHERE
            ur.UserId = u.UserId
            AND ur.RoleId = r.RoleId
    );
GO
