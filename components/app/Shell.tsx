"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Bell,
  CalendarDays,
  ChartColumn,
  ChevronsUpDown,
  CircleQuestionMark,
  Compass,
  FileText,
  Handshake,
  Inbox,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Settings,
  Sparkles,
  SquareKanban,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { Logo, LogoMark } from "@/components/brand/Logo";
import { Avatar } from "@/components/ui";
import { AvatarStack } from "@/components/app/dash";
import { signOut } from "@/features/auth/actions";
import { switchOrganization } from "@/features/workspace/actions";
import { cn } from "@/lib/cn";

type NavItem = { href: string; label: string; icon: LucideIcon; badge?: number; exact?: boolean };

export type ShellProps = {
  orgName: string;
  orgs: { id: string; name: string }[];
  activeOrgId: string;
  userName: string;
  userEmail: string;
  team: string[];
  today: string;
  counts: { unreviewed: number; overdue: number; notifications: number };
  initialCollapsed: boolean;
  children: React.ReactNode;
};

const COOKIE = "brexoo_sidebar";

export function Shell({ orgName, orgs, activeOrgId, userName, userEmail, team, today, counts, initialCollapsed, children }: ShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const deskSearch = useRef<HTMLInputElement>(null);
  const mobileSearch = useRef<HTMLInputElement>(null);

  // Escape closes the drawer; ⌘K / Ctrl+K focuses search instantly (frequent action: no animation).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const desktop = window.matchMedia("(min-width: 1024px)").matches;
        if (desktop) setCollapsed(false);
        else setOpen(true);
        requestAnimationFrame(() => (desktop ? deskSearch : mobileSearch).current?.focus());
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    document.cookie = `${COOKIE}=${next ? "1" : "0"}; path=/; max-age=31536000; samesite=lax`;
  };

  const groups: { label: string; items: NavItem[] }[] = [
    {
      label: "Main menu",
      items: [
        { href: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
        { href: "/app/discover", label: "Discover", icon: Compass },
        { href: "/app/enquiries", label: "Leads", icon: Inbox, badge: counts.unreviewed },
        { href: "/app/pipeline", label: "Pipeline", icon: SquareKanban },
        { href: "/app/tasks", label: "Tasks", icon: ListTodo, badge: counts.overdue },
        { href: "/app/appointments", label: "Appointments", icon: CalendarDays },
        { href: "/app/clients", label: "Clients", icon: Handshake },
        { href: "/app/contacts", label: "Contacts", icon: Users },
      ],
    },
    {
      label: "Grow",
      items: [
        { href: "/app/landing-pages", label: "Landing pages", icon: FileText },
        { href: "/app/reports", label: "Reports", icon: ChartColumn },
        { href: "/app/brex-ai", label: "Brex AI", icon: Sparkles },
      ],
    },
    {
      label: "Account",
      items: [
        { href: "/app/settings", label: "Settings", icon: Settings },
      ],
    },
  ];
  const isActive = (item: NavItem) => (item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/"));

  const sidebar = (mobile: boolean) => {
    const compact = collapsed && !mobile;
    return (
      <div className="flex h-full flex-col text-white/75" onClick={(e) => mobile && (e.target as HTMLElement).closest("a") && setOpen(false)}>
        <div className={cn("flex h-16 shrink-0 items-center border-b border-white/10", compact ? "justify-center px-2" : "justify-between px-5")}>
          <Link href="/app" aria-label="Brexoo overview">
            {compact ? <LogoMark className="h-7 w-auto" color="#fff" /> : <Logo tone="white" size="sm" />}
          </Link>
          {mobile ? (
            <button type="button" onClick={() => setOpen(false)} className="grid size-9 place-items-center rounded-lg text-white/70" aria-label="Close navigation">
              <X className="size-5" />
            </button>
          ) : !compact ? (
            <button type="button" onClick={toggle} className="grid size-8 place-items-center rounded-lg border border-white/15 text-white/70 hover:bg-white/10 hover:text-white" aria-label="Collapse sidebar">
              <PanelLeftClose className="size-4" />
            </button>
          ) : null}
        </div>

        <div className={cn("pt-4", compact ? "px-2" : "px-4")}>
          {compact ? (
            <button type="button" onClick={toggle} className="mx-auto grid size-10 place-items-center rounded-xl border border-white/15 text-white/70 hover:bg-white/10 hover:text-white" aria-label="Expand sidebar">
              <PanelLeftOpen className="size-4" />
            </button>
          ) : (
            <>
              <OrgSwitcher orgName={orgName} orgs={orgs} activeOrgId={activeOrgId} />
              <form
                role="search"
                className="relative mt-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  const q = String(new FormData(e.currentTarget).get("q") ?? "").trim();
                  setOpen(false);
                  router.push(`/app/enquiries?status=all${q ? `&q=${encodeURIComponent(q)}` : ""}`);
                }}
              >
                <label htmlFor={mobile ? "nav-search-m" : "nav-search"} className="sr-only">
                  Search enquiries
                </label>
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/55" aria-hidden />
                <input
                  ref={mobile ? mobileSearch : deskSearch}
                  id={mobile ? "nav-search-m" : "nav-search"}
                  name="q"
                  placeholder="Search"
                  autoComplete="off"
                  className="h-10 w-full rounded-xl border border-white/15 bg-white/5 pl-9 pr-12 text-[14px] text-white outline-none placeholder:text-white/50 focus:border-white/40 focus:bg-white/10"
                />
                <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded-md border border-white/15 bg-white/10 px-1.5 py-0.5 font-sans text-[11px] text-white/70">⌘K</kbd>
              </form>
            </>
          )}
        </div>

        <nav aria-label="Workspace" className={cn("mt-5 flex-1 overflow-y-auto pb-4 [@media(max-height:960px)]:mt-3", compact ? "px-2" : "px-3")}>
          {groups.map((g) => (
            <div key={g.label} className="mt-5 first:mt-0 [@media(max-height:960px)]:mt-3.5">
              {compact ? <div className="mx-3 mb-2 border-t border-white/10" /> : <p className="px-2.5 pb-2 text-[12px] font-medium text-white/50">{g.label}</p>}
              <ul className="grid gap-1">
                {g.items.map((item) => {
                  const active = isActive(item);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        title={compact ? item.label : undefined}
                        className={cn(
                          "type-sidebar group relative flex h-10 items-center rounded-xl [@media(max-height:960px)]:h-9 transition-colors duration-150",
                          compact ? "justify-center" : "gap-3 px-3",
                          active ? "bg-white/10 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]" : "hover:bg-white/5 hover:text-white",
                        )}
                      >
                        <item.icon className={cn("size-[18px] shrink-0", active ? "text-teal" : "text-white/60 group-hover:text-white")} aria-hidden />
                        {compact ? <span className="sr-only">{item.label}</span> : <span className="flex-1 truncate">{item.label}</span>}
                        {item.badge ? (
                          compact ? (
                            <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-teal" aria-label={`${item.badge} needing attention`} />
                          ) : (
                            <span className="min-w-6 rounded-md bg-white/15 px-1.5 text-center text-[11px] font-medium leading-5 text-white tabular">
                              {item.badge > 99 ? "99+" : item.badge}
                              <span className="sr-only"> needing attention</span>
                            </span>
                          )
                        ) : null}
                        {active && !compact ? <span aria-hidden className="absolute -right-3 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-l-full bg-teal" /> : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className={cn("shrink-0 border-t border-white/10", compact ? "p-2" : "p-3")}>
          <div className={cn("flex items-center rounded-xl bg-white/5 ring-1 ring-white/10", compact ? "flex-col gap-2 p-2" : "gap-2.5 p-2.5")}>
            <Avatar name={userName || userEmail} className="size-8" />
            {!compact ? (
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-white">{userName || "Your account"}</p>
                <p className="truncate text-[11px] text-white/55">{userEmail}</p>
              </div>
            ) : null}
            <form action={signOut}>
              <button type="submit" className="pressable grid size-8 place-items-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white" aria-label="Log out">
                <LogOut className="size-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  };

  const first = userName.split(" ")[0];

  return (
    <div className={cn("min-h-dvh bg-canvas lg:grid", collapsed ? "lg:grid-cols-[76px_minmax(0,1fr)]" : "lg:grid-cols-[264px_minmax(0,1fr)]")}>
      <aside className="sticky top-0 hidden h-dvh bg-midnight lg:block">{sidebar(false)}</aside>

      <div className={cn("fixed inset-0 z-50 lg:hidden", open ? "pointer-events-auto" : "pointer-events-none")} aria-hidden={!open}>
        <div className={cn("absolute inset-0 bg-black/40 transition-opacity duration-200", open ? "opacity-100" : "opacity-0")} onClick={() => setOpen(false)} />
        <div
          id="app-nav"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
          inert={!open}
          className={cn(
            "absolute inset-y-0 left-0 w-[86%] max-w-[300px] bg-midnight shadow-lg transition-transform duration-300 [transition-timing-function:var(--ease-drawer)]",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          {sidebar(true)}
        </div>
      </div>

      <div className="min-w-0">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-2 border-b border-line bg-surface/90 px-3 backdrop-blur-xl sm:gap-3 sm:px-6">
          <button type="button" className="pressable grid size-10 shrink-0 place-items-center rounded-lg lg:hidden" aria-label="Open navigation" aria-expanded={open} aria-controls="app-nav" onClick={() => setOpen(true)}>
            <Menu className="size-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-medium leading-tight">{first ? `Welcome back, ${first}` : orgName}</p>
            <p className="truncate text-[12px] text-ink-3">
              {today} · {orgName}
            </p>
          </div>
          <div className="hidden items-center gap-1.5 md:flex">
            <AvatarStack names={team} max={3} />
            <Link href="/app/settings/team" className="pressable grid size-8 place-items-center rounded-full border border-line-strong text-ink-2 hover:bg-surface-2" aria-label="Invite a teammate">
              <Plus className="size-4" />
            </Link>
          </div>
          <span className="mx-1 hidden h-6 w-px bg-line md:block" aria-hidden />
          <Link href="/how-it-works" target="_blank" className="pressable hidden size-10 place-items-center rounded-lg text-ink-2 hover:bg-surface-2 sm:grid" aria-label="Help: how Brexoo works (opens in a new tab)">
            <CircleQuestionMark className="size-5" />
          </Link>
          <Link href="/app/notifications" className="pressable relative grid size-10 shrink-0 place-items-center rounded-lg text-ink-2 hover:bg-surface-2" aria-label={counts.notifications ? `Notifications: ${counts.notifications} new` : "Notifications"}>
            <Bell className="size-5" />
            {counts.notifications ? (
              <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#e5533d] px-1 text-[10px] font-medium leading-none text-white ring-2 ring-surface tabular">{counts.notifications > 99 ? "99+" : counts.notifications}</span>
            ) : null}
          </Link>
          <Link href="/app/brex-ai" className="pressable inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-midnight px-3 text-[14px] font-medium text-white hover:bg-midnight-hover dark:bg-blue dark:text-on-blue">
            <Sparkles className="size-4" aria-hidden />
            <span className="max-sm:sr-only">Ask Brex AI</span>
          </Link>
        </header>
        {children}
      </div>
    </div>
  );
}

function OrgSwitcher({ orgName, orgs, activeOrgId }: { orgName: string; orgs: { id: string; name: string }[]; activeOrgId: string }) {
  const content = (
    <>
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/10 text-[13px] font-medium text-white">{orgName.slice(0, 1).toUpperCase()}</span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block text-[11px] text-white/50">Workspace</span>
        <span className="block truncate text-[14px] font-medium text-white">{orgName}</span>
      </span>
    </>
  );
  if (orgs.length < 2) return <div className="flex items-center gap-2.5 rounded-xl border border-white/10 p-2">{content}</div>;
  return (
    <details className="group relative">
      <summary className="flex cursor-pointer list-none items-center gap-2.5 rounded-xl border border-white/10 p-2 hover:bg-white/5 [&::-webkit-details-marker]:hidden">
        {content}
        <ChevronsUpDown className="size-4 text-white/50" aria-hidden />
      </summary>
      <div className="absolute inset-x-0 top-full z-10 mt-1 rounded-xl border border-line bg-surface p-1 text-ink shadow-lg">
        {orgs.map((o) => (
          <form key={o.id} action={switchOrganization}>
            <input type="hidden" name="organization_id" value={o.id} />
            <button type="submit" className={cn("flex w-full items-center rounded-lg px-3 py-2 text-left text-[14px] hover:bg-surface-2", o.id === activeOrgId && "font-medium")}>
              {o.name}
            </button>
          </form>
        ))}
        <Link href="/app/setup?new=1" className="block rounded-lg px-3 py-2 text-[14px] text-blue hover:bg-surface-2">
          New organisation
        </Link>
      </div>
    </details>
  );
}
