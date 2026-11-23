"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Upload,
  TrendingUp,
  Sparkles,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const LANES: {
  href: string;
  label: string;
  hint: string;
  icon: LucideIcon;
  soon?: boolean;
}[] = [
  {
    href: "/dashboard",
    label: "Command",
    hint: "Overview",
    icon: LayoutDashboard,
  },
  {
    href: "/upload",
    label: "Score",
    hint: "Predict",
    icon: Upload,
  },
  {
    href: "/trends",
    label: "Radar",
    hint: "Trends",
    icon: TrendingUp,
  },
  {
    href: "/dashboard#agents",
    label: "Agents",
    hint: "Create",
    icon: Sparkles,
    soon: true,
  },
  {
    href: "/settings",
    label: "Atelier",
    hint: "Settings",
    icon: Settings,
  },
];

export function StudioShell({
  children,
  title,
  subtitle,
  actions,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-canvas">
      <div
        className="pointer-events-none absolute inset-x-0 top-16 h-64 opacity-80"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 20% 0%, rgba(196,184,165,0.08), transparent 55%)",
        }}
        aria-hidden
      />

      <div className="relative mx-auto flex max-w-[1400px] gap-0 lg:gap-8 px-4 py-6 sm:px-6 lg:px-8">
        {/* Experience lanes */}
        <aside className="sticky top-24 hidden h-[calc(100vh-8rem)] w-52 shrink-0 flex-col lg:flex">
          <p className="font-display mb-4 text-[10px] tracking-[0.28em] text-champagne uppercase">
            Experience center
          </p>
          <nav className="flex flex-1 flex-col gap-1.5">
            {LANES.map((lane) => {
              const active =
                !lane.soon &&
                (pathname === lane.href ||
                  (lane.href !== "/dashboard" &&
                    pathname.startsWith(lane.href)));
              const Icon = lane.icon;
              return (
                <Link
                  key={lane.href}
                  href={lane.soon ? "/dashboard#agents" : lane.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl border px-3 py-3 transition-all",
                    active
                      ? "border-champagne/40 bg-champagne/10 text-pearl"
                      : "border-transparent text-muted-atelier hover:border-atelier hover:bg-surface hover:text-pearl",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg border",
                      active
                        ? "border-champagne/30 bg-canvas text-champagne"
                        : "border-atelier bg-surface-raised text-muted-atelier group-hover:text-pearl",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{lane.label}</span>
                    <span className="block text-[11px] text-muted-atelier">
                      {lane.soon ? "Coming soon" : lane.hint}
                    </span>
                  </span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="min-w-0 flex-1 pb-16">
          {/* Mobile lane strip */}
          <div className="mb-6 flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {LANES.map((lane) => {
              const active = !lane.soon && pathname === lane.href;
              const Icon = lane.icon;
              return (
                <Link
                  key={lane.href}
                  href={lane.soon ? "/dashboard#agents" : lane.href}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-xs",
                    active
                      ? "border-champagne/40 bg-champagne/10 text-pearl"
                      : "border-atelier text-muted-atelier",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {lane.label}
                </Link>
              );
            })}
          </div>

          <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="font-display text-3xl font-semibold tracking-tight text-pearl sm:text-4xl">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-2 max-w-xl text-sm text-muted-atelier sm:text-base">
                  {subtitle}
                </p>
              )}
            </div>
            {actions && (
              <div className="flex flex-wrap items-center gap-2">{actions}</div>
            )}
          </header>

          {children}
        </div>
      </div>
    </div>
  );
}
