-- NOTE ACCESS LOG
-- One row per request that touches a clinical note: list, create, read, update,
-- archive, versions, addenda, assignment note views, submit and sign-off, and
-- views of this log itself. Successful and refused requests logged, so the log
-- also holds unauthorized access attempts (not signed in, no permission, not
-- the author) and requests for notes that don't exist.
-- Written by app.security.note_access_middleware; read only by admins
-- (permission audit.read) through GET /audit/note-access. Nothing in the API
-- updates or deletes these rows.
-- Flagged marks a red-flag row: a refused or unauthenticated attempt on a
-- restricted (mental health) note: psychiatry, psychotherapy or SUD.
-- Actor, note and patient ids have no foreign keys on purpose, so a row is
-- always written: for unknown users, missing notes, and after records change.
IF OBJECT_ID(N'dbo.NoteAccessLog', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.NoteAccessLog (
        NoteAccessLogId INT IDENTITY(1,1) PRIMARY KEY,
        OccurredAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

        ActorUserId INT NULL,
        ActorUsername NVARCHAR(254) NULL,
        ActorRole NVARCHAR(50) NULL,

        Action NVARCHAR(30) NOT NULL,
        Outcome NVARCHAR(20) NOT NULL,
        StatusCode INT NULL,

        NoteId INT NULL,
        PatientId INT NULL,
        NoteType NVARCHAR(100) NULL,

        Method NVARCHAR(10) NOT NULL,
        RequestPath NVARCHAR(500) NOT NULL,
        ClientIp NVARCHAR(64) NULL,
        Details NVARCHAR(1000) NULL,
        Flagged BIT NOT NULL CONSTRAINT DF_NoteAccessLog_Flagged DEFAULT 0,

        CONSTRAINT CK_NoteAccessLog_Outcome
            CHECK (Outcome IN (
                'success',
                'unauthenticated',
                'denied',
                'not_found',
                'conflict',
                'invalid',
                'error'
            ))
    );

    CREATE INDEX IX_NoteAccessLog_OccurredAt
        ON dbo.NoteAccessLog(OccurredAt);

    CREATE INDEX IX_NoteAccessLog_Note
        ON dbo.NoteAccessLog(NoteId, OccurredAt);

    CREATE INDEX IX_NoteAccessLog_Patient
        ON dbo.NoteAccessLog(PatientId, OccurredAt);

    CREATE INDEX IX_NoteAccessLog_Actor
        ON dbo.NoteAccessLog(ActorUserId, OccurredAt);

    CREATE INDEX IX_NoteAccessLog_Flagged
        ON dbo.NoteAccessLog(Flagged, OccurredAt);
END
GO
