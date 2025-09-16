/**
 * useNotifications.ts
 *
 * 通知機能を管理するカスタムフック
 *
 * 【学習ポイント】
 * 1. React Hooksを使用した通知機能の管理
 * 2. 通知権限の状態管理
 * 3. 通知設定の管理
 * 4. 通知データの取得と更新
 */

import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";
import { auth } from "../lib/firebase/config";
import {
  initializeMessaging,
  registerForPushNotifications,
  requestNotificationPermissions,
  setupForegroundNotificationListener,
} from "../lib/firebase/messaging";
import {
  NotificationData,
  NotificationService,
} from "../lib/services/NotificationService";

/**
 * 通知権限の状態
 */
export interface NotificationPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: Notifications.NotificationPermissionsStatus;
}

/**
 * 通知設定の型定義
 */
export interface NotificationSettings {
  pushNotifications: boolean;
  messageNotifications: boolean;
  friendRequestNotifications: boolean;
}

/**
 * 通知フックの戻り値の型定義
 */
export interface UseNotificationsReturn {
  // 権限関連
  permissionStatus: NotificationPermissionStatus | null;
  requestPermission: () => Promise<boolean>;

  // 設定関連
  settings: NotificationSettings | null;
  updateSettings: (settings: Partial<NotificationSettings>) => Promise<void>;

  // 通知データ関連
  notifications: NotificationData[];
  unreadCount: number;
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;

  // 状態
  isLoading: boolean;
  error: string | null;

  // 初期化
  initialize: () => Promise<void>;
}

/**
 * 通知機能を管理するカスタムフック
 * （変更理由）：通知機能の状態管理とAPI呼び出しを一元化
 */
export const useNotifications = (): UseNotificationsReturn => {
  const [permissionStatus, setPermissionStatus] =
    useState<NotificationPermissionStatus | null>(null);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const notificationService = NotificationService.getInstance();

  /**
   * 通知権限の状態を取得
   * （変更理由）：現在の通知権限状態を確認
   */
  const checkPermissionStatus = useCallback(async () => {
    try {
      if (!Device.isDevice) {
        setPermissionStatus({
          granted: false,
          canAskAgain: false,
          status: "denied" as Notifications.NotificationPermissionsStatus,
        });
        return;
      }

      const { status } = await Notifications.getPermissionsAsync();
      const canAskAgain = status === "undetermined";

      setPermissionStatus({
        granted: status === "granted",
        canAskAgain,
        status,
      });
    } catch (error) {
      console.error("❌ Check permission status error:", error);
      setError("通知権限の確認に失敗しました");
    }
  }, []);

  /**
   * 通知権限をリクエスト
   * （変更理由）：ユーザーに通知権限をリクエスト
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const granted = await requestNotificationPermissions();

      if (granted) {
        // 権限が許可された場合、FCMトークンを登録
        await registerForPushNotifications();
        await checkPermissionStatus();
      }

      return granted;
    } catch (error) {
      console.error("❌ Request permission error:", error);
      setError("通知権限のリクエストに失敗しました");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [checkPermissionStatus]);

  /**
   * 通知設定を取得
   * （変更理由）：ユーザーの通知設定を取得
   */
  const loadNotificationSettings = useCallback(async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userSettings =
        await notificationService.getUserNotificationSettings(user.uid);

      if (userSettings) {
        setSettings({
          pushNotifications: userSettings.pushNotifications ?? true,
          messageNotifications: userSettings.messageNotifications ?? true,
          friendRequestNotifications:
            userSettings.friendRequestNotifications ?? true,
        });
      } else {
        // デフォルト設定
        setSettings({
          pushNotifications: true,
          messageNotifications: true,
          friendRequestNotifications: true,
        });
      }
    } catch (error) {
      console.error("❌ Load notification settings error:", error);
      setError("通知設定の取得に失敗しました");
    }
  }, [notificationService]);

  /**
   * 通知設定を更新
   * （変更理由）：ユーザーの通知設定を更新
   */
  const updateSettings = useCallback(
    async (newSettings: Partial<NotificationSettings>) => {
      try {
        setIsLoading(true);
        setError(null);

        const user = auth.currentUser;
        if (!user) {
          setError("ユーザーが認証されていません");
          return;
        }

        await notificationService.updateUserNotificationSettings(
          user.uid,
          newSettings
        );

        // ローカル状態を更新
        setSettings((prev) => (prev ? { ...prev, ...newSettings } : null));
      } catch (error) {
        console.error("❌ Update settings error:", error);
        setError("通知設定の更新に失敗しました");
      } finally {
        setIsLoading(false);
      }
    },
    [notificationService]
  );

  /**
   * 通知一覧を取得
   * （変更理由）：ユーザーの通知一覧を取得
   */
  const loadNotifications = useCallback(async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userNotifications = await notificationService.getAllNotifications(
        user.uid
      );
      setNotifications(userNotifications);
    } catch (error) {
      console.error("❌ Load notifications error:", error);
      setError("通知の取得に失敗しました");
    }
  }, [notificationService]);

  /**
   * 通知一覧を更新
   * （変更理由）：通知一覧を再取得
   */
  const refreshNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      await loadNotifications();
    } catch (error) {
      console.error("❌ Refresh notifications error:", error);
      setError("通知の更新に失敗しました");
    } finally {
      setIsLoading(false);
    }
  }, [loadNotifications]);

  /**
   * 通知を既読としてマーク
   * （変更理由）：特定の通知を既読状態に更新
   */
  const markAsRead = useCallback(
    async (notificationId: string) => {
      try {
        await notificationService.markNotificationAsRead(notificationId);

        // ローカル状態を更新
        setNotifications((prev) =>
          prev.map((notification) =>
            notification.id === notificationId
              ? { ...notification, isRead: true }
              : notification
          )
        );
      } catch (error) {
        console.error("❌ Mark as read error:", error);
        setError("通知の既読処理に失敗しました");
      }
    },
    [notificationService]
  );

  /**
   * 全通知を既読としてマーク
   * （変更理由）：全ての通知を既読状態に更新
   */
  const markAllAsRead = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const user = auth.currentUser;
      if (!user) return;

      await notificationService.markAllNotificationsAsRead(user.uid);

      // ローカル状態を更新
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, isRead: true }))
      );
    } catch (error) {
      console.error("❌ Mark all as read error:", error);
      setError("通知の一括既読処理に失敗しました");
    } finally {
      setIsLoading(false);
    }
  }, [notificationService]);

  /**
   * 通知を削除
   * （変更理由）：特定の通知を削除
   */
  const deleteNotification = useCallback(
    async (notificationId: string) => {
      try {
        await notificationService.deleteNotification(notificationId);

        // ローカル状態から削除
        setNotifications((prev) =>
          prev.filter((notification) => notification.id !== notificationId)
        );
      } catch (error) {
        console.error("❌ Delete notification error:", error);
        setError("通知の削除に失敗しました");
      }
    },
    [notificationService]
  );

  /**
   * 通知機能の初期化
   * （変更理由）：通知機能を初期化し、必要な設定を行う
   */
  const initialize = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 通知権限の確認
      await checkPermissionStatus();

      // 通知設定の読み込み
      await loadNotificationSettings();

      // 通知一覧の読み込み
      await loadNotifications();

      // FCMの初期化（物理デバイスのみ）
      if (Device.isDevice && Platform.OS !== "web") {
        await initializeMessaging();
        setupForegroundNotificationListener();
      }
    } catch (error) {
      console.error("❌ Initialize notifications error:", error);
      setError("通知機能の初期化に失敗しました");
    } finally {
      setIsLoading(false);
    }
  }, [checkPermissionStatus, loadNotificationSettings, loadNotifications]);

  /**
   * 未読通知数の計算
   * （変更理由）：未読通知の数を計算
   */
  const unreadCount = notifications.filter(
    (notification) => !notification.isRead
  ).length;

  /**
   * 認証状態の変更を監視
   * （変更理由）：ユーザーのログイン/ログアウト時に通知データを更新
   */
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        // ログイン時：通知データを読み込み
        loadNotificationSettings();
        loadNotifications();
      } else {
        // ログアウト時：データをクリア
        setSettings(null);
        setNotifications([]);
      }
    });

    return unsubscribe;
  }, [loadNotificationSettings, loadNotifications]);

  return {
    // 権限関連
    permissionStatus,
    requestPermission,

    // 設定関連
    settings,
    updateSettings,

    // 通知データ関連
    notifications,
    unreadCount,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,

    // 状態
    isLoading,
    error,

    // 初期化
    initialize,
  };
};
