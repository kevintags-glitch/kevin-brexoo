import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { FitCardMock } from "@/components/marketing/mocks";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <div className="flex flex-col px-4 py-6 sm:px-10">
        <Link href="/" className="w-fit rounded-lg" aria-label="Brexoo home">
          <Logo knockout="var(--canvas)" />
        </Link>
        <main id="main" className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center py-12">
          {children}
        </main>
        <p className="text-center text-xs text-ink-3">
          <Link href="/legal/privacy" className="hover:text-ink">Privacy</Link> · <Link href="/legal/terms" className="hover:text-ink">Terms</Link>
        </p>
      </div>
      <aside aria-hidden className="relative hidden overflow-hidden bg-[#0b2347] lg:block">
        <div className="grain absolute inset-0 opacity-[0.06] mix-blend-overlay" />
        <div className="absolute -right-32 -top-32 size-[640px] rounded-full bg-[radial-gradient(circle,rgba(61,120,214,0.5),transparent_65%)]" />
        <div className="absolute -bottom-48 -left-24 size-[560px] rounded-full bg-[radial-gradient(circle,rgba(33,182,168,0.3),transparent_65%)]" />
        <div className="relative flex h-full flex-col justify-center px-16">
          <p className="max-w-md font-display text-[40px] font-medium leading-[1.08] tracking-[-0.03em] text-white">Know why it fits, and what's still missing.</p>
          <p className="mt-4 max-w-md text-[16px] leading-relaxed text-white/70">Every opportunity in Brexoo explains itself: the factors behind its fit, how fresh the evidence is, and what to ask next.</p>
          <FitCardMock className="mt-10 max-w-[420px] rotate-[-1.5deg] border-white/10" />
        </div>
      </aside>
    </div>
  );
}
