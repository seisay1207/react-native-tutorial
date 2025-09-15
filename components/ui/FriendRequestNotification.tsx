/**
 * FriendRequestNotification.tsx
 *
 * 友達リクエスト通知ボックスコンポーネント
 *
 * 【変更理由】：友達リクエストの受信状況を視覚的に通知するためのコンポーネントを新規作成
 *
 * 【学習ポイント】
 * 1. 通知UIの設計パターン
 * 2. アニメーション効果の実装
 * 3. ユーザビリティを考慮したインタラクション
 * 4. アクセシビリティの配慮
 */

import Avatar from "@/components/ui/Avatar";
import { FriendRequest, UserProfile } from "@/lib/firebase/models";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

interface FriendRequestWithSender extends FriendRequest {
  senderProfile: UserProfile | null;
}

interface FriendRequestNotificationProps {
  /** 受信した友達リクエストの配列（送信者情報を含む） */
  requests: FriendRequestWithSender[];
  /** 通知ボックスをタップした時のコールバック */
  onPress?: () => void;
  /** 通知を閉じる時のコールバック */
  onDismiss?: () => void;
  /** アニメーション有効フラグ */
  animated?: boolean;
}

/**
 * FriendRequestNotification コンポーネント
 *
 * 【役割】
 * - 友達リクエストの受信状況を視覚的に通知
 * - リクエスト数の表示
 * - タップ時のアクション実行
 * - アニメーション効果による注意喚起
 */
export default function FriendRequestNotification({
  requests,
  onPress,
  onDismiss,
  animated = true,
}: FriendRequestNotificationProps) {
  // アニメーション値の初期化（Hooksは常に同じ順序で呼び出す必要があるため、早期リターンの前に配置）
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  // パルスアニメーションの実行
  React.useEffect(() => {
    if (animated && requests.length > 0) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();

      return () => pulseAnimation.stop();
    }
  }, [animated, pulseAnim, requests.length]);

  // タップ時のアニメーション
  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  // 通知ボックスのタップ処理
  const handlePress = useCallback(() => {
    onPress?.();
  }, [onPress]);

  // 閉じるボタンのタップ処理
  const handleDismiss = useCallback(
    (e: any) => {
      e.stopPropagation(); // 親要素のタップイベントを防ぐ
      onDismiss?.();
    },
    [onDismiss]
  );

  // 【変更理由】：閉じるボタンのタップ時のアニメーション
  const handleDismissPressIn = useCallback(() => {
    // 閉じるボタン専用のアニメーション効果
  }, []);

  const handleDismissPressOut = useCallback(() => {
    // 閉じるボタン専用のアニメーション効果
  }, []);

  // リクエスト数の表示テキスト
  const getRequestCountText = () => {
    if (requests.length === 1) {
      return "1件の友達リクエスト";
    }
    return `${requests.length}件の友達リクエスト`;
  };

  // 【変更理由】：送信者情報の表示テキストを生成
  const getSenderText = () => {
    if (requests.length === 0) return "";

    if (requests.length === 1) {
      const sender = requests[0].senderProfile;
      return sender ? `${sender.displayName}さんから` : "誰かから";
    }

    // 複数の場合は最初の送信者の名前を表示
    const firstSender = requests[0].senderProfile;
    if (firstSender) {
      return `${firstSender.displayName}さん他${requests.length - 1}人から`;
    }
    return `${requests.length}人から`;
  };

  // 【変更理由】：送信者のアバターを取得（最初の送信者のアバター）
  const getSenderAvatar = () => {
    if (requests.length === 0) return undefined;
    const firstSender = requests[0].senderProfile;
    return firstSender ? firstSender.avatar : undefined;
  };

  // 【変更理由】：送信者の名前を取得（最初の送信者の名前）
  const getSenderName = () => {
    if (requests.length === 0) return "Unknown";
    const firstSender = requests[0].senderProfile;
    return firstSender ? firstSender.displayName : "Unknown";
  };

  // リクエストがない場合は何も表示しない
  if (requests.length === 0) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { scale: animated ? pulseAnim : 1 },
            { scale: scaleAnim },
          ],
        },
      ]}
    >
      <Pressable
        style={styles.notificationBox}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel={`${getRequestCountText()}があります。タップして確認`}
        accessibilityHint="友達リクエストの詳細を確認できます"
      >
        {/* 【変更理由】：送信者のアバターを表示 */}
        <View style={styles.avatarContainer}>
          <Avatar
            uri={getSenderAvatar()}
            name={getSenderName()}
            size={40}
            style={styles.senderAvatar}
          />
          {requests.length > 1 && (
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>{requests.length}</Text>
            </View>
          )}
        </View>

        {/* 【変更理由】：送信者情報を含む通知テキスト */}
        <View style={styles.textContainer}>
          <Text style={styles.titleText}>友達リクエスト</Text>
          <Text style={styles.messageText}>{getSenderText()}</Text>
          <Text style={styles.countText}>{getRequestCountText()}</Text>
        </View>

        {/* 矢印アイコン */}
        <Ionicons name="chevron-forward" size={16} color="#666" />

        {/* 【変更理由】：閉じるボタンをより目立つデザインに改善 */}
        <Pressable
          style={styles.dismissButton}
          onPress={handleDismiss}
          onPressIn={handleDismissPressIn}
          onPressOut={handleDismissPressOut}
          accessibilityRole="button"
          accessibilityLabel="通知を閉じる"
          accessibilityHint="この通知を非表示にします"
        >
          <Ionicons name="close-circle" size={20} color="#999" />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  notificationBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
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
    borderLeftWidth: 4,
    borderLeftColor: "#FF6B6B", // 注意を引く赤色のボーダー
  },
  avatarContainer: {
    marginRight: 12,
    position: "relative",
  },
  senderAvatar: {
    borderWidth: 2,
    borderColor: "#FF6B6B",
  },
  badgeContainer: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#FF4444",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  textContainer: {
    flex: 1,
  },
  titleText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 2,
  },
  messageText: {
    fontSize: 14,
    color: "#1a1a1a",
    fontWeight: "500",
    marginBottom: 2,
  },
  countText: {
    fontSize: 12,
    color: "#666",
  },
  dismissButton: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    justifyContent: "center",
    alignItems: "center",
    minWidth: 36,
    minHeight: 36,
    // 【変更理由】：タップ時の視覚的フィードバックを追加
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
});
