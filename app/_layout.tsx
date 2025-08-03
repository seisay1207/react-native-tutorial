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
import { ActivityIndicator, View } from "react-native";
import ChatScreen from "./(tabs)/index";
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
 * 2. user = null → ログイン画面
 * 3. user = User → チャット画面
 */
function AppContent() {
  // useAuthフックで認証状態を取得
  const { user, isLoading } = useAuth();

  // デバッグ用ログ
  console.log("AppContent: Auth state", {
    user: user?.email,
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
      </View>
    );
  }

  /**
   * 認証済みユーザーの処理
   * ユーザーがログインしている場合はチャット画面を表示
   */
  if (user) {
    console.log("AppContent: User logged in, showing chat screen");
    return <ChatScreen />;
  } else {
    /**
     * 未認証ユーザーの処理
     * ユーザーがログインしていない場合はログイン画面を表示
     */
    console.log("AppContent: No user, showing login screen");
    return <LoginScreen />;
  }
}

/**
 * RootLayout コンポーネント
 *
 * 【役割】
 * - アプリケーションの最上位レイアウト
 * - AuthProviderでアプリ全体を囲む
 * - 認証状態の管理を開始
 *
 * 【Expo Routerの仕組み】
 * - _layout.tsxはファイルベースルーティングのレイアウトファイル
 * - このファイルがアプリのエントリーポイントとなる
 * - 子ルートは(tabs)フォルダ内のファイル
 */
export default function RootLayout() {
  console.log("RootLayout: With conditional rendering");

  return (
    /**
     * AuthProviderでアプリ全体を囲む
     * これにより、すべての子コンポーネントでuseAuth()が使用可能になる
     */
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
