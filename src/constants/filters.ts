// src/constants/filters.ts
//
// The G(Old) taxonomy (PRD 5.1): each category and the skills shown as the second row of
// filter chips on Discover. This is the one place to edit categories or skills.
// Signup ("Your main field") and Discover both read from here.

const FILTER_MAP: Record<string, string[]> = {

    // ── CANADA (Toronto) — Trades first ──────────
    Electrical: [
        "Residential Wiring",
        "Commercial Electrical",
        "Panel Upgrades",
        "Solar & Renewable",
        "EV Charging",
        "Safety Compliance",
    ],

    Plumbing: [
        "Residential Plumbing",
        "Gas Fitting",
        "Drain & Sewer",
        "Bathroom Renovations",
        "Water Heaters",
        "Pipe Repair",
    ],

    Carpentry: [
        "Framing & Structural",
        "Finish Carpentry",
        "Flooring",
        "Deck & Outdoor",
        "Basement Finishing",
        "Cabinet Making",
    ],

    Tiling: [
        "Floor Tiling",
        "Wall Tiling",
        "Waterproofing",
        "Concrete Work",
        "Brickwork",
        "Grouting & Sealing",
    ],

    HVAC: [
        "Heating Systems",
        "Air Conditioning",
        "Furnace Repair",
        "Heat Pumps",
        "Ductwork",
        "Energy Efficiency",
    ],

    Painting: [
        "Interior Painting",
        "Exterior Painting",
        "Drywall & Plastering",
        "Wallpaper",
        "Staining & Varnishing",
        "Colour Consultation",
    ],

    Construction: [
        "Home Renovations",
        "Project Management",
        "Building Codes & Permits",
        "Cost Estimation",
        "Structural Assessment",
        "Quality Inspection",
    ],

    Landscaping: [
        "Garden Design",
        "Irrigation Systems",
        "Hardscaping",
        "Lawn Care",
        "Tree & Shrub Care",
        "Drainage Solutions",
    ],

    // ── KNOWLEDGE (Both markets) ──────────────────
    Finance: [
        "Financial Modeling",
        "Fundraising & Pitch",
        "Cash Flow Management",
        "Budgeting & Forecasting",
        "Tax Planning",
        "Risk Management",
    ],

    Banking: [
        "Retail Banking",
        "Corporate Banking",
        "Credit & Lending",
        "Trade Finance",
        "Compliance",
        "Treasury Management",
    ],

    Technology: [
        "System Architecture",
        "Backend Development",
        "Mobile Development",
        "Database Design",
        "Technical Leadership",
        "Legacy Modernisation",
    ],

    "Quality Assurance": [
        "Test Strategy",
        "Manual Testing",
        "Automation Testing",
        "Performance Testing",
        "QA Process Setup",
        "Team Mentoring",
    ],

    Operations: [
        "Supply Chain",
        "Process Improvement",
        "Lean & Six Sigma",
        "Logistics",
        "Vendor Management",
        "Factory Operations",
    ],

    Management: [
        "Business Strategy",
        "Team Leadership",
        "P&L Management",
        "Change Management",
        "Crisis Management",
        "Board Governance",
    ],

    Sales: [
        "B2B Sales Strategy",
        "Enterprise Sales",
        "Channel & Distribution",
        "Pricing Strategy",
        "Negotiation",
        "Sales Team Building",
    ],

    Marketing: [
        "Brand Strategy",
        "Digital Marketing",
        "Content Strategy",
        "PR & Communications",
        "Market Research",
        "Product Launch",
    ],

    // ── INDIA SPECIFIC ───────────────────────────
    "Govt & Policy": [
        "IAS / Civil Services",
        "Public Policy",
        "Government Procurement",
        "PSU Operations",
        "Regulatory Affairs",
        "Rural Development",
    ],

    Manufacturing: [
        "Factory Setup",
        "Lean Manufacturing",
        "Quality Management",
        "Industrial Safety",
        "Export & Import",
        "MSME Advisory",
    ],

    Agriculture: [
        "Modern Farming",
        "AgriTech Advisory",
        "Food Processing",
        "Organic Farming",
        "Government Schemes",
        "Export of Agri Products",
    ],

    // ── COMMON ───────────────────────────────────
    Entrepreneurship: [
        "First-time Founder",
        "Business Model Design",
        "Angel & VC Fundraising",
        "Bootstrapping",
        "Startup to Scale",
        "Exit Planning",
    ],

    Education: [
        "Career Guidance",
        "Study Abroad",
        "Research Mentoring",
        "Competitive Exams",
        "University Applications",
        "Curriculum Design",
    ],

    "Real Estate": [
        "Property Investment",
        "Real Estate Development",
        "Property Management",
        "Home Buying Guidance",
        "Commercial Real Estate",
        "Valuation Basics",
    ],

    Legal: [
        "Corporate Law Guidance",
        "Startup Legal Basics",
        "IP & Patents",
        "Employment Law",
        "Regulatory Compliance",
        "Company Formation",
    ],

    Healthcare: [
        "Hospital Administration",
        "Healthcare Operations",
        "Pharmaceutical Industry",
        "Medical Device Industry",
        "Health Policy",
        "Clinical Research",
    ],

};

export default FILTER_MAP;


export const CANADA_CATEGORY_ORDER = [
    "Electrical",
    "Plumbing",
    "Carpentry",
    "Tiling",
    "HVAC",
    "Painting",
    "Construction",
    "Landscaping",
    "Finance",
    "Technology",
    "Quality Assurance",
    "Management",
    "Entrepreneurship",
    "Banking",
    "Operations",
    "Sales",
    "Marketing",
    "Education",
    "Real Estate",
    "Legal",
    "Healthcare",
    "Govt & Policy",
    "Manufacturing",
    "Agriculture",
];

export const INDIA_CATEGORY_ORDER = [
    "Finance",
    "Technology",
    "Quality Assurance",
    "Management",
    "Banking",
    "Operations",
    "Entrepreneurship",
    "Govt & Policy",
    "Manufacturing",
    "Education",
    "Agriculture",
    "Sales",
    "Marketing",
    "Real Estate",
    "Legal",
    "Healthcare",
    "Electrical",
    "Plumbing",
    "Carpentry",
    "Tiling",
    "HVAC",
    "Painting",
    "Construction",
    "Landscaping",
];

/** Trades first for Canada, knowledge first for India (PRD 5.1) */
export const categoryOrderFor = (country: "Canada" | "India") =>
    country === "India" ? INDIA_CATEGORY_ORDER : CANADA_CATEGORY_ORDER;

type Matchable = {
    title: string;
    tagline: string;
    skills?: string[];
    domain?: string;
    categories?: string[];
};

const normalise = (value: string) => value.trim().toLowerCase();

/**
 * Does this expert belong in a category? Their chosen field (domain / categories) decides;
 * older profiles without one fall back to matching their skills and headline.
 */
export const expertInCategory = (expert: Matchable, category: string) => {
    const wanted = normalise(category);
    if (expert.domain && normalise(expert.domain) === wanted) return true;
    if (expert.categories?.some((c) => normalise(c) === wanted)) return true;
    const keywords = (FILTER_MAP[category] ?? []).map(normalise);
    return (
        normalise(expert.title).includes(wanted) ||
        (expert.skills ?? []).some((skill) => keywords.some((kw) => normalise(skill).includes(kw)))
    );
};

// Words in a skill chip that carry meaning, e.g. "Panel Upgrades" -> ["panel", "upgrade"]
const significantWords = (skill: string) =>
    normalise(skill)
        .split(/[^a-z0-9]+/)
        .filter((word) => word.length >= 4)
        .map((word) => (word.endsWith("s") ? word.slice(0, -1) : word));

/** Does this expert mention a skill chip in their skills, headline or tagline? */
export const expertHasSkill = (expert: Matchable, skill: string) => {
    const text = normalise([expert.title, expert.tagline, ...(expert.skills ?? [])].join(" "));
    if (text.includes(normalise(skill))) return true;
    return significantWords(skill).some((word) => text.includes(word));
};
