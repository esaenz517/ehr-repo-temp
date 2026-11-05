-- LOGIN TABLE
-- Sign-in credentials. Each login belongs to one account (dbo.Users); the
-- person behind the account is the dbo.Staff row with the same UserId.
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'T_Login')
BEGIN
    CREATE TABLE dbo.T_Login (
        username      NVARCHAR(254) NOT NULL PRIMARY KEY,
        password_hash NVARCHAR(100) NOT NULL, -- bcrypt hash
        userid        INT NOT NULL
            CONSTRAINT FK_T_Login_Users REFERENCES dbo.Users(UserId)
    );
END
GO

-- DEV LOGIN SEED: "dev" / "dev123", an ADMIN with the development admin account
IF NOT EXISTS (SELECT * FROM dbo.T_Login WHERE username = N'dev')
BEGIN
    DECLARE @devUserId INT = (SELECT UserId FROM dbo.Users WHERE Email = 'dev.admin@example.local');

    IF NOT EXISTS (SELECT 1 FROM dbo.Staff WHERE UserId = @devUserId)
    BEGIN
        INSERT INTO dbo.Staff (UserId, FirstName, MiddleName, LastName, RoleId)
        SELECT @devUserId, N'Dev', NULL, N'User', RoleId
        FROM dbo.Roles WHERE RoleName = 'ADMIN';
    END

    INSERT INTO dbo.T_Login (username, password_hash, userid)
    VALUES (N'Dev', N'$2b$12$JiMOYxRva65eUaBh74GGfeyJTmACdFGT8zCuYfpyy7SfT7NjNkLt.', @devUserId);
END
GO
