"use client";
import { useActionState, useState, useTransition } from "react";
import { Check, Copy } from "lucide-react";
import { changeRole, inviteMember, removeMember, revokeInvitation, type FormState } from "@/features/workspace/actions";
import { Avatar, Badge, Button, Field, Input, Notice, Select } from "@/components/ui";

type Member = { id: string; name: string; email: string; role: "owner" | "member" };
type Invite = { id: string; email: string; role: string; expires_at: string; token: string };

export function TeamManager({ members, invites, isOwner, me, siteUrl }: { members: Member[]; invites: Invite[]; isOwner: boolean; me: string; siteUrl: string }) {
  const [state, action, pending] = useActionState<FormState & { link?: string }, FormData>(inviteMember, {});
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, start] = useTransition();
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(text);
  };
  return (
    <div className="grid gap-6">
      <ul className="divide-y divide-line rounded-2xl border border-line bg-surface">
        {members.map((m) => (
          <li key={m.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
            <Avatar name={m.name} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-medium">
                {m.name} {m.id === me ? <span className="font-normal text-ink-3">(you)</span> : null}
              </p>
              <p className="truncate text-[13px] text-ink-3">{m.email}</p>
            </div>
            {isOwner ? (
              <Select aria-label={`Role for ${m.name}`} value={m.role} disabled={busy} onChange={(e) => start(async () => setMsg((await changeRole(m.id, e.target.value as Member["role"])).error ?? null))} className="w-32">
                <option value="owner">Owner</option>
                <option value="member">Member</option>
              </Select>
            ) : (
              <Badge tone={m.role === "owner" ? "blue" : "neutral"}>{m.role === "owner" ? "Owner" : "Member"}</Badge>
            )}
            {isOwner || m.id === me ? (
              <Button variant="ghost" size="sm" disabled={busy} onClick={() => confirm(m.id === me ? "Leave this organisation?" : `Remove ${m.name}?`) && start(async () => setMsg((await removeMember(m.id)).error ?? null))}>
                {m.id === me ? "Leave" : "Remove"}
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
      {msg ? <Notice tone="red">{msg}</Notice> : null}

      {invites.length ? (
        <div>
          <h3 className="mb-2 font-sans text-[14px] font-semibold tracking-normal">Pending invitations</h3>
          <ul className="divide-y divide-line rounded-2xl border border-line bg-surface">
            {invites.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-[14px]">
                <span className="min-w-0 flex-1 truncate">{i.email}</span>
                <Badge>{i.role === "owner" ? "Owner" : "Member"}</Badge>
                {isOwner ? (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => copy(`${siteUrl}/invite/${i.token}`)}>
                      {copied === `${siteUrl}/invite/${i.token}` ? <Check className="size-4" /> : <Copy className="size-4" />} Copy link
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => start(() => revokeInvitation(i.id))}>
                      Revoke
                    </Button>
                  </>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {isOwner ? (
        <form action={action} className="rounded-2xl border border-line bg-surface p-5" noValidate>
          <h3 className="font-sans text-[15px] font-semibold tracking-normal">Invite a teammate</h3>
          <p className="mt-0.5 text-[13px] text-ink-3">Members can work enquiries and pages. Owners can also approve, publish and manage the team.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_160px_auto] sm:items-end">
            <Field label="Email" htmlFor="invite_email" error={state.fieldErrors?.email}>
              <Input id="invite_email" name="email" type="email" required />
            </Field>
            <Field label="Role" htmlFor="invite_role">
              <Select id="invite_role" name="role" defaultValue="member">
                <option value="member">Member</option>
                <option value="owner">Owner</option>
              </Select>
            </Field>
            <Button type="submit" pending={pending}>
              Create invite
            </Button>
          </div>
          {state.error ? <Notice tone="red" className="mt-4">{state.error}</Notice> : null}
          {state.link ? (
            <Notice tone="green" className="mt-4" title={state.message}>
              <span className="mt-1 flex items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded bg-surface px-2 py-1 text-[12px] text-ink">{state.link}</code>
                <Button size="sm" variant="secondary" onClick={() => copy(state.link!)}>
                  {copied === state.link ? "Copied" : "Copy"}
                </Button>
              </span>
            </Notice>
          ) : null}
        </form>
      ) : null}
    </div>
  );
}
