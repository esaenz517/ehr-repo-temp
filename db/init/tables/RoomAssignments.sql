-- ROOM ASSIGNMENTS TABLE (Auditing Purposes, might discard later) (No seed data for the moment)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'RoomAssignments')
BEGIN
    CREATE TABLE dbo.RoomAssignments (
        AssignmentId INT IDENTITY(1,1) PRIMARY KEY,
        RoomId       INT NOT NULL REFERENCES dbo.Rooms(RoomId), --Foreign key to Rooms table
        PatientId    INT NOT NULL REFERENCES dbo.Patients(PatientId), --Foreign key to Patients table
        AssignedAt   DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        DischargedAt DATETIME2 NULL --NULL means patient is still assigned to the room
    );
END 
GO
