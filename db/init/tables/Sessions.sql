-- SESSIONS TABLE
-- One row per signed-in browser. The browser holds a random token in an
-- HttpOnly cookie; only its SHA-256 hash is stored here, so a leaked table
-- can't be used to sign in. Rows are deleted on logout.
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Sessions')
BEGIN
    CREATE TABLE dbo.Sessions (
        SessionId   INT IDENTITY(1,1) PRIMARY KEY,
        TokenHash   CHAR(64) NOT NULL UNIQUE,
        Username    NVARCHAR(254) NOT NULL
                    REFERENCES dbo.T_Login(username) ON DELETE CASCADE,
        CreatedAt   DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        LastSeenAt  DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), -- for the idle timeout
        ExpiresAt   DATETIME2 NOT NULL                           -- absolute cutoff
    );
END
GO
