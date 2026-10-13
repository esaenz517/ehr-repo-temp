IF NOT EXISTS (
    SELECT * FROM sys.tables
    WHERE name = 'BillingCharges'
)
BEGIN
    CREATE TABLE dbo.BillingCharges (
        ChargeId INT IDENTITY(1,1) PRIMARY KEY,

        PatientId INT NOT NULL,

        ChargeSummary NVARCHAR(500) NOT NULL,

        ChargeAmount DECIMAL(10,2) NOT NULL,

        CONSTRAINT FK_BillingCharges_Patients
            FOREIGN KEY (PatientId)
            REFERENCES dbo.Patients(PatientId)
    );
END
GO
