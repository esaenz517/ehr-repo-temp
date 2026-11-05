"""
A case from start to finish: the instructor writes a case with a rubric and
assigns it to an enrolled student; the student starts it, writes and submits a
SOAP note; the instructor gives feedback, scores the rubric, signs it off, and
publishes a grade the student can see.
"""

import pytest

SOAP = {
    "chief_complaint": "Headache for two days",
    "hpi": "Dull frontal headache, worse in the afternoon.",
    "past_medical_history": "None",
    "past_surgical_history": "None",
    "family_history": "Mother with migraines",
    "social_history": "Drinks 4 cups of coffee a day",
    "physical_exam": "BP 122/78, neuro exam normal.",
    "assessment": "Tension-type headache",
    "plan": "Hydration, cut back on caffeine slowly, follow up in 2 weeks.",
}


@pytest.fixture(scope="module")
def case(instructor, lookup):
    response = instructor.post("/cases", json={
        "patient_id": lookup.patient("MRN000006"),
        "chief_complaint": "Headache for two days (workflow test)",
        "narrative": "Test case.",
        "created_by_staff_id": instructor.me["staffid"],
        "rubric_items": [
            {"category": "diagnosis", "label": "Names tension-type headache", "points": 5, "guidance": "Secret hint"},
            {"category": "screening", "label": "Asks about caffeine", "points": 3},
        ],
    })
    assert response.status_code == 201, response.text
    return response.json()


@pytest.fixture(scope="module")
def assignment(instructor, student, lookup, case):
    response = instructor.post("/assignments", json={
        "case_id": case["case_id"],
        "course_id": lookup.course("NURS", "3310"),
        "due_date": "2026-12-01T23:59:00",
        "assignment_type": "graded",
        "assigned_to": [student.me["staffid"]],
    })
    assert response.status_code == 201, response.text
    rows = response.json()
    assert len(rows) == 1
    return rows[0]


def test_assignment_carries_its_course(assignment, lookup):
    assert assignment["course_id"] == lookup.course("NURS", "3310")
    assert assignment["course"] == "NURS 3310"
    assert assignment["encounter_status"] == "not_started"
    assert assignment["chief_complaint"].startswith("Headache")


def test_only_enrolled_students_can_be_assigned(instructor, ana, case, lookup):
    response = instructor.post("/assignments", json={
        "case_id": case["case_id"],
        "course_id": lookup.course("NURS", "3310"),
        "assigned_to": [ana.me["staffid"]],
    })
    assert response.status_code == 400
    assert "enrolled" in response.json()["detail"]


def test_only_students_can_be_assigned(instructor, pharmacy, case):
    response = instructor.post("/assignments", json={
        "case_id": case["case_id"],
        "assigned_to": [pharmacy.me["staffid"]],
    })
    assert response.status_code == 400


def test_inactive_courses_cannot_be_used(instructor, student, case, lookup):
    response = instructor.post("/assignments", json={
        "case_id": case["case_id"],
        "course_id": lookup.course("PHAR", "5310", term="Spring", year=2026),
        "assigned_to": [student.me["staffid"]],
    })
    assert response.status_code == 400


def test_students_cannot_assign_cases(student, case):
    response = student.post("/assignments", json={"case_id": case["case_id"], "assigned_to": [student.me["staffid"]]})
    assert response.status_code == 403


def test_full_workflow(instructor, pharmacy, student, assignment, case):
    aid = assignment["assignment_id"]

    # The student sees it in their list
    mine = student.get(f"/assignments/student/{student.me['staffid']}").json()
    assert any(a["assignment_id"] == aid for a in mine)

    # Nothing to submit before starting
    assert student.get(f"/assignments/{aid}/note").json() is None
    assert student.post(f"/assignments/{aid}/submit").status_code == 409

    # Start: the assignment gets its own encounter
    started = student.post(f"/assignments/{aid}/start").json()
    assert started["encounter_status"] == "in_progress"
    encounter_id = started["encounter_id"]
    assert encounter_id
    # Starting twice keeps the same encounter
    assert student.post(f"/assignments/{aid}/start").json()["encounter_id"] == encounter_id

    # Write the note. The discipline comes from the student's person row.
    created = student.post("/clinical-notes", json={
        "patient_id": case["patient_id"], "encounter_id": encounter_id,
        "content": {**SOAP, "plan": ""},
    })
    assert created.status_code == 201, created.text
    note = created.json()
    assert note["discipline"] == "Nursing"
    assert note["current_version"] == 1

    # Saving needs the version the student last saw
    saved = student.put(f"/clinical-notes/{note['note_id']}", json={"expected_version": 1, "content": SOAP, "change_summary": "Added plan"})
    assert saved.status_code == 200, saved.text
    assert saved.json()["current_version"] == 2
    stale = student.put(f"/clinical-notes/{note['note_id']}", json={"expected_version": 1, "content": SOAP})
    assert stale.status_code == 409
    assert len(student.get(f"/clinical-notes/{note['note_id']}/versions").json()) == 2

    # Instructors can't review before submission
    assert instructor.put(f"/assignments/{aid}/feedback", json={"feedback": "Early"}).status_code == 409

    # Submit; the note is locked afterwards
    assert student.post(f"/assignments/{aid}/submit").json()["encounter_status"] == "submitted"
    locked = student.put(f"/clinical-notes/{note['note_id']}", json={"expected_version": 2, "content": SOAP})
    assert locked.status_code == 409

    # The instructor reads the note; another instructor can't touch it
    assert instructor.get(f"/assignments/{aid}/note").json()["note_id"] == note["note_id"]
    assert pharmacy.get(f"/assignments/{aid}/note").status_code == 403
    assert pharmacy.patch(f"/assignments/{aid}/status", json={"encounter_status": "signed"}).status_code == 403

    # The student sees no grade or rubric hints before sign-off
    hidden = student.get(f"/assignments/{aid}/grade").json()
    assert hidden["released"] is False and hidden["items"] == []

    # Feedback (hidden from the student while submitted)
    assert instructor.put(f"/assignments/{aid}/feedback", json={"feedback": "Good plan."}).status_code == 200
    seen = next(a for a in student.get(f"/assignments/student/{student.me['staffid']}").json() if a["assignment_id"] == aid)
    assert seen["feedback"] is None

    # Signing needs every rubric item scored
    assert instructor.patch(f"/assignments/{aid}/status", json={"encounter_status": "signed"}).status_code == 409

    rubric = instructor.get(f"/assignments/{aid}/grade").json()
    assert rubric["items"][0]["guidance"] == "Secret hint"
    items = {i["label"]: i["rubric_item_id"] for i in rubric["items"]}
    too_many = instructor.put(f"/assignments/{aid}/rubric-scores", json={"scores": [
        {"rubric_item_id": items["Names tension-type headache"], "points_awarded": 99},
    ]})
    assert too_many.status_code == 400
    scored = instructor.put(f"/assignments/{aid}/rubric-scores", json={"scores": [
        {"rubric_item_id": items["Names tension-type headache"], "points_awarded": 5},
        {"rubric_item_id": items["Asks about caffeine"], "points_awarded": 2, "comment": "Briefly"},
    ]}).json()
    assert scored["points_awarded"] == 7 and scored["total_points"] == 8

    # Only sign-off or send-back are valid instructor decisions
    assert instructor.patch(f"/assignments/{aid}/status", json={"encounter_status": "not_started"}).status_code == 422

    signed = instructor.patch(f"/assignments/{aid}/status", json={"encounter_status": "signed"})
    assert signed.status_code == 200, signed.text
    assert signed.json()["encounter_status"] == "signed"
    assert instructor.patch(f"/assignments/{aid}/status", json={"encounter_status": "in_progress"}).status_code == 409

    # Now the student sees the rubric score, without the instructor's guidance
    released = student.get(f"/assignments/{aid}/grade").json()
    assert released["released"] is True and released["points_awarded"] == 7
    assert all(i["guidance"] is None for i in released["items"])

    # SOAP grade: save a draft, then publish it
    grade = instructor.put(f"/grades/assignments/{aid}", json={
        "items": [
            {"criterion_key": "soap-1", "label": "Subjective", "possible_points": 10, "earned_points": 9},
            {"criterion_key": "soap-2", "label": "Objective", "possible_points": 10, "earned_points": 10},
        ],
        "adjustment_points": 0,
    })
    assert grade.status_code == 200, grade.text
    assert not any(g["assignment_id"] == aid for g in student.get("/grades/student").json())

    assert instructor.post(f"/grades/assignments/{aid}/publish").status_code == 200
    published = next(g for g in student.get("/grades/student").json() if g["assignment_id"] == aid)
    assert published["course"] == "NURS 3310"
    assert published["earned_points"] == 19

    # Progress report for the instructor
    progress = instructor.get("/grades/instructor/progress").json()
    row = next(a for a in progress["assignments"] if a["assignment_id"] == aid)
    assert row["encounter_status"] == "signed" and row["course"] == "NURS 3310"


def test_send_back_for_rework(instructor, lookup, case, api):
    from tests.conftest import sign_in

    zachary = sign_in(api, "zachary")
    aid = instructor.post("/assignments", json={
        "case_id": case["case_id"], "course_id": lookup.course("NURS", "3310"),
        "assigned_to": [zachary.me["staffid"]],
    }).json()[0]["assignment_id"]

    encounter_id = zachary.post(f"/assignments/{aid}/start").json()["encounter_id"]
    zachary.post("/clinical-notes", json={"patient_id": case["patient_id"], "encounter_id": encounter_id, "content": SOAP})
    zachary.post(f"/assignments/{aid}/submit")

    back = instructor.patch(f"/assignments/{aid}/status", json={"encounter_status": "in_progress", "feedback": "Add vitals."})
    assert back.status_code == 200
    seen = next(a for a in zachary.get(f"/assignments/student/{zachary.me['staffid']}").json() if a["assignment_id"] == aid)
    assert seen["encounter_status"] == "in_progress"
    assert seen["feedback"] == "Add vitals."


def test_delete_an_assignment(instructor, student, case):
    aid = instructor.post("/assignments", json={
        "case_id": case["case_id"], "assigned_to": [student.me["staffid"]], "assignment_type": "practice",
    }).json()[0]["assignment_id"]
    assert student.delete(f"/assignments/{aid}").status_code == 403
    assert instructor.delete(f"/assignments/{aid}").status_code == 204
    assert instructor.delete(f"/assignments/{aid}").status_code == 404
