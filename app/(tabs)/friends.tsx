/**
 * friends.tsx
 *
 * 友達タブ - 開発中画面
 *
 * 【変更理由】：ファイル名を実態に合わせて変更
 *
 * 【学習ポイント】
 * 1. 開発中画面の実装パターン
 * 2. ユーザーフレンドリーなメッセージ表示
 * 3. 将来の機能拡張への準備
 */

import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import { useFriends } from "@/hooks/useFriends";
import { useAuth } from "@/lib/contexts/AuthContext";
import { UserProfile } from "@/lib/firebase/models";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

/**
 * FriendsScreen コンポーネント
 *
 * 【役割】
 * - 友達一覧の表示
 * - 友達リクエストの管理
 * - 友達とのチャット開始
 */
export default function FriendsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    friends,
    receivedRequests,
    loading,
    error,
    acceptRequest,
    rejectRequest,
    removeFriendship,
    refresh,
  } = useFriends();

  // 友達リクエストの承認
  const handleAcceptRequest = useCallback(
    async (requestId: string) => {
      try {
        await acceptRequest(requestId);
        Alert.alert("成功", "友達リクエストを承認しました");
      } catch (err) {
        Alert.alert(
          "エラー",
          err instanceof Error
            ? err.message
            : "友達リクエストの承認に失敗しました"
        );
      }
    },
    [acceptRequest]
  );

  // 友達リクエストの拒否
  const handleRejectRequest = useCallback(
    async (requestId: string) => {
      try {
        await rejectRequest(requestId);
        Alert.alert("成功", "友達リクエストを拒否しました");
      } catch (err) {
        Alert.alert(
          "エラー",
          err instanceof Error
            ? err.message
            : "友達リクエストの拒否に失敗しました"
        );
      }
    },
    [rejectRequest]
  );

  // チャットを開始
  const startChat = useCallback(
    (friend: UserProfile) => {
      router.push(`/chat?userId=${friend.id}`);
    },
    [router]
  );

  // 友達を削除
  const handleRemoveFriend = useCallback(
    async (friend: UserProfile) => {
      Alert.alert(
        "友達を削除",
        `${friend.displayName}さんを友達から削除しますか？`,
        [
          {
            text: "キャンセル",
            style: "cancel",
          },
          {
            text: "削除",
            style: "destructive",
            onPress: async () => {
              try {
                await removeFriendship(friend.id);
                Alert.alert("成功", "友達を削除しました");
              } catch (err) {
                Alert.alert(
                  "エラー",
                  err instanceof Error
                    ? err.message
                    : "友達の削除に失敗しました"
                );
              }
            },
          },
        ]
      );
    },
    [removeFriendship]
  );

  // 友達リクエストのレンダリング
  const renderRequest = useCallback(
    ({ item: request }: { item: { id: string; message?: string } }) => (
      <View style={styles.requestItem}>
        <Text style={styles.requestText}>
          {request.message || "友達になりたいです！"}
        </Text>
        <View style={styles.requestButtons}>
          <Button
            onPress={() => handleAcceptRequest(request.id)}
            style={styles.acceptButton}
            textStyle={styles.buttonText}
          >
            承認
          </Button>
          <Button
            onPress={() => handleRejectRequest(request.id)}
            style={styles.rejectButton}
            textStyle={styles.buttonText}
          >
            拒否
          </Button>
        </View>
      </View>
    ),
    [handleAcceptRequest, handleRejectRequest]
  );

  // 友達アイテムのレンダリング
  const renderFriend = useCallback(
    ({ item: friend }: { item: UserProfile }) => (
      <Pressable style={styles.friendItem} onPress={() => startChat(friend)}>
        <Avatar size={40} uri={friend.avatar} style={styles.avatar} />
        <View style={styles.friendInfo}>
          <Text style={styles.friendName}>{friend.displayName}</Text>
          <Text style={styles.friendStatus}>
            {friend.isOnline ? "オンライン" : "オフライン"}
          </Text>
        </View>
        <View style={styles.buttonContainer}>
          <Button
            onPress={() => startChat(friend)}
            style={styles.chatButton}
            textStyle={styles.buttonText}
          >
            チャット
          </Button>
          <Button
            onPress={() => handleRemoveFriend(friend)}
            style={styles.removeButton}
            textStyle={styles.buttonText}
          >
            削除
          </Button>
        </View>
      </Pressable>
    ),
    [startChat, handleRemoveFriend]
  );

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.errorText}>{error}</Text>
          <Button onPress={refresh} style={styles.retryButton}>
            再試行
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  // ユーザープロフィールエリアのレンダリング
  const renderUserProfile = () => (
    <View style={styles.profileContainer}>
      <View style={styles.profileHeader}>
        <Avatar
          uri={user?.photoURL || undefined}
          name={user?.displayName || "ゲスト"}
          size={60}
          style={styles.profileAvatar}
        />
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>
            {user?.displayName || "ゲスト"}
          </Text>
          <Text style={styles.profileEmail}>{user?.email || "未設定"}</Text>
        </View>
      </View>
      <View style={styles.profileActions}>
        <Button
          style={styles.profileButton}
          textStyle={styles.profileButtonText}
          onPress={() => {
            // TODO: プロフィール編集画面への遷移
            Alert.alert("お知らせ", "プロフィール編集機能は開発中です");
          }}
        >
          プロフィール編集
        </Button>
        <Button
          style={[styles.profileButton, styles.settingsButton]}
          textStyle={styles.profileButtonText}
          onPress={() => {
            // TODO: 設定画面への遷移
            Alert.alert("お知らせ", "設定機能は開発中です");
          }}
        >
          設定
        </Button>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      ) : (
        <FlatList
          data={friends}
          renderItem={renderFriend}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <>
              {renderUserProfile()}
              {receivedRequests.length > 0 && (
                <View style={styles.requestsContainer}>
                  <Text style={styles.sectionTitle}>友達リクエスト</Text>
                  <FlatList
                    data={receivedRequests}
                    renderItem={renderRequest}
                    keyExtractor={(item) => item.id}
                    scrollEnabled={false}
                  />
                </View>
              )}
            </>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                まだ友達がいません。{"\n"}
                友達を追加してみましょう！
              </Text>
              <Button
                onPress={() => router.push("/select-user")}
                style={styles.addButton}
              >
                友達を追加
              </Button>
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refresh} />
          }
          contentContainerStyle={styles.listContent}
        />
      )}
      <View style={styles.fab}>
        <Button
          onPress={() => router.push("/select-user")}
          style={styles.fabButton}
        >
          友達を追加
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  profileContainer: {
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  profileAvatar: {
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: "#666",
  },
  profileActions: {
    flexDirection: "row",
    gap: 12,
  },
  profileButton: {
    flex: 1,
    backgroundColor: "#007AFF",
    paddingVertical: 10,
    borderRadius: 8,
  },
  settingsButton: {
    backgroundColor: "#34C759",
  },
  profileButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 80, // FABの高さ分余白を追加
  },
  requestsContainer: {
    marginBottom: 24,
    width: "100%",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: "#1a1a1a",
  },
  requestItem: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  requestText: {
    fontSize: 14,
    color: "#1a1a1a",
    marginBottom: 12,
  },
  requestButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  acceptButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  rejectButton: {
    backgroundColor: "#f44336",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  friendItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  avatar: {
    marginRight: 12,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  friendStatus: {
    fontSize: 12,
    color: "#666",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 8,
  },
  chatButton: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  removeButton: {
    backgroundColor: "#f44336",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 24,
  },
  addButton: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 16,
    color: "#f44336",
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 16,
    backgroundColor: "#2196F3",
    borderRadius: 28,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabButton: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 28,
  },
});
