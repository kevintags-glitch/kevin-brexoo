import type { Metadata } from "next";
import { SignupForm } from "@/components/app/AuthForms";

export const metadata: Metadata = { title: "Create an account" };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ plan?: string; next?: string }> }) {
  const sp = await searchParams;
  return <SignupForm plan={sp.plan} next={sp.next} />;
}
