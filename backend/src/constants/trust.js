/**
 * Trust and legal rules shared by signup, approval and requests (PRD 4.4–4.6).
 * Mirrors src/constants/trust.ts in the app; keep both in sync.
 */

// Bump when the Terms text changes. Signups must send the version they were shown.
const TERMS_VERSION = "ca-2026-11";

// Bump when any disclaimer text changes. Stored on each request with the acknowledgements.
const DISCLAIMER_VERSION = "2026-11";

// Ontario-regulated trades: certificate type, number and issuing body are mandatory
const REGULATED_CATEGORIES = ["Electrical", "Plumbing", "HVAC"];
const REGULATED_SKILLS = ["Gas Fitting"];

const TRADE_CATEGORIES = [
  "Electrical",
  "Plumbing",
  "Carpentry",
  "Tiling",
  "HVAC",
  "Painting",
  "Construction",
  "Landscaping",
];

// Categories where a session could be mistaken for professional advice
const ADVICE_CATEGORIES = {
  Legal: "legal",
  Healthcare: "medical",
  Finance: "financial",
  Banking: "financial",
  "Real Estate": "real_estate",
  "Govt & Policy": "government",
};

const REVIEW_STYLES = ["structured", "conversational", "hands_on"];

const lower = (values) => (values || []).map((v) => String(v).toLowerCase());

const categoriesOf = (expert) => {
  const all = [...(expert.categories || []), expert.domain].filter(Boolean);
  return [...new Set(all)];
};

const isRegulatedTrade = (expert) => {
  const categories = lower(categoriesOf(expert));
  const skills = lower(expert.skills);
  return (
    REGULATED_CATEGORIES.some((c) => categories.includes(c.toLowerCase())) ||
    REGULATED_SKILLS.some((s) => skills.includes(s.toLowerCase()))
  );
};

const isTrade = (expert) => {
  const categories = lower(categoriesOf(expert));
  return TRADE_CATEGORIES.some((c) => categories.includes(c.toLowerCase()));
};

/**
 * Disclaimer ids a user must acknowledge before requesting a session with this expert.
 * "platform" always applies; the rest depend on the expert's field and the session type.
 */
const requiredDisclaimerIds = (expert, sessionType) => {
  const ids = new Set(["platform"]);
  for (const category of categoriesOf(expert)) {
    const advice = ADVICE_CATEGORIES[category];
    if (advice) ids.add(`advice_${advice}`);
  }
  if (isTrade(expert)) ids.add("trades");
  if (sessionType === "onsite") ids.add("onsite_safety");
  return [...ids];
};

module.exports = {
  TERMS_VERSION,
  DISCLAIMER_VERSION,
  REGULATED_CATEGORIES,
  REGULATED_SKILLS,
  TRADE_CATEGORIES,
  ADVICE_CATEGORIES,
  REVIEW_STYLES,
  isRegulatedTrade,
  isTrade,
  requiredDisclaimerIds,
};
