-- ITEMS TABLE (TEMPLATE)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Items')
BEGIN
    CREATE TABLE dbo.Items (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Name NVARCHAR(200) NOT NULL,
        Description NVARCHAR(1000) NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END
GO

IF NOT EXISTS (SELECT * FROM dbo.Items)
BEGIN
    INSERT INTO dbo.Items (Name, Description) VALUES
        (N'First Item', N'This row was seeded by init.sql'),
        (N'Second Item', N'Edit db/init/init.sql to change seed data');
END
GO
