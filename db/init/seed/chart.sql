-- CHART SEED
-- Each demo patient's chart: medical and family history, allergies, vitals, and labs.
-- Kept in one file so a patient's story stays consistent with their case (seed/cases.sql)
-- and medications (tables/PatientDrugs.sql). Patients are looked up by Mrn.
-- Each row is inserted only if it is missing, so new lines can be added and db-init re-run.
--
-- MRN000003 has no allergies and no labs on purpose: the chart must show missing data
-- as "not recorded", never as "no known allergies" or a normal result.

-- MEDICAL HISTORY
INSERT INTO dbo.MedicalHistory (PatientId, Condition, DiagnosisDate, Notes)
SELECT p.PatientId, h.Condition, h.DiagnosisDate, h.Notes
FROM (
    VALUES
        ('MRN000001', N'Hypertension',          '2019-04-10', N'Managed with lisinopril'),
        ('MRN000001', N'High cholesterol',      '2020-08-22', N'Managed with atorvastatin'),
        ('MRN000002', N'Type 2 diabetes',       '2021-03-15', N'Takes metformin; reports missed doses'),
        ('MRN000003', N'Low back strain',       '2022-05-10', N'Previous episode, resolved with physical therapy'),
        ('MRN000004', N'Asthma',                '2008-06-01', N'Uses albuterol inhaler as needed'),
        ('MRN000005', N'Type 2 diabetes',       '2012-02-20', N'Takes metformin'),
        ('MRN000005', N'Hypertension',          '2015-09-05', N'Takes lisinopril'),
        ('MRN000005', N'Peripheral neuropathy', '2023-01-12', N'Reduced feeling in both feet'),
        ('MRN000006', N'High cholesterol',      '2024-03-18', N'Takes atorvastatin')
) AS h (Mrn, Condition, DiagnosisDate, Notes)
JOIN dbo.Patients p ON p.Mrn = h.Mrn
WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.MedicalHistory x
    WHERE x.PatientId = p.PatientId AND x.Condition = h.Condition
);
GO

-- FAMILY HISTORY
INSERT INTO dbo.FamilyHistory (PatientId, Relationship, Condition, Notes)
SELECT p.PatientId, f.Relationship, f.Condition, f.Notes
FROM (
    VALUES
        ('MRN000001', N'Father',  N'Heart attack',        N'At age 55'),
        ('MRN000001', N'Mother',  N'Type 2 diabetes',     NULL),
        ('MRN000002', N'Mother',  N'Type 2 diabetes',     NULL),
        ('MRN000002', N'Father',  N'High blood pressure', NULL),
        ('MRN000003', N'Father',  N'Osteoarthritis',      NULL),
        ('MRN000004', N'Mother',  N'Asthma',              NULL),
        ('MRN000005', N'Brother', N'Type 2 diabetes',     NULL),
        ('MRN000005', N'Mother',  N'Stroke',              N'At age 70'),
        ('MRN000006', N'Mother',  N'Depression',          NULL),
        ('MRN000006', N'Sister',  N'Anxiety',             NULL)
) AS f (Mrn, Relationship, Condition, Notes)
JOIN dbo.Patients p ON p.Mrn = f.Mrn
WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.FamilyHistory x
    WHERE x.PatientId = p.PatientId AND x.Relationship = f.Relationship AND x.Condition = f.Condition
);
GO

-- ALLERGIES (none for MRN000003, see above)
INSERT INTO dbo.PatientAllergies (PatientId, Substance, Reaction)
SELECT p.PatientId, a.Substance, a.Reaction
FROM (
    VALUES
        ('MRN000001', N'Penicillin',  N'Hives'),
        ('MRN000002', N'Sulfa drugs', N'Rash'),
        ('MRN000004', N'Aspirin',     N'Wheezing'),
        ('MRN000004', N'Dust mites',  N'Sneezing and wheezing'),
        ('MRN000005', N'Latex',       N'Skin rash'),
        ('MRN000006', N'Codeine',     N'Nausea and vomiting')
) AS a (Mrn, Substance, Reaction)
JOIN dbo.Patients p ON p.Mrn = a.Mrn
WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.PatientAllergies x
    WHERE x.PatientId = p.PatientId AND x.Substance = a.Substance
);
GO

-- VITALS: one reading per patient, around the time of their case
INSERT INTO dbo.PatientVitals
    (PatientId, RecordedAt, BloodPressure, HeartRate, RespiratoryRate, TemperatureC, OxygenSaturation, HeightCm, WeightKg)
SELECT p.PatientId, v.RecordedAt, v.BloodPressure, v.HeartRate, v.RespiratoryRate, v.TemperatureC, v.OxygenSaturation, v.HeightCm, v.WeightKg
FROM (
    VALUES
        ('MRN000001', '2026-10-01T09:15:00', N'148/92',  88, 18, 36.8, 98, 178, 92),
        ('MRN000002', '2026-10-02T06:00:00', N'118/76', 104, 20, 37.0, 97, 163, 84),
        ('MRN000003', '2026-10-03T10:00:00', N'128/82',  76, 16, 36.7, 99, 175, 81),
        ('MRN000004', '2026-10-04T08:00:00', N'122/78',  96, 22, 36.9, 94, 168, 61),
        ('MRN000005', '2026-10-03T07:00:00', N'152/88',  98, 18, 38.3, 96, 180, 101),
        ('MRN000006', '2026-10-02T14:00:00', N'124/80',  82, 16, 36.6, 99, 160, 58)
) AS v (Mrn, RecordedAt, BloodPressure, HeartRate, RespiratoryRate, TemperatureC, OxygenSaturation, HeightCm, WeightKg)
JOIN dbo.Patients p ON p.Mrn = v.Mrn
WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.PatientVitals x
    WHERE x.PatientId = p.PatientId AND x.RecordedAt = v.RecordedAt
);
GO

-- LABS: Flag is Normal, High, or Low (the values the Create Case form offers). None for MRN000003.
INSERT INTO dbo.PatientLabResults (PatientId, TestName, Result, Unit, Flag, CollectedAt)
SELECT p.PatientId, l.TestName, l.Result, l.Unit, l.Flag, l.CollectedAt
FROM (
    VALUES
        ('MRN000001', N'Total cholesterol',       N'232',   N'mg/dL',     N'High',   '2026-09-30T07:45:00'),
        ('MRN000001', N'LDL cholesterol',         N'155',   N'mg/dL',     N'High',   '2026-09-30T07:45:00'),
        ('MRN000001', N'Troponin I',              N'<0.01', N'ng/mL',     N'Normal', '2026-10-01T09:30:00'),
        ('MRN000002', N'Glucose',                 N'412',   N'mg/dL',     N'High',   '2026-10-02T05:30:00'),
        ('MRN000002', N'Hemoglobin A1c',          N'10.2',  N'%',         N'High',   '2026-10-02T05:30:00'),
        ('MRN000002', N'Sodium',                  N'133',   N'mmol/L',    N'Low',    '2026-10-02T05:30:00'),
        ('MRN000002', N'Potassium',               N'4.1',   N'mmol/L',    N'Normal', '2026-10-02T05:30:00'),
        ('MRN000004', N'White blood cell count',  N'7.2',   N'x10^3/uL',  N'Normal', '2026-10-04T08:20:00'),
        ('MRN000004', N'Eosinophils',             N'6',     N'%',         N'High',   '2026-10-04T08:20:00'),
        ('MRN000005', N'White blood cell count',  N'14.8',  N'x10^3/uL',  N'High',   '2026-10-03T06:30:00'),
        ('MRN000005', N'Glucose',                 N'238',   N'mg/dL',     N'High',   '2026-10-03T06:30:00'),
        ('MRN000005', N'Hemoglobin A1c',          N'9.1',   N'%',         N'High',   '2026-10-03T06:30:00'),
        ('MRN000005', N'Creatinine',              N'1.1',   N'mg/dL',     N'Normal', '2026-10-03T06:30:00'),
        ('MRN000006', N'TSH',                     N'2.1',   N'mIU/L',     N'Normal', '2026-10-01T08:00:00')
) AS l (Mrn, TestName, Result, Unit, Flag, CollectedAt)
JOIN dbo.Patients p ON p.Mrn = l.Mrn
WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.PatientLabResults x
    WHERE x.PatientId = p.PatientId AND x.TestName = l.TestName AND x.CollectedAt = l.CollectedAt
);
GO
