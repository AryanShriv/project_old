import AsyncStorage from "@react-native-async-storage/async-storage";

const RATE_LIMIT_KEY = "@rate_limit_";
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds
const ATTEMPT_WINDOW = 5 * 60 * 1000; // 5 minutes window for counting attempts

export interface RateLimitResult {
  allowed: boolean;
  attemptsRemaining?: number;
  lockoutEndsAt?: Date;
  message?: string;
}

interface RateLimitData {
  attempts: number;
  firstAttemptAt: number;
  lockedUntil?: number;
}

/**
 * Check if an action is rate-limited
 * @param key - Unique identifier for the action (e.g., "login:user@email.com")
 * @returns RateLimitResult indicating if action is allowed
 */
export async function checkRateLimit(key: string): Promise<RateLimitResult> {
  const storageKey = `${RATE_LIMIT_KEY}${key}`;
  const now = Date.now();

  try {
    const dataStr = await AsyncStorage.getItem(storageKey);
    const data: RateLimitData = dataStr ? JSON.parse(dataStr) : null;

    // No previous attempts
    if (!data) {
      return { allowed: true, attemptsRemaining: MAX_ATTEMPTS - 1 };
    }

    // Check if currently locked out
    if (data.lockedUntil && now < data.lockedUntil) {
      const lockoutEndsAt = new Date(data.lockedUntil);
      const minutesRemaining = Math.ceil((data.lockedUntil - now) / 60000);
      return {
        allowed: false,
        lockoutEndsAt,
        message: `Too many failed attempts. Please try again in ${minutesRemaining} minute${minutesRemaining > 1 ? "s" : ""}.`,
      };
    }

    // Reset if lockout period has passed
    if (data.lockedUntil && now >= data.lockedUntil) {
      await AsyncStorage.removeItem(storageKey);
      return { allowed: true, attemptsRemaining: MAX_ATTEMPTS - 1 };
    }

    // Reset if attempt window has passed
    if (now - data.firstAttemptAt > ATTEMPT_WINDOW) {
      await AsyncStorage.removeItem(storageKey);
      return { allowed: true, attemptsRemaining: MAX_ATTEMPTS - 1 };
    }

    // Check if max attempts reached
    if (data.attempts >= MAX_ATTEMPTS) {
      const lockedUntil = data.firstAttemptAt + ATTEMPT_WINDOW + LOCKOUT_DURATION;
      await AsyncStorage.setItem(
        storageKey,
        JSON.stringify({ ...data, lockedUntil })
      );
      const lockoutEndsAt = new Date(lockedUntil);
      const minutesRemaining = Math.ceil((lockedUntil - now) / 60000);
      return {
        allowed: false,
        lockoutEndsAt,
        message: `Too many failed attempts. Please try again in ${minutesRemaining} minute${minutesRemaining > 1 ? "s" : ""}.`,
      };
    }

    // Still within allowed attempts
    return {
      allowed: true,
      attemptsRemaining: MAX_ATTEMPTS - data.attempts - 1,
    };
  } catch (error) {
    console.error("[RateLimit] Error checking rate limit:", error);
    // Fail open - allow the action if we can't check
    return { allowed: true };
  }
}

/**
 * Record a failed attempt
 * @param key - Unique identifier for the action
 */
export async function recordFailedAttempt(key: string): Promise<void> {
  const storageKey = `${RATE_LIMIT_KEY}${key}`;
  const now = Date.now();

  try {
    const dataStr = await AsyncStorage.getItem(storageKey);
    const data: RateLimitData = dataStr ? JSON.parse(dataStr) : null;

    if (!data || now - data.firstAttemptAt > ATTEMPT_WINDOW) {
      // First attempt or window expired
      await AsyncStorage.setItem(
        storageKey,
        JSON.stringify({
          attempts: 1,
          firstAttemptAt: now,
        })
      );
    } else {
      // Increment attempts
      await AsyncStorage.setItem(
        storageKey,
        JSON.stringify({
          ...data,
          attempts: data.attempts + 1,
        })
      );
    }
  } catch (error) {
    console.error("[RateLimit] Error recording failed attempt:", error);
  }
}

/**
 * Clear rate limit data for a key (use after successful action)
 * @param key - Unique identifier for the action
 */
export async function clearRateLimit(key: string): Promise<void> {
  const storageKey = `${RATE_LIMIT_KEY}${key}`;
  try {
    await AsyncStorage.removeItem(storageKey);
  } catch (error) {
    console.error("[RateLimit] Error clearing rate limit:", error);
  }
}

/**
 * Clear all rate limit data (use for testing or account recovery)
 */
export async function clearAllRateLimits(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const rateLimitKeys = keys.filter((key) => key.startsWith(RATE_LIMIT_KEY));
    await AsyncStorage.multiRemove(rateLimitKeys);
  } catch (error) {
    console.error("[RateLimit] Error clearing all rate limits:", error);
  }
}
