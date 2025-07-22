import { subscribeToAuthChanges } from "@/app/firebase/auth";
import { User } from "firebase/auth";
import React, { createContext, useContext, useEffect, useState } from "react";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log("AuthContext: Setting up auth state listener");

    const unsubscribe = subscribeToAuthChanges((user) => {
      console.log(
        "AuthContext: Auth state changed",
        user ? "User logged in" : "User logged out"
      );
      setUser(user);
      setIsLoading(false);
    });

    return () => {
      console.log("AuthContext: Cleaning up auth state listener");
      unsubscribe();
    };
  }, []);

  const value = {
    user,
    isLoading,
  };

  console.log("AuthContext: Current state", { user: user?.email, isLoading });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
