import { useAuth } from "@/lib/contexts/AuthContext";
import { useRouter } from "expo-router";
import {
  FlatList,
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
        <Text style={styles.title}>チャットルーム</Text>
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
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
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
