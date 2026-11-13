import type { Metadata } from "next";
import { Page } from "@/components/app/PageHeader";
import { BrexChat } from "@/components/app/BrexChat";

export const metadata: Metadata = { title: "Brex AI" };

export default function BrexAiPage() {
  return (
    <Page className="max-w-[820px]">
      <BrexChat />
    </Page>
  );
}
