-- DUO PENDING TABLE
-- A password check that passed and is waiting on Duo two-factor. POST /auth/login
-- adds a row and sends the browser to Duo; GET /auth/duo/callback looks it up by
-- the OIDC state Duo hands back, deletes it, and only then creates the session.
-- Only the SHA-256 hash of the state is stored. Rows expire after a few minutes.
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DuoPending')
BEGIN
    CREATE TABLE dbo.DuoPending (
        DuoPendingId INT IDENTITY(1,1) PRIMARY KEY,
        StateHash    CHAR(64) NOT NULL UNIQUE,
        Username     NVARCHAR(254) NOT NULL
                     REFERENCES dbo.T_Login(username) ON DELETE CASCADE,
        CreatedAt    DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        ExpiresAt    DATETIME2 NOT NULL
    );
END
GO
