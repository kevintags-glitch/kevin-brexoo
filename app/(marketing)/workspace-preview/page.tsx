import type { Metadata } from "next";
import { ArrowLeft, CalendarCheck } from "lucide-react";
import { LogoMark } from "@/components/brand/Logo";
import { ButtonLink } from "@/components/ui";
import { Container } from "@/components/marketing/Section";

export const metadata: Metadata = { title: "Workspace preview", robots: { index: false } };

/** Shown for sign-in and workspace routes when this deployment has no database connected. */
export default function WorkspacePreviewPage() {
  return (
    <section className="bg-white">
      <Container className="flex min-h-[70dvh] flex-col items-center justify-center py-24 text-center">
        <LogoMark className="size-14 text-[#0f2742]" />
        <h1 className="mt-8 max-w-[18ch] text-[40px] font-extralight leading-[1.05] tracking-[-0.04em] sm:text-[56px]">The Brexoo workspace isn&apos;t connected in this preview.</h1>
        <p className="mt-5 max-w-[52ch] text-[17px] font-light leading-relaxed text-ink-2">
          This link shows the Brexoo website. Sign-up, the dashboard and customer landing pages open once the preview is connected to its database.
        </p>
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/" size="lg" variant="outline">
            <ArrowLeft className="size-4" aria-hidden /> Back to the website
          </ButtonLink>
          <ButtonLink href="/how-it-works" size="lg">
            <CalendarCheck className="size-4" aria-hidden /> See how it works
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
