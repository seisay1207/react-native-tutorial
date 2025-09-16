/**
 * NotificationSettings.tsx
 *
 * 通知設定画面のコンポーネント
 *
 * 【学習ポイント】
 * 1. 通知設定のUI実装
 * 2. スイッチコンポーネントの使用
 * 3. 設定の保存と更新
 * 4. エラーハンドリング
 */

import React from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors } from "../../constants/Colors";
import { useColorScheme } from "../../hooks/useColorScheme";
import {
  NotificationSettings,
  useNotifications,
} from "../../hooks/useNotifications";
import { ThemedText } from "../ThemedText";
import { ThemedView } from "../ThemedView";

/**
 * 通知設定コンポーネントのProps
 */
interface NotificationSettingsProps {
  onClose?: () => void;
}

/**
 * 通知設定画面のコンポーネント
 * （変更理由）：ユーザーが通知設定を変更できるUIを提供
 */
export const NotificationSettingsComponent: React.FC<
  NotificationSettingsProps
> = ({ onClose }) => {
  const colorScheme = useColorScheme();
  const {
    permissionStatus,
    requestPermission,
    settings,
    updateSettings,
    isLoading,
    error,
  } = useNotifications();

  /**
   * 通知権限のリクエスト
   * （変更理由）：ユーザーが通知権限を許可していない場合の処理
   */
  const handleRequestPermission = async () => {
    try {
      const granted = await requestPermission();
      if (!granted) {
        Alert.alert(
          "通知権限が必要です",
          "通知を受け取るには、設定アプリで通知を許可してください。",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      Alert.alert("エラー", "通知権限のリクエストに失敗しました。");
    }
  };

  /**
   * 設定の更新
   * （変更理由）：ユーザーが設定を変更した時の処理
   */
  const handleSettingChange = async (
    key: keyof NotificationSettings,
    value: boolean
  ) => {
    try {
      await updateSettings({ [key]: value });
    } catch (error) {
      Alert.alert("エラー", "設定の更新に失敗しました。");
    }
  };

  /**
   * 通知権限が許可されていない場合の表示
   */
  if (!permissionStatus?.granted) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.permissionContainer}>
          <ThemedText style={styles.permissionTitle}>
            通知権限が必要です
          </ThemedText>
          <ThemedText style={styles.permissionDescription}>
            チャットメッセージや友達リクエストの通知を受け取るには、通知権限を許可してください。
          </ThemedText>
          <TouchableOpacity
            style={[
              styles.permissionButton,
              { backgroundColor: Colors[colorScheme ?? "light"].tint },
            ]}
            onPress={handleRequestPermission}
            disabled={isLoading}
          >
            <Text style={styles.permissionButtonText}>
              {isLoading ? "処理中..." : "通知を許可"}
            </Text>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <ThemedText style={styles.title}>通知設定</ThemedText>
          {onClose && (
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>閉じる</Text>
            </TouchableOpacity>
          )}
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.settingsContainer}>
          {/* プッシュ通知の設定 */}
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <ThemedText style={styles.settingTitle}>プッシュ通知</ThemedText>
              <ThemedText style={styles.settingDescription}>
                アプリからの通知を有効/無効にします
              </ThemedText>
            </View>
            <Switch
              value={settings?.pushNotifications ?? true}
              onValueChange={(value) =>
                handleSettingChange("pushNotifications", value)
              }
              disabled={isLoading}
              trackColor={{
                false: Colors[colorScheme ?? "light"].tabIconDefault,
                true: Colors[colorScheme ?? "light"].tint,
              }}
              thumbColor={
                settings?.pushNotifications
                  ? Colors[colorScheme ?? "light"].background
                  : Colors[colorScheme ?? "light"].text
              }
            />
          </View>

          {/* メッセージ通知の設定 */}
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <ThemedText style={styles.settingTitle}>
                メッセージ通知
              </ThemedText>
              <ThemedText style={styles.settingDescription}>
                新しいメッセージが届いた時の通知
              </ThemedText>
            </View>
            <Switch
              value={settings?.messageNotifications ?? true}
              onValueChange={(value) =>
                handleSettingChange("messageNotifications", value)
              }
              disabled={isLoading || !settings?.pushNotifications}
              trackColor={{
                false: Colors[colorScheme ?? "light"].tabIconDefault,
                true: Colors[colorScheme ?? "light"].tint,
              }}
              thumbColor={
                settings?.messageNotifications
                  ? Colors[colorScheme ?? "light"].background
                  : Colors[colorScheme ?? "light"].text
              }
            />
          </View>

          {/* 友達リクエスト通知の設定 */}
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <ThemedText style={styles.settingTitle}>
                友達リクエスト通知
              </ThemedText>
              <ThemedText style={styles.settingDescription}>
                友達リクエストが届いた時の通知
              </ThemedText>
            </View>
            <Switch
              value={settings?.friendRequestNotifications ?? true}
              onValueChange={(value) =>
                handleSettingChange("friendRequestNotifications", value)
              }
              disabled={isLoading || !settings?.pushNotifications}
              trackColor={{
                false: Colors[colorScheme ?? "light"].tabIconDefault,
                true: Colors[colorScheme ?? "light"].tint,
              }}
              thumbColor={
                settings?.friendRequestNotifications
                  ? Colors[colorScheme ?? "light"].background
                  : Colors[colorScheme ?? "light"].text
              }
            />
          </View>
        </View>

        {/* 説明テキスト */}
        <View style={styles.infoContainer}>
          <ThemedText style={styles.infoText}>
            • 通知設定は端末の設定アプリからも変更できます
          </ThemedText>
          <ThemedText style={styles.infoText}>
            • プッシュ通知を無効にすると、他の通知設定も無効になります
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
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
    fontSize: 20,
    fontWeight: "bold",
  },
  closeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  closeButtonText: {
    color: "#007AFF",
    fontSize: 16,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
  },
  permissionDescription: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  permissionButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  errorContainer: {
    backgroundColor: "#FFE6E6",
    padding: 12,
    margin: 16,
    borderRadius: 8,
  },
  errorText: {
    color: "#D32F2F",
    fontSize: 14,
    textAlign: "center",
  },
  settingsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    opacity: 0.7,
  },
  infoContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginTop: 20,
  },
  infoText: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 4,
  },
});
