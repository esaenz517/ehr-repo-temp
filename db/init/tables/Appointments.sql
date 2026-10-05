-- APPOINTMENTS TABLE
IF NOT EXISTS (
    SELECT * FROM sys.tables
    WHERE name = 'Appointments'
)
BEGIN
    CREATE TABLE dbo.Appointments (
        AppointmentId INT IDENTITY(1,1) PRIMARY KEY,

        PatientId INT NOT NULL,

        AppointmentDateTime DATETIME2 NOT NULL,

        Location NVARCHAR(200) NOT NULL,

        Status NVARCHAR(50) NOT NULL
            DEFAULT 'scheduled'
            CHECK (Status IN (
                'scheduled',
                'completed',
                'cancelled'
            )),

        CONSTRAINT FK_Appointments_Patients
            FOREIGN KEY (PatientId)
            REFERENCES dbo.Patients(PatientId)
    );
END
GO
