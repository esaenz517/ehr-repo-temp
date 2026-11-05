-- CASES SEED
-- Demo cases and who they are assigned to.
-- Included by init.sql with :r, after every table and seed/users.sql (assignments need the logins).
-- IDs differ between databases, so rows are looked up by stable values instead:
--   patients by Mrn, people by T_Login.username (through their account), cases by
--   Mrn + ChiefComplaint, courses by subject code + number for the Fall 2026 term.
-- Each row is inserted only if it is missing, so new lines can be added and db-init re-run.

-- CASES: each written by an instructor
INSERT INTO dbo.Cases (PatientId, ChiefComplaint, Narrative, CreatedByStaffId)
SELECT p.PatientId, c.ChiefComplaint, c.Narrative, author.StaffId
FROM (
    VALUES
        (N'instructor', 'MRN000001', N'Chest tightness on exertion',
         N'42-year-old man with hypertension and high cholesterol. Two weeks of chest tightness when climbing stairs that eases with rest. Takes lisinopril and atorvastatin.'),
        (N'instructor', 'MRN000002', N'High blood sugar with fatigue',
         N'34-year-old woman with type 2 diabetes admitted for blood glucose above 400 mg/dL, increased thirst, and three days of fatigue. Reports missing metformin doses.'),
        (N'therapy',    'MRN000003', N'Low back pain after lifting',
         N'47-year-old man with sudden low back pain after lifting boxes at work four days ago. Pain is worse when bending; no numbness or weakness in the legs.'),
        (N'instructor', 'MRN000004', N'Worsening shortness of breath',
         N'25-year-old with asthma reporting a week of wheezing and shortness of breath at night, using their albuterol inhaler four to five times a day.'),
        (N'instructor', 'MRN000005', N'Foot wound that is not healing',
         N'61-year-old man with type 2 diabetes and hypertension admitted for a wound on the right foot that has not healed in three weeks, with redness spreading around it.'),
        (N'instructor', 'MRN000006', N'Trouble sleeping and racing thoughts',
         N'37-year-old woman with two months of difficulty falling asleep, racing thoughts at night, and trouble concentrating at work.'),
        (N'pharmacy',   'MRN000002', N'Missed metformin doses',
         N'34-year-old woman with type 2 diabetes who skips evening metformin because of stomach upset. Review the regimen, side effects, and adherence options.'),
        (N'pharmacy',   'MRN000001', N'Statin and blood pressure medication review',
         N'42-year-old man on lisinopril and atorvastatin with LDL still above goal. Check doses, interactions, and what to change.')
) AS c (Author, Mrn, ChiefComplaint, Narrative)
JOIN dbo.Patients p    ON p.Mrn = c.Mrn
JOIN dbo.T_Login l     ON l.username = c.Author
JOIN dbo.Staff author  ON author.UserId = l.userid
WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.Cases x
    WHERE x.PatientId = p.PatientId AND x.ChiefComplaint = c.ChiefComplaint
);
GO

-- ASSIGNMENTS: who gets which case, by login username. Every student login gets at least one.
-- Course is "SUBJ NUMBER" of the Fall 2026 offering.
INSERT INTO dbo.Assignment (CaseId, EncounterStatus, CourseId, DueDate, AssignmentType, AssignedTo, AssignedBy)
SELECT c.CaseId, a.Status, co.CourseId, a.DueDate, a.AssignmentType, stu.StaffId, ins.StaffId
FROM (
    VALUES
        -- Nursing
        ('MRN000002', N'High blood sugar with fatigue',               N'emmanuel', N'instructor', N'not_started', N'NURS', N'3310', '2026-11-20', N'graded'),
        ('MRN000005', N'Foot wound that is not healing',              N'emmanuel', N'instructor', N'in_progress', N'NURS', N'3310', '2026-11-13', N'graded'),
        ('MRN000005', N'Foot wound that is not healing',              N'zachary',  N'instructor', N'not_started', N'NURS', N'3310', '2026-10-23', N'graded'),
        ('MRN000004', N'Worsening shortness of breath',               N'zachary',  N'instructor', N'submitted',   N'NURS', N'3310', '2026-11-09', N'practice'),
        ('MRN000002', N'High blood sugar with fatigue',               N'student',  N'instructor', N'signed',      N'NURS', N'3310', '2026-10-02', N'practice'),
        -- Interprofessional
        ('MRN000001', N'Chest tightness on exertion',                 N'daniel',   N'instructor', N'in_progress', N'IHS',  N'5100', '2026-11-16', N'graded'),
        ('MRN000003', N'Low back pain after lifting',                 N'jacob',    N'therapy',    N'not_started', N'IHS',  N'5100', '2026-11-16', N'graded'),
        ('MRN000006', N'Trouble sleeping and racing thoughts',        N'kinley',   N'instructor', N'not_started', N'IHS',  N'5100', '2026-11-16', N'graded'),
        -- Pharmacy
        ('MRN000002', N'Missed metformin doses',                      N'ana',      N'pharmacy',   N'submitted',   N'PHAR', N'5310', '2026-11-06', N'graded'),
        ('MRN000001', N'Statin and blood pressure medication review', N'ana',      N'pharmacy',   N'signed',      N'PHAR', N'5310', '2026-10-30', N'graded'),
        ('MRN000001', N'Statin and blood pressure medication review', N'luis',     N'pharmacy',   N'not_started', N'PHAR', N'5310', '2026-11-18', N'graded')
) AS a (Mrn, ChiefComplaint, Student, Instructor, Status, SubjectCode, CourseNumber, DueDate, AssignmentType)
JOIN dbo.Patients p   ON p.Mrn = a.Mrn
JOIN dbo.Cases c      ON c.PatientId = p.PatientId AND c.ChiefComplaint = a.ChiefComplaint
JOIN dbo.T_Login sl   ON sl.username = a.Student
JOIN dbo.Staff stu    ON stu.UserId = sl.userid
JOIN dbo.T_Login il   ON il.username = a.Instructor
JOIN dbo.Staff ins    ON ins.UserId = il.userid
LEFT JOIN dbo.Courses co
    ON co.SubjectCode = a.SubjectCode AND co.CourseNumber = a.CourseNumber
   AND co.Term = N'Fall' AND co.TermYear = 2026
WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.Assignment x
    WHERE x.CaseId = c.CaseId AND x.AssignedTo = stu.StaffId
);
GO
