-- CHECK-INS
-- The front desk queue. A patient is checked in (for one of today's appointments,
-- or as a walk-in / newly registered patient with no appointment), waits, is put
-- in a room, and is discharged. Only a 'waiting' check-in can be given a room.
--   waiting   -> checked in, no room yet
--   roomed    -> in a room (RoomAssignmentId is set)
--   done      -> discharged, room freed
--   cancelled -> left before getting a room
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'CheckIns')
BEGIN
    CREATE TABLE dbo.CheckIns (
        CheckInId        INT IDENTITY(1,1) PRIMARY KEY,
        PatientId        INT NOT NULL REFERENCES dbo.Patients(PatientId),
        AppointmentId    INT NULL REFERENCES dbo.Appointments(AppointmentId), -- NULL for walk-ins
        RoomAssignmentId INT NULL REFERENCES dbo.RoomAssignments(AssignmentId),
        Status           NVARCHAR(20) NOT NULL DEFAULT 'waiting'
                         CHECK (Status IN ('waiting', 'roomed', 'done', 'cancelled')),
        CheckedInAt      DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CheckedOutAt     DATETIME2 NULL,
        CheckedInBy      INT NULL REFERENCES dbo.Staff(StaffId)
    );
END
GO
