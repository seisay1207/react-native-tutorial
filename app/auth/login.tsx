import { signIn } from "@/lib/firebase/auth";
import { router } from "expo-router";
import { useEffect, useState } from "react";
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

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showSignup, setShowSignup] = useState(false);

  // デバッグ用：ログイン画面の表示確認
  useEffect(() => {
    console.log("LoginScreen: Component mounted - login form displayed");
    console.log("LoginScreen: About to render login form");
  }, []);

  const clearError = () => {
    setErrorMessage("");
  };

  const handleLogin = async () => {
    console.log("Login attempt started");
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

    setIsLoading(true);
    console.log("Calling signIn function with:", { email, password: "***" });

    try {
      const result = await signIn(email, password);
      console.log("SignIn result:", {
        success: result.success,
        error: result.error,
      });

      if (result.success) {
        console.log("Login successful, navigating to main screen");
        // 成功メッセージを表示
        Alert.alert("ログイン成功", "ログインしました！", [
          {
            text: "OK",
            onPress: () => {
              // メイン画面に遷移
              router.replace("/chat-list");
            },
          },
        ]);
      } else {
        console.log("Login failed:", result.error);
        // エラーメッセージを画面に表示
        const errorMsg = result.error || "ログインに失敗しました";
        setErrorMessage(errorMsg);

        // エラーの種類に応じた追加情報を表示
        const errorInfo = getErrorInfo(errorMsg);
        if (errorInfo) {
          Alert.alert("ログインエラー", errorInfo, [
            { text: "OK", style: "default" },
          ]);
        }
      }
    } catch (error: any) {
      console.error("Login error caught:", error);
      const errorMsg = `ログインに失敗しました: ${
        error.message || "不明なエラー"
      }`;
      setErrorMessage(errorMsg);
      Alert.alert("エラー", errorMsg);
    } finally {
      setIsLoading(false);
      console.log("Login attempt finished");
    }
  };

  // エラーの種類に応じた詳細情報を取得
  const getErrorInfo = (error: string): string | null => {
    if (!error) return null;

    if (error.includes("ユーザーが見つかりません")) {
      return "このメールアドレスで登録されたアカウントが見つかりません。\n\n新規登録が必要な場合は「アカウントを作成」ボタンを押してください。";
    }

    if (error.includes("パスワードが間違っています")) {
      return "パスワードが正しくありません。\n\nパスワードを確認して再入力してください。";
    }

    if (error.includes("メールアドレスの形式が正しくありません")) {
      return "メールアドレスの形式が正しくありません。\n\n例: example@email.com";
    }

    if (error.includes("ネットワークエラー")) {
      return "インターネット接続を確認してください。\n\nWi-Fiまたはモバイルデータが有効になっているか確認してください。";
    }

    if (error.includes("リクエストが多すぎます")) {
      return "短時間に多くのログイン試行がありました。\n\nしばらく待ってから再試行してください。";
    }

    if (error.includes("このアカウントは無効化されています")) {
      return "このアカウントは無効化されています。\n\n管理者にお問い合わせください。";
    }

    if (error.includes("Firebase認証が初期化されていません")) {
      return "アプリの設定に問題があります。\n\nアプリを再起動してください。";
    }

    return null;
  };

  const handleSignUp = () => {
    console.log("Signup functionality temporarily disabled");
    // サインアップ機能は一時的に無効化
    // 必要に応じて別画面に遷移
  };

  const handleBackToLogin = () => {
    console.log("Already on login form");
    // 既にログインフォームにいるため何もしない
  };

  // ログイン画面を表示（サインアップ機能は一時的に無効化）
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
                placeholder="パスワードを入力"
                placeholderTextColor="#999"
                secureTextEntry
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>
                {isLoading ? "ログイン中..." : "ログイン"}
              </Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>
                サインアップ機能は一時的に無効化
              </Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={[styles.secondaryButton, { opacity: 0.5 }]}
              onPress={handleSignUp}
              disabled={true}
            >
              <Text style={styles.secondaryButtonText}>
                アカウントを作成（無効）
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
    borderWidth: 1,
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
