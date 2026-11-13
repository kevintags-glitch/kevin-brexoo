/**
 * Brex AI grounded writers (blueprint §10.3). Pure functions over a record, so every sentence can
 * be traced to a field and tested. Unknowns are stated as unknown. Text that came from the
 * prospect is quoted as data and never interpreted as an instruction.
 */
import type { FitResult } from "@/features/crm/fit";

export type RecordInput = {
  reference?: string | null;
  contactName: string;
  email?: string | null;
  phone?: string | null;
  preferredContact?: string | null;
  doNotContact: boolean;
  serviceName?: string | null;
  location?: string | null;
  description?: string | null;
  startTiming?: string | null;
  budget?: string | null;
  answers: { label: string; value: string }[];
  stage: string;
  /** A scheduled or confirmed appointment in the future. */
  upcomingAppointment?: boolean;
  receivedAt?: string | null;
  source?: string | null;
  fit: FitResult;
};

export type Segment = { text: string; cite?: string };

const firstName = (n: string) => n.trim().split(/\s+/)[0] ?? n;
const quote = (s: string, max = 220) => {
  const clean = s.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
};

export function summarizeRecord(r: RecordInput): Segment[] {
  const ref = r.reference ? `Enquiry ${r.reference}` : "Record";
  const out: Segment[] = [];
  out.push({
    text: `${r.contactName} ${r.serviceName ? `is asking about ${r.serviceName.toLowerCase()}` : "made an enquiry"}${r.location ? ` in ${r.location}` : ""}.`,
    cite: ref,
  });
  if (r.description) out.push({ text: `In their words: “${quote(r.description)}”`, cite: ref });
  const known: string[] = [];
  if (r.startTiming) known.push(`timing: ${r.startTiming}`);
  if (r.budget) known.push(`stated budget: ${r.budget}`);
  for (const a of r.answers.slice(0, 6)) known.push(`${a.label.replace(/\?$/, "").toLowerCase()}: ${a.value}`);
  if (known.length) out.push({ text: `Recorded details — ${known.join("; ")}.`, cite: ref });
  out.push({
    text:
      r.fit.score === null
        ? "There isn't enough information yet to judge fit."
        : `${r.fit.label} (${r.fit.score}/100): ${r.fit.factors
            .filter((f) => f.status !== "unknown")
            .map((f) => `${f.label.toLowerCase()} ${f.status === "match" ? "matches" : f.status === "partial" ? "partly matches" : "doesn't match"}`)
            .join(", ")}.`,
    cite: "Fit factors",
  });
  out.push({ text: r.fit.missing.length ? `Not recorded yet: ${r.fit.missing.join(", ").toLowerCase()}.` : "No required details are missing.", cite: r.fit.missing.length ? "Fit factors" : undefined });
  if (r.doNotContact) out.push({ text: "This contact is marked do not contact. Don't reach out unless they contact you first.", cite: "Contact restrictions" });
  out.push(nextBestAction(r));
  return out;
}

/**
 * One concrete next step, chosen by rules over the record (not a guess): restrictions first, then
 * missing information, then the stage of the deal.
 */
export function nextBestAction(r: RecordInput): Segment {
  const first = r.contactName.trim().split(/\s+/)[0] ?? r.contactName;
  const how = r.preferredContact === "phone" || (!r.email && r.phone) ? "Call" : "Email";
  let text: string;
  if (r.doNotContact) text = "Don't reach out. Keep the record for reference and close it if there's no further contact.";
  else if (r.stage === "won") text = "Record the job details and ask for a review once the work is under way.";
  else if (r.stage === "lost") text = "No action needed. Revisit in a few months if the timing was the reason.";
  else if (r.upcomingAppointment) text = "Prepare the site-visit brief and confirm the time with " + first + " the day before.";
  else if (r.stage === "proposal") text = `Follow up on the estimate with ${first} and ask if anything needs adjusting.`;
  else if (r.fit.missing.length && ["new", "reviewing", "contact_attempted"].includes(r.stage))
    text = `${how} ${first} to fill the gaps: ${r.fit.missing
      .slice(0, 2)
      .map((m) => (m.endsWith("?") ? `“${m}”` : m.toLowerCase()))
      .join(", ")}`;
  else if (r.stage === "qualified" || r.stage === "connected") text = `Book a site visit${r.location ? ` in ${r.location}` : ""} or a call with ${first}.`;
  else text = `${how} ${first} to introduce yourself and confirm the scope.`;
  return { text: `Next best action: ${text}`, cite: "Next step" };
}

export type Draft = { channel: "email" | "phone"; subject?: string; body: string };

export function draftFollowUp(r: RecordInput, business: { name: string; sender: string }): { draft?: Draft; refusal?: string } {
  if (r.doNotContact) return { refusal: "I won't draft outreach: this contact is marked do not contact." };
  const name = firstName(r.contactName);
  const what = r.serviceName ? r.serviceName.toLowerCase().replace(/s$/, "") : "project";
  const where = r.location ? ` in ${r.location}` : "";
  const missing = r.fit.missing.slice(0, 3);
  const asks = missing.length
    ? `\n\nTo give you something useful, could you let us know:\n${missing.map((m) => `• ${m}`).join("\n")}`
    : "\n\nWe have what we need to take the next step.";
  const next = missing.length ? "Once we have those, we can suggest a time to talk or visit the site." : "Would a short call or a site visit suit you? Let us know a couple of times that work.";

  if (!r.email && r.phone) {
    return {
      draft: {
        channel: "phone",
        body: `Call script for ${r.contactName} (${r.phone}):\n• Thank them for the enquiry about the ${what}${where}.\n${missing.length ? missing.map((m) => `• Ask: ${m}`).join("\n") : "• Confirm the details we have."}\n• Offer a call back or site visit time.\n• Record the outcome in Brexoo.`,
      },
    };
  }
  return {
    draft: {
      channel: "email",
      subject: `Your ${what} enquiry${r.reference ? ` (${r.reference})` : ""}`,
      body: `Hi ${name},\n\nThanks for getting in touch with ${business.name} about your ${what}${where}.${asks}\n\n${next}\n\nKind regards,\n${business.sender}\n${business.name}`,
    },
  };
}

export function siteVisitBrief(r: RecordInput): Segment[] {
  const ref = r.reference ? `Enquiry ${r.reference}` : "Record";
  const lines: Segment[] = [
    { text: `Visit for ${r.contactName}${r.location ? ` at ${r.location}` : ""}.`, cite: ref },
    { text: `Purpose: ${r.serviceName ?? "project"} — ${r.description ? `“${quote(r.description, 160)}”` : "no description recorded"}.`, cite: ref },
  ];
  if (r.answers.length) lines.push({ text: `Known: ${r.answers.map((a) => `${a.label.replace(/\?$/, "")} — ${a.value}`).join("; ")}.`, cite: ref });
  lines.push({ text: r.fit.missing.length ? `Confirm on site: ${r.fit.missing.join(", ")}.` : "All required details are recorded; confirm scope and access.", cite: "Fit factors" });
  if (r.phone || r.email) lines.push({ text: `Contact: ${[r.phone, r.email].filter(Boolean).join(" · ")}${r.preferredContact ? ` (prefers ${r.preferredContact})` : ""}.`, cite: "Contact" });
  return lines;
}
