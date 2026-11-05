-- PATIENT DRUGS TABLE (many-to-many: the drugs a patient may take)
CREATE TABLE IF NOT EXISTS dbo.PatientDrugs (
    PatientId INT NOT NULL REFERENCES dbo.Patients(PatientId) ON DELETE CASCADE,
    DrugId    INT NOT NULL REFERENCES dbo.Drugs(DrugId) ON DELETE CASCADE,
    Dosage    VARCHAR(100) NULL,
    Route     VARCHAR(20) NULL,
    Frequency VARCHAR(50) NULL,
    CONSTRAINT PK_PatientDrugs PRIMARY KEY (PatientId, DrugId)
);

-- Seed data below assumes a fresh database where the patients/drugs above got ids 1-6 / 1-5.
DO $seed$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM dbo.PatientDrugs) THEN
        INSERT INTO dbo.PatientDrugs (PatientId, DrugId, Dosage) VALUES
            (1, 1, '10mg daily'),
            (1, 3, '20mg nightly'),
            (2, 2, '500mg twice daily'),
            (4, 4, '2 puffs as needed'),
            (5, 1, '10mg daily'),
            (5, 2, '500mg twice daily'),
            (6, 3, '20mg nightly');
    END IF;
END
$seed$;
