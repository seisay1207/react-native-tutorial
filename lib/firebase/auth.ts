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

// 型定義
export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

// ログイン機能
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

    const result = await signInWithEmailAndPassword(auth, email, password);
    console.log("Sign in successful:", result.user.email);
    return { success: true, user: result.user };
  } catch (error: any) {
    console.error("Sign in error:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);

    return {
      success: false,
      error: getAuthErrorMessage(error.code),
    };
  }
};

// サインアップ機能
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

    const result = await createUserWithEmailAndPassword(auth, email, password);
    console.log("Sign up successful:", result.user.email);
    return { success: true, user: result.user };
  } catch (error: any) {
    console.error("Sign up error:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);

    return {
      success: false,
      error: getAuthErrorMessage(error.code),
    };
  }
};

// ログアウト機能
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

    // 現在のユーザー状態を確認
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

// 匿名認証
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

// 認証状態の監視
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
    return () => {};
  }

  try {
    console.log("subscribeToAuthChanges: Creating onAuthStateChanged listener");
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log(
        "subscribeToAuthChanges: Auth state changed:",
        user ? `User: ${user.email}` : "No user"
      );
      console.log("subscribeToAuthChanges: Calling callback with user:", user);
      callback(user);
    });

    console.log(
      "subscribeToAuthChanges: Auth state listener set up successfully"
    );
    return unsubscribe;
  } catch (error) {
    console.error(
      "subscribeToAuthChanges: Error setting up auth state listener:",
      error
    );
    console.log(
      "subscribeToAuthChanges: Calling callback with null due to error"
    );
    callback(null);
    return () => {};
  }
};

// エラーメッセージの取得
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
