import { useAuth } from "@/lib/contexts/AuthContext";
import { signOutUser } from "@/lib/firebase/auth";
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ChatScreen() {
  const { user } = useAuth();

  const handleLogout = async () => {
    console.log("ChatScreen: Logout button pressed");

    // Webブラウザでの互換性を向上
    if (Platform.OS === "web") {
      console.log("ChatScreen: Using window.confirm for web");
      const confirmed = window.confirm("ログアウトしますか？");
      if (!confirmed) {
        console.log("ChatScreen: Logout cancelled");
        return;
      }

      console.log("ChatScreen: User confirmed logout (web)");
      const result = await signOutUser();
      console.log("ChatScreen: SignOut result:", result);

      if (result.success) {
        console.log("ChatScreen: Logout successful, user should be redirected");
        alert("ログアウトしました");
      } else {
        console.log("ChatScreen: Logout failed:", result.error);
        alert("ログアウトに失敗しました");
      }
      return;
    }

    // ネイティブアプリ用のAlert
    console.log("ChatScreen: About to show logout alert");

    Alert.alert("ログアウト", "ログアウトしますか？", [
      {
        text: "キャンセル",
        style: "cancel",
        onPress: () => {
          console.log("ChatScreen: Logout cancelled");
        },
      },
      {
        text: "ログアウト",
        style: "destructive",
        onPress: async () => {
          console.log("ChatScreen: User confirmed logout");
          const result = await signOutUser();
          console.log("ChatScreen: SignOut result:", result);

          if (result.success) {
            console.log(
              "ChatScreen: Logout successful, user should be redirected"
            );
            Alert.alert("成功", "ログアウトしました");
          } else {
            console.log("ChatScreen: Logout failed:", result.error);
            Alert.alert("エラー", "ログアウトに失敗しました");
          }
        },
      },
    ]);

    console.log("ChatScreen: Alert shown");
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>チャット</Text>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Text style={styles.logoutText}>ログアウト</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.welcomeText}>
          ようこそ、{user?.email || "ゲスト"}さん！
        </Text>
        <Text style={styles.subtitle}>チャット機能は準備中です...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  logoutButton: {
    padding: 8,
  },
  logoutText: {
    color: "#FF3B30",
    fontSize: 16,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
});
