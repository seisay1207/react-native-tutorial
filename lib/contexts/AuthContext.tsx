/**
 * AuthContext.tsx
 *
 * 認証状態を管理するReact Context
 *
 * 【学習ポイント】
 * 1. React Context APIを使用したグローバル状態管理
 * 2. Firebase Authenticationとの連携
 * 3. カスタムフック（useAuth）の作成
 * 4. TypeScriptでの型安全な実装
 * 5. 【修正】ログアウト後の状態更新を確実にするための改善
 */

import { subscribeToAuthChanges } from "@/lib/firebase/auth";
import { User } from "firebase/auth";
import React, { createContext, useContext, useEffect, useState } from "react";

/**
 * 認証コンテキストの型定義
 * アプリ全体で共有される認証状態の型を定義
 */
interface AuthContextType {
  user: User | null; // 現在のユーザー（null = 未ログイン）
  isLoading: boolean; // 認証状態の読み込み中フラグ
}

/**
 * React Contextの作成
 * createContextでコンテキストを作成し、初期値としてundefinedを設定
 * これにより、Provider外でuseAuthを使用した場合にエラーを検出できる
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider コンポーネント
 *
 * 【役割】
 * - 認証状態を管理し、子コンポーネントに提供
 * - Firebase Authenticationの状態変化を監視
 * - ローディング状態の管理
 *
 * 【Props】
 * - children: このProviderで囲まれる子コンポーネント
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // 認証状態の管理
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Firebase Authenticationの状態監視
   *
   * 【useEffectの役割】
   * - コンポーネントマウント時にFirebaseの認証状態リスナーを設定
   * - アンマウント時にリスナーをクリーンアップ
   *
   * 【subscribeToAuthChanges】
   * - FirebaseのonAuthStateChangedをラップした関数
   * - ユーザーのログイン/ログアウト状態の変化を監視
   * - 状態が変化するたびにコールバック関数が呼ばれる
   *
   * 【修正】ログアウト後の状態更新を確実にするための改善
   * 【修正】初期表示時の認証状態チェックを強化
   */
  useEffect(() => {
    console.log("AuthContext: Setting up auth listener");

    // Firebaseの認証状態リスナーを設定
    const unsubscribe = subscribeToAuthChanges((user) => {
      console.log("AuthContext: Auth state changed", {
        user: user?.email,
        userId: user?.uid,
        timestamp: new Date().toISOString(),
      });

      // 認証状態を更新
      setUser(user);
      setIsLoading(false); // 初期読み込み完了

      // デバッグ用：状態更新後の確認
      console.log("AuthContext: State updated", {
        newUser: user?.email,
        newUserId: user?.uid,
        isLoading: false,
      });
    });

    // クリーンアップ関数を返す（コンポーネントアンマウント時に実行）
    return unsubscribe;
  }, []); // 空の依存配列 = マウント時にのみ実行

  /**
   * 初期化時の状態確認
   * 【修正】初期表示時の認証状態を確実にチェック
   */
  useEffect(() => {
    // 初期化完了後の状態確認
    if (!isLoading) {
      console.log("AuthContext: Initialization completed", {
        user: user?.email,
        userId: user?.uid,
        isLoading,
        timestamp: new Date().toISOString(),
      });
    }
  }, [isLoading, user]);

  /**
   * 初期化タイムアウト処理
   * 【修正】Firebase初期化が遅い場合のフォールバック
   */
  useEffect(() => {
    // 5秒後に強制的に初期化完了とする（フォールバック）
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        console.log("AuthContext: Initialization timeout, forcing completion");
        setIsLoading(false);
      }
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, []);

  /**
   * Contextに提供する値
   * この値が子コンポーネントでuseAuth()で取得できる
   */
  const value = {
    user,
    isLoading,
  };

  // デバッグ用ログ（状態変化の追跡）
  console.log("AuthContext: Current state", {
    user: user?.email,
    userId: user?.uid,
    isLoading,
    timestamp: new Date().toISOString(),
  });

  /**
   * AuthContext.Providerで子コンポーネントを囲む
   * valueプロパティで認証状態を提供
   */
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth カスタムフック
 *
 * 【役割】
 * - AuthContextから認証状態を取得するためのカスタムフック
 * - 型安全性とエラーハンドリングを提供
 *
 * 【使用方法】
 * const { user, isLoading } = useAuth();
 *
 * 【エラーハンドリング】
 * - Provider外で使用された場合にエラーを投げる
 * - 開発時のミスを早期発見できる
 */
export function useAuth() {
  // useContextでAuthContextから値を取得
  const context = useContext(AuthContext);

  // Provider外で使用された場合のエラーハンドリング
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
