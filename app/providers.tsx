"use client";

import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider refetchInterval={10}>{children}</SessionProvider>;
}
