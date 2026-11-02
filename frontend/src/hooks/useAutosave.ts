/* AI was used to assist in building this module */

import { useCallback, useEffect, useRef, useState } from "react";

export type SaveReason = "auto" | "manual";

export type AutosaveStatus =
    | "idle" //    nothing typed yet (or reset)
    | "pending" // typed, waiting for the user to stop
    | "saving"
    | "saved"
    | "error";

// How long the user must stop typing before the note is saved.
export const AUTOSAVE_DELAY_MS = 3000;

interface AutosaveOptions {
    delayMs?: number;
    enabled?: boolean;
}

/**
 * Saves after the user edits and then stops for `delayMs`.
 *
 * - Nothing is scheduled until `notifyEdit()` is called from an edit handler,
 *   so loading, selecting, or resetting a note never triggers a save.
 * - Every edit restarts the countdown, so the save happens only once typing stops.
 * - Only one save runs at a time (the backend uses compare-and-swap on the
 *   note version). If the countdown ends while a save is running, another
 *   countdown starts when it finishes.
 * - `saveNow()` runs a manual save through the same lock.
 *
 * `save` must resolve to true on success and false on failure.
 */
export function useAutosave(
    save: (reason: SaveReason) => Promise<boolean>,
    { delayMs = AUTOSAVE_DELAY_MS, enabled = true }: AutosaveOptions = {}
) {
    const saveRef = useRef(save);
    const enabledRef = useRef(enabled);
    const delayRef = useRef(delayMs);

    // Keep the latest save closure (fresh note/content/version) for timers.
    useEffect(() => {
        saveRef.current = save;
        enabledRef.current = enabled;
        delayRef.current = delayMs;
    });

    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const inFlight = useRef(false);
    const retryAfterSave = useRef(false);

    const [status, setStatus] = useState<AutosaveStatus>("idle");

    const clearTimer = useCallback(() => {
        if (timer.current !== null) {
            clearTimeout(timer.current);
            timer.current = null;
        }
    }, []);

    const schedule = useCallback(() => {
        clearTimer();
        setStatus("pending");
        timer.current = setTimeout(() => {
            timer.current = null;
            void run("auto");
        }, delayRef.current);
        // `run` is stable (its deps are stable), so it's safe to omit here.
    }, []);

    const run = useCallback(async (reason: SaveReason) => {
        clearTimer();

        if (inFlight.current) {
            // The user stopped typing while a save was running; save
            // their newer edits once it finishes.
            if (reason === "auto") retryAfterSave.current = true;
            return;
        }

        inFlight.current = true;
        setStatus("saving");

        let ok = false;
        try {
            ok = await saveRef.current(reason);
        } catch {
            ok = false;
        } finally {
            inFlight.current = false;
        }

        if (retryAfterSave.current && enabledRef.current) {
            retryAfterSave.current = false;
            schedule();
            return;
        }

        retryAfterSave.current = false;
        setStatus(ok ? "saved" : "error");
    }, [clearTimer, schedule]);

    // Call from the editor's change handler (user input only).
    const notifyEdit = useCallback(() => {
        if (!enabledRef.current) return;
        schedule();
    }, [schedule]);

    // Drop any countdown, e.g. when switching notes or patients.
    const cancel = useCallback(() => {
        clearTimer();
        retryAfterSave.current = false;
        setStatus("idle");
    }, [clearTimer]);

    const saveNow = useCallback(() => run("manual"), [run]);

    useEffect(() => {
        if (!enabled) cancel();
    }, [enabled, cancel]);

    useEffect(() => clearTimer, [clearTimer]);

    return { status, notifyEdit, saveNow, cancel };
}

export const autosaveLabel = (status: AutosaveStatus): string =>
    ({
        idle: "",
        pending: "Unsaved changes",
        saving: "Saving…",
        saved: "All changes saved",
        error: "Autosave failed",
    })[status];
