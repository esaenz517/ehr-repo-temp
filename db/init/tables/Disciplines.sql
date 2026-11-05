-- DISCIPLINES
-- The kind of clinician a person acts as inside a chart (dbo.Staff.DisciplineId).
-- DepartmentId is the department that usually trains the discipline; it is NULL
-- for disciplines with no department of their own at the university.
-- Names match the old free-text Staff.Specialization values so older data maps over.
IF OBJECT_ID(N'dbo.Disciplines', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Disciplines (
        DisciplineId INT IDENTITY(1,1) PRIMARY KEY,
        Code         NVARCHAR(50)  NOT NULL CONSTRAINT UQ_Disciplines_Code UNIQUE,
        Name         NVARCHAR(150) NOT NULL CONSTRAINT UQ_Disciplines_Name UNIQUE,
        DepartmentId INT NULL
            CONSTRAINT FK_Disciplines_Departments REFERENCES dbo.Departments(DepartmentId),
        IsActive     BIT NOT NULL DEFAULT 1
    );
END
GO

MERGE dbo.Disciplines AS target
USING (
    SELECT s.Code, s.Name, d.DepartmentId
    FROM (
        VALUES
            (N'PHARMACY',             N'Pharmacy',             N'PHAR'),
            (N'NURSE',                N'Nursing',              N'NURS'),
            (N'PHYSICAL_THERAPY',     N'Physical Therapy',     N'PT'),
            (N'OCCUPATIONAL_THERAPY', N'Occupational Therapy', N'OT'),
            (N'PHYSICIAN',            N'Physician',            NULL),
            (N'PSYCHIATRY',           N'Psychiatry',           NULL),
            (N'ALLIED_HEALTH',        N'Allied Health',        NULL)
    ) AS s (Code, Name, DepartmentCode)
    LEFT JOIN dbo.Departments d ON d.Code = s.DepartmentCode
) AS source
ON target.Code = source.Code
WHEN NOT MATCHED THEN
    INSERT (Code, Name, DepartmentId) VALUES (source.Code, source.Name, source.DepartmentId);
GO
