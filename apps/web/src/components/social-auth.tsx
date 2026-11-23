"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { API_BASE, api } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone, ArrowRight } from "lucide-react";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <defs>
        <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#feda75"/>
          <stop offset="25%" stopColor="#fa7e1e"/>
          <stop offset="50%" stopColor="#d62976"/>
          <stop offset="75%" stopColor="#962fbf"/>
          <stop offset="100%" stopColor="#4f5bd5"/>
        </linearGradient>
      </defs>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" fill="url(#ig-grad)"/>
    </svg>
  );
}

function XTwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

interface ProviderInfo {
  configured: boolean;
  authorize_url: string;
}

type AuthMode = "social" | "phone-entry" | "phone-otp";

export function SocialAuth() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);

  const [mode, setMode] = useState<AuthMode>("social");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState("");
  const [providers, setProviders] = useState<Record<string, ProviderInfo> | null>(null);

  const loadProviders = useCallback(async () => {
    try {
      const result = await api.getSocialProviders();
      setProviders(result);
      return result;
    } catch (err) {
      setProviders(null);
      throw err;
    }
  }, []);

  useEffect(() => {
    // Warm the API (helps Render free-tier cold starts) and prefetch provider flags.
    fetch(`${API_BASE}/health`).catch(() => {});
    loadProviders().catch(() => {
      // First click will surface a clearer error if the API is still waking up.
    });
  }, [loadProviders]);

  function startOAuthRedirect(provider: string) {
    setError("");
    setLoading(provider);

    const providerInfo = providers?.[provider];
    if (providers !== null && providerInfo && !providerInfo.configured) {
      setError(
        `${provider.charAt(0).toUpperCase() + provider.slice(1)} is not configured yet. ` +
          `Add ${provider.toUpperCase()}_CLIENT_ID and ${provider.toUpperCase()}_CLIENT_SECRET on the API host, then redeploy.`,
      );
      setLoading("");
      return;
    }

    // Same-tab redirect — no popup blockers, works on phones and first visits.
    // Do not await network calls before navigating (that breaks the user gesture).
    const url = `${API_BASE}/api/v1/auth/social/${provider}/authorize`;
    window.location.assign(url);
  }

  async function handlePhoneSendOtp(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading("phone");

    try {
      const result = await api.phoneSendOtp(phone);
      setDevOtp(result.dev_otp ?? null);
      setMode("phone-otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setLoading("");
    }
  }

  async function handlePhoneVerify(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading("verify");

    try {
      const { access_token } = await api.phoneVerify(phone, otp);
      api.setToken(access_token);
      const user = await api.getMe();
      setUser(user);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading("");
    }
  }

  const providerButtons = [
    {
      id: "google",
      label: "Continue with Google",
      Icon: GoogleIcon,
    },
    {
      id: "instagram",
      label: "Continue with Instagram",
      Icon: InstagramIcon,
    },
    {
      id: "twitter",
      label: "Continue with Twitter / X",
      Icon: XTwitterIcon,
    },
  ];

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {mode === "social" && (
        <>
          {providerButtons.map(({ id, label, Icon }) => {
            const info = providers?.[id];
            const configured = info?.configured ?? false;

            return (
              <button
                key={id}
                type="button"
                onClick={() => startOAuthRedirect(id)}
                disabled={!!loading}
                className="flex w-full items-center gap-3 rounded-lg border border-atelier bg-surface-raised/50 px-4 py-3 text-sm font-medium text-pearl transition-colors hover:bg-surface-raised/60 disabled:opacity-50"
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span className="flex-1 text-left">{label}</span>
                {!configured && providers !== null && (
                  <span className="rounded bg-yellow-500/20 px-1.5 py-0.5 text-[10px] font-medium text-yellow-400">
                    SETUP NEEDED
                  </span>
                )}
                {loading === id && (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-atelier border-t-pearl" />
                )}
                {loading === id && (
                  <span className="text-[10px] text-muted-atelier">Redirecting…</span>
                )}
              </button>
            );
          })}

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-atelier" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-surface px-3 text-muted-atelier">or</span>
            </div>
          </div>

          <button
            onClick={() => setMode("phone-entry")}
            disabled={!!loading}
            className="flex w-full items-center gap-3 rounded-lg border border-atelier bg-surface-raised/50 px-4 py-3 text-sm font-medium text-pearl transition-colors hover:bg-surface-raised/60 disabled:opacity-50"
          >
            <Phone className="h-5 w-5 flex-shrink-0 text-green-400" />
            <span className="flex-1 text-left">Continue with Phone Number</span>
          </button>
        </>
      )}

      {mode === "phone-entry" && (
        <form onSubmit={handlePhoneSendOtp} className="space-y-4">
          <div className="text-center">
            <Phone className="mx-auto mb-2 h-8 w-8 text-green-400" />
            <p className="text-sm text-muted-atelier">
              Enter your phone number to receive a verification code
            </p>
          </div>

          <Input
            label="Phone Number"
            type="tel"
            placeholder="+1 234 567 8900"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => { setMode("social"); setError(""); }}
              className="flex-1"
            >
              Back
            </Button>
            <Button type="submit" loading={loading === "phone"} className="flex-1">
              Send OTP
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </form>
      )}

      {mode === "phone-otp" && (
        <form onSubmit={handlePhoneVerify} className="space-y-4">
          <div className="text-center">
            <Phone className="mx-auto mb-2 h-8 w-8 text-green-400" />
            <p className="text-sm text-muted-atelier">
              Enter the 6-digit code sent to <strong className="text-pearl">{phone}</strong>
            </p>
          </div>

          {devOtp && (
            <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-center text-sm text-yellow-300">
              Dev mode OTP: <span className="font-mono font-bold tracking-widest">{devOtp}</span>
            </div>
          )}

          <Input
            label="Verification Code"
            type="text"
            placeholder="000000"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            required
            maxLength={6}
          />

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => { setMode("phone-entry"); setOtp(""); setDevOtp(null); setError(""); }}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              type="submit"
              loading={loading === "verify"}
              className="flex-1"
              disabled={otp.length !== 6}
            >
              Verify & Sign In
            </Button>
          </div>

          <button
            type="button"
            onClick={handlePhoneSendOtp}
            className="w-full text-center text-sm text-champagne hover:text-champagne-bright"
          >
            Resend code
          </button>
        </form>
      )}
    </div>
  );
}
