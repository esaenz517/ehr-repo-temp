import { useCallback, useEffect, useState } from "react";
import { frontDeskApi } from "../api/frontDesk";
import { CreatePatientInput, patientsApi } from "../api/patients";
import { roomsApi } from "../api/rooms";
import type { CheckIn, DeskAppointment, Patient, Room } from "../types";

const REFRESH_MS = 30000; // other desks may check patients in too

// Today in the browser's time zone, as "YYYY-MM-DD"
export function localToday(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

// State + actions for the front desk board: today's appointments, the queue,
// the rooms, and the patient list for walk-ins. Every action reloads all of it.
export function useFrontDesk() {
  const [appointments, setAppointments] = useState<DeskAppointment[]>([]);
  const [queue, setQueue] = useState<CheckIn[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null); // what the last action did

  const load = useCallback(async () => {
    try {
      const [appointmentData, queueData, roomData, patientData] = await Promise.all([
        frontDeskApi.appointments(localToday()),
        frontDeskApi.queue(),
        roomsApi.list(),
        patientsApi.list(),
      ]);
      setAppointments(appointmentData);
      setQueue(queueData);
      setRooms(roomData);
      setPatients(patientData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load the front desk");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [load]);

  // Runs an action, shows what it did, and reloads; returns true when it worked
  const run = async (action: () => Promise<string>, failure: string) => {
    try {
      setNotice(await action());
      setError(null);
      await load();
      return true;
    } catch (err) {
      setNotice(null);
      setError(err instanceof Error ? err.message : failure);
      return false;
    }
  };

  const checkIn = (patientId: number, appointmentId: number | null = null) =>
    run(async () => {
      const row = await frontDeskApi.checkIn(patientId, appointmentId);
      return `${row.patient_name} is checked in and waiting for a room.`;
    }, "Failed to check the patient in");

  // Register a new patient, then check them in right away
  const registerAndCheckIn = (input: CreatePatientInput) =>
    run(async () => {
      const patient = await patientsApi.create(input);
      const row = await frontDeskApi.checkIn(patient.patient_id);
      return `${row.patient_name} is registered and waiting for a room.`;
    }, "Failed to register the patient");

  const assignRoom = (checkInId: number, roomId: number) =>
    run(async () => {
      const row = await frontDeskApi.assignRoom(checkInId, roomId);
      return `${row.patient_name} is in room ${row.room_number}.`;
    }, "Failed to assign the room");

  const discharge = (checkInId: number) =>
    run(async () => {
      const row = await frontDeskApi.discharge(checkInId);
      return `${row.patient_name} was discharged; the room is free.`;
    }, "Failed to discharge the patient");

  const cancel = (checkInId: number) =>
    run(async () => {
      const row = await frontDeskApi.cancel(checkInId);
      return `${row.patient_name}'s check-in was cancelled.`;
    }, "Failed to cancel the check-in");

  return {
    appointments,
    queue,
    rooms,
    patients,
    loading,
    error,
    notice,
    checkIn,
    registerAndCheckIn,
    assignRoom,
    discharge,
    cancel,
  };
}
