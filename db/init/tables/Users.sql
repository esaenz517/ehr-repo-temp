-- USERS
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
BEGIN
    CREATE TABLE dbo.Users (
        UserId INT IDENTITY(1,1) PRIMARY KEY,
        Name NVARCHAR(200) NOT NULL,
        Email NVARCHAR(320) NOT NULL UNIQUE,
        PasswordHash NVARCHAR(500) NULL,
        AccountStatus NVARCHAR(20) NOT NULL DEFAULT 'active',
        Discipline NVARCHAR(100) NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

        CONSTRAINT CK_Users_AccountStatus
            CHECK (AccountStatus IN ('active', 'disabled', 'locked'))
    );
END
GO

-- DEVELOPMENT USER FOR RBAC TESTING
-- Development-only user for testing RBAC. Replace with normal authentication
-- and user provisioning before production use.
IF NOT EXISTS (
    SELECT 1
    FROM dbo.Users
    WHERE Email = 'dev.admin@example.local'
)
BEGIN
    INSERT INTO dbo.Users (
        Name,
        Email,
        PasswordHash,
        AccountStatus,
        Discipline
    )
    VALUES (
        'Development Admin',
        'dev.admin@example.local',
        NULL,
        'active',
        NULL
    );
END
GO
