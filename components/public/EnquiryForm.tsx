"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { ArrowLeft, CircleCheck } from "lucide-react";
import { getAvailability, submitEnquiry, type Availability } from "@/features/public/actions";
import { TimePicker, type PickedTime } from "./TimePicker";
import { Button, Checkbox, Field, Input, Notice, Textarea } from "@/components/ui";
import { cn } from "@/lib/cn";
import { getTemplate } from "@/config/industry-templates";
import type { PublicPageData, PublicQuestion } from "./types";

type Values = {
  category_code: string;
  description: string;
  answers: Record<string, string>;
  location: string;
  postcode: string;
  name: string;
  email: string;
  phone: string;
  preferred_contact: "" | "email" | "phone" | "sms" | "any";
  consent: boolean;
};

export function consentText(business: string) {
  return `I agree to ${business} contacting me about this enquiry. My details are shared only with ${business}.`;
}

/**
 * Progressive enquiry form (§7.2, §10.2): a few questions at a time, "Not sure" always allowed,
 * consent before personal details are sent. Validation runs again on the server.
 */
/** Questions for the chosen service (its template's questions plus the business's custom ones). */
function questionsFor(all: PublicQuestion[], category: string) {
  if (!category) return all;
  const own = new Set((getTemplate(category)?.questions ?? []).map((q) => q.key));
  return all.filter((q) => own.has(q.key) || q.key.startsWith("c_"));
}

const PER_STEP = 3;

export function EnquiryForm({ data, preview, onDone }: { data: PublicPageData; preview?: boolean; onDone?: (ref: string) => void }) {
  const [i, setI] = useState(0);
  const [v, setV] = useState<Values>({
    category_code: data.services.length === 1 ? data.services[0]!.code : "",
    description: "",
    answers: {},
    location: "",
    postcode: "",
    name: "",
    email: "",
    phone: "",
    preferred_contact: "",
    consent: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState<{ reference: string; duplicate: boolean; requested?: string | null; bookingError?: string } | null>(null);
  const [avail, setAvail] = useState<Availability | null>(null);
  const [picked, setPicked] = useState<PickedTime>(null);
  const [day, setDay] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const startedAt = useRef(0);
  useEffect(() => {
    startedAt.current = Date.now();
    if (preview) return;
    let live = true;
    getAvailability(data.slug).then((a) => live && setAvail(a)).catch(() => {});
    return () => {
      live = false;
    };
  }, [data.slug, preview]);
  const canBook = Boolean(avail?.ok && avail.slots?.length);
  const honeypot = useRef<HTMLInputElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const set = <K extends keyof Values>(k: K, val: Values[K]) => setV((cur) => ({ ...cur, [k]: val }));

  // A few questions at a time (§10.2 progressive disclosure), only for the chosen service.
  const relevant = questionsFor(data.questions, v.category_code);
  const chunks: PublicQuestion[][] = [];
  for (let k = 0; k < relevant.length; k += PER_STEP) chunks.push(relevant.slice(k, k + PER_STEP));
  const steps: string[] = ["project", ...chunks.map((_, k) => `details-${k}`), "location", ...(canBook ? ["time"] : []), "contact"];
  type Step = "project" | "details" | "location" | "time" | "contact";
  const stepId = steps[Math.min(i, steps.length - 1)]!;
  const step = (stepId.startsWith("details") ? "details" : stepId) as Step;
  const stepQuestions = step === "details" ? chunks[Number(stepId.split("-")[1])] ?? [] : [];

  const validate = (s: Step) => {
    const e: Record<string, string> = {};
    if (s === "project") {
      if (data.services.length > 1 && !v.category_code) e.category_code = "Choose the service you need";
      if (v.description.trim().length < 3) e.description = "Tell us a little about the project";
    }
    if (s === "details") {
      for (const q of stepQuestions) if (q.required && !v.answers[q.key]) e[`q_${q.key}`] = "Choose an answer, or “Not sure”";
    }
    if (s === "location" && !v.location.trim()) e.location = "Where is the project? A suburb is fine";
    if (s === "contact") {
      if (!v.name.trim()) e.name = "Add your name";
      if (!v.email.trim() && !v.phone.trim()) e.email = "Add an email or a phone number";
      if (v.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.email.trim())) e.email = "Check the email address";
      if (v.phone && v.phone.replace(/\D/g, "").length < 6) e.phone = "Check the phone number";
      if (!v.consent) e.consent = "Please confirm so we can pass your enquiry on";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (!validate(step)) return;
    if (i < steps.length - 1) {
      setI(i + 1);
      requestAnimationFrame(() => headingRef.current?.focus());
      return;
    }
    if (preview) {
      setServerError("This is a preview. Enquiries can be sent once the page is published.");
      return;
    }
    setServerError(null);
    start(async () => {
      const res = await submitEnquiry(data.slug, {
        name: v.name,
        email: v.email,
        phone: v.phone,
        preferred_contact: v.preferred_contact || undefined,
        category_code: v.category_code || undefined,
        description: v.description,
        location: v.location,
        postcode: v.postcode,
        // Only answers to questions for the chosen service are sent.
        answers: Object.fromEntries(Object.entries(v.answers).filter(([k]) => relevant.some((q) => q.key === k))),
        consent: true,
        consent_text: consentText(data.business.name),
        source: "landing_page",
        company_website: honeypot.current?.value ?? "",
        started_at: startedAt.current,
        requested_start: picked?.start,
        requested_type: picked?.type,
      });
      if (res.ok) {
        setDone({ reference: res.reference, duplicate: res.duplicate, requested: res.requested, bookingError: res.bookingError });
        onDone?.(res.reference);
      } else setServerError(res.error);
    });
  };

  if (done) {
    return (
      <div className="flex flex-col items-start gap-3 p-6 sm:p-7" role="status" aria-live="polite">
        <CircleCheck className="size-8 text-green-ink" aria-hidden />
        <h3 className="type-subhead">{done.duplicate ? "We already have this enquiry." : "Thanks, your enquiry is in."}</h3>
        <p className="type-body text-ink-2">
          {data.business.name} will review the details and get back to you. Your reference is{" "}
          <strong className="font-medium tabular text-ink">{done.reference}</strong>.
        </p>
        {done.requested ? (
          <p className="rounded-xl bg-blue-soft px-3 py-2 text-[14px] text-blue">
            You asked for{" "}
            <strong className="font-medium">
              {new Intl.DateTimeFormat("en-US", { timeZone: data.business.timezone, weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit" }).format(new Date(done.requested))}
            </strong>
            . {data.business.name} will confirm it with you.
          </p>
        ) : null}
        {done.bookingError ? <p className="text-[13px] text-amber-ink">{done.bookingError}</p> : null}
        <p className="text-[13px] text-ink-3">This isn't a booking until {data.business.name} confirms it with you.</p>
      </div>
    );
  }

  const progress = ((i + 1) / steps.length) * 100;
  const titles: Record<Step, string> = {
    project: "What do you need?",
    details: chunks.length > 1 && stepId !== "details-0" ? "A couple more" : "A few details",
    location: "Where is it?",
    time: "When suits you?",
    contact: "How can we reach you?",
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        next();
      }}
      noValidate
      className="flex flex-col"
    >
      <div className="h-1 overflow-hidden rounded-t-[inherit] bg-surface-2" aria-hidden>
        <div className="h-full bg-blue transition-[width] duration-300 [transition-timing-function:var(--ease-out)]" style={{ width: `${progress}%` }} />
      </div>
      <div className="grid gap-5 p-6 sm:p-7">
        <div>
          <p className="text-[12px] font-medium text-ink-3">
            Step {i + 1}
            {v.category_code || data.services.length < 2 ? ` of ${steps.length}` : ""}
          </p>
          <h3 ref={headingRef} tabIndex={-1} className="type-subhead mt-1 outline-none">
            {titles[step]}
          </h3>
        </div>

        {step === "project" && (
          <>
            {data.services.length > 1 ? (
              <fieldset>
                <legend className="text-[13px] font-medium text-ink-2">Service</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {data.services.map((s) => (
                    <Chip key={s.code} name="category_code" checked={v.category_code === s.code} onChange={() => set("category_code", s.code)}>
                      {s.name}
                    </Chip>
                  ))}
                </div>
                {errors.category_code ? <Err>{errors.category_code}</Err> : null}
              </fieldset>
            ) : null}
            <Field label="Describe the project" htmlFor="description" error={errors.description} hint="A sentence or two is plenty.">
              <Textarea id="description" rows={3} value={v.description} onChange={(e) => set("description", e.target.value)} aria-invalid={errors.description ? true : undefined} />
            </Field>
          </>
        )}

        {step === "details" &&
          stepQuestions.map((q) => (
            <fieldset key={q.key}>
              <legend className="text-[13px] font-medium text-ink-2">
                {q.label}
                {!q.required ? <span className="font-normal text-ink-3"> (optional)</span> : null}
              </legend>
              {q.kind === "select" || q.kind === "yes_no" ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {(q.kind === "yes_no" ? ["Yes", "No", "Not sure"] : q.options).map((o) => (
                    <Chip key={o} name={q.key} checked={v.answers[q.key] === o} onChange={() => set("answers", { ...v.answers, [q.key]: o })}>
                      {o}
                    </Chip>
                  ))}
                </div>
              ) : (
                <Input
                  className="mt-2"
                  type={q.kind === "date" ? "date" : "text"}
                  aria-label={q.label}
                  value={v.answers[q.key] ?? ""}
                  onChange={(e) => set("answers", { ...v.answers, [q.key]: e.target.value })}
                />
              )}
              {errors[`q_${q.key}`] ? <Err>{errors[`q_${q.key}`]}</Err> : null}
            </fieldset>
          ))}

        {step === "location" && (
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_120px]">
            <Field label="Suburb or address" htmlFor="location" error={errors.location}>
              <Input id="location" autoComplete="address-level2" value={v.location} onChange={(e) => set("location", e.target.value)} aria-invalid={errors.location ? true : undefined} />
            </Field>
            <Field label="Postcode" htmlFor="postcode" optional>
              <Input id="postcode" inputMode="numeric" autoComplete="postal-code" value={v.postcode} onChange={(e) => set("postcode", e.target.value)} />
            </Field>
          </div>
        )}

        {step === "time" && avail?.slots ? (
          <TimePicker slots={avail.slots} timezone={avail.timezone ?? data.business.timezone} minutes={avail.minutes ?? 60} types={avail.types ?? ["phone", "site_visit"]} value={picked} onChange={setPicked} day={day} setDay={setDay} />
        ) : null}

        {step === "contact" && (
          <>
            <Field label="Your name" htmlFor="name" error={errors.name}>
              <Input id="name" autoComplete="name" value={v.name} onChange={(e) => set("name", e.target.value)} aria-invalid={errors.name ? true : undefined} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Email" htmlFor="email" error={errors.email}>
                <Input id="email" type="email" autoComplete="email" value={v.email} onChange={(e) => set("email", e.target.value)} aria-invalid={errors.email ? true : undefined} />
              </Field>
              <Field label="Phone" htmlFor="phone" error={errors.phone} optional={Boolean(v.email)}>
                <Input id="phone" type="tel" autoComplete="tel" value={v.phone} onChange={(e) => set("phone", e.target.value)} aria-invalid={errors.phone ? true : undefined} />
              </Field>
            </div>
            <fieldset>
              <legend className="text-[13px] font-medium text-ink-2">
                Best way to reach you <span className="font-normal text-ink-3">(optional)</span>
              </legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {(
                  [
                    ["email", "Email"],
                    ["phone", "Phone call"],
                    ["sms", "Text"],
                    ["any", "Any"],
                  ] as const
                ).map(([k, l]) => (
                  <Chip key={k} name="preferred_contact" checked={v.preferred_contact === k} onChange={() => set("preferred_contact", k)}>
                    {l}
                  </Chip>
                ))}
              </div>
            </fieldset>
            <div>
              <label className="flex gap-3 text-[14px] leading-snug text-ink-2">
                <Checkbox checked={v.consent} onChange={(e) => set("consent", e.target.checked)} aria-invalid={errors.consent ? true : undefined} />
                <span>{consentText(data.business.name)}</span>
              </label>
              {errors.consent ? <Err>{errors.consent}</Err> : null}
            </div>
          </>
        )}

        <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label htmlFor="company_website">Company website</label>
          <input id="company_website" ref={honeypot} tabIndex={-1} autoComplete="off" />
        </div>

        {serverError ? <Notice tone={preview ? "blue" : "red"}>{serverError}</Notice> : null}

        <div className="flex items-center gap-3">
          {i > 0 ? (
            <Button variant="ghost" onClick={() => setI(i - 1)} aria-label="Previous step">
              <ArrowLeft className="size-4" aria-hidden /> Back
            </Button>
          ) : null}
          <Button type="submit" size="lg" className="flex-1" pending={pending}>
            {i < steps.length - 1 ? "Continue" : data.content.cta || "Send enquiry"}
          </Button>
        </div>
        {i === 0 ? <p className="text-center text-[12px] text-ink-3">Takes about a minute. “Not sure” is always fine.</p> : null}
      </div>
    </form>
  );
}

function Chip({ name, checked, onChange, children }: { name: string; checked: boolean; onChange: () => void; children: React.ReactNode }) {
  return (
    <label
      className={cn(
        "pressable inline-flex min-h-10 cursor-pointer items-center rounded-full border px-4 text-[14px] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus",
        checked ? "border-blue bg-blue-soft font-medium text-blue" : "border-line-strong text-ink-2 hover:border-ink-3",
      )}
    >
      <input type="radio" name={name} className="sr-only" checked={checked} onChange={onChange} />
      {children}
    </label>
  );
}

function Err({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-1.5 text-[13px] text-red-ink" role="alert">
      {children}
    </p>
  );
}
