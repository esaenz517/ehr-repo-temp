-- LOGIN TABLE
-- Sign-in credentials. Each login belongs to one account (dbo.Users); the
-- person behind the account is the dbo.Staff row with the same UserId.
CREATE TABLE IF NOT EXISTS dbo.T_Login (
    username      VARCHAR(254) NOT NULL PRIMARY KEY,
    password_hash VARCHAR(100) NOT NULL, -- bcrypt hash
    userid        INT NOT NULL,

    CONSTRAINT FK_T_Login_Users
        FOREIGN KEY (userid) REFERENCES dbo.Users(UserId)
);

-- DEV LOGIN SEED: "dev" / "dev123", an ADMIN with the development admin account.
-- Stored in lowercase: Postgres compares text case-sensitively (SQL Server doesn't).
DO $seed$
DECLARE
    dev_user_id INT;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM dbo.T_Login WHERE lower(username) = 'dev') THEN
        SELECT UserId INTO dev_user_id FROM dbo.Users WHERE Email = 'dev.admin@example.local';

        IF NOT EXISTS (SELECT 1 FROM dbo.Staff WHERE UserId = dev_user_id) THEN
            INSERT INTO dbo.Staff (UserId, FirstName, MiddleName, LastName, RoleId)
            SELECT dev_user_id, 'Dev', NULL, 'User', RoleId
            FROM dbo.Roles WHERE RoleName = 'ADMIN';
        END IF;

        INSERT INTO dbo.T_Login (username, password_hash, userid)
        VALUES ('dev', '$2b$12$JiMOYxRva65eUaBh74GGfeyJTmACdFGT8zCuYfpyy7SfT7NjNkLt.', dev_user_id);
    END IF;
END
$seed$;
