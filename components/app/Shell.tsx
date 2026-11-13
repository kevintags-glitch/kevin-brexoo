"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  CalendarDays,
  ChartColumn,
  ChevronsUpDown,
  FileText,
  Inbox,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Menu,
  Settings,
  Sparkles,
  SquareKanban,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { LogoMark } from "@/components/brand/Logo";
import { Avatar } from "@/components/ui";
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
  counts: { unreviewed: number; overdue: number };
  children: React.ReactNode;
};

export function Shell({ orgName, orgs, activeOrgId, userName, userEmail, counts, children }: ShellProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const groups: { label?: string; items: NavItem[] }[] = [
    {
      items: [
        { href: "/app", label: "Overview", icon: LayoutDashboard, exact: true },
        { href: "/app/enquiries", label: "Enquiries", icon: Inbox, badge: counts.unreviewed },
        { href: "/app/pipeline", label: "Pipeline", icon: SquareKanban },
        { href: "/app/tasks", label: "Tasks", icon: ListTodo, badge: counts.overdue },
        { href: "/app/appointments", label: "Appointments", icon: CalendarDays },
        { href: "/app/contacts", label: "Contacts", icon: Users },
      ],
    },
    {
      label: "Grow",
      items: [
        { href: "/app/landing-pages", label: "Landing pages", icon: FileText },
        { href: "/app/reports", label: "Reports", icon: ChartColumn },
        { href: "/app/xoo", label: "Xoo AI", icon: Sparkles },
      ],
    },
  ];

  const isActive = (item: NavItem) => (item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/"));

  const nav = (
    <div className="flex h-full flex-col">
      <OrgSwitcher orgName={orgName} orgs={orgs} activeOrgId={activeOrgId} />
      <nav aria-label="Workspace" className="mt-2 flex-1 overflow-y-auto px-3 pb-4" onClick={(e) => (e.target as HTMLElement).closest("a") && setOpen(false)}>
        {groups.map((g, gi) => (
          <div key={gi} className={cn(gi > 0 && "mt-6")}>
            {g.label ? <p className="px-2.5 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-3">{g.label}</p> : null}
            <ul className="grid gap-0.5">
              {g.items.map((item) => {
                const active = isActive(item);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-[14px] transition-colors duration-150",
                        active ? "bg-surface text-ink shadow-xs ring-1 ring-line" : "text-ink-2 hover:bg-surface-2 hover:text-ink",
                      )}
                    >
                      <item.icon className={cn("size-[18px] shrink-0", active ? "text-blue" : "text-ink-3 group-hover:text-ink-2")} aria-hidden />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge ? (
                        <span className="min-w-5 rounded-full bg-blue px-1.5 text-center text-[11px] font-semibold leading-5 text-on-blue tabular">
                          {item.badge > 99 ? "99+" : item.badge}
                          <span className="sr-only"> needing attention</span>
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-line p-3">
        <Link
          href="/app/settings"
          aria-current={pathname.startsWith("/app/settings") ? "page" : undefined}
          className="flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-[14px] text-ink-2 hover:bg-surface-2 hover:text-ink aria-[current=page]:bg-surface aria-[current=page]:text-ink"
        >
          <Settings className="size-[18px] text-ink-3" aria-hidden />
          Settings
        </Link>
        <div className="mt-2 flex items-center gap-2.5 rounded-lg px-2.5 py-2">
          <Avatar name={userName || userEmail} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium">{userName || "Your account"}</p>
            <p className="truncate text-[12px] text-ink-3">{userEmail}</p>
          </div>
          <form action={signOut}>
            <button type="submit" className="pressable grid size-8 place-items-center rounded-lg text-ink-3 hover:bg-surface-2 hover:text-ink" aria-label="Log out">
              <LogOut className="size-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-dvh border-r border-line bg-surface-2/50 lg:block">{nav}</aside>

      <div className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-line bg-canvas/85 px-3 backdrop-blur-xl lg:hidden">
        <button
          type="button"
          className="pressable grid size-10 place-items-center rounded-lg"
          aria-label="Open navigation"
          aria-expanded={open}
          aria-controls="app-nav"
          onClick={() => setOpen(true)}
        >
          <Menu className="size-5" />
        </button>
        <LogoMark className="h-6 w-auto" knockout="var(--canvas)" />
        <span className="truncate text-[15px] font-semibold">{orgName}</span>
        <Link href="/app/xoo" className="pressable ml-auto grid size-10 place-items-center rounded-lg text-blue" aria-label="Ask Xoo AI">
          <Sparkles className="size-5" />
        </Link>
      </div>

      <div
        className={cn("fixed inset-0 z-50 lg:hidden", open ? "pointer-events-auto" : "pointer-events-none")}
        aria-hidden={!open}
      >
        <div
          className={cn("absolute inset-0 bg-black/30 transition-opacity duration-200", open ? "opacity-100" : "opacity-0")}
          onClick={() => setOpen(false)}
        />
        <div
          id="app-nav"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
          className={cn(
            "absolute inset-y-0 left-0 w-[86%] max-w-[300px] bg-canvas shadow-lg transition-transform duration-300 [transition-timing-function:var(--ease-drawer)]",
            open ? "translate-x-0" : "-translate-x-full",
          )}
          inert={!open}
        >
          <button type="button" onClick={() => setOpen(false)} className="absolute right-2 top-3 grid size-10 place-items-center rounded-lg text-ink-3" aria-label="Close navigation">
            <X className="size-5" />
          </button>
          {nav}
        </div>
      </div>

      <div className="min-w-0">{children}</div>
    </div>
  );
}

function OrgSwitcher({ orgName, orgs, activeOrgId }: { orgName: string; orgs: { id: string; name: string }[]; activeOrgId: string }) {
  const content = (
    <>
      <span className="grid size-8 place-items-center rounded-lg bg-surface shadow-xs ring-1 ring-line">
        <LogoMark className="h-[18px] w-auto" />
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate text-[14px] font-semibold">{orgName}</span>
        <span className="block text-[12px] text-ink-3">Brexoo workspace</span>
      </span>
    </>
  );
  if (orgs.length < 2) return <div className="flex h-16 items-center gap-2.5 px-4">{content}</div>;
  return (
    <details className="group relative px-2 pt-2">
      <summary className="flex h-14 cursor-pointer list-none items-center gap-2.5 rounded-xl px-2 hover:bg-surface-2 [&::-webkit-details-marker]:hidden">
        {content}
        <ChevronsUpDown className="size-4 text-ink-3" aria-hidden />
      </summary>
      <div className="absolute inset-x-2 top-full z-10 mt-1 rounded-xl border border-line bg-surface p-1 shadow-lg">
        {orgs.map((o) => (
          <form key={o.id} action={switchOrganization}>
            <input type="hidden" name="organization_id" value={o.id} />
            <button type="submit" className={cn("flex w-full items-center rounded-lg px-3 py-2 text-left text-[14px] hover:bg-surface-2", o.id === activeOrgId && "font-semibold")}>
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
