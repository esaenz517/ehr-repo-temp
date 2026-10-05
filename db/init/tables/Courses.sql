--Course Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Courses')
BEGIN
    CREATE TABLE dbo.Courses (
        CourseId      INT IDENTITY(1,1) PRIMARY KEY,
        SubjectCode   NVARCHAR(10)  NOT NULL,          -- 'PHAR', 'IHS'
        CourseNumber  NVARCHAR(10)  NOT NULL,          -- '5310'
        Title         NVARCHAR(200) NOT NULL,          -- 'Pharmacotherapy I'
        Term          NVARCHAR(10)  NOT NULL,          -- 'Fall', 'Spring', 'Summer'
        TermYear      INT           NOT NULL,          -- 2026
        IsActive      BIT           NOT NULL DEFAULT 1, -- hide past terms from the student dropdown
        CreatedAt     DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),

        CONSTRAINT CK_Courses_Term
            CHECK (Term IN ('Fall', 'Spring', 'Summer')),

        CONSTRAINT UQ_Courses_Offering
            UNIQUE (SubjectCode, CourseNumber, Term, TermYear)
    );
END
GO

IF NOT EXISTS (SELECT * FROM dbo.Courses)
BEGIN
    INSERT INTO dbo.Courses (SubjectCode, CourseNumber, Title, Term, TermYear, IsActive) VALUES
        (N'PHAR', N'5310', N'Pharmacotherapy I',                       N'Fall',   2026, 1),
        (N'IHS',  N'5100', N'Interprofessional Case Lab',              N'Fall',   2026, 1),
        (N'PHAR', N'5320', N'Pharmacotherapy II',                      N'Fall',   2026, 1),
        (N'PHAR', N'6150', N'Medication Therapy Management',           N'Fall',   2026, 1),
        (N'NURS', N'3310', N'Adult Health Nursing I',                  N'Fall',   2026, 1),
        (N'OT',   N'5150', N'Occupational Therapy Evaluation',         N'Fall',   2026, 1);
END
GO
