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
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: result.user };
  } catch (error: any) {
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
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return { success: true, user: result.user };
  } catch (error: any) {
    return {
      success: false,
      error: getAuthErrorMessage(error.code),
    };
  }
};

// ログアウト機能
export const signOutUser = async (): Promise<AuthResult> => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: "ログアウトに失敗しました",
    };
  }
};

// 匿名認証
export const signInAnonymouslyUser = async (): Promise<AuthResult> => {
  try {
    const result = await signInAnonymously(auth);
    return { success: true, user: result.user };
  } catch (error: any) {
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
  return onAuthStateChanged(auth, callback);
};

// エラーメッセージの取得
const getAuthErrorMessage = (errorCode: string): string => {
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
    default:
      return "認証に失敗しました";
  }
};
