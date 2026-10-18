import { ChangeEvent, useState } from "react";

import { batchStudentsApi } from "../../api/batchStudents";
import type { BatchStudentResult } from "../../api/batchStudents";


interface Props {
    onImported: () => void;
}


// Download credentials for newly created accounts.
function downloadCredentials(result: BatchStudentResult) {
    const created = result.rows.filter(
        (row) =>
            row.status === "created" &&
            row.temporary_password
    );

    if (!created.length) return;

    // Escape CSV fields, including spreadsheet formula characters.
    const csvCell = (value: string) => {
        const safe = /^[=+\-@\t\r]/.test(value)
            ? `'${value}`
            : value;

        return `"${safe.replace(/"/g, '""')}"`;
    };

    const contents = [
        "Name,Email,Username,TemporaryPassword",
        ...created.map((row) =>
            [
                row.name,
                row.email,
                row.username || "",
                row.temporary_password || "",
            ]
                .map(csvCell)
                .join(",")
        ),
    ].join("\r\n");

    const blob = new Blob(
        [contents],
        { type: "text/csv;charset=utf-8" }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = "student-import-credentials.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.setTimeout(
        () => URL.revokeObjectURL(url),
        1000
    );
}


export function StudentBatchImport({ onImported }: Props) {
    const [file, setFile] = useState<File | null>(null);

    const [csvText, setCsvText] = useState("");

    const [preview, setPreview] =
        useState<BatchStudentResult | null>(null);

    const [result, setResult] =
        useState<BatchStudentResult | null>(null);

    const [busy, setBusy] = useState(false);

    const [error, setError] =
        useState<string | null>(null);


    // Read the selected CSV file.
    const selectFile = async (
        event: ChangeEvent<HTMLInputElement>
    ) => {
        const selected =
            event.target.files?.[0] ?? null;

        setFile(null);
        setCsvText("");
        setPreview(null);
        setResult(null);
        setError(null);

        if (!selected) return;

        if (!selected.name.toLowerCase().endsWith(".csv")) {
            setError("Select a .csv file.");
            return;
        }

        if (selected.size > 256 * 1024) {
            setError("CSV must be smaller than 256 KB.");
            return;
        }

        try {
            setCsvText(await selected.text());
            setFile(selected);
        } catch {
            setError(
                "Could not read the selected CSV file."
            );
        }
    };


    // Validate the file without saving anything.
    const previewFile = async () => {
        if (!file) return;

        setBusy(true);
        setError(null);

        try {
            const response = await batchStudentsApi.submit(
                csvText,
                true
            );

            setPreview(response);
            setResult(null);

        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Could not validate CSV"
            );

        } finally {
            setBusy(false);
        }
    };


    // Create eligible student accounts.
    const createStudents = async () => {
        if (
            !preview ||
            preview.blocked ||
            !preview.ready ||
            !file
        ) {
            return;
        }

        const confirmed = window.confirm(
            `Create ${preview.ready} student account(s) from ${file.name}?`
        );

        if (!confirmed) return;

        setBusy(true);
        setError(null);

        try {
            const saved = await batchStudentsApi.submit(
                csvText,
                false
            );

            setResult(saved);
            setPreview(null);

            if (saved.created) {
                onImported();
            }

        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Student creation failed"
            );

        } finally {
            setBusy(false);
        }
    };


    const report = result || preview;


    return (
        <section
            className="ui-form-panel"
            aria-label="Batch student import"
        >
            <h2 style={{ margin: 0 }}>
                Batch Import Students
            </h2>

            <p
                className="ui-muted"
                style={{ margin: 0 }}
            >
                Upload a CSV with FirstName, LastName,
                Specialization, and Email (or UserPrincipalName).
                MiddleName and Username are optional.
                Students receive the STUDENT role automatically.
            </p>

            <div className="ui-form-row">

                <input
                    className="ui-input"
                    type="file"
                    accept=".csv,text/csv"
                    aria-label="Student CSV"
                    onChange={selectFile}
                    disabled={busy}
                />

                <button
                    className="ui-button ui-button--secondary"
                    type="button"
                    onClick={previewFile}
                    disabled={!file || busy}
                >
                    Preview CSV
                </button>

                <button
                    className="ui-button"
                    type="button"
                    onClick={createStudents}
                    disabled={
                        !preview ||
                        preview.blocked ||
                        !preview.ready ||
                        busy
                    }
                >
                    Create Students
                </button>

            </div>

            {error && (
                <p className="ui-error">
                    {error}
                </p>
            )}

            {busy && (
                <p className="ui-muted">
                    Processing student CSV...
                </p>
            )}

            {report && (
                <>
                    <p
                        className="ui-muted"
                        style={{ margin: 0 }}
                    >
                        Ready: {report.ready}
                        {" · "}
                        Created: {report.created}
                        {" · "}
                        Existing: {report.existing}
                        {" · "}
                        Invalid: {report.invalid}
                        {" · "}
                        Failed: {report.failed}
                    </p>

                    {report.blocked && (
                        <p className="ui-error">
                            Fix invalid rows before importing.
                            No changes were made.
                        </p>
                    )}

                    {result && result.created > 0 && (
                        <div>
                            <p className="ui-muted">
                                Save credentials now.
                                Temporary passwords are not available
                                after leaving this page.
                            </p>

                            <button
                                className="ui-button ui-button--secondary"
                                type="button"
                                onClick={() => downloadCredentials(result)}
                            >
                                Download New Student Credentials
                            </button>
                        </div>
                    )}

                    <div
                        style={{
                            maxHeight: 260,
                            overflow: "auto",
                        }}
                    >
                        <ul className="ui-row-list">
                            {report.rows.map((row) => (
                                <li
                                    key={row.row_number}
                                    className="ui-row"
                                >
                                    <div className="ui-row-main">

                                        <div className="ui-row-title">
                                            Line {row.row_number}:{" "}
                                            {row.name || row.email}
                                        </div>

                                        <div className="ui-row-subtitle">
                                            {row.email}
                                            {" · "}
                                            {row.status}
                                            {" · "}
                                            {row.message}
                                        </div>

                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </>
            )}
        </section>
    );
}