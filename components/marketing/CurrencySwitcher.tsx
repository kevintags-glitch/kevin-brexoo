"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { CURRENCIES, type Currency } from "@/config/plans";
import { saveCurrencyChoice } from "@/lib/currency";
import { cn } from "@/lib/cn";

const LABEL: Record<Currency, string> = { USD: "US$ USD", AUD: "A$ AUD", NZD: "NZ$ NZD" };

/** Lets a visitor see prices in another market's currency; the choice is remembered for a year. */
export function CurrencySwitcher({ current, className }: { current: Currency; className?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const choose = (c: Currency) => {
    saveCurrencyChoice(c);
    const url = new URL(window.location.href);
    if (url.searchParams.has("currency")) {
      url.searchParams.delete("currency");
      window.history.replaceState(null, "", url);
    }
    start(() => router.refresh());
  };
  return (
    <div role="radiogroup" aria-label="Currency" className={cn("inline-flex rounded-full border border-line bg-white p-1", pending && "opacity-70", className)}>
      {CURRENCIES.map((c) => (
        <button
          key={c}
          type="button"
          role="radio"
          aria-checked={c === current}
          onClick={() => choose(c)}
          className={cn("rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors", c === current ? "bg-[#0F2742] text-white" : "text-ink-3 hover:text-ink")}
        >
          {LABEL[c]}
        </button>
      ))}
    </div>
  );
}
