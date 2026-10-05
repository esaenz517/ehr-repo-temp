-- ASSIGNMENT TABLE (must be initialized after CASE Table)
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
        Course          NVARCHAR(100) NULL,
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
