/**
 * (tabs)/index.tsx
 *
 * チャットタブ - チャットルーム一覧画面
 *
 * 【変更理由】：ユーザーの要求に従い、「チャット」タブでチャットルーム一覧を表示するよう変更
 *
 * 【学習ポイント】
 * 1. チャットルーム一覧の表示
 * 2. 個別チャットルームの作成
 * 3. 既存チャットルームへの遷移
 * 4. リアルタイム更新
 */

import { useAuth } from "@/lib/contexts/AuthContext";
import { signOutUser } from "@/lib/firebase/auth";
import { createDirectChat, getChatRooms } from "@/lib/firebase/firestore";
import { ChatRoom } from "@/lib/firebase/models";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

/**
 * ChatListScreen コンポーネント
 *
 * 【役割】
 * - ユーザーが参加しているチャットルーム一覧の表示
 * - 新しい個別チャットルームの作成
 * - 既存チャットルームへの遷移
 */
export default function ChatListScreen() {
  // 認証状態の取得
  const { user } = useAuth();

  // ローカル状態の管理
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  /**
   * チャットルーム一覧の取得
   */
  const fetchChatRooms = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const rooms = await getChatRooms(user.uid);
      setChatRooms(rooms);
    } catch (error) {
      console.error("チャットルームの取得に失敗:", error);
      Alert.alert("エラー", "チャットルームの取得に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 新しい個別チャットルームの作成
   */
  const createNewChat = async () => {
    if (!user) return;

    try {
      setIsCreatingChat(true);

      // 簡易的な実装: 自分自身とのチャットを作成
      // 実際の実装では、友達選択画面を表示する
      const chatId = await createDirectChat(user.uid, user.uid);

      Alert.alert(
        "チャットルーム作成",
        "新しいチャットルームが作成されました",
        [
          {
            text: "チャットを開く",
            onPress: () => {
              // 作成されたチャットルームIDをチャット画面に渡す
              router.replace({
                pathname: "/chat",
                params: { chatId: chatId },
              });
            },
          },
          { text: "キャンセル", style: "cancel" },
        ]
      );

      // チャットルーム一覧を更新
      await fetchChatRooms();
    } catch (error) {
      console.error("チャットルームの作成に失敗:", error);
      Alert.alert("エラー", "チャットルームの作成に失敗しました");
    } finally {
      setIsCreatingChat(false);
    }
  };

  /**
   * チャットルームへの遷移
   */
  const navigateToChat = (chatId: string) => {
    // 選択したチャットルームIDをチャット画面に渡す
    router.replace({
      pathname: "/chat",
      params: { chatId: chatId },
    });
  };

  /**
   * チャットルーム一覧の初期化
   */
  useEffect(() => {
    fetchChatRooms();
  }, [user]);

  /**
   * チャットルームアイテムのレンダリング
   */
  const renderChatRoomItem = ({ item }: { item: ChatRoom }) => {
    const getChatTitle = () => {
      if (item.type === "group" && item.name) {
        return item.name;
      }
      // 個別チャットの場合、相手の名前を表示
      // 現在は簡易的に「個別チャット」と表示
      return "個別チャット";
    };

    const getLastMessageText = () => {
      if (item.lastMessage) {
        return item.lastMessage.text;
      }
      return "まだメッセージがありません";
    };

    return (
      <TouchableOpacity
        style={styles.chatRoomItem}
        onPress={() => navigateToChat(item.id)}
      >
        <View style={styles.chatRoomInfo}>
          <Text style={styles.chatRoomTitle}>{getChatTitle()}</Text>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {getLastMessageText()}
          </Text>
        </View>
        <View style={styles.chatRoomMeta}>
          <Text style={styles.participantCount}>
            {item.participants.length}人
          </Text>
          {item.lastMessage && (
            <Text style={styles.lastMessageTime}>
              {item.lastMessage.timestamp
                ?.toDate()
                .toLocaleTimeString("ja-JP", {
                  hour: "2-digit",
                  minute: "2-digit",
                }) || ""}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  /**
   * ヘッダー部分のレンダリング
   */
  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>チャット</Text>
      <View style={styles.headerButtons}>
        <TouchableOpacity
          style={[
            styles.createButton,
            isCreatingChat && styles.createButtonDisabled,
          ]}
          onPress={createNewChat}
          disabled={isCreatingChat}
        >
          {isCreatingChat ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.createButtonText}>新規作成</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.logoutButton,
            isSigningOut && styles.logoutButtonDisabled,
          ]}
          onPress={() => {
            Alert.alert("ログアウト", "ログアウトしますか？", [
              { text: "キャンセル", style: "cancel" },
              {
                text: "ログアウト",
                style: "destructive",
                onPress: async () => {
                  setIsSigningOut(true);
                  try {
                    const result = await signOutUser();
                    if (result.success) {
                      Alert.alert("成功", "ログアウトしました");
                    } else {
                      Alert.alert("エラー", "ログアウトに失敗しました");
                    }
                  } finally {
                    setIsSigningOut(false);
                  }
                },
              },
            ]);
          }}
          disabled={isSigningOut}
        >
          <Text style={styles.logoutButtonText}>ログアウト</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  /**
   * 空の状態のレンダリング
   */
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateText}>まだチャットルームがありません</Text>
      <Text style={styles.emptyStateSubtext}>
        「新規作成」ボタンを押して、新しいチャットを始めましょう
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>チャットルームを読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      <FlatList
        data={chatRooms}
        renderItem={renderChatRoomItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={
          chatRooms.length === 0 ? styles.emptyListContainer : undefined
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e1e5e9",
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  createButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
    alignItems: "center",
  },
  createButtonDisabled: {
    backgroundColor: "#ccc",
  },
  createButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  logoutButton: {
    marginLeft: 8,
    backgroundColor: "#fff5f5",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ffd6d6",
    minWidth: 80,
    alignItems: "center",
  },
  logoutButtonDisabled: {
    opacity: 0.6,
  },
  logoutButtonText: {
    color: "#FF3B30",
    fontWeight: "600",
    fontSize: 14,
  },
  chatRoomItem: {
    backgroundColor: "#fff",
    padding: 16,
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
  chatRoomTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: "#666",
    lineHeight: 18,
  },
  chatRoomMeta: {
    alignItems: "flex-end",
  },
  participantCount: {
    fontSize: 12,
    color: "#999",
    marginBottom: 4,
  },
  lastMessageTime: {
    fontSize: 12,
    color: "#999",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  emptyListContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    textAlign: "center",
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    lineHeight: 20,
  },
});
