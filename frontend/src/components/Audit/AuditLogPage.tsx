import { useState } from "react";
import { PageHeader } from "../PageHeader";
import { DeletionLogTab } from "./DeletionLogTab";
import { NoteAccessLogTab } from "./NoteAccessLogTab";
import "./audit.css";

type AuditTab = "notes" | "deletions";

const TABS: { id: AuditTab; label: string }[] = [
  { id: "notes", label: "Note access" },
  { id: "deletions", label: "Deletions" },
];

// Admin only (audit.read): the app's audit logs, one tab each. The logs are
// kept in separate tables; this page only shows them side by side. Entries
// can't be edited or deleted.
export function AuditLogPage() {
  const [tab, setTab] = useState<AuditTab>("notes");

  return (
    <div className="ui-page">
      <PageHeader
        title="Audit log"
        description="Who viewed or changed clinical notes, and who deleted (or tried to delete) records. Newest first. Entries cannot be edited or deleted."
      />

      <div className="ui-tabs audit-tabs" role="tablist" aria-label="Audit logs">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`audit-tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls="audit-tab-panel"
            className={`ui-tab${tab === t.id ? " ui-tab--active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="ui-tab-panel" role="tabpanel" id="audit-tab-panel" aria-labelledby={`audit-tab-${tab}`}>
        {tab === "notes" ? <NoteAccessLogTab /> : <DeletionLogTab />}
      </div>
    </div>
  );
}
