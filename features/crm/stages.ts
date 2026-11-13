import type { Database } from "@/lib/supabase/database.types";
import type { Tone } from "@/components/ui";

export type Stage = Database["public"]["Enums"]["opp_stage"];
export type LossReason = Database["public"]["Enums"]["loss_reason"];
export type QualStatus = Database["public"]["Enums"]["qual_status"];
export type ApptType = Database["public"]["Enums"]["appt_type"];
export type ApptStatus = Database["public"]["Enums"]["appt_status"];

/** Default pipeline (blueprint §9.4) with the exit condition shown as help text. */
export const STAGES: { id: Stage; label: string; meaning: string; tone: Tone }[] = [
  { id: "new", label: "New", meaning: "New enquiry awaiting review.", tone: "blue" },
  { id: "reviewing", label: "Reviewing", meaning: "Checking fit, source and missing details.", tone: "violet" },
  { id: "contact_attempted", label: "Contact attempted", meaning: "A permitted contact attempt is recorded.", tone: "amber" },
  { id: "connected", label: "Connected", meaning: "Two-way conversation has happened.", tone: "teal" },
  { id: "qualified", label: "Qualified", meaning: "Required criteria met, with evidence recorded.", tone: "teal" },
  { id: "appointment_booked", label: "Appointment booked", meaning: "A confirmed meeting or site visit exists.", tone: "green" },
  { id: "proposal", label: "Estimate / proposal", meaning: "An estimate or proposal has been issued.", tone: "green" },
  { id: "won", label: "Won", meaning: "The customer confirmed the work is awarded.", tone: "green" },
  { id: "lost", label: "Lost", meaning: "Closed with a reason.", tone: "red" },
];

export const OPEN_STAGES: Stage[] = ["new", "reviewing", "contact_attempted", "connected", "qualified", "appointment_booked", "proposal"];
export const STAGE_BY_ID = Object.fromEntries(STAGES.map((s) => [s.id, s])) as Record<Stage, (typeof STAGES)[number]>;

export const LOSS_REASONS: { id: LossReason; label: string }[] = [
  { id: "no_response", label: "No response" },
  { id: "outside_area", label: "Outside service area" },
  { id: "budget_mismatch", label: "Budget mismatch" },
  { id: "timing", label: "Timing" },
  { id: "competitor", label: "Competitor selected" },
  { id: "not_a_fit", label: "Not a fit" },
  { id: "other", label: "Other" },
];

export const QUAL_LABEL: Record<QualStatus, { label: string; tone: Tone }> = {
  unreviewed: { label: "Unreviewed", tone: "blue" },
  qualifying: { label: "Qualifying", tone: "amber" },
  qualified: { label: "Qualified", tone: "green" },
  disqualified: { label: "Disqualified", tone: "neutral" },
};

export const APPT_TYPE_LABEL: Record<ApptType, string> = { phone: "Phone call", video: "Video meeting", site_visit: "Site visit" };

export const APPT_STATUS: Record<ApptStatus, { label: string; tone: Tone }> = {
  scheduled: { label: "Scheduled", tone: "blue" },
  confirmed: { label: "Confirmed", tone: "teal" },
  attended: { label: "Attended", tone: "green" },
  no_show: { label: "No-show", tone: "amber" },
  cancelled: { label: "Cancelled", tone: "neutral" },
  rescheduled: { label: "Rescheduled", tone: "violet" },
};
