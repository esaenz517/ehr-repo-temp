IF OBJECT_ID(N'dbo.NoteVersions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.NoteVersions (
        VersionId INT IDENTITY(1,1) PRIMARY KEY,
        NoteId INT NOT NULL REFERENCES dbo.ClinicalNotes(NoteId),
        VersionNumber INT NOT NULL,
        ContentSnapshot NVARCHAR(MAX) NOT NULL,
        AuthorUserId INT NOT NULL REFERENCES dbo.Users(UserId),
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        ChangeSummary NVARCHAR(500) NULL,
        CONSTRAINT UQ_NoteVersions_NoteVersion
            UNIQUE (NoteId, VersionNumber)
    );
END
GO
