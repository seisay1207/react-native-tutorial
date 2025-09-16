/**
 * NotificationList.tsx
 *
 * 通知一覧を表示するコンポーネント
 *
 * 【学習ポイント】
 * 1. 通知一覧の表示
 * 2. 通知の既読/未読状態の管理
 * 3. 通知の削除機能
 * 4. プルトゥリフレッシュ機能
 */

import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import React from "react";
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors } from "../../constants/Colors";
import { useColorScheme } from "../../hooks/useColorScheme";
import {
  NotificationData,
  useNotifications,
} from "../../hooks/useNotifications";
import { ThemedText } from "../ThemedText";
import { ThemedView } from "../ThemedView";

/**
 * 通知一覧コンポーネントのProps
 */
interface NotificationListProps {
  onNotificationPress?: (notification: NotificationData) => void;
}

/**
 * 通知アイテムコンポーネント
 * （変更理由）：個別の通知を表示するコンポーネント
 */
const NotificationItem: React.FC<{
  notification: NotificationData;
  onPress: () => void;
  onMarkAsRead: () => void;
  onDelete: () => void;
}> = ({ notification, onPress, onMarkAsRead, onDelete }) => {
  const colorScheme = useColorScheme();

  /**
   * 通知タイプに応じたアイコンを取得
   * （変更理由）：通知の種類を視覚的に分かりやすくする
   */
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "message":
        return "💬";
      case "friend_request":
        return "👥";
      case "friend_accepted":
        return "✅";
      default:
        return "🔔";
    }
  };

  /**
   * 通知の時刻をフォーマット
   * （変更理由）：通知の時刻を分かりやすい形式で表示
   */
  const formatNotificationTime = (timestamp: any) => {
    if (!timestamp) return "";

    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return formatDistanceToNow(date, {
        addSuffix: true,
        locale: ja,
      });
    } catch (error) {
      return "";
    }
  };

  /**
   * 通知の削除確認
   * （変更理由）：誤操作を防ぐため削除前に確認ダイアログを表示
   */
  const handleDelete = () => {
    Alert.alert("通知を削除", "この通知を削除しますか？", [
      { text: "キャンセル", style: "cancel" },
      { text: "削除", style: "destructive", onPress: onDelete },
    ]);
  };

  return (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        {
          backgroundColor: notification.isRead
            ? Colors[colorScheme ?? "light"].background
            : Colors[colorScheme ?? "light"].tint + "10",
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={styles.notificationIcon}>
            {getNotificationIcon(notification.type)}
          </Text>
          <View style={styles.notificationInfo}>
            <ThemedText style={styles.notificationTitle}>
              {notification.title}
            </ThemedText>
            <ThemedText style={styles.notificationTime}>
              {formatNotificationTime(notification.createdAt)}
            </ThemedText>
          </View>
          {!notification.isRead && <View style={styles.unreadIndicator} />}
        </View>

        <ThemedText style={styles.notificationBody}>
          {notification.body}
        </ThemedText>
      </View>

      <View style={styles.notificationActions}>
        {!notification.isRead && (
          <TouchableOpacity style={styles.actionButton} onPress={onMarkAsRead}>
            <Text style={styles.actionButtonText}>既読</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={handleDelete}
        >
          <Text style={styles.deleteButtonText}>削除</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

/**
 * 通知一覧コンポーネント
 * （変更理由）：通知一覧を表示し、通知の管理機能を提供
 */
export const NotificationListComponent: React.FC<NotificationListProps> = ({
  onNotificationPress,
}) => {
  const colorScheme = useColorScheme();
  const {
    notifications,
    unreadCount,
    refreshNotifications,
    markAsRead,
    deleteNotification,
    markAllAsRead,
    isLoading,
    error,
  } = useNotifications();

  /**
   * 通知アイテムのタップ処理
   * （変更理由）：通知をタップした時の処理
   */
  const handleNotificationPress = (notification: NotificationData) => {
    // 未読の場合は既読にマーク
    if (!notification.isRead) {
      markAsRead(notification.id!);
    }

    // カスタム処理を実行
    if (onNotificationPress) {
      onNotificationPress(notification);
    }
  };

  /**
   * 通知の既読処理
   * （変更理由）：通知を既読状態に更新
   */
  const handleMarkAsRead = (notificationId: string) => {
    markAsRead(notificationId);
  };

  /**
   * 通知の削除処理
   * （変更理由）：通知を削除
   */
  const handleDelete = (notificationId: string) => {
    deleteNotification(notificationId);
  };

  /**
   * 全通知の既読処理
   * （変更理由）：全ての通知を既読状態に更新
   */
  const handleMarkAllAsRead = () => {
    Alert.alert("全通知を既読", "全ての通知を既読にしますか？", [
      { text: "キャンセル", style: "cancel" },
      { text: "既読にする", onPress: markAllAsRead },
    ]);
  };

  /**
   * 通知アイテムのレンダリング
   * （変更理由）：FlatListで通知アイテムをレンダリング
   */
  const renderNotificationItem = ({ item }: { item: NotificationData }) => (
    <NotificationItem
      notification={item}
      onPress={() => handleNotificationPress(item)}
      onMarkAsRead={() => handleMarkAsRead(item.id!)}
      onDelete={() => handleDelete(item.id!)}
    />
  );

  /**
   * 空の通知一覧の表示
   * （変更理由）：通知がない場合の表示
   */
  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🔔</Text>
      <ThemedText style={styles.emptyTitle}>通知はありません</ThemedText>
      <ThemedText style={styles.emptyDescription}>
        新しいメッセージや友達リクエストがあると、ここに表示されます。
      </ThemedText>
    </View>
  );

  /**
   * エラーの表示
   * （変更理由）：エラーが発生した場合の表示
   */
  if (error) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <ThemedText style={styles.errorTitle}>
            エラーが発生しました
          </ThemedText>
          <ThemedText style={styles.errorDescription}>{error}</ThemedText>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={refreshNotifications}
          >
            <Text style={styles.retryButtonText}>再試行</Text>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>
          通知 {unreadCount > 0 && `(${unreadCount})`}
        </ThemedText>
        {unreadCount > 0 && (
          <TouchableOpacity
            style={styles.markAllButton}
            onPress={handleMarkAllAsRead}
          >
            <Text style={styles.markAllButtonText}>全て既読</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 通知一覧 */}
      <FlatList
        data={notifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.id!}
        ListEmptyComponent={renderEmptyComponent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refreshNotifications}
            tintColor={Colors[colorScheme ?? "light"].tint}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  markAllButtonText: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "600",
  },
  listContainer: {
    flexGrow: 1,
  },
  notificationItem: {
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  notificationIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  notificationTime: {
    fontSize: 12,
    opacity: 0.6,
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#007AFF",
    marginLeft: 8,
  },
  notificationBody: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  notificationActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#F0F0F0",
  },
  actionButtonText: {
    fontSize: 12,
    color: "#007AFF",
    fontWeight: "600",
  },
  deleteButton: {
    backgroundColor: "#FFE6E6",
  },
  deleteButtonText: {
    fontSize: 12,
    color: "#D32F2F",
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: "center",
    opacity: 0.6,
    lineHeight: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  errorDescription: {
    fontSize: 14,
    textAlign: "center",
    opacity: 0.6,
    lineHeight: 20,
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#007AFF",
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
