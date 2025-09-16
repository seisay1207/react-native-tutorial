/**
 * NotificationService.ts
 *
 * 通知機能を管理するサービスクラス
 *
 * 【学習ポイント】
 * 1. 通知機能の一元管理
 * 2. チャットメッセージと友達リクエストの通知処理
 * 3. 通知設定の管理
 * 4. 通知の送信と受信の処理
 */

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { db } from "../firebase/config";
import {
  getNotificationSettings,
  getUnreadNotifications,
  markNotificationAsRead,
  sendNotificationToUser,
  updateNotificationSettings,
} from "../firebase/messaging";
import { UserProfile } from "../firebase/models";

/**
 * 通知タイプの定義
 */
export enum NotificationType {
  MESSAGE = "message",
  FRIEND_REQUEST = "friend_request",
  FRIEND_ACCEPTED = "friend_accepted",
  SYSTEM = "system",
}

/**
 * 通知データの型定義
 */
export interface NotificationData {
  id?: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: any;
  createdAt?: any;
  isRead: boolean;
  readAt?: any;
}

/**
 * 通知サービスクラス
 * （変更理由）：通知機能を一元管理し、チャットと友達機能との連携を提供
 */
export class NotificationService {
  private static instance: NotificationService;

  /**
   * シングルトンインスタンスの取得
   */
  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * チャットメッセージの通知を送信
   * （変更理由）：新しいメッセージが送信された時に受信者に通知を送信
   */
  public async sendChatMessageNotification(
    chatId: string,
    senderId: string,
    messageText: string,
    recipientId: string
  ): Promise<void> {
    try {
      // 送信者のプロフィール情報を取得
      const senderProfile = await this.getUserProfile(senderId);
      if (!senderProfile) {
        console.log("❌ Sender profile not found");
        return;
      }

      // 受信者の通知設定を確認
      const settings = await getNotificationSettings(recipientId);
      if (!settings?.messageNotifications) {
        console.log("📱 Message notifications disabled for user");
        return;
      }

      // 通知データの作成
      const title = `${senderProfile.displayName}からのメッセージ`;
      const body =
        messageText.length > 50
          ? `${messageText.substring(0, 50)}...`
          : messageText;

      const notificationData: NotificationData = {
        userId: recipientId,
        type: NotificationType.MESSAGE,
        title,
        body,
        data: {
          type: "chat",
          chatId,
          senderId,
          messageText,
        },
        isRead: false,
      };

      // Firestoreに通知データを保存
      await this.saveNotificationToFirestore(notificationData);

      // プッシュ通知の送信
      await sendNotificationToUser(
        recipientId,
        title,
        body,
        notificationData.data
      );

      console.log("✅ Chat message notification sent");
    } catch (error) {
      console.error("❌ Send chat message notification error:", error);
    }
  }

  /**
   * 友達リクエストの通知を送信
   * （変更理由）：友達リクエストが送信された時に受信者に通知を送信
   */
  public async sendFriendRequestNotification(
    fromUserId: string,
    toUserId: string,
    message?: string
  ): Promise<void> {
    try {
      // 送信者のプロフィール情報を取得
      const senderProfile = await this.getUserProfile(fromUserId);
      if (!senderProfile) {
        console.log("❌ Sender profile not found");
        return;
      }

      // 受信者の通知設定を確認
      const settings = await getNotificationSettings(toUserId);
      if (!settings?.friendRequestNotifications) {
        console.log("📱 Friend request notifications disabled for user");
        return;
      }

      // 通知データの作成
      const title = "新しい友達リクエスト";
      const body = message
        ? `${senderProfile.displayName}: ${message}`
        : `${senderProfile.displayName}から友達リクエストが届きました`;

      const notificationData: NotificationData = {
        userId: toUserId,
        type: NotificationType.FRIEND_REQUEST,
        title,
        body,
        data: {
          type: "friend_request",
          fromUserId,
          message,
        },
        isRead: false,
      };

      // Firestoreに通知データを保存
      await this.saveNotificationToFirestore(notificationData);

      // プッシュ通知の送信
      await sendNotificationToUser(
        toUserId,
        title,
        body,
        notificationData.data
      );

      console.log("✅ Friend request notification sent");
    } catch (error) {
      console.error("❌ Send friend request notification error:", error);
    }
  }

  /**
   * 友達リクエスト承認の通知を送信
   * （変更理由）：友達リクエストが承認された時に送信者に通知を送信
   */
  public async sendFriendAcceptedNotification(
    fromUserId: string,
    toUserId: string
  ): Promise<void> {
    try {
      // 承認者のプロフィール情報を取得
      const accepterProfile = await this.getUserProfile(toUserId);
      if (!accepterProfile) {
        console.log("❌ Accepter profile not found");
        return;
      }

      // 通知データの作成
      const title = "友達リクエストが承認されました";
      const body = `${accepterProfile.displayName}が友達リクエストを承認しました`;

      const notificationData: NotificationData = {
        userId: fromUserId,
        type: NotificationType.FRIEND_ACCEPTED,
        title,
        body,
        data: {
          type: "friend_accepted",
          accepterId: toUserId,
        },
        isRead: false,
      };

      // Firestoreに通知データを保存
      await this.saveNotificationToFirestore(notificationData);

      // プッシュ通知の送信
      await sendNotificationToUser(
        fromUserId,
        title,
        body,
        notificationData.data
      );

      console.log("✅ Friend accepted notification sent");
    } catch (error) {
      console.error("❌ Send friend accepted notification error:", error);
    }
  }

  /**
   * 通知をFirestoreに保存
   * （変更理由）：通知データをFirestoreに保存して永続化
   */
  private async saveNotificationToFirestore(
    notificationData: NotificationData
  ): Promise<void> {
    try {
      const notificationRef = collection(db, "notifications");
      await addDoc(notificationRef, {
        ...notificationData,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("❌ Save notification to Firestore error:", error);
      throw error;
    }
  }

  /**
   * ユーザープロフィールの取得
   * （変更理由）：通知に必要な送信者の情報を取得
   */
  private async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        return {
          id: userDoc.id,
          ...userDoc.data(),
        } as UserProfile;
      }
      return null;
    } catch (error) {
      console.error("❌ Get user profile error:", error);
      return null;
    }
  }

  /**
   * ユーザーの通知設定を取得
   * （変更理由）：通知送信前にユーザーの設定を確認
   */
  public async getUserNotificationSettings(userId: string): Promise<any> {
    try {
      return await getNotificationSettings(userId);
    } catch (error) {
      console.error("❌ Get user notification settings error:", error);
      return null;
    }
  }

  /**
   * ユーザーの通知設定を更新
   * （変更理由）：ユーザーが通知設定を変更した時の処理
   */
  public async updateUserNotificationSettings(
    userId: string,
    settings: {
      pushNotifications?: boolean;
      messageNotifications?: boolean;
      friendRequestNotifications?: boolean;
    }
  ): Promise<void> {
    try {
      await updateNotificationSettings(userId, settings);
      console.log("✅ User notification settings updated");
    } catch (error) {
      console.error("❌ Update user notification settings error:", error);
      throw error;
    }
  }

  /**
   * 通知を既読としてマーク
   * （変更理由）：ユーザーが通知を確認した時に既読状態に更新
   */
  public async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      await markNotificationAsRead(notificationId);
      console.log("✅ Notification marked as read");
    } catch (error) {
      console.error("❌ Mark notification as read error:", error);
      throw error;
    }
  }

  /**
   * ユーザーの未読通知を取得
   * （変更理由）：通知一覧画面で未読通知を表示
   */
  public async getUnreadNotifications(
    userId: string
  ): Promise<NotificationData[]> {
    try {
      return await getUnreadNotifications(userId);
    } catch (error) {
      console.error("❌ Get unread notifications error:", error);
      return [];
    }
  }

  /**
   * ユーザーの全通知を取得
   * （変更理由）：通知一覧画面で全通知を表示
   */
  public async getAllNotifications(
    userId: string
  ): Promise<NotificationData[]> {
    try {
      const notificationsQuery = query(
        collection(db, "notifications"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(notificationsQuery);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as NotificationData[];
    } catch (error) {
      console.error("❌ Get all notifications error:", error);
      return [];
    }
  }

  /**
   * 通知の一括既読処理
   * （変更理由）：ユーザーが通知一覧で一括既読を実行した時の処理
   */
  public async markAllNotificationsAsRead(userId: string): Promise<void> {
    try {
      const unreadNotifications = await this.getUnreadNotifications(userId);

      const batch = unreadNotifications.map((notification) =>
        markNotificationAsRead(notification.id!)
      );

      await Promise.all(batch);
      console.log("✅ All notifications marked as read");
    } catch (error) {
      console.error("❌ Mark all notifications as read error:", error);
      throw error;
    }
  }

  /**
   * 通知の削除
   * （変更理由）：ユーザーが通知を削除した時の処理
   */
  public async deleteNotification(notificationId: string): Promise<void> {
    try {
      const { deleteDoc } = await import("firebase/firestore");
      await deleteDoc(doc(db, "notifications", notificationId));
      console.log("✅ Notification deleted");
    } catch (error) {
      console.error("❌ Delete notification error:", error);
      throw error;
    }
  }
}
