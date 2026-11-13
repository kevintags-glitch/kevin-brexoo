import type { Metadata } from "next";
import { ButtonLink, Card, CardHeader } from "@/components/ui";
import { ONBOARDING_STATUS_LABEL, STEPS } from "@/features/onboarding/steps";
import { requireOrg } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { supabase, org } = await requireOrg();
  const { data: ob } = await supabase.from("onboarding").select("status").eq("organization_id", org.id).single();
  const rows = [
    ["Trading name", org.name],
    ["Page address", `/p/${org.slug}`],
    ["Contact person", org.contact_name ?? "—"],
    ["Phone", org.phone ?? "—"],
    ["Website", org.website ?? "—"],
    ["Time zone", org.timezone],
    ["Currency", org.currency],
    ["Setup status", ONBOARDING_STATUS_LABEL[ob?.status ?? "not_started"]],
  ];
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader title="Business" description="Details used across your workspace and pages." />
        <dl className="mt-3 divide-y divide-line">
          {rows.map(([k, v]) => (
            <div key={k} className="grid grid-cols-[160px_minmax(0,1fr)] gap-4 px-5 py-3 text-[14px]">
              <dt className="text-ink-3">{k}</dt>
              <dd className="truncate">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="h-2" />
      </Card>
      <Card>
        <CardHeader title="Setup" description="Services, areas, questions, brand and operations." />
        <div className="flex flex-wrap gap-2 px-5 pb-5 pt-4">
          {STEPS.map((s) => (
            <ButtonLink key={s.id} href={`/app/onboarding?step=${s.id}`} variant="secondary" size="sm">
              {s.title}
            </ButtonLink>
          ))}
        </div>
      </Card>
    </div>
  );
}
