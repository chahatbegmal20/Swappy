"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useRef, type ReactNode } from "react";
import { api } from "./api";
import { useAuthStore } from "./store";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
});

function AuthLoader() {
  const setUser = useAuthStore((s) => s.setUser);
  const setAuthChecked = useAuthStore((s) => s.setAuthChecked);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    const token = api.getToken();
    if (!token) {
      setAuthChecked(true);
      return;
    }

    api
      .getMe()
      .then((user) => setUser(user))
      .catch(() => {
        api.setToken(null);
        setAuthChecked(true);
      });
  }, [setUser, setAuthChecked]);

  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthLoader />
      {children}
    </QueryClientProvider>
  );
}
