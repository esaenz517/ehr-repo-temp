-- LOGIN TABLE
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'T_Login')
BEGIN
    CREATE TABLE dbo.T_Login (
        username    NVARCHAR(254) NOT NULL PRIMARY KEY,
        password_hash NVARCHAR(100) NOT NULL, -- bcrypt hash
        staffid     INT NOT NULL UNIQUE REFERENCES dbo.Staff(StaffId), -- cases and assignments
        userid      INT NULL REFERENCES dbo.Users(UserId)              -- roles and permissions
    );
END
GO

-- Add userid (and its FK) to a T_Login table created before logins were linked to Users.
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.T_Login') AND name = 'userid')
BEGIN
    ALTER TABLE dbo.T_Login ADD userid INT NULL;
END
GO

IF NOT EXISTS (
    SELECT * FROM sys.foreign_keys
    WHERE parent_object_id = OBJECT_ID('dbo.T_Login')
      AND referenced_object_id = OBJECT_ID('dbo.Users')
)
BEGIN
    ALTER TABLE dbo.T_Login
        ADD CONSTRAINT FK_T_Login_Users FOREIGN KEY (userid) REFERENCES dbo.Users(UserId);
END
GO

-- DEV LOGIN SEED: Staff member plus login "dev" / "dev123", linked to the development admin user
IF NOT EXISTS (SELECT * FROM dbo.T_Login WHERE username = N'dev')
BEGIN
    INSERT INTO dbo.Staff (FirstName, MiddleName, LastName, Specialization, Student, Admin)
    VALUES (N'Dev', NULL, N'User', N'Development', 1, 1)

    INSERT INTO dbo.T_Login (username, password_hash, staffid, userid)
    VALUES (
        N'Dev',
        N'$2b$12$JiMOYxRva65eUaBh74GGfeyJTmACdFGT8zCuYfpyy7SfT7NjNkLt.',
        SCOPE_IDENTITY(),
        (SELECT UserId FROM dbo.Users WHERE Email = 'dev.admin@example.local')
    );
END
GO

-- Link a dev login seeded before T_Login had a userid column.
UPDATE dbo.T_Login
SET userid = (SELECT UserId FROM dbo.Users WHERE Email = 'dev.admin@example.local')
WHERE username = N'dev' AND userid IS NULL;
GO
