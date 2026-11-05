-- LOGIN TABLE
CREATE TABLE IF NOT EXISTS dbo.T_Login (
    username      VARCHAR(254) NOT NULL PRIMARY KEY,
    password_hash VARCHAR(100) NOT NULL, -- bcrypt hash
    staffid       INT NOT NULL UNIQUE REFERENCES dbo.Staff(StaffId), -- cases and assignments
    userid        INT NULL,                                          -- roles and permissions

    CONSTRAINT FK_T_Login_Users
        FOREIGN KEY (userid) REFERENCES dbo.Users(UserId)
);

-- DEV LOGIN SEED: Staff member plus login "dev" / "dev123", linked to the development admin user.
-- Stored in lowercase: Postgres compares text case-sensitively (SQL Server doesn't).
DO $seed$
DECLARE
    new_staff_id INT;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM dbo.T_Login WHERE lower(username) = 'dev') THEN
        INSERT INTO dbo.Staff (FirstName, MiddleName, LastName, Specialization, Student, Admin)
        VALUES ('Dev', NULL, 'User', 'Development', TRUE, TRUE)
        RETURNING StaffId INTO new_staff_id;

        INSERT INTO dbo.T_Login (username, password_hash, staffid, userid)
        VALUES (
            'dev',
            '$2b$12$JiMOYxRva65eUaBh74GGfeyJTmACdFGT8zCuYfpyy7SfT7NjNkLt.',
            new_staff_id,
            (SELECT UserId FROM dbo.Users WHERE Email = 'dev.admin@example.local')
        );
    END IF;
END
$seed$;
