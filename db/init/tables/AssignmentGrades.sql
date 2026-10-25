-- Assignment grade storage and progress timestamps.
-- Run after Assignment.sql and Staff.sql.

-- Track when each assignment was created.
IF COL_LENGTH('dbo.Assignment', 'AssignedAt') IS NULL
BEGIN
    ALTER TABLE dbo.Assignment
    ADD AssignedAt DATETIME2 NOT NULL
        CONSTRAINT DF_Assignment_AssignedAt
        DEFAULT SYSUTCDATETIME() WITH VALUES;
END
GO

-- One grade record per student assignment.
IF OBJECT_ID(N'dbo.AssignmentGrades', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AssignmentGrades (
        AssignmentId INT NOT NULL PRIMARY KEY,

        AdjustmentPoints DECIMAL(9,2)
            NOT NULL DEFAULT (0),

        AdjustmentReason NVARCHAR(500) NULL,

        GradedByStaffId INT NOT NULL
            REFERENCES dbo.Staff(StaffId),

        UpdatedAt DATETIME2 NOT NULL
            DEFAULT SYSUTCDATETIME(),

        PublishedAt DATETIME2 NULL,

        CONSTRAINT FK_AssignmentGrades_Assignment
            FOREIGN KEY (AssignmentId)
            REFERENCES dbo.Assignment(AssignmentId)
            ON DELETE CASCADE
    );
END
GO

-- Individual rubric criteria for an assignment grade.
IF OBJECT_ID(N'dbo.AssignmentGradeItems', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AssignmentGradeItems (
        GradeItemId INT IDENTITY(1,1) PRIMARY KEY,

        AssignmentId INT NOT NULL,

        CriterionKey NVARCHAR(80) NOT NULL,

        Label NVARCHAR(200) NOT NULL,

        PossiblePoints DECIMAL(9,2) NOT NULL
            CHECK (PossiblePoints > 0),

        EarnedPoints DECIMAL(9,2) NOT NULL,

        Comment NVARCHAR(500) NULL,

        SortOrder INT NOT NULL,

        -- Table-level because it compares two columns (a column CHECK can't).
        CONSTRAINT CK_AssignmentGradeItems_EarnedPoints
            CHECK (
                EarnedPoints >= 0
                AND EarnedPoints <= PossiblePoints
            ),

        CONSTRAINT UQ_AssignmentGradeItems_Key
            UNIQUE (AssignmentId, CriterionKey),

        CONSTRAINT FK_AssignmentGradeItems_Grade
            FOREIGN KEY (AssignmentId)
            REFERENCES dbo.AssignmentGrades(AssignmentId)
            ON DELETE CASCADE
    );
END
GO