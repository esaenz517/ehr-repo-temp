import { useState } from "react";
import { usePortalAccount } from "../../hooks/usePortalAccount";
import "../Portal/portal.css";

interface PortalAccessPanelProps {
  patientId: number;
  canCreate: boolean; // user.create
  canChangeStatus: boolean; // user.manage_roles (same as disabling any account)
}

const STATUS_BADGES: Record<string, string> = {
  active: "ui-badge ui-badge--success",
  disabled: "ui-badge ui-badge--muted",
  locked: "ui-badge ui-badge--error",
};

// Patient details tab: does this patient have a portal account, and if not, create one.
// The patient signs in on the normal login page and sees only their own record.
export function PortalAccessPanel({ patientId, canCreate, canChangeStatus }: PortalAccessPanelProps) {
  const { account, loading, error, temporaryPassword, create, setActive } = usePortalAccount(patientId);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;
    setSaving(true);
    const ok = await create({
      email: email.trim(),
      username: username.trim() || undefined,
      password: password || undefined,
    });
    setSaving(false);
    if (ok) {
      setEmail("");
      setUsername("");
      setPassword("");
    }
  };

  if (loading) return <p className="ui-muted">Loading portal access…</p>;

  return (
    <div>
      {error && <p className="ui-error">{error}</p>}

      {account ? (
        <>
          <dl className="ui-detail-list">
            <dt>Username</dt>
            <dd>{account.username ?? "—"}</dd>
            <dt>Email</dt>
            <dd>{account.email}</dd>
            <dt>Status</dt>
            <dd>
              <span className={STATUS_BADGES[account.account_status] ?? "ui-badge ui-badge--muted"}>
                {account.account_status === "active" ? "Can sign in" : account.account_status}
              </span>
            </dd>
          </dl>

          {temporaryPassword && (
            <div className="ui-alert ui-alert--success" role="status">
              <p className="ui-flush">
                Portal account created. Give the patient this temporary password. It won't be shown again:
              </p>
              <p className="ui-flush portal-access-password">{temporaryPassword}</p>
            </div>
          )}

          {canChangeStatus && (
            <div className="ui-form-actions">
              {account.account_status === "active" ? (
                <button type="button" className="ui-button ui-button--danger ui-button--small" onClick={() => setActive(false)}>
                  Turn off portal access
                </button>
              ) : (
                <button type="button" className="ui-button ui-button--small" onClick={() => setActive(true)}>
                  Turn on portal access
                </button>
              )}
            </div>
          )}
        </>
      ) : canCreate ? (
        <form onSubmit={handleSubmit}>
          <p className="ui-muted">
            This patient has no portal account. Create one so they can sign in and see their appointments,
            history, results, and billing.
          </p>
          <div className="portal-access-form">
            <label>
              Email
              <input className="ui-input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label>
              Username <span className="ui-muted">(optional, defaults to email)</span>
              <input className="ui-input" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="off" />
            </label>
            <label>
              Password <span className="ui-muted">(optional, generated if blank)</span>
              <input className="ui-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
            </label>
            <button type="submit" className="ui-button" disabled={saving || !email.trim()}>
              {saving ? "Creating…" : "Create portal account"}
            </button>
          </div>
        </form>
      ) : (
        <p className="ui-muted">This patient has no portal account.</p>
      )}
    </div>
  );
}
