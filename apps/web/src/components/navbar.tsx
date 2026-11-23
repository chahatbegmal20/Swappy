"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  Upload,
  TrendingUp,
  LogOut,
  User,
  Menu,
  X,
} from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const appLinks = [
  { href: "/dashboard", label: "Command", icon: BarChart3 },
  { href: "/upload", label: "Score", icon: Upload },
  { href: "/trends", label: "Radar", icon: TrendingUp },
  { href: "/settings", label: "Atelier", icon: User },
];

const marketingLinks = [
  { href: "/#try-score", label: "Try demo" },
  { href: "/#explore", label: "Explore" },
  { href: "/#experience", label: "Experience" },
  { href: "/trends", label: "Radar" },
];

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMarketing = pathname === "/";

  function handleLogout() {
    api.setToken(null);
    logout();
    setMobileOpen(false);
    router.push("/auth/login");
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-atelier/80",
        isMarketing ? "bg-canvas/70 backdrop-blur-xl" : "glass",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="font-display text-lg font-semibold tracking-tight">
          <span className="text-pearl">Swappy</span>{" "}
          <span className="text-champagne">Studio</span>
        </Link>

        {isAuthenticated ? (
          <nav className="hidden items-center gap-1 md:flex">
            {appLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  pathname === href
                    ? "bg-surface-raised text-pearl"
                    : "text-muted-atelier hover:bg-surface-raised/60 hover:text-pearl",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>
        ) : (
          <nav className="hidden items-center gap-6 md:flex">
            {marketingLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-sm text-muted-atelier transition-colors hover:text-pearl"
              >
                {label}
              </Link>
            ))}
          </nav>
        )}

        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated ? (
            <>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-champagne text-sm font-semibold text-canvas">
                  {user?.name?.charAt(0).toUpperCase() ?? (
                    <User className="h-4 w-4" />
                  )}
                </div>
                <span className="text-sm font-medium text-muted-atelier">
                  {user?.name}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-muted-atelier transition-colors hover:bg-surface-raised hover:text-pearl"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="rounded-lg px-4 py-2 text-sm font-medium text-muted-atelier transition-colors hover:text-pearl"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="cta-primary rounded-xl px-4 py-2 text-sm font-semibold"
              >
                Enter Studio
              </Link>
            </>
          )}
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="inline-flex items-center justify-center rounded-lg p-2 text-muted-atelier hover:bg-surface-raised hover:text-pearl md:hidden"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-atelier px-4 pb-4 pt-2 md:hidden">
          {isAuthenticated ? (
            <nav className="flex flex-col gap-1">
              {appLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    pathname === href
                      ? "bg-surface-raised text-pearl"
                      : "text-muted-atelier hover:bg-surface-raised/60 hover:text-pearl",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
            </nav>
          ) : (
            <nav className="flex flex-col gap-1">
              {marketingLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm text-muted-atelier hover:text-pearl"
                >
                  {label}
                </Link>
              ))}
            </nav>
          )}

          <div className="mt-3 flex flex-col gap-2 border-t border-atelier pt-3">
            {isAuthenticated ? (
              <>
                <div className="flex items-center gap-2 px-3 py-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-champagne text-sm font-semibold text-canvas">
                    {user?.name?.charAt(0).toUpperCase() ?? (
                      <User className="h-4 w-4" />
                    )}
                  </div>
                  <span className="text-sm font-medium text-muted-atelier">
                    {user?.name}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-muted-atelier hover:text-pearl"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-atelier hover:text-pearl"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  onClick={() => setMobileOpen(false)}
                  className="cta-primary rounded-xl px-3 py-2.5 text-center text-sm font-semibold"
                >
                  Enter Studio
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
