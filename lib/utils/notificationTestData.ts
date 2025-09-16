/**
 * notificationTestData.ts
 *
 * 通知機能のテスト用データ
 *
 * 【学習ポイント】
 * 1. テストデータの作成
 * 2. 通知機能の動作確認
 * 3. デバッグ用のヘルパー関数
 */

import {
  NotificationData,
  NotificationType,
} from "../services/NotificationService";

/**
 * テスト用の通知データを作成
 * （変更理由）：通知機能のテストとデバッグ用のサンプルデータを提供
 */
export const createTestNotifications = (userId: string): NotificationData[] => {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  return [
    {
      id: "test_notification_1",
      userId,
      type: NotificationType.MESSAGE,
      title: "田中さんからのメッセージ",
      body: "こんにちは！元気ですか？",
      data: {
        type: "chat",
        chatId: "test_chat_1",
        senderId: "user_tanaka",
        messageText: "こんにちは！元気ですか？",
      },
      createdAt: oneHourAgo,
      isRead: false,
    },
    {
      id: "test_notification_2",
      userId,
      type: NotificationType.FRIEND_REQUEST,
      title: "新しい友達リクエスト",
      body: "佐藤さん: 友達になりたいです！",
      data: {
        type: "friend_request",
        fromUserId: "user_sato",
        message: "友達になりたいです！",
      },
      createdAt: twoHoursAgo,
      isRead: false,
    },
    {
      id: "test_notification_3",
      userId,
      type: NotificationType.FRIEND_ACCEPTED,
      title: "友達リクエストが承認されました",
      body: "山田さんが友達リクエストを承認しました",
      data: {
        type: "friend_accepted",
        accepterId: "user_yamada",
      },
      createdAt: oneDayAgo,
      isRead: true,
    },
    {
      id: "test_notification_4",
      userId,
      type: NotificationType.MESSAGE,
      title: "鈴木さんからのメッセージ",
      body: "明日の会議の件で相談があります",
      data: {
        type: "chat",
        chatId: "test_chat_2",
        senderId: "user_suzuki",
        messageText: "明日の会議の件で相談があります",
      },
      createdAt: oneDayAgo,
      isRead: true,
    },
  ];
};

/**
 * 通知機能のテスト用ヘルパー関数
 * （変更理由）：通知機能の動作確認用のユーティリティ関数
 */
export const NotificationTestUtils = {
  /**
   * テスト通知の作成
   */
  createTestNotification: (
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    data: any = {}
  ): NotificationData => ({
    id: `test_${Date.now()}`,
    userId,
    type,
    title,
    body,
    data,
    createdAt: new Date(),
    isRead: false,
  }),

  /**
   * 通知データの検証
   */
  validateNotification: (notification: NotificationData): boolean => {
    return !!(
      notification.id &&
      notification.userId &&
      notification.type &&
      notification.title &&
      notification.body &&
      notification.createdAt &&
      typeof notification.isRead === "boolean"
    );
  },

  /**
   * 通知の一覧表示用フォーマット
   */
  formatNotificationForDisplay: (notification: NotificationData): string => {
    const time =
      notification.createdAt instanceof Date
        ? notification.createdAt.toLocaleTimeString()
        : "不明な時刻";

    return `[${time}] ${notification.title}: ${notification.body}`;
  },

  /**
   * 未読通知のフィルタリング
   */
  filterUnreadNotifications: (
    notifications: NotificationData[]
  ): NotificationData[] => {
    return notifications.filter((notification) => !notification.isRead);
  },

  /**
   * 通知タイプ別のフィルタリング
   */
  filterNotificationsByType: (
    notifications: NotificationData[],
    type: NotificationType
  ): NotificationData[] => {
    return notifications.filter((notification) => notification.type === type);
  },
};

/**
 * 通知機能のデバッグ用ログ
 * （変更理由）：通知機能のデバッグとトラブルシューティング用
 */
export const NotificationDebugLogger = {
  /**
   * 通知データのログ出力
   */
  logNotification: (
    notification: NotificationData,
    context: string = ""
  ): void => {
    console.log(`🔔 Notification Debug ${context}:`, {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
      data: notification.data,
    });
  },

  /**
   * 通知一覧のログ出力
   */
  logNotificationList: (
    notifications: NotificationData[],
    context: string = ""
  ): void => {
    console.log(`🔔 Notification List Debug ${context}:`, {
      totalCount: notifications.length,
      unreadCount: notifications.filter((n) => !n.isRead).length,
      notifications: notifications.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        isRead: n.isRead,
      })),
    });
  },

  /**
   * 通知設定のログ出力
   */
  logNotificationSettings: (settings: any, context: string = ""): void => {
    console.log(`🔔 Notification Settings Debug ${context}:`, settings);
  },
};
