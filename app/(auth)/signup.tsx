/**
 * (auth)/signup.tsx
 *
 * サインアップ画面
 *
 * 【学習ポイント】
 * 1. Expo RouterのuseRouterフックの使用
 * 2. 適切なナビゲーション制御
 * 3. 無限ループの防止
 */

import { signUp } from "@/lib/firebase/auth";
import { router } from "expo-router";
import { useState } from "react";
import {
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

export default function SignUpScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const clearError = () => {
    setErrorMessage("");
  };

  const handleSignUp = async () => {
    console.log("SignUp attempt started");
    clearError();

    // 入力値の検証
    if (!email || !password || !confirmPassword) {
      setErrorMessage("すべての項目を入力してください");
      return;
    }

    // メールアドレスの形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage("正しいメールアドレスの形式で入力してください");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("パスワードが一致しません");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("パスワードは6文字以上で入力してください");
      return;
    }

    setIsLoading(true);
    console.log("Calling signUp function with:", { email, password: "***" });

    try {
      const result = await signUp(email, password);
      console.log("SignUp result:", {
        success: result.success,
        error: result.error,
      });

      if (result.success) {
        console.log("SignUp successful, navigating to main screen");
        // 成功メッセージを表示
        Alert.alert("アカウント作成成功", "アカウントを作成しました！", [
          {
            text: "OK",
            onPress: () => {
              // メイン画面に遷移（replaceで履歴を置き換え）
              router.replace("/(tabs)");
            },
          },
        ]);
      } else {
        console.log("SignUp failed:", result.error);
        // エラーメッセージを画面に表示
        const errorMsg = result.error || "アカウント作成に失敗しました";
        setErrorMessage(errorMsg);

        // エラーの種類に応じた追加情報を表示
        const errorInfo = getErrorInfo(errorMsg);
        if (errorInfo) {
          Alert.alert("アカウント作成エラー", errorInfo, [
            { text: "OK", style: "default" },
          ]);
        }
      }
    } catch (error: any) {
      console.error("SignUp error caught:", error);
      const errorMsg = `アカウント作成に失敗しました: ${
        error.message || "不明なエラー"
      }`;
      setErrorMessage(errorMsg);
      Alert.alert("エラー", errorMsg);
    } finally {
      setIsLoading(false);
      console.log("SignUp attempt finished");
    }
  };

  // エラーの種類に応じた詳細情報を取得
  const getErrorInfo = (error: string): string | null => {
    if (!error) return null;

    if (error.includes("このメールアドレスは既に使用されています")) {
      return "このメールアドレスは既に使用されています。\n\n別のメールアドレスを使用するか、既存のアカウントでログインしてください。";
    }

    if (error.includes("パスワードが弱すぎます")) {
      return "パスワードが弱すぎます。\n\n6文字以上で、英数字を含むパスワードを設定してください。";
    }

    if (error.includes("メールアドレスの形式が正しくありません")) {
      return "メールアドレスの形式が正しくありません。\n\n例: example@email.com";
    }

    if (error.includes("ネットワークエラー")) {
      return "インターネット接続を確認してください。\n\nWi-Fiまたはモバイルデータが有効になっているか確認してください。";
    }

    if (error.includes("リクエストが多すぎます")) {
      return "短時間に多くのアカウント作成試行がありました。\n\nしばらく待ってから再試行してください。";
    }

    if (error.includes("Firebase認証が初期化されていません")) {
      return "アプリの設定に問題があります。\n\nアプリを再起動してください。";
    }

    return null;
  };

  const handleBackToLogin = () => {
    console.log("Navigating back to login screen");
    clearError();
    // expo routerを使用してログイン画面に戻る
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          <Text style={styles.title}>アカウント作成</Text>
          <Text style={styles.subtitle}>新しいアカウントを作成しましょう</Text>

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
                editable={!isLoading}
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
                placeholder="6文字以上で入力"
                placeholderTextColor="#999"
                secureTextEntry
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>パスワード確認</Text>
              <TextInput
                style={[styles.input, errorMessage && styles.inputError]}
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  clearError();
                }}
                placeholder="パスワードを再入力"
                placeholderTextColor="#999"
                secureTextEntry
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleSignUp}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>
                {isLoading ? "作成中..." : "アカウント作成"}
              </Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>または</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleBackToLogin}
              disabled={isLoading}
            >
              <Text style={styles.secondaryButtonText}>
                既存のアカウントでログイン
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 40,
    color: "#666",
  },
  form: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fafafa",
  },
  inputError: {
    borderColor: "#FF6B6B",
    borderWidth: 2,
  },
  errorContainer: {
    backgroundColor: "#FFEBEB",
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    alignItems: "center",
  },
  errorText: {
    color: "#FF6B6B",
    fontSize: 14,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    color: "white",
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
    marginHorizontal: 10,
    color: "#666",
    fontSize: 14,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#007AFF",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
