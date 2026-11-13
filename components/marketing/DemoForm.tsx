"use client";
import { useActionState } from "react";
import { CircleCheck } from "lucide-react";
import { INDUSTRY_TEMPLATES } from "@/config/industry-templates";
import { requestDemo, type DemoState } from "@/features/marketing/actions";
import { Button, Checkbox, Field, Input, Notice, Select, Textarea } from "@/components/ui";

export function DemoForm() {
  const [state, action, pending] = useActionState<DemoState, FormData>(requestDemo, {});
  const fe = state.fieldErrors ?? {};

  if (state.ok) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-line bg-surface p-8 shadow-sm" role="status">
        <CircleCheck className="size-7 text-green-ink" aria-hidden />
        <h2 className="text-2xl font-bold">Thanks, we've got your request.</h2>
        <p className="text-[15px] text-ink-2">We'll email you to arrange a time. Nothing else is needed from you right now.</p>
      </div>
    );
  }

  const err = (k: string) => (fe[k] ? { "aria-invalid": true as const, "aria-describedby": `${k}-error` } : {});

  return (
    <form action={action} className="grid gap-5 rounded-2xl border border-line bg-surface p-6 shadow-sm sm:p-8" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Your name" htmlFor="name" error={fe.name}>
          <Input id="name" name="name" autoComplete="name" required {...err("name")} />
        </Field>
        <Field label="Work email" htmlFor="email" error={fe.email}>
          <Input id="email" name="email" type="email" autoComplete="email" required {...err("email")} />
        </Field>
        <Field label="Business name" htmlFor="company" optional>
          <Input id="company" name="company" autoComplete="organization" />
        </Field>
        <Field label="Team size" htmlFor="team_size" optional>
          <Select id="team_size" name="team_size" defaultValue="">
            <option value="">Select</option>
            {["Just me", "2–5", "6–15", "16+"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Main service" htmlFor="industry" optional>
        <Select id="industry" name="industry" defaultValue="">
          <option value="">Select your main service</option>
          {INDUSTRY_TEMPLATES.map((t) => (
            <option key={t.code} value={t.code}>
              {t.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="What would you like to see?" htmlFor="message" optional>
        <Textarea id="message" name="message" rows={3} />
      </Field>
      <div aria-hidden className="absolute -left-[9999px]">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <div>
        <label className="flex gap-3 text-[14px] text-ink-2">
          <Checkbox name="consent" aria-invalid={fe.consent ? true : undefined} aria-describedby={fe.consent ? "consent-error" : undefined} />
          <span>
            Brexoo may contact me about this request. See our{" "}
            <a href="/legal/privacy" className="text-blue underline underline-offset-2">
              privacy policy
            </a>
            .
          </span>
        </label>
        {fe.consent ? (
          <p id="consent-error" className="mt-1.5 text-[13px] text-red-ink" role="alert">
            {fe.consent}
          </p>
        ) : null}
      </div>
      {state.error ? <Notice tone="red">{state.error}</Notice> : null}
      <Button type="submit" size="lg" pending={pending}>
        Request a demo
      </Button>
    </form>
  );
}
