import { useAuth } from "@/lib/contexts/AuthContext";
import { signOutUser } from "@/lib/firebase/auth";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

/**
 * チャットルーム一覧画面
 * LINEのようなチャットルーム選択画面
 */
export default function ChatRoomList() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  // サンプルのチャットルームデータ
  const chatRooms = [
    {
      id: "1",
      name: "一般チャット",
      lastMessage: "こんにちは！",
      timestamp: "18:30",
    },
    {
      id: "2",
      name: "開発チーム",
      lastMessage: "コードレビューお願いします",
      timestamp: "17:45",
    },
    {
      id: "3",
      name: "プロジェクトA",
      lastMessage: "進捗報告です",
      timestamp: "16:20",
    },
  ];

  // チャットルームをタップした時の処理
  const handleChatRoomPress = (chatRoomId: string) => {
    router.push({
      pathname: "/chat",
      params: { chatId: chatRoomId },
    });
  };

  // ログアウトボタンの処理
  const handleLogout = async () => {
    console.log("ChatRoomList: Logout button tapped - showing alert");

    // プラットフォーム別のアラート処理
    if (Platform.OS === "web") {
      // Webブラウザ用：window.confirmを使用
      const confirmed = window.confirm("ログアウトしますか？");
      if (confirmed) {
        await performLogout();
      }
    } else {
      // ネイティブアプリ用：Alert.alertを使用
      try {
        Alert.alert("ログアウト", "ログアウトしますか？", [
          { text: "キャンセル", style: "cancel" },
          {
            text: "ログアウト",
            style: "destructive",
            onPress: performLogout,
          },
        ]);
        console.log("ChatRoomList: Alert.alert called successfully");
      } catch (error) {
        console.error("ChatRoomList: Error showing alert:", error);
      }
    }
  };

  // ログアウト実行処理（共通化）
  const performLogout = async () => {
    console.log("ChatRoomList: Starting logout process");
    setIsSigningOut(true);

    try {
      const result = await signOutUser();
      if (!result.success) {
        console.error("ChatRoomList: Logout failed:", result.error);
        // Webブラウザ用のエラー表示
        if (Platform.OS === "web") {
          alert("ログアウトに失敗しました");
        } else {
          Alert.alert("エラー", "ログアウトに失敗しました");
        }
      } else {
        console.log(
          "ChatRoomList: Logout successful, waiting for state update"
        );
        // ログアウト成功後、AuthContextの状態更新を待つ
        // 状態更新はFirebaseのonAuthStateChangedで自動的に行われる
      }
    } catch (error) {
      console.error("ChatRoomList: Unexpected error during logout:", error);
      // Webブラウザ用のエラー表示
      if (Platform.OS === "web") {
        alert("予期しないエラーが発生しました");
      } else {
        Alert.alert("エラー", "予期しないエラーが発生しました");
      }
    } finally {
      setIsSigningOut(false);
    }
  };

  // チャットルームアイテムのレンダリング
  const renderChatRoom = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.chatRoomItem}
      onPress={() => handleChatRoomPress(item.id)}
    >
      <View style={styles.chatRoomInfo}>
        <Text style={styles.chatRoomName}>{item.name}</Text>
        <Text style={styles.lastMessage}>{item.lastMessage}</Text>
      </View>
      <Text style={styles.timestamp}>{item.timestamp}</Text>
    </TouchableOpacity>
  );

  // ローディング中または未認証の場合は何も表示しない
  if (isLoading || !user) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>チャットルーム</Text>
          <TouchableOpacity
            style={[
              styles.logoutButton,
              isSigningOut && styles.logoutButtonDisabled,
            ]}
            onPress={handleLogout}
            disabled={isSigningOut}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.logoutButtonText}>ログアウト</Text>
          </TouchableOpacity>
        </View>
      </View>
      <FlatList
        data={chatRooms}
        renderItem={renderChatRoom}
        keyExtractor={(item) => item.id}
        style={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#007AFF",
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#fff",
    backgroundColor: "rgba(255,255,255,0.2)",
    minWidth: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutButtonDisabled: {
    opacity: 0.6,
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  list: {
    flex: 1,
  },
  chatRoomItem: {
    backgroundColor: "white",
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  chatRoomInfo: {
    flex: 1,
    marginRight: 12,
  },
  chatRoomName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: "#666",
    lineHeight: 18,
  },
  timestamp: {
    fontSize: 12,
    color: "#999",
  },
});
