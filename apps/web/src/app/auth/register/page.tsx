"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SocialAuth } from "@/components/social-auth";

const regions = [
  { value: "", label: "Select a region (optional)" },
  { value: "na", label: "North America" },
  { value: "eu", label: "Europe" },
  { value: "asia", label: "Asia Pacific" },
  { value: "latam", label: "Latin America" },
  { value: "mena", label: "Middle East & Africa" },
];

type Tab = "email" | "social";

export default function RegisterPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) router.replace("/dashboard");
  }, [isAuthenticated, router]);

  const [tab, setTab] = useState<Tab>("social");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [region, setRegion] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { access_token, user } = await api.register({
        name,
        email,
        password,
        region: region || undefined,
      });
      api.setToken(access_token);
      setUser(user);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
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
            "radial-gradient(ellipse 70% 55% at 60% 35%, rgba(91,143,168,0.18), transparent 55%), radial-gradient(ellipse 45% 40% at 20% 70%, rgba(196,184,165,0.12), transparent 50%), #070708",
        }}
      >
        <div className="atelier-grain absolute inset-0" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <p className="font-display text-xs tracking-[0.28em] text-champagne uppercase">
            Swappy Studio
          </p>
          <div>
            <h2 className="font-display text-4xl font-semibold leading-tight text-pearl xl:text-5xl">
              Build inside an
              <br />
              experience center.
            </h2>
            <ul className="mt-6 space-y-3 text-sm text-muted-atelier">
              <li className="flex gap-2">
                <span className="text-champagne">01</span> Score content before it ships
              </li>
              <li className="flex gap-2">
                <span className="text-champagne">02</span> Read live market radar
              </li>
              <li className="flex gap-2">
                <span className="text-champagne">03</span> Create with agents (coming soon)
              </li>
            </ul>
          </div>
          <p className="text-xs text-muted-atelier">No credit card. Just craft.</p>
        </div>
      </div>

      <div className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <h1 className="font-display text-3xl font-semibold text-pearl">
            Create your atelier
          </h1>
          <p className="mt-2 text-sm text-muted-atelier">
            Start free — prediction now, agents next
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
                  label="Name"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
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
                  minLength={8}
                />
                <div className="space-y-1.5">
                  <label
                    htmlFor="region"
                    className="block text-sm font-medium text-muted-atelier"
                  >
                    Region
                  </label>
                  <select
                    id="region"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="block w-full rounded-xl border border-atelier bg-surface px-3.5 py-2.5 text-sm text-pearl focus:border-champagne/50 focus:outline-none focus:ring-2 focus:ring-champagne/20"
                  >
                    {regions.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
                <Button type="submit" loading={loading} className="w-full" size="lg">
                  Enter the experience center
                </Button>
              </form>
            ) : (
              <SocialAuth />
            )}
          </div>

          <p className="mt-6 text-center text-sm text-muted-atelier">
            Already inside?{" "}
            <Link
              href="/auth/login"
              className="font-medium text-champagne hover:text-champagne-bright"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
