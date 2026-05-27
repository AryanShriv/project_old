import { Platform } from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";

export const ACCESS_TOKEN_KEY = "@api_access_token_v1";
export const REFRESH_TOKEN_KEY = "@api_refresh_token_v1";

const API_BASE =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  (Platform.OS === "android"
    ? "http://10.0.2.2:4000/api/v1"
    : "http://localhost:4000/api/v1");

type ApiOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  auth?: boolean;
};

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
  details?: unknown;
};

async function readTokens() {
  const [accessToken, refreshToken] = await Promise.all([
    AsyncStorage.getItem(ACCESS_TOKEN_KEY),
    AsyncStorage.getItem(REFRESH_TOKEN_KEY),
  ]);
  return { accessToken, refreshToken };
}

export async function persistTokens(accessToken: string, refreshToken: string) {
  await Promise.all([
    AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken),
    AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken),
  ]);
}

export async function clearTokens() {
  await Promise.all([
    AsyncStorage.removeItem(ACCESS_TOKEN_KEY),
    AsyncStorage.removeItem(REFRESH_TOKEN_KEY),
  ]);
}

async function refreshAccessToken() {
  const { refreshToken } = await readTokens();
  if (!refreshToken) return null;

  const response = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  if (!response.ok) return null;

  const json = (await response.json()) as ApiEnvelope<{
    accessToken: string;
    refreshToken: string;
  }>;
  if (!json.success?.valueOf()) return null;
  await persistTokens(json.data.accessToken, json.data.refreshToken);
  return json.data.accessToken;
}

export async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { method = "GET", body, auth = false } = options;
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  if (auth) {
    const { accessToken } = await readTokens();
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  }

  const doFetch = async () =>
    fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

  let response = await doFetch();
  if (response.status === 401 && auth) {
    const nextAccess = await refreshAccessToken();
    if (nextAccess) {
      headers.Authorization = `Bearer ${nextAccess}`;
      response = await doFetch();
    }
  }

  const json = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok || !json.success) {
    throw new Error(json.message || "Request failed");
  }
  return json.data;
}

