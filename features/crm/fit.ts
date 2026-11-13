/**
 * Explainable fit and confidence (blueprint §4.3).
 *
 * Fit = how closely the opportunity matches the business. Confidence = how reliable and current
 * the evidence is. They are reported separately, every factor shows why, and unknowns are listed
 * as unknown. Nothing is inferred: budget only counts when the prospect stated it.
 */

export type FactorStatus = "match" | "partial" | "mismatch" | "unknown";

export type FitFactor = {
  key: "service" | "location" | "timing" | "budget" | "answers";
  label: string;
  weight: number;
  status: FactorStatus;
  detail: string;
};

export type FitInput = {
  orgServices: { code: string; name: string }[];
  serviceAreas: { label: string; postcode?: string | null }[];
  idealMinBudget?: string | null;
  requiredQuestions: { key: string; label: string }[];
  project: {
    category_code?: string | null;
    location_text?: string | null;
    postcode?: string | null;
    start_timing?: string | null;
    budget_label?: string | null;
  };
  answers: Record<string, unknown>;
};

export type FitResult = {
  score: number | null;
  label: "Strong fit" | "Possible fit" | "Weak fit" | "Not enough information";
  factors: FitFactor[];
  missing: string[];
};

const VALUE: Record<FactorStatus, number> = { match: 1, partial: 0.5, mismatch: 0, unknown: 0 };

export const BUDGET_ORDER = ["Under $10k", "$10k–$50k", "$50k–$150k", "$150k–$500k", "$500k+"];
const UNSURE = /^(not sure|not decided|unsure|unknown)$/i;

function timingStatus(t?: string | null): [FactorStatus, string] {
  if (!t || UNSURE.test(t)) return ["unknown", "Start timing not given"];
  if (/as soon|within 1 month|1–3 months|this week|this month|emergency/i.test(t)) return ["match", `Wants to start: ${t}`];
  if (/3–6 months/i.test(t)) return ["partial", `Wants to start: ${t}`];
  return ["partial", `Longer horizon: ${t}`];
}

export function computeFit(input: FitInput): FitResult {
  const { project, answers } = input;
  const factors: FitFactor[] = [];
  const missing: string[] = [];

  // Service match
  const service = input.orgServices.find((s) => s.code === project.category_code);
  if (!project.category_code) {
    factors.push({ key: "service", label: "Service match", weight: 30, status: "unknown", detail: "No service selected" });
    missing.push("Service type");
  } else if (service) {
    factors.push({ key: "service", label: "Service match", weight: 30, status: "match", detail: `You offer ${service.name}` });
  } else {
    factors.push({ key: "service", label: "Service match", weight: 30, status: "mismatch", detail: "Not one of your listed services" });
  }

  // Location coverage — only a recorded match counts; absence of a match is "not confirmed".
  const loc = `${project.location_text ?? ""} ${project.postcode ?? ""}`.trim().toLowerCase();
  if (!loc) {
    factors.push({ key: "location", label: "Location coverage", weight: 25, status: "unknown", detail: "No location given" });
    missing.push("Project location");
  } else {
    const hit = input.serviceAreas.find(
      (a) =>
        (a.postcode && project.postcode && a.postcode.trim() === project.postcode.trim()) ||
        loc.includes(a.label.toLowerCase().split(/[,(]/)[0]!.trim()),
    );
    factors.push(
      hit
        ? { key: "location", label: "Location coverage", weight: 25, status: "match", detail: `Inside ${hit.label}` }
        : { key: "location", label: "Location coverage", weight: 25, status: "partial", detail: "Not matched to a listed service area — check" },
    );
  }

  // Timing
  const [tStatus, tDetail] = timingStatus(project.start_timing ?? (answers.start_timing as string | undefined) ?? (answers.urgency as string | undefined));
  factors.push({ key: "timing", label: "Timing", weight: 15, status: tStatus, detail: tDetail });
  if (tStatus === "unknown") missing.push("Start timing");

  // Budget — stated only.
  const budget = project.budget_label ?? (answers.budget_range as string | undefined) ?? null;
  if (!budget || UNSURE.test(budget)) {
    factors.push({ key: "budget", label: "Budget fit", weight: 15, status: "unknown", detail: "Budget not stated" });
  } else if (input.idealMinBudget && BUDGET_ORDER.includes(budget) && BUDGET_ORDER.includes(input.idealMinBudget)) {
    const ok = BUDGET_ORDER.indexOf(budget) >= BUDGET_ORDER.indexOf(input.idealMinBudget);
    factors.push({ key: "budget", label: "Budget fit", weight: 15, status: ok ? "match" : "mismatch", detail: ok ? `Stated ${budget}` : `Stated ${budget}, below your ${input.idealMinBudget} minimum` });
  } else {
    factors.push({ key: "budget", label: "Budget fit", weight: 15, status: "partial", detail: `Stated ${budget} (no minimum set)` });
  }

  // Required qualification answers
  if (input.requiredQuestions.length) {
    const answered = input.requiredQuestions.filter((q) => {
      const v = answers[q.key];
      return v != null && String(v).trim() !== "" && !UNSURE.test(String(v));
    });
    for (const q of input.requiredQuestions) if (!answered.includes(q)) missing.push(q.label);
    const ratio = answered.length / input.requiredQuestions.length;
    factors.push({
      key: "answers",
      label: "Required answers",
      weight: 15,
      status: ratio === 1 ? "match" : ratio === 0 ? "unknown" : "partial",
      detail: `${answered.length} of ${input.requiredQuestions.length} answered`,
    });
  }

  const known = factors.filter((f) => f.status !== "unknown");
  const knownWeight = known.reduce((s, f) => s + f.weight, 0);
  if (knownWeight < 40) return { score: null, label: "Not enough information", factors, missing };
  const score = Math.round((known.reduce((s, f) => s + f.weight * VALUE[f.status], 0) / knownWeight) * 100);
  // "Strong" needs both a high score and most of the evidence: a high score built on a few known
  // factors is reported as "Possible" so unknowns aren't overstated.
  const totalWeight = factors.reduce((s, f) => s + f.weight, 0);
  const coverage = knownWeight / totalWeight;
  const label = score >= 75 && coverage >= 0.7 ? "Strong fit" : score >= 50 ? "Possible fit" : "Weak fit";
  return { score, label, factors, missing };
}

export type Confidence = { level: "High" | "Medium" | "Low"; reasons: string[] };

/** How much to trust the record: source, freshness and how reachable the contact is. */
export function computeConfidence(input: { source: string; receivedAt: string; hasEmail: boolean; hasPhone: boolean; now?: Date }): Confidence {
  const reasons: string[] = [];
  let points = 0;
  if (input.source === "landing_page" || input.source === "visitor_chat") {
    points += 2;
    reasons.push("Submitted directly by the prospect (first-party)");
  } else {
    reasons.push(`Source: ${input.source.replace("_", " ")}`);
  }
  const ageDays = ((input.now ?? new Date()).getTime() - new Date(input.receivedAt).getTime()) / 86_400_000;
  if (ageDays <= 7) {
    points += 2;
    reasons.push("Received in the last 7 days");
  } else if (ageDays <= 30) {
    points += 1;
    reasons.push("Received in the last 30 days");
  } else {
    reasons.push(`Received ${Math.floor(ageDays)} days ago — may be stale`);
  }
  if (input.hasEmail && input.hasPhone) {
    points += 1;
    reasons.push("Email and phone provided");
  } else {
    reasons.push(input.hasEmail ? "Email only" : "Phone only");
  }
  return { level: points >= 4 ? "High" : points >= 2 ? "Medium" : "Low", reasons };
}
