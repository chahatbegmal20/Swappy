"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SocialAuth } from "@/components/social-auth";

type Tab = "email" | "social";

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) router.replace("/dashboard");
  }, [isAuthenticated, router]);

  const [tab, setTab] = useState<Tab>("social");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { access_token, user } = await api.login(email, password);
      api.setToken(access_token);
      setUser(user);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative grid min-h-[calc(100vh-4rem)] lg:grid-cols-2">
      <div
        className="relative hidden overflow-hidden lg:block"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 40% 40%, rgba(196,184,165,0.16), transparent 55%), radial-gradient(ellipse 50% 40% at 80% 20%, rgba(91,143,168,0.14), transparent 50%), #070708",
        }}
      >
        <div className="atelier-grain absolute inset-0" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <p className="font-display text-xs tracking-[0.28em] text-champagne uppercase">
            Swappy Studio
          </p>
          <div>
            <h2 className="font-display text-4xl font-semibold leading-tight text-pearl xl:text-5xl">
              Return to the
              <br />
              experience center.
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-atelier">
              Score drafts, read the radar, and — soon — create with agents. One
              atelier for every finest detail of your content.
            </p>
          </div>
          <p className="text-xs text-muted-atelier">Intelligence today. Agents next.</p>
        </div>
      </div>

      <div className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <p className="font-display text-xs tracking-[0.28em] text-champagne uppercase">
              Swappy Studio
            </p>
          </div>
          <h1 className="font-display text-3xl font-semibold text-pearl">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-muted-atelier">
            Sign in to continue in the studio
          </p>

          <div className="mt-8 flex rounded-xl border border-atelier bg-surface p-1">
            <button
              type="button"
              onClick={() => setTab("social")}
              className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                tab === "social"
                  ? "bg-champagne/15 text-pearl"
                  : "text-muted-atelier hover:text-pearl"
              }`}
            >
              Social / Phone
            </button>
            <button
              type="button"
              onClick={() => setTab("email")}
              className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                tab === "email"
                  ? "bg-champagne/15 text-pearl"
                  : "text-muted-atelier hover:text-pearl"
              }`}
            >
              Email
            </button>
          </div>

          <div className="mt-6 rounded-2xl border border-atelier bg-surface p-6 sm:p-8">
            {tab === "email" ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="rounded-xl border border-[#b45a5a]/30 bg-[#b45a5a]/10 px-4 py-3 text-sm text-[#b45a5a]">
                    {error}
                  </div>
                )}
                <Input
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button type="submit" loading={loading} className="w-full" size="lg">
                  Enter studio
                </Button>
              </form>
            ) : (
              <SocialAuth />
            )}
          </div>

          <p className="mt-6 text-center text-sm text-muted-atelier">
            New here?{" "}
            <Link
              href="/auth/register"
              className="font-medium text-champagne hover:text-champagne-bright"
            >
              Create your atelier
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
