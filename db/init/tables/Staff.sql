-- STAFF TABLE
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Staff' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.Staff (
        StaffId    INT IDENTITY(1,1) PRIMARY KEY,
        FirstName    NVARCHAR(100) NOT NULL,
        MiddleName   NVARCHAR(100) NULL,
        LastName     NVARCHAR(100) NOT NULL,
        Specialization  NVARCHAR(100) NOT NULL,
        Student      BIT  NOT NULL DEFAULT 0,
        Admin        BIT  NOT NULL DEFAULT 0
    );
END
GO

-- STAFF DATA
IF NOT EXISTS (SELECT * FROM dbo.Staff)
BEGIN
    -- StaffId is IDENTITY, so let SQL Server assign it
    INSERT INTO dbo.Staff
        (FirstName, MiddleName, LastName, Specialization, Student, Admin)
    VALUES
        (N'Emily',  NULL, N'Carter', N'Nursing',        0, 0),
        (N'Daniel', N'J', N'Brooks', N'Physician',      0, 0),
        (N'Sophia', NULL, N'Nguyen', N'Nursing',        1, 0),
        (N'Alex',   NULL, N'Morgan', N'Administration', 0, 1);
END
GO
