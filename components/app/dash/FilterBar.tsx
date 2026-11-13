"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/cn";

export type FilterDef = { name: string; label: string; options: { value: string; label: string }[] };

/**
 * Labelled filter row (search + selects). Changes are written to the URL so filtered views can be
 * shared and survive refresh; the server does the filtering.
 */
export function FilterBar({ search, filters, actions }: { search?: { name: string; label: string; placeholder: string }; filters: FilterDef[]; actions?: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();

  const set = (name: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(name, value);
    else next.delete(name);
    next.delete("page");
    start(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
  };

  return (
    <div className={cn("flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-end", pending && "opacity-80")} aria-busy={pending || undefined}>
      <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-end">
        {search ? (
          <form
            role="search"
            className="grid gap-1.5 lg:w-64"
            onSubmit={(e) => {
              e.preventDefault();
              set(search.name, String(new FormData(e.currentTarget).get(search.name) ?? "").trim());
            }}
          >
            <label htmlFor={`f-${search.name}`} className="text-[12px] font-medium text-ink-3">
              {search.label}
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
              <input
                id={`f-${search.name}`}
                name={search.name}
                defaultValue={params.get(search.name) ?? ""}
                placeholder={search.placeholder}
                className="h-10 w-full rounded-xl border border-transparent bg-surface-2 pl-9 pr-3 text-[14px] outline-none transition-colors placeholder:text-ink-3 focus:border-blue focus:bg-surface focus:ring-4 focus:ring-blue/10"
              />
            </div>
          </form>
        ) : null}
        {filters.map((f) => (
          <div key={f.name} className="grid gap-1.5 lg:w-44">
            <label htmlFor={`f-${f.name}`} className="text-[12px] font-medium text-ink-3">
              {f.label}
            </label>
            <div className="relative">
              <select
                id={`f-${f.name}`}
                value={params.get(f.name) ?? ""}
                onChange={(e) => set(f.name, e.target.value)}
                className="h-10 w-full appearance-none rounded-xl border border-transparent bg-surface-2 pl-3 pr-9 text-[14px] text-ink outline-none transition-colors focus:border-blue focus:bg-surface focus:ring-4 focus:ring-blue/10"
              >
                {f.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <svg aria-hidden viewBox="0 0 16 16" className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-3">
                <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        ))}
      </div>
      {actions ? <div className="flex shrink-0 gap-2">{actions}</div> : null}
    </div>
  );
}
