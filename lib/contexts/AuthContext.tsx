import { User } from "firebase/auth";
import React, { createContext, useContext, useMemo } from "react";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // 静的な値をメモ化して再レンダリングを防ぐ
  const value = useMemo(
    () => ({
      user: null,
      isLoading: false,
    }),
    []
  );

  console.log("AuthContext: Static state", {
    user: null,
    isLoading: false,
    hasUser: false,
  });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
