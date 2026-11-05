--Course Table
-- Each course offering belongs to one department (shared courses belong to IHS).
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Courses')
BEGIN
    CREATE TABLE dbo.Courses (
        CourseId      INT IDENTITY(1,1) PRIMARY KEY,
        SubjectCode   NVARCHAR(10)  NOT NULL,          -- 'PHAR', 'IHS'
        CourseNumber  NVARCHAR(10)  NOT NULL,          -- '5310'
        Title         NVARCHAR(200) NOT NULL,          -- 'Pharmacotherapy I'
        Term          NVARCHAR(10)  NOT NULL,          -- 'Fall', 'Spring', 'Summer'
        TermYear      INT           NOT NULL,          -- 2026
        DepartmentId  INT           NOT NULL
            CONSTRAINT FK_Courses_Departments REFERENCES dbo.Departments(DepartmentId),
        IsActive      BIT           NOT NULL DEFAULT 1, -- hide past terms from the student dropdown
        CreatedAt     DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),

        CONSTRAINT CK_Courses_Term
            CHECK (Term IN ('Fall', 'Spring', 'Summer')),

        CONSTRAINT UQ_Courses_Offering
            UNIQUE (SubjectCode, CourseNumber, Term, TermYear)
    );
END
GO

-- Older databases had no DepartmentId: take it from the subject code, else IHS.
IF COL_LENGTH('dbo.Courses', 'DepartmentId') IS NULL
BEGIN
    ALTER TABLE dbo.Courses ADD DepartmentId INT NULL;

    EXEC (N'
        UPDATE c
        SET DepartmentId = COALESCE(
            (SELECT d.DepartmentId FROM dbo.Departments d WHERE d.Code = c.SubjectCode),
            (SELECT d.DepartmentId FROM dbo.Departments d WHERE d.Code = N''IHS'')
        )
        FROM dbo.Courses c;

        ALTER TABLE dbo.Courses ALTER COLUMN DepartmentId INT NOT NULL;

        ALTER TABLE dbo.Courses
        ADD CONSTRAINT FK_Courses_Departments
            FOREIGN KEY (DepartmentId) REFERENCES dbo.Departments(DepartmentId);
    ');
END
GO

-- COURSE DATA: each course's department comes from its subject code
INSERT INTO dbo.Courses (SubjectCode, CourseNumber, Title, Term, TermYear, DepartmentId, IsActive)
SELECT c.SubjectCode, c.CourseNumber, c.Title, c.Term, c.TermYear, d.DepartmentId, c.IsActive
FROM (
    VALUES
        (N'PHAR', N'5310', N'Pharmacotherapy I',               N'Fall',   2026, 1),
        (N'IHS',  N'5100', N'Interprofessional Case Lab',      N'Fall',   2026, 1),
        (N'PHAR', N'5320', N'Pharmacotherapy II',              N'Fall',   2026, 1),
        (N'PHAR', N'6150', N'Medication Therapy Management',   N'Fall',   2026, 1),
        (N'NURS', N'3310', N'Adult Health Nursing I',          N'Fall',   2026, 1),
        (N'OT',   N'5150', N'Occupational Therapy Evaluation', N'Fall',   2026, 1),
        (N'PT',   N'6210', N'Musculoskeletal Rehabilitation',  N'Fall',   2026, 1),
        (N'PHAR', N'5310', N'Pharmacotherapy I',               N'Spring', 2026, 0)
) AS c (SubjectCode, CourseNumber, Title, Term, TermYear, IsActive)
JOIN dbo.Departments d ON d.Code = c.SubjectCode
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.Courses x
    WHERE x.SubjectCode = c.SubjectCode AND x.CourseNumber = c.CourseNumber
      AND x.Term = c.Term AND x.TermYear = c.TermYear
);
GO
