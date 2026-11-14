"use client";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { cn } from "@/lib/cn";
import { BrandIcon, type BrandIconName } from "./brand-icons";
import { AppWindow } from "./mocks";

export type CrmScreen = { id: string; label: string; icon: BrandIconName; src: string; url: string; title: string; body: string };

/** Real screens from the Coastline Homes sample workspace (a builder in Newcastle, NSW). */
export const CRM_SCREENS: CrmScreen[] = [
  { id: "overview", label: "Dashboard", icon: "report", src: "/media/screens/overview.webp", url: "app.brexoo.com/app", title: "The whole business at a glance", body: "New enquiries, first-response time, booked visits and won work, compared with the last period." },
  { id: "leads", label: "Leads", icon: "inbox", src: "/media/screens/enquiries.webp", url: "app.brexoo.com/app/enquiries", title: "Every lead in one list", body: "Filter by status, service, fit and owner. Each lead shows where it came from and what stage it's at." },
  { id: "lead", label: "Lead detail", icon: "fit", src: "/media/screens/lead.webp", url: "app.brexoo.com/app/opportunities", title: "Fit you can explain", body: "Service, location, timing and budget, each scored with its reason, beside the enquiry, contact and next task." },
  { id: "pipeline", label: "Pipeline", icon: "pipeline", src: "/media/screens/pipeline.webp", url: "app.brexoo.com/app/pipeline", title: "A pipeline that keeps moving", body: "From new to won, with the value of open work and what each stage means." },
  { id: "calendar", label: "Calendar", icon: "calendar", src: "/media/screens/appointments.webp", url: "app.brexoo.com/app/appointments", title: "Bookings and site visits", body: "Calls, video meetings and site visits in your own time zone, with requests from your page." },
  { id: "discover", label: "Discover", icon: "discover", src: "/media/screens/discover.webp", url: "app.brexoo.com/app/discover", title: "Projects worth quoting", body: "Project records from sources you've approved, ranked by how well they match your services and areas." },
  { id: "clients", label: "Clients", icon: "client", src: "/media/screens/clients.webp", url: "app.brexoo.com/app/clients", title: "Clients and repeat work", body: "Every won job becomes a client, with won value, average job and repeat business." },
  { id: "reports", label: "Reports", icon: "growth", src: "/media/screens/reports.webp", url: "app.brexoo.com/app/reports", title: "Measured on outcomes", body: "Response time, qualification rate, show rate and win rate, plus pipeline by stage and by service." },
];

const DURATION = 6000;

/**
 * A presentation of the customer workspace: tabs along the top, a real screenshot in a browser
 * frame, and a caption. Advances on its own (paused on hover, focus or reduced motion) and follows
 * the WAI-ARIA tabs pattern.
 */
export function CrmShowcase({ screens = CRM_SCREENS }: { screens?: CrmScreen[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [cycle, setCycle] = useState(0);
  const reduce = useReducedMotion();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (paused || reduce) return;
    const t = window.setTimeout(() => setActive((a) => (a + 1) % screens.length), DURATION);
    return () => window.clearTimeout(t);
  }, [active, paused, reduce, screens.length, cycle]);

  const select = (i: number, focus = false) => {
    setActive(i);
    setCycle((c) => c + 1);
    if (focus) refs.current[i]?.focus();
  };
  const onKey = (e: KeyboardEvent) => {
    const map: Record<string, number> = { ArrowRight: active + 1, ArrowLeft: active - 1, Home: 0, End: screens.length - 1 };
    if (!(e.key in map)) return;
    e.preventDefault();
    select((map[e.key]! + screens.length) % screens.length, true);
  };
  const s = screens[active]!;

  return (
    <div onPointerEnter={() => setPaused(true)} onPointerLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
      <div role="tablist" aria-label="Workspace screens" onKeyDown={onKey} className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:justify-center sm:px-0">
        {screens.map((t, i) => (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            role="tab"
            id={`crm-tab-${t.id}`}
            aria-selected={i === active}
            aria-controls="crm-panel"
            tabIndex={i === active ? 0 : -1}
            onClick={() => select(i)}
            className={cn(
              "relative flex shrink-0 items-center gap-2 overflow-hidden rounded-full border py-1.5 pl-1.5 pr-4 text-[14px] font-medium transition-colors",
              i === active ? "border-ink/10 bg-white text-ink shadow-sm" : "border-transparent text-ink-3 hover:bg-white/70 hover:text-ink",
            )}
          >
            <BrandIcon name={t.icon} tone={i === active ? "navy" : "cloud"} className="size-7" />
            {t.label}
            {i === active && !reduce ? (
              <motion.span key={`${cycle}-${active}-${paused}`} aria-hidden className="absolute inset-x-3 bottom-0 h-[2px] origin-left rounded-full bg-blue" initial={{ scaleX: 0 }} animate={{ scaleX: paused ? 0 : 1 }} transition={{ duration: paused ? 0 : DURATION / 1000, ease: "linear" }} />
            ) : null}
          </button>
        ))}
      </div>

      <div id="crm-panel" role="tabpanel" aria-labelledby={`crm-tab-${s.id}`} className="relative mt-8">
        <div aria-hidden className="pointer-events-none absolute -inset-x-6 -inset-y-8 rounded-[40px] bg-[radial-gradient(60%_60%_at_50%_40%,rgb(59_130_246/0.14),transparent_70%)]" />
        <AppWindow url={s.url} className="relative mx-auto max-w-[1080px] shadow-2xl">
          <div className="relative aspect-[1440/900] bg-surface-2">
            <AnimatePresence initial={false}>
              <motion.div key={s.id} className="absolute inset-0" initial={{ opacity: 0, scale: reduce ? 1 : 1.01 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}>
                <Image src={s.src} alt={`${s.label} screen in the Brexoo workspace: ${s.title.toLowerCase()}.`} fill sizes="(min-width: 1120px) 1080px, 100vw" className="object-cover object-top" priority={active === 0} />
              </motion.div>
            </AnimatePresence>
          </div>
        </AppWindow>
        <div className="mx-auto mt-8 max-w-[640px] text-center" aria-live="polite">
          <p className="type-card text-ink">{s.title}</p>
          <p className="type-body mt-2 text-ink-2">{s.body}</p>
        </div>
      </div>
    </div>
  );
}
