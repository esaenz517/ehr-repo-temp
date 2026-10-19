IF OBJECT_ID(N'dbo.NoteAuditEvents', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.NoteAuditEvents (
        AuditEventId INT IDENTITY(1,1) PRIMARY KEY,

        NoteId INT NOT NULL
            REFERENCES dbo.ClinicalNotes(NoteId),

        ActorUserId INT NOT NULL
            REFERENCES dbo.Users(UserId),

        Action NVARCHAR(50) NOT NULL,

        AddendumId INT NULL
            REFERENCES dbo.NoteAddenda(AddendumId),

        Details NVARCHAR(1000) NULL,

        CreatedAt DATETIME2 NOT NULL
            DEFAULT SYSUTCDATETIME(),

        CONSTRAINT CK_NoteAuditEvents_Action
            CHECK (Action IN (
                'note_created',
                'note_updated',
                'note_approved',
                'addendum_created',
                'note_archived'
            ))
    );

    CREATE INDEX IX_NoteAuditEvents_Note
        ON dbo.NoteAuditEvents(NoteId, CreatedAt);
END
GO