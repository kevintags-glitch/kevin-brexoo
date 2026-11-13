import { Page, PageHeader } from "@/components/app/PageHeader";
import { SettingsNav } from "@/components/app/SettingsNav";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <Page>
      <PageHeader title="Settings" className="mb-6" />
      <SettingsNav />
      {children}
    </Page>
  );
}
