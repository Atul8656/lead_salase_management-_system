"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { User } from "@/lib/types";

export type AuthUserContextValue = {
  user: User | null;
  loading: boolean;
  onUserUpdated: (u: User) => void;
};

const AuthUserContext = createContext<AuthUserContextValue | null>(null);

export function AuthUserProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: AuthUserContextValue;
}) {
  return <AuthUserContext.Provider value={value}>{children}</AuthUserContext.Provider>;
}

export function useAuthUser(): AuthUserContextValue {
  const ctx = useContext(AuthUserContext);
  if (!ctx) {
    throw new Error("useAuthUser must be used within AuthUserProvider");
  }
  return ctx;
}
