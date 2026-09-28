import { useCallback, useEffect, useState } from "react";
import {
  AppointmentInput,
  appointmentsApi,
} from "../api/appointments";
import type { Appointment } from "../types";

export function useAppointments(patientId: number | null) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (patientId === null) {
      setAppointments([]);
      return;
    }

    try {
      setLoading(true);
      const data = await appointmentsApi.list(patientId);
      setAppointments(data);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load appointments"
      );
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    load();
  }, [load]);

  const createAppointment = async (input: AppointmentInput) => {
    if (patientId === null) return;

    try {
      await appointmentsApi.create(patientId, input);
      await load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create appointment"
      );
    }
  };

  const updateAppointment = async (
    appointmentId: number,
    input: AppointmentInput
  ) => {
    if (patientId === null) return;

    try {
      await appointmentsApi.update(patientId, appointmentId, input);
      await load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update appointment"
      );
    }
  };

  const removeAppointment = async (appointmentId: number) => {
    if (patientId === null) return;

    try {
      await appointmentsApi.remove(patientId, appointmentId);
      await load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete appointment"
      );
    }
  };

  return {
    appointments,
    loading,
    error,
    createAppointment,
    updateAppointment,
    removeAppointment,
  };
}