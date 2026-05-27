import type { Availability, AvailabilityException, DaySlot, ExceptionKind } from "../types/availability";
import { apiRequest } from "./apiClient";

export async function fetchAvailability(freelancerId: string) {
  return apiRequest<Availability>(`/availability/${freelancerId}`, { auth: true });
}

export async function saveAvailability(
  freelancerId: string,
  payload: { timezone?: string; slots: DaySlot[] }
) {
  return apiRequest<Availability>(`/availability/${freelancerId}`, {
    method: "PUT",
    auth: true,
    body: payload,
  });
}

export async function fetchAvailabilityExceptions(freelancerId: string, month: string) {
  const data = await apiRequest<{ items: AvailabilityException[] }>(
    `/availability/${freelancerId}/exceptions?month=${month}`,
    { auth: true }
  );
  return data.items;
}

export async function upsertAvailabilityException(
  freelancerId: string,
  date: string,
  payload: { kind: ExceptionKind; startTime?: string; endTime?: string; note?: string }
) {
  return apiRequest<AvailabilityException>(`/availability/${freelancerId}/exceptions/${date}`, {
    method: "PUT",
    auth: true,
    body: payload,
  });
}

export async function deleteAvailabilityException(freelancerId: string, date: string) {
  return apiRequest<{ date: string }>(`/availability/${freelancerId}/exceptions/${date}`, {
    method: "DELETE",
    auth: true,
  });
}
