import type { Metadata } from "next";
import Link from "next/link";
import { Handshake, Repeat, Trophy, Wallet } from "lucide-react";
import { Page, PageHeader } from "@/components/app/PageHeader";
import { DataTable, Panel, PanelHeader, StatusPill } from "@/components/app/dash";
import { Avatar, ButtonLink, Card, EmptyState } from "@/components/ui";
import { getFitContext } from "@/features/crm/queries";
import { STAGE_BY_ID } from "@/features/crm/stages";
import { requireOrg } from "@/lib/auth/session";
import { formatDate, formatMoney } from "@/lib/format";

export const metadata: Metadata = { title: "Clients" };

type Client = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  jobs: number;
  value: number;
  lastWon: string;
  services: Set<string>;
  open: { id: string; title: string; stage: string }[];
};

/** Clients are contacts you've won work with: lifetime value, repeat work and what's open now. */
export default async function ClientsPage() {
  const ctx = await requireOrg();
  const { supabase, org } = ctx;
  const [{ data }, fc] = await Promise.all([
    supabase
      .from("opportunities")
      .select("id, title, stage, value_minor, closed_at, contact:contacts!inner(id, full_name, email, phone, merged_into), project:projects(category_code)")
      .eq("organization_id", org.id)
      .is("contact.merged_into", null)
      .order("closed_at", { ascending: false, nullsFirst: false })
      .limit(2000),
    getFitContext(ctx),
  ]);
  const opps = data ?? [];
  const serviceName = (code: string | null | undefined) => fc.orgServices.find((s) => s.code === code)?.name ?? null;

  const byContact = new Map<string, Client>();
  for (const o of opps) {
    if (o.stage !== "won" || !o.contact) continue;
    const c = byContact.get(o.contact.id) ?? { id: o.contact.id, name: o.contact.full_name, email: o.contact.email ? String(o.contact.email) : null, phone: o.contact.phone, jobs: 0, value: 0, lastWon: o.closed_at ?? "", services: new Set<string>(), open: [] };
    c.jobs += 1;
    c.value += o.value_minor ?? 0;
    if ((o.closed_at ?? "") > c.lastWon) c.lastWon = o.closed_at ?? "";
    const s = serviceName(o.project?.category_code);
    if (s) c.services.add(s);
    byContact.set(o.contact.id, c);
  }
  for (const o of opps) {
    const c = o.contact ? byContact.get(o.contact.id) : undefined;
    if (c && o.stage !== "won" && o.stage !== "lost") c.open.push({ id: o.id, title: o.title, stage: o.stage });
  }
  const clients = [...byContact.values()].sort((a, b) => b.value - a.value || b.jobs - a.jobs);
  const total = clients.reduce((s, c) => s + c.value, 0);
  const repeat = clients.filter((c) => c.jobs > 1).length;
  const openRepeat = clients.flatMap((c) => c.open.map((o) => ({ ...o, client: c.name })));
  const money = (v: number) => formatMoney(v, org.currency, { compact: v >= 1_000_000_00 });

  return (
    <Page wide className="grid gap-5">
      <PageHeader title="Clients" description="People and businesses you've won work with." actions={<ButtonLink href="/app/contacts" variant="secondary" size="sm">All contacts</ButtonLink>} />
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[
          { icon: Handshake, label: "Clients", value: clients.length.toLocaleString("en-US") },
          { icon: Wallet, label: "Won value", value: money(total) },
          { icon: Trophy, label: "Average job", value: clients.length ? money(Math.round(total / Math.max(1, clients.reduce((s, c) => s + c.jobs, 0)) / 100) * 100) : "—" },
          { icon: Repeat, label: "Repeat clients", value: `${repeat}${clients.length ? ` · ${Math.round((repeat / clients.length) * 100)}%` : ""}` },
        ].map(({ icon: Icon, label, value }) => (
          <Card key={label} className="p-5">
            <Icon className="size-5 text-ink-3" aria-hidden />
            <p className="mt-4 text-[13px] text-ink-3">{label}</p>
            <p className="type-subhead mt-1 tabular">{value}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)]">
        <Panel>
          <PanelHeader eyebrow="Client list" title={clients.length} />
          {clients.length ? (
            <div className="mt-3">
              <DataTable minWidth={640} head={[{ label: "Client" }, { label: "Services" }, { label: "Jobs", className: "text-right" }, { label: "Won value", className: "text-right" }, { label: "Last won", className: "text-right" }]}>
                {clients.map((c) => (
                  <tr key={c.id} className="hover:bg-surface-2/50">
                    <td className="py-3 pl-5 pr-4">
                      <Link href={`/app/contacts/${c.id}`} className="flex items-center gap-3">
                        <Avatar name={c.name} className="size-8" />
                        <span className="min-w-0">
                          <span className="block font-medium">{c.name}</span>
                          <span className="block max-w-[220px] truncate text-[12px] text-ink-3">{c.email ?? c.phone}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-ink-2">{[...c.services].join(", ") || "—"}</td>
                    <td className="px-4 py-3 text-right tabular">{c.jobs}</td>
                    <td className="px-4 py-3 text-right font-medium tabular">{money(c.value)}</td>
                    <td className="whitespace-nowrap py-3 pl-4 pr-5 text-right text-[12px] text-ink-3">{c.lastWon ? formatDate(c.lastWon, org.timezone) : "—"}</td>
                  </tr>
                ))}
              </DataTable>
            </div>
          ) : (
            <EmptyState icon={<Handshake />} title="No clients yet" description="When you mark an opportunity as won, its contact becomes a client here." action={<ButtonLink href="/app/pipeline" variant="secondary">Open pipeline</ButtonLink>} />
          )}
        </Panel>
        <Panel>
          <PanelHeader eyebrow="Repeat business" title={openRepeat.length} badge={<span className="text-[12px] text-ink-3">open with existing clients</span>} />
          <ul className="mt-3 divide-y divide-line border-t border-line">
            {openRepeat.length === 0 ? <li className="px-5 py-4 text-[14px] text-ink-3">No open work with existing clients. Past clients are often your best next project.</li> : null}
            {openRepeat.map((o) => {
              const st = STAGE_BY_ID[o.stage as keyof typeof STAGE_BY_ID];
              return (
                <li key={o.id}>
                  <Link href={`/app/opportunities/${o.id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-surface-2/50">
                    <span className="min-w-0">
                      <span className="block truncate text-[14px] font-medium">{o.title}</span>
                      <span className="block text-[12px] text-ink-3">{o.client}</span>
                    </span>
                    {st ? <StatusPill tone={st.tone}>{st.label}</StatusPill> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>
    </Page>
  );
}
