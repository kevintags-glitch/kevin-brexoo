import type { Metadata } from "next";
import { VerifyNotice } from "@/components/app/AuthForms";

export const metadata: Metadata = { title: "Confirm your email" };

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const sp = await searchParams;
  return <VerifyNotice email={sp.email} />;
}
