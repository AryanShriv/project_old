import type { Availability, AvailabilityException, DaySlot, ExceptionKind } from "../types/availability";
import { apiRequest } from "./apiClient";

export async function fetchAvailability(expertId: string) {
  return apiRequest<Availability>(`/availability/${expertId}`, { auth: true });
}

export async function saveAvailability(
  expertId: string,
  payload: { timezone?: string; slots: DaySlot[] }
) {
  return apiRequest<Availability>(`/availability/${expertId}`, {
    method: "PUT",
    auth: true,
    body: payload,
  });
}

export async function fetchAvailabilityExceptions(expertId: string, month: string) {
  const data = await apiRequest<{ items: AvailabilityException[] }>(
    `/availability/${expertId}/exceptions?month=${month}`,
    { auth: true }
  );
  return data.items;
}

export async function upsertAvailabilityException(
  expertId: string,
  date: string,
  payload: { kind: ExceptionKind; startTime?: string; endTime?: string; note?: string }
) {
  return apiRequest<AvailabilityException>(`/availability/${expertId}/exceptions/${date}`, {
    method: "PUT",
    auth: true,
    body: payload,
  });
}

export async function deleteAvailabilityException(expertId: string, date: string) {
  return apiRequest<{ date: string }>(`/availability/${expertId}/exceptions/${date}`, {
    method: "DELETE",
    auth: true,
  });
}
