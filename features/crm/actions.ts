"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireOrg } from "@/lib/auth/session";
import { parseMoneyToMinor, zonedTimeToUtc } from "@/lib/format";
import type { Json as RawJson } from "@/lib/supabase/database.types";
import type { LossReason, Stage } from "./stages";

type Json = NonNullable<RawJson>;

export type ActionResult = { ok?: boolean; error?: string; fieldErrors?: Record<string, string> };

const uuid = z.string().uuid();
const STAGE_IDS = ["new", "reviewing", "contact_attempted", "connected", "qualified", "appointment_booked", "proposal", "won", "lost"] as const;
const LOSS_IDS = ["no_response", "outside_area", "budget_mismatch", "timing", "competitor", "not_a_fit", "other"] as const;

function done(paths: string[]): ActionResult {
  for (const p of paths) revalidatePath(p);
  revalidatePath("/app", "layout");
  return { ok: true };
}

function dbError(error: { code?: string; message?: string } | null, fallback = "Couldn't save. Please try again."): ActionResult {
  if (!error) return { ok: true };
  if (error.code === "42501") return { error: "You don't have permission to do that." };
  if (error.code === "23514") return { error: "That change isn't allowed. Check the required fields." };
  if (error.code === "23503") return { error: "That person isn't a member of this organisation." };
  return { error: fallback };
}

/* Opportunity --------------------------------------------------------------------------------- */

export async function moveStage(oppId: string, stage: Stage, lossReason?: LossReason | null, lossNote?: string): Promise<ActionResult> {
  const parsed = z
    .object({ id: uuid, stage: z.enum(STAGE_IDS), loss: z.enum(LOSS_IDS).nullish(), note: z.string().trim().max(500).optional() })
    .safeParse({ id: oppId, stage, loss: lossReason, note: lossNote });
  if (!parsed.success) return { error: "Invalid request." };
  if (parsed.data.stage === "lost" && !parsed.data.loss) return { error: "Choose a reason for closing as lost." };
  const { supabase, org } = await requireOrg();
  const { error } = await supabase
    .from("opportunities")
    .update({ stage: parsed.data.stage, loss_reason: parsed.data.stage === "lost" ? parsed.data.loss : null, loss_note: parsed.data.stage === "lost" ? parsed.data.note || null : null })
    .eq("id", parsed.data.id)
    .eq("organization_id", org.id);
  if (error) return dbError(error);
  return done([`/app/opportunities/${oppId}`, "/app/pipeline"]);
}

export async function assignOwner(oppId: string, ownerId: string | null): Promise<ActionResult> {
  if (!uuid.safeParse(oppId).success || (ownerId && !uuid.safeParse(ownerId).success)) return { error: "Invalid request." };
  const { supabase, org } = await requireOrg();
  const { error } = await supabase.from("opportunities").update({ owner_id: ownerId }).eq("id", oppId).eq("organization_id", org.id);
  if (error) return dbError(error);
  return done([`/app/opportunities/${oppId}`]);
}

export async function setValue(oppId: string, value: string): Promise<ActionResult> {
  if (!uuid.safeParse(oppId).success) return { error: "Invalid request." };
  const minor = value.trim() ? parseMoneyToMinor(value) : null;
  if (value.trim() && minor === null) return { fieldErrors: { value: "Enter an amount like 45000" } };
  const { supabase, org } = await requireOrg();
  const { error } = await supabase.from("opportunities").update({ value_minor: minor, currency: org.currency }).eq("id", oppId).eq("organization_id", org.id);
  if (error) return dbError(error);
  return done([`/app/opportunities/${oppId}`]);
}

/** Manual opportunity (phone call, referral, walk-in): contact + project + opportunity. */
export async function createOpportunity(_: ActionResult, form: FormData): Promise<ActionResult> {
  const parsed = z
    .object({
      full_name: z.string().trim().min(1, "Add a name").max(120),
      email: z.union([z.literal(""), z.string().trim().email("Check the email")]).default(""),
      phone: z.string().trim().max(40).default(""),
      category_code: z.string().max(40).default(""),
      title: z.string().trim().min(2, "Describe the project").max(160),
      location: z.string().trim().max(160).default(""),
      description: z.string().trim().max(4000).default(""),
    })
    .refine((v) => v.email || v.phone, { message: "Add an email or phone", path: ["email"] })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) {
    const fe: Record<string, string> = {};
    for (const i of parsed.error.issues) fe[String(i.path[0])] ??= i.message;
    return { fieldErrors: fe };
  }
  const d = parsed.data;
  const { supabase, org, user } = await requireOrg();

  let contactId: string | undefined;
  if (d.email) {
    const { data } = await supabase.from("contacts").select("id").eq("organization_id", org.id).eq("email", d.email.toLowerCase()).is("merged_into", null).maybeSingle();
    contactId = data?.id;
  }
  if (!contactId) {
    const { data, error } = await supabase
      .from("contacts")
      .insert({ organization_id: org.id, full_name: d.full_name, email: d.email || null, phone: d.phone || null, source: "manual", owner_id: user.id })
      .select("id")
      .single();
    if (error || !data) return dbError(error);
    contactId = data.id;
  }
  const { data: project } = await supabase
    .from("projects")
    .insert({ organization_id: org.id, contact_id: contactId, title: d.title, category_code: d.category_code || null, location_text: d.location || null, description: d.description || null, currency: org.currency })
    .select("id")
    .single();
  const { data: opp, error } = await supabase
    .from("opportunities")
    .insert({ organization_id: org.id, title: `${d.title} — ${d.full_name}`, contact_id: contactId, project_id: project?.id ?? null, owner_id: user.id, currency: org.currency })
    .select("id")
    .single();
  if (error || !opp) return dbError(error);
  redirect(`/app/opportunities/${opp.id}`);
}

/* Qualification --------------------------------------------------------------------------------- */

export async function recordQualification(enquiryId: string, status: "qualifying" | "qualified" | "disqualified", answers: Record<string, string>, reason: string): Promise<ActionResult> {
  const parsed = z
    .object({ id: uuid, status: z.enum(["qualifying", "qualified", "disqualified"]), answers: z.record(z.string(), z.string().max(300)), reason: z.string().trim().max(500) })
    .safeParse({ id: enquiryId, status, answers, reason });
  if (!parsed.success) return { error: "Invalid request." };
  if (parsed.data.status === "disqualified" && !parsed.data.reason) return { fieldErrors: { reason: "Say why it's disqualified" } };
  const { supabase, org, user } = await requireOrg();
  const { error } = await supabase.from("qualification_records").insert({
    organization_id: org.id,
    enquiry_id: parsed.data.id,
    status: parsed.data.status,
    answers: parsed.data.answers as Json,
    reason: parsed.data.reason || null,
    recorded_by: user.id,
  });
  if (error) return dbError(error);
  // Merge recorded answers into the project's details so fit can use them.
  const { data: enq } = await supabase.from("enquiries").select("project_id").eq("id", parsed.data.id).single();
  if (enq?.project_id) {
    const { data: proj } = await supabase.from("projects").select("details").eq("id", enq.project_id).single();
    await supabase
      .from("projects")
      .update({ details: { ...((proj?.details as Record<string, Json>) ?? {}), ...parsed.data.answers } as Json })
      .eq("id", enq.project_id);
  }
  return done(["/app/enquiries"]);
}

/* Contact restrictions ------------------------------------------------------------------------- */

export async function setDoNotContact(contactId: string, value: boolean, note?: string): Promise<ActionResult> {
  if (!uuid.safeParse(contactId).success) return { error: "Invalid request." };
  const { supabase, org } = await requireOrg();
  const { error } = await supabase
    .from("contacts")
    .update({ do_not_contact: value, restriction_note: value ? (note?.trim().slice(0, 500) || null) : null })
    .eq("id", contactId)
    .eq("organization_id", org.id);
  if (error) return dbError(error);
  return done([`/app/contacts/${contactId}`]);
}

/* Tasks ------------------------------------------------------------------------------------------ */

export async function addTask(input: { title: string; due_date?: string; due_time?: string; assignee_id?: string; opportunity_id?: string; contact_id?: string; notes?: string }): Promise<ActionResult> {
  const parsed = z
    .object({
      title: z.string().trim().min(2, "Describe the task").max(200),
      due_date: z.string().optional(),
      due_time: z.string().optional(),
      assignee_id: z.union([z.literal(""), uuid]).optional(),
      opportunity_id: uuid.optional(),
      contact_id: uuid.optional(),
      notes: z.string().trim().max(2000).optional(),
    })
    .safeParse(input);
  if (!parsed.success) return { fieldErrors: { title: parsed.error.issues[0]?.message ?? "Check the task" } };
  const { supabase, org, user } = await requireOrg();
  let due: string | null = null;
  if (parsed.data.due_date) {
    try {
      due = zonedTimeToUtc(parsed.data.due_date, parsed.data.due_time || "09:00", org.timezone);
    } catch {
      return { fieldErrors: { due_date: "Check the date" } };
    }
  }
  const { error } = await supabase.from("tasks").insert({
    organization_id: org.id,
    title: parsed.data.title,
    notes: parsed.data.notes || null,
    due_at: due,
    assignee_id: parsed.data.assignee_id || user.id,
    opportunity_id: parsed.data.opportunity_id ?? null,
    contact_id: parsed.data.contact_id ?? null,
    created_by: user.id,
  });
  if (error) return dbError(error);
  return done(["/app/tasks", parsed.data.opportunity_id ? `/app/opportunities/${parsed.data.opportunity_id}` : "/app"]);
}

export async function setTaskStatus(taskId: string, status: "open" | "done" | "cancelled"): Promise<ActionResult> {
  if (!uuid.safeParse(taskId).success || !["open", "done", "cancelled"].includes(status)) return { error: "Invalid request." };
  const { supabase, org } = await requireOrg();
  const { error } = await supabase.from("tasks").update({ status }).eq("id", taskId).eq("organization_id", org.id);
  if (error) return dbError(error);
  return done(["/app/tasks"]);
}

/* Notes ------------------------------------------------------------------------------------------ */

export async function addNote(oppId: string, body: string): Promise<ActionResult> {
  const parsed = z.object({ id: uuid, body: z.string().trim().min(1, "Write a note").max(4000) }).safeParse({ id: oppId, body });
  if (!parsed.success) return { fieldErrors: { body: parsed.error.issues[0]!.message } };
  const { supabase, org, user } = await requireOrg();
  const { error } = await supabase.from("notes").insert({ organization_id: org.id, opportunity_id: parsed.data.id, body: parsed.data.body, author_id: user.id });
  if (error) return dbError(error);
  return done([`/app/opportunities/${oppId}`]);
}

/** A call or message outcome: logged as a note and, where it applies, moves the stage forward. */
export async function logContactAttempt(oppId: string, outcome: "no_answer" | "left_message" | "connected" | "emailed", note: string): Promise<ActionResult> {
  if (!uuid.safeParse(oppId).success) return { error: "Invalid request." };
  const { supabase, org, user } = await requireOrg();
  const { data: opp } = await supabase.from("opportunities").select("stage, contact:contacts(do_not_contact)").eq("id", oppId).eq("organization_id", org.id).single();
  if (!opp) return { error: "Not found." };
  if (opp.contact?.do_not_contact && outcome !== "connected") return { error: "This contact is marked do not contact. Outreach is blocked." };
  const labels = { no_answer: "Called, no answer", left_message: "Called, left a message", connected: "Spoke with the customer", emailed: "Sent an email" };
  await supabase.from("notes").insert({ organization_id: org.id, opportunity_id: oppId, body: `${labels[outcome]}${note.trim() ? ` — ${note.trim().slice(0, 1000)}` : ""}`, author_id: user.id });
  const target: Stage | null = outcome === "connected" ? "connected" : "contact_attempted";
  const order: Stage[] = ["new", "reviewing", "contact_attempted", "connected"];
  if (order.includes(opp.stage) && order.indexOf(target) > order.indexOf(opp.stage)) {
    await supabase.from("opportunities").update({ stage: target }).eq("id", oppId);
  }
  return done([`/app/opportunities/${oppId}`]);
}

/* Appointments ----------------------------------------------------------------------------------- */

export async function bookAppointment(input: { opportunity_id?: string; contact_id: string; type: string; date: string; time: string; minutes: number; location?: string; purpose?: string }): Promise<ActionResult> {
  const parsed = z
    .object({
      opportunity_id: uuid.optional(),
      contact_id: uuid,
      type: z.enum(["phone", "video", "site_visit"]),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date"),
      time: z.string().regex(/^\d{2}:\d{2}$/, "Pick a time"),
      minutes: z.coerce.number().int().min(15).max(480),
      location: z.string().trim().max(200).optional(),
      purpose: z.string().trim().max(500).optional(),
    })
    .safeParse(input);
  if (!parsed.success) {
    const fe: Record<string, string> = {};
    for (const i of parsed.error.issues) fe[String(i.path[0])] ??= i.message;
    return { fieldErrors: fe };
  }
  const { supabase, org, user } = await requireOrg();
  const { data: contact } = await supabase.from("contacts").select("do_not_contact").eq("id", parsed.data.contact_id).eq("organization_id", org.id).single();
  if (!contact) return { error: "Contact not found." };
  const startsAt = zonedTimeToUtc(parsed.data.date, parsed.data.time, org.timezone);
  if (new Date(startsAt).getTime() < Date.now() - 5 * 60_000) return { fieldErrors: { date: "Choose a time in the future" } };
  const endsAt = new Date(new Date(startsAt).getTime() + parsed.data.minutes * 60_000).toISOString();

  // Overlap check against this organisation's other live appointments.
  const { data: clash } = await supabase
    .from("appointments")
    .select("id")
    .eq("organization_id", org.id)
    .in("status", ["scheduled", "confirmed"])
    .lt("starts_at", endsAt)
    .gt("ends_at", startsAt)
    .limit(1);
  if (clash?.length) return { fieldErrors: { time: "That overlaps another appointment" } };

  const { error } = await supabase.from("appointments").insert({
    organization_id: org.id,
    opportunity_id: parsed.data.opportunity_id ?? null,
    contact_id: parsed.data.contact_id,
    type: parsed.data.type,
    starts_at: startsAt,
    ends_at: endsAt,
    timezone: org.timezone,
    location: parsed.data.location || null,
    purpose: parsed.data.purpose || null,
    created_by: user.id,
  });
  if (error) return dbError(error);
  return done(["/app/appointments", parsed.data.opportunity_id ? `/app/opportunities/${parsed.data.opportunity_id}` : "/app"]);
}

export async function updateAppointment(id: string, patch: { status?: string; date?: string; time?: string; outcome?: string }): Promise<ActionResult> {
  const parsed = z
    .object({
      id: uuid,
      status: z.enum(["scheduled", "confirmed", "attended", "no_show", "cancelled", "rescheduled"]).optional(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
      outcome: z.string().trim().max(1000).optional(),
    })
    .safeParse({ id, ...patch });
  if (!parsed.success) return { error: "Invalid request." };
  const { supabase, org } = await requireOrg();
  const { data: appt } = await supabase.from("appointments").select("starts_at, ends_at, opportunity_id").eq("id", id).eq("organization_id", org.id).single();
  if (!appt) return { error: "Not found." };
  const update: { status?: "scheduled" | "confirmed" | "attended" | "no_show" | "cancelled" | "rescheduled"; starts_at?: string; ends_at?: string; outcome?: string | null } = {};
  if (parsed.data.date && parsed.data.time) {
    const starts = zonedTimeToUtc(parsed.data.date, parsed.data.time, org.timezone);
    const length = new Date(appt.ends_at).getTime() - new Date(appt.starts_at).getTime();
    update.starts_at = starts;
    update.ends_at = new Date(new Date(starts).getTime() + length).toISOString();
    update.status = "rescheduled";
  }
  if (parsed.data.status) update.status = parsed.data.status;
  if (parsed.data.outcome !== undefined) update.outcome = parsed.data.outcome || null;
  const { error } = await supabase.from("appointments").update(update).eq("id", id).eq("organization_id", org.id);
  if (error) return dbError(error);
  return done(["/app/appointments", appt.opportunity_id ? `/app/opportunities/${appt.opportunity_id}` : "/app"]);
}
