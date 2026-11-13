"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Heart, X } from "lucide-react";
import { saveRecord, setRecordStatus } from "@/features/discovery/actions";
import { cn } from "@/lib/cn";

export function RecordActions({ id, status, opportunityId, title }: { id: string; status: string; opportunityId: string | null; title: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  if (status === "saved") {
    return opportunityId ? (
      <Link href={`/app/opportunities/${opportunityId}`} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-green-soft px-3 text-[13px] font-semibold text-green-ink">
        <Heart className="size-4 fill-current" aria-hidden /> Saved · Open
      </Link>
    ) : (
      <span className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-green-soft px-3 text-[13px] font-semibold text-green-ink">
        <Heart className="size-4 fill-current" aria-hidden /> Saved to projects
      </span>
    );
  }
  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await saveRecord(id);
            if (r.error) setError(r.error);
            else router.refresh();
          })
        }
        className={cn("pressable inline-flex h-9 items-center gap-1.5 rounded-xl border border-line-strong px-3 text-[13px] font-semibold text-ink-2 hover:border-blue/50 hover:text-blue", pending && "opacity-60")}
        aria-label={`Save ${title} to your CRM`}
      >
        <Heart className="size-4" aria-hidden /> Save
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => start(async () => setRecordStatus(id, status === "dismissed" ? "new" : "dismissed"))}
        className="pressable grid size-9 place-items-center rounded-xl text-ink-3 hover:bg-surface-2 hover:text-ink"
        aria-label={status === "dismissed" ? `Restore ${title}` : `Dismiss ${title}`}
        title={status === "dismissed" ? "Restore" : "Not relevant"}
      >
        <X className="size-4" />
      </button>
      {error ? <span className="text-[12px] text-red-ink" role="alert">{error}</span> : null}
    </div>
  );
}
