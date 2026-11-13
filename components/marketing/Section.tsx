import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { LogoMark } from "@/components/brand/Logo";
import { Swoosh } from "./Swoosh";
import { Reveal } from "./Reveal";

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-[1200px] px-4 sm:px-6", className)}>{children}</div>;
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("type-label uppercase tracking-[0.12em] text-blue", className)}>{children}</p>;
}

export function SectionHeading({
  eyebrow,
  title,
  body,
  align = "left",
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  body?: ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <Reveal className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h2 className="type-section mt-3">{title}</h2>
      {body ? <p className="type-body mt-4 text-ink-2">{body}</p> : null}
    </Reveal>
  );
}

export function Faq({ items }: { items: { q: string; a: ReactNode }[] }) {
  return (
    <div className="divide-y divide-line border-y border-line">
      {items.map((item) => (
        <details key={item.q} className="group py-1 [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 rounded-lg py-4 text-[16px] font-medium text-ink">
            {item.q}
            <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-full border border-line-strong text-ink-3 transition-transform duration-200 ease-out group-open:rotate-45">
              <svg viewBox="0 0 12 12" className="size-3">
                <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </span>
          </summary>
          <div className="type-body pb-5 pr-12 text-ink-2">{item.a}</div>
        </details>
      ))}
    </div>
  );
}

/** Closing call to action on navy, with the loop mark as a quiet watermark. */
export function CtaBand({ title, body, children }: { title: ReactNode; body?: ReactNode; children: ReactNode }) {
  return (
    <section className="px-4 pb-24 sm:px-6">
      <div className="relative mx-auto max-w-[1200px] overflow-hidden rounded-[28px] bg-[#0f2742] px-6 py-16 text-white sm:px-14 sm:py-20">
        <Swoosh tone="dark" className="absolute inset-y-0 right-0 h-full w-[75%] opacity-90" />
        <LogoMark color="#fff" className="pointer-events-none absolute right-10 top-1/2 h-[70%] w-auto -translate-y-1/2 opacity-[0.12] max-md:hidden" />
        <div className="relative max-w-2xl">
          <h2 className="type-section">{title}</h2>
          {body ? <p className="type-body mt-4 max-w-xl text-white/75">{body}</p> : null}
          <div className="mt-8 flex flex-wrap gap-3">{children}</div>
        </div>
      </div>
    </section>
  );
}
