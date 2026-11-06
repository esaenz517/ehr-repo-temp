import { portalApi } from "../../api/portal";
import type { View } from "../../access";
import { usePortal } from "../../hooks/usePortal";
import { PageHeader } from "../PageHeader";
import { Panel } from "../Panel";
import { AppointmentRow } from "./PortalAppointments";
import { formatAppointment, formatDate, formatMoney, isUpcoming } from "./format";
import "./portal.css";

interface PortalHomeProps {
  onNavigate: (view: View) => void;
}

function greeting(now: Date) {
  const hour = now.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

// The patient's landing page: next visit, balance, care team, and shortcuts.
export function PortalHome({ onNavigate }: PortalHomeProps) {
  const profile = usePortal(portalApi.profile);
  const appointments = usePortal(portalApi.appointments);
  const billing = usePortal(portalApi.billing);
  const allergies = usePortal(portalApi.allergies);
  const medications = usePortal(portalApi.medications);

  const now = new Date();
  const upcoming = (appointments.data ?? []).filter(
    (a) => isUpcoming(a.appointment_datetime) && a.status.toLowerCase() !== "cancelled"
  );
  const next = upcoming[0];
  const p = profile.data;
  const provider = p?.provider;

  return (
    <div className="ui-page">
      <PageHeader
        title={<>{greeting(now)}{p && <>, <span className="portal-name">{p.preferred_name || p.first_name}</span></>}</>}
        description={
          <>
            {now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
            {p?.mrn && <> · Medical record {p.mrn}</>}
          </>
        }
        actions={<button className="ui-button" onClick={() => onNavigate("portalAppointments")}>My appointments</button>}
      />

      {profile.error && <p className="ui-error">{profile.error}</p>}

      <section className="ui-stats" aria-label="Summary">
        <div className="ui-stat ui-stat--info">
          <span className="portal-stat-value portal-stat-value--small">
            {appointments.loading ? "–" : next ? formatAppointment(next.appointment_datetime).date : "None scheduled"}
          </span>
          <span className="ui-stat-label">Next appointment</span>
          {next && <span className="ui-stat-meta">{formatAppointment(next.appointment_datetime).time} · {next.location}</span>}
        </div>
        <div className="ui-stat ui-stat--accent">
          <span className="portal-stat-value">{billing.loading || !billing.data ? "–" : formatMoney(billing.data.total)}</span>
          <span className="ui-stat-label">Total charges</span>
          {billing.data && <span className="ui-stat-meta">{billing.data.charges.length} charge{billing.data.charges.length === 1 ? "" : "s"}</span>}
        </div>
        <div className="ui-stat ui-stat--success">
          <span className="portal-stat-value">{medications.loading ? "–" : medications.data?.length ?? 0}</span>
          <span className="ui-stat-label">Medications</span>
        </div>
        <div className={`ui-stat ${allergies.data?.length ? "ui-stat--error" : "ui-stat--muted"}`}>
          <span className="portal-stat-value">{allergies.loading ? "–" : allergies.data?.length ?? 0}</span>
          <span className="ui-stat-label">Allergies</span>
          {!!allergies.data?.length && (
            <span className="ui-stat-meta">{allergies.data.map((a) => a.substance).join(", ")}</span>
          )}
        </div>
      </section>

      <div className="portal-columns">
        <Panel
          title="Upcoming appointments"
          actions={upcoming.length > 0 && (
            <button className="ui-button ui-button--ghost ui-button--small" onClick={() => onNavigate("portalAppointments")}>
              See all
            </button>
          )}
          flush
        >
          {appointments.loading ? (
            <p className="ui-row-empty">Loading…</p>
          ) : upcoming.length === 0 ? (
            <p className="ui-row-empty">You have no upcoming appointments.</p>
          ) : (
            <ul className="ui-row-list">
              {upcoming.slice(0, 3).map((a) => <AppointmentRow key={a.appointment_id} appointment={a} />)}
            </ul>
          )}
        </Panel>

        <Panel title="My care team">
          {profile.loading ? (
            <p className="ui-muted">Loading…</p>
          ) : provider ? (
            <address className="portal-provider">
              <p className="portal-provider-name">Dr. {provider.first_name} {provider.last_name}</p>
              {provider.specialty && <p className="ui-muted ui-flush">{provider.specialty}</p>}
              {provider.phone && <p className="ui-flush"><a href={`tel:${provider.phone}`}>{provider.phone}</a></p>}
              {provider.email && <p className="ui-flush"><a href={`mailto:${provider.email}`}>{provider.email}</a></p>}
            </address>
          ) : (
            <p className="ui-muted">No primary provider on file.</p>
          )}

          {p && (
            <dl className="ui-detail-list">
              <dt>Date of birth</dt>
              <dd>{formatDate(p.date_of_birth)}</dd>
              <dt>Pronouns</dt>
              <dd>{p.pronouns}</dd>
              <dt>Status</dt>
              <dd>{p.status === "inpatient" ? "Admitted (inpatient)" : "Outpatient"}</dd>
            </dl>
          )}
        </Panel>
      </div>
    </div>
  );
}
