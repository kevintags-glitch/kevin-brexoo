import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

/* ------------------------------------------------------------------------------------------------
 * Buttons. One primary action per view; secondary and ghost for the rest. Press feedback is a
 * 0.97 scale at 160ms ease-out. Hit areas are at least 40px (36px for sm, which is desktop-only).
 * ---------------------------------------------------------------------------------------------- */
type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "inverse";
type ButtonSize = "sm" | "md" | "lg";

const buttonBase =
  "type-button pressable inline-flex items-center justify-center gap-2 rounded-[10px] whitespace-nowrap select-none disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2";

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-blue text-on-blue shadow-[inset_0_1px_0_rgb(255_255_255/0.18),0_1px_2px_rgb(10_26_51/0.2)] hover:bg-blue-hover",
  secondary: "bg-surface text-ink border border-line-strong shadow-xs hover:bg-surface-2",
  outline: "border border-blue/70 bg-surface text-blue hover:bg-blue-soft",
  ghost: "text-ink-2 hover:text-ink hover:bg-surface-2",
  danger: "bg-surface text-red-ink border border-line-strong hover:bg-red-soft",
  inverse: "bg-white text-[#0f2742] hover:bg-white/90",
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3",
  md: "h-10 px-4",
  lg: "h-12 px-5",
};

export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string) {
  return cn(buttonBase, buttonVariants[variant], buttonSizes[size], className);
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  pending,
  children,
  ...props
}: ComponentProps<"button"> & { variant?: ButtonVariant; size?: ButtonSize; pending?: boolean }) {
  return (
    <button type={type} className={buttonClass(variant, size, className)} disabled={props.disabled || pending} aria-busy={pending || undefined} {...props}>
      {pending ? <Spinner className="size-4" /> : null}
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("animate-spin [animation-duration:600ms]", className)} aria-hidden fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/* ------------------------------------------------------------------------------------------------
 * Form fields. Labels are always visible; hints and errors are tied to the control with
 * aria-describedby so screen readers announce them.
 * ---------------------------------------------------------------------------------------------- */
const controlBase =
  "w-full rounded-[10px] border border-line-strong bg-surface text-ink placeholder:text-ink-3 shadow-xs transition-[border-color,box-shadow] duration-150 focus:border-blue focus:ring-4 focus:ring-blue/15 aria-[invalid=true]:border-red-ink aria-[invalid=true]:focus:ring-red-ink/15 disabled:opacity-60";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(controlBase, "type-body h-11 px-3.5 sm:h-10 sm:text-sm", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(controlBase, "type-body min-h-24 px-3.5 py-2.5 sm:text-sm", className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <div className="relative">
      <select className={cn(controlBase, "type-body h-11 appearance-none pl-3.5 pr-9 sm:h-10 sm:text-sm", className)} {...props}>
        {children}
      </select>
      <svg aria-hidden viewBox="0 0 16 16" className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-3">
        <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  optional,
  children,
  className,
}: {
  label: ReactNode;
  htmlFor: string;
  hint?: ReactNode;
  error?: string | null;
  optional?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-[13px] font-medium text-ink-2">
        {label}
        {optional ? <span className="font-normal text-ink-3"> (optional)</span> : null}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="text-[13px] text-red-ink" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="text-[13px] text-ink-3">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function Checkbox({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      type="checkbox"
      className={cn(
        "mt-0.5 size-[18px] shrink-0 cursor-pointer pointer-coarse:size-6 appearance-none rounded-[5px] border border-line-strong bg-surface transition-colors checked:border-blue checked:bg-blue checked:bg-[url(\"data:image/svg+xml,%3Csvg viewBox='0 0 16 16' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M4 8.5l2.5 2.5L12 5.5' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")] focus-visible:outline-2 focus-visible:outline-offset-2",
        className,
      )}
      {...props}
    />
  );
}

/* ------------------------------------------------------------------------------------------------
 * Surfaces and status
 * ---------------------------------------------------------------------------------------------- */
export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("rounded-2xl border border-line bg-surface shadow-sm", className)} {...props} />;
}

export function CardHeader({ title, description, action, className }: { title: ReactNode; description?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-start justify-between gap-4 px-5 pt-5", className)}>
      <div className="min-w-0">
        <h2 className="font-sans type-card text-ink">{title}</h2>
        {description ? <p className="mt-0.5 text-[13px] text-ink-3">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export type Tone = "neutral" | "blue" | "teal" | "amber" | "red" | "green" | "violet";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-surface-2 text-ink-2",
  blue: "bg-blue-soft text-blue",
  teal: "bg-teal-soft text-teal-ink",
  amber: "bg-amber-soft text-amber-ink",
  red: "bg-red-soft text-red-ink",
  green: "bg-green-soft text-green-ink",
  violet: "bg-violet-soft text-violet-ink",
};

export function Badge({ tone = "neutral", className, dot, children }: { tone?: Tone; className?: string; dot?: boolean; children: ReactNode }) {
  return (
    <span className={cn("inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium whitespace-nowrap", toneClasses[tone], className)}>
      {dot ? <span aria-hidden className="size-1.5 rounded-full bg-current" /> : null}
      {children}
    </span>
  );
}

export function EmptyState({ icon, title, description, action, className }: { icon?: ReactNode; title: string; description?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-14 text-center", className)}>
      {icon ? <div className="mb-4 grid size-11 place-items-center rounded-xl bg-surface-2 text-ink-3 [&_svg]:size-5">{icon}</div> : null}
      <h3 className="font-sans type-card text-ink">{title}</h3>
      {description ? <p className="mt-1 max-w-sm text-sm text-ink-3">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function Notice({ tone = "blue", title, children, className }: { tone?: Tone; title?: ReactNode; children?: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl px-4 py-3 text-sm", toneClasses[tone], className)} role={tone === "red" ? "alert" : "status"}>
      {title ? <p className="font-medium">{title}</p> : null}
      {children ? <div className={cn(title && "mt-0.5", "opacity-90")}>{children}</div> : null}
    </div>
  );
}

export function Avatar({ name, className }: { name: string; className?: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
  // Stable hue per name so teammates are recognisable at a glance.
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360;
  return (
    <span
      aria-hidden
      className={cn("inline-grid size-7 shrink-0 place-items-center rounded-full text-[11px] font-medium text-white", className)}
      style={{ background: `oklch(0.58 0.12 ${h})` }}
    >
      {initials || "?"}
    </span>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="rounded border border-line-strong bg-surface-2 px-1.5 py-0.5 font-sans text-[11px] text-ink-3">{children}</kbd>;
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-lg bg-surface-2", className)} />;
}
