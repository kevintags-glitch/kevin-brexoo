import Link from "next/link";
import { Check, MapPin, Phone } from "lucide-react";
import { LogoMark } from "@/components/brand/Logo";
import { cn } from "@/lib/cn";
import { EnquiryForm } from "./EnquiryForm";
import type { PublicPageData } from "./types";
import { VisitorChat } from "./VisitorChat";

const ACCENTS = {
  blue: "bg-[linear-gradient(160deg,#0f2742_0%,#1f5fd0_115%)]",
  teal: "bg-[linear-gradient(160deg,#0f2742_0%,#0891b2_120%)]",
  navy: "bg-[linear-gradient(160deg,#081a2e_0%,#0f2742_100%)]",
};

/**
 * A builder's public landing page (§7.1). Light, fast and mobile-first: the enquiry form sits
 * beside the hero on desktop and directly under it on phones. Only approved content is shown.
 */
export function PublicLanding({ data, preview, local }: { data: PublicPageData; preview?: boolean; local?: { heading: string; intro: string; breadcrumb: { href: string; label: string }[] } }) {
  const c = data.content;
  const b = data.business;
  return (
    <div className="min-h-dvh bg-canvas text-ink" style={{ colorScheme: "light" }} data-theme="light">
      <header className="sticky top-0 z-30 border-b border-line bg-surface/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1120px] items-center gap-3 px-4 sm:px-6">
          {b.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={b.logo_url} alt="" className="h-9 w-auto max-w-[120px] object-contain" />
          ) : null}
          <span className="truncate text-[16px] font-semibold">{b.name}</span>
          <div className="ml-auto flex items-center gap-2">
            {b.phone ? (
              <a href={`tel:${b.phone.replace(/[^0-9+]/g, "")}`} className="pressable inline-flex h-10 items-center gap-2 rounded-[10px] px-3 text-[14px] font-medium text-ink-2 hover:bg-surface-2">
                <Phone className="size-4" aria-hidden />
                <span className="max-sm:sr-only">{b.phone}</span>
              </a>
            ) : null}
            <a href="#enquire" className="pressable inline-flex h-10 shrink-0 items-center whitespace-nowrap rounded-[10px] bg-blue px-4 text-[14px] font-medium text-on-blue hover:bg-blue-hover">
              {c.cta}
            </a>
          </div>
        </div>
      </header>

      <main id="main">
        <section className={cn("relative overflow-hidden text-white", ACCENTS[c.accent])}>
          <div aria-hidden className="grain pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-overlay" />
          <div className="relative mx-auto grid max-w-[1120px] gap-10 px-4 pb-10 pt-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_440px] lg:pb-20 lg:pt-20">
            <div className="lg:pt-6">
              {local ? (
                <nav aria-label="Breadcrumb" className="mb-4 text-[13px] text-white/70">
                  {local.breadcrumb.map((b, k) => (
                    <span key={b.href}>
                      {k ? " / " : ""}
                      <a href={b.href} className="hover:text-white">
                        {b.label}
                      </a>
                    </span>
                  ))}
                </nav>
              ) : null}
              <h1 className="max-w-[18ch] text-[38px] font-bold leading-[1.05] tracking-[-0.03em] sm:text-[54px]">{local?.heading ?? c.headline}</h1>
              {local ? <p className="mt-5 max-w-[52ch] text-[17px] leading-relaxed text-white/80">{local.intro}</p> : c.subheadline ? <p className="mt-5 max-w-[52ch] text-[17px] leading-relaxed text-white/80">{c.subheadline}</p> : null}
              {c.highlights.length ? (
                <ul className="mt-8 grid gap-3">
                  {c.highlights.filter(Boolean).map((h) => (
                    <li key={h} className="flex items-center gap-3 text-[15px] text-white/90">
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-white/15">
                        <Check className="size-3.5" strokeWidth={3} aria-hidden />
                      </span>
                      {h}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            <div id="enquire" className="scroll-mt-24 rounded-[22px] bg-surface text-ink shadow-lg ring-1 ring-black/5">
              {c.formIntro ? <p className="px-6 pt-5 text-[13px] text-ink-3 sm:px-7">{c.formIntro}</p> : null}
              <EnquiryForm data={data} preview={preview} />
            </div>
          </div>
        </section>

        {data.services.length || data.areas.length ? (
          <section className="border-b border-line bg-surface">
            <div className="mx-auto grid max-w-[1120px] gap-10 px-4 py-14 sm:px-6 md:grid-cols-2">
              {data.services.length ? (
                <div>
                  <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-ink-3">Services</h2>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {data.services.map((s) => (
                      <li key={s.code} className="rounded-full border border-line-strong px-4 py-2 text-[15px]">
                        {s.name}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {data.areas.length ? (
                <div>
                  <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-ink-3">Areas we cover</h2>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {(data.places.length ? data.places : data.areas.map((a) => ({ label: a, slug: null }))).map((a) => (
                      <li key={a.label}>
                        {a.slug && !preview ? (
                          <a href={`/p/${data.slug}/${a.slug}`} className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-4 py-2 text-[15px] hover:bg-blue-soft hover:text-blue">
                            <MapPin className="size-4 text-ink-3" aria-hidden />
                            {a.label}
                          </a>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-4 py-2 text-[15px]">
                            <MapPin className="size-4 text-ink-3" aria-hidden />
                            {a.label}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {c.about ? (
          <section className="mx-auto max-w-[1120px] px-4 py-16 sm:px-6">
            <h2 className="text-[30px] font-bold tracking-[-0.02em]">About {b.name}</h2>
            <p className="mt-4 max-w-[65ch] whitespace-pre-line text-[17px] leading-relaxed text-ink-2">{c.about}</p>
          </section>
        ) : null}

        {c.gallery.length ? (
          <section className="mx-auto max-w-[1120px] px-4 pb-16 sm:px-6">
            <h2 className="text-[30px] font-bold tracking-[-0.02em]">Recent work</h2>
            <ul className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
              {c.gallery.map((g) => (
                <li key={g.url} className="overflow-hidden rounded-2xl bg-surface-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={g.url} alt={g.caption || "Project photo"} className="aspect-[4/3] w-full object-cover" loading="lazy" />
                  {g.caption ? <p className="px-3 py-2 text-[13px] text-ink-3">{g.caption}</p> : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {c.process.length ? (
          <section className="border-y border-line bg-surface">
            <div className="mx-auto max-w-[1120px] px-4 py-16 sm:px-6">
              <h2 className="text-[30px] font-bold tracking-[-0.02em]">How it works</h2>
              <ol className="mt-8 grid gap-6 md:grid-cols-3">
                {c.process.map((p, i) => (
                  <li key={i}>
                    <span className="text-[13px] font-semibold tabular text-blue">{String(i + 1).padStart(2, "0")}</span>
                    <p className="mt-2 text-[17px] font-semibold">{p.title}</p>
                    <p className="mt-1.5 text-[15px] leading-relaxed text-ink-3">{p.body}</p>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        ) : null}

        {c.faqs.length ? (
          <section className="mx-auto max-w-[800px] px-4 py-16 sm:px-6">
            <h2 className="text-[30px] font-bold tracking-[-0.02em]">Questions</h2>
            <div className="mt-6 divide-y divide-line border-y border-line">
              {c.faqs.map((f) => (
                <details key={f.q} className="group [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-[16px] font-medium">
                    {f.q}
                    <span aria-hidden className="text-ink-3 transition-transform duration-200 group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="pb-5 text-[15px] leading-relaxed text-ink-2">{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        ) : null}
      </main>

      <footer className="border-t border-line bg-surface">
        <div className="mx-auto flex max-w-[1120px] flex-col gap-3 px-4 py-8 pb-24 text-[13px] text-ink-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            © {new Date().getFullYear()} {b.name}. Enquiries you send here go only to {b.name}.{" "}
            <a href="/legal/privacy" className="underline underline-offset-2 hover:text-ink">
              Privacy
            </a>
          </p>
          <Link href="/" className="inline-flex items-center gap-1.5 hover:text-ink">
            <LogoMark className="h-4 w-auto" knockout="var(--surface)" /> Powered by Brexoo
          </Link>
        </div>
      </footer>
      {c.chatEnabled ? <VisitorChat data={data} preview={preview} /> : null}
    </div>
  );
}
