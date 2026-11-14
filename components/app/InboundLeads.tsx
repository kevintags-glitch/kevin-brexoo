"use client";
import { useActionState, useState, useTransition } from "react";
import { Check, Copy, Download, Inbox } from "lucide-react";
import { Badge, Button, Card, CardHeader, Field, Notice, Select } from "@/components/ui";
import { createInboundKey, revokeInboundKey, type InboundState } from "@/features/collector/actions";

export type InboundKeyRow = { id: string; label: string; key_hint: string; created: string; lastUsed: string | null; revoked: boolean };

const SAMPLE = `{
  "name": "Mia Nguyen",
  "email": "mia@example.com",
  "phone": "0400 111 222",
  "message": "Granny flat at the back of our block",
  "suburb": "Merewether",
  "postcode": "2291",
  "consent": true,
  "consent_text": "I agree to be contacted about my enquiry.",
  "channel": "Facebook Lead Ads"
}`;

/**
 * Inbound leads: a private link per tool that Make.com (or any form tool) posts homeowner
 * enquiries to. They arrive in Leads like page enquiries, with a follow-up task and alert.
 */
export function InboundLeads({ keys, isOwner }: { keys: InboundKeyRow[]; isOwner: boolean }) {
  const [state, action, pending] = useActionState<InboundState, FormData>(createInboundKey, {});
  const [busy, start] = useTransition();
  const [copied, setCopied] = useState(false);
  const active = keys.filter((k) => !k.revoked);

  return (
    <Card>
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            <Inbox className="size-4 text-blue" aria-hidden /> Inbound leads
            {active.length ? <Badge tone="green" dot>{active.length} active</Badge> : null}
          </span>
        }
        description="Bring homeowner enquiries from Facebook Lead Ads, Google Forms, Hipages or any form into Brexoo through a Make.com scenario. Each one gets a follow-up task and an alert, like enquiries from your page."
      />
      <div className="grid gap-5 p-5 pt-3">
        {!isOwner ? <Notice tone="amber">Only owners can create or revoke inbound links.</Notice> : null}

        {isOwner ? (
          <form action={action} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <Field label="Leads come from" htmlFor="label">
              <Select id="label" name="label" defaultValue="Make.com">
                {["Make.com", "Facebook Lead Ads", "Google Forms", "Hipages", "Website form", "Other"].map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </Select>
            </Field>
            <Button type="submit" pending={pending}>Create inbound link</Button>
          </form>
        ) : null}

        {state.error ? <Notice tone="red">{state.error}</Notice> : null}
        {state.url ? (
          <Notice tone="green" title="Copy this link now">
            <span className="block">It&apos;s shown once. Paste it into the URL of an HTTP “Make a request” module (method POST, body type JSON).</span>
            <span className="mt-2 flex min-w-0 items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-md bg-white px-2 py-1.5 text-[12px] text-ink">{state.url}</code>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => {
                  void navigator.clipboard.writeText(state.url!);
                  setCopied(true);
                }}
              >
                {copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />} {copied ? "Copied" : "Copy"}
              </Button>
            </span>
          </Notice>
        ) : null}

        {keys.length ? (
          <ul className="divide-y divide-line rounded-xl border border-line">
            {keys.map((k) => (
              <li key={k.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-[14px]">
                <span className="min-w-0 flex-1">
                  <span className="font-medium">{k.label}</span> <span className="text-ink-3">· …{k.key_hint}</span>
                  <span className="block text-[12px] text-ink-3">
                    Created {k.created} · {k.lastUsed ? `last lead ${k.lastUsed}` : "no leads yet"}
                  </span>
                </span>
                {k.revoked ? (
                  <Badge>Revoked</Badge>
                ) : isOwner ? (
                  <Button size="sm" variant="ghost" disabled={busy} onClick={() => start(async () => void (await revokeInboundKey(k.id)))}>
                    Revoke
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}

        <details className="rounded-xl border border-line p-4 text-[14px]">
          <summary className="cursor-pointer py-1 font-medium">How to set it up in Make.com</summary>
          <ol className="mt-3 grid list-decimal gap-1.5 pl-5 text-ink-2">
            <li>Create a scenario whose trigger is your lead source (for example Facebook Lead Ads “Watch leads”).</li>
            <li>Add an HTTP “Make a request” module: method POST, the inbound link above as the URL, body type JSON.</li>
            <li>Map the fields below. Name, a message and an email or phone are required, and <code>consent</code> must be true.</li>
            <li>Run once and check the enquiry appears in Leads.</li>
          </ol>
          <pre className="mt-3 overflow-x-auto rounded-lg bg-surface-2 p-3 text-[12px] leading-relaxed">{SAMPLE}</pre>
          <a href="/templates/make-inbound-enquiry.json" download className="mt-3 inline-flex min-h-10 items-center gap-1.5 font-medium text-blue hover:underline">
            <Download className="size-4" aria-hidden /> Download the Make scenario blueprint
          </a>
        </details>
      </div>
    </Card>
  );
}
