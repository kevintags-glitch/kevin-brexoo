"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { CalendarClock, Check } from "lucide-react";
import { Avatar, Button } from "@/components/ui";
import { confirmBookingRequest, declineBookingRequest } from "@/features/crm/actions";

export type BookingRequest = { id: string; name: string; when: string; type: string; where: string | null; oppId: string | null; sample: boolean };

/** Times visitors asked for on the public page, waiting for the business to confirm. */
export function BookingRequests({ requests }: { requests: BookingRequest[] }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<{ error?: string; fieldErrors?: Record<string, string> }>, ok: string) =>
    start(async () => {
      const r = await fn();
      setMsg(r.error ?? (r.fieldErrors ? Object.values(r.fieldErrors)[0]! : ok));
    });
  if (!requests.length) return null;
  return (
    <section aria-labelledby="req-title" className="rounded-2xl border border-blue/30 bg-blue-soft/30 p-4">
      <div className="flex items-center gap-2">
        <CalendarClock className="size-5 text-blue" aria-hidden />
        <h2 id="req-title" className="text-[16px] font-semibold">
          Booking requests <span className="text-ink-3">· {requests.length}</span>
        </h2>
      </div>
      <p className="mt-0.5 text-[13px] text-ink-3">Visitors picked these times on your page. Nothing is booked until you confirm.</p>
      <ul className="mt-3 grid gap-2">
        {requests.map((r) => (
          <li key={r.id} className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-3 sm:flex-row sm:items-center">
            <Avatar name={r.name} className="size-9" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-medium">
                {r.oppId ? <Link href={`/app/opportunities/${r.oppId}`} className="hover:text-blue">{r.name}</Link> : r.name}
                {r.sample ? <span className="ml-2 rounded-md bg-amber-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-ink">Sample</span> : null}
              </p>
              <p className="text-[13px] text-ink-2">
                {r.type} · <strong className="font-semibold">{r.when}</strong>
                {r.where ? <span className="text-ink-3"> · {r.where}</span> : null}
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" pending={pending} onClick={() => run(() => confirmBookingRequest(r.id), "Booked. It's on your calendar.")}>
                <Check className="size-4" aria-hidden /> Confirm
              </Button>
              <Button size="sm" variant="secondary" onClick={() => run(() => declineBookingRequest(r.id), "We've added a task to suggest another time.")}>
                Suggest another time
              </Button>
            </div>
          </li>
        ))}
      </ul>
      {msg ? <p className="mt-2 text-[13px] text-ink-2" role="status">{msg}</p> : null}
    </section>
  );
}
