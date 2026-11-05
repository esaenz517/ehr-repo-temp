-- USERS
-- The account: can this person sign in? The person behind it (name, role,
-- discipline, department) lives in dbo.Staff, which points here through Staff.UserId.
-- The password used to sign in lives in dbo.T_Login; PasswordHash is unused for now.
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
BEGIN
    CREATE TABLE dbo.Users (
        UserId        INT IDENTITY(1,1) PRIMARY KEY,
        Email         NVARCHAR(320) NOT NULL UNIQUE,
        PasswordHash  NVARCHAR(500) NULL,
        AccountStatus NVARCHAR(20)  NOT NULL DEFAULT 'active',
        CreatedAt     DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),

        CONSTRAINT CK_Users_AccountStatus
            CHECK (AccountStatus IN ('active', 'disabled', 'locked'))
    );
END
GO

-- DEVELOPMENT ADMIN ACCOUNT (its Staff row and "dev" login are created in T_Login.sql)
IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE Email = 'dev.admin@example.local')
BEGIN
    INSERT INTO dbo.Users (Email, PasswordHash, AccountStatus)
    VALUES ('dev.admin@example.local', NULL, 'active');
END
GO
