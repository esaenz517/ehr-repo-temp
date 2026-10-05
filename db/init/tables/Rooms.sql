-- ROOMS TABLE
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Rooms')
BEGIN
    CREATE TABLE dbo.Rooms (
        RoomId      INT IDENTITY(1,1) PRIMARY KEY,
        RoomNumber  INT  NOT NULL UNIQUE,
        Unit        NVARCHAR(100)  NULL, --Verify requirements to see the units that will be used
        --RoomType    NVARCHAR(100)  NULL, --Verify requirements to see how to label rooms types based on inpatient or outpatient
        Status       NVARCHAR(20)  NOT NULL DEFAULT 'available'
                     CHECK (Status IN ('available', 'occupied'))
    );
END
GO

-- ROOMS DATA
IF NOT EXISTS (SELECT * FROM dbo.Rooms)
BEGIN
    INSERT INTO dbo.Rooms (RoomNumber, Unit, Status) VALUES
        (100, 'General',    'available'),
        (101, 'General',    'available'),
        (102, 'ICU',        'available'),
        (103, 'ICU',        'available'),
        (104, 'Pediatrics', 'available'),
        (105, 'Pediatrics', 'available');
END
GO
