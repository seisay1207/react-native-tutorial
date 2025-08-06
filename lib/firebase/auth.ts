/**
 * auth.ts
 *
 * Firebase Authentication機能の実装
 *
 * 【学習ポイント】
 * 1. Firebase Authentication APIの使用方法
 * 2. 非同期処理とエラーハンドリング
 * 3. 型安全な実装（TypeScript）
 * 4. デバッグログの活用
 * 5. プラットフォーム間の互換性
 */

// app/firebase/auth.ts
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
  User,
} from "firebase/auth";
import { auth } from "./config";

/**
 * 認証結果の型定義
 *
 * 【設計思想】
 * - 成功/失敗を明確に区別
 * - エラーメッセージを日本語で提供
 * - 型安全性を確保
 */
export interface AuthResult {
  success: boolean; // 認証成功/失敗フラグ
  user?: User; // 成功時のユーザー情報
  error?: string; // 失敗時のエラーメッセージ
}

/**
 * ログイン機能
 *
 * 【処理フロー】
 * 1. Firebase Authの初期化チェック
 * 2. メール/パスワード認証の実行
 * 3. 結果の型安全な返却
 * 4. エラーハンドリング
 *
 * 【エラーハンドリング】
 * - Firebase初期化エラー
 * - 認証エラー（ユーザー不存在、パスワード間違い等）
 * - ネットワークエラー
 */
export const signIn = async (
  email: string,
  password: string
): Promise<AuthResult> => {
  console.log("Attempting to sign in with email:", email);

  try {
    // Firebase Authが初期化されているかチェック
    if (!auth) {
      console.error("Firebase Auth is not initialized");
      return {
        success: false,
        error:
          "Firebase認証が初期化されていません。環境変数を確認してください。",
      };
    }

    // Firebase Authentication APIを使用してログイン
    const result = await signInWithEmailAndPassword(auth, email, password);
    console.log("Sign in successful:", result.user.email);
    return { success: true, user: result.user };
  } catch (error: any) {
    // エラーの詳細ログ
    console.error("Sign in error:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);

    // エラーコードに基づいて日本語メッセージを返却
    return {
      success: false,
      error: getAuthErrorMessage(error.code),
    };
  }
};

/**
 * サインアップ機能
 *
 * 【処理フロー】
 * 1. Firebase Authの初期化チェック
 * 2. 新規ユーザー作成
 * 3. 結果の型安全な返却
 * 4. エラーハンドリング
 *
 * 【注意点】
 * - 既存メールアドレスの重複チェック
 * - パスワード強度の検証
 * - メールアドレス形式の検証
 */
export const signUp = async (
  email: string,
  password: string
): Promise<AuthResult> => {
  console.log("Attempting to sign up with email:", email);

  try {
    // Firebase Authが初期化されているかチェック
    if (!auth) {
      console.error("Firebase Auth is not initialized");
      return {
        success: false,
        error:
          "Firebase認証が初期化されていません。環境変数を確認してください。",
      };
    }

    // Firebase Authentication APIを使用して新規ユーザー作成
    const result = await createUserWithEmailAndPassword(auth, email, password);
    console.log("Sign up successful:", result.user.email);
    return { success: true, user: result.user };
  } catch (error: any) {
    // エラーの詳細ログ
    console.error("Sign up error:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);

    // エラーコードに基づいて日本語メッセージを返却
    return {
      success: false,
      error: getAuthErrorMessage(error.code),
    };
  }
};

/**
 * ログアウト機能
 *
 * 【処理フロー】
 * 1. Firebase Authの初期化チェック
 * 2. ログアウト実行
 * 3. 結果の型安全な返却
 * 4. エラーハンドリング
 *
 * 【注意点】
 * - ログアウト後のユーザー状態確認
 * - クリーンアップ処理の実行
 */
export const signOutUser = async (): Promise<AuthResult> => {
  console.log("signOutUser: Starting logout process");

  try {
    if (!auth) {
      console.error("signOutUser: Firebase Auth is not initialized");
      return {
        success: false,
        error: "Firebase認証が初期化されていません",
      };
    }

    console.log("signOutUser: Calling Firebase signOut");
    await signOut(auth);
    console.log("signOutUser: Firebase signOut completed successfully");

    // 現在のユーザー状態を確認（デバッグ用）
    const currentUser = auth.currentUser;
    console.log(
      "signOutUser: Current user after signOut:",
      currentUser ? currentUser.email : "null"
    );

    return { success: true };
  } catch (error: any) {
    console.error("signOutUser: Error during signOut:", error);
    return {
      success: false,
      error: "ログアウトに失敗しました",
    };
  }
};

/**
 * 匿名認証機能
 *
 * 【用途】
 * - ゲストユーザーの一時的な認証
 * - デモンストレーション用
 * - ユーザー登録前の機能体験
 */
export const signInAnonymouslyUser = async (): Promise<AuthResult> => {
  console.log("Attempting anonymous sign in");

  try {
    if (!auth) {
      console.error("Firebase Auth is not initialized");
      return {
        success: false,
        error: "Firebase認証が初期化されていません",
      };
    }

    const result = await signInAnonymously(auth);
    console.log("Anonymous sign in successful");
    return { success: true, user: result.user };
  } catch (error: any) {
    console.error("Anonymous sign in error:", error);
    return {
      success: false,
      error: "匿名認証に失敗しました",
    };
  }
};

/**
 * 認証状態の監視機能
 *
 * 【役割】
 * - Firebase Authenticationの状態変化を監視
 * - ログイン/ログアウト状態の自動検知
 * - リアルタイムな状態更新
 *
 * 【戻り値】
 * - クリーンアップ関数（リスナーの解除用）
 *
 * 【使用方法】
 * const unsubscribe = subscribeToAuthChanges((user) => {
 *   // ユーザー状態が変化した時の処理
 * });
 *
 * // コンポーネントアンマウント時にクリーンアップ
 * return unsubscribe;
 */
export const subscribeToAuthChanges = (
  callback: (user: User | null) => void
) => {
  console.log("subscribeToAuthChanges: Setting up auth state listener");

  if (!auth) {
    console.error("subscribeToAuthChanges: Firebase Auth is not initialized");
    console.log(
      "subscribeToAuthChanges: Calling callback with null immediately"
    );
    callback(null);
    return () => {}; // 空のクリーンアップ関数を返す
  }

  try {
    console.log("subscribeToAuthChanges: Creating onAuthStateChanged listener");

    // Firebase Authenticationの状態変化リスナーを設定
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log(
        "subscribeToAuthChanges: Auth state changed:",
        user ? `User: ${user.email}` : "No user"
      );
      console.log("subscribeToAuthChanges: Calling callback with user:", user);
      callback(user); // コールバック関数を呼び出し
    });

    console.log(
      "subscribeToAuthChanges: Auth state listener set up successfully"
    );
    return unsubscribe; // クリーンアップ関数を返す
  } catch (error) {
    console.error(
      "subscribeToAuthChanges: Error setting up auth state listener:",
      error
    );
    console.log(
      "subscribeToAuthChanges: Calling callback with null due to error"
    );
    callback(null);
    return () => {}; // エラー時も空のクリーンアップ関数を返す
  }
};

/**
 * Firebase認証エラーメッセージの取得
 *
 * 【役割】
 * - Firebaseのエラーコードを日本語メッセージに変換
 * - ユーザーフレンドリーなエラー表示
 * - デバッグ情報の提供
 *
 * 【エラーコード一覧】
 * - auth/user-not-found: ユーザーが見つからない
 * - auth/wrong-password: パスワードが間違っている
 * - auth/invalid-email: メールアドレス形式が無効
 * - auth/weak-password: パスワードが弱すぎる
 * - auth/email-already-in-use: メールアドレスが既に使用されている
 * - auth/network-request-failed: ネットワークエラー
 * - auth/too-many-requests: リクエスト制限
 * - auth/user-disabled: アカウントが無効化されている
 * - auth/operation-not-allowed: 操作が許可されていない
 * - auth/invalid-credential: 認証情報が無効
 */
const getAuthErrorMessage = (errorCode: string): string => {
  console.log("Getting error message for code:", errorCode);

  switch (errorCode) {
    case "auth/user-not-found":
      return "ユーザーが見つかりません";
    case "auth/wrong-password":
      return "パスワードが間違っています";
    case "auth/invalid-email":
      return "メールアドレスの形式が正しくありません";
    case "auth/weak-password":
      return "パスワードが弱すぎます";
    case "auth/email-already-in-use":
      return "このメールアドレスは既に使用されています";
    case "auth/network-request-failed":
      return "ネットワークエラーが発生しました。インターネット接続を確認してください";
    case "auth/too-many-requests":
      return "リクエストが多すぎます。しばらく待ってから再試行してください";
    case "auth/user-disabled":
      return "このアカウントは無効化されています";
    case "auth/operation-not-allowed":
      return "この操作は許可されていません";
    case "auth/invalid-credential":
      return "認証情報が無効です";
    default:
      console.log("Unknown error code:", errorCode);
      return "認証に失敗しました";
  }
};
