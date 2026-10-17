-- CASES SEED
-- Demo cases and who they are assigned to.
-- Included by init.sql with :r, after every table and seed/users.sql (assignments need the logins).
-- IDs differ between databases, so rows are looked up by stable values instead:
--   patients by Mrn, people by T_Login.username, cases by Mrn + ChiefComplaint.
-- Each row is inserted only if it is missing, so new lines can be added and db-init re-run.

-- CASES: written by the instructor, one per patient
INSERT INTO dbo.Cases (PatientId, ChiefComplaint, Narrative, CreatedByStaffId)
SELECT p.PatientId, c.ChiefComplaint, c.Narrative, author.staffid
FROM (
    VALUES
        ('MRN000001', N'Chest tightness on exertion',
         N'42-year-old man with hypertension and high cholesterol. Two weeks of chest tightness when climbing stairs that eases with rest. Takes lisinopril and atorvastatin.'),
        ('MRN000002', N'High blood sugar with fatigue',
         N'34-year-old woman with type 2 diabetes admitted for blood glucose above 400 mg/dL, increased thirst, and three days of fatigue. Reports missing metformin doses.'),
        ('MRN000003', N'Low back pain after lifting',
         N'47-year-old man with sudden low back pain after lifting boxes at work four days ago. Pain is worse when bending; no numbness or weakness in the legs.'),
        ('MRN000004', N'Worsening shortness of breath',
         N'25-year-old with asthma reporting a week of wheezing and shortness of breath at night, using their albuterol inhaler four to five times a day.'),
        ('MRN000005', N'Foot wound that is not healing',
         N'61-year-old man with type 2 diabetes and hypertension admitted for a wound on the right foot that has not healed in three weeks, with redness spreading around it.'),
        ('MRN000006', N'Trouble sleeping and racing thoughts',
         N'37-year-old woman with two months of difficulty falling asleep, racing thoughts at night, and trouble concentrating at work.')
) AS c (Mrn, ChiefComplaint, Narrative)
JOIN dbo.Patients p     ON p.Mrn = c.Mrn
JOIN dbo.T_Login author ON author.username = N'instructor'
WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.Cases x
    WHERE x.PatientId = p.PatientId AND x.ChiefComplaint = c.ChiefComplaint
);
GO

-- ASSIGNMENTS: who gets which case, by login username. Every student login gets at least one.
INSERT INTO dbo.Assignment (CaseId, EncounterStatus, Course, DueDate, AssignmentType, AssignedTo, AssignedBy)
SELECT c.CaseId, a.Status, a.Course, a.DueDate, a.AssignmentType, stu.staffid, ins.staffid
FROM (
    VALUES
        -- Nursing
        ('MRN000002', N'High blood sugar with fatigue',        N'emmanuel', N'not_started', N'Adult Health Nursing I',     '2026-10-16', N'graded'),
        ('MRN000005', N'Foot wound that is not healing',       N'emmanuel', N'in_progress', N'Adult Health Nursing I',     '2026-10-23', N'graded'),
        ('MRN000005', N'Foot wound that is not healing',       N'zachary',  N'not_started', N'Adult Health Nursing I',     '2026-10-23', N'graded'),
        ('MRN000004', N'Worsening shortness of breath',        N'zachary',  N'submitted',   N'Adult Health Nursing I',     '2026-10-09', N'practice'),
        ('MRN000002', N'High blood sugar with fatigue',        N'student',  N'signed',      N'Adult Health Nursing I',     '2026-10-02', N'practice'),
        -- Physician
        ('MRN000001', N'Chest tightness on exertion',          N'daniel',   N'in_progress', N'Interprofessional Case Lab', '2026-10-16', N'graded'),
        -- Physical therapy
        ('MRN000003', N'Low back pain after lifting',          N'jacob',    N'not_started', N'Interprofessional Case Lab', '2026-10-16', N'graded'),
        -- Psychiatry
        ('MRN000006', N'Trouble sleeping and racing thoughts', N'kinley',   N'not_started', N'Interprofessional Case Lab', '2026-10-16', N'graded')
) AS a (Mrn, ChiefComplaint, Student, Status, Course, DueDate, AssignmentType)
JOIN dbo.Patients p  ON p.Mrn = a.Mrn
JOIN dbo.Cases c     ON c.PatientId = p.PatientId AND c.ChiefComplaint = a.ChiefComplaint
JOIN dbo.T_Login stu ON stu.username = a.Student
JOIN dbo.T_Login ins ON ins.username = N'instructor'
WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.Assignment x
    WHERE x.CaseId = c.CaseId AND x.AssignedTo = stu.staffid
);
GO
