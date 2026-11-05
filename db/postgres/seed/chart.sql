-- CHART SEED
-- Each demo patient's chart: medical and family history, allergies, vitals, and labs.
-- Kept in one file so a patient's story stays consistent with their case (seed/cases.sql)
-- and medications (tables/PatientDrugs.sql). Patients are looked up by Mrn.
-- Each row is inserted only if it is missing, so new lines can be added and the script re-run.
--
-- MRN000003 has no allergies and no labs on purpose: the chart must show missing data
-- as "not recorded", never as "no known allergies" or a normal result.

-- MEDICAL HISTORY
INSERT INTO dbo.MedicalHistory (PatientId, Condition, DiagnosisDate, Notes)
SELECT p.PatientId, h.Condition, h.DiagnosisDate::date, h.Notes
FROM (
    -- seq keeps the rows in the order written, so IDs match the SQL Server seed
    SELECT *, row_number() OVER () AS seq
    FROM (
        VALUES
            ('MRN000001', 'Hypertension',          '2019-04-10', 'Managed with lisinopril'),
            ('MRN000001', 'High cholesterol',      '2020-08-22', 'Managed with atorvastatin'),
            ('MRN000002', 'Type 2 diabetes',       '2021-03-15', 'Takes metformin; reports missed doses'),
            ('MRN000003', 'Low back strain',       '2022-05-10', 'Previous episode, resolved with physical therapy'),
            ('MRN000004', 'Asthma',                '2008-06-01', 'Uses albuterol inhaler as needed'),
            ('MRN000005', 'Type 2 diabetes',       '2012-02-20', 'Takes metformin'),
            ('MRN000005', 'Hypertension',          '2015-09-05', 'Takes lisinopril'),
            ('MRN000005', 'Peripheral neuropathy', '2023-01-12', 'Reduced feeling in both feet'),
            ('MRN000006', 'High cholesterol',      '2024-03-18', 'Takes atorvastatin')
    ) AS v (Mrn, Condition, DiagnosisDate, Notes)
) AS h
JOIN dbo.Patients p ON p.Mrn = h.Mrn
WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.MedicalHistory x
    WHERE x.PatientId = p.PatientId AND x.Condition = h.Condition
)
ORDER BY h.seq;

-- FAMILY HISTORY
INSERT INTO dbo.FamilyHistory (PatientId, Relationship, Condition, Notes)
SELECT p.PatientId, f.Relationship, f.Condition, f.Notes
FROM (
    -- seq keeps the rows in the order written, so IDs match the SQL Server seed
    SELECT *, row_number() OVER () AS seq
    FROM (
        VALUES
            ('MRN000001', 'Father',  'Heart attack',        'At age 55'),
            ('MRN000001', 'Mother',  'Type 2 diabetes',     NULL),
            ('MRN000002', 'Mother',  'Type 2 diabetes',     NULL),
            ('MRN000002', 'Father',  'High blood pressure', NULL),
            ('MRN000003', 'Father',  'Osteoarthritis',      NULL),
            ('MRN000004', 'Mother',  'Asthma',              NULL),
            ('MRN000005', 'Brother', 'Type 2 diabetes',     NULL),
            ('MRN000005', 'Mother',  'Stroke',              'At age 70'),
            ('MRN000006', 'Mother',  'Depression',          NULL),
            ('MRN000006', 'Sister',  'Anxiety',             NULL)
    ) AS v (Mrn, Relationship, Condition, Notes)
) AS f
JOIN dbo.Patients p ON p.Mrn = f.Mrn
WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.FamilyHistory x
    WHERE x.PatientId = p.PatientId AND x.Relationship = f.Relationship AND x.Condition = f.Condition
)
ORDER BY f.seq;

-- ALLERGIES (none for MRN000003, see above)
INSERT INTO dbo.PatientAllergies (PatientId, Substance, Reaction)
SELECT p.PatientId, a.Substance, a.Reaction
FROM (
    -- seq keeps the rows in the order written, so IDs match the SQL Server seed
    SELECT *, row_number() OVER () AS seq
    FROM (
        VALUES
            ('MRN000001', 'Penicillin',  'Hives'),
            ('MRN000002', 'Sulfa drugs', 'Rash'),
            ('MRN000004', 'Aspirin',     'Wheezing'),
            ('MRN000004', 'Dust mites',  'Sneezing and wheezing'),
            ('MRN000005', 'Latex',       'Skin rash'),
            ('MRN000006', 'Codeine',     'Nausea and vomiting')
    ) AS v (Mrn, Substance, Reaction)
) AS a
JOIN dbo.Patients p ON p.Mrn = a.Mrn
WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.PatientAllergies x
    WHERE x.PatientId = p.PatientId AND x.Substance = a.Substance
)
ORDER BY a.seq;

-- VITALS: one reading per patient, around the time of their case
INSERT INTO dbo.PatientVitals
    (PatientId, RecordedAt, BloodPressure, HeartRate, RespiratoryRate, TemperatureC, OxygenSaturation, HeightCm, WeightKg)
SELECT p.PatientId, v.RecordedAt::timestamp, v.BloodPressure, v.HeartRate, v.RespiratoryRate, v.TemperatureC, v.OxygenSaturation, v.HeightCm, v.WeightKg
FROM (
    -- seq keeps the rows in the order written, so IDs match the SQL Server seed
    SELECT *, row_number() OVER () AS seq
    FROM (
        VALUES
            ('MRN000001', '2026-10-01T09:15:00', '148/92',  88, 18, 36.8, 98, 178, 92),
            ('MRN000002', '2026-10-02T06:00:00', '118/76', 104, 20, 37.0, 97, 163, 84),
            ('MRN000003', '2026-10-03T10:00:00', '128/82',  76, 16, 36.7, 99, 175, 81),
            ('MRN000004', '2026-10-04T08:00:00', '122/78',  96, 22, 36.9, 94, 168, 61),
            ('MRN000005', '2026-10-03T07:00:00', '152/88',  98, 18, 38.3, 96, 180, 101),
            ('MRN000006', '2026-10-02T14:00:00', '124/80',  82, 16, 36.6, 99, 160, 58)
    ) AS v (Mrn, RecordedAt, BloodPressure, HeartRate, RespiratoryRate, TemperatureC, OxygenSaturation, HeightCm, WeightKg)
) AS v
JOIN dbo.Patients p ON p.Mrn = v.Mrn
WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.PatientVitals x
    WHERE x.PatientId = p.PatientId AND x.RecordedAt = v.RecordedAt::timestamp
)
ORDER BY v.seq;

-- LABS: Flag is Normal, High, or Low (the values the Create Case form offers). None for MRN000003.
INSERT INTO dbo.PatientLabResults (PatientId, TestName, Result, Unit, Flag, CollectedAt)
SELECT p.PatientId, l.TestName, l.Result, l.Unit, l.Flag, l.CollectedAt::timestamp
FROM (
    -- seq keeps the rows in the order written, so IDs match the SQL Server seed
    SELECT *, row_number() OVER () AS seq
    FROM (
        VALUES
            ('MRN000001', 'Total cholesterol',       '232',   'mg/dL',     'High',   '2026-09-30T07:45:00'),
            ('MRN000001', 'LDL cholesterol',         '155',   'mg/dL',     'High',   '2026-09-30T07:45:00'),
            ('MRN000001', 'Troponin I',              '<0.01', 'ng/mL',     'Normal', '2026-10-01T09:30:00'),
            ('MRN000002', 'Glucose',                 '412',   'mg/dL',     'High',   '2026-10-02T05:30:00'),
            ('MRN000002', 'Hemoglobin A1c',          '10.2',  '%',         'High',   '2026-10-02T05:30:00'),
            ('MRN000002', 'Sodium',                  '133',   'mmol/L',    'Low',    '2026-10-02T05:30:00'),
            ('MRN000002', 'Potassium',               '4.1',   'mmol/L',    'Normal', '2026-10-02T05:30:00'),
            ('MRN000004', 'White blood cell count',  '7.2',   'x10^3/uL',  'Normal', '2026-10-04T08:20:00'),
            ('MRN000004', 'Eosinophils',             '6',     '%',         'High',   '2026-10-04T08:20:00'),
            ('MRN000005', 'White blood cell count',  '14.8',  'x10^3/uL',  'High',   '2026-10-03T06:30:00'),
            ('MRN000005', 'Glucose',                 '238',   'mg/dL',     'High',   '2026-10-03T06:30:00'),
            ('MRN000005', 'Hemoglobin A1c',          '9.1',   '%',         'High',   '2026-10-03T06:30:00'),
            ('MRN000005', 'Creatinine',              '1.1',   'mg/dL',     'Normal', '2026-10-03T06:30:00'),
            ('MRN000006', 'TSH',                     '2.1',   'mIU/L',     'Normal', '2026-10-01T08:00:00')
    ) AS v (Mrn, TestName, Result, Unit, Flag, CollectedAt)
) AS l
JOIN dbo.Patients p ON p.Mrn = l.Mrn
WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.PatientLabResults x
    WHERE x.PatientId = p.PatientId AND x.TestName = l.TestName AND x.CollectedAt = l.CollectedAt::timestamp
)
ORDER BY l.seq;
