-- CASES SEED
-- Demo cases and who they are assigned to.
-- Included by init.sql with \ir, after every table and seed/users.sql (assignments need the logins).
-- IDs differ between databases, so rows are looked up by stable values instead:
--   patients by Mrn, people by T_Login.username (through their account), cases by
--   Mrn + ChiefComplaint, courses by subject code + number for the Fall 2026 term.
-- Each row is inserted only if it is missing, so new lines can be added and db-init re-run.

-- CASES: each written by an instructor
INSERT INTO dbo.Cases (PatientId, ChiefComplaint, Narrative, CreatedByStaffId)
SELECT p.PatientId, c.ChiefComplaint, c.Narrative, author.StaffId
FROM (
    VALUES
        (1, 'instructor', 'MRN000001', 'Chest tightness on exertion',
         '42-year-old man with hypertension and high cholesterol. Two weeks of chest tightness when climbing stairs that eases with rest. Takes lisinopril and atorvastatin.'),
        (2, 'instructor', 'MRN000002', 'High blood sugar with fatigue',
         '34-year-old woman with type 2 diabetes admitted for blood glucose above 400 mg/dL, increased thirst, and three days of fatigue. Reports missing metformin doses.'),
        (3, 'therapy',    'MRN000003', 'Low back pain after lifting',
         '47-year-old man with sudden low back pain after lifting boxes at work four days ago. Pain is worse when bending; no numbness or weakness in the legs.'),
        (4, 'instructor', 'MRN000004', 'Worsening shortness of breath',
         '25-year-old with asthma reporting a week of wheezing and shortness of breath at night, using their albuterol inhaler four to five times a day.'),
        (5, 'instructor', 'MRN000005', 'Foot wound that is not healing',
         '61-year-old man with type 2 diabetes and hypertension admitted for a wound on the right foot that has not healed in three weeks, with redness spreading around it.'),
        (6, 'instructor', 'MRN000006', 'Trouble sleeping and racing thoughts',
         '37-year-old woman with two months of difficulty falling asleep, racing thoughts at night, and trouble concentrating at work.'),
        (7, 'pharmacy',   'MRN000002', 'Missed metformin doses',
         '34-year-old woman with type 2 diabetes who skips evening metformin because of stomach upset. Review the regimen, side effects, and adherence options.'),
        (8, 'pharmacy',   'MRN000001', 'Statin and blood pressure medication review',
         '42-year-old man on lisinopril and atorvastatin with LDL still above goal. Check doses, interactions, and what to change.')
) AS c (Seq, Author, Mrn, ChiefComplaint, Narrative)
JOIN dbo.Patients p   ON p.Mrn = c.Mrn
JOIN dbo.T_Login l    ON l.username = c.Author
JOIN dbo.Staff author ON author.UserId = l.userid
WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.Cases x
    WHERE x.PatientId = p.PatientId AND x.ChiefComplaint = c.ChiefComplaint
)
ORDER BY c.Seq;

-- ASSIGNMENTS: who gets which case, by login username. Every student login gets at least one.
-- Course is "SUBJ NUMBER" of the Fall 2026 offering.
INSERT INTO dbo.Assignment (CaseId, EncounterStatus, CourseId, DueDate, AssignmentType, AssignedTo, AssignedBy)
SELECT c.CaseId, a.Status, co.CourseId, a.DueDate::timestamp, a.AssignmentType, stu.StaffId, ins.StaffId
FROM (
    VALUES
        -- Nursing
        (1,  'MRN000002', 'High blood sugar with fatigue',               'emmanuel', 'instructor', 'not_started', 'NURS', '3310', '2026-11-20', 'graded'),
        (2,  'MRN000005', 'Foot wound that is not healing',              'emmanuel', 'instructor', 'in_progress', 'NURS', '3310', '2026-11-13', 'graded'),
        (3,  'MRN000005', 'Foot wound that is not healing',              'zachary',  'instructor', 'not_started', 'NURS', '3310', '2026-10-23', 'graded'),
        (4,  'MRN000004', 'Worsening shortness of breath',               'zachary',  'instructor', 'submitted',   'NURS', '3310', '2026-11-09', 'practice'),
        (5,  'MRN000002', 'High blood sugar with fatigue',               'student',  'instructor', 'signed',      'NURS', '3310', '2026-10-02', 'practice'),
        -- Interprofessional
        (6,  'MRN000001', 'Chest tightness on exertion',                 'daniel',   'instructor', 'in_progress', 'IHS',  '5100', '2026-11-16', 'graded'),
        (7,  'MRN000003', 'Low back pain after lifting',                 'jacob',    'therapy',    'not_started', 'IHS',  '5100', '2026-11-16', 'graded'),
        (8,  'MRN000006', 'Trouble sleeping and racing thoughts',        'kinley',   'instructor', 'not_started', 'IHS',  '5100', '2026-11-16', 'graded'),
        -- Pharmacy
        (9,  'MRN000002', 'Missed metformin doses',                      'ana',      'pharmacy',   'submitted',   'PHAR', '5310', '2026-11-06', 'graded'),
        (10, 'MRN000001', 'Statin and blood pressure medication review', 'ana',      'pharmacy',   'signed',      'PHAR', '5310', '2026-10-30', 'graded'),
        (11, 'MRN000001', 'Statin and blood pressure medication review', 'luis',     'pharmacy',   'not_started', 'PHAR', '5310', '2026-11-18', 'graded')
) AS a (Seq, Mrn, ChiefComplaint, Student, Instructor, Status, SubjectCode, CourseNumber, DueDate, AssignmentType)
JOIN dbo.Patients p ON p.Mrn = a.Mrn
JOIN dbo.Cases c    ON c.PatientId = p.PatientId AND c.ChiefComplaint = a.ChiefComplaint
JOIN dbo.T_Login sl ON sl.username = a.Student
JOIN dbo.Staff stu  ON stu.UserId = sl.userid
JOIN dbo.T_Login il ON il.username = a.Instructor
JOIN dbo.Staff ins  ON ins.UserId = il.userid
LEFT JOIN dbo.Courses co
    ON co.SubjectCode = a.SubjectCode AND co.CourseNumber = a.CourseNumber
   AND co.Term = 'Fall' AND co.TermYear = 2026
WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.Assignment x
    WHERE x.CaseId = c.CaseId AND x.AssignedTo = stu.StaffId
)
ORDER BY a.Seq;
