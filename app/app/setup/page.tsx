import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { SetupForm } from "@/components/app/SetupForm";
import { getMemberships, requireUser } from "@/lib/auth/session";
import { SITE_URL } from "@/lib/env";
import { allTimezones } from "@/lib/timezones";

export const metadata: Metadata = { title: "Set up your business" };

export default async function SetupPage({ searchParams }: { searchParams: Promise<{ new?: string }> }) {
  const sp = await searchParams;
  const { user } = await requireUser();
  const memberships = await getMemberships();
  if (memberships.length > 0 && sp.new !== "1") redirect("/app");
  const firstName = (user.user_metadata?.full_name as string | undefined)?.split(" ")[0];

  return (
    <div className="flex min-h-dvh flex-col px-4 py-6 sm:px-10">
      <Link href="/" className="w-fit rounded-lg" aria-label="Brexoo home">
        <Logo knockout="var(--canvas)" />
      </Link>
      <main id="main" className="mx-auto flex w-full max-w-[460px] flex-1 flex-col justify-center py-12">
        <p className="text-[13px] font-medium uppercase tracking-[0.12em] text-blue">Step 1 of 2</p>
        <h1 className="type-section mt-3">{firstName ? `Welcome, ${firstName}.` : "Welcome."} Let's set up your business.</h1>
        <p className="type-body mb-8 mt-2 text-ink-3">Your organisation keeps your enquiries, team and pages separate from everyone else's. You'll be its owner.</p>
        <SetupForm siteHost={new URL(SITE_URL).host} zones={allTimezones()} />
      </main>
    </div>
  );
}
