-- DEPARTMENTS
-- Academic departments. Each person (dbo.Staff) and each course (dbo.Courses)
-- belongs to one. Interprofessional courses belong to IHS.
IF OBJECT_ID(N'dbo.Departments', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Departments (
        DepartmentId INT IDENTITY(1,1) PRIMARY KEY,
        Code         NVARCHAR(10)  NOT NULL CONSTRAINT UQ_Departments_Code UNIQUE,
        Name         NVARCHAR(150) NOT NULL,
        IsActive     BIT           NOT NULL DEFAULT 1
    );
END
GO

MERGE dbo.Departments AS target
USING (
    VALUES
        (N'PHAR', N'Pharmacy'),
        (N'NURS', N'Nursing'),
        (N'PT',   N'Physical Therapy'),
        (N'OT',   N'Occupational Therapy'),
        (N'IHS',  N'Interprofessional Health Sciences')
) AS source (Code, Name)
ON target.Code = source.Code
WHEN NOT MATCHED THEN
    INSERT (Code, Name) VALUES (source.Code, source.Name);
GO
