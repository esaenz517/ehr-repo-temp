import { useState } from "react";
import { useStaff } from "../../hooks/useStaff";

//AI was used to assist in building this section as dev assigned to it is unfamiliar with how this works. 
// Assignment section of the Create Case form: which students get the case,
// for which course, and by when. State is local for now; move it into a
// useCreateCase hook when the form's submit is wired up.
// New assignments always start as "not_started", so status isn't chosen here.
export function AssignmentSection() {
  const { staff, loading } = useStaff();
  const [studentIds, setStudentIds] = useState<number[]>([]);
  const [course, setCourse] = useState("");
  const [dueDate, setDueDate] = useState(""); // local time from the input; convert to UTC on submit

  const students = staff.filter((s) => s.student);

  const toggleStudent = (id: number) =>
    setStudentIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 16 }}>
        <label style={{ flex: 1 }}>
          Course
          <input
            value={course}
            onChange={(e) => setCourse(e.target.value)}
            placeholder="e.g. PHAR 5310"
            style={{ display: "block", width: "100%" }}
          />
        </label>
        <label style={{ flex: 1 }}>
          Due date
          <input
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            style={{ display: "block", width: "100%" }}
          />
        </label>
      </div>

      <div>
        Students *
        {loading ? (
          <p>Loading...</p>
        ) : students.length === 0 ? (
          <p style={{ color: "#888" }}>No students found.</p>
        ) : (
          students.map((s) => (
            <label key={s.staffid} style={{ display: "block" }}>
              <input
                type="checkbox"
                checked={studentIds.includes(s.staffid)}
                onChange={() => toggleStudent(s.staffid)}
              />{" "}
              {s.last_name}, {s.first_name}
            </label>
          ))
        )}
      </div>
    </div>
  );
}
