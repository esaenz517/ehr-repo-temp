-- CASES SEED
-- Demo cases and who they are assigned to.
-- Included by init.sql with \ir, after every table and seed/users.sql (assignments need the logins).
-- IDs differ between databases, so rows are looked up by stable values instead:
--   patients by Mrn, people by T_Login.username, cases by Mrn + ChiefComplaint.
-- Each row is inserted only if it is missing, so new lines can be added and db-init re-run.

-- CASES: written by the instructor, one per patient
INSERT INTO dbo.Cases (PatientId, ChiefComplaint, Narrative, CreatedByStaffId)
SELECT p.PatientId, c.ChiefComplaint, c.Narrative, author.staffid
FROM (
    -- seq keeps the rows in the order written, so IDs match the SQL Server seed
    SELECT *, row_number() OVER () AS seq
    FROM (
        VALUES
            ('MRN000001', 'Chest tightness on exertion',
             '42-year-old man with hypertension and high cholesterol. Two weeks of chest tightness when climbing stairs that eases with rest. Takes lisinopril and atorvastatin.'),
            ('MRN000002', 'High blood sugar with fatigue',
             '34-year-old woman with type 2 diabetes admitted for blood glucose above 400 mg/dL, increased thirst, and three days of fatigue. Reports missing metformin doses.'),
            ('MRN000003', 'Low back pain after lifting',
             '47-year-old man with sudden low back pain after lifting boxes at work four days ago. Pain is worse when bending; no numbness or weakness in the legs.'),
            ('MRN000004', 'Worsening shortness of breath',
             '25-year-old with asthma reporting a week of wheezing and shortness of breath at night, using their albuterol inhaler four to five times a day.'),
            ('MRN000005', 'Foot wound that is not healing',
             '61-year-old man with type 2 diabetes and hypertension admitted for a wound on the right foot that has not healed in three weeks, with redness spreading around it.'),
            ('MRN000006', 'Trouble sleeping and racing thoughts',
             '37-year-old woman with two months of difficulty falling asleep, racing thoughts at night, and trouble concentrating at work.')
    ) AS v (Mrn, ChiefComplaint, Narrative)
) AS c
JOIN dbo.Patients p     ON p.Mrn = c.Mrn
JOIN dbo.T_Login author ON author.username = 'instructor'
WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.Cases x
    WHERE x.PatientId = p.PatientId AND x.ChiefComplaint = c.ChiefComplaint
)
ORDER BY c.seq;

-- ASSIGNMENTS: who gets which case, by login username. Every student login gets at least one.
INSERT INTO dbo.Assignment (CaseId, EncounterStatus, Course, DueDate, AssignmentType, AssignedTo, AssignedBy)
SELECT c.CaseId, a.Status, a.Course, a.DueDate::timestamp, a.AssignmentType, stu.staffid, ins.staffid
FROM (
    -- seq keeps the rows in the order written, so IDs match the SQL Server seed
    SELECT *, row_number() OVER () AS seq
    FROM (
        VALUES
            -- Nursing
            ('MRN000002', 'High blood sugar with fatigue',        'emmanuel', 'not_started', 'Adult Health Nursing I',     '2026-10-16', 'graded'),
            ('MRN000005', 'Foot wound that is not healing',       'emmanuel', 'in_progress', 'Adult Health Nursing I',     '2026-10-23', 'graded'),
            ('MRN000005', 'Foot wound that is not healing',       'zachary',  'not_started', 'Adult Health Nursing I',     '2026-10-23', 'graded'),
            ('MRN000004', 'Worsening shortness of breath',        'zachary',  'submitted',   'Adult Health Nursing I',     '2026-10-09', 'practice'),
            ('MRN000002', 'High blood sugar with fatigue',        'student',  'signed',      'Adult Health Nursing I',     '2026-10-02', 'practice'),
            -- Physician
            ('MRN000001', 'Chest tightness on exertion',          'daniel',   'in_progress', 'Interprofessional Case Lab', '2026-10-16', 'graded'),
            -- Physical therapy
            ('MRN000003', 'Low back pain after lifting',          'jacob',    'not_started', 'Interprofessional Case Lab', '2026-10-16', 'graded'),
            -- Psychiatry
            ('MRN000006', 'Trouble sleeping and racing thoughts', 'kinley',   'not_started', 'Interprofessional Case Lab', '2026-10-16', 'graded')
    ) AS v (Mrn, ChiefComplaint, Student, Status, Course, DueDate, AssignmentType)
) AS a
JOIN dbo.Patients p  ON p.Mrn = a.Mrn
JOIN dbo.Cases c     ON c.PatientId = p.PatientId AND c.ChiefComplaint = a.ChiefComplaint
JOIN dbo.T_Login stu ON stu.username = a.Student
JOIN dbo.T_Login ins ON ins.username = 'instructor'
WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.Assignment x
    WHERE x.CaseId = c.CaseId AND x.AssignedTo = stu.staffid
)
-- Same AssignmentIds as the SQL Server seed, which inserts in student StaffId order
ORDER BY stu.staffid, a.seq;
