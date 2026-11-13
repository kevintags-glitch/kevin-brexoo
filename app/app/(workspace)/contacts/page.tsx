import type { Metadata } from "next";
import Link from "next/link";
import { Search, Users } from "lucide-react";
import { Page, PageHeader } from "@/components/app/PageHeader";
import { Avatar, Badge, Card, EmptyState, Input } from "@/components/ui";
import { requireOrg } from "@/lib/auth/session";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Contacts" };

export default async function ContactsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 80).replace(/[%,()]/g, " ");
  const { supabase, org } = await requireOrg();
  let query = supabase
    .from("contacts")
    .select("id, full_name, email, phone, source, do_not_contact, created_at, opportunities(count)")
    .eq("organization_id", org.id)
    .is("merged_into", null)
    .order("created_at", { ascending: false })
    .limit(200);
  if (q) query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`);
  const { data } = await query;
  const SOURCE: Record<string, string> = { landing_page: "Landing page", visitor_chat: "Website chat", manual: "Added manually", import: "Import" };

  return (
    <Page>
      <PageHeader title="Contacts" description="People and businesses who've enquired or you've added. Private to your organisation." className="mb-6" />
      <form className="relative mb-4 sm:w-80" role="search">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
        <Input name="q" defaultValue={q} placeholder="Search name, email or phone" aria-label="Search contacts" className="pl-9" />
      </form>
      <Card className="overflow-hidden">
        {data?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-[14px]">
              <thead className="border-b border-line bg-surface-2/50 text-[12px] text-ink-3">
                <tr>
                  <th scope="col" className="px-5 py-2.5 font-medium">Name</th>
                  <th scope="col" className="px-5 py-2.5 font-medium">Contact</th>
                  <th scope="col" className="px-5 py-2.5 font-medium">Source</th>
                  <th scope="col" className="px-5 py-2.5 text-right font-medium">Opportunities</th>
                  <th scope="col" className="px-5 py-2.5 text-right font-medium">Added</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.map((c) => (
                  <tr key={c.id} className="hover:bg-surface-2/50">
                    <td className="px-5 py-3">
                      <Link href={`/app/contacts/${c.id}`} className="flex items-center gap-3 font-medium hover:text-blue">
                        <Avatar name={c.full_name} />
                        {c.full_name}
                        {c.do_not_contact ? <Badge tone="red">DNC</Badge> : null}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-ink-2">
                      <div className="max-w-[260px] truncate">{c.email ?? c.phone}</div>
                    </td>
                    <td className="px-5 py-3 text-ink-3">{SOURCE[c.source] ?? c.source}</td>
                    <td className="px-5 py-3 text-right tabular">{c.opportunities?.[0]?.count ?? 0}</td>
                    <td className="px-5 py-3 text-right text-ink-3">{formatDate(c.created_at, org.timezone)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={<Users />} title={q ? "No matches" : "No contacts yet"} description={q ? "Try another search." : "Contacts are created automatically from enquiries."} />
        )}
      </Card>
    </Page>
  );
}
