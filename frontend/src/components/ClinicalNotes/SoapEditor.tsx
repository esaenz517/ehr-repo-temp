import type {
    ChartContext,
    SoapContent,
} from "../../api/clinicalNotes";
import { formatUtc } from "../../api/clinicalNotes";

interface Props {
    content: SoapContent;
    context: ChartContext;
    disabled?: boolean;
    onChange: (content: SoapContent) => void;
}

const prompts = [
    ["Onset", "When did it start?"],
    ["Location", "Where is it?"],
    ["Duration", "How long?"],
    ["Character", "What is it like?"],
    ["Aggravating", "What makes it worse?"],
    ["Relieving", "What helps?"],
    ["Timing", "How often?"],
    ["Severity", "How severe?"],
];

export function SoapEditor({
    content,
    context,
    disabled,
    onChange,
}: Props) {
    const field = (
        key: keyof SoapContent,
        label: string,
        rows = 3
    ) => (
        <label
            className="note-field"
            htmlFor={`soap-${key}`}
        >
            <span>{label}</span>

            {key === "chief_complaint" ? (
                <input
                    id={`soap-${key}`}
                    value={content[key]}
                    disabled={disabled}
                    onChange={(e) =>
                        onChange({
                            ...content,
                            [key]: e.target.value,
                        })
                    }
                />
            ) : (
                <textarea
                    id={`soap-${key}`}
                    rows={rows}
                    value={content[key]}
                    disabled={disabled}
                    onChange={(e) =>
                        onChange({
                            ...content,
                            [key]: e.target.value,
                        })
                    }
                />
            )}
        </label>
    );

    return (
        <div className="soap-editor">
            <section
                className="soap-section"
                aria-labelledby="subjective-heading"
            >
                <h2 id="subjective-heading">
                    <span>S</span> Subjective
                </h2>

                {field(
                    "chief_complaint",
                    "Chief complaint"
                )}

                {field(
                    "hpi",
                    "History of present illness (HPI)",
                    6
                )}

                {!disabled && (
                    <div
                        className="note-prompts"
                        aria-label="OLDCARTS prompts"
                    >
                        {prompts.map(([label, hint]) => (
                            <button
                                type="button"
                                key={label}
                                title={hint}
                                onClick={() =>
                                    onChange({
                                        ...content,
                                        hpi:
                                            `${content.hpi}` +
                                            `${content.hpi &&
                                                !content.hpi.endsWith("\n")
                                                ? "\n"
                                                : ""
                                            }` +
                                            `${label}: `,
                                    })
                                }
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                )}

                <div className="note-columns">
                    {field(
                        "past_medical_history",
                        "Past medical history (PMH)"
                    )}

                    {field(
                        "past_surgical_history",
                        "Past surgical history (PSH)"
                    )}
                </div>

                <h3>
                    Medical history from chart{" "}
                    <small>Read only</small>
                </h3>

                {context.medical_history.length ? (
                    <ul>
                        {context.medical_history.map(
                            (x, i) => (
                                <li key={i}>
                                    {x.condition}
                                    {x.diagnosis_date
                                        ? ` · ${x.diagnosis_date}`
                                        : ""}
                                    {x.notes
                                        ? ` · ${x.notes}`
                                        : ""}
                                </li>
                            )
                        )}
                    </ul>
                ) : (
                    <p className="note-empty">
                        No medical history recorded in chart.
                    </p>
                )}

                <h3>
                    Medications from chart{" "}
                    <small>Read only</small>
                </h3>

                {context.medications.length ? (
                    <ul>
                        {context.medications.map(
                            (m, i) => (
                                <li key={i}>
                                    {m.name}
                                    {m.dosage
                                        ? ` · ${m.dosage}`
                                        : ""}
                                </li>
                            )
                        )}
                    </ul>
                ) : (
                    <p className="note-empty">
                        No medications recorded in chart.
                    </p>
                )}

                <h3>
                    Allergies <small>Read only</small>
                </h3>

                {context.allergies.length ? (
                    <ul>
                        {context.allergies.map(
                            (a, i) => (
                                <li key={i}>
                                    {a.substance}
                                    {a.reaction
                                        ? ` · ${a.reaction}`
                                        : ""}
                                </li>
                            )
                        )}
                    </ul>
                ) : (
                    <p className="note-empty">
                        Allergy status has not been recorded.
                        Verify with the patient.
                    </p>
                )}

                <div className="note-columns">
                    {field(
                        "family_history",
                        "Family history"
                    )}

                    {field(
                        "social_history",
                        "Social history"
                    )}
                </div>

                <h3>
                    Family history from chart{" "}
                    <small>Read only</small>
                </h3>

                {context.family_history.length ? (
                    <ul>
                        {context.family_history.map(
                            (x, i) => (
                                <li key={i}>
                                    {x.relationship}: {x.condition}
                                    {x.notes
                                        ? ` · ${x.notes}`
                                        : ""}
                                </li>
                            )
                        )}
                    </ul>
                ) : (
                    <p className="note-empty">
                        No family history recorded in chart.
                    </p>
                )}
            </section>

            <section
                className="soap-section"
                aria-labelledby="objective-heading"
            >
                <h2 id="objective-heading">
                    <span>O</span> Objective
                </h2>

                <h3>
                    Latest vitals <small>Read only</small>
                </h3>

                {context.latest_vitals ? (
                    <div className="note-chart-grid">
                        <div>
                            Recorded:{" "}
                            {formatUtc(
                                context.latest_vitals.recorded_at
                            )}
                        </div>

                        {(
                            [
                                [
                                    "BP",
                                    context.latest_vitals
                                        .blood_pressure,
                                    "mmHg",
                                ],
                                [
                                    "HR",
                                    context.latest_vitals
                                        .heart_rate,
                                    "bpm",
                                ],
                                [
                                    "RR",
                                    context.latest_vitals
                                        .respiratory_rate,
                                    "/min",
                                ],
                                [
                                    "Temperature",
                                    context.latest_vitals
                                        .temperature_c,
                                    "°C",
                                ],
                                [
                                    "SpO₂",
                                    context.latest_vitals
                                        .oxygen_saturation,
                                    "%",
                                ],
                                [
                                    "Height",
                                    context.latest_vitals
                                        .height_cm,
                                    "cm",
                                ],
                                [
                                    "Weight",
                                    context.latest_vitals
                                        .weight_kg,
                                    "kg",
                                ],
                            ] as const
                        ).map(
                            ([label, value, unit]) => (
                                <div key={label}>
                                    <strong>{label}:</strong>{" "}
                                    {value ?? "—"}{" "}
                                    {value === null
                                        ? ""
                                        : unit}
                                </div>
                            )
                        )}
                    </div>
                ) : (
                    <p className="note-empty">
                        No vitals recorded in chart.
                    </p>
                )}

                {field(
                    "physical_exam",
                    "Physical exam by system",
                    6
                )}

                <h3>
                    Recent labs <small>Read only</small>
                </h3>

                {context.recent_labs.length ? (
                    <ul>
                        {context.recent_labs.map(
                            (l, i) => (
                                <li key={i}>
                                    {l.test_name}: {l.result}{" "}
                                    {l.unit || ""}
                                    {l.flag
                                        ? ` (${l.flag})`
                                        : ""}{" "}
                                    · {formatUtc(l.collected_at)}
                                </li>
                            )
                        )}
                    </ul>
                ) : (
                    <p className="note-empty">
                        No lab results recorded in chart.
                    </p>
                )}
            </section>

            <section
                className="soap-section"
                aria-labelledby="assessment-heading"
            >
                <h2 id="assessment-heading">
                    <span>A</span> Assessment
                </h2>

                {field(
                    "assessment",
                    "Problems, diagnosis, and clinical rationale",
                    7
                )}
            </section>

            <section
                className="soap-section"
                aria-labelledby="plan-heading"
            >
                <h2 id="plan-heading">
                    <span>P</span> Plan
                </h2>

                {field(
                    "plan",
                    "Treatment, tests, follow-up, and patient instructions",
                    7
                )}
            </section>
        </div>
    );
}