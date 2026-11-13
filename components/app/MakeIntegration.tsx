"use client";
import { useActionState, useState, useTransition } from "react";
import { Copy, Eye, EyeOff, Send, Workflow } from "lucide-react";
import { Badge, Button, Card, CardHeader, Checkbox, Field, Input, Notice } from "@/components/ui";
import { removeMakeWebhook, saveMakeWebhook, sendMakeTest, setMakeEnabled, type IntegrationState } from "@/features/integrations/actions";

type Integration = { url: string; secret: string; events: string[]; enabled: boolean; last_delivery_at: string | null; last_status: string | null } | null;

const EVENTS = [
  { id: "enquiry.received", label: "New enquiry received", hint: "Reference, contact name, service and a link to the record" },
  { id: "appointment.booked", label: "Appointment booked", hint: "Type, start time and a link to the opportunity" },
  { id: "opportunity.won", label: "Opportunity won", hint: "Title, value and currency" },
];

export function MakeIntegration({ integration, isOwner, lastDelivery }: { integration: Integration; isOwner: boolean; lastDelivery: string | null }) {
  const [state, action, pending] = useActionState<IntegrationState, FormData>(saveMakeWebhook, {});
  const [other, setOther] = useState<IntegrationState>({});
  const [busy, start] = useTransition();
  const [show, setShow] = useState(false);
  const run = (fn: () => Promise<IntegrationState>) => start(async () => setOther(await fn()));
  const result = other.message || other.error ? other : state;

  return (
    <Card>
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            <Workflow className="size-4 text-blue" aria-hidden /> Make.com
            {integration ? <Badge tone={integration.enabled ? "green" : "neutral"} dot>{integration.enabled ? "Connected" : "Paused"}</Badge> : null}
          </span>
        }
        description="Send events to a Make.com scenario to notify your team in Slack, SMS, email or your other tools."
      />
      <div className="grid gap-5 p-5 pt-3">
        {!isOwner ? <Notice tone="amber">Only owners can view or change integrations.</Notice> : null}
        {isOwner ? (
          <form action={action} className="grid gap-5">
            <Field label="Webhook URL" htmlFor="url" hint="In Make, add a “Custom webhook” trigger and copy its address.">
              <Input key={state.url ?? integration?.url ?? ""} id="url" name="url" type="url" required defaultValue={state.url ?? integration?.url ?? ""} placeholder="https://hook.us1.make.com/…" autoComplete="off" spellCheck={false} />
            </Field>
            <fieldset className="grid gap-2.5">
              <legend className="mb-1 text-[13px] font-medium text-ink-2">Events to send</legend>
              {EVENTS.map((e) => (
                <label key={e.id} className="flex items-start gap-3 rounded-xl border border-line p-3 hover:bg-surface-2/50">
                  <Checkbox name="events" value={e.id} defaultChecked={integration ? integration.events.includes(e.id) : e.id !== "opportunity.won"} />
                  <span>
                    <span className="block text-[14px] font-medium">{e.label}</span>
                    <span className="block text-[13px] text-ink-3">{e.hint}</span>
                  </span>
                </label>
              ))}
            </fieldset>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" pending={pending}>
                {integration ? "Save changes" : "Connect Make.com"}
              </Button>
              {integration ? (
                <>
                  <Button type="button" variant="secondary" pending={busy} onClick={() => run(sendMakeTest)}>
                    <Send className="size-4" aria-hidden /> Send test event
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => run(() => setMakeEnabled(!integration.enabled))}>
                    {integration.enabled ? "Pause" : "Resume"}
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => {
                      if (window.confirm("Remove the Make.com integration? Events will stop being sent.")) run(removeMakeWebhook);
                    }}
                  >
                    Remove
                  </Button>
                </>
              ) : null}
            </div>
          </form>
        ) : null}

        {result.message ? <Notice tone="green">{result.message}</Notice> : null}
        {result.error ? <Notice tone="red">{result.error}</Notice> : null}

        {integration && isOwner ? (
          <div className="grid gap-3 rounded-xl border border-line bg-surface-2/50 p-4">
            <div>
              <p className="text-[13px] font-medium text-ink-2">Signing secret</p>
              <p className="text-[12px] text-ink-3">Each request carries an <code>X-Brexoo-Signature: sha256=…</code> header, an HMAC of the body with this secret.</p>
              <div className="mt-2 flex items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded-lg border border-line bg-surface px-3 py-2 text-[12px]">{show ? integration.secret : "•".repeat(32)}</code>
                <Button type="button" size="sm" variant="ghost" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide secret" : "Show secret"}>
                  {show ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => navigator.clipboard?.writeText(integration.secret)} aria-label="Copy secret">
                  <Copy className="size-4" aria-hidden />
                </Button>
              </div>
            </div>
            <p className="text-[13px] text-ink-3">
              Last delivery: {lastDelivery ? `${lastDelivery} · ${integration.last_status ?? ""}` : "nothing sent yet"}
            </p>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
