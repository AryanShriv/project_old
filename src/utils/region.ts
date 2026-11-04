/**
 * The phone's country, read from its language setting (e.g. "en-CA", "hi-IN").
 * Used to order Discover categories: users don't give their country at sign-up.
 * Anything other than India falls back to Canada, where G(Old) launches with trades.
 */
export const deviceCountry = (): "Canada" | "India" => {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale || "";
    const region = locale.split(/[-_]/).find((part, index) => index > 0 && /^[A-Za-z]{2}$/.test(part));
    return region?.toUpperCase() === "IN" ? "India" : "Canada";
  } catch {
    return "Canada";
  }
};
