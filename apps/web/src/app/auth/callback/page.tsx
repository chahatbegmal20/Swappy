"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setUser = useAuthStore((s) => s.setUser);

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Completing sign-in...");

  /** Stable primitive — `searchParams` object identity changes often and would re-fire this effect in a loop. */
  const queryString = searchParams.toString();

  useEffect(() => {
    async function handleCallback() {
      const params = new URLSearchParams(queryString);
      const token = params.get("token");
      const provider = params.get("provider");
      const errorParam = params.get("error");

      if (errorParam) {
        setStatus("error");
        setMessage(`Authentication failed: ${errorParam}`);
        return;
      }

      if (!token) {
        setStatus("error");
        setMessage("No authentication token received.");
        return;
      }

      try {
        api.setToken(token);
        const user = await api.getMe();
        setUser(user);

        if (window.opener) {
          window.opener.postMessage(
            { type: "SWAPPY_OAUTH_SUCCESS", token, provider },
            window.location.origin,
          );
          setStatus("success");
          setMessage("Sign-in successful! This window will close...");
          setTimeout(() => window.close(), 1000);
        } else {
          setStatus("success");
          setMessage("Sign-in successful! Redirecting...");
          router.push("/dashboard");
        }
      } catch (err) {
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "Failed to complete sign-in.");
      }
    }

    handleCallback();
  }, [queryString, router, setUser]);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="glass rounded-2xl p-8">
          {status === "loading" && (
            <>
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-atelier border-t-champagne" />
              <p className="text-pearl">{message}</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20">
                <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="font-medium text-green-400">{message}</p>
            </>
          )}

          {status === "error" && (
            <>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20">
                <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="font-medium text-red-400">{message}</p>
              <button
                onClick={() => {
                  if (window.opener) window.close();
                  else router.push("/auth/login");
                }}
                className="mt-4 text-sm text-champagne hover:text-champagne-bright"
              >
                Back to login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-atelier border-t-champagne" />
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
