import { useState } from "react";
import type { FormEvent } from "react";

import {
    batchStudentsApi,
} from "../../api/batchStudents";

import type {
    BatchStudentRow,
    CreateStudentInput,
} from "../../api/batchStudents";


interface StudentCreateFormProps {
    onCreated: () => void | Promise<void>;
}


export function StudentCreateForm({
    onCreated,
}: StudentCreateFormProps) {
    const [firstName, setFirstName] = useState("");
    const [middleName, setMiddleName] = useState("");
    const [lastName, setLastName] = useState("");
    const [specialization, setSpecialization] = useState("");
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");

    const [busy, setBusy] = useState(false);

    const [error, setError] = useState<string | null>(null);

    const [created, setCreated] =
        useState<BatchStudentRow | null>(null);


    const clearForm = () => {
        setFirstName("");
        setMiddleName("");
        setLastName("");
        setSpecialization("");
        setEmail("");
        setUsername("");
    };


    const handleSubmit = async (
        event: FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        if (busy) return;

        setError(null);
        setCreated(null);

        const input: CreateStudentInput = {
            first_name: firstName.trim(),
            middle_name: middleName.trim() || null,
            last_name: lastName.trim(),
            specialization: specialization.trim(),
            email: email.trim(),
            username: username.trim() || null,
        };

        if (
            !input.first_name ||
            !input.last_name ||
            !input.specialization ||
            !input.email
        ) {
            setError("Please complete all required fields.");
            return;
        }

        setBusy(true);

        try {
            const student = await batchStudentsApi.createOne(
                input
            );

            setCreated(student);
            clearForm();

            // Refresh the existing Staff listing.
            await onCreated();

        } catch (err) {
            const message =
                err instanceof Error
                    ? err.message
                    : "Failed to create student account";

            if (message.includes("409")) {
                setError(
                    "A student with this email or username already exists."
                );
            } else if (message.includes("422")) {
                setError(
                    "Student information is invalid. Check the fields."
                );
            } else if (message.includes("403")) {
                setError(
                    "Your account does not have permission to create students."
                );
            } else {
                setError(message);
            }

        } finally {
            setBusy(false);
        }
    };


    return (
        <section
            className="ui-form-panel"
            aria-label="Create student account"
        >
            <h2 className="ui-form-panel-title">
                Add Individual Student
            </h2>

            <p
                className="ui-muted ui-flush"
            >
                Create a student account manually.
                Login credentials and student roles are
                generated automatically.
            </p>

            <form
                onSubmit={handleSubmit}
                autoComplete="off"
                className="student-create-form"
            >
                <div className="form-grid">

                    <div className="form-field">
                        <label htmlFor="student-first-name">
                            First Name *
                        </label>

                        <input
                            id="student-first-name"
                            className="ui-input"
                            value={firstName}
                            onChange={(e) =>
                                setFirstName(e.target.value)
                            }
                            maxLength={100}
                            required
                            disabled={busy}
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="student-middle-name">
                            Middle Name
                        </label>

                        <input
                            id="student-middle-name"
                            className="ui-input"
                            value={middleName}
                            onChange={(e) =>
                                setMiddleName(e.target.value)
                            }
                            maxLength={100}
                            disabled={busy}
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="student-last-name">
                            Last Name *
                        </label>

                        <input
                            id="student-last-name"
                            className="ui-input"
                            value={lastName}
                            onChange={(e) =>
                                setLastName(e.target.value)
                            }
                            maxLength={100}
                            required
                            disabled={busy}
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="student-specialization">
                            Specialization *
                        </label>

                        <select
                            id="student-specialization"
                            className="ui-input"
                            value={specialization}
                            onChange={(e) =>
                                setSpecialization(e.target.value)
                            }
                            required
                            disabled={busy}
                        >
                            <option value="">
                                Select specialization
                            </option>

                            <option value="Nursing">
                                Nursing
                            </option>

                            <option value="Physician">
                                Physician
                            </option>

                            <option value="Psychiatry">
                                Psychiatry
                            </option>

                            <option value="Physical Therapy">
                                Physical Therapy
                            </option>

                            <option value="Allied Health">
                                Allied Health
                            </option>
                        </select>
                    </div>

                    <div className="form-field">
                        <label htmlFor="student-email">
                            Email *
                        </label>

                        <input
                            id="student-email"
                            className="ui-input"
                            type="email"
                            value={email}
                            onChange={(e) =>
                                setEmail(e.target.value)
                            }
                            maxLength={320}
                            placeholder="student@university.edu"
                            required
                            disabled={busy}
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="student-username">
                            Username
                        </label>

                        <input
                            id="student-username"
                            className="ui-input"
                            value={username}
                            onChange={(e) =>
                                setUsername(e.target.value)
                            }
                            maxLength={254}
                            placeholder="Uses email if blank"
                            disabled={busy}
                        />
                    </div>

                </div>

                <div
                    className="ui-form-row ui-form-row--actions"
                >
                    <button
                        type="submit"
                        className="ui-button"
                        disabled={busy}
                    >
                        {busy
                            ? "Creating Student..."
                            : "Create Student"}
                    </button>
                </div>
            </form>

            {error && (
                <p
                    className="ui-error"
                    role="alert"
                >
                    {error}
                </p>
            )}

            {created && (
                <div
                    className="form-message success"
                    role="status"
                >
                    <p>
                        <strong>
                            Student account created successfully.
                        </strong>
                    </p>

                    <p>
                        Student: {created.name}
                    </p>

                    <p>
                        Email: {created.email}
                    </p>

                    <p>
                        Username:{" "}
                        <code>{created.username}</code>
                    </p>

                    <p>
                        Temporary Password:{" "}
                        <code>
                            {created.temporary_password}
                        </code>
                    </p>

                    <p>
                        Save these credentials securely.
                        The temporary password will not
                        be displayed again.
                    </p>

                    <button
                        type="button"
                        className="ui-button ui-button--secondary"
                        onClick={() => setCreated(null)}
                    >
                        Clear Credentials
                    </button>
                </div>
            )}

        </section>
    );
}