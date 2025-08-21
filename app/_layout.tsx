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

import { AuthProvider } from "@/lib/contexts/AuthContext";
import { Stack } from "expo-router";

/**
 * AppContent コンポーネント
 *
 * 【役割】
 * - 基本的なルーティング設定
 * - 全画面の基本レイアウト
 */
function AppContent() {
  console.log("AppContent: Setting up main routing");

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "メイン",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="(tabs)"
        options={{
          title: "メイン",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="(auth)"
        options={{
          title: "認証",
          headerShown: false,
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
    </Stack>
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
