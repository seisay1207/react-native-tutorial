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
 * 5. 【修正】明示的なレイアウト選択による保守性の向上
 */

import { AuthProvider, useAuth } from "@/lib/contexts/AuthContext";
import { ActivityIndicator, View } from "react-native";
// 【修正】各グループのレイアウトを明示的にインポート
import TabsLayout from "./(tabs)/_layout";
import AuthLayout from "./auth/_layout";

/**
 * AppContent コンポーネント
 *
 * 【役割】
 * - 認証状態に基づいて適切な画面を表示
 * - ローディング状態の処理
 * - 条件付きレンダリングの実装
 * - 【修正】明示的なレイアウト選択による保守性の向上
 *
 * 【認証フロー】
 * 1. isLoading = true → ローディング画面
 * 2. user = null → 認証画面（authフォルダのレイアウト）
 * 3. user = User → タブ画面（(tabs)フォルダのレイアウト）
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
   * 【修正】明示的にTabsLayoutを選択
   *
   * 【改善点】
   * - 明示的にTabsLayoutを選択（曖昧性なし）
   * - どのレイアウトが表示されるか明確
   * - デバッグ時の原因特定が容易
   * - ファイル構造変更時の影響が明確
   * - 将来的な拡張が容易
   */
  if (user) {
    console.log("AppContent: User logged in, explicitly showing TabsLayout");
    return <TabsLayout />;
  }

  /**
   * 未認証ユーザーの処理
   * 【修正】明示的にAuthLayoutを選択
   *
   * 【改善点】
   * - 明示的にAuthLayoutを選択（曖昧性なし）
   * - 認証関連の画面管理が統一される
   * - ログイン/サインアップの切り替えが可能
   * - 将来的な認証画面の追加が容易
   */
  console.log("AppContent: No user, explicitly showing AuthLayout");
  return <AuthLayout />;
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
 * - 【修正】明示的なレイアウト選択による保守性の向上
 */
export default function RootLayout() {
  console.log("RootLayout: With explicit layout selection");

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
