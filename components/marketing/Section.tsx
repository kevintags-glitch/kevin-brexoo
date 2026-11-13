import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Reveal } from "./Reveal";

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-[1200px] px-4 sm:px-6", className)}>{children}</div>;
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("text-[13px] font-semibold uppercase tracking-[0.12em] text-blue", className)}>{children}</p>;
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
      <h2 className="mt-3 text-[34px] font-medium leading-[1.08] sm:text-[44px]">{title}</h2>
      {body ? <p className="mt-4 text-[17px] leading-relaxed text-ink-2">{body}</p> : null}
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
          <div className="pb-5 pr-12 text-[15px] leading-relaxed text-ink-2">{item.a}</div>
        </details>
      ))}
    </div>
  );
}

/** Closing call to action on navy, with the loop mark as a quiet watermark. */
export function CtaBand({ title, body, children }: { title: ReactNode; body?: ReactNode; children: ReactNode }) {
  return (
    <section className="px-4 pb-24 sm:px-6">
      <div className="relative mx-auto max-w-[1200px] overflow-hidden rounded-[28px] bg-[#0b2347] px-6 py-16 text-white sm:px-14 sm:py-20">
        <div aria-hidden className="grain pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-overlay" />
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 size-[520px] rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.45),transparent_65%)]" />
        <div aria-hidden className="pointer-events-none absolute -bottom-40 left-1/3 size-[420px] rounded-full bg-[radial-gradient(circle,rgba(33,182,168,0.28),transparent_65%)]" />
        <svg aria-hidden viewBox="-4 -4 408 401" className="pointer-events-none absolute -right-10 bottom-[-30%] h-[130%] w-auto opacity-[0.07]" fill="none" stroke="white" strokeWidth="18">
          <path d="M19 132A113.5 113.5 0 0 1 246 132L246 260A113.5 113.5 0 0 1 19 260Z" />
          <circle cx="265" cy="257" r="116" />
        </svg>
        <div className="relative max-w-2xl">
          <h2 className="text-[34px] font-medium leading-[1.08] sm:text-[48px]">{title}</h2>
          {body ? <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-white/75">{body}</p> : null}
          <div className="mt-8 flex flex-wrap gap-3">{children}</div>
        </div>
      </div>
    </section>
  );
}
