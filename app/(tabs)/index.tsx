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

import Avatar from "@/components/ui/Avatar";
import { useAuth } from "@/lib/contexts/AuthContext";
import { signOutUser } from "@/lib/firebase/auth";
import { getChatRooms } from "@/lib/firebase/firestore";
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
  const createNewChat = () => {
    router.push("/select-user");
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
        <Avatar
          name={getChatTitle()}
          size={50}
          backgroundColor={item.type === "group" ? "#34C759" : "#007AFF"}
        />
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
                    console.log("ログアウト処理開始");
                    const result = await signOutUser();
                    console.log("ログアウト結果:", result);
                    if (!result.success) {
                      console.log("ログアウト失敗");
                      Alert.alert("エラー", "ログアウトに失敗しました");
                    }
                  } catch (error) {
                    console.error("ログアウト処理でエラー発生:", error);
                    Alert.alert("エラー", "予期せぬエラーが発生しました");
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
          <ActivityIndicator
            size="large"
            color="#007AFF"
            style={{ transform: [{ scale: 1.2 }] }}
          />
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e1e5e9",
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1a1a1a",
    letterSpacing: -0.5,
  },
  createButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 22,
    minWidth: 90,
    alignItems: "center",
    shadowColor: "#007AFF",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  createButtonDisabled: {
    backgroundColor: "#A0A0A0",
    shadowOpacity: 0,
  },
  createButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
    letterSpacing: -0.2,
  },
  logoutButton: {
    marginLeft: 8,
    backgroundColor: "#FFF5F5",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 22,
    minWidth: 90,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#FFD6D6",
  },
  logoutButtonDisabled: {
    opacity: 0.5,
    backgroundColor: "#F8F8F8",
    borderColor: "#E0E0E0",
  },
  logoutButtonText: {
    color: "#FF3B30",
    fontWeight: "600",
    fontSize: 15,
    letterSpacing: -0.2,
  },
  chatRoomItem: {
    backgroundColor: "#fff",
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  chatRoomInfo: {
    flex: 1,
    marginLeft: 16,
    marginRight: 12,
  },
  chatRoomTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 6,
    letterSpacing: -0.4,
  },
  lastMessage: {
    fontSize: 15,
    color: "#666",
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  chatRoomMeta: {
    alignItems: "flex-end",
    minWidth: 80,
  },
  participantCount: {
    fontSize: 13,
    color: "#007AFF",
    marginBottom: 6,
    fontWeight: "500",
  },
  lastMessageTime: {
    fontSize: 13,
    color: "#999",
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 17,
    color: "#666",
    letterSpacing: -0.2,
    fontWeight: "500",
  },
  emptyListContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    backgroundColor: "#fff",
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1a1a1a",
    textAlign: "center",
    marginBottom: 12,
    letterSpacing: -0.4,
  },
  emptyStateSubtext: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    letterSpacing: -0.2,
    maxWidth: 280,
  },
});
