/**
 * select-user.tsx
 *
 * チャット相手選択画面
 *
 * 【役割】
 * - ユーザー一覧の表示
 * - ユーザー検索
 * - チャット相手の選択
 */

import { Avatar } from "@/components/ui/Avatar";
import { useAuth } from "@/lib/contexts/AuthContext";
import { createDirectChat, getAllUsers } from "@/lib/firebase/firestore";
import { UserProfile } from "@/lib/firebase/models";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function SelectUserScreen() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  // ユーザー一覧の取得
  useEffect(() => {
    const fetchUsers = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        const fetchedUsers = await getAllUsers(user.uid);
        setUsers(fetchedUsers);
        setFilteredUsers(fetchedUsers);
      } catch (error) {
        console.error("Failed to fetch users:", error);
        Alert.alert("エラー", "ユーザー一覧の取得に失敗しました");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [user]);

  // 検索クエリの処理
  useEffect(() => {
    const query = searchQuery.toLowerCase();
    const filtered = users.filter(
      (user) =>
        user.displayName?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query)
    );
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  // チャットルームの作成とチャット画面への遷移
  const handleUserSelect = async (selectedUser: UserProfile) => {
    if (!user) return;

    try {
      setIsCreatingChat(true);
      const chatId = await createDirectChat(user.uid, selectedUser.id);
      router.replace({
        pathname: "/chat",
        params: { chatId },
      });
    } catch (error) {
      console.error("Failed to create chat:", error);
      Alert.alert("エラー", "チャットルームの作成に失敗しました");
    } finally {
      setIsCreatingChat(false);
    }
  };

  // ユーザーアイテムのレンダリング
  const renderUserItem = ({ item }: { item: UserProfile }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => handleUserSelect(item)}
      disabled={isCreatingChat}
    >
      <Avatar
        name={item.displayName || item.email || "Unknown"}
        size={50}
        backgroundColor="#007AFF"
      />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.displayName || "Unknown"}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
      </View>
      <View style={styles.statusContainer}>
        <View
          style={[
            styles.statusIndicator,
            item.isOnline ? styles.statusOnline : styles.statusOffline,
          ]}
        />
        <Text style={styles.statusText}>
          {item.isOnline ? "オンライン" : "オフライン"}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // ヘッダーのレンダリング
  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
        disabled={isCreatingChat}
      >
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>
      <Text style={styles.title}>チャット相手を選択</Text>
    </View>
  );

  // 検索バーのレンダリング
  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <TextInput
        style={styles.searchInput}
        placeholder="ユーザーを検索..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholderTextColor="#999"
        autoCapitalize="none"
      />
    </View>
  );

  // ローディング状態の表示
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>ユーザー一覧を読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      {renderSearchBar()}
      <FlatList
        data={filteredUsers}
        renderItem={renderUserItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery
                ? "検索結果が見つかりません"
                : "ユーザーが見つかりません"}
            </Text>
          </View>
        }
      />
      {isCreatingChat && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.overlayText}>チャットルームを作成中...</Text>
        </View>
      )}
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
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e1e5e9",
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  backButtonText: {
    fontSize: 24,
    color: "#007AFF",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1a1a1a",
    letterSpacing: -0.5,
  },
  searchContainer: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e1e5e9",
  },
  searchInput: {
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 12,
    fontSize: 16,
    color: "#1a1a1a",
  },
  listContent: {
    padding: 12,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  userEmail: {
    fontSize: 14,
    color: "#666",
    letterSpacing: -0.2,
  },
  statusContainer: {
    alignItems: "center",
    marginLeft: 12,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginBottom: 4,
  },
  statusOnline: {
    backgroundColor: "#34C759",
  },
  statusOffline: {
    backgroundColor: "#999",
  },
  statusText: {
    fontSize: 12,
    color: "#666",
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
    letterSpacing: -0.3,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    letterSpacing: -0.3,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  overlayText: {
    marginTop: 16,
    fontSize: 16,
    color: "#fff",
    letterSpacing: -0.3,
  },
});
