import { cn } from "@/lib/cn";
import { FLIP, MARK } from "./Logo";

/**
 * The logo's own geometry reused as decoration: the interlocking stadium-and-circle mark as an
 * outline or watermark, and a small "loop" glyph for dividers and eyebrows. Always aria-hidden.
 */
export function MarkOutline({ className, strokeWidth = 34 }: { className?: string; strokeWidth?: number }) {
  return (
    <svg viewBox="0 20 1400 1320" aria-hidden className={cn("pointer-events-none overflow-visible", className)}>
      <g transform={FLIP}>
        <path d={MARK} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinejoin="round" />
      </g>
    </svg>
  );
}

export function MarkWatermark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 20 1400 1320" aria-hidden className={cn("pointer-events-none", className)}>
      <g transform={FLIP}>
        <path d={MARK} fill="currentColor" />
      </g>
    </svg>
  );
}

/** A tiny interlocking stadium + circle, in brand blue and teal. */
export function LoopGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 30 24" aria-hidden className={cn("h-[0.9em] w-auto shrink-0", className)} fill="none" strokeWidth={3} strokeLinecap="round">
      <rect x="2" y="2" width="12" height="20" rx="6" stroke="#3B82F6" />
      <circle cx="17" cy="14" r="8" stroke="#06B6D4" />
    </svg>
  );
}

/** Section divider: hairline, loop glyph, hairline. */
export function LoopDivider({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("flex items-center gap-4", className)}>
      <span className="h-px flex-1 bg-[linear-gradient(90deg,transparent,var(--line))]" />
      <LoopGlyph className="h-5" />
      <span className="h-px flex-1 bg-[linear-gradient(90deg,var(--line),transparent)]" />
    </div>
  );
}
