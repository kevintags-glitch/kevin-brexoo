import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui";
import { acceptInvitation } from "@/features/workspace/actions";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Join your team" };

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect(`/signup?next=${encodeURIComponent(`/invite/${token}`)}`);
  const accept = async () => {
    "use server";
    await acceptInvitation(token);
  };
  return (
    <div className="flex min-h-dvh flex-col px-4 py-6 sm:px-10">
      <Link href="/" className="w-fit" aria-label="Brexoo home">
        <Logo knockout="var(--canvas)" />
      </Link>
      <main id="main" className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center">
        <h1 className="text-[30px] font-medium tracking-[-0.025em]">You've been invited</h1>
        <p className="mt-2 text-[15px] text-ink-3">Join your team's Brexoo workspace as {data.user.email}. The invitation must have been sent to this email.</p>
        <form action={accept} className="mt-8">
          <Button type="submit" size="lg" className="w-full">
            Accept invitation
          </Button>
        </form>
      </main>
    </div>
  );
}
