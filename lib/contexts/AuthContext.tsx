import { subscribeToAuthChanges } from "@/lib/firebase/auth";
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
    console.log("AuthContext: Starting Firebase auth listener");

    const unsubscribe = subscribeToAuthChanges((user) => {
      console.log(
        "AuthContext: Firebase auth state changed",
        user ? `User: ${user.email}` : "No user"
      );
      setUser(user);
      setIsLoading(false);
    });

    return () => {
      console.log("AuthContext: Cleaning up Firebase auth listener");
      unsubscribe();
    };
  }, []);

  const value = {
    user,
    isLoading,
  };

  console.log("AuthContext: State", {
    user: user?.email || null,
    isLoading,
    hasUser: !!user,
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
