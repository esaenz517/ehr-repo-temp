-- ASSIGNMENT TABLE (must be initialized after the Cases, Encounters, and Courses tables)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Assignment' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.Assignment (
        AssignmentId    INT IDENTITY(1,1) PRIMARY KEY,
        CaseId          INT NOT NULL REFERENCES dbo.Cases(CaseId), 
        EncounterStatus NVARCHAR(20) NOT NULL DEFAULT 'not_started'
                        CHECK (EncounterStatus IN ('not_started', 'in_progress', 'submitted', 'signed')),
        -- not_started: encounter assigned, student has not opened the encounter
        -- in_progress: student has opened the encounter, is working on it, or instructor has kicked back the submission for re-work
        -- submitted: student has completed encounter and submitted it for review
        -- signed: instructor has reviewed student's work and signed off on it (not kicked back for re-work)
        CourseId        INT NULL CONSTRAINT FK_Assignment_Courses REFERENCES dbo.Courses(CourseId),
        DueDate         DATETIME2 NULL, --May not have due dates
        AssignmentType  NVARCHAR(10) NOT NULL DEFAULT 'graded'
                        CHECK(AssignmentType IN ('practice', 'graded')),
        -- practice: ungraded assignment, does not contribute to cumulative GPA
        -- graded: assignment contributes to cumulative GPA
        AssignedTo      INT NOT NULL REFERENCES dbo.Staff(StaffId), 
        AssignedBy      INT NOT NULL REFERENCES dbo.Staff(StaffId) 
    );
END
GO

-- The encounter a student documents this assignment in. Set when the student starts the case.
IF COL_LENGTH('dbo.Assignment', 'EncounterId') IS NULL
BEGIN
    ALTER TABLE dbo.Assignment
    ADD EncounterId INT NULL REFERENCES dbo.Encounters(EncounterId);
END
GO

--Instructor feedback on submitted work
IF COL_LENGTH('dbo.assignment', 'Feedback') IS NULL
BEGIN
    ALTER TABLE dbo.Assignment
    ADD Feedback NVARCHAR(MAX) NULL;
END
GO

-- Instructor Feedback logging
IF COL_LENGTH('dbo.assignment', 'FeedbackUpdatedAt') IS NULL
BEGIN
    ALTER TABLE dbo.Assignment
    ADD FeedbackUpdatedAt DATETIME2 NULL;
END
GO
GO

-- Older databases stored the course as free text (Assignment.Course). Link each
-- row to the matching course ("PHAR 5310" or the course title), newest term first,
-- then drop the text column.
IF COL_LENGTH('dbo.Assignment', 'CourseId') IS NULL
BEGIN
    ALTER TABLE dbo.Assignment
    ADD CourseId INT NULL CONSTRAINT FK_Assignment_Courses REFERENCES dbo.Courses(CourseId);
END
GO

IF COL_LENGTH('dbo.Assignment', 'Course') IS NOT NULL
BEGIN
    EXEC (N'
        UPDATE a
        SET CourseId = (
            SELECT TOP 1 c.CourseId
            FROM dbo.Courses c
            WHERE LTRIM(RTRIM(a.Course)) IN (c.SubjectCode + N'' '' + c.CourseNumber, c.Title)
            ORDER BY c.TermYear DESC, c.IsActive DESC, c.CourseId DESC
        )
        FROM dbo.Assignment a
        WHERE a.CourseId IS NULL AND a.Course IS NOT NULL;

        ALTER TABLE dbo.Assignment DROP COLUMN Course;
    ');
END
GO
