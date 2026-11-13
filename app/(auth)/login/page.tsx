import type { Metadata } from "next";
import { LoginForm } from "@/components/app/AuthForms";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const sp = await searchParams;
  return <LoginForm next={sp.next} linkError={sp.error === "link"} />;
}
