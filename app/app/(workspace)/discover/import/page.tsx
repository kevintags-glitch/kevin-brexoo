import type { Metadata } from "next";
import Link from "next/link";
import { Page, PageHeader } from "@/components/app/PageHeader";
import { SourceForm, UploadForm } from "@/components/app/discover/ImportForms";
import { DataTable, StatusPill } from "@/components/app/dash";
import { Card, CardHeader, Notice } from "@/components/ui";
import { requireOrg } from "@/lib/auth/session";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Project sources" };

const TYPE: Record<string, string> = { customer_provided: "Customer-provided", public: "Public register", licensed: "Licensed", partner: "Partner" };

export default async function ImportPage() {
  const { supabase, org, isOwner } = await requireOrg();
  const { data: sources } = await supabase.from("discovery_sources").select("*, project_records(count)").eq("organization_id", org.id).order("created_at");
  return (
    <Page className="grid gap-6">
      <PageHeader eyebrow={<Link href="/app/discover" className="hover:text-ink">Discover</Link>} title="Project sources" description="Register each data source with what you're allowed to do with it, then import its records." />
      <Notice tone="blue" title="Only use data you have the right to use">
        Every source needs a documented permitted use (blueprint §8.1). Records stay private to your business, keep their source and dates, and contacts marked “not permitted” are never added to your CRM.
      </Notice>
      {!isOwner ? <Notice tone="amber">Only an owner can add sources or import records.</Notice> : null}
      <Card>
        <CardHeader title="Registered sources" />
        {sources?.length ? (
          <div className="mt-3">
            <DataTable minWidth={680} head={[{ label: "Source" }, { label: "Type" }, { label: "Permitted use" }, { label: "Records", className: "text-right" }, { label: "Added" }]}>
              {sources.map((s) => (
                <tr key={s.id}>
                  <td className="py-3 pl-5 pr-4 font-medium">{s.name}</td>
                  <td className="px-4 py-3">
                    <StatusPill tone={s.source_type === "customer_provided" ? "teal" : "blue"}>{TYPE[s.source_type]}</StatusPill>
                  </td>
                  <td className="max-w-[320px] px-4 py-3 text-[13px] text-ink-2">{s.permitted_use}</td>
                  <td className="px-4 py-3 text-right tabular">{s.project_records?.[0]?.count ?? 0}</td>
                  <td className="whitespace-nowrap py-3 pl-4 pr-5 text-[13px] text-ink-3">{formatDate(s.created_at, org.timezone)}</td>
                </tr>
              ))}
            </DataTable>
          </div>
        ) : (
          <p className="px-5 pb-5 pt-3 text-[14px] text-ink-3">No sources yet.</p>
        )}
      </Card>
      {isOwner ? (
        <>
          <Card>
            <CardHeader title="Import records" description="CSV with columns: external_id, title and optionally description, category, location, postcode, stage, estimated_value, timeline, observed_at, source_url, contact_name, contact_email, contact_phone, contact_permission." />
            <div className="p-5">
              <UploadForm sources={(sources ?? []).map((s) => ({ id: s.id, name: s.name }))} />
            </div>
          </Card>
          <Card>
            <CardHeader title="Add a source" />
            <div className="p-5">
              <SourceForm />
            </div>
          </Card>
        </>
      ) : null}
    </Page>
  );
}
