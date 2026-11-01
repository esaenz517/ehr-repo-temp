import logo from "../../images/UTEP-Logo.png";
import "./about.css";

// The three steps a case goes through, shown as a numbered flow.
const WORKFLOW = [
  {
    title: "Instructors build a case",
    text: "Create a patient, chart data (medications, allergies, labs) and a grading rubric, then assign it to students.",
  },
  {
    title: "Students document care",
    text: "Students open the case, review the chart and history, and write a SOAP note they can save and submit.",
  },
  {
    title: "Instructors grade and give feedback",
    text: "Instructors score the note against the rubric, sign it off or send it back, and publish the grade.",
  },
];

const FEATURES = [
  { title: "Patient charts", text: "Demographics, medical and family history, medications, allergies, labs and vitals." },
  { title: "SOAP notes", text: "Guided Subjective, Objective, Assessment and Plan sections with saved versions." },
  { title: "Rubric grading", text: "Point-based rubrics, instructor feedback and published grades." },
  { title: "Progress tracking", text: "Dashboards and alerts for inactive or overdue assignments." },
];

// Project team. Edit this list to add roles or change how names appear.
const TEAM = ["Emmanuel Saenz", "Zachary Wittmann", "Joey", "Kinley Wangyel", "Daniel Marin", "Jacob Silva"];

const TECH = ["React + TypeScript", "Python FastAPI", "SQL Server", "Docker"];

const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

// About Us: what the app is for, how it works, and who built it.
export function AboutPage() {
  return (
    <div className="ui-page about">
      <section className="about-hero">
        <img className="about-logo" src={logo} alt="UTEP logo" />
        <div>
          <p className="about-eyebrow">About us</p>
          <h1 className="about-title">Electronic Medical Records training</h1>
          <p className="about-lead">
            A practice EMR built at The University of Texas at El Paso, where students learn clinical
            documentation on realistic patient cases before they work with real records.
          </p>
        </div>
      </section>

      <section className="about-section">
        <h2 className="about-section-title">How it works</h2>
        <ol className="about-steps">
          {WORKFLOW.map((step, i) => (
            <li key={step.title} className="about-step">
              <span className="about-step-number" aria-hidden="true">{i + 1}</span>
              <h3 className="about-step-title">{step.title}</h3>
              <p className="ui-muted">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="about-section">
        <h2 className="about-section-title">What's inside</h2>
        <ul className="about-features">
          {FEATURES.map((f) => (
            <li key={f.title} className="about-feature">
              <h3 className="about-feature-title">{f.title}</h3>
              <p className="ui-muted">{f.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="about-section">
        <h2 className="about-section-title">Our team</h2>
        <ul className="about-team">
          {TEAM.map((name) => (
            <li key={name} className="about-member">
              <span className="about-avatar" aria-hidden="true">{initials(name)}</span>
              <span className="about-member-name">{name}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="about-section">
        <h2 className="about-section-title">Built with</h2>
        <ul className="about-tech">
          {TECH.map((t) => (
            <li key={t} className="ui-badge">{t}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
