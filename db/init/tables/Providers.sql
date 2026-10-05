-- PROVIDERS TABLE (a patient's medical provider)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Providers')
BEGIN
    CREATE TABLE dbo.Providers (
        ProviderId INT IDENTITY(1,1) PRIMARY KEY,
        FirstName  NVARCHAR(100) NOT NULL,
        LastName   NVARCHAR(100) NOT NULL,
        Specialty  NVARCHAR(100) NULL,
        Phone      NVARCHAR(20) NULL,
        Email      NVARCHAR(200) NULL
    );
END
GO

IF NOT EXISTS (SELECT * FROM dbo.Providers)
BEGIN
    INSERT INTO dbo.Providers (FirstName, LastName, Specialty, Phone, Email) VALUES
        ('Susan', 'Lee',     'Cardiology',        '555-0101', 'susan.lee@clinic.example'),
        ('Mark',  'Feldman', 'Internal Medicine', '555-0102', 'mark.feldman@clinic.example'),
        ('Priya', 'Rao',     'Pediatrics',        '555-0103', 'priya.rao@clinic.example');
END
GO
