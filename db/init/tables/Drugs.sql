-- DRUGS TABLE (catalog of drugs that can be prescribed to patients)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Drugs')
BEGIN
    CREATE TABLE dbo.Drugs (
        DrugId      INT IDENTITY(1,1) PRIMARY KEY,
        Name        NVARCHAR(200) NOT NULL,
        Description NVARCHAR(1000) NULL
    );
END
GO

IF NOT EXISTS (SELECT * FROM dbo.Drugs)
BEGIN
    INSERT INTO dbo.Drugs (Name, Description) VALUES
        (N'Lisinopril',   N'ACE inhibitor used to treat high blood pressure'),
        (N'Metformin',    N'Used to control blood sugar in type 2 diabetes'),
        (N'Atorvastatin', N'Statin used to lower cholesterol'),
        (N'Albuterol',    N'Bronchodilator used to treat asthma'),
        (N'Amoxicillin',  N'Penicillin-type antibiotic');
END
GO
