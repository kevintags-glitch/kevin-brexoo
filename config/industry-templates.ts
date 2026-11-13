/**
 * Industry templates (blueprint §2.2, §2.3, Appendix A).
 *
 * This file is the source of truth. `scripts/generate-templates-sql.ts` turns it into the
 * migration that seeds `service_categories` and `industry_templates`, so the database and the
 * app always agree on codes and question keys. Codes are stable identifiers: never rename one,
 * add a new version instead.
 */

export type QuestionKind = "text" | "select" | "yes_no" | "date";

export type Question = {
  key: string;
  label: string;
  kind: QuestionKind;
  options?: string[];
  /** Shown on public forms and in the visitor chat. Internal questions stay in the CRM. */
  public?: boolean;
  required?: boolean;
};

export type IndustryTemplate = {
  code: string;
  version: number;
  name: string;
  /** Short noun used in UI copy: "your next build", "your next job". */
  workNoun: string;
  opportunityTypes: string[];
  questions: Question[];
};

const NOT_SURE = "Not sure";

const timing: Question = {
  key: "start_timing",
  label: "When would you like to start?",
  kind: "select",
  options: ["As soon as possible", "Within 1 month", "1–3 months", "3–6 months", "6+ months", NOT_SURE],
  public: true,
};

const urgency: Question = {
  key: "urgency",
  label: "How urgent is it?",
  kind: "select",
  options: ["Emergency", "This week", "This month", "Flexible", NOT_SURE],
  public: true,
};

const propertyType: Question = {
  key: "property_type",
  label: "Property type",
  kind: "select",
  options: ["House", "Apartment / unit", "Townhouse", "Commercial", "Industrial", "Other", NOT_SURE],
  public: true,
};

const resiCommercial: Question = {
  key: "sector",
  label: "Residential or commercial?",
  kind: "select",
  options: ["Residential", "Commercial", NOT_SURE],
  public: true,
};

const budget: Question = {
  key: "budget_range",
  label: "Budget range",
  kind: "select",
  options: ["Under $10k", "$10k–$50k", "$50k–$150k", "$150k–$500k", "$500k+", "Not decided"],
  public: true,
};

const access: Question = { key: "access_notes", label: "Site access notes", kind: "text", public: true };
const siteVisit: Question = { key: "site_visit", label: "Would you like a site visit?", kind: "yes_no", public: true };
const decisionMaker: Question = {
  key: "decision_role",
  label: "Who makes the final decision?",
  kind: "select",
  options: ["Me", "Me and a partner", "A committee / board", "Someone else", NOT_SURE],
};

export const INDUSTRY_TEMPLATES: IndustryTemplate[] = [
  {
    code: "home_builder",
    version: 1,
    name: "Home builders",
    workNoun: "build",
    opportunityTypes: ["Custom home", "New build", "Extension", "Knockdown rebuild", "Landowner enquiry"],
    questions: [
      { key: "land_owned", label: "Do you own the land?", kind: "select", options: ["Yes", "In the process of buying", "Not yet", NOT_SURE], public: true, required: true },
      { key: "build_type", label: "New build or extension?", kind: "select", options: ["New build", "Extension", "Knockdown rebuild", NOT_SURE], public: true },
      { key: "house_type", label: "House type", kind: "select", options: ["Single storey", "Double storey", "Duplex", "Granny flat", NOT_SURE], public: true },
      budget,
      timing,
      decisionMaker,
      { key: "consultation", label: "Would you like a consultation?", kind: "yes_no", public: true },
    ],
  },
  {
    code: "property_developer",
    version: 1,
    name: "Property developers",
    workNoun: "package",
    opportunityTypes: ["Development proposal", "Building package", "Subcontract package"],
    questions: [
      { key: "project_stage", label: "Project stage", kind: "select", options: ["Concept", "Planning approval", "Tender", "Under construction", NOT_SURE], public: true },
      { key: "package_type", label: "Package type", kind: "text", public: true },
      { key: "tender_date", label: "Tender closing date", kind: "date", public: true },
      budget,
      decisionMaker,
    ],
  },
  {
    code: "electrician",
    version: 1,
    name: "Electricians",
    workNoun: "job",
    opportunityTypes: ["New build", "Rewiring", "Fit-out", "Upgrade", "Maintenance"],
    questions: [
      resiCommercial,
      { key: "work_type", label: "What kind of work?", kind: "select", options: ["New install", "Upgrade", "Repair", "Maintenance", NOT_SURE], public: true, required: true },
      urgency,
      access,
      siteVisit,
      { key: "inspection_needed", label: "Is an inspection or certificate needed?", kind: "yes_no" },
    ],
  },
  {
    code: "plumber",
    version: 1,
    name: "Plumbers",
    workNoun: "job",
    opportunityTypes: ["Installation", "Renovation", "Repair", "Maintenance contract"],
    questions: [
      { key: "work_type", label: "What kind of work?", kind: "select", options: ["Installation", "Renovation", "Repair", "Maintenance", NOT_SURE], public: true, required: true },
      propertyType,
      urgency,
      access,
      { key: "preferred_visit", label: "Preferred visit time", kind: "text", public: true },
    ],
  },
  {
    code: "hvac",
    version: 1,
    name: "HVAC",
    workNoun: "job",
    opportunityTypes: ["New system", "Replacement", "Servicing", "Commercial installation"],
    questions: [
      { key: "work_type", label: "Install, replace, service or repair?", kind: "select", options: ["Install", "Replace", "Service", "Repair", NOT_SURE], public: true, required: true },
      { key: "building_size", label: "Building type and size", kind: "text", public: true },
      { key: "existing_system", label: "Existing system", kind: "text", public: true },
      timing,
    ],
  },
  {
    code: "renovation",
    version: 1,
    name: "Renovation contractors",
    workNoun: "renovation",
    opportunityTypes: ["Kitchen", "Bathroom", "Extension", "Whole-home renovation"],
    questions: [
      { key: "renovation_type", label: "What are you renovating?", kind: "select", options: ["Kitchen", "Bathroom", "Extension", "Whole home", "Other", NOT_SURE], public: true, required: true },
      propertyType,
      budget,
      timing,
    ],
  },
  {
    code: "roofing",
    version: 1,
    name: "Roofing",
    workNoun: "roof",
    opportunityTypes: ["New roof", "Replacement", "Repair", "Commercial roofing"],
    questions: [
      { key: "work_type", label: "New roof, replacement or repair?", kind: "select", options: ["New roof", "Replacement", "Repair", NOT_SURE], public: true, required: true },
      { key: "roof_type", label: "Roof material", kind: "select", options: ["Tile", "Metal", "Slate", "Flat / membrane", NOT_SURE], public: true },
      propertyType,
      { key: "condition", label: "Damage or condition", kind: "text", public: true },
      urgency,
      access,
    ],
  },
  {
    code: "landscaping",
    version: 1,
    name: "Landscaping",
    workNoun: "project",
    opportunityTypes: ["Garden design", "Outdoor living", "Planting", "Hardscaping"],
    questions: [
      { key: "work_type", label: "Design, installation or maintenance?", kind: "select", options: ["Design", "Installation", "Maintenance", NOT_SURE], public: true, required: true },
      { key: "site_size", label: "Approximate site size", kind: "text", public: true },
      { key: "scape", label: "Hardscape, softscape or both?", kind: "select", options: ["Hardscape", "Softscape", "Both", NOT_SURE], public: true },
      budget,
      timing,
    ],
  },
  {
    code: "lawn_care",
    version: 1,
    name: "Lawn care",
    workNoun: "service",
    opportunityTypes: ["Recurring mowing", "Grounds maintenance", "One-off clean-up"],
    questions: [
      propertyType,
      { key: "property_size", label: "Property size", kind: "text", public: true },
      { key: "frequency", label: "One-off or recurring?", kind: "select", options: ["One-off", "Weekly", "Fortnightly", "Monthly", NOT_SURE], public: true, required: true },
      timing,
    ],
  },
  {
    code: "cleaning",
    version: 1,
    name: "Cleaning",
    workNoun: "clean",
    opportunityTypes: ["Residential", "Office", "Commercial", "End-of-lease"],
    questions: [
      resiCommercial,
      { key: "premises_size", label: "Premises size", kind: "text", public: true },
      { key: "frequency", label: "How often?", kind: "select", options: ["One-off", "Weekly", "Fortnightly", "Monthly", NOT_SURE], public: true, required: true },
      timing,
    ],
  },
  {
    code: "painting",
    version: 1,
    name: "Painting",
    workNoun: "job",
    opportunityTypes: ["New build", "Repaint", "Commercial painting"],
    questions: [
      { key: "surface", label: "Interior or exterior?", kind: "select", options: ["Interior", "Exterior", "Both", NOT_SURE], public: true, required: true },
      propertyType,
      { key: "area", label: "Approximate area", kind: "text", public: true },
      { key: "condition", label: "Surface condition", kind: "text", public: true },
      access,
      timing,
    ],
  },
  {
    code: "flooring",
    version: 1,
    name: "Flooring and tiling",
    workNoun: "job",
    opportunityTypes: ["New installation", "Replacement", "Renovation"],
    questions: [
      { key: "material", label: "Material", kind: "select", options: ["Timber", "Laminate", "Vinyl", "Tiles", "Carpet", NOT_SURE], public: true, required: true },
      { key: "area", label: "Approximate area", kind: "text", public: true },
      { key: "removal", label: "Does old flooring need removing?", kind: "yes_no", public: true },
      timing,
    ],
  },
  {
    code: "fencing_decking",
    version: 1,
    name: "Fencing and decking",
    workNoun: "project",
    opportunityTypes: ["Fencing", "Decking", "Pergola"],
    questions: [
      { key: "work_type", label: "Fencing, decking or both?", kind: "select", options: ["Fencing", "Decking", "Both", NOT_SURE], public: true, required: true },
      { key: "size", label: "Length or area", kind: "text", public: true },
      { key: "material", label: "Preferred material", kind: "text", public: true },
      propertyType,
      timing,
    ],
  },
  {
    code: "property_maintenance",
    version: 1,
    name: "Property maintenance",
    workNoun: "job",
    opportunityTypes: ["Strata", "Rental", "Commercial", "Residential maintenance"],
    questions: [
      { key: "portfolio", label: "How many properties?", kind: "select", options: ["1", "2–10", "11–50", "50+"], public: true, required: true },
      { key: "job_types", label: "Types of jobs", kind: "text", public: true },
      { key: "recurring", label: "Is this recurring work?", kind: "yes_no", public: true },
      urgency,
    ],
  },
  {
    code: "pest_control",
    version: 1,
    name: "Pest control",
    workNoun: "treatment",
    opportunityTypes: ["Residential treatment", "Commercial contract", "Inspection"],
    questions: [
      propertyType,
      { key: "issue", label: "What's the issue?", kind: "select", options: ["Termites", "Rodents", "Cockroaches", "Spiders", "Other", NOT_SURE], public: true, required: true },
      urgency,
      { key: "recurring", label: "One-off or ongoing?", kind: "select", options: ["One-off", "Ongoing", NOT_SURE], public: true },
    ],
  },
];

export const INDUSTRY_BY_CODE = Object.fromEntries(INDUSTRY_TEMPLATES.map((t) => [t.code, t])) as Record<
  string,
  IndustryTemplate
>;

export function getTemplate(code: string): IndustryTemplate | undefined {
  return INDUSTRY_BY_CODE[code];
}

/** Questions a visitor sees on a public page for the given categories, de-duplicated by key. */
export function publicQuestions(codes: string[]): Question[] {
  const seen = new Set<string>();
  const out: Question[] = [];
  for (const code of codes) {
    for (const q of getTemplate(code)?.questions ?? []) {
      if (!q.public || seen.has(q.key)) continue;
      seen.add(q.key);
      out.push(q);
    }
  }
  return out;
}
