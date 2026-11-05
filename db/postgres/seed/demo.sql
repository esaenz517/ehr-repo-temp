-- DEMO SEED
-- Fake data for every remaining table, so each page has something to show:
-- course enrollments, rubrics, SOAP notes (with versions, an addendum, and audit
-- events), rubric scores and published grades, room assignments, appointments,
-- billing, insurance, and a few deletion-audit rows.
-- Included by init.sql with \ir after seed/cases.sql. Rows are looked up by stable
-- values (usernames, Mrn, case complaint, course code) and inserted only when
-- missing, so re-running is safe. All names and numbers are fictional.

-- COURSE ENROLLMENTS: instructors who teach each Fall 2026 course and the students in it
INSERT INTO dbo.CourseEnrollments (CourseId, StaffId)
SELECT co.CourseId, s.StaffId
FROM (
    VALUES
        ('NURS', '3310', 'instructor'), ('NURS', '3310', 'student'),
        ('NURS', '3310', 'emmanuel'),   ('NURS', '3310', 'zachary'),
        ('IHS',  '5100', 'instructor'), ('IHS',  '5100', 'pharmacy'),
        ('IHS',  '5100', 'therapy'),    ('IHS',  '5100', 'daniel'),
        ('IHS',  '5100', 'jacob'),      ('IHS',  '5100', 'kinley'),
        ('IHS',  '5100', 'ana'),        ('IHS',  '5100', 'emmanuel'),
        ('PHAR', '5310', 'pharmacy'),   ('PHAR', '5310', 'ana'),
        ('PHAR', '5310', 'luis'),
        ('PHAR', '5320', 'pharmacy'),   ('PHAR', '5320', 'luis'),
        ('PHAR', '6150', 'pharmacy'),   ('PHAR', '6150', 'ana'),
        ('PT',   '6210', 'therapy'),    ('PT',   '6210', 'jacob')
) AS e (SubjectCode, CourseNumber, Username)
JOIN dbo.Courses co
    ON co.SubjectCode = e.SubjectCode AND co.CourseNumber = e.CourseNumber
   AND co.Term = 'Fall' AND co.TermYear = 2026
JOIN dbo.T_Login l ON l.username = e.Username
JOIN dbo.Staff s   ON s.UserId = l.userid
ON CONFLICT (CourseId, StaffId) DO NOTHING;

-- People without a login are enrolled by name
INSERT INTO dbo.CourseEnrollments (CourseId, StaffId)
SELECT co.CourseId, s.StaffId
FROM (
    VALUES
        ('NURS', '3310', 'Emily',  'Carter'),
        ('NURS', '3310', 'Sophia', 'Nguyen'),
        ('IHS',  '5100', 'Daniel', 'Brooks')
) AS e (SubjectCode, CourseNumber, FirstName, LastName)
JOIN dbo.Courses co
    ON co.SubjectCode = e.SubjectCode AND co.CourseNumber = e.CourseNumber
   AND co.Term = 'Fall' AND co.TermYear = 2026
JOIN dbo.Staff s ON s.FirstName = e.FirstName AND s.LastName = e.LastName AND s.UserId IS NULL
ON CONFLICT (CourseId, StaffId) DO NOTHING;

-- CASE RUBRICS: three gradable markers per case (added only to cases without a rubric)
INSERT INTO dbo.CaseRubricItems (CaseId, Category, Label, Points, Guidance, SortOrder)
SELECT c.CaseId, r.Category, r.Label, r.Points, r.Guidance, r.SortOrder
FROM (
    VALUES
        (1,  'MRN000001', 'Chest tightness on exertion', 'diagnosis', 'Recognizes a stable angina pattern', 4, 'Exertional tightness that eases with rest', 0),
        (2,  'MRN000001', 'Chest tightness on exertion', 'screening', 'Orders an ECG and troponin', 3, NULL, 1),
        (3,  'MRN000001', 'Chest tightness on exertion', 'trap', 'Avoids penicillin-based antibiotics', 3, 'Penicillin allergy (hives) is in the chart', 2),
        (4,  'MRN000002', 'High blood sugar with fatigue', 'diagnosis', 'Links hyperglycemia to missed metformin doses', 4, NULL, 0),
        (5,  'MRN000002', 'High blood sugar with fatigue', 'medication_conflict', 'Notes the sulfa allergy before suggesting a sulfonylurea', 3, NULL, 1),
        (6,  'MRN000002', 'High blood sugar with fatigue', 'screening', 'Checks A1c and electrolytes', 3, 'Sodium is low on admission', 2),
        (7,  'MRN000003', 'Low back pain after lifting', 'diagnosis', 'Identifies a mechanical low back strain', 4, NULL, 0),
        (8,  'MRN000003', 'Low back pain after lifting', 'screening', 'Screens for red flags such as numbness, weakness, and bladder changes', 3, NULL, 1),
        (9,  'MRN000003', 'Low back pain after lifting', 'other', 'Gives a home exercise and activity plan', 3, NULL, 2),
        (10, 'MRN000004', 'Worsening shortness of breath', 'diagnosis', 'Identifies poorly controlled asthma', 4, NULL, 0),
        (11, 'MRN000004', 'Worsening shortness of breath', 'medication_conflict', 'Avoids aspirin and NSAIDs', 3, 'Aspirin causes wheezing for this patient', 1),
        (12, 'MRN000004', 'Worsening shortness of breath', 'other', 'Reviews inhaler technique and a controller medicine', 3, NULL, 2),
        (13, 'MRN000005', 'Foot wound that is not healing', 'diagnosis', 'Recognizes a diabetic foot infection', 4, NULL, 0),
        (14, 'MRN000005', 'Foot wound that is not healing', 'screening', 'Checks pulses and sensation in both feet', 3, NULL, 1),
        (15, 'MRN000005', 'Foot wound that is not healing', 'trap', 'Uses latex-free supplies', 3, 'Latex allergy is in the chart', 2),
        (16, 'MRN000006', 'Trouble sleeping and racing thoughts', 'diagnosis', 'Describes insomnia with anxiety features', 4, NULL, 0),
        (17, 'MRN000006', 'Trouble sleeping and racing thoughts', 'screening', 'Screens for depression and anxiety (PHQ-9, GAD-7)', 3, NULL, 1),
        (18, 'MRN000006', 'Trouble sleeping and racing thoughts', 'medication_conflict', 'Avoids codeine-containing products', 3, 'Codeine causes nausea and vomiting', 2),
        (19, 'MRN000002', 'Missed metformin doses', 'diagnosis', 'Links stomach upset to immediate-release metformin', 4, NULL, 0),
        (20, 'MRN000002', 'Missed metformin doses', 'medication_conflict', 'Suggests extended-release metformin or taking it with food', 3, NULL, 1),
        (21, 'MRN000002', 'Missed metformin doses', 'screening', 'Checks kidney function before any change', 3, NULL, 2),
        (22, 'MRN000001', 'Statin and blood pressure medication review', 'diagnosis', 'Notes LDL above goal on the current statin dose', 4, NULL, 0),
        (23, 'MRN000001', 'Statin and blood pressure medication review', 'medication_conflict', 'Checks interactions before raising atorvastatin', 3, NULL, 1),
        (24, 'MRN000001', 'Statin and blood pressure medication review', 'screening', 'Orders a liver panel and a lipid recheck', 3, NULL, 2)
) AS r (Seq, Mrn, ChiefComplaint, Category, Label, Points, Guidance, SortOrder)
JOIN dbo.Patients p ON p.Mrn = r.Mrn
JOIN dbo.Cases c    ON c.PatientId = p.PatientId AND c.ChiefComplaint = r.ChiefComplaint
WHERE NOT EXISTS (SELECT 1 FROM dbo.CaseRubricItems x WHERE x.CaseId = c.CaseId)
ORDER BY r.Seq;

-- SOAP NOTES: every started assignment gets an encounter and the student's note.
-- Submitted and signed work has a finished note; signed notes are approved by the
-- assigning instructor. Only assignments without an encounter are filled in.
DO $seed$
DECLARE
    n RECORD;
    a RECORD;
    finished TIMESTAMP;
    new_encounter_id INT;
    new_note_id INT;
    new_addendum_id INT;
BEGIN
    FOR n IN
        SELECT * FROM (
            VALUES
                (1, 'emmanuel', 'MRN000005', 'Foot wound that is not healing', TIMESTAMP '2026-11-03 15:10:00',
                 '{"chief_complaint":"Foot wound that is not healing","hpi":"Three weeks of a right foot wound with spreading redness. Reports reduced feeling in both feet.","past_medical_history":"Type 2 diabetes, hypertension, peripheral neuropathy","past_surgical_history":"","family_history":"Brother with type 2 diabetes","social_history":"","physical_exam":"Temp 38.3 C. 2 cm wound on the right plantar foot with surrounding erythema.","assessment":"","plan":""}'),
                (2, 'daniel', 'MRN000001', 'Chest tightness on exertion', TIMESTAMP '2026-11-04 10:00:00',
                 '{"chief_complaint":"Chest tightness on exertion","hpi":"Two weeks of chest tightness when climbing stairs that eases with rest.","past_medical_history":"Hypertension, high cholesterol","past_surgical_history":"None","family_history":"Father had a heart attack at 55","social_history":"Desk job, walks on weekends","physical_exam":"BP 148/92, HR 88. Lungs clear.","assessment":"Likely stable angina","plan":""}'),
                (3, 'zachary', 'MRN000004', 'Worsening shortness of breath', TIMESTAMP '2026-11-01 09:00:00',
                 '{"chief_complaint":"Worsening shortness of breath","hpi":"One week of wheezing and night-time shortness of breath, using albuterol 4-5 times a day.","past_medical_history":"Asthma since childhood","past_surgical_history":"None","family_history":"Mother with asthma","social_history":"Lives with a cat","physical_exam":"RR 22, SpO2 94%. Expiratory wheezes in both lungs.","assessment":"Poorly controlled asthma, likely triggered by dust and pet dander","plan":"Start an inhaled corticosteroid controller, review inhaler technique, avoid aspirin and NSAIDs, follow up in 2 weeks."}'),
                (4, 'student', 'MRN000002', 'High blood sugar with fatigue', TIMESTAMP '2026-09-29 13:00:00',
                 '{"chief_complaint":"High blood sugar with fatigue","hpi":"Three days of fatigue and thirst, glucose 412 mg/dL. Reports missed metformin doses.","past_medical_history":"Type 2 diabetes","past_surgical_history":"None","family_history":"Mother with type 2 diabetes","social_history":"Works night shifts","physical_exam":"HR 104, dry mucous membranes.","assessment":"Hyperglycemia from missed metformin; low sodium","plan":"IV fluids, insulin per protocol, restart metformin, recheck A1c and electrolytes. Avoid sulfonylureas (sulfa allergy)."}'),
                (5, 'ana', 'MRN000002', 'Missed metformin doses', TIMESTAMP '2026-11-02 11:30:00',
                 '{"chief_complaint":"Missed metformin doses","hpi":"Skips the evening metformin dose because of stomach upset.","past_medical_history":"Type 2 diabetes","past_surgical_history":"None","family_history":"Mother with type 2 diabetes","social_history":"Eats dinner late after night shifts","physical_exam":"No acute distress.","assessment":"Non-adherence from GI side effects of immediate-release metformin","plan":"Switch to metformin extended-release with dinner, check kidney function first, follow up in 4 weeks."}'),
                (6, 'ana', 'MRN000001', 'Statin and blood pressure medication review', TIMESTAMP '2026-10-27 09:45:00',
                 '{"chief_complaint":"Statin and blood pressure medication review","hpi":"LDL 155 mg/dL on atorvastatin; BP 148/92 on lisinopril.","past_medical_history":"Hypertension, high cholesterol","past_surgical_history":"None","family_history":"Father had a heart attack at 55","social_history":"Non-smoker","physical_exam":"BP 148/92.","assessment":"LDL and blood pressure above goal on current doses","plan":"Raise atorvastatin to 40 mg after checking interactions, recheck lipids and liver panel in 6 weeks, increase lisinopril."}')
        ) AS v (Seq, Student, Mrn, ChiefComplaint, StartedAt, Content)
        ORDER BY Seq
    LOOP
        SELECT asg.AssignmentId, asg.EncounterStatus, p.PatientId, p.ProviderId,
               stu.UserId AS AuthorUserId, ins.UserId AS InstructorUserId, d.Name AS Discipline
        INTO a
        FROM dbo.Assignment asg
        JOIN dbo.Cases c    ON c.CaseId = asg.CaseId
        JOIN dbo.Patients p ON p.PatientId = c.PatientId
        JOIN dbo.Staff stu  ON stu.StaffId = asg.AssignedTo
        JOIN dbo.Staff ins  ON ins.StaffId = asg.AssignedBy
        JOIN dbo.T_Login l  ON l.userid = stu.UserId
        LEFT JOIN dbo.Disciplines d ON d.DisciplineId = stu.DisciplineId
        WHERE l.username = n.Student
          AND p.Mrn = n.Mrn
          AND c.ChiefComplaint = n.ChiefComplaint
          AND asg.EncounterId IS NULL
          AND asg.EncounterStatus IN ('in_progress', 'submitted', 'signed');

        CONTINUE WHEN NOT FOUND;

        finished := n.StartedAt + INTERVAL '2 hours';

        INSERT INTO dbo.Encounters (PatientId, StartedAt)
        VALUES (a.PatientId, n.StartedAt)
        RETURNING EncounterId INTO new_encounter_id;

        UPDATE dbo.Assignment SET EncounterId = new_encounter_id WHERE AssignmentId = a.AssignmentId;

        -- In-progress drafts have one version; finished notes were saved twice.
        INSERT INTO dbo.ClinicalNotes
            (PatientId, EncounterId, NoteType, Discipline, AuthorUserId, ResponsibleProviderId,
             CreatedAt, LastModifiedAt, Content, SensitivityClassification, CurrentVersion,
             IsArchived, ApprovedAt, ApprovedByUserId)
        VALUES
            (a.PatientId, new_encounter_id, 'SOAP', a.Discipline, a.AuthorUserId, a.ProviderId,
             n.StartedAt,
             CASE WHEN a.EncounterStatus = 'in_progress' THEN n.StartedAt ELSE finished END,
             n.Content, 'general',
             CASE WHEN a.EncounterStatus = 'in_progress' THEN 1 ELSE 2 END,
             FALSE,
             CASE WHEN a.EncounterStatus = 'signed' THEN finished + INTERVAL '1 day' END,
             CASE WHEN a.EncounterStatus = 'signed' THEN a.InstructorUserId END)
        RETURNING NoteId INTO new_note_id;

        INSERT INTO dbo.NoteVersions (NoteId, VersionNumber, ContentSnapshot, AuthorUserId, CreatedAt, ChangeSummary)
        VALUES (new_note_id, 1, n.Content, a.AuthorUserId, n.StartedAt, 'Initial draft');

        INSERT INTO dbo.NoteAuditEvents (NoteId, ActorUserId, Action, Details, CreatedAt)
        VALUES (new_note_id, a.AuthorUserId, 'note_created', 'Student started the SOAP note', n.StartedAt);

        IF a.EncounterStatus <> 'in_progress' THEN
            INSERT INTO dbo.NoteVersions (NoteId, VersionNumber, ContentSnapshot, AuthorUserId, CreatedAt, ChangeSummary)
            VALUES (new_note_id, 2, n.Content, a.AuthorUserId, finished, 'Completed assessment and plan');

            INSERT INTO dbo.NoteAuditEvents (NoteId, ActorUserId, Action, Details, CreatedAt)
            VALUES (new_note_id, a.AuthorUserId, 'note_updated', 'Saved version 2', finished);
        END IF;

        IF a.EncounterStatus = 'signed' THEN
            INSERT INTO dbo.NoteAuditEvents (NoteId, ActorUserId, Action, Details, CreatedAt)
            VALUES (new_note_id, a.InstructorUserId, 'note_approved', 'Instructor approved the clinical note', finished + INTERVAL '1 day');

            UPDATE dbo.Assignment
            SET Feedback = 'Clear assessment that ties the plan to the chart. Remember to list allergies before suggesting new medicines.',
                FeedbackUpdatedAt = finished + INTERVAL '1 day'
            WHERE AssignmentId = a.AssignmentId;

            -- A late correction, added after approval
            INSERT INTO dbo.NoteAddenda (NoteId, AuthorUserId, Content, CreatedAt)
            VALUES (new_note_id, a.AuthorUserId, 'Addendum: patient confirmed the allergy list at the follow-up call.', finished + INTERVAL '2 days')
            RETURNING AddendumId INTO new_addendum_id;

            INSERT INTO dbo.NoteAuditEvents (NoteId, ActorUserId, Action, AddendumId, Details, CreatedAt)
            VALUES (new_note_id, a.AuthorUserId, 'addendum_created', new_addendum_id, 'Added an addendum', finished + INTERVAL '2 days');
        END IF;
    END LOOP;
END
$seed$;

-- RUBRIC SCORES: signed work is fully scored (one point off the second marker)
INSERT INTO dbo.AssignmentRubricScores (AssignmentId, RubricItemId, PointsAwarded, Comment, ScoredAt)
SELECT a.AssignmentId, ri.RubricItemId,
       CASE WHEN ri.SortOrder = 1 THEN ri.Points - 1 ELSE ri.Points END,
       CASE WHEN ri.SortOrder = 1 THEN 'Mentioned, but not tied to the plan' END,
       COALESCE(a.FeedbackUpdatedAt, now() AT TIME ZONE 'utc')
FROM dbo.Assignment a
JOIN dbo.CaseRubricItems ri ON ri.CaseId = a.CaseId
WHERE a.EncounterStatus = 'signed'
ORDER BY a.AssignmentId, ri.SortOrder
ON CONFLICT DO NOTHING;

-- GRADES: signed work has a published SOAP grade
INSERT INTO dbo.AssignmentGrades (AssignmentId, AdjustmentPoints, AdjustmentReason, GradedByStaffId, UpdatedAt, PublishedAt)
SELECT a.AssignmentId, 1, 'Extra credit for the follow-up addendum', a.AssignedBy,
       COALESCE(a.FeedbackUpdatedAt, now() AT TIME ZONE 'utc'), COALESCE(a.FeedbackUpdatedAt, now() AT TIME ZONE 'utc')
FROM dbo.Assignment a
WHERE a.EncounterStatus = 'signed'
ORDER BY a.AssignmentId
ON CONFLICT (AssignmentId) DO NOTHING;

INSERT INTO dbo.AssignmentGradeItems (AssignmentId, CriterionKey, Label, PossiblePoints, EarnedPoints, Comment, SortOrder)
SELECT g.AssignmentId, i.CriterionKey, i.Label, 10, i.Earned, i.Comment, i.SortOrder
FROM dbo.AssignmentGrades g
CROSS JOIN (
    VALUES
        ('soap-1', 'Subjective', 9,  'Good history; add the social history', 0),
        ('soap-2', 'Objective',  10, NULL,                                   1),
        ('soap-3', 'Assessment', 8,  'Explain how the labs support it',      2),
        ('soap-4', 'Plan',       9,  NULL,                                   3)
) AS i (CriterionKey, Label, Earned, Comment, SortOrder)
ORDER BY g.AssignmentId, i.SortOrder
ON CONFLICT ON CONSTRAINT UQ_AssignmentGradeItems_Key DO NOTHING;

-- ROOM ASSIGNMENTS: three patients are in a room now, one was discharged
INSERT INTO dbo.RoomAssignments (RoomId, PatientId, AssignedAt, DischargedAt)
SELECT r.RoomId, p.PatientId, ra.AssignedAt, ra.DischargedAt
FROM (
    VALUES
        (1, 100, 'MRN000002', TIMESTAMP '2026-10-02 06:30:00', NULL::TIMESTAMP),
        (2, 101, 'MRN000005', TIMESTAMP '2026-10-03 07:30:00', NULL::TIMESTAMP),
        (3, 103, 'MRN000001', TIMESTAMP '2026-11-04 11:00:00', NULL::TIMESTAMP),
        (4, 102, 'MRN000004', TIMESTAMP '2026-10-04 08:30:00', TIMESTAMP '2026-10-06 12:00:00')
) AS ra (Seq, RoomNumber, Mrn, AssignedAt, DischargedAt)
JOIN dbo.Rooms r    ON r.RoomNumber = ra.RoomNumber
JOIN dbo.Patients p ON p.Mrn = ra.Mrn
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.RoomAssignments x WHERE x.PatientId = p.PatientId AND x.RoomId = r.RoomId
)
ORDER BY ra.Seq;

-- A room with a current patient is occupied
UPDATE dbo.Rooms r SET Status = 'occupied'
WHERE r.Status = 'available'
  AND EXISTS (SELECT 1 FROM dbo.RoomAssignments ra WHERE ra.RoomId = r.RoomId AND ra.DischargedAt IS NULL);

-- APPOINTMENTS
INSERT INTO dbo.Appointments (PatientId, ProviderId, AppointmentDateTime, Location, Status)
SELECT p.PatientId, pr.ProviderId, a.AppointmentDateTime, a.Location, a.Status
FROM (
    VALUES
        (1, 'MRN000001', 'susan.lee@clinic.example',    TIMESTAMP '2026-10-01 09:00:00', 'Cardiology Clinic, Room 2',    'completed'),
        (2, 'MRN000001', 'susan.lee@clinic.example',    TIMESTAMP '2026-11-12 09:30:00', 'Cardiology Clinic, Room 2',    'scheduled'),
        (3, 'MRN000002', 'mark.feldman@clinic.example', TIMESTAMP '2026-11-10 14:00:00', 'Internal Medicine Clinic',     'scheduled'),
        (4, 'MRN000003', 'mark.feldman@clinic.example', TIMESTAMP '2026-10-20 10:30:00', 'Internal Medicine Clinic',     'cancelled'),
        (5, 'MRN000003', 'mark.feldman@clinic.example', TIMESTAMP '2026-11-17 10:30:00', 'Rehabilitation Center, Gym B', 'scheduled'),
        (6, 'MRN000004', 'priya.rao@clinic.example',    TIMESTAMP '2026-11-18 10:15:00', 'Pulmonary Function Lab',       'scheduled'),
        (7, 'MRN000005', 'mark.feldman@clinic.example', TIMESTAMP '2026-11-07 08:00:00', 'Wound Care Center',            'scheduled'),
        (8, 'MRN000006', 'priya.rao@clinic.example',    TIMESTAMP '2026-10-28 15:00:00', 'Behavioral Health Clinic',     'completed')
) AS a (Seq, Mrn, ProviderEmail, AppointmentDateTime, Location, Status)
JOIN dbo.Patients p   ON p.Mrn = a.Mrn
JOIN dbo.Providers pr ON pr.Email = a.ProviderEmail
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.Appointments x
    WHERE x.PatientId = p.PatientId AND x.AppointmentDateTime = a.AppointmentDateTime
)
ORDER BY a.Seq;

-- BILLING CHARGES
INSERT INTO dbo.BillingCharges (PatientId, ChargeSummary, ChargeAmount)
SELECT p.PatientId, b.ChargeSummary, b.ChargeAmount
FROM (
    VALUES
        (1,  'MRN000001', 'Office visit, established patient', 145.00),
        (2,  'MRN000001', '12-lead ECG',                        68.50),
        (3,  'MRN000001', 'Troponin I',                         42.00),
        (4,  'MRN000002', 'Inpatient admission, day 1',       1850.00),
        (5,  'MRN000002', 'Hemoglobin A1c',                     35.00),
        (6,  'MRN000002', 'Basic metabolic panel',              29.75),
        (7,  'MRN000003', 'Physical therapy evaluation',       160.00),
        (8,  'MRN000004', 'Spirometry',                         95.00),
        (9,  'MRN000005', 'Inpatient admission, day 1',       1850.00),
        (10, 'MRN000005', 'Wound debridement',                 420.00),
        (11, 'MRN000005', 'Complete blood count',               24.00),
        (12, 'MRN000006', 'Behavioral health intake',          210.00)
) AS b (Seq, Mrn, ChargeSummary, ChargeAmount)
JOIN dbo.Patients p ON p.Mrn = b.Mrn
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.BillingCharges x WHERE x.PatientId = p.PatientId AND x.ChargeSummary = b.ChargeSummary
)
ORDER BY b.Seq;

-- INSURANCE: a primary plan for everyone, a secondary plan for one patient
INSERT INTO dbo.PatientInsurance
    (PatientId, InsuranceCompany, MemberId, GroupNumber, PolicyholderName, PolicyholderDateOfBirth,
     InsurancePriority, CoverageStartDate, CoverageEndDate, VerificationStatus)
SELECT p.PatientId, i.Company, i.MemberId, i.GroupNumber, i.Holder, i.HolderDob::date,
       i.Priority, i.StartDate::date, i.EndDate::date, i.Verification
FROM (
    VALUES
        (1, 'MRN000001', 'Lone Star Health Plan',   'LSH-4410273', 'GRP-1180', 'James Carter',    '1984-03-12', 'primary',   '2026-01-01', NULL,         'verified_active'),
        (2, 'MRN000002', 'Sun City Mutual',         'SCM-882015',  'GRP-2044', 'Maria Gonzalez',  '1992-07-25', 'primary',   '2025-07-01', NULL,         'verified_active'),
        (3, 'MRN000003', 'Desert Valley Insurance', 'DVI-303177',  NULL,       'David Nguyen',    '1978-11-02', 'primary',   '2024-01-01', '2026-09-30', 'verified_inactive'),
        (4, 'MRN000004', 'Lone Star Health Plan',   'LSH-5520981', 'GRP-1180', 'Linda Thompson',  '1972-04-08', 'primary',   '2026-01-01', NULL,         'unverified'),
        (5, 'MRN000005', 'Federal Senior Care',     'FSC-77812A',  NULL,       'Michael Johnson', '1965-09-30', 'primary',   '2025-10-01', NULL,         'verified_active'),
        (6, 'MRN000005', 'Sun City Mutual',         'SCM-119402',  'GRP-3307', 'Michael Johnson', '1965-09-30', 'secondary', '2025-10-01', NULL,         'unable_to_verify'),
        (7, 'MRN000006', 'Desert Valley Insurance', 'DVI-610458',  'GRP-0952', 'Aisha Patel',     '1989-05-14', 'primary',   '2026-03-01', NULL,         'verified_active')
) AS i (Seq, Mrn, Company, MemberId, GroupNumber, Holder, HolderDob, Priority, StartDate, EndDate, Verification)
JOIN dbo.Patients p ON p.Mrn = i.Mrn
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.PatientInsurance x WHERE x.PatientId = p.PatientId AND x.MemberId = i.MemberId
)
ORDER BY i.Seq;

-- DELETION AUDIT: a few past delete requests by the dev admin
INSERT INTO dbo.DeletionAuditLog
    (OccurredAt, ActorUserId, ActorUsername, Resource, ResourceId, RequestPath, Outcome, StatusCode, ClientIp, Details)
SELECT d.OccurredAt, l.userid, l.username, d.Resource, d.ResourceId, d.RequestPath, d.Outcome, d.StatusCode, '127.0.0.1', d.Details
FROM (
    VALUES
        (TIMESTAMP '2026-10-21 16:02:00', 'drugs',    '99',  '/drugs/99',   'not_found', 404,        NULL),
        (TIMESTAMP '2026-10-22 09:15:00', 'patients', '6',   '/patients/6', 'cancelled', NULL::INT,  'Confirmation dialog cancelled'),
        (TIMESTAMP '2026-10-29 11:40:00', 'rooms',    '105', '/rooms/105',  'conflict',  409,        NULL)
) AS d (OccurredAt, Resource, ResourceId, RequestPath, Outcome, StatusCode, Details)
JOIN dbo.T_Login l ON l.username = 'dev'
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.DeletionAuditLog x WHERE x.RequestPath = d.RequestPath AND x.OccurredAt = d.OccurredAt
)
ORDER BY d.OccurredAt;
