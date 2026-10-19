IF OBJECT_ID(N'dbo.NoteAddenda', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.NoteAddenda (
        AddendumId INT IDENTITY(1,1) PRIMARY KEY,

        NoteId INT NOT NULL
            REFERENCES dbo.ClinicalNotes(NoteId),

        AuthorUserId INT NOT NULL
            REFERENCES dbo.Users(UserId),

        Content NVARCHAR(MAX) NOT NULL,

        CreatedAt DATETIME2 NOT NULL
            DEFAULT SYSUTCDATETIME(),

        CONSTRAINT CK_NoteAddenda_Content
            CHECK (LEN(LTRIM(RTRIM(Content))) > 0)
    );

    CREATE INDEX IX_NoteAddenda_Note
        ON dbo.NoteAddenda(NoteId, CreatedAt);
END
GO