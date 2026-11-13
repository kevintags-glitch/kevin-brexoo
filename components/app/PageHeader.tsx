import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function PageHeader({ title, description, actions, eyebrow, className }: { title: ReactNode; description?: ReactNode; actions?: ReactNode; eyebrow?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        {eyebrow ? <div className="mb-2 text-[13px] text-ink-3">{eyebrow}</div> : null}
        <h1 className="truncate text-[26px] font-semibold leading-tight tracking-[-0.02em] sm:text-[30px]">{title}</h1>
        {description ? <p className="mt-1 text-[14px] text-ink-3">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Page({ children, className, wide }: { children: ReactNode; className?: string; wide?: boolean }) {
  return <div className={cn("mx-auto w-full px-4 py-6 sm:px-8 sm:py-8", wide ? "max-w-[1400px]" : "max-w-[1120px]", className)}>{children}</div>;
}
