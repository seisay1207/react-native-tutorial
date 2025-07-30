import { AuthProvider, useAuth } from "@/lib/contexts/AuthContext";
import { ActivityIndicator, View } from "react-native";
import ChatScreen from "./(tabs)/index";
import LoginScreen from "./auth/login";

function AppContent() {
  const { user, isLoading } = useAuth();

  console.log("AppContent: Auth state", {
    user: user?.email,
    isLoading,
    hasUser: !!user,
  });

  if (isLoading) {
    console.log("AppContent: Showing loading screen");
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (user) {
    console.log("AppContent: User logged in, showing chat screen");
    return <ChatScreen />;
  } else {
    console.log("AppContent: No user, showing login screen");
    return <LoginScreen />;
  }
}

export default function RootLayout() {
  console.log("RootLayout: With conditional rendering");
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
