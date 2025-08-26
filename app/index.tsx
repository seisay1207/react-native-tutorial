/**
 * index.tsx
 *
 * アプリのメイン画面
 * 認証状態に基づいてログイン画面またはメイン画面を表示
 */

import { useAuth } from "@/lib/contexts/AuthContext";
import { signIn } from "@/lib/firebase/auth";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function RootIndex() {
  // 認証状態を取得
  const { user, isLoading } = useAuth();

  // ログインフォームの状態
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // すべてのuseEffectを先頭にまとめる
  useEffect(() => {
    console.log("RootIndex: Component mounted", {
      user: user?.email,
      isLoading,
      hasUser: !!user,
    });
  }, [user, isLoading]);

  useEffect(() => {
    if (user) {
      console.log("RootIndex: User authenticated, redirecting to main screen");
      router.replace("/(tabs)");
    }
  }, [user]);

  // ローディング状態の表示
  if (isLoading) {
    console.log("RootIndex: Showing loading screen");
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>認証状態を確認中...</Text>
      </View>
    );
  }

  if (user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>メイン画面に移動中...</Text>
      </View>
    );
  }

  // 未認証の場合、ログイン画面を表示
  console.log("RootIndex: User not authenticated, showing login screen");

  const clearError = () => {
    setErrorMessage("");
  };

  const handleLogin = async () => {
    console.log("Login attempt started from RootIndex");
    clearError();

    // 入力値の検証
    if (!email || !password) {
      setErrorMessage("メールアドレスとパスワードを入力してください");
      return;
    }

    // メールアドレスの形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage("正しいメールアドレスの形式で入力してください");
      return;
    }

    // パスワードの長さチェック
    if (password.length < 6) {
      setErrorMessage("パスワードは6文字以上で入力してください");
      return;
    }

    setIsSigningIn(true);

    try {
      const result = await signIn(email, password);
      console.log("SignIn result:", {
        success: result.success,
        error: result.error,
      });

      if (result.success) {
        console.log("Login successful from RootIndex");
        Alert.alert("ログイン成功", "ログインしました！");
        // 認証状態が変更されると自動的にメイン画面にリダイレクトされる
      } else {
        console.log("Login failed:", result.error);
        setErrorMessage(result.error || "ログインに失敗しました");
      }
    } catch (error: any) {
      console.error("Login error caught:", error);
      setErrorMessage(
        `ログインに失敗しました: ${error.message || "不明なエラー"}`
      );
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignUp = () => {
    console.log("Navigating to signup screen from RootIndex");
    router.push("/(auth)/signup");
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          <Text style={styles.title}>ログイン</Text>
          <Text style={styles.subtitle}>チャットアプリにようこそ</Text>

          {/* エラーメッセージ表示エリア */}
          {errorMessage ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>メールアドレス</Text>
              <TextInput
                style={[styles.input, errorMessage && styles.inputError]}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  clearError();
                }}
                placeholder="example@email.com"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isSigningIn}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>パスワード</Text>
              <TextInput
                style={[styles.input, errorMessage && styles.inputError]}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  clearError();
                }}
                placeholder="パスワードを入力"
                placeholderTextColor="#999"
                secureTextEntry
                autoCapitalize="none"
                editable={!isSigningIn}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, isSigningIn && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isSigningIn}
            >
              <Text style={styles.buttonText}>
                {isSigningIn ? "ログイン中..." : "ログイン"}
              </Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>または</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleSignUp}
              disabled={isSigningIn}
            >
              <Text style={styles.secondaryButtonText}>アカウントを作成</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// スタイル定義
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 32,
    color: "#666",
  },
  errorContainer: {
    backgroundColor: "#ffebee",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#ffcdd2",
  },
  errorText: {
    color: "#c62828",
    fontSize: 14,
    textAlign: "center",
  },
  form: {
    gap: 20,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  inputError: {
    borderColor: "#f44336",
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#ddd",
  },
  dividerText: {
    marginHorizontal: 16,
    color: "#666",
    fontSize: 14,
  },
  secondaryButton: {
    backgroundColor: "transparent",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  secondaryButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
