/**
 * Product illustrations for the marketing site, built from real UI primitives rather than
 * screenshots so they stay crisp, theme-aware and accessible. All names and data are fictional.
 */
import {
  CalendarDays,
  Check,
  CircleQuestionMark,
  Clock,
  FileText,
  Inbox,
  LayoutDashboard,
  MapPin,
  Minus,
  Search,
  Sparkles,
  SquareKanban,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import { LogoMark } from "@/components/brand/Logo";
import { Avatar, Badge } from "@/components/ui";
import { cn } from "@/lib/cn";

export function AppWindow({ children, className, url = "app.brexoo.com" }: { children: ReactNode; className?: string; url?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-[18px] border border-line bg-surface shadow-lg ring-1 ring-black/[0.02]", className)}>
      <div className="flex h-10 items-center gap-3 border-b border-line bg-surface-2/60 px-4">
        <div className="flex gap-1.5" aria-hidden>
          <span className="size-2.5 rounded-full bg-line-strong" />
          <span className="size-2.5 rounded-full bg-line-strong" />
          <span className="size-2.5 rounded-full bg-line-strong" />
        </div>
        <div className="mx-auto flex h-6 min-w-0 max-w-64 flex-1 items-center justify-center rounded-md bg-surface px-3 text-[11px] text-ink-3">{url}</div>
        <div className="w-10" />
      </div>
      {children}
    </div>
  );
}

const SIDEBAR = [
  { icon: LayoutDashboard, label: "Overview", active: true },
  { icon: Inbox, label: "Enquiries", count: 6 },
  { icon: SquareKanban, label: "Pipeline" },
  { icon: Users, label: "Contacts" },
  { icon: CalendarDays, label: "Appointments" },
  { icon: FileText, label: "Landing pages" },
  { icon: Sparkles, label: "Xoo AI" },
];

export const SAMPLE_ENQUIRIES = [
  { name: "Sarah Mitchell", project: "Double-storey new build", where: "Merewether", fit: "Strong fit", tone: "green" as const, when: "4 min ago", unread: true },
  { name: "Daniel Okafor", project: "Kitchen renovation", where: "Charlestown", fit: "Possible fit", tone: "amber" as const, when: "38 min ago", unread: true },
  { name: "Priya Raman", project: "Granny flat", where: "Adamstown", fit: "Strong fit", tone: "green" as const, when: "2 h ago" },
  { name: "Tom Becker", project: "Extension, rear deck", where: "Maitland", fit: "Needs info", tone: "neutral" as const, when: "Yesterday" },
];

export function OverviewMock({ className }: { className?: string }) {
  return (
    <AppWindow className={className}>
      <div className="grid grid-cols-[180px_minmax(0,1fr)] max-lg:grid-cols-1">
        <aside className="border-r border-line bg-surface-2/40 p-3 max-lg:hidden" aria-hidden>
          <div className="flex items-center gap-2 px-2 pb-4 pt-1">
            <LogoMark className="h-5 w-auto" knockout="var(--surface-2)" />
            <span className="truncate text-[13px] font-semibold">Coastline Homes</span>
          </div>
          <ul className="grid gap-0.5">
            {SIDEBAR.map(({ icon: Icon, label, active, count }) => (
              <li key={label} className={cn("flex h-8 items-center gap-2.5 rounded-lg px-2 text-[13px]", active ? "bg-surface text-ink shadow-xs" : "text-ink-3")}>
                <Icon className="size-4" />
                <span className="flex-1">{label}</span>
                {count ? <span className="rounded-full bg-blue px-1.5 text-[10px] font-semibold text-white tabular">{count}</span> : null}
              </li>
            ))}
          </ul>
        </aside>
        <div className="min-w-0 p-5">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-3">Thursday</p>
              <p className="mt-0.5 font-display text-lg font-medium tracking-tight">Good morning, Jordan</p>
            </div>
            <Badge tone="teal" dot>
              Page live
            </Badge>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { k: "New enquiries", v: "6", d: "+2 today" },
              { k: "Follow-ups due", v: "3", d: "1 overdue" },
              { k: "Visits this week", v: "2", d: "Tue, Thu" },
            ].map((s) => (
              <div key={s.k} className="rounded-xl border border-line p-3">
                <p className="truncate text-[11px] text-ink-3">{s.k}</p>
                <p className="mt-1 font-display text-2xl font-medium tabular">{s.v}</p>
                <p className="text-[11px] text-ink-3">{s.d}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 overflow-hidden rounded-xl border border-line">
            <div className="flex items-center justify-between border-b border-line px-3 py-2">
              <p className="text-[12px] font-semibold">Newest enquiries</p>
              <p className="text-[11px] text-ink-3">Sorted by received</p>
            </div>
            <ul>
              {SAMPLE_ENQUIRIES.map((e) => (
                <li key={e.name} className="flex items-center gap-3 border-b border-line px-3 py-2.5 last:border-0">
                  <Avatar name={e.name} />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 truncate text-[13px] font-medium">
                      {e.unread ? <span className="size-1.5 rounded-full bg-blue" /> : null}
                      {e.name}
                    </p>
                    <p className="truncate text-[12px] text-ink-3">
                      {e.project} · {e.where}
                    </p>
                  </div>
                  <Badge tone={e.tone} className="max-sm:hidden">
                    {e.fit}
                  </Badge>
                  <span className="w-16 text-right text-[11px] text-ink-3 tabular">{e.when}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </AppWindow>
  );
}

type FactorRow = { label: string; status: "match" | "partial" | "unknown"; detail: string };

export const SAMPLE_FACTORS: FactorRow[] = [
  { label: "Service match", status: "match", detail: "You offer new builds" },
  { label: "Location coverage", status: "match", detail: "Inside Newcastle & Lake Macquarie" },
  { label: "Timing", status: "match", detail: "Wants to start in 1–3 months" },
  { label: "Budget fit", status: "partial", detail: "Stated $500k+ (no minimum set)" },
  { label: "Required answers", status: "unknown", detail: "Land ownership not answered" },
];

export function FactorIcon({ status }: { status: FactorRow["status"] | "mismatch" }) {
  const map = {
    match: { Icon: Check, cls: "bg-green-soft text-green-ink", label: "Matches" },
    partial: { Icon: Minus, cls: "bg-amber-soft text-amber-ink", label: "Partly matches" },
    mismatch: { Icon: Minus, cls: "bg-red-soft text-red-ink", label: "Does not match" },
    unknown: { Icon: CircleQuestionMark, cls: "bg-surface-2 text-ink-3", label: "Unknown" },
  }[status];
  return (
    <span className={cn("grid size-6 shrink-0 place-items-center rounded-full", map.cls)} title={map.label}>
      <map.Icon className="size-3.5" strokeWidth={2.5} aria-hidden />
      <span className="sr-only">{map.label}</span>
    </span>
  );
}

export function FitCardMock({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-line bg-surface p-5 shadow-md", className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[12px] text-ink-3">Why it fits</p>
          <p className="mt-0.5 font-display text-xl font-medium tracking-tight">Strong fit · 86</p>
        </div>
        <div className="text-right">
          <p className="text-[12px] text-ink-3">Confidence</p>
          <Badge tone="teal">High</Badge>
        </div>
      </div>
      <ul className="mt-4 grid gap-2.5">
        {SAMPLE_FACTORS.map((f) => (
          <li key={f.label} className="flex items-center gap-3">
            <FactorIcon status={f.status} />
            <div className="min-w-0">
              <p className="text-[13px] font-medium">{f.label}</p>
              <p className="truncate text-[12px] text-ink-3">{f.detail}</p>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-4 rounded-xl bg-surface-2 px-3 py-2.5 text-[12px] text-ink-2">
        <span className="font-medium text-ink">Missing:</span> land ownership, decision-maker. Ask before quoting.
      </div>
    </div>
  );
}

export function XooMock({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-line bg-surface p-5 shadow-md", className)}>
      <div className="flex items-center gap-2">
        <span className="grid size-7 place-items-center rounded-lg bg-gradient-to-br from-blue to-teal text-white">
          <Sparkles className="size-4" aria-hidden />
        </span>
        <p className="text-[13px] font-semibold">Xoo AI</p>
        <Badge tone="neutral" className="ml-auto">
          Read-only
        </Badge>
      </div>
      <div className="mt-4 ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-blue px-3.5 py-2 text-[13px] text-white">Draft a reply to Sarah asking what we still need.</div>
      <div className="mt-3 rounded-2xl rounded-bl-md border border-line bg-surface-2/60 p-3.5 text-[13px] leading-relaxed text-ink-2">
        <p>
          Sarah wants a <strong className="font-medium text-ink">double-storey new build in Merewether</strong>, starting in 1–3 months{" "}
          <span className="rounded bg-blue-soft px-1 text-[11px] text-blue">Enquiry 7F3A21C0</span>. Land ownership and the decision-maker are{" "}
          <em className="not-italic text-amber-ink">not recorded</em>.
        </p>
        <div className="mt-3 rounded-xl border border-line bg-surface p-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-3">Draft email</p>
          <p className="mt-1.5 text-ink">Hi Sarah, thanks for getting in touch about your new build in Merewether. Before we prepare anything, could you let us know whether you already own the land, and who else is involved in the decision?</p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-[12px] text-ink-3">Nothing is sent without your approval.</p>
        <span className="h-8 shrink-0 rounded-lg bg-blue px-3 text-[12px] font-medium leading-8 text-white">Copy draft</span>
      </div>
    </div>
  );
}

export function DiscoverMock({ className }: { className?: string }) {
  const rows = [
    { title: "Duplex, 2 lots — DA lodged", where: "Lambton", src: "Council DA register", seen: "Observed 3 days ago", cat: "Project opportunity" },
    { title: "Rear extension enquiry", where: "Hamilton", src: "Your landing page", seen: "Received today", cat: "Enquiry" },
    { title: "Townhouse package — tender", where: "Wallsend", src: "Licensed tender feed", seen: "Closes 28 Nov", cat: "Project opportunity" },
  ];
  return (
    <div className={cn("rounded-2xl border border-line bg-surface p-4 shadow-md", className)}>
      <div className="flex h-10 items-center gap-2 rounded-xl border border-line-strong px-3 text-[13px] text-ink-3">
        <Search className="size-4" aria-hidden />
        New builds · Newcastle · next 6 months
      </div>
      <ul className="mt-3 grid gap-2">
        {rows.map((r) => (
          <li key={r.title} className="rounded-xl border border-line p-3">
            <div className="flex items-start justify-between gap-3">
              <p className="text-[13px] font-medium">{r.title}</p>
              <Badge tone={r.cat === "Enquiry" ? "blue" : "violet"}>{r.cat}</Badge>
            </div>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-ink-3">
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" aria-hidden />
                {r.where}
              </span>
              <span>Source: {r.src}</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3.5" aria-hidden />
                {r.seen}
              </span>
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function BookingMock({ className }: { className?: string }) {
  const days = ["Mon 17", "Tue 18", "Wed 19", "Thu 20", "Fri 21"];
  const slots = ["8:00", "10:30", "13:00", "15:30"];
  return (
    <div className={cn("rounded-2xl border border-line bg-surface p-5 shadow-md", className)}>
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold">Site visit · 60 min</p>
        <p className="text-[11px] text-ink-3">Times in Australia/Sydney</p>
      </div>
      <div className="mt-4 grid grid-cols-5 gap-2">
        {days.map((d, i) => (
          <div key={d} className="grid gap-1.5">
            <p className={cn("text-center text-[11px]", i === 1 ? "font-semibold text-ink" : "text-ink-3")}>{d}</p>
            {slots.map((s, j) => {
              const taken = (i + j) % 3 === 0;
              const picked = i === 1 && j === 1;
              return (
                <span
                  key={s}
                  className={cn(
                    "grid h-8 place-items-center rounded-lg text-[11px] tabular",
                    picked ? "bg-blue font-semibold text-white" : taken ? "bg-surface-2 text-ink-3 line-through" : "border border-line text-ink-2",
                  )}
                >
                  {s}
                </span>
              );
            })}
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-3 rounded-xl bg-green-soft px-3 py-2.5 text-[12px] text-green-ink">
        <Check className="size-4 shrink-0" aria-hidden />
        Booked Tue 18 Nov, 10:30 · confirmation needs your approval to send
      </div>
    </div>
  );
}

export function PipelineMock({ className }: { className?: string }) {
  const cols = [
    { name: "Qualified", tone: "teal" as const, cards: [{ t: "Granny flat", v: "$165k" }] },
    { name: "Proposal", tone: "green" as const, cards: [{ t: "Kitchen renovation", v: "$48k" }, { t: "Rear extension", v: "$92k" }] },
    { name: "Won", tone: "green" as const, cards: [{ t: "Double-storey build", v: "$612k" }] },
  ];
  return (
    <div className={cn("rounded-2xl border border-line bg-surface p-4 shadow-md", className)}>
      <div className="flex items-end justify-between px-1">
        <div>
          <p className="text-[12px] text-ink-3">Won this quarter</p>
          <p className="font-display text-2xl font-medium tabular">$612,000</p>
        </div>
        <div className="flex h-12 items-end gap-1.5" aria-hidden>
          {[30, 42, 38, 55, 48, 70, 88].map((h, i) => (
            <span key={i} className="w-3 rounded-t-[3px] bg-teal/80" style={{ height: `${h}%`, opacity: 0.45 + i * 0.08 }} />
          ))}
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {cols.map((c) => (
          <div key={c.name} className="min-w-0 rounded-xl bg-surface-2/70 p-2">
            <p className="px-1 pb-2 text-[11px] font-medium text-ink-3">{c.name}</p>
            <div className="grid gap-1.5">
              {c.cards.map((card) => (
                <div key={card.t} className="min-w-0 rounded-lg border border-line bg-surface p-2 shadow-xs">
                  <p className="truncate text-[12px] font-medium">{card.t}</p>
                  <p className="text-[11px] text-ink-3 tabular">{card.v}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PhonePageMock({ className }: { className?: string }) {
  return (
    <div className={cn("relative mx-auto w-[280px] rounded-[44px] border-[10px] border-[#0b1626] bg-[#0b1626] shadow-lg", className)}>
      <div className="overflow-hidden rounded-[34px] bg-white text-[#0a1a33]">
        <div className="flex items-center justify-between px-5 pb-2 pt-3 text-[10px] font-semibold">
          <span>9:41</span>
          <span className="h-5 w-20 rounded-full bg-[#0b1626]" />
          <span>100%</span>
        </div>
        <div className="bg-[linear-gradient(160deg,#102c50,#06326a)] px-5 pb-6 pt-4 text-white">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] opacity-70">Coastline Homes</p>
          <p className="mt-2 font-display text-[22px] font-medium leading-[1.1] tracking-tight">New homes across Newcastle & the Lake</p>
          <p className="mt-2 text-[11px] leading-relaxed opacity-80">Tell us what you have in mind. We reply within 4 business hours.</p>
        </div>
        <div className="grid gap-2.5 p-4">
          {["Your name", "Email or phone", "Where is the project?"].map((l) => (
            <div key={l} className="h-9 rounded-lg border border-[#cbd5e1] px-3 text-[11px] leading-9 text-[#5f6e85]">
              {l}
            </div>
          ))}
          <div className="flex gap-1.5">
            {["Own the land", "Buying", "Not sure"].map((c, i) => (
              <span key={c} className={cn("rounded-full border px-2.5 py-1 text-[10px]", i === 0 ? "border-[#2563eb] bg-[#e8efff] text-[#2563eb]" : "border-[#cbd5e1] text-[#33445e]")}>
                {c}
              </span>
            ))}
          </div>
          <div className="mt-1 h-10 rounded-lg bg-[#2563eb] text-center text-[12px] font-semibold leading-10 text-white">Request a quote</div>
          <p className="text-center text-[9px] text-[#5f6e85]">Your details go only to Coastline Homes.</p>
        </div>
      </div>
    </div>
  );
}
