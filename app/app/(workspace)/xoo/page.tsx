import type { Metadata } from "next";
import { Page } from "@/components/app/PageHeader";
import { XooChat } from "@/components/app/XooChat";

export const metadata: Metadata = { title: "Xoo AI" };

export default function XooPage() {
  return (
    <Page className="max-w-[820px]">
      <XooChat />
    </Page>
  );
}
