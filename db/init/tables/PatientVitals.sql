IF OBJECT_ID(N'dbo.PatientVitals', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.PatientVitals (
        VitalId INT IDENTITY(1,1) PRIMARY KEY,
        PatientId INT NOT NULL REFERENCES dbo.Patients(PatientId),
        RecordedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        BloodPressure NVARCHAR(40) NULL,
        HeartRate INT NULL,
        RespiratoryRate INT NULL,
        TemperatureC DECIMAL(5,2) NULL,
        OxygenSaturation DECIMAL(5,2) NULL,
        HeightCm DECIMAL(7,2) NULL,
        WeightKg DECIMAL(7,2) NULL
    );
END
GO
