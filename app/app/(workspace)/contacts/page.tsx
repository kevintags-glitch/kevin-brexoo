import type { Metadata } from "next";
import Link from "next/link";
import { EllipsisVertical, FileDown, PencilLine, Users } from "lucide-react";
import { Page } from "@/components/app/PageHeader";
import { AvatarStack, DataTable, Pagination } from "@/components/app/dash";
import { FilterBar } from "@/components/app/dash/FilterBar";
import { Avatar, EmptyState } from "@/components/ui";
import { requireOrg } from "@/lib/auth/session";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Contacts" };

const PAGE_SIZE = 20;
const SOURCE: Record<string, string> = { landing_page: "Landing page", visitor_chat: "Website chat", manual: "Added manually", import: "Import" };

export default async function ContactsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 80).replace(/[%,()]/g, " ");
  const status = sp.status ?? "";
  const source = sp.source ?? "";
  const page = Math.max(1, Number(sp.page) || 1);
  const { supabase, org, isOwner } = await requireOrg();

  let query = supabase
    .from("contacts")
    .select("id, full_name, email, phone, source, do_not_contact, created_at, projects(location_text, created_at), opportunities(stage)", { count: "exact" })
    .eq("organization_id", org.id)
    .is("merged_into", null)
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (q) query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`);
  if (status === "dnc") query = query.eq("do_not_contact", true);
  if (status === "contactable") query = query.eq("do_not_contact", false);
  if (source && SOURCE[source]) query = query.eq("source", source as "landing_page");

  const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const [{ data, count }, summary] = await Promise.all([
    query,
    supabase.from("contacts").select("full_name, do_not_contact, created_at, opportunities(stage)").eq("organization_id", org.id).is("merged_into", null).order("created_at", { ascending: false }).limit(2000),
  ]);
  const S = summary.data ?? [];
  const open = (c: (typeof S)[number]) => (c.opportunities ?? []).some((o) => !["won", "lost"].includes(o.stage));
  const cards = [
    { label: "Total contacts", n: S.length, week: S.filter((c) => c.created_at >= weekAgo).length, people: S.map((c) => c.full_name), href: "/app/contacts" },
    { label: "With open opportunities", n: S.filter(open).length, week: S.filter((c) => open(c) && c.created_at >= weekAgo).length, people: S.filter(open).map((c) => c.full_name), href: "/app/pipeline" },
    { label: "Do not contact", n: S.filter((c) => c.do_not_contact).length, week: null, people: S.filter((c) => c.do_not_contact).map((c) => c.full_name), href: "/app/contacts?status=dnc" },
  ];
  const qs = (extra: Record<string, string>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...sp, ...extra })) if (v) p.set(k, v);
    return `/app/contacts?${p.toString()}`;
  };

  return (
    <Page wide className="grid gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[26px] font-medium tracking-[-0.02em] sm:text-[28px]">Contacts</h1>
          <p className="text-[14px] text-ink-3">People and businesses who&apos;ve enquired or that you&apos;ve added. Private to your organisation.</p>
        </div>
        {isOwner ? (
          <a href={`/app/contacts/export?${new URLSearchParams(Object.entries({ q, status, source }).filter(([, v]) => v)).toString()}`} className="pressable inline-flex h-10 items-center gap-2 self-start rounded-xl bg-[#0b2347] px-4 text-[14px] font-medium text-white hover:bg-[#06326a] dark:bg-blue dark:text-on-blue sm:self-auto">
            <FileDown className="size-4" aria-hidden /> Export data
          </a>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="pressable rounded-2xl border border-line bg-surface p-5 shadow-xs hover:border-line-strong">
            <p className="text-[14px] font-medium text-ink-2">{c.label}</p>
            <p className="mt-3 font-display text-[36px] font-medium leading-none tracking-tight tabular">{c.n.toLocaleString("en-AU")}</p>
            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-[12px] text-ink-3">
                {c.week !== null ? <span className="rounded-full bg-green-soft px-2 py-0.5 text-[11px] font-semibold text-green-ink">+{c.week}</span> : null}
                {c.week !== null ? "this week" : "blocked from outreach"}
              </span>
              <AvatarStack names={c.people} max={3} />
            </div>
          </Link>
        ))}
      </div>

      <section className="overflow-hidden rounded-2xl border border-line bg-surface shadow-xs">
        <FilterBar
          search={{ name: "q", label: "Search", placeholder: "Name, email or phone" }}
          filters={[
            { name: "status", label: "Status", options: [{ value: "", label: "All contacts" }, { value: "contactable", label: "Contactable" }, { value: "dnc", label: "Do not contact" }] },
            { name: "source", label: "Source", options: [{ value: "", label: "All sources" }, ...Object.entries(SOURCE).map(([value, label]) => ({ value, label }))] },
          ]}
        />
        {data?.length ? (
          <>
            <div className="border-t border-line">
              <DataTable minWidth={900} head={[{ label: "Contact" }, { label: "Phone" }, { label: "Email" }, { label: "Location" }, { label: "Added" }, { label: "Status" }, { label: "Action", className: "text-right" }]}>
                {data.map((c) => {
                  const loc = [...(c.projects ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at))[0]?.location_text;
                  return (
                    <tr key={c.id} className="group hover:bg-surface-2/50">
                      <td className="py-3 pl-5 pr-4">
                        <Link href={`/app/contacts/${c.id}`} className="flex items-center gap-3 font-medium">
                          <Avatar name={c.full_name} className="size-8" />
                          <span className="min-w-0">
                            <span className="block truncate group-hover:text-blue">{c.full_name}</span>
                            <span className="block text-[12px] font-normal text-ink-3">{SOURCE[c.source] ?? c.source}</span>
                          </span>
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-[13px] tabular">{c.phone ?? "—"}</td>
                      <td className="px-4 py-3 text-[13px]">
                        <span className="block max-w-[220px] truncate">{c.email ?? "—"}</span>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-ink-2">
                        <span className="block max-w-[180px] truncate">{loc ?? "—"}</span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-[13px] tabular text-ink-2">{formatDate(c.created_at, org.timezone)}</td>
                      <td className="px-4 py-3 text-[13px] font-medium">{c.do_not_contact ? <span className="text-red-ink">Do not contact</span> : <span className="text-green-ink">Contactable</span>}</td>
                      <td className="py-3 pl-4 pr-5">
                        <div className="flex justify-end gap-1">
                          <Link href={`/app/contacts/${c.id}`} className="grid size-8 place-items-center rounded-lg text-ink-3 hover:bg-surface-2 hover:text-ink" aria-label={`Open ${c.full_name}`}>
                            <PencilLine className="size-4" />
                          </Link>
                          <Link href={`/app/contacts/${c.id}`} className="grid size-8 place-items-center rounded-lg text-ink-3 hover:bg-surface-2 hover:text-ink" aria-label={`More for ${c.full_name}`}>
                            <EllipsisVertical className="size-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </DataTable>
            </div>
            <div className="border-t border-line">
              <Pagination page={page} pageSize={PAGE_SIZE} total={count ?? 0} noun={count === 1 ? "contact" : "contacts"} hrefFor={(p) => qs({ page: String(p) })} />
            </div>
          </>
        ) : (
          <div className="border-t border-line">
            <EmptyState icon={<Users />} title={q || status || source ? "No matches" : "No contacts yet"} description={q || status || source ? "Try another search or clear a filter." : "Contacts are created automatically from enquiries."} />
          </div>
        )}
      </section>
    </Page>
  );
}
