import type { Metadata } from "next";
import { Page, PageHeader } from "@/components/app/PageHeader";
import { Card, CardHeader } from "@/components/ui";
import { LOSS_REASONS, STAGES } from "@/features/crm/stages";
import { requireOrg } from "@/lib/auth/session";
import { formatMoney } from "@/lib/format";

export const metadata: Metadata = { title: "Reports" };

function median(xs: number[]) {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
}

function duration(mins: number | null) {
  if (mins === null) return "—";
  if (mins < 60) return `${Math.round(mins)} min`;
  if (mins < 48 * 60) return `${(mins / 60).toFixed(1)} h`;
  return `${(mins / 1440).toFixed(1)} days`;
}

const pct = (n: number, d: number) => (d ? `${Math.round((n / d) * 100)}%` : "—");

export default async function ReportsPage() {
  const { supabase, org } = await requireOrg();
  const since = new Date(Date.now() - 12 * 7 * 86_400_000).toISOString();
  const [enq, opps, appts, services] = await Promise.all([
    supabase.from("enquiries").select("received_at, first_response_at, status, source, project:projects(category_code)").eq("organization_id", org.id).gte("received_at", since),
    supabase.from("opportunities").select("stage, value_minor, loss_reason, created_at, project:projects(category_code)").eq("organization_id", org.id),
    supabase.from("appointments").select("status, starts_at").eq("organization_id", org.id),
    supabase.from("org_services").select("category_code, category:service_categories(name)").eq("organization_id", org.id),
  ]);
  const E = enq.data ?? [];
  const O = opps.data ?? [];
  const A = appts.data ?? [];

  // Weekly enquiries, last 12 weeks (org time zone is close enough at week granularity).
  const weeks = Array.from({ length: 12 }, (_, i) => {
    const end = Date.now() - (11 - i) * 7 * 86_400_000;
    const start = end - 7 * 86_400_000;
    return { label: new Intl.DateTimeFormat("en-AU", { timeZone: org.timezone, day: "numeric", month: "short" }).format(new Date(start)), n: E.filter((e) => +new Date(e.received_at) >= start && +new Date(e.received_at) < end).length };
  });
  const maxWeek = Math.max(1, ...weeks.map((w) => w.n));

  const responseMins = E.filter((e) => e.first_response_at).map((e) => (+new Date(e.first_response_at!) - +new Date(e.received_at)) / 60_000);
  const reviewed = E.filter((e) => e.status !== "unreviewed").length;
  const qualified = E.filter((e) => e.status === "qualified").length;
  const won = O.filter((o) => o.stage === "won");
  const lost = O.filter((o) => o.stage === "lost");
  const due = A.filter((a) => +new Date(a.starts_at) < Date.now() && a.status !== "cancelled" && a.status !== "rescheduled");
  const attended = due.filter((a) => a.status === "attended").length;

  const stats = [
    { label: "Median first response", value: duration(median(responseMins)), sub: `${responseMins.length} responded, last 12 weeks` },
    { label: "Qualification rate", value: pct(qualified, reviewed), sub: `${qualified} of ${reviewed} reviewed` },
    { label: "Show rate", value: pct(attended, due.length), sub: `${attended} of ${due.length} appointments due` },
    { label: "Win rate", value: pct(won.length, won.length + lost.length), sub: `${won.length} won · ${lost.length} lost` },
  ];
  const maxStage = Math.max(1, ...STAGES.map((s) => O.filter((o) => o.stage === s.id).length));
  const svcRows = (services.data ?? []).map((s) => {
    const os = O.filter((o) => o.project?.category_code === s.category_code);
    const w = os.filter((o) => o.stage === "won");
    const l = os.filter((o) => o.stage === "lost");
    return { name: s.category?.name ?? s.category_code, total: os.length, won: w.length, rate: pct(w.length, w.length + l.length), value: w.reduce((sum, o) => sum + (o.value_minor ?? 0), 0) };
  });

  return (
    <Page wide>
      <PageHeader title="Reports" description="Measured on response, qualification and outcomes, not raw lead volume." className="mb-6" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-[13px] text-ink-3">{s.label}</p>
            <p className="type-section mt-2 tabular">{s.value}</p>
            <p className="mt-1.5 text-[12px] text-ink-3">{s.sub}</p>
          </Card>
        ))}
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Enquiries per week" description="Last 12 weeks" />
          <div className="px-5 pb-5 pt-6">
            <div className="flex h-44 items-end gap-1.5" role="img" aria-label={`Weekly enquiries: ${weeks.map((w) => `${w.label} ${w.n}`).join(", ")}`}>
              {weeks.map((w, i) => (
                <div key={i} className="flex h-full flex-1 flex-col justify-end gap-1">
                  <span className="text-center text-[11px] tabular text-ink-3">{w.n || ""}</span>
                  <div className="rounded-t-[4px] bg-blue/85" style={{ height: `${(w.n / maxWeek) * 100}%`, minHeight: w.n ? 4 : 1, opacity: w.n ? 1 : 0.2 }} />
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between text-[11px] text-ink-3">
              <span>{weeks[0]!.label}</span>
              <span>{weeks[11]!.label}</span>
            </div>
          </div>
        </Card>
        <Card>
          <CardHeader title="Pipeline by stage" description="All opportunities" />
          <ul className="grid gap-2.5 px-5 pb-5 pt-5">
            {STAGES.map((s) => {
              const n = O.filter((o) => o.stage === s.id).length;
              return (
                <li key={s.id} className="grid grid-cols-[150px_minmax(0,1fr)_32px] items-center gap-3 text-[13px]">
                  <span className="truncate text-ink-2">{s.label}</span>
                  <span className="h-2 overflow-hidden rounded-full bg-surface-2">
                    <span className={`block h-full rounded-full ${s.id === "lost" ? "bg-ink-3/40" : s.id === "won" ? "bg-teal" : "bg-blue/80"}`} style={{ width: `${(n / maxStage) * 100}%` }} />
                  </span>
                  <span className="text-right tabular">{n}</span>
                </li>
              );
            })}
          </ul>
        </Card>
        <Card>
          <CardHeader title="By service" />
          <div className="overflow-x-auto px-5 pb-5 pt-3">
            <table className="w-full text-left text-[13px]">
              <thead className="text-[12px] text-ink-3">
                <tr>
                  <th scope="col" className="py-2 font-medium">Service</th>
                  <th scope="col" className="py-2 text-right font-medium">Opportunities</th>
                  <th scope="col" className="py-2 text-right font-medium">Won</th>
                  <th scope="col" className="py-2 text-right font-medium">Win rate</th>
                  <th scope="col" className="py-2 text-right font-medium">Won value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {svcRows.map((r) => (
                  <tr key={r.name}>
                    <td className="py-2.5">{r.name}</td>
                    <td className="py-2.5 text-right tabular">{r.total}</td>
                    <td className="py-2.5 text-right tabular">{r.won}</td>
                    <td className="py-2.5 text-right tabular">{r.rate}</td>
                    <td className="py-2.5 text-right tabular">{r.value ? formatMoney(r.value, org.currency, { compact: true }) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card>
          <CardHeader title="Why opportunities were lost" />
          <ul className="grid gap-2.5 px-5 pb-5 pt-5">
            {lost.length === 0 ? <li className="text-[14px] text-ink-3">No lost opportunities recorded.</li> : null}
            {LOSS_REASONS.map((r) => ({ r, n: lost.filter((o) => o.loss_reason === r.id).length }))
              .filter((x) => x.n)
              .sort((a, b) => b.n - a.n)
              .map(({ r, n }) => (
                <li key={r.id} className="flex items-center justify-between text-[14px]">
                  <span>{r.label}</span>
                  <span className="tabular text-ink-3">
                    {n} · {pct(n, lost.length)}
                  </span>
                </li>
              ))}
          </ul>
        </Card>
      </div>
    </Page>
  );
}
