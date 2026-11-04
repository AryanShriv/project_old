
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { Platform } from "react-native";

export const ACCESS_TOKEN_KEY = "@api_access_token_v1";
export const REFRESH_TOKEN_KEY = "@api_refresh_token_v1";

const PRODUCTION_API = "https://project-old.onrender.com/api/v1";
const LOCAL_API_PORT = 4000;

/**
 * Where the API lives:
 * 1. EXPO_PUBLIC_API_URL from .env, if set (e.g. the Render URL, or http://<your-PC-ip>:4000/api/v1)
 * 2. In development, the machine running Metro. Expo reports its LAN address as hostUri, which a
 *    physical phone on the same Wi-Fi can reach ("localhost" and "10.0.2.2" only work in simulators).
 * 3. Production otherwise.
 */
const resolveApiBase = () => {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  if (!__DEV__) return PRODUCTION_API;
  if (Platform.OS === "web") return `http://localhost:${LOCAL_API_PORT}/api/v1`;
  const host = Constants.expoConfig?.hostUri?.split(":")[0];
  return host ? `http://${host}:${LOCAL_API_PORT}/api/v1` : PRODUCTION_API;
};

export const API_BASE = resolveApiBase();
/** Origin of the API, for the socket connection */
export const API_ORIGIN = API_BASE.replace(/\/api\/v1\/?$/, "");

if (__DEV__) {
  console.log(`[api] Using ${API_BASE}`);
}

// A free Render instance can take ~50s to wake up, so one attempt waits 25s and GETs retry once
const REQUEST_TIMEOUT_MS = 25_000;

/** Thrown when the server could not be reached at all (offline, asleep, wrong address). */
export class NetworkError extends Error {
  constructor(message = "We couldn't reach G(Old). Check your connection and try again.") {
    super(message);
    this.name = "NetworkError";
  }
}

/** Thrown when the server answered with an error. `status` is the HTTP status. */
export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "ApiError";
  }
}

const fetchWithTimeout = async (url: string, init: RequestInit) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch {
    throw new NetworkError();
  } finally {
    clearTimeout(timer);
  }
};

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

// Refresh tokens rotate on every use, so concurrent callers must share one refresh call.
let refreshInFlight: Promise<string | null> | null = null;

export function refreshAccessToken() {
  if (!refreshInFlight) {
    refreshInFlight = doRefreshAccessToken()
      .catch(() => null)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

async function doRefreshAccessToken() {
  const { refreshToken } = await readTokens();
  if (!refreshToken) return null;

  const response = await fetchWithTimeout(`${API_BASE}/auth/refresh`, {
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

  const send = () =>
    fetchWithTimeout(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  // Reads are safe to retry once (covers a server waking up); writes are never retried
  const doFetch = async () => {
    try {
      return await send();
    } catch (error) {
      if (method === "GET" && error instanceof NetworkError) return send();
      throw error;
    }
  };

  let response = await doFetch();
  if (response.status === 401 && auth) {
    const nextAccess = await refreshAccessToken();
    if (nextAccess) {
      headers.Authorization = `Bearer ${nextAccess}`;
      response = await doFetch();
    }
  }

  let json: ApiEnvelope<T>;
  try {
    json = (await response.json()) as ApiEnvelope<T>;
  } catch {
    // e.g. an HTML error page from a proxy while the server is starting
    throw new ApiError("The server sent an unexpected response. Please try again.", response.status);
  }
  if (!response.ok || !json.success) {
    throw new ApiError(json.message || "Request failed", response.status);
  }
  return json.data;
}

