import type { Href } from "expo-router";
import { router } from "expo-router";

/**
 * Re-entry after sign-in or sign-up (PRD 5.3).
 *
 * When a signed-out visitor taps Save or "Request a Session" on an expert, we send them to sign in
 * and remember what they were doing. Once they are signed in as a user, they land back on that
 * expert's profile, and the profile finishes the action (saves the expert, or opens the request form).
 *
 * Sign-in and sign-up replace each other instead of stacking, so going "back" after signing in
 * returns to whatever was underneath: the expert's profile, or the list the visitor started from.
 */

export type PendingAction = "save" | "request";

/** Where the visitor started: the expert's own profile, or a list (Discover, Saved) */
export type ReentryOrigin = "profile" | "list";

const PENDING_TTL_MS = 15 * 60 * 1000;
let pending: { expertId: string; action: PendingAction; at: number } | null = null;

/** Route params for the sign-in screen; pass them on unchanged between sign-in and sign-up */
export type ReentryParams = { returnTo?: string; origin?: string };

/** Send a signed-out visitor to sign in, remembering what they were doing with this expert */
export const signInToContinue = (expertId: string, action: PendingAction, origin: ReentryOrigin) => {
  pending = { expertId, action, at: Date.now() };
  router.push({
    pathname: "/(auth)/login",
    params: { intent: "user", returnTo: `/expert/${expertId}`, origin },
  } as Href);
};

/** The expert's profile calls this once a user is signed in; returns the action at most once */
export const takePendingAction = (expertId: string): PendingAction | null => {
  if (!pending || pending.expertId !== expertId) return null;
  const { action, at } = pending;
  pending = null;
  return Date.now() - at < PENDING_TTL_MS ? action : null;
};

// Only expert profiles are valid return targets, so a crafted link can't send people elsewhere
const isExpertPath = (path: unknown): path is string => typeof path === "string" && /^\/expert\/[A-Za-z0-9]+$/.test(path);

/** After a successful sign-in or sign-up: take the person where they belong */
export const finishAuth = (role: "user" | "expert" | "admin", params: ReentryParams) => {
  if (role === "user" && isExpertPath(params.returnTo)) {
    if (params.origin === "profile" && router.canGoBack()) {
      router.back(); // the profile is right underneath
    } else {
      router.replace(params.returnTo as Href);
    }
    return;
  }
  pending = null;
  if (role === "expert") router.replace("/(expert)/(tabs)");
  else if (role === "admin") router.replace("/(admin)/(tabs)");
  else router.replace("/(user)/(tabs)");
};
