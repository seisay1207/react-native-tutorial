import { subscribeToAuthChanges } from "@/lib/firebase/auth";
import { User } from "firebase/auth";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const renderCount = useRef(0);
  const isInitialized = useRef(false);

  // レンダリングカウンター
  renderCount.current += 1;
  console.log(`AuthContext: Render #${renderCount.current}`);

  useEffect(() => {
    if (isInitialized.current) {
      console.log("AuthContext: Already initialized, skipping");
      return;
    }

    isInitialized.current = true;
    console.log("AuthContext: Starting initialization");

    let isMounted = true;
    let unsubscribe: (() => void) | undefined;

    const initializeAuth = async () => {
      try {
        unsubscribe = subscribeToAuthChanges((user) => {
          if (!isMounted) {
            console.log("AuthContext: Component unmounted, ignoring callback");
            return;
          }

          console.log(
            "AuthContext: Auth state changed",
            user ? `User logged in: ${user.email}` : "User logged out"
          );

          setUser(user);
          setIsLoading(false);
        });
      } catch (error) {
        console.error("AuthContext: Error during initialization:", error);
        if (isMounted) {
          setUser(null);
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      console.log("AuthContext: Cleanup");
      isMounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const value = {
    user,
    isLoading,
  };

  console.log("AuthContext: Rendering with state", {
    user: user?.email || null,
    isLoading,
    hasUser: !!user,
    renderCount: renderCount.current,
    timestamp: new Date().toISOString(),
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
