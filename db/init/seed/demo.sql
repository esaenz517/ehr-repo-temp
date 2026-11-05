-- DEMO SEED
-- Fake data for every remaining table, so each page has something to show:
-- course enrollments, rubrics, SOAP notes (with versions, an addendum, and audit
-- events), rubric scores and published grades, room assignments, appointments,
-- billing, insurance, and a few deletion-audit rows.
-- Included by init.sql with :r after seed/cases.sql. Rows are looked up by stable
-- values (usernames, Mrn, case complaint, course code) and inserted only when
-- missing, so re-running db-init is safe. All names and numbers are fictional.

-- COURSE ENROLLMENTS: instructors who teach each Fall 2026 course and the students in it
INSERT INTO dbo.CourseEnrollments (CourseId, StaffId)
SELECT co.CourseId, s.StaffId
FROM (
    VALUES
        (N'NURS', N'3310', N'instructor'), (N'NURS', N'3310', N'student'),
        (N'NURS', N'3310', N'emmanuel'),   (N'NURS', N'3310', N'zachary'),
        (N'IHS',  N'5100', N'instructor'), (N'IHS',  N'5100', N'pharmacy'),
        (N'IHS',  N'5100', N'therapy'),    (N'IHS',  N'5100', N'daniel'),
        (N'IHS',  N'5100', N'jacob'),      (N'IHS',  N'5100', N'kinley'),
        (N'IHS',  N'5100', N'ana'),        (N'IHS',  N'5100', N'emmanuel'),
        (N'PHAR', N'5310', N'pharmacy'),   (N'PHAR', N'5310', N'ana'),
        (N'PHAR', N'5310', N'luis'),
        (N'PHAR', N'5320', N'pharmacy'),   (N'PHAR', N'5320', N'luis'),
        (N'PHAR', N'6150', N'pharmacy'),   (N'PHAR', N'6150', N'ana'),
        (N'PT',   N'6210', N'therapy'),    (N'PT',   N'6210', N'jacob')
) AS e (SubjectCode, CourseNumber, Username)
JOIN dbo.Courses co
    ON co.SubjectCode = e.SubjectCode AND co.CourseNumber = e.CourseNumber
   AND co.Term = N'Fall' AND co.TermYear = 2026
JOIN dbo.T_Login l ON l.username = e.Username
JOIN dbo.Staff s   ON s.UserId = l.userid
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.CourseEnrollments x WHERE x.CourseId = co.CourseId AND x.StaffId = s.StaffId
);
GO

-- People without a login are enrolled by name
INSERT INTO dbo.CourseEnrollments (CourseId, StaffId)
SELECT co.CourseId, s.StaffId
FROM (
    VALUES
        (N'NURS', N'3310', N'Emily',  N'Carter'),
        (N'NURS', N'3310', N'Sophia', N'Nguyen'),
        (N'IHS',  N'5100', N'Daniel', N'Brooks')
) AS e (SubjectCode, CourseNumber, FirstName, LastName)
JOIN dbo.Courses co
    ON co.SubjectCode = e.SubjectCode AND co.CourseNumber = e.CourseNumber
   AND co.Term = N'Fall' AND co.TermYear = 2026
JOIN dbo.Staff s ON s.FirstName = e.FirstName AND s.LastName = e.LastName AND s.UserId IS NULL
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.CourseEnrollments x WHERE x.CourseId = co.CourseId AND x.StaffId = s.StaffId
);
GO

-- CASE RUBRICS: three gradable markers per case (added only to cases without a rubric)
INSERT INTO dbo.CaseRubricItems (CaseId, Category, Label, Points, Guidance, SortOrder)
SELECT c.CaseId, r.Category, r.Label, r.Points, r.Guidance, r.SortOrder
FROM (
    VALUES
        ('MRN000001', N'Chest tightness on exertion', N'diagnosis', N'Recognizes a stable angina pattern', 4, N'Exertional tightness that eases with rest', 0),
        ('MRN000001', N'Chest tightness on exertion', N'screening', N'Orders an ECG and troponin', 3, NULL, 1),
        ('MRN000001', N'Chest tightness on exertion', N'trap', N'Avoids penicillin-based antibiotics', 3, N'Penicillin allergy (hives) is in the chart', 2),
        ('MRN000002', N'High blood sugar with fatigue', N'diagnosis', N'Links hyperglycemia to missed metformin doses', 4, NULL, 0),
        ('MRN000002', N'High blood sugar with fatigue', N'medication_conflict', N'Notes the sulfa allergy before suggesting a sulfonylurea', 3, NULL, 1),
        ('MRN000002', N'High blood sugar with fatigue', N'screening', N'Checks A1c and electrolytes', 3, N'Sodium is low on admission', 2),
        ('MRN000003', N'Low back pain after lifting', N'diagnosis', N'Identifies a mechanical low back strain', 4, NULL, 0),
        ('MRN000003', N'Low back pain after lifting', N'screening', N'Screens for red flags such as numbness, weakness, and bladder changes', 3, NULL, 1),
        ('MRN000003', N'Low back pain after lifting', N'other', N'Gives a home exercise and activity plan', 3, NULL, 2),
        ('MRN000004', N'Worsening shortness of breath', N'diagnosis', N'Identifies poorly controlled asthma', 4, NULL, 0),
        ('MRN000004', N'Worsening shortness of breath', N'medication_conflict', N'Avoids aspirin and NSAIDs', 3, N'Aspirin causes wheezing for this patient', 1),
        ('MRN000004', N'Worsening shortness of breath', N'other', N'Reviews inhaler technique and a controller medicine', 3, NULL, 2),
        ('MRN000005', N'Foot wound that is not healing', N'diagnosis', N'Recognizes a diabetic foot infection', 4, NULL, 0),
        ('MRN000005', N'Foot wound that is not healing', N'screening', N'Checks pulses and sensation in both feet', 3, NULL, 1),
        ('MRN000005', N'Foot wound that is not healing', N'trap', N'Uses latex-free supplies', 3, N'Latex allergy is in the chart', 2),
        ('MRN000006', N'Trouble sleeping and racing thoughts', N'diagnosis', N'Describes insomnia with anxiety features', 4, NULL, 0),
        ('MRN000006', N'Trouble sleeping and racing thoughts', N'screening', N'Screens for depression and anxiety (PHQ-9, GAD-7)', 3, NULL, 1),
        ('MRN000006', N'Trouble sleeping and racing thoughts', N'medication_conflict', N'Avoids codeine-containing products', 3, N'Codeine causes nausea and vomiting', 2),
        ('MRN000002', N'Missed metformin doses', N'diagnosis', N'Links stomach upset to immediate-release metformin', 4, NULL, 0),
        ('MRN000002', N'Missed metformin doses', N'medication_conflict', N'Suggests extended-release metformin or taking it with food', 3, NULL, 1),
        ('MRN000002', N'Missed metformin doses', N'screening', N'Checks kidney function before any change', 3, NULL, 2),
        ('MRN000001', N'Statin and blood pressure medication review', N'diagnosis', N'Notes LDL above goal on the current statin dose', 4, NULL, 0),
        ('MRN000001', N'Statin and blood pressure medication review', N'medication_conflict', N'Checks interactions before raising atorvastatin', 3, NULL, 1),
        ('MRN000001', N'Statin and blood pressure medication review', N'screening', N'Orders a liver panel and a lipid recheck', 3, NULL, 2)
) AS r (Mrn, ChiefComplaint, Category, Label, Points, Guidance, SortOrder)
JOIN dbo.Patients p ON p.Mrn = r.Mrn
JOIN dbo.Cases c    ON c.PatientId = p.PatientId AND c.ChiefComplaint = r.ChiefComplaint
WHERE NOT EXISTS (SELECT 1 FROM dbo.CaseRubricItems x WHERE x.CaseId = c.CaseId);
GO

-- SOAP NOTES: every started assignment gets an encounter and the student's note.
-- Submitted and signed work has a finished note; signed notes are approved by the
-- assigning instructor. Only assignments without an encounter are filled in.
IF OBJECT_ID('tempdb..#Notes') IS NOT NULL DROP TABLE #Notes;

CREATE TABLE #Notes (
    Student        NVARCHAR(254),
    Mrn            VARCHAR(20),
    ChiefComplaint NVARCHAR(500),
    StartedAt      DATETIME2,
    Content        NVARCHAR(MAX)
);

INSERT INTO #Notes VALUES
    (N'emmanuel', 'MRN000005', N'Foot wound that is not healing', '2026-11-03T15:10:00',
     N'{"chief_complaint":"Foot wound that is not healing","hpi":"Three weeks of a right foot wound with spreading redness. Reports reduced feeling in both feet.","past_medical_history":"Type 2 diabetes, hypertension, peripheral neuropathy","past_surgical_history":"","family_history":"Brother with type 2 diabetes","social_history":"","physical_exam":"Temp 38.3 C. 2 cm wound on the right plantar foot with surrounding erythema.","assessment":"","plan":""}'),
    (N'daniel', 'MRN000001', N'Chest tightness on exertion', '2026-11-04T10:00:00',
     N'{"chief_complaint":"Chest tightness on exertion","hpi":"Two weeks of chest tightness when climbing stairs that eases with rest.","past_medical_history":"Hypertension, high cholesterol","past_surgical_history":"None","family_history":"Father had a heart attack at 55","social_history":"Desk job, walks on weekends","physical_exam":"BP 148/92, HR 88. Lungs clear.","assessment":"Likely stable angina","plan":""}'),
    (N'zachary', 'MRN000004', N'Worsening shortness of breath', '2026-11-01T09:00:00',
     N'{"chief_complaint":"Worsening shortness of breath","hpi":"One week of wheezing and night-time shortness of breath, using albuterol 4-5 times a day.","past_medical_history":"Asthma since childhood","past_surgical_history":"None","family_history":"Mother with asthma","social_history":"Lives with a cat","physical_exam":"RR 22, SpO2 94%. Expiratory wheezes in both lungs.","assessment":"Poorly controlled asthma, likely triggered by dust and pet dander","plan":"Start an inhaled corticosteroid controller, review inhaler technique, avoid aspirin and NSAIDs, follow up in 2 weeks."}'),
    (N'student', 'MRN000002', N'High blood sugar with fatigue', '2026-09-29T13:00:00',
     N'{"chief_complaint":"High blood sugar with fatigue","hpi":"Three days of fatigue and thirst, glucose 412 mg/dL. Reports missed metformin doses.","past_medical_history":"Type 2 diabetes","past_surgical_history":"None","family_history":"Mother with type 2 diabetes","social_history":"Works night shifts","physical_exam":"HR 104, dry mucous membranes.","assessment":"Hyperglycemia from missed metformin; low sodium","plan":"IV fluids, insulin per protocol, restart metformin, recheck A1c and electrolytes. Avoid sulfonylureas (sulfa allergy)."}'),
    (N'ana', 'MRN000002', N'Missed metformin doses', '2026-11-02T11:30:00',
     N'{"chief_complaint":"Missed metformin doses","hpi":"Skips the evening metformin dose because of stomach upset.","past_medical_history":"Type 2 diabetes","past_surgical_history":"None","family_history":"Mother with type 2 diabetes","social_history":"Eats dinner late after night shifts","physical_exam":"No acute distress.","assessment":"Non-adherence from GI side effects of immediate-release metformin","plan":"Switch to metformin extended-release with dinner, check kidney function first, follow up in 4 weeks."}'),
    (N'ana', 'MRN000001', N'Statin and blood pressure medication review', '2026-10-27T09:45:00',
     N'{"chief_complaint":"Statin and blood pressure medication review","hpi":"LDL 155 mg/dL on atorvastatin; BP 148/92 on lisinopril.","past_medical_history":"Hypertension, high cholesterol","past_surgical_history":"None","family_history":"Father had a heart attack at 55","social_history":"Non-smoker","physical_exam":"BP 148/92.","assessment":"LDL and blood pressure above goal on current doses","plan":"Raise atorvastatin to 40 mg after checking interactions, recheck lipids and liver panel in 6 weeks, increase lisinopril."}');

DECLARE @student NVARCHAR(254), @mrn VARCHAR(20), @complaint NVARCHAR(500),
        @started DATETIME2, @content NVARCHAR(MAX);

DECLARE note_cursor CURSOR LOCAL FAST_FORWARD FOR
    SELECT Student, Mrn, ChiefComplaint, StartedAt, Content FROM #Notes;

OPEN note_cursor;
FETCH NEXT FROM note_cursor INTO @student, @mrn, @complaint, @started, @content;

WHILE @@FETCH_STATUS = 0
BEGIN
    DECLARE @assignmentId INT, @status NVARCHAR(20), @patientId INT, @providerId INT,
            @authorUserId INT, @instructorUserId INT, @discipline NVARCHAR(150),
            @encounterId INT, @noteId INT, @addendumId INT, @finished DATETIME2;

    SELECT
        @assignmentId = a.AssignmentId,
        @status = a.EncounterStatus,
        @patientId = p.PatientId,
        @providerId = p.ProviderId,
        @authorUserId = stu.UserId,
        @instructorUserId = ins.UserId,
        @discipline = d.Name
    FROM dbo.Assignment a
    JOIN dbo.Cases c      ON c.CaseId = a.CaseId
    JOIN dbo.Patients p   ON p.PatientId = c.PatientId
    JOIN dbo.Staff stu    ON stu.StaffId = a.AssignedTo
    JOIN dbo.Staff ins    ON ins.StaffId = a.AssignedBy
    JOIN dbo.T_Login l    ON l.userid = stu.UserId
    LEFT JOIN dbo.Disciplines d ON d.DisciplineId = stu.DisciplineId
    WHERE l.username = @student
      AND p.Mrn = @mrn
      AND c.ChiefComplaint = @complaint
      AND a.EncounterId IS NULL
      AND a.EncounterStatus IN ('in_progress', 'submitted', 'signed');

    IF @@ROWCOUNT = 1
    BEGIN
        SET @finished = DATEADD(HOUR, 2, @started);

        INSERT INTO dbo.Encounters (PatientId, StartedAt) VALUES (@patientId, @started);
        SET @encounterId = SCOPE_IDENTITY();

        UPDATE dbo.Assignment SET EncounterId = @encounterId WHERE AssignmentId = @assignmentId;

        -- In-progress drafts have one version; finished notes were saved twice.
        INSERT INTO dbo.ClinicalNotes
            (PatientId, EncounterId, NoteType, Discipline, AuthorUserId, ResponsibleProviderId,
             CreatedAt, LastModifiedAt, Content, SensitivityClassification, CurrentVersion,
             IsArchived, ApprovedAt, ApprovedByUserId)
        VALUES
            (@patientId, @encounterId, N'SOAP', @discipline, @authorUserId, @providerId,
             @started,
             CASE WHEN @status = 'in_progress' THEN @started ELSE @finished END,
             @content, N'general',
             CASE WHEN @status = 'in_progress' THEN 1 ELSE 2 END,
             0,
             CASE WHEN @status = 'signed' THEN DATEADD(DAY, 1, @finished) END,
             CASE WHEN @status = 'signed' THEN @instructorUserId END);
        SET @noteId = SCOPE_IDENTITY();

        INSERT INTO dbo.NoteVersions (NoteId, VersionNumber, ContentSnapshot, AuthorUserId, CreatedAt, ChangeSummary)
        VALUES (@noteId, 1, @content, @authorUserId, @started, N'Initial draft');

        INSERT INTO dbo.NoteAuditEvents (NoteId, ActorUserId, Action, Details, CreatedAt)
        VALUES (@noteId, @authorUserId, N'note_created', N'Student started the SOAP note', @started);

        IF @status <> 'in_progress'
        BEGIN
            INSERT INTO dbo.NoteVersions (NoteId, VersionNumber, ContentSnapshot, AuthorUserId, CreatedAt, ChangeSummary)
            VALUES (@noteId, 2, @content, @authorUserId, @finished, N'Completed assessment and plan');

            INSERT INTO dbo.NoteAuditEvents (NoteId, ActorUserId, Action, Details, CreatedAt)
            VALUES (@noteId, @authorUserId, N'note_updated', N'Saved version 2', @finished);
        END

        IF @status = 'signed'
        BEGIN
            INSERT INTO dbo.NoteAuditEvents (NoteId, ActorUserId, Action, Details, CreatedAt)
            VALUES (@noteId, @instructorUserId, N'note_approved', N'Instructor approved the clinical note', DATEADD(DAY, 1, @finished));

            UPDATE dbo.Assignment
            SET Feedback = N'Clear assessment that ties the plan to the chart. Remember to list allergies before suggesting new medicines.',
                FeedbackUpdatedAt = DATEADD(DAY, 1, @finished)
            WHERE AssignmentId = @assignmentId;

            -- A late correction, added after approval
            INSERT INTO dbo.NoteAddenda (NoteId, AuthorUserId, Content, CreatedAt)
            VALUES (@noteId, @authorUserId, N'Addendum: patient confirmed the allergy list at the follow-up call.', DATEADD(DAY, 2, @finished));
            SET @addendumId = SCOPE_IDENTITY();

            INSERT INTO dbo.NoteAuditEvents (NoteId, ActorUserId, Action, AddendumId, Details, CreatedAt)
            VALUES (@noteId, @authorUserId, N'addendum_created', @addendumId, N'Added an addendum', DATEADD(DAY, 2, @finished));
        END
    END

    FETCH NEXT FROM note_cursor INTO @student, @mrn, @complaint, @started, @content;
END

CLOSE note_cursor;
DEALLOCATE note_cursor;
DROP TABLE #Notes;
GO

-- RUBRIC SCORES: signed work is fully scored (one point off the second marker)
INSERT INTO dbo.AssignmentRubricScores (AssignmentId, RubricItemId, PointsAwarded, Comment, ScoredAt)
SELECT a.AssignmentId, ri.RubricItemId,
       CASE WHEN ri.SortOrder = 1 THEN ri.Points - 1 ELSE ri.Points END,
       CASE WHEN ri.SortOrder = 1 THEN N'Mentioned, but not tied to the plan' END,
       COALESCE(a.FeedbackUpdatedAt, SYSUTCDATETIME())
FROM dbo.Assignment a
JOIN dbo.CaseRubricItems ri ON ri.CaseId = a.CaseId
WHERE a.EncounterStatus = 'signed'
  AND NOT EXISTS (
      SELECT 1 FROM dbo.AssignmentRubricScores x
      WHERE x.AssignmentId = a.AssignmentId AND x.RubricItemId = ri.RubricItemId
  );
GO

-- GRADES: signed work has a published SOAP grade
INSERT INTO dbo.AssignmentGrades (AssignmentId, AdjustmentPoints, AdjustmentReason, GradedByStaffId, UpdatedAt, PublishedAt)
SELECT a.AssignmentId, 1, N'Extra credit for the follow-up addendum', a.AssignedBy,
       COALESCE(a.FeedbackUpdatedAt, SYSUTCDATETIME()), COALESCE(a.FeedbackUpdatedAt, SYSUTCDATETIME())
FROM dbo.Assignment a
WHERE a.EncounterStatus = 'signed'
  AND NOT EXISTS (SELECT 1 FROM dbo.AssignmentGrades g WHERE g.AssignmentId = a.AssignmentId);
GO

INSERT INTO dbo.AssignmentGradeItems (AssignmentId, CriterionKey, Label, PossiblePoints, EarnedPoints, Comment, SortOrder)
SELECT g.AssignmentId, i.CriterionKey, i.Label, 10, i.Earned, i.Comment, i.SortOrder
FROM dbo.AssignmentGrades g
CROSS JOIN (
    VALUES
        (N'soap-1', N'Subjective', 9,  N'Good history; add the social history', 0),
        (N'soap-2', N'Objective',  10, NULL,                                    1),
        (N'soap-3', N'Assessment', 8,  N'Explain how the labs support it',      2),
        (N'soap-4', N'Plan',       9,  NULL,                                    3)
) AS i (CriterionKey, Label, Earned, Comment, SortOrder)
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.AssignmentGradeItems x
    WHERE x.AssignmentId = g.AssignmentId AND x.CriterionKey = i.CriterionKey
);
GO

-- ROOM ASSIGNMENTS: three patients are in a room now, one was discharged
INSERT INTO dbo.RoomAssignments (RoomId, PatientId, AssignedAt, DischargedAt)
SELECT r.RoomId, p.PatientId, ra.AssignedAt, ra.DischargedAt
FROM (
    VALUES
        (100, 'MRN000002', CAST('2026-10-02T06:30:00' AS DATETIME2), CAST(NULL AS DATETIME2)),
        (101, 'MRN000005', CAST('2026-10-03T07:30:00' AS DATETIME2), CAST(NULL AS DATETIME2)),
        (103, 'MRN000001', CAST('2026-11-04T11:00:00' AS DATETIME2), CAST(NULL AS DATETIME2)),
        (102, 'MRN000004', CAST('2026-10-04T08:30:00' AS DATETIME2), CAST('2026-10-06T12:00:00' AS DATETIME2))
) AS ra (RoomNumber, Mrn, AssignedAt, DischargedAt)
JOIN dbo.Rooms r    ON r.RoomNumber = ra.RoomNumber
JOIN dbo.Patients p ON p.Mrn = ra.Mrn
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.RoomAssignments x WHERE x.PatientId = p.PatientId AND x.RoomId = r.RoomId
);

-- A room with a current patient is occupied
UPDATE r SET Status = 'occupied'
FROM dbo.Rooms r
WHERE r.Status = 'available'
  AND EXISTS (SELECT 1 FROM dbo.RoomAssignments ra WHERE ra.RoomId = r.RoomId AND ra.DischargedAt IS NULL);
GO

-- APPOINTMENTS
INSERT INTO dbo.Appointments (PatientId, ProviderId, AppointmentDateTime, Location, Status)
SELECT p.PatientId, pr.ProviderId, a.AppointmentDateTime, a.Location, a.Status
FROM (
    VALUES
        ('MRN000001', 'susan.lee@clinic.example',    CAST('2026-10-01T09:00:00' AS DATETIME2), N'Cardiology Clinic, Room 2',       'completed'),
        ('MRN000001', 'susan.lee@clinic.example',    CAST('2026-11-12T09:30:00' AS DATETIME2), N'Cardiology Clinic, Room 2',       'scheduled'),
        ('MRN000002', 'mark.feldman@clinic.example', CAST('2026-11-10T14:00:00' AS DATETIME2), N'Internal Medicine Clinic',        'scheduled'),
        ('MRN000003', 'mark.feldman@clinic.example', CAST('2026-10-20T10:30:00' AS DATETIME2), N'Internal Medicine Clinic',        'cancelled'),
        ('MRN000003', 'mark.feldman@clinic.example', CAST('2026-11-17T10:30:00' AS DATETIME2), N'Rehabilitation Center, Gym B',    'scheduled'),
        ('MRN000004', 'priya.rao@clinic.example',    CAST('2026-11-18T10:15:00' AS DATETIME2), N'Pulmonary Function Lab',          'scheduled'),
        ('MRN000005', 'mark.feldman@clinic.example', CAST('2026-11-07T08:00:00' AS DATETIME2), N'Wound Care Center',               'scheduled'),
        ('MRN000006', 'priya.rao@clinic.example',    CAST('2026-10-28T15:00:00' AS DATETIME2), N'Behavioral Health Clinic',        'completed')
) AS a (Mrn, ProviderEmail, AppointmentDateTime, Location, Status)
JOIN dbo.Patients p   ON p.Mrn = a.Mrn
JOIN dbo.Providers pr ON pr.Email = a.ProviderEmail
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.Appointments x
    WHERE x.PatientId = p.PatientId AND x.AppointmentDateTime = a.AppointmentDateTime
);
GO

-- BILLING CHARGES
INSERT INTO dbo.BillingCharges (PatientId, ChargeSummary, ChargeAmount)
SELECT p.PatientId, b.ChargeSummary, b.ChargeAmount
FROM (
    VALUES
        ('MRN000001', N'Office visit, established patient', 145.00),
        ('MRN000001', N'12-lead ECG',                        68.50),
        ('MRN000001', N'Troponin I',                         42.00),
        ('MRN000002', N'Inpatient admission, day 1',       1850.00),
        ('MRN000002', N'Hemoglobin A1c',                     35.00),
        ('MRN000002', N'Basic metabolic panel',              29.75),
        ('MRN000003', N'Physical therapy evaluation',       160.00),
        ('MRN000004', N'Spirometry',                         95.00),
        ('MRN000005', N'Inpatient admission, day 1',       1850.00),
        ('MRN000005', N'Wound debridement',                 420.00),
        ('MRN000005', N'Complete blood count',               24.00),
        ('MRN000006', N'Behavioral health intake',          210.00)
) AS b (Mrn, ChargeSummary, ChargeAmount)
JOIN dbo.Patients p ON p.Mrn = b.Mrn
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.BillingCharges x WHERE x.PatientId = p.PatientId AND x.ChargeSummary = b.ChargeSummary
);
GO

-- INSURANCE: a primary plan for everyone, a secondary plan for one patient
INSERT INTO dbo.PatientInsurance
    (PatientId, InsuranceCompany, MemberId, GroupNumber, PolicyholderName, PolicyholderDateOfBirth,
     InsurancePriority, CoverageStartDate, CoverageEndDate, VerificationStatus)
SELECT p.PatientId, i.Company, i.MemberId, i.GroupNumber, i.Holder, CAST(i.HolderDob AS DATE),
       i.Priority, CAST(i.StartDate AS DATE), CAST(i.EndDate AS DATE), i.Verification
FROM (
    VALUES
        ('MRN000001', N'Lone Star Health Plan',  N'LSH-4410273', N'GRP-1180', N'James Carter',    '1984-03-12', 'primary',   '2026-01-01', NULL,         'verified_active'),
        ('MRN000002', N'Sun City Mutual',        N'SCM-882015',  N'GRP-2044', N'Maria Gonzalez',  '1992-07-25', 'primary',   '2025-07-01', NULL,         'verified_active'),
        ('MRN000003', N'Desert Valley Insurance', N'DVI-303177', NULL,        N'David Nguyen',    '1978-11-02', 'primary',   '2024-01-01', '2026-09-30', 'verified_inactive'),
        ('MRN000004', N'Lone Star Health Plan',  N'LSH-5520981', N'GRP-1180', N'Linda Thompson',  '1972-04-08', 'primary',   '2026-01-01', NULL,         'unverified'),
        ('MRN000005', N'Federal Senior Care',    N'FSC-77812A',  NULL,        N'Michael Johnson', '1965-09-30', 'primary',   '2025-10-01', NULL,         'verified_active'),
        ('MRN000005', N'Sun City Mutual',        N'SCM-119402',  N'GRP-3307', N'Michael Johnson', '1965-09-30', 'secondary', '2025-10-01', NULL,         'unable_to_verify'),
        ('MRN000006', N'Desert Valley Insurance', N'DVI-610458', N'GRP-0952', N'Aisha Patel',     '1989-05-14', 'primary',   '2026-03-01', NULL,         'verified_active')
) AS i (Mrn, Company, MemberId, GroupNumber, Holder, HolderDob, Priority, StartDate, EndDate, Verification)
JOIN dbo.Patients p ON p.Mrn = i.Mrn
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.PatientInsurance x WHERE x.PatientId = p.PatientId AND x.MemberId = i.MemberId
);
GO

-- DELETION AUDIT: a few past delete requests by the dev admin
INSERT INTO dbo.DeletionAuditLog
    (OccurredAt, ActorUserId, ActorUsername, Resource, ResourceId, RequestPath, Outcome, StatusCode, ClientIp, Details)
SELECT d.OccurredAt, l.userid, l.username, d.Resource, d.ResourceId, d.RequestPath, d.Outcome, d.StatusCode, '127.0.0.1', d.Details
FROM (
    VALUES
        (CAST('2026-10-21T16:02:00' AS DATETIME2), N'drugs',    N'99', N'/drugs/99',    N'not_found', 404, NULL),
        (CAST('2026-10-22T09:15:00' AS DATETIME2), N'patients', N'6',  N'/patients/6',  N'cancelled', CAST(NULL AS INT), N'Confirmation dialog cancelled'),
        (CAST('2026-10-29T11:40:00' AS DATETIME2), N'rooms',    N'105', N'/rooms/105',  N'conflict',  409, NULL)
) AS d (OccurredAt, Resource, ResourceId, RequestPath, Outcome, StatusCode, Details)
JOIN dbo.T_Login l ON l.username = N'dev'
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.DeletionAuditLog x WHERE x.RequestPath = d.RequestPath AND x.OccurredAt = d.OccurredAt
);
GO
