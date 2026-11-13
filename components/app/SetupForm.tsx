"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { createOrganization, type FormState } from "@/features/workspace/actions";
import { Button, Field, Input, Notice, Select } from "@/components/ui";
import { slugify } from "@/lib/format";
import { COUNTRIES } from "@/lib/timezones";

export function SetupForm({ siteHost, zones }: { siteHost: string; zones: string[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(createOrganization, {});
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [country, setCountry] = useState("AU");
  const tzRef = useRef<HTMLSelectElement>(null);

  // Preselect the browser's time zone after hydration (uncontrolled, so no re-render needed).
  useEffect(() => {
    const local = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tzRef.current && local && zones.includes(local)) tzRef.current.value = local;
  }, [zones]);

  const currency = COUNTRIES.find((c) => c.code === country)?.currency ?? "AUD";
  const fe = state.fieldErrors;

  return (
    <form action={action} className="grid gap-5" noValidate>
      <Field label="Business name" htmlFor="name" error={fe?.name}>
        <Input
          id="name"
          name="name"
          required
          autoFocus
          autoComplete="organization"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (!slugTouched) setSlug(slugify(e.target.value));
          }}
          aria-invalid={fe?.name ? true : undefined}
        />
      </Field>
      <Field label="Page address" htmlFor="slug" error={fe?.slug} hint={`${siteHost}/p/${slug || "your-business"}`}>
        <Input
          id="slug"
          name="slug"
          required
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(slugify(e.target.value));
          }}
          aria-invalid={fe?.slug ? true : undefined}
          aria-describedby={fe?.slug ? "slug-error" : "slug-hint"}
        />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Country" htmlFor="country">
          <Select id="country" name="country" value={country} onChange={(e) => setCountry(e.target.value)}>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Time zone" htmlFor="timezone">
          <Select id="timezone" name="timezone" defaultValue="Australia/Sydney" ref={tzRef}>
            {zones.map((z) => (
              <option key={z} value={z}>
                {z.replaceAll("_", " ")}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <input type="hidden" name="currency" value={currency} />
      {state.error ? <Notice tone="red">{state.error}</Notice> : null}
      <Button type="submit" size="lg" pending={pending}>
        Create organisation
      </Button>
    </form>
  );
}
