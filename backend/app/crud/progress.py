"""
Assignment Progress
Determines instructor-only inactivity alerts from saved SOAP notes.
"""

from datetime import datetime


def progress_alert(
    assigned_at: datetime,
    due_date: datetime | None,
    last_saved_at: datetime | None,
    status: str,
    now: datetime,
) -> tuple[str | None, float, float | None]:

    # Count inactivity from the latest saved work,
    # or from the assignment date if no work has been saved.
    anchor = max(assigned_at, last_saved_at) if last_saved_at else assigned_at

    idle_hours = round(
        max(
            0.0,
            (now - anchor).total_seconds() / 3600,
        ),
        1,
    )

    # Completed assignments and assignments without
    # due dates do not require inactivity notifications.
    if status in ("submitted", "signed") or due_date is None:
        return None, idle_hours, None

    # Overdue takes priority over inactivity.
    if now > due_date:
        return "overdue", idle_hours, None

    window_hours = (due_date - assigned_at).total_seconds() / 3600

    if window_hours <= 0:
        return None, idle_hours, None

    # Alert after 25% of the assignment window without
    # saved progress, with a 1-hour minimum and 48-hour maximum.
    threshold_hours = max(
        1.0,
        min(48.0, window_hours * 0.25),
    )

    alert = "inactive" if idle_hours >= threshold_hours else None

    return (
        alert,
        idle_hours,
        round(threshold_hours, 1),
    )
