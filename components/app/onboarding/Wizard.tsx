"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { ArrowLeft, Check, CircleCheck, ImageUp, Plus, Trash, TriangleExclamationPoint } from "lucide-react";
import { INDUSTRY_TEMPLATES } from "@/config/industry-templates";
import {
  saveBrand,
  saveBusiness,
  saveIdeal,
  saveOperations,
  saveQualification,
  saveServices,
  submitOnboarding,
  type StepState,
} from "@/features/onboarding/actions";
import { STEPS, type StepId } from "@/features/onboarding/steps";
import { BUDGET_ORDER } from "@/features/crm/fit";
import { INDUSTRY_ICON } from "@/components/marketing/industry-icons";
import { Badge, Button, ButtonLink, Checkbox, Field, Input, Notice, Select, Textarea } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/cn";

export type WizardData = {
  orgId: string;
  isOwner: boolean;
  status: string;
  reviewNote: string | null;
  completed: string[];
  org: { name: string; website: string | null; phone: string | null; contact_name: string | null; timezone: string; settings: Record<string, Record<string, unknown> | undefined> };
  services: string[];
  focus: string;
  areas: { label: string; postcode: string; radius_km?: number }[];
  questions: Question[];
  members: { id: string; name: string }[];
  zones: string[];
};

type Question = {
  key: string;
  label: string;
  kind: "text" | "select" | "yes_no" | "date";
  options: string[];
  is_public: boolean;
  required: boolean;
  active: boolean;
  source: "template" | "custom";
};

const s = (v: unknown) => (typeof v === "string" ? v : "");

export function Wizard({ data, step }: { data: WizardData; step: StepId | "review" }) {
  const router = useRouter();
  const index = step === "review" ? STEPS.length : STEPS.findIndex((x) => x.id === step);
  const go = (to: StepId | "review") => router.push(`/app/onboarding?step=${to}`, { scroll: true });
  const next = () => go(index + 1 < STEPS.length ? STEPS[index + 1]!.id : "review");

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12">
      <nav aria-label="Onboarding steps" className="min-w-0 lg:sticky lg:top-8 lg:self-start">
        <ol className="flex gap-1 overflow-x-auto pb-1 scrollbar-none lg:grid lg:gap-0.5 lg:overflow-visible">
          {[...STEPS, { id: "review" as const, title: "Review", description: "Submit for activation" }].map((st, i) => {
            const done = data.completed.includes(st.id);
            const current = st.id === step;
            return (
              <li key={st.id} className="shrink-0">
                <Link
                  href={`/app/onboarding?step=${st.id}`}
                  aria-current={current ? "step" : undefined}
                  className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors", current ? "bg-surface shadow-xs ring-1 ring-line" : "hover:bg-surface-2")}
                >
                  <span
                    className={cn(
                      "grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold tabular",
                      done ? "bg-teal text-white" : current ? "bg-blue text-on-blue" : "border border-line-strong text-ink-3",
                    )}
                  >
                    {done ? <Check className="size-3.5" strokeWidth={3} aria-label="Done" /> : i + 1}
                  </span>
                  <span className="min-w-0">
                    <span className={cn("block text-[14px]", current ? "font-semibold text-ink" : "text-ink-2")}>{st.title}</span>
                    <span className="hidden text-[12px] text-ink-3 lg:block">{st.description}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="min-w-0">
        {data.status === "needs_changes" && data.reviewNote ? (
          <Notice tone="amber" title="A few things to finish" className="mb-6">
            {data.reviewNote}
          </Notice>
        ) : null}
        {!data.isOwner ? (
          <Notice tone="blue" className="mb-6">
            Only an owner can change business details. You can view the setup here.
          </Notice>
        ) : null}
        <div className="rounded-2xl border border-line bg-surface shadow-sm">
          {step === "business" && <BusinessStep data={data} onDone={next} />}
          {step === "services" && <ServicesStep data={data} onDone={next} />}
          {step === "ideal" && <IdealStep data={data} onDone={next} />}
          {step === "qualification" && <QualificationStep data={data} onDone={next} />}
          {step === "brand" && <BrandStep data={data} onDone={next} />}
          {step === "operations" && <OperationsStep data={data} onDone={next} />}
          {step === "review" && <ReviewStep data={data} />}
        </div>
        {index > 0 ? (
          <button type="button" onClick={() => go(STEPS[index - 1]!.id)} className="mt-4 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[14px] text-ink-3 hover:text-ink">
            <ArrowLeft className="size-4" aria-hidden /> Back
          </button>
        ) : null}
      </div>
    </div>
  );
}

function StepHeader({ title, body }: { title: string; body: string }) {
  return (
    <div className="border-b border-line px-6 py-5 sm:px-8">
      <h2 className="text-[22px] font-semibold tracking-[-0.015em]">{title}</h2>
      <p className="mt-1 text-[14px] text-ink-3">{body}</p>
    </div>
  );
}

function StepFooter({ pending, state, label = "Save and continue" }: { pending: boolean; state: StepState; label?: string }) {
  return (
    <div className="flex flex-col-reverse items-stretch gap-3 border-t border-line px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
      <p className="text-[13px] text-ink-3" role="status">
        {state.error ? <span className="text-red-ink">{state.error}</span> : state.fieldErrors ? <span className="text-red-ink">Check the highlighted fields.</span> : "Your progress is saved at each step."}
      </p>
      <Button type="submit" pending={pending}>
        {label}
      </Button>
    </div>
  );
}

function useStep(action: (s: StepState, f: FormData) => Promise<StepState>, onDone: () => void) {
  const [state, run, pending] = useActionState<StepState, FormData>(action, {});
  const last = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (state.ok && state.savedAt !== last.current) {
      last.current = state.savedAt;
      onDone();
    }
  }, [state, onDone]);
  return [state, run, pending] as const;
}

const ep = (fe: Record<string, string> | undefined, k: string) => (fe?.[k] ? { "aria-invalid": true as const, "aria-describedby": `${k}-error` } : {});

/* ---------------------------------------------------------------------------------------------- */

function BusinessStep({ data, onDone }: { data: WizardData; onDone: () => void }) {
  const [state, run, pending] = useStep(saveBusiness, onDone);
  const fe = state.fieldErrors;
  return (
    <form action={run} noValidate>
      <StepHeader title="Your business" body="How customers know you and how to reach you." />
      <fieldset disabled={!data.isOwner} className="grid gap-5 px-6 py-6 sm:grid-cols-2 sm:px-8">
        <Field label="Trading name" htmlFor="name" error={fe?.name}>
          <Input id="name" name="name" defaultValue={data.org.name} required {...ep(fe, "name")} />
        </Field>
        <Field label="Legal name" htmlFor="legal_name" optional>
          <Input id="legal_name" name="legal_name" defaultValue={s(data.org.settings.business?.legal_name)} />
        </Field>
        <Field label="Website" htmlFor="website" error={fe?.website} optional>
          <Input id="website" name="website" inputMode="url" placeholder="example.com" defaultValue={data.org.website ?? ""} {...ep(fe, "website")} />
        </Field>
        <Field label="Phone" htmlFor="phone" error={fe?.phone}>
          <Input id="phone" name="phone" type="tel" autoComplete="tel" defaultValue={data.org.phone ?? ""} {...ep(fe, "phone")} />
        </Field>
        <Field label="Contact person" htmlFor="contact_name" error={fe?.contact_name}>
          <Input id="contact_name" name="contact_name" defaultValue={data.org.contact_name ?? ""} {...ep(fe, "contact_name")} />
        </Field>
        <Field label="Time zone" htmlFor="timezone" hint="Appointments and reminders use this.">
          <Select id="timezone" name="timezone" defaultValue={data.org.timezone}>
            {data.zones.map((z) => (
              <option key={z} value={z}>
                {z.replaceAll("_", " ")}
              </option>
            ))}
          </Select>
        </Field>
      </fieldset>
      <StepFooter pending={pending} state={state} />
    </form>
  );
}

function ServicesStep({ data, onDone }: { data: WizardData; onDone: () => void }) {
  const [state, run, pending] = useStep(saveServices, onDone);
  const [services, setServices] = useState<string[]>(data.services);
  const [focus, setFocus] = useState(data.focus || "both");
  const [areas, setAreas] = useState(data.areas.length ? data.areas : [{ label: "", postcode: "" }]);
  const [exclusions, setExclusions] = useState(s(data.org.settings.coverage?.exclusions));
  const fe = state.fieldErrors;
  const toggle = (code: string) => setServices((cur) => (cur.includes(code) ? cur.filter((c) => c !== code) : [...cur, code]));
  const payload = JSON.stringify({ services, focus, areas: areas.filter((a) => a.label.trim()), exclusions });

  return (
    <form action={run} noValidate>
      <StepHeader title="Services and coverage" body="Choose everything you offer. Each service brings its own questions, which you'll review next." />
      <input type="hidden" name="payload" value={payload} />
      <fieldset disabled={!data.isOwner} className="grid gap-8 px-6 py-6 sm:px-8">
        <div>
          <legend className="text-[13px] font-medium text-ink-2">Services</legend>
          {fe?.services ? (
            <p className="mt-1 text-[13px] text-red-ink" role="alert">
              {fe.services}
            </p>
          ) : null}
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {INDUSTRY_TEMPLATES.map((t) => {
              const Icon = INDUSTRY_ICON[t.code]!;
              const on = services.includes(t.code);
              return (
                <label
                  key={t.code}
                  className={cn(
                    "pressable relative flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-[14px] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus",
                    on ? "border-blue bg-blue-soft/60 text-ink" : "border-line hover:border-line-strong",
                  )}
                >
                  <input type="checkbox" className="sr-only" checked={on} onChange={() => toggle(t.code)} />
                  <Icon className={cn("size-[18px] shrink-0", on ? "text-blue" : "text-ink-3")} aria-hidden />
                  <span className="min-w-0 leading-tight">{t.name}</span>
                  {on ? <Check className="absolute right-2 top-2 size-3.5 text-blue" strokeWidth={3} aria-hidden /> : null}
                </label>
              );
            })}
          </div>
        </div>
        <div>
          <p className="text-[13px] font-medium text-ink-2" id="focus-label">
            Work focus
          </p>
          <div role="radiogroup" aria-labelledby="focus-label" className="mt-2 inline-flex rounded-xl bg-surface-2 p-1">
            {(["residential", "commercial", "both"] as const).map((f) => (
              <label key={f} className={cn("cursor-pointer rounded-lg px-4 py-1.5 text-[14px] capitalize transition-colors has-[:focus-visible]:outline-2", focus === f ? "bg-surface font-medium text-ink shadow-xs" : "text-ink-3")}>
                <input type="radio" name="focus_ui" className="sr-only" checked={focus === f} onChange={() => setFocus(f)} />
                {f === "both" ? "Both" : f}
              </label>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[13px] font-medium text-ink-2">Service areas</p>
          <p className="text-[13px] text-ink-3">Suburbs, towns or regions. Add a postcode to match enquiries precisely.</p>
          {fe?.areas ? (
            <p className="mt-1 text-[13px] text-red-ink" role="alert">
              {fe.areas}
            </p>
          ) : null}
          <ul className="mt-3 grid gap-2">
            {areas.map((a, i) => (
              <li key={i} className="grid grid-cols-[minmax(0,1fr)_96px_auto] gap-2">
                <Input aria-label={`Area ${i + 1}`} placeholder="e.g. Newcastle NSW" value={a.label} onChange={(e) => setAreas((cur) => cur.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
                <Input aria-label={`Postcode for area ${i + 1}`} placeholder="Postcode" value={a.postcode} onChange={(e) => setAreas((cur) => cur.map((x, j) => (j === i ? { ...x, postcode: e.target.value } : x)))} />
                <Button variant="ghost" className="w-10 px-0" aria-label={`Remove area ${i + 1}`} onClick={() => setAreas((cur) => (cur.length > 1 ? cur.filter((_, j) => j !== i) : [{ label: "", postcode: "" }]))}>
                  <Trash className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
          <Button variant="secondary" size="sm" className="mt-2" onClick={() => setAreas((cur) => [...cur, { label: "", postcode: "" }])}>
            <Plus className="size-4" aria-hidden /> Add area
          </Button>
        </div>
        <Field label="Exclusions" htmlFor="exclusions" optional hint="Work or places you don't take on.">
          <Textarea id="exclusions" rows={2} value={exclusions} onChange={(e) => setExclusions(e.target.value)} />
        </Field>
      </fieldset>
      <StepFooter pending={pending} state={state} />
    </form>
  );
}

function IdealStep({ data, onDone }: { data: WizardData; onDone: () => void }) {
  const [state, run, pending] = useStep(saveIdeal, onDone);
  const ideal = data.org.settings.ideal ?? {};
  return (
    <form action={run} noValidate>
      <StepHeader title="Ideal work" body="Used to explain fit on each enquiry. You can leave anything blank." />
      <div className="grid gap-5 px-6 py-6 sm:grid-cols-2 sm:px-8">
        <Field label="Minimum job size" htmlFor="min_budget" hint="Enquiries that state a lower budget are flagged, not hidden.">
          <Select id="min_budget" name="min_budget" defaultValue={s(ideal.min_budget)}>
            <option value="">No minimum</option>
            {BUDGET_ORDER.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </Select>
        </Field>
        <Field label="Capacity per month" htmlFor="capacity_per_month" optional>
          <Input id="capacity_per_month" name="capacity_per_month" inputMode="numeric" placeholder="e.g. 4 projects" defaultValue={s(ideal.capacity_per_month)} />
        </Field>
        <Field label="Jobs you want more of" htmlFor="preferred_jobs" optional className="sm:col-span-2">
          <Textarea id="preferred_jobs" name="preferred_jobs" rows={3} defaultValue={s(ideal.preferred_jobs)} />
        </Field>
        <Field label="Jobs you'd rather avoid" htmlFor="avoid" optional className="sm:col-span-2">
          <Textarea id="avoid" name="avoid" rows={2} defaultValue={s(ideal.avoid)} />
        </Field>
      </div>
      <StepFooter pending={pending} state={state} />
    </form>
  );
}

function QualificationStep({ data, onDone }: { data: WizardData; onDone: () => void }) {
  const [state, run, pending] = useStep(saveQualification, onDone);
  const [questions, setQuestions] = useState<Question[]>(data.questions);
  const [draft, setDraft] = useState({ label: "", kind: "text" as Question["kind"], options: "" });
  const update = (i: number, patch: Partial<Question>) => setQuestions((cur) => cur.map((q, j) => (j === i ? { ...q, ...patch } : q)));
  const addCustom = () => {
    if (draft.label.trim().length < 2) return;
    const base = draft.label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 30) || "question";
    let key = `c_${base}`;
    let n = 2;
    while (questions.some((q) => q.key === key)) key = `c_${base}_${n++}`;
    setQuestions((cur) => [
      ...cur,
      { key, label: draft.label.trim(), kind: draft.kind, options: draft.options.split(",").map((o) => o.trim()).filter(Boolean), is_public: true, required: false, active: true, source: "custom" },
    ]);
    setDraft({ label: "", kind: "text", options: "" });
  };

  if (!questions.length && !data.services.length)
    return (
      <div className="p-8">
        <Notice tone="amber">Choose your services first. Their questions appear here.</Notice>
      </div>
    );

  return (
    <form action={run} noValidate>
      <StepHeader title="Qualification questions" body="What you need to know before quoting. Public questions appear on your page; internal ones stay in the CRM." />
      <input type="hidden" name="payload" value={JSON.stringify({ questions })} />
      <ul className="divide-y divide-line">
        {questions.map((q, i) => (
          <li key={q.key} className={cn("grid gap-3 px-6 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-8", !q.active && "opacity-55")}>
            <div className="min-w-0">
              <Input aria-label="Question" value={q.label} onChange={(e) => update(i, { label: e.target.value })} className="h-9 border-transparent bg-transparent px-0 font-medium shadow-none focus:border-line-strong focus:bg-surface focus:px-3" />
              <p className="mt-0.5 flex flex-wrap items-center gap-2 text-[12px] text-ink-3">
                <Badge tone={q.source === "custom" ? "violet" : "neutral"}>{q.source === "custom" ? "Custom" : "Template"}</Badge>
                {q.kind === "select" ? `${q.options.length} options` : q.kind === "yes_no" ? "Yes / no" : q.kind === "date" ? "Date" : "Free text"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-[13px] text-ink-2">
              <label className="flex items-center gap-2">
                <Checkbox checked={q.is_public} onChange={(e) => update(i, { is_public: e.target.checked })} /> On page
              </label>
              <label className="flex items-center gap-2">
                <Checkbox checked={q.required} onChange={(e) => update(i, { required: e.target.checked })} /> Required
              </label>
              <label className="flex items-center gap-2">
                <Checkbox checked={q.active} onChange={(e) => update(i, { active: e.target.checked })} /> Use
              </label>
              {q.source === "custom" ? (
                <button type="button" className="grid size-8 place-items-center rounded-lg text-ink-3 hover:bg-surface-2 hover:text-red-ink" aria-label={`Delete ${q.label}`} onClick={() => setQuestions((cur) => cur.filter((_, j) => j !== i))}>
                  <Trash className="size-4" />
                </button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
      <div className="grid gap-3 border-t border-line bg-surface-2/40 px-6 py-5 sm:grid-cols-[minmax(0,1fr)_140px_auto] sm:items-end sm:px-8">
        <Field label="Add your own question" htmlFor="new_q">
          <Input id="new_q" value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} placeholder="e.g. Do you have plans drawn up?" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustom())} />
        </Field>
        <Field label="Answer type" htmlFor="new_kind">
          <Select id="new_kind" value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value as Question["kind"] })}>
            <option value="text">Free text</option>
            <option value="select">Choice</option>
            <option value="yes_no">Yes / no</option>
            <option value="date">Date</option>
          </Select>
        </Field>
        <Button variant="secondary" onClick={addCustom}>
          <Plus className="size-4" aria-hidden /> Add
        </Button>
        {draft.kind === "select" ? (
          <Field label="Choices (comma separated)" htmlFor="new_opts" className="sm:col-span-3">
            <Input id="new_opts" value={draft.options} onChange={(e) => setDraft({ ...draft, options: e.target.value })} placeholder="Yes, No, Not sure" />
          </Field>
        ) : null}
      </div>
      <StepFooter pending={pending} state={state} />
    </form>
  );
}

function BrandStep({ data, onDone }: { data: WizardData; onDone: () => void }) {
  const [state, run, pending] = useStep(saveBrand, onDone);
  const brand = data.org.settings.brand ?? {};
  const [logo, setLogo] = useState(s(brand.logo_url));
  const [uploading, startUpload] = useTransition();
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fe = state.fieldErrors;

  const onFile = (file: File | undefined) => {
    if (!file) return;
    setUploadError(null);
    if (file.size > 5 * 1024 * 1024) return setUploadError("Use an image under 5 MB.");
    if (!/^image\/(png|jpeg|webp|svg\+xml)$/.test(file.type)) return setUploadError("Use a PNG, JPG, WebP or SVG image.");
    startUpload(async () => {
      const supabase = createClient();
      const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
      const path = `${data.orgId}/logo-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("brand-assets").upload(path, file, { contentType: file.type, upsert: false });
      if (error) return setUploadError("Upload failed. Please try again.");
      setLogo(supabase.storage.from("brand-assets").getPublicUrl(path).data.publicUrl);
    });
  };

  return (
    <form action={run} noValidate>
      <StepHeader title="Brand" body="Shown on your landing page. Use only images and words you have permission to use." />
      <input type="hidden" name="logo_url" value={logo} />
      <fieldset disabled={!data.isOwner} className="grid gap-6 px-6 py-6 sm:px-8">
        <div className="flex items-center gap-5">
          <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-2xl border border-dashed border-line-strong bg-surface-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {logo ? <img src={logo} alt="Your logo" className="size-full object-contain p-2" /> : <ImageUp className="size-6 text-ink-3" aria-hidden />}
          </div>
          <div>
            <label className="pressable inline-flex h-9 cursor-pointer items-center gap-2 rounded-[10px] border border-line-strong bg-surface px-3 text-[13px] font-medium shadow-xs hover:bg-surface-2 has-[:focus-visible]:outline-2">
              <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
              {uploading ? "Uploading…" : logo ? "Replace logo" : "Upload logo"}
            </label>
            {logo ? (
              <button type="button" className="ml-2 text-[13px] text-ink-3 hover:text-ink" onClick={() => setLogo("")}>
                Remove
              </button>
            ) : null}
            <p className="mt-1.5 text-[12px] text-ink-3">PNG, JPG, WebP or SVG, up to 5 MB.</p>
            {uploadError ? (
              <p className="mt-1 text-[13px] text-red-ink" role="alert">
                {uploadError}
              </p>
            ) : null}
          </div>
        </div>
        <Field label="Tagline" htmlFor="tagline" optional>
          <Input id="tagline" name="tagline" defaultValue={s(brand.tagline)} placeholder="e.g. Custom homes built for the coast" />
        </Field>
        <Field label="Company description" htmlFor="description" error={fe?.description} hint="Two or three sentences about who you are and the work you do.">
          <Textarea id="description" name="description" rows={4} defaultValue={s(brand.description)} {...ep(fe, "description")} />
        </Field>
      </fieldset>
      <StepFooter pending={pending || uploading} state={state} />
    </form>
  );
}

function OperationsStep({ data, onDone }: { data: WizardData; onDone: () => void }) {
  const [state, run, pending] = useStep(saveOperations, onDone);
  const ops = data.org.settings.operations ?? {};
  const eng = data.org.settings.engagement ?? {};
  const appt = data.org.settings.appointments ?? {};
  const channels = (eng.channels as string[] | undefined) ?? ["email", "phone"];
  const types = (appt.meeting_types as string[] | undefined) ?? ["phone", "site_visit"];
  const fe = state.fieldErrors;
  return (
    <form action={run} noValidate>
      <StepHeader title="Operations" body="Who follows up, how quickly, and how appointments work." />
      <div className="grid gap-5 px-6 py-6 sm:grid-cols-2 sm:px-8">
        <Field label="Reply within (business hours)" htmlFor="response_hours" error={fe?.response_hours} hint="Sets the due time of the follow-up task on each enquiry.">
          <Input id="response_hours" name="response_hours" type="number" min={1} max={168} defaultValue={String(ops.response_hours ?? 4)} {...ep(fe, "response_hours")} />
        </Field>
        <Field label="Assign new enquiries to" htmlFor="default_owner_id">
          <Select id="default_owner_id" name="default_owner_id" defaultValue={s(ops.default_owner_id)}>
            <option value="">First owner</option>
            {data.members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Notification emails" htmlFor="notify_emails" error={fe?.notify_emails} optional hint="Separate with commas." className="sm:col-span-2">
          <Input id="notify_emails" name="notify_emails" defaultValue={((ops.notify_emails as string[] | undefined) ?? []).join(", ")} {...ep(fe, "notify_emails")} />
        </Field>
        <Field label="Working hours" htmlFor="working_hours" optional className="sm:col-span-2">
          <Input id="working_hours" name="working_hours" placeholder="Mon–Fri 7:00–16:00" defaultValue={s(ops.working_hours)} />
        </Field>
        <fieldset className="grid gap-2">
          <legend className="mb-1 text-[13px] font-medium text-ink-2">Permitted contact channels</legend>
          {(["email", "phone", "sms"] as const).map((c) => (
            <label key={c} className="flex items-center gap-2.5 text-[14px] text-ink-2">
              <Checkbox name="channels" value={c} defaultChecked={channels.includes(c)} />
              {c === "sms" ? "SMS" : c[0]!.toUpperCase() + c.slice(1)}
            </label>
          ))}
        </fieldset>
        <fieldset className="grid gap-2">
          <legend className="mb-1 text-[13px] font-medium text-ink-2">Appointment types</legend>
          {(
            [
              ["phone", "Phone call"],
              ["video", "Video meeting"],
              ["site_visit", "Site visit"],
            ] as const
          ).map(([v, l]) => (
            <label key={v} className="flex items-center gap-2.5 text-[14px] text-ink-2">
              <Checkbox name="meeting_types" value={v} defaultChecked={types.includes(v)} />
              {l}
            </label>
          ))}
        </fieldset>
        <Field label="Default length (minutes)" htmlFor="meeting_minutes">
          <Input id="meeting_minutes" name="meeting_minutes" type="number" min={15} max={240} step={15} defaultValue={String(appt.meeting_minutes ?? 60)} />
        </Field>
        <Field label="Buffer between (minutes)" htmlFor="buffer_minutes">
          <Input id="buffer_minutes" name="buffer_minutes" type="number" min={0} max={120} step={5} defaultValue={String(appt.buffer_minutes ?? 15)} />
        </Field>
      </div>
      <StepFooter pending={pending} state={state} />
    </form>
  );
}

function ReviewStep({ data }: { data: WizardData }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ status?: string; note?: string | null; error?: string } | null>(null);
  const status = result?.status ?? data.status;
  const missing = STEPS.filter((st) => !data.completed.includes(st.id));

  return (
    <div>
      <StepHeader title="Review and submit" body="We check the essentials, then you can create and approve your landing page." />
      <div className="grid gap-5 px-6 py-6 sm:px-8">
        {status === "approved" || status === "active" ? (
          <div className="flex flex-col items-start gap-3 rounded-xl bg-green-soft p-5 text-green-ink" role="status">
            <CircleCheck className="size-6" aria-hidden />
            <p className="text-[16px] font-semibold">Your setup is approved.</p>
            <p className="text-[14px] opacity-90">Next, review the landing page we drafted from your answers and approve it to go live.</p>
            <ButtonLink href="/app/landing-pages" className="mt-1">
              Go to landing pages
            </ButtonLink>
          </div>
        ) : (
          <>
            <ul className="grid gap-2">
              {STEPS.map((st) => {
                const done = data.completed.includes(st.id);
                return (
                  <li key={st.id} className="flex items-center justify-between gap-3 rounded-xl border border-line px-4 py-3">
                    <span className="flex items-center gap-3 text-[14px]">
                      {done ? <CircleCheck className="size-5 text-teal-ink" aria-label="Done" /> : <TriangleExclamationPoint className="size-5 text-amber-ink" aria-label="Not done" />}
                      {st.title}
                    </span>
                    <Link href={`/app/onboarding?step=${st.id}`} className="text-[13px] font-medium text-blue hover:underline">
                      {done ? "Edit" : "Finish"}
                    </Link>
                  </li>
                );
              })}
            </ul>
            {result?.error ? <Notice tone="red">{result.error}</Notice> : null}
            {status === "needs_changes" && (result?.note ?? data.reviewNote) ? (
              <Notice tone="amber" title="Needs changes">
                {result?.note ?? data.reviewNote}
              </Notice>
            ) : null}
            <div className="flex flex-wrap items-center gap-3">
              <Button
                pending={pending}
                disabled={!data.isOwner}
                onClick={() =>
                  start(async () => {
                    const r = await submitOnboarding();
                    setResult(r);
                    router.refresh();
                  })
                }
              >
                Submit for review
              </Button>
              {missing.length ? <p className="text-[13px] text-ink-3">{missing.length} step(s) still open. You can submit anyway; we'll tell you what's missing.</p> : null}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
