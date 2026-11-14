import { STAGES } from "@/features/crm/stages";
import { INDUSTRY_TEMPLATES } from "./industry-templates";
import { COUNTRIES } from "./locations";

/**
 * Figures quoted on the website, computed from the product's own configuration so they can never
 * drift from (or fall below) what the app actually ships.
 */
export const BRAND_FACTS = {
  markets: Object.keys(COUNTRIES).length,
  serviceTemplates: INDUSTRY_TEMPLATES.length,
  pipelineStages: STAGES.length,
  /** Contacts, enquiries and discovered projects all require a source (NOT NULL columns in the schema). */
  recordsWithSourcePct: 100,
};
