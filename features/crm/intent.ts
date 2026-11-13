/**
 * Buying intent: how ready a lead looks to go ahead, inferred from what is on the record.
 *
 * This is a prediction, never a fact. Every result carries the evidence it used (with its effect)
 * and is labelled "Inferred" wherever it's shown. With too little evidence it says so instead of
 * guessing. It's kept separate from fit (does the job suit us?) on purpose.
 */

export type IntentLevel = "high" | "medium" | "low" | "unknown";
export type IntentEvidence = { label: string; effect: 1 | -1; weight: number };
export type Intent = { level: IntentLevel; score: number; evidence: IntentEvidence[]; label: string };

export type IntentInput = {
  answers?: Record<string, unknown> | null;
  startTiming?: string | null;
  budgetLabel?: string | null;
  message?: string | null;
  duplicateCount?: number | null;
  appointmentCount?: number | null;
  receivedAt: string;
  now: number;
};

const DAY = 86_400_000;
const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const yes = (v: unknown) => v === true || /^(yes|y|true)$/i.test(str(v));

export const INTENT_LABEL: Record<IntentLevel, string> = {
  high: "High intent",
  medium: "Medium intent",
  low: "Low intent",
  unknown: "Not enough evidence",
};

export function computeIntent(input: IntentInput): Intent {
  const a = input.answers ?? {};
  const ev: IntentEvidence[] = [];
  const add = (label: string, weight: number) => ev.push({ label, weight: Math.abs(weight), effect: weight >= 0 ? 1 : -1 });

  if ((input.appointmentCount ?? 0) > 0) add("Has an appointment booked", 3);
  else if (yes(a.site_visit) || yes(a.consultation)) add("Asked for a site visit or consultation", 2);

  const timing = (str(input.startTiming) || str(a.start_timing) || str(a.urgency)).toLowerCase();
  if (/emergency|as soon|asap|this week|within 1 month|this month/.test(timing)) add("Wants to start within a month", 2);
  else if (/1.3 months/.test(timing)) add("Wants to start in 1–3 months", 1);
  else if (/6\+|12|next year/.test(timing)) add("Start is 6+ months away", -1);

  const budget = str(input.budgetLabel) || str(a.budget_range);
  if (budget && !/not (decided|sure)/i.test(budget)) add("Stated a budget range", 1);

  const land = str(a.land_owned);
  if (/^yes/i.test(land)) add("Owns the land", 1);
  else if (/not yet/i.test(land)) add("Doesn't own the land yet", -1);

  if (/^me$|^me and/i.test(str(a.decision_role))) add("Is the decision-maker", 1);
  if ((input.duplicateCount ?? 0) > 0) add("Got in touch more than once", 1);
  if (str(input.message).length >= 120) add("Wrote a detailed description", 1);

  const age = input.now - +new Date(input.receivedAt);
  if (age <= 3 * DAY) add("Enquired in the last 3 days", 1);
  else if (age > 45 * DAY && !(input.appointmentCount ?? 0)) add("No booking after 45+ days", -1);

  const score = ev.reduce((s, e) => s + e.effect * e.weight, 0);
  const positives = ev.filter((e) => e.effect > 0).length;
  const level: IntentLevel = ev.length < 2 ? "unknown" : score >= 5 ? "high" : score >= 3 ? "medium" : positives === 0 || score <= 1 ? "low" : "medium";
  ev.sort((x, y) => y.effect * y.weight - x.effect * x.weight);
  return { level, score, evidence: ev, label: `${INTENT_LABEL[level]} · inferred` };
}
