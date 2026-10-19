-- Case Rubric Tables (must be initialized after Cases and Assignment)

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'CaseRubricItems' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.CaseRubricItems (
        RubricItemId INT IDENTITY(1,1) PRIMARY KEY,
        CaseId       INT NOT NULL REFERENCES dbo.Cases(CaseId) ON DELETE CASCADE,
        Category     NVARCHAR(30) NOT NULL DEFAULT 'other'
                     CHECK (Category IN ('diagnosis', 'medication_conflict', 'screening', 'trap', 'other')),
        Label        NVARCHAR(300) NOT NULL,   -- shown to the student after sign-off
        Points       INT NOT NULL CHECK (Points > 0),
        Guidance     NVARCHAR(1000) NULL,      -- instructor-only: what counts for full credit
        SortOrder    INT NOT NULL DEFAULT 0
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AssignmentRubricScores' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.AssignmentRubricScores (
        AssignmentId  INT NOT NULL REFERENCES dbo.Assignment(AssignmentId),
        RubricItemId  INT NOT NULL REFERENCES dbo.CaseRubricItems(RubricItemId) ON DELETE CASCADE,
        PointsAwarded INT NOT NULL CHECK (PointsAwarded >= 0), -- the API also caps it at the item's Points
        Comment       NVARCHAR(1000) NULL,
        ScoredAt      DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_AssignmentRubricScores PRIMARY KEY (AssignmentId, RubricItemId)
    );
END
GO