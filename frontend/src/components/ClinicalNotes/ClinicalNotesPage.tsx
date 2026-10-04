import { useEffect, useState } from "react";

import {
    blankSoap,
    clinicalNotesApi,
    formatUtc,
} from "../../api/clinicalNotes";

import type {
    ChartContext,
    ClinicalNote,
    Encounter,
    NoteVersion,
    SoapContent,
} from "../../api/clinicalNotes";

import { patientsApi } from "../../api/patients";
import type { Patient } from "../../types";

import { SoapEditor } from "./SoapEditor";
import { NOTE_TEMPLATES } from "./templates";

import "./clinicalNotes.css";

interface ClinicalNotesPageProps {
    initialPatientId?: number;
}

export function ClinicalNotesPage({ initialPatientId }: ClinicalNotesPageProps = {}) {
    const [patients, setPatients] =
        useState<Patient[]>([]);

    const [patientId, setPatientId] =
        useState<number | null>(initialPatientId ?? null);

    const [encounters, setEncounters] =
        useState<Encounter[]>([]);

    const [encounterId, setEncounterId] =
        useState<number | null>(null);

    const [context, setContext] =
        useState<ChartContext | null>(null);

    const [notes, setNotes] =
        useState<ClinicalNote[]>([]);

    const [note, setNote] =
        useState<ClinicalNote | null>(null);

    const [content, setContent] =
        useState<SoapContent>(blankSoap);

    const [sensitivity, setSensitivity] =
        useState<"general" | "restricted">(
            "general"
        );

    const [summary, setSummary] =
        useState("");

    const [versions, setVersions] =
        useState<NoteVersion[]>([]);

    const [reviewVersion, setReviewVersion] =
        useState<NoteVersion | null>(null);

    const [loading, setLoading] =
        useState(false);

    const [saving, setSaving] =
        useState(false);

    const [dirty, setDirty] =
        useState(false);

    const [showArchived, setShowArchived] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);

    const [message, setMessage] =
        useState<string | null>(null);

    useEffect(() => {
        patientsApi
            .list()
            .then(setPatients)
            .catch((e) => setError(e.message));
    }, []);

    useEffect(() => {
        setContext(null);
        setNotes([]);
        setEncounters([]);
        setEncounterId(null);
        setNote(null);
        setContent(blankSoap());
        setVersions([]);
        setReviewVersion(null);
        setDirty(false);
        setError(null);
        setMessage(null);

        if (patientId === null) {
            setLoading(false);
            return;
        }

        let active = true;

        setLoading(true);

        Promise.all([
            clinicalNotesApi.context(patientId),
            clinicalNotesApi.encounters(patientId),
            clinicalNotesApi.list(
                patientId,
                showArchived
            ),
        ])
            .then(
                ([
                    chart,
                    visits,
                    patientNotes,
                ]) => {
                    if (!active) return;

                    setContext(chart);
                    setEncounters(visits);

                    setEncounterId(
                        visits[0]?.encounter_id ?? null
                    );

                    setNotes(patientNotes);
                }
            )
            .catch((e) => {
                if (active) {
                    setError(e.message);
                }
            })
            .finally(() => {
                if (active) {
                    setLoading(false);
                }
            });

        return () => {
            active = false;
        };
    }, [patientId, showArchived]);

    const selectNote = async (
        selected: ClinicalNote
    ) => {
        if (
            dirty &&
            !window.confirm(
                "Discard unsaved changes?"
            )
        ) {
            return;
        }

        setNote(selected);
        setContent({ ...selected.content });
        setEncounterId(
            selected.encounter_id
        );
        setSensitivity(
            selected.sensitivity_classification
        );

        setDirty(false);
        setSummary("");
        setReviewVersion(null);
        setVersions([]);
        setError(null);

        try {
            setVersions(
                await clinicalNotesApi.versions(
                    selected.note_id
                )
            );
        } catch (e) {
            setError((e as Error).message);
        }
    };

    const newDraft = () => {
        if (
            dirty &&
            !window.confirm(
                "Discard unsaved changes?"
            )
        ) {
            return;
        }

        setNote(null);
        setContent(blankSoap());
        setSensitivity("general");
        setVersions([]);
        setReviewVersion(null);
        setDirty(false);
        setSummary("");
        setError(null);
    };

    const startEncounter = async () => {
        if (patientId === null) {
            return;
        }

        setError(null);

        try {
            const visit =
                await clinicalNotesApi.startEncounter(
                    patientId
                );

            setEncounters((current) => [
                visit,
                ...current,
            ]);

            setEncounterId(
                visit.encounter_id
            );

            setMessage(
                `Encounter #${visit.encounter_id} started.`
            );
        } catch (e) {
            setError((e as Error).message);
        }
    };

    const save = async () => {
        if (
            patientId === null ||
            encounterId === null ||
            note?.is_archived ||
            (!dirty && note)
        ) {
            return;
        }

        setSaving(true);
        setError(null);
        setMessage(null);

        try {
            const saved = note
                ? await clinicalNotesApi.save(
                    note.note_id,
                    note.current_version,
                    content,
                    summary
                )
                : await clinicalNotesApi.create(
                    patientId,
                    encounterId,
                    content,
                    sensitivity
                );

            setNote(saved);

            setNotes((current) => [
                saved,
                ...current.filter(
                    (n) =>
                        n.note_id !== saved.note_id
                ),
            ]);

            setReviewVersion(null);
            setSummary("");
            setDirty(false);

            setMessage(
                `Draft saved as version ${saved.current_version}.`
            );

            setVersions(
                await clinicalNotesApi.versions(
                    saved.note_id
                )
            );
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setSaving(false);
        }
    };

    const archive = async () => {
        if (
            !note ||
            !window.confirm(
                "Archive this note? It will leave the active patient list."
            )
        ) {
            return;
        }

        try {
            await clinicalNotesApi.archive(
                note.note_id
            );

            if (patientId !== null) {
                setNotes(
                    await clinicalNotesApi.list(
                        patientId,
                        showArchived
                    )
                );
            }

            setNote(null);
            setVersions([]);
            setContent(blankSoap());
            setDirty(false);
            setMessage("Note archived.");
        } catch (e) {
            setError((e as Error).message);
        }
    };

    const patient = patients.find(
        (p) => p.patient_id === patientId
    );

    return (
        <div className="clinical-notes">
            <h1>Clinical Notes</h1>

            <p className="note-muted">
                Write a SOAP draft for an
                encounter. Patient chart
                information is shown alongside
                manual entry.
            </p>

            <div className="note-controls">
                <label>
                    Patient

                    <select
                        value={patientId ?? ""}
                        onChange={(e) => {
                            if (
                                dirty &&
                                !window.confirm(
                                    "Discard unsaved changes?"
                                )
                            ) {
                                return;
                            }

                            setPatientId(
                                e.target.value
                                    ? Number(e.target.value)
                                    : null
                            );
                        }}
                    >
                        <option value="">
                            Select a patient
                        </option>

                        {patients.map((p) => (
                            <option
                                key={p.patient_id}
                                value={p.patient_id}
                            >
                                {p.first_name}{" "}
                                {p.last_name}{" "}
                                {p.mrn
                                    ? `· ${p.mrn}`
                                    : ""}
                            </option>
                        ))}
                    </select>
                </label>

                {patient && (
                    <>
                        <label>
                            Encounter

                            <select
                                value={
                                    encounterId ?? ""
                                }
                                disabled={!!note}
                                onChange={(e) =>
                                    setEncounterId(
                                        Number(
                                            e.target.value
                                        )
                                    )
                                }
                            >
                                {encounters.length ===
                                    0 && (
                                        <option value="">
                                            Start an encounter
                                            first
                                        </option>
                                    )}

                                {encounters.map(
                                    (v) => (
                                        <option
                                            key={
                                                v.encounter_id
                                            }
                                            value={
                                                v.encounter_id
                                            }
                                        >
                                            #
                                            {
                                                v.encounter_id
                                            }{" "}
                                            ·{" "}
                                            {formatUtc(
                                                v.started_at
                                            )}
                                        </option>
                                    )
                                )}
                            </select>
                        </label>

                        <button
                            type="button"
                            onClick={startEncounter}
                        >
                            Start encounter
                        </button>
                    </>
                )}
            </div>

            {patient && (
                <p className="note-muted">
                    {patient.first_name}{" "}
                    {patient.last_name} ·{" "}
                    {patient.mrn || "No MRN"} ·
                    Provider:{" "}
                    {patient.provider
                        ? `${patient.provider.first_name} ${patient.provider.last_name}`
                        : "Not assigned"}
                </p>
            )}

            {loading && (
                <p role="status">
                    Loading chart…
                </p>
            )}

            {error && (
                <p
                    role="alert"
                    className="note-error"
                >
                    {error}
                </p>
            )}

            {message && (
                <p
                    role="status"
                    className="note-success"
                >
                    {message}
                </p>
            )}

            {context && (
                <div className="notes-layout">
                    <aside className="note-list">
                        <h2>Patient notes</h2>

                        <button
                            type="button"
                            onClick={newDraft}
                        >
                            New note
                        </button>

                        <label className="note-archive-toggle">
                            <input
                                type="checkbox"
                                checked={
                                    showArchived
                                }
                                onChange={(e) => {
                                    if (
                                        dirty &&
                                        !window.confirm(
                                            "Discard unsaved changes?"
                                        )
                                    ) {
                                        return;
                                    }

                                    setShowArchived(
                                        e.target.checked
                                    );
                                }}
                            />
                            Show archived
                        </label>

                        {notes.length === 0 && (
                            <p className="note-muted">
                                No saved notes yet.
                            </p>
                        )}

                        <ul>
                            {notes.map((n) => (
                                <li key={n.note_id}>
                                    <button
                                        type="button"
                                        className={
                                            note?.note_id ===
                                                n.note_id
                                                ? "selected"
                                                : ""
                                        }
                                        onClick={() =>
                                            selectNote(n)
                                        }
                                    >
                                        SOAP #{n.note_id} · v
                                        {n.current_version}
                                        {n.is_archived
                                            ? " · archived"
                                            : ""}

                                        <small>
                                            {formatUtc(
                                                n.last_modified_at
                                            )}{" "}
                                            ·{" "}
                                            {
                                                n.sensitivity_classification
                                            }
                                        </small>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </aside>

                    <div className="note-workspace">
                        <div className="note-toolbar">
                            <label>
                                Template

                                <select
                                    value="SOAP"
                                    onChange={() => { }}
                                    disabled={!!note}
                                >
                                    {NOTE_TEMPLATES.map(
                                        (t) => (
                                            <option
                                                key={t.id}
                                                value={t.id}
                                                disabled={
                                                    !t.enabled
                                                }
                                            >
                                                {t.label}
                                                {t.enabled
                                                    ? ""
                                                    : " (coming later)"}
                                            </option>
                                        )
                                    )}
                                </select>
                            </label>

                            <label>
                                Sensitivity

                                <select
                                    value={sensitivity}
                                    disabled={
                                        !!note ||
                                        !!reviewVersion
                                    }
                                    onChange={(e) =>
                                        setSensitivity(
                                            e.target
                                                .value as
                                            | "general"
                                            | "restricted"
                                        )
                                    }
                                >
                                    <option value="general">
                                        General
                                    </option>

                                    <option value="restricted">
                                        Restricted
                                    </option>
                                </select>
                            </label>

                            <span className="note-muted">
                                {note
                                    ? `Draft #${note.note_id} · version ${note.current_version}`
                                    : "New draft"}
                            </span>
                        </div>

                        {note && (
                            <p className="note-muted">
                                Author User ID:{" "}
                                {note.author_user_id} ·
                                Discipline:{" "}
                                {note.discipline ||
                                    "Unspecified"}{" "}
                                · Responsible provider
                                ID:{" "}
                                {note.responsible_provider_id ??
                                    "None"}{" "}
                                · Created:{" "}
                                {formatUtc(
                                    note.created_at
                                )}
                            </p>
                        )}

                        {reviewVersion && (
                            <div
                                className="note-review"
                                role="status"
                            >
                                Reviewing version{" "}
                                {
                                    reviewVersion.version_number
                                }{" "}
                                (
                                {formatUtc(
                                    reviewVersion.created_at
                                )}
                                ).{" "}
                                {reviewVersion.change_summary ||
                                    "No change summary."}

                                <button
                                    type="button"
                                    onClick={() =>
                                        setReviewVersion(
                                            null
                                        )
                                    }
                                >
                                    Return to current
                                    draft
                                </button>
                            </div>
                        )}

                        <SoapEditor
                            content={
                                reviewVersion
                                    ?.content_snapshot ??
                                content
                            }
                            context={context}
                            disabled={
                                !!reviewVersion ||
                                !!note?.is_archived ||
                                saving
                            }
                            onChange={(next) => {
                                setContent(next);
                                setDirty(true);
                            }}
                        />

                        {!reviewVersion &&
                            !note?.is_archived && (
                                <div className="note-actions">
                                    {note && (
                                        <label>
                                            Change summary

                                            <input
                                                value={summary}
                                                onChange={(e) =>
                                                    setSummary(
                                                        e.target
                                                            .value
                                                    )
                                                }
                                                maxLength={500}
                                                placeholder="Optional"
                                            />
                                        </label>
                                    )}

                                    <button
                                        type="button"
                                        disabled={
                                            saving ||
                                            encounterId ===
                                            null ||
                                            (!!note &&
                                                !dirty)
                                        }
                                        onClick={save}
                                    >
                                        {saving
                                            ? "Saving…"
                                            : note
                                                ? "Save new version"
                                                : "Save draft"}
                                    </button>

                                    {note && (
                                        <button
                                            type="button"
                                            onClick={archive}
                                        >
                                            Archive note
                                        </button>
                                    )}
                                </div>
                            )}

                        {note && (
                            <section className="note-history">
                                <h2>
                                    Version history
                                </h2>

                                <ul>
                                    {versions.map(
                                        (v) => (
                                            <li
                                                key={
                                                    v.version_id
                                                }
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setReviewVersion(
                                                            v
                                                        )
                                                    }
                                                >
                                                    Version{" "}
                                                    {
                                                        v.version_number
                                                    }
                                                </button>

                                                <span>
                                                    {" "}
                                                    {formatUtc(
                                                        v.created_at
                                                    )}{" "}
                                                    · User{" "}
                                                    {
                                                        v.author_user_id
                                                    }{" "}
                                                    ·{" "}
                                                    {v.change_summary ||
                                                        "No summary"}
                                                </span>
                                            </li>
                                        )
                                    )}
                                </ul>
                            </section>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}