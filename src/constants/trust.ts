/**
 * Trust and legal rules (PRD 4.4–4.6). Mirrors backend/src/constants/trust.js; keep both in sync.
 *
 * The disclaimer wording below is legal copy. Have it reviewed by counsel in Canada and India,
 * and bump DISCLAIMER_VERSION (here and in the backend) whenever the text changes.
 */
import type { Expert } from "../types/expert";

export const TERMS_VERSION = "ca-2026-11";
export const DISCLAIMER_VERSION = "2026-11";

export const REGULATED_CATEGORIES = ["Electrical", "Plumbing", "HVAC"];
export const REGULATED_SKILLS = ["Gas Fitting"];
export const TRADE_CATEGORIES = [
  "Electrical",
  "Plumbing",
  "Carpentry",
  "Tiling",
  "HVAC",
  "Painting",
  "Construction",
  "Landscaping",
];

const ADVICE_CATEGORIES: Record<string, DisclaimerId> = {
  Legal: "advice_legal",
  Healthcare: "advice_medical",
  Finance: "advice_financial",
  Banking: "advice_financial",
  "Real Estate": "advice_real_estate",
  "Govt & Policy": "advice_government",
};

export type DisclaimerId =
  | "platform"
  | "advice_legal"
  | "advice_medical"
  | "advice_financial"
  | "advice_real_estate"
  | "advice_government"
  | "trades"
  | "onsite_safety";

export type Disclaimer = { id: DisclaimerId; title: string; body: string };

export const DISCLAIMERS: Record<DisclaimerId, Disclaimer> = {
  platform: {
    id: "platform",
    title: "G(Old) connects you; it does not provide the advice",
    body:
      "Experts are independent people sharing their own experience. They are not employees or agents of G(Old). " +
      "G(Old) does not supervise sessions and is not responsible for what is said in them or for decisions you make afterwards.",
  },
  advice_legal: {
    id: "advice_legal",
    title: "This is not legal advice",
    body:
      "Sessions are conversations based on the expert's career experience. They do not create a lawyer–client relationship " +
      "and are not a substitute for advice from a lawyer licensed where you live (in Ontario, by the Law Society of Ontario; " +
      "in India, enrolled with a State Bar Council). For any legal matter, consult a licensed lawyer.",
  },
  advice_medical: {
    id: "advice_medical",
    title: "This is not medical advice",
    body:
      "Sessions do not diagnose, treat or replace care from a licensed health professional. Do not start, stop or change any " +
      "treatment or medication because of a session. In an emergency, call 911 in Canada or 112 in India.",
  },
  advice_financial: {
    id: "advice_financial",
    title: "This is not financial, investment or tax advice",
    body:
      "The expert is not acting as your registered adviser, planner, accountant or broker. Before making financial decisions, " +
      "consult a professional registered with the right regulator (in Canada, your provincial securities regulator or CIRO; " +
      "in India, SEBI or ICAI).",
  },
  advice_real_estate: {
    id: "advice_real_estate",
    title: "This is not real estate, legal or financial advice",
    body:
      "The expert is not acting as your real estate agent, broker, appraiser or lawyer. Before buying, selling or leasing " +
      "property, consult a registered real estate professional and a lawyer.",
  },
  advice_government: {
    id: "advice_government",
    title: "This is not official or legal advice",
    body:
      "The expert does not represent any government body and cannot act on your behalf. For applications, permits, " +
      "immigration or regulatory decisions, rely on official government sources or a licensed professional.",
  },
  trades: {
    id: "trades",
    title: "Guidance only, not a contract for work",
    body:
      "Sessions are experience-based guidance. The expert is not your contractor unless you agree that directly with them. " +
      "In Ontario, electrical, gas, plumbing and HVAC work can legally require a licensed professional and permits. " +
      "Never attempt regulated or dangerous work on the strength of a session alone.",
  },
  onsite_safety: {
    id: "onsite_safety",
    title: "On-site sessions: your safety",
    body:
      "On-site sessions take place at a location you choose, at your own risk. Where you can, have another adult present, " +
      "keep valuables and financial details private, and stop the session if you feel unsafe. The expert is responsible " +
      "for their own conduct and insurance. G(Old) is not present and is not liable for injury, loss or damage.",
  },
};

const categoriesOf = (expert: Pick<Expert, "categories" | "domain">) =>
  [...new Set([...(expert.categories ?? []), expert.domain].filter(Boolean) as string[])];

const hasAny = (values: string[] | undefined, targets: string[]) => {
  const lower = (values ?? []).map((v) => v.toLowerCase());
  return targets.some((t) => lower.includes(t.toLowerCase()));
};

export const isRegulatedCategory = (category: string) => hasAny([category], REGULATED_CATEGORIES);

export const isRegulatedTrade = (expert: Pick<Expert, "categories" | "domain" | "skills">) =>
  hasAny(categoriesOf(expert), REGULATED_CATEGORIES) || hasAny(expert.skills, REGULATED_SKILLS);

export const isTrade = (expert: Pick<Expert, "categories" | "domain">) =>
  hasAny(categoriesOf(expert), TRADE_CATEGORIES);

/** Disclaimers shown on an expert's profile (PRD 4.6). */
export const profileDisclaimers = (expert: Pick<Expert, "categories" | "domain">): Disclaimer[] => {
  const ids = new Set<DisclaimerId>();
  for (const category of categoriesOf(expert)) {
    const id = ADVICE_CATEGORIES[category];
    if (id) ids.add(id);
  }
  if (isTrade(expert)) ids.add("trades");
  return [...ids].map((id) => DISCLAIMERS[id]);
};

/** Disclaimers the user must tick before sending a request. Must match the backend's list. */
export const requestDisclaimers = (
  expert: Pick<Expert, "categories" | "domain">,
  sessionType: string | null
): Disclaimer[] => [
  DISCLAIMERS.platform,
  ...profileDisclaimers(expert),
  ...(sessionType === "onsite" ? [DISCLAIMERS.onsite_safety] : []),
];
