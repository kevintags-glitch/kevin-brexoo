import { cn } from "@/lib/cn";

/**
 * The Brexoo loop mark: a tall pill and a ring that interlock. Geometry was measured from the
 * supplied logo artwork. The two crossings alternate (pill over ring at the top, ring over pill at
 * the bottom) by redrawing a short segment with a knockout stroke in the surface colour.
 */
const PILL = "M19 132A113.5 113.5 0 0 1 246 132L246 260A113.5 113.5 0 0 1 19 260Z";
const PILL_OVER = "M246 108L246 176";
const RING_OVER = "M225.3 366A116 116 0 0 1 176.1 331.6";

export function LogoMark({ className, knockout = "var(--surface)", title }: { className?: string; knockout?: string; title?: string }) {
  return (
    <svg
      viewBox="-4 -4 408 401"
      className={cn("shrink-0", className)}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      fill="none"
      strokeWidth={38}
    >
      <path d={PILL} stroke="var(--brand-mark)" />
      <circle cx={265} cy={257} r={116} stroke="var(--brand-mark)" />
      <path d={PILL_OVER} stroke={knockout} strokeWidth={62} />
      <path d={PILL_OVER} stroke="var(--brand-mark)" />
      <path d={RING_OVER} stroke={knockout} strokeWidth={62} />
      <path d={RING_OVER} stroke="var(--brand-mark)" />
    </svg>
  );
}

export function Logo({ className, knockout, size = "md" }: { className?: string; knockout?: string; size?: "sm" | "md" | "lg" }) {
  const dims = { sm: "h-6", md: "h-7", lg: "h-10" }[size];
  const text = { sm: "text-[1.35rem]", md: "text-[1.6rem]", lg: "text-[2.3rem]" }[size];
  return (
    <span className={cn("inline-flex items-center gap-2 text-brand-ink", className)}>
      <LogoMark className={cn(dims, "w-auto")} knockout={knockout} />
      <span aria-hidden className={cn("font-display font-[420] leading-none tracking-[-0.01em]", text)} style={{ marginTop: "-0.12em" }}>
        brexoo
      </span>
      <span className="sr-only">Brexoo</span>
    </span>
  );
}
