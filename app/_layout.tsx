import { AuthProvider, useAuth } from "@/lib/contexts/AuthContext";
import { Redirect, Stack } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

function AppContent() {
  const { user, isLoading } = useAuth();

  // デバッグ用のレンダリングカウンター
  useEffect(() => {
    console.log("AppContent: Component rendered");
  });

  console.log("AppContent: Current state", {
    user: user?.email || null,
    isLoading,
    hasUser: !!user,
    timestamp: new Date().toISOString(),
  });

  if (isLoading) {
    console.log("AppContent: Showing loading screen");
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>読み込み中...</Text>
      </View>
    );
  }

  if (!user) {
    console.log("AppContent: No user, redirecting to login");
    return <Redirect href="/auth/login" />;
  }

  console.log("AppContent: User authenticated, showing main app");
  return (
    <Stack>
      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="auth"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  console.log("RootLayout: Rendering root layout");
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
});
