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
import { NotificationListComponent } from "@/components/ui/NotificationList";
import { NotificationSettingsComponent } from "@/components/ui/NotificationSettings";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/lib/contexts/AuthContext";
import { signOutUser } from "@/lib/firebase/auth";
import {
  getChatRooms,
  getFriends,
  getFriendsWithExistingChatRooms,
  getUserProfile,
} from "@/lib/firebase/firestore";
import { ChatRoom, UserProfile } from "@/lib/firebase/models";
import { NotificationData } from "@/lib/services/NotificationService";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
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

  // 通知機能の取得
  const { unreadCount } = useNotifications();

  // ローカル状態の管理
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showFriendSelection, setShowFriendSelection] = useState(false);
  const [availableFriends, setAvailableFriends] = useState<UserProfile[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [chatRoomParticipants, setChatRoomParticipants] = useState<
    Map<string, UserProfile>
  >(new Map());

  // 通知モーダルの状態管理
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] =
    useState(false);

  /**
   * チャットルーム一覧の取得
   * （変更理由）：個別チャットルームの相手の名前を表示するために参加者情報も取得
   */
  const fetchChatRooms = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const rooms = await getChatRooms(user.uid);
      setChatRooms(rooms);

      // 個別チャットルームの参加者情報を取得
      const participantsMap = new Map<string, UserProfile>();

      for (const room of rooms) {
        if (room.type === "direct") {
          // 個別チャットの場合、相手の情報を取得
          const otherParticipantId = room.participants.find(
            (id) => id !== user.uid
          );
          if (otherParticipantId) {
            try {
              const participantProfile = await getUserProfile(
                otherParticipantId
              );
              if (participantProfile) {
                participantsMap.set(room.id, participantProfile);
              }
            } catch (error) {
              console.error("参加者情報の取得に失敗:", error);
            }
          }
        }
      }

      setChatRoomParticipants(participantsMap);
    } catch (error) {
      console.error("チャットルームの取得に失敗:", error);
      Alert.alert("エラー", "チャットルームの取得に失敗しました");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  /**
   * 新しい個別チャットルームの作成
   * （変更理由）：友達選択画面を表示してチャットルーム作成機能を実装
   */
  const createNewChat = async () => {
    if (!user) {
      Alert.alert("エラー", "ログインが必要です");
      return;
    }

    try {
      setIsLoadingFriends(true);

      // 友達リストと既存チャットルームがある友達を並行取得
      const [friends, friendsWithChatRooms] = await Promise.all([
        getFriends(user.uid),
        getFriendsWithExistingChatRooms(user.uid),
      ]);

      // 既存チャットルームがない友達のみを抽出
      const friendsWithChatRoomIds = new Set(friendsWithChatRooms);
      const availableFriendsList = friends.filter(
        (friend) => !friendsWithChatRoomIds.has(friend.id)
      );

      setAvailableFriends(availableFriendsList);
      setShowFriendSelection(true);
    } catch (error) {
      console.error("友達リスト取得エラー:", error);
      Alert.alert("エラー", "友達リストの取得に失敗しました");
    } finally {
      setIsLoadingFriends(false);
    }
  };

  /**
   * 友達選択をキャンセル
   */
  const cancelFriendSelection = () => {
    setShowFriendSelection(false);
    setAvailableFriends([]);
  };

  /**
   * 選択した友達とのチャットを開始
   */
  const startChatWithFriend = async (friend: UserProfile) => {
    if (!user) {
      Alert.alert("エラー", "ログインが必要です");
      return;
    }

    try {
      setIsCreatingChat(true);

      // 友達とのチャットルームを作成または取得
      const { createOrGetDirectChatRoom } = await import(
        "@/lib/firebase/firestore"
      );
      const chatRoomId = await createOrGetDirectChatRoom(user.uid, friend.id);

      // 友達選択画面を閉じてチャット画面に遷移
      setShowFriendSelection(false);
      router.push(`/chat?chatId=${chatRoomId}`);
    } catch (error) {
      console.error("チャット開始エラー:", error);
      Alert.alert(
        "エラー",
        error instanceof Error ? error.message : "チャットの開始に失敗しました"
      );
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
   * 通知ボタンのタップ処理
   * （変更理由）：通知モーダルを表示
   */
  const handleNotificationPress = () => {
    setShowNotificationModal(true);
  };

  /**
   * 通知タップ時の処理
   * （変更理由）：通知をタップした時に適切な画面に遷移
   */
  const handleNotificationItemPress = (notification: NotificationData) => {
    try {
      const data = notification.data;

      if (data?.type === "chat") {
        // チャット通知の場合、チャット画面に遷移
        setShowNotificationModal(false);
        router.push({
          pathname: "/chat",
          params: { chatId: data.chatId },
        });
      } else if (data?.type === "friend_request") {
        // 友達リクエスト通知の場合、友達画面に遷移
        setShowNotificationModal(false);
        router.push("/(tabs)/friends");
      } else if (data?.type === "friend_accepted") {
        // 友達承認通知の場合、友達画面に遷移
        setShowNotificationModal(false);
        router.push("/(tabs)/friends");
      }
    } catch (error) {
      console.error("❌ Handle notification press error:", error);
      Alert.alert("エラー", "画面の遷移に失敗しました。");
    }
  };

  /**
   * 通知設定ボタンのタップ処理
   * （変更理由）：通知設定画面を表示
   */
  const handleNotificationSettingsPress = () => {
    setShowNotificationSettings(true);
  };

  /**
   * チャットルーム一覧の初期化
   */
  useEffect(() => {
    fetchChatRooms();
  }, [user, fetchChatRooms]);

  /**
   * チャットルームアイテムのレンダリング
   * （変更理由）：個別チャットルームの相手の名前を正しく表示
   */
  const renderChatRoomItem = ({ item }: { item: ChatRoom }) => {
    const getChatTitle = () => {
      if (item.type === "group" && item.name) {
        return item.name;
      }
      // 個別チャットの場合、相手の名前を表示
      const participant = chatRoomParticipants.get(item.id);
      return participant ? participant.displayName : "個別チャット";
    };

    const getChatAvatar = () => {
      if (item.type === "group") {
        return {
          name: item.name || "グループ",
          backgroundColor: "#34C759",
        };
      }
      // 個別チャットの場合、相手のアバターを表示
      const participant = chatRoomParticipants.get(item.id);
      return {
        uri: participant?.avatar,
        name: participant?.displayName || "個別チャット",
        backgroundColor: "#007AFF",
      };
    };

    const getLastMessageText = () => {
      if (item.lastMessage) {
        return item.lastMessage.text;
      }
      return "まだメッセージがありません";
    };

    const avatarProps = getChatAvatar();

    return (
      <TouchableOpacity
        style={styles.chatRoomItem}
        onPress={() => navigateToChat(item.id)}
      >
        <Avatar
          uri={avatarProps.uri}
          name={avatarProps.name}
          size={50}
          backgroundColor={avatarProps.backgroundColor}
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
        {/* 通知ボタン */}
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={handleNotificationPress}
        >
          <Text style={styles.notificationIcon}>🔔</Text>
          {unreadCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>
                {unreadCount > 99 ? "99+" : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>

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

  /**
   * 通知モーダルのレンダリング
   * （変更理由）：通知一覧をモーダルで表示
   */
  const renderNotificationModal = () => (
    <Modal
      visible={showNotificationModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowNotificationModal(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>通知</Text>
          <View style={styles.modalHeaderButtons}>
            <TouchableOpacity
              style={styles.modalSettingsButton}
              onPress={handleNotificationSettingsPress}
            >
              <Text style={styles.modalSettingsButtonText}>設定</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowNotificationModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>閉じる</Text>
            </TouchableOpacity>
          </View>
        </View>
        <NotificationListComponent
          onNotificationPress={handleNotificationItemPress}
        />
      </SafeAreaView>
    </Modal>
  );

  /**
   * 通知設定モーダルのレンダリング
   * （変更理由）：通知設定をモーダルで表示
   */
  const renderNotificationSettingsModal = () => (
    <Modal
      visible={showNotificationSettings}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowNotificationSettings(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>通知設定</Text>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setShowNotificationSettings(false)}
          >
            <Text style={styles.modalCloseButtonText}>閉じる</Text>
          </TouchableOpacity>
        </View>
        <NotificationSettingsComponent />
      </SafeAreaView>
    </Modal>
  );

  /**
   * 友達選択画面のレンダリング
   * （変更理由）：チャットタブの新規作成で友達選択機能を実装
   */
  const renderFriendSelection = () => (
    <View style={styles.friendSelectionOverlay}>
      <View style={styles.friendSelectionContainer}>
        <View style={styles.friendSelectionHeader}>
          <Text style={styles.friendSelectionTitle}>友達を選択</Text>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={cancelFriendSelection}
          >
            <Text style={styles.cancelButtonText}>キャンセル</Text>
          </TouchableOpacity>
        </View>

        {isLoadingFriends ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>友達を読み込み中...</Text>
          </View>
        ) : availableFriends.length === 0 ? (
          <View style={styles.emptyFriendsState}>
            <Text style={styles.emptyFriendsText}>
              チャットを開始できる友達がいません
            </Text>
            <Text style={styles.emptyFriendsSubtext}>
              すべての友達と既にチャットルームが作成されています
            </Text>
          </View>
        ) : (
          <FlatList
            data={availableFriends}
            renderItem={({ item: friend }) => (
              <TouchableOpacity
                style={styles.friendSelectionItem}
                onPress={() => startChatWithFriend(friend)}
                disabled={isCreatingChat}
              >
                <Avatar
                  uri={friend.avatar}
                  name={friend.displayName}
                  size={40}
                  style={styles.friendSelectionAvatar}
                />
                <View style={styles.friendSelectionInfo}>
                  <Text style={styles.friendSelectionName}>
                    {friend.displayName}
                  </Text>
                  <Text style={styles.friendSelectionStatus}>
                    {friend.isOnline ? "オンライン" : "オフライン"}
                  </Text>
                </View>
                {isCreatingChat && (
                  <ActivityIndicator size="small" color="#007AFF" />
                )}
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id}
            style={styles.friendSelectionList}
          />
        )}
      </View>
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
      {showFriendSelection && renderFriendSelection()}
      {renderNotificationModal()}
      {renderNotificationSettingsModal()}
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
  notificationButton: {
    position: "relative",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 44,
    minHeight: 44,
  },
  notificationIcon: {
    fontSize: 18,
    color: "#666",
  },
  notificationBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#f44336",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  notificationBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
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
  // 友達選択画面のスタイル
  friendSelectionOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  friendSelectionContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    margin: 20,
    maxHeight: "80%",
    width: "90%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  friendSelectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e1e5e9",
  },
  friendSelectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "500",
  },
  friendSelectionList: {
    maxHeight: 400,
  },
  friendSelectionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  friendSelectionAvatar: {
    marginRight: 12,
  },
  friendSelectionInfo: {
    flex: 1,
  },
  friendSelectionName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  friendSelectionStatus: {
    fontSize: 14,
    color: "#666",
  },
  emptyFriendsState: {
    padding: 40,
    alignItems: "center",
  },
  emptyFriendsText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    textAlign: "center",
    marginBottom: 8,
  },
  emptyFriendsSubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  // モーダルのスタイル
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e1e5e9",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  modalHeaderButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  modalSettingsButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 70,
    alignItems: "center",
  },
  modalSettingsButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  modalCloseButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    minWidth: 70,
    alignItems: "center",
  },
  modalCloseButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "500",
  },
});
