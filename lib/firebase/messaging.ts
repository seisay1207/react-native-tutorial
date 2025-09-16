/**
 * messaging.ts
 *
 * Firebase Cloud Messaging (FCM) の設定と管理
 *
 * 【学習ポイント】
 * 1. Firebase Cloud Messagingの初期化と設定
 * 2. プッシュ通知の受信と処理
 * 3. 通知トークンの管理
 * 4. バックグラウンド通知の処理
 * 5. 通知権限の管理
 */

import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { Platform } from "react-native";

// Firebase設定をインポート
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "./config";

/**
 * 通知の表示設定
 * （変更理由）：通知の表示方法とユーザーインタラクションを定義
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Firebase Cloud Messaging インスタンス
 */
let messaging: any = null;

/**
 * FCMの初期化
 * （変更理由）：Firebase Cloud Messagingを初期化し、通知機能を有効化
 */
export const initializeMessaging = async (): Promise<void> => {
  try {
    // Web環境ではFCMを初期化しない
    if (Platform.OS === "web") {
      console.log("Web環境ではFCMを初期化しません");
      return;
    }

    // Firebase Messagingの初期化
    messaging = getMessaging();
    console.log("✅ Firebase Messaging initialized");

    // 通知権限のリクエスト
    await requestNotificationPermissions();

    // FCMトークンの取得と登録
    await registerForPushNotifications();

    // フォアグラウンド通知のリスナー設定
    setupForegroundNotificationListener();
  } catch (error) {
    console.error("❌ FCM initialization error:", error);
    throw error;
  }
};

/**
 * 通知権限のリクエスト
 * （変更理由）：ユーザーに通知権限をリクエストし、権限状態を確認
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    if (Device.isDevice) {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.log("❌ Notification permission denied");
        return false;
      }

      console.log("✅ Notification permission granted");
      return true;
    } else {
      console.log("❌ Must use physical device for Push Notifications");
      return false;
    }
  } catch (error) {
    console.error("❌ Permission request error:", error);
    return false;
  }
};

/**
 * プッシュ通知の登録
 * （変更理由）：FCMトークンを取得し、Firestoreに保存して通知の送信先を管理
 */
export const registerForPushNotifications = async (): Promise<
  string | null
> => {
  try {
    if (!Device.isDevice) {
      console.log("❌ Must use physical device for Push Notifications");
      return null;
    }

    // Expo Push Tokenの取得
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    });

    console.log("✅ Expo Push Token:", token.data);

    // Firebase Cloud Messaging Tokenの取得（Android用）
    if (Platform.OS === "android") {
      const fcmToken = await getToken(messaging, {
        vapidKey: process.env.EXPO_PUBLIC_FIREBASE_VAPID_KEY,
      });

      if (fcmToken) {
        console.log("✅ FCM Token:", fcmToken);
        await saveNotificationToken(fcmToken);
        return fcmToken;
      }
    }

    // Expo Push TokenをFirestoreに保存
    await saveNotificationToken(token.data);
    return token.data;
  } catch (error) {
    console.error("❌ Push notification registration error:", error);
    return null;
  }
};

/**
 * 通知トークンをFirestoreに保存
 * （変更理由）：ユーザーの通知トークンをFirestoreに保存して、後で通知を送信できるようにする
 */
export const saveNotificationToken = async (token: string): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.log("❌ No authenticated user");
      return;
    }

    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, {
      notificationToken: token,
      tokenUpdatedAt: serverTimestamp(),
    });

    console.log("✅ Notification token saved to Firestore");
  } catch (error) {
    console.error("❌ Save notification token error:", error);
  }
};

/**
 * フォアグラウンド通知のリスナー設定
 * （変更理由）：アプリがフォアグラウンドにある時の通知受信を処理
 */
export const setupForegroundNotificationListener = (): void => {
  if (!messaging) {
    console.log("❌ Messaging not initialized");
    return;
  }

  // Firebase Cloud Messagingのフォアグラウンド通知リスナー
  onMessage(messaging, (payload: any) => {
    console.log("📱 Foreground notification received:", payload);

    // 通知の表示
    if (payload.notification) {
      Notifications.scheduleNotificationAsync({
        content: {
          title: payload.notification.title,
          body: payload.notification.body,
          data: payload.data || {},
        },
        trigger: null, // 即座に表示
      });
    }
  });

  // Expo Notificationsのリスナー
  Notifications.addNotificationReceivedListener((notification) => {
    console.log("📱 Expo notification received:", notification);
  });

  Notifications.addNotificationResponseReceivedListener((response) => {
    console.log("📱 Notification response:", response);
    // 通知タップ時の処理をここに追加
    handleNotificationResponse(response);
  });
};

/**
 * 通知レスポンスの処理
 * （変更理由）：ユーザーが通知をタップした時の処理を定義
 */
export const handleNotificationResponse = (
  response: Notifications.NotificationResponse
): void => {
  try {
    const data = response.notification.request.content.data;
    console.log("📱 Notification data:", data);

    // 通知タイプに応じた処理
    if (data?.type === "chat") {
      // チャット通知の場合
      console.log("📱 Chat notification tapped");
      // ここでチャット画面への遷移処理を追加
    } else if (data?.type === "friend_request") {
      // 友達リクエスト通知の場合
      console.log("📱 Friend request notification tapped");
      // ここで友達リクエスト画面への遷移処理を追加
    }
  } catch (error) {
    console.error("❌ Handle notification response error:", error);
  }
};

/**
 * 通知の送信（サーバーサイド用のヘルパー関数）
 * （変更理由）：他のユーザーに通知を送信するためのヘルパー関数
 */
export const sendNotificationToUser = async (
  targetUserId: string,
  title: string,
  body: string,
  data: any = {}
): Promise<void> => {
  try {
    // 実際の実装では、サーバーサイドでFCM Admin SDKを使用して通知を送信
    // ここではFirestoreに通知データを保存する例を示す
    const notificationRef = doc(
      db,
      "notifications",
      `${Date.now()}_${targetUserId}`
    );
    await setDoc(notificationRef, {
      userId: targetUserId,
      title,
      body,
      data,
      createdAt: serverTimestamp(),
      isRead: false,
    });

    console.log("✅ Notification data saved to Firestore");
  } catch (error) {
    console.error("❌ Send notification error:", error);
  }
};

/**
 * 通知設定の取得
 * （変更理由）：ユーザーの通知設定を取得
 */
export const getNotificationSettings = async (userId: string): Promise<any> => {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      return {
        pushNotifications: userData.pushNotifications ?? true,
        messageNotifications: userData.messageNotifications ?? true,
        friendRequestNotifications: userData.friendRequestNotifications ?? true,
      };
    }

    return null;
  } catch (error) {
    console.error("❌ Get notification settings error:", error);
    return null;
  }
};

/**
 * 通知設定の更新
 * （変更理由）：ユーザーの通知設定を更新
 */
export const updateNotificationSettings = async (
  userId: string,
  settings: {
    pushNotifications?: boolean;
    messageNotifications?: boolean;
    friendRequestNotifications?: boolean;
  }
): Promise<void> => {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      ...settings,
      settingsUpdatedAt: serverTimestamp(),
    });

    console.log("✅ Notification settings updated");
  } catch (error) {
    console.error("❌ Update notification settings error:", error);
  }
};

/**
 * 通知の既読状態を更新
 * （変更理由）：通知を既読としてマーク
 */
export const markNotificationAsRead = async (
  notificationId: string
): Promise<void> => {
  try {
    const notificationRef = doc(db, "notifications", notificationId);
    await updateDoc(notificationRef, {
      isRead: true,
      readAt: serverTimestamp(),
    });

    console.log("✅ Notification marked as read");
  } catch (error) {
    console.error("❌ Mark notification as read error:", error);
  }
};

/**
 * ユーザーの未読通知を取得
 * （変更理由）：ユーザーの未読通知一覧を取得
 */
export const getUnreadNotifications = async (
  userId: string
): Promise<any[]> => {
  try {
    const { collection, query, where, orderBy, getDocs } = await import(
      "firebase/firestore"
    );

    const notificationsQuery = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      where("isRead", "==", false),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(notificationsQuery);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("❌ Get unread notifications error:", error);
    return [];
  }
};
