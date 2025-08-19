/**
 * _layout.tsx
 *
 * アプリケーションのルートレイアウト
 *
 * 【学習ポイント】
 * 1. Expo Routerのファイルベースルーティング
 * 2. 認証状態に基づく条件付きレンダリング
 * 3. コンポーネントの分離と再利用
 * 4. ローディング状態の適切な処理
 */

import { AuthProvider, useAuth } from "@/lib/contexts/AuthContext";
import { Stack } from "expo-router";
import { ActivityIndicator, Text, View } from "react-native";
import LoginScreen from "./auth/login";

/**
 * AppContent コンポーネント
 *
 * 【役割】
 * - 認証状態に基づいて適切な画面を表示
 * - ローディング状態の処理
 * - 条件付きレンダリングの実装
 *
 * 【認証フロー】
 * 1. isLoading = true → ローディング画面
 * 2. user = null → ログイン画面（直接表示）
 * 3. user = User → メイン画面（チャットルーム一覧）
 */
function AppContent() {
  // useAuthフックで認証状態を取得
  const { user, isLoading } = useAuth();

  // デバッグ用ログ（状態変化の追跡）
  console.log("AppContent: Auth state", {
    user: user?.email,
    userId: user?.uid,
    isLoading,
    hasUser: !!user,
  });

  /**
   * ローディング状態の処理
   * Firebase Authenticationの初期化中はローディング画面を表示
   */
  if (isLoading) {
    console.log("AppContent: Showing loading screen");
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 16, fontSize: 16, color: "#666" }}>
          認証状態を確認中...
        </Text>
      </View>
    );
  }

  /**
   * 認証済みユーザーの処理
   * メイン画面（チャットルーム一覧）を表示
   */
  if (user) {
    console.log("AppContent: User logged in, showing main screen");
    return (
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: "チャットルーム",
          }}
        />
        <Stack.Screen
          name="chat"
          options={{
            title: "チャット",
            headerShown: true,
            headerBackTitle: "戻る",
          }}
        />
        <Stack.Screen
          name="chat-list"
          options={{
            title: "チャットルーム",
            headerShown: true,
          }}
        />
      </Stack>
    );
  }

  /**
   * 未認証ユーザーの処理
   * ログイン画面を直接表示
   */
  console.log("AppContent: No user, showing login screen directly");

  return (
    <View style={{ flex: 1 }}>
      <LoginScreen />
    </View>
  );
}

/**
 * RootLayout コンポーネント
 *
 * 【役割】
 * - アプリケーションの最上位レイアウト
 * - AuthProviderでアプリ全体を囲む
 * - 認証状態の管理を開始
 */
export default function RootLayout() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
