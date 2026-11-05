-- COURSE ENROLLMENTS
-- Who is in which course offering: students and the instructors who teach it.
-- A person's role (dbo.Staff.RoleId) tells the two apart.
IF OBJECT_ID(N'dbo.CourseEnrollments', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.CourseEnrollments (
        CourseId   INT NOT NULL
            CONSTRAINT FK_CourseEnrollments_Courses REFERENCES dbo.Courses(CourseId) ON DELETE CASCADE,
        StaffId    INT NOT NULL
            CONSTRAINT FK_CourseEnrollments_Staff REFERENCES dbo.Staff(StaffId) ON DELETE CASCADE,
        EnrolledAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

        CONSTRAINT PK_CourseEnrollments PRIMARY KEY (CourseId, StaffId)
    );
END
GO
