-- One row per deletion attempt: every DELETE request the API receives (whatever
-- its outcome) plus confirmations the user cancelled in the browser.
-- ActorUserId/ActorUsername have no foreign keys on purpose, so the log row is
-- always written, even for unknown users or after an account is removed.
IF OBJECT_ID(N'dbo.DeletionAuditLog', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.DeletionAuditLog (
        DeletionAuditId INT IDENTITY(1,1) PRIMARY KEY,
        OccurredAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        ActorUserId INT NULL,
        ActorUsername NVARCHAR(254) NULL,
        Resource NVARCHAR(200) NOT NULL,
        ResourceId NVARCHAR(100) NULL,
        RequestPath NVARCHAR(500) NOT NULL,
        Outcome NVARCHAR(20) NOT NULL,
        StatusCode INT NULL,
        ClientIp NVARCHAR(64) NULL,
        Details NVARCHAR(1000) NULL,

        CONSTRAINT CK_DeletionAuditLog_Outcome
            CHECK (Outcome IN (
                'deleted',
                'cancelled',
                'denied',
                'not_found',
                'conflict',
                'rejected',
                'error'
            ))
    );

    CREATE INDEX IX_DeletionAuditLog_OccurredAt
        ON dbo.DeletionAuditLog(OccurredAt);

    CREATE INDEX IX_DeletionAuditLog_Resource
        ON dbo.DeletionAuditLog(Resource, ResourceId);
END
GO