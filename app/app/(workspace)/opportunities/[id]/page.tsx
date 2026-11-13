import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Mail, MapPin, Phone } from "lucide-react";
import { Page } from "@/components/app/PageHeader";
import { FitCard } from "@/components/app/crm/FitCard";
import { IntentCard } from "@/components/app/crm/IntentCard";
import { computeIntent } from "@/features/crm/intent";
import { Timeline } from "@/components/app/crm/Timeline";
import { AppointmentsPanel, DoNotContact, NotesPanel, OwnerSelect, QualificationPanel, StageControl, TaskList, ValueInput, BrexPanel } from "@/components/app/crm/widgets";
import { Avatar, Badge, Card, CardHeader } from "@/components/ui";
import { getMembers, getOpportunity, questionsForCategory } from "@/features/crm/queries";
import { QUAL_LABEL, STAGE_BY_ID } from "@/features/crm/stages";
import { requireOrg } from "@/lib/auth/session";
import { formatDateTime, formatRelative } from "@/lib/format";

export const metadata: Metadata = { title: "Opportunity" };

export default async function OpportunityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireOrg();
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [detail, members] = await Promise.all([getOpportunity(ctx, id), getMembers(ctx)]);
  if (!detail) notFound();
  const { opp, fit, confidence, fc, tasks, appointments, notes, activity, quals } = detail;
  const tz = ctx.org.timezone;
  const contact = opp.contact!;
  const project = opp.project;
  const enquiry = opp.enquiry;
  const answers = { ...((project?.details as Record<string, string>) ?? {}), ...((enquiry?.answers as Record<string, string>) ?? {}) };
  const service = fc.orgServices.find((s) => s.code === project?.category_code);
  const apptSettings = ((ctx.org.settings ?? {}) as { appointments?: { meeting_types?: string[]; meeting_minutes?: number } }).appointments ?? {};
  const stage = STAGE_BY_ID[opp.stage];
  const questions = questionsForCategory(fc.questions, project?.category_code);
  const provenance = (project?.details as { provenance?: { source_name?: string; source_type?: string; external_id?: string; source_url?: string; observed_at?: string; imported_at?: string; permitted_use?: string; contact_permission?: string; project_stage?: string } } | null)?.provenance;

  return (
    <Page wide>
      <div className="mb-6 text-[13px] text-ink-3">
        <Link href="/app/enquiries" className="hover:text-ink">
          Enquiries
        </Link>{" "}
        / <span className="text-ink-2">{enquiry?.reference ?? "Opportunity"}</span>
      </div>

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <Avatar name={contact.full_name} className="size-12 text-[15px]" />
          <div className="min-w-0">
            <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.02em] sm:text-[30px]">{contact.full_name}</h1>
            <p className="mt-1 text-[15px] text-ink-2">
              {service?.name ?? project?.title ?? opp.title}
              {project?.location_text ? ` · ${project.location_text}` : ""}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge tone={stage.tone} dot>
                {stage.label}
              </Badge>
              {enquiry ? <Badge tone={QUAL_LABEL[enquiry.status].tone}>{QUAL_LABEL[enquiry.status].label}</Badge> : null}
              {contact.do_not_contact ? <Badge tone="red">Do not contact</Badge> : null}
              {contact.is_sample ? <Badge tone="amber">Sample data</Badge> : null}
              <span className="text-[12px] text-ink-3">Received {formatRelative(enquiry?.received_at ?? opp.created_at, tz)}</span>
            </div>
          </div>
        </div>
        <div className="grid w-full gap-3 sm:grid-cols-3 lg:w-[540px]">
          <div>
            <p className="mb-1 text-[12px] text-ink-3">Stage</p>
            <StageControl oppId={opp.id} stage={opp.stage} lossReason={opp.loss_reason} />
          </div>
          <div>
            <p className="mb-1 text-[12px] text-ink-3">Owner</p>
            <OwnerSelect oppId={opp.id} ownerId={opp.owner_id} members={members} />
          </div>
          <div>
            <p className="mb-1 text-[12px] text-ink-3">Value</p>
            <ValueInput oppId={opp.id} valueMinor={opp.value_minor} currency={opp.currency ?? ctx.org.currency} />
          </div>
        </div>
      </div>
      {opp.stage === "lost" && opp.loss_reason ? (
        <p className="mt-4 rounded-xl bg-surface-2 px-4 py-3 text-[14px] text-ink-2">
          Lost: {opp.loss_reason.replaceAll("_", " ")}
          {opp.loss_note ? ` — ${opp.loss_note}` : ""}
        </p>
      ) : null}

      <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid min-w-0 content-start gap-6">
          <Card>
            <CardHeader
              title={enquiry ? "Enquiry" : provenance ? "Discovered project" : "Opportunity"}
              description={enquiry ? `Reference ${enquiry.reference} · ${enquiry.source === "visitor_chat" ? "Website chat" : enquiry.source === "manual" ? "Added manually" : "Landing page form"}` : provenance ? `From ${provenance.source_name}` : "Added manually"}
            />
            <div className="grid gap-5 px-5 pb-5 pt-4">
              {provenance ? (
                <dl className="grid gap-x-6 gap-y-2 rounded-xl border border-line bg-surface-2/50 p-4 text-[13px] sm:grid-cols-2">
                  <div>
                    <dt className="text-ink-3">Source</dt>
                    <dd>
                      {provenance.source_name} · {provenance.source_type?.replace("_", "-")}
                      {provenance.source_url ? (
                        <a href={provenance.source_url} target="_blank" rel="noreferrer noopener" className="ml-1.5 text-blue hover:underline">
                          View
                        </a>
                      ) : null}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-ink-3">Observed / imported</dt>
                    <dd>
                      {provenance.observed_at ?? "Unknown"} / {provenance.imported_at ? formatDateTime(provenance.imported_at, tz) : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-ink-3">Permitted use</dt>
                    <dd>{provenance.permitted_use}</dd>
                  </div>
                  <div>
                    <dt className="text-ink-3">Contact permission</dt>
                    <dd className={provenance.contact_permission === "permitted" ? "text-green-ink" : "text-amber-ink"}>{provenance.contact_permission === "permitted" ? "Permitted by source" : "Not confirmed — check before contacting"}</dd>
                  </div>
                </dl>
              ) : null}
              {project?.description ?? enquiry?.message ? (
                <blockquote className="whitespace-pre-line rounded-xl bg-surface-2/70 px-4 py-3 text-[15px] leading-relaxed text-ink-2">{project?.description ?? enquiry?.message}</blockquote>
              ) : null}
              <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                {questions.map((q) => (
                  <div key={q.key}>
                    <dt className="text-[12px] text-ink-3">{q.label}</dt>
                    <dd className={answers[q.key] ? "text-[14px]" : "text-[14px] italic text-ink-3"}>{answers[q.key] || "Not recorded"}</dd>
                  </div>
                ))}
                <div>
                  <dt className="text-[12px] text-ink-3">Location</dt>
                  <dd className="text-[14px]">{[project?.location_text, project?.postcode].filter(Boolean).join(" ") || <span className="italic text-ink-3">Not recorded</span>}</dd>
                </div>
              </dl>
              {enquiry?.consent_at ? (
                <p className="text-[12px] text-ink-3">
                  Consent recorded {formatDateTime(enquiry.consent_at, tz)}: “{enquiry.consent_text}”
                  {enquiry.duplicate_count ? ` · Resubmitted ${enquiry.duplicate_count}×` : ""}
                </p>
              ) : null}
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="p-5">
              <FitCard fit={fit} confidence={confidence} />
              <IntentCard
                intent={computeIntent({
                  answers,
                  message: enquiry?.message,
                  duplicateCount: enquiry?.duplicate_count,
                  startTiming: project?.start_timing,
                  budgetLabel: project?.budget_label,
                  appointmentCount: appointments.length,
                  receivedAt: enquiry?.received_at ?? opp.created_at,
                  now: Date.now(),
                })}
              />
            </Card>
            <Card>
              <CardHeader title="Brex AI" description="Read-only help with this record." />
              <div className="px-5 pb-5 pt-4">
                <BrexPanel oppId={opp.id} />
              </div>
            </Card>
          </div>

          {enquiry ? (
            <Card>
              <CardHeader
                title="Qualification"
                description={quals[0] ? `Last recorded ${formatRelative(quals[0].created_at, tz)}${quals[0].recorder?.full_name ? ` by ${quals[0].recorder.full_name}` : ""}` : "Record what you've confirmed with the customer."}
              />
              <div className="px-5 pb-5 pt-4">
                <QualificationPanel
                  enquiryId={enquiry.id}
                  questions={questions.map((q) => ({ key: q.key, label: q.label, kind: q.kind, options: Array.isArray(q.options) ? (q.options as string[]) : [], required: q.required }))}
                  answers={answers}
                />
              </div>
            </Card>
          ) : null}

          <Card>
            <CardHeader title="Notes and contact log" />
            <div className="px-5 pb-5 pt-4">
              <NotesPanel oppId={opp.id} blocked={contact.do_not_contact} />
              {notes.length ? (
                <ul className="mt-5 grid gap-3">
                  {notes.map((n) => (
                    <li key={n.id} className="rounded-xl border border-line p-3">
                      <p className="whitespace-pre-line text-[14px]">{n.body}</p>
                      <p className="mt-1 text-[12px] text-ink-3">
                        {n.author?.full_name || n.author?.email} · {formatDateTime(n.created_at, tz)}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </Card>

          <Card>
            <CardHeader title="Activity" description="Everything that has happened, newest first." />
            <div className="px-5 pb-5 pt-5">
              <Timeline events={activity} timezone={tz} />
            </div>
          </Card>
        </div>

        <div className="grid content-start gap-6">
          <Card>
            <CardHeader title="Contact" />
            <div className="grid gap-3 px-5 pb-5 pt-4 text-[14px]">
              {contact.email ? (
                <a href={contact.do_not_contact ? undefined : `mailto:${contact.email}`} className="flex items-center gap-2.5 break-all text-ink hover:text-blue">
                  <Mail className="size-4 shrink-0 text-ink-3" aria-hidden /> {contact.email}
                </a>
              ) : null}
              {contact.phone ? (
                <a href={contact.do_not_contact ? undefined : `tel:${contact.phone_normalized ?? contact.phone}`} className="flex items-center gap-2.5 text-ink hover:text-blue">
                  <Phone className="size-4 shrink-0 text-ink-3" aria-hidden /> {contact.phone}
                </a>
              ) : null}
              {project?.location_text ? (
                <p className="flex items-center gap-2.5">
                  <MapPin className="size-4 shrink-0 text-ink-3" aria-hidden /> {project.location_text}
                </p>
              ) : null}
              {contact.preferred_contact ? <p className="text-[13px] text-ink-3">Prefers {contact.preferred_contact === "any" ? "any channel" : contact.preferred_contact}</p> : null}
              <Link href={`/app/contacts/${contact.id}`} className="text-[13px] font-medium text-blue hover:underline">
                View contact
              </Link>
              <DoNotContact contactId={contact.id} value={contact.do_not_contact} note={contact.restriction_note} />
            </div>
          </Card>
          <Card>
            <CardHeader title="Tasks" />
            <div className="px-5 pb-5 pt-2">
              <TaskList tasks={tasks} timezone={tz} oppId={opp.id} members={members} now={Date.now()} />
            </div>
          </Card>
          <Card>
            <CardHeader title="Appointments" description={`Times in ${tz}`} />
            <div className="px-5 pb-5 pt-4">
              <AppointmentsPanel
                now={Date.now()}
                appointments={appointments}
                timezone={tz}
                oppId={opp.id}
                contactId={contact.id}
                location={project?.location_text}
                defaults={{ types: apptSettings.meeting_types ?? ["phone", "site_visit"], minutes: apptSettings.meeting_minutes ?? 60 }}
              />
            </div>
          </Card>
        </div>
      </div>
    </Page>
  );
}
