"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";

/**
 * Wraps a page that requires an authenticated user.
 *
 * Waits for the initial token check (`authChecked`) before deciding to redirect.
 * This prevents "already-signed-in user is bounced back to /auth/login on refresh"
 * because the check runs asynchronously in the app-level AuthLoader.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const authChecked = useAuthStore((s) => s.authChecked);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (authChecked && !isAuthenticated) {
      router.replace("/auth/login");
    }
  }, [authChecked, isAuthenticated, router]);

  if (!authChecked || !isAuthenticated) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-600 border-t-indigo-500" />
      </div>
    );
  }

  return <>{children}</>;
}
