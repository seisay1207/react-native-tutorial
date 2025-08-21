/**
 * (auth)/_layout.tsx
 *
 * 認証フロー用のレイアウト
 *
 * 【学習ポイント】
 * 1. Expo Routerのグループ化ルーティング
 * 2. 認証画面の適切なルーティング設定
 * 3. ヘッダーの非表示設定
 */

import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // 認証画面ではヘッダーを非表示
        gestureEnabled: false, // スワイプでの戻る操作を無効化（無限ループ防止）
      }}
      initialRouteName="index" // デフォルトでindex画面を表示（ログイン画面）
    >
      <Stack.Screen
        name="index"
        options={{
          title: "ログイン",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="login"
        options={{
          title: "ログイン",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="signup"
        options={{
          title: "アカウント作成",
        }}
      />
    </Stack>
  );
}
