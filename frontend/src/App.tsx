import { useEffect, useState } from "react";
import { CreateCasePage } from "./components/CreateCasePage";
import { DrugsPage } from "./components/DrugsPage";
import { Home } from "./components/Home";
import { PatientsPage } from "./components/PatientsPage";
import { StaffPage } from "./components/StaffPage";
import { ProvidersPage } from "./components/ProvidersPage";
import { RoomsPage } from "./components/RoomsPage";
import { CoursesPage } from "./components/CoursesPage";
import { Sidebar, STUDENT_VIEWS, View } from "./components/Sidebar/Sidebar";
import { LoginPage } from "./components/Login/LoginPage";
import { loginApi } from "./api/login";
import type { Assignment, LoginResponse } from "./types";
import { MyAssignmentsPage } from "./components/Assignment/MyAssignmentsPage";
import { AssignedCasesPage } from "./components/Assignment/AssignedCasesPage";
import { ClinicalNotesPage } from "./components/ClinicalNotes/ClinicalNotesPage";
import { CaseWorkspacePage } from "./components/Assignment/CaseWorkspacePage";
import { StudentGradesPage } from "./components/Grades/StudentGradesPage";
import { InstructorProgressPage } from "./components/Progress/InstructorProgressPage";
import { gradesApi } from "./api/grades";
import { AboutPage } from "./components/About/AboutPage";

function App() {
  const [view, setView] = useState<View>("home");
  const [user, setUser] = useState<LoginResponse | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  // Restore the signed-in user from the session cookie after a page refresh
  useEffect(() => {
    loginApi.me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setCheckingSession(false));
  }, []);

  const [openAssignment, setOpenAssignment] = useState<Assignment | null>(null); // Case opens from My Assignments list
  const [caseOpenedFrom, setCaseOpenedFrom] = useState<View>("assignments");
  const [reviewId, setReviewId] = useState<number | null>(null); // Instructor dashboard opens a note in Assigned Cases

  const [progressAlertCount, setProgressAlertCount] =
    useState(0);

  useEffect(() => {
    if (!user || (user.student && !user.admin)) {
      setProgressAlertCount(0);
      return;
    }

    let active = true;

    const checkProgress = async () => {
      try {
        const report = await gradesApi.progress();

        if (active) {
          setProgressAlertCount(
            report.inactive + report.overdue
          );
        }
      } catch {
        if (active) {
          setProgressAlertCount(0);
        }
      }
    };

    void checkProgress();

    // Recheck alerts every 60 seconds.
    const timer = window.setInterval(() => {
      void checkProgress();
    }, 60000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [user?.staffid, user?.student, user?.admin]);

  if (checkingSession) {
    return null;
  }

  if (!user) {
    return <LoginPage onLogin={setUser} />;
  }
  // Students who are only students get to see Home and My Assignments
  const allowedViews = user.student && !user.admin ? STUDENT_VIEWS : undefined;
  const canView = (v: View) => !allowedViews || allowedViews.includes(v);

  return (
    <div className="app-layout">
      <Sidebar active={view} username={user.username}
        progressAlertCount={progressAlertCount}
        onNavigate={(v) => {
          setOpenAssignment(null); // Clicking out of a case closes it
          setReviewId(null);
          setView(v);
        }}
        allowedViews={allowedViews}
        onLogout={() => {
          loginApi.logout()
            .catch(() => { }) // sign out locally even if the server call fails
            .finally(() => {
              setUser(null);
              setView("home");
            });
          setUser(null);
          setOpenAssignment(null);
          setView("home");
        }}
      />

      <main className="app-main">
        {view === "home" && (
          <Home
            isStudent={!!allowedViews}
            username={user.username}
            staffId={user.staffid}
            // Dashboard cases open in the My Assignments workspace
            onOpenAssignment={(a) => {
              setOpenAssignment(a);
              setCaseOpenedFrom("home");
              setView("assignments");
            }}
            onViewAssignments={() => setView("assignments")}
            onReviewAssignment={(a) => {
              setReviewId(a.assignment_id);
              setView("assignedCases");
            }}
          />
        )}
        {view === "patients" && canView("patients") && <PatientsPage />}
        {view === "staff" && canView("staff") && (
          <StaffPage canBatchImport={user.admin} />
        )}        {view === "providers" && canView("providers") && <ProvidersPage />}
        {view === "drugs" && canView("drugs") && <DrugsPage />}
        {view === "rooms" && canView("rooms") && <RoomsPage />}
        {view === "courses" && canView("courses") && <CoursesPage />}
        {view === "createCase" && canView("createCase") && <CreateCasePage staffId={user.staffid} />}
        {view === "assignments" &&
          (openAssignment ? (
            <CaseWorkspacePage
              assignment={openAssignment}
              backLabel={caseOpenedFrom === "home" ? "Dashboard" : "My Assignments"}
              onBack={() => {
                setOpenAssignment(null);
                setView(caseOpenedFrom);
              }}
            />
          ) : (

            <MyAssignmentsPage
              studentId={user.staffid}
              onOpen={(a) => {
                setOpenAssignment(a);
                setCaseOpenedFrom("assignments");
              }}
            />
          ))}
        {view === "assignedCases" && canView("assignedCases") && <AssignedCasesPage staffId={user.staffid} initialViewingId={reviewId} />}
        {view === "clinicalNotes" && canView("clinicalNotes") && <ClinicalNotesPage />}
        {view === "grades" &&
          canView("grades") && (
            <StudentGradesPage />
          )}

        {view === "progress" &&
          canView("progress") && (
            <InstructorProgressPage />
          )}
        {view === "about" && <AboutPage />}
      </main>
    </div>
  );
}

export default App;