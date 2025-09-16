/**
 * notifications.tsx
 *
 * 通知一覧画面
 *
 * 【学習ポイント】
 * 1. 通知一覧の表示
 * 2. 通知の既読/未読管理
 * 3. 通知設定へのアクセス
 * 4. 通知の削除機能
 */

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { NotificationListComponent } from "@/components/ui/NotificationList";
import { NotificationSettingsComponent } from "@/components/ui/NotificationSettings";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { NotificationData } from "@/lib/services/NotificationService";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

/**
 * 通知画面のコンポーネント
 * （変更理由）：通知一覧と通知設定を管理する画面を提供
 */
export default function NotificationsScreen() {
  const colorScheme = useColorScheme();
  const [showSettings, setShowSettings] = useState(false);

  /**
   * 通知タップ時の処理
   * （変更理由）：通知をタップした時に適切な画面に遷移
   */
  const handleNotificationPress = (notification: NotificationData) => {
    try {
      const data = notification.data;

      if (data?.type === "chat") {
        // チャット通知の場合、チャット画面に遷移
        router.push({
          pathname: "/chat",
          params: { chatId: data.chatId },
        });
      } else if (data?.type === "friend_request") {
        // 友達リクエスト通知の場合、友達画面に遷移
        router.push("/(tabs)/friends");
      } else if (data?.type === "friend_accepted") {
        // 友達承認通知の場合、友達画面に遷移
        router.push("/(tabs)/friends");
      }
    } catch (error) {
      console.error("❌ Handle notification press error:", error);
      Alert.alert("エラー", "画面の遷移に失敗しました。");
    }
  };

  /**
   * 通知設定画面の表示切り替え
   * （変更理由）：通知設定ボタンをタップした時の処理
   */
  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };

  return (
    <ThemedView style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <ThemedText style={styles.title}>通知</ThemedText>
        <TouchableOpacity
          style={[
            styles.settingsButton,
            { backgroundColor: Colors[colorScheme ?? "light"].tint + "20" },
          ]}
          onPress={toggleSettings}
        >
          <Text style={styles.settingsButtonText}>設定</Text>
        </TouchableOpacity>
      </View>

      {/* 通知一覧または設定画面 */}
      {showSettings ? (
        <NotificationSettingsComponent onClose={() => setShowSettings(false)} />
      ) : (
        <NotificationListComponent
          onNotificationPress={handleNotificationPress}
        />
      )}
    </ThemedView>
  );
}

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
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  settingsButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  settingsButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#007AFF",
  },
});
