/**
 * chat.ts
 *
 * チャット機能に関するFirebase操作を管理するモジュール
 *
 * 【機能】
 * 1. チャットルームの作成・取得・更新
 * 2. メッセージの送信・取得
 * 3. リアルタイム更新の購読
 * 4. 既読/未読ステータスの管理
 */

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { NotificationService } from "../services/NotificationService";
import { auth, db } from "./config";
import { ChatRoom, ExtendedMessage, MessageSummary } from "./models";

/**
 * チャットルームを作成する
 *
 * @param participants - 参加者のユーザーID配列
 * @param type - チャットタイプ（"direct" | "group"）
 * @param name - グループチャット名（グループチャットの場合のみ）
 * @returns 作成されたチャットルームのID
 */
export const createChatRoom = async (
  participants: string[],
  type: "direct" | "group",
  name?: string
): Promise<string> => {
  try {
    // （変更理由）：serverTimestamp()はFieldValue型を返すため、型定義を修正
    const chatRoomData: Omit<ChatRoom, "id"> = {
      type,
      participants,
      createdAt: serverTimestamp() as any, // FieldValue型をanyでキャスト
      updatedAt: serverTimestamp() as any, // FieldValue型をanyでキャスト
      createdBy: participants[0], // 作成者は最初の参加者
      isActive: true,
      ...(name && { name }), // グループチャットの場合のみ名前を設定
    };

    // Firestoreにチャットルームを追加
    const chatRoomRef = await addDoc(collection(db, "chatRooms"), chatRoomData);
    console.log("Chat room created with ID:", chatRoomRef.id);

    return chatRoomRef.id;
  } catch (error) {
    console.error("Error creating chat room:", error);
    throw error;
  }
};

/**
 * メッセージを送信する
 *
 * @param chatId - チャットルームID
 * @param message - 送信するメッセージ
 * @returns 送信されたメッセージのID
 */
export const sendMessage = async (
  chatId: string,
  message: Omit<ExtendedMessage, "id" | "timestamp">
): Promise<string> => {
  try {
    // （変更理由）：serverTimestamp()はFieldValue型を返すため、型定義を修正
    const messageData = {
      ...message,
      timestamp: serverTimestamp() as any, // FieldValue型をanyでキャスト
    };

    // Firestoreにメッセージを追加
    const messageRef = await addDoc(
      collection(db, "chatRooms", chatId, "messages"),
      messageData
    );
    console.log("Message sent with ID:", messageRef.id);

    // チャットルームの最新メッセージを更新
    const messageSummary: MessageSummary = {
      id: messageRef.id,
      text: message.text.substring(0, 50), // 最初の50文字のみ保存
      sender: message.sender,
      timestamp: messageData.timestamp,
      type: message.type,
    };

    await updateDoc(doc(db, "chatRooms", chatId), {
      lastMessage: messageSummary,
      updatedAt: serverTimestamp() as any, // FieldValue型をanyでキャスト
    });

    // （変更理由）：通知機能の統合 - メッセージ送信時に通知を送信
    await sendMessageNotification(chatId, message.sender, message.text);

    return messageRef.id;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

/**
 * チャットルームのメッセージを取得する
 *
 * @param chatId - チャットルームID
 * @param limit - 取得するメッセージの上限数
 * @returns メッセージの配列
 */
export const getChatMessages = async (
  chatId: string,
  limitCount: number = 50
): Promise<ExtendedMessage[]> => {
  try {
    const messagesQuery = query(
      collection(db, "chatRooms", chatId, "messages"),
      orderBy("timestamp", "desc"),
      limit(limitCount)
    );

    const messagesSnapshot = await getDocs(messagesQuery);
    const messages = messagesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ExtendedMessage[];

    return messages.reverse(); // 古い順に並び替え
  } catch (error) {
    console.error("Error getting chat messages:", error);
    throw error;
  }
};

/**
 * チャットルームのメッセージをリアルタイムで購読する
 *
 * @param chatId - チャットルームID
 * @param callback - 新しいメッセージを受け取るコールバック関数
 * @returns 購読解除関数
 */
export const subscribeToChatMessages = (
  chatId: string,
  callback: (messages: ExtendedMessage[]) => void
): (() => void) => {
  // （変更理由）：認証状態を確認してからFirestoreクエリを実行するように修正
  console.log(
    "subscribeToChatMessages: Starting subscription for chatId:",
    chatId
  );

  // （変更理由）：認証状態を詳細にログ出力
  console.log("subscribeToChatMessages: Auth state check:", {
    auth: auth ? "initialized" : "not initialized",
    currentUser: auth?.currentUser
      ? {
          email: auth.currentUser.email,
          uid: auth.currentUser.uid,
          emailVerified: auth.currentUser.emailVerified,
        }
      : "no user",
  });

  const messagesQuery = query(
    collection(db, "chatRooms", chatId, "messages"),
    orderBy("timestamp", "desc")
  );

  return onSnapshot(
    messagesQuery,
    (snapshot) => {
      console.log(
        "subscribeToChatMessages: Received snapshot with",
        snapshot.docs.length,
        "messages"
      );
      const messages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ExtendedMessage[];

      callback(messages.reverse());
    },
    (error) => {
      // （変更理由）：onSnapshotのエラーハンドリングを追加して権限エラーを適切に処理
      console.error("subscribeToChatMessages: Snapshot listener error:", error);

      if (error.code === "permission-denied") {
        console.error(
          "subscribeToChatMessages: Permission denied - user may not be authenticated"
        );
        // 空のメッセージ配列でコールバックを呼び出し、UIのクラッシュを防ぐ
        callback([]);
      } else {
        console.error("subscribeToChatMessages: Unexpected error:", error);
        // その他のエラーでも空の配列を返してアプリの安定性を保つ
        callback([]);
      }
    }
  );
};

/**
 * ユーザーのチャットルーム一覧を取得する
 *
 * @param userId - ユーザーID
 * @returns チャットルームの配列
 */
export const getUserChatRooms = async (userId: string): Promise<ChatRoom[]> => {
  try {
    const chatRoomsQuery = query(
      collection(db, "chatRooms"),
      where("participants", "array-contains", userId),
      where("isActive", "==", true),
      orderBy("updatedAt", "desc")
    );

    const chatRoomsSnapshot = await getDocs(chatRoomsQuery);
    return chatRoomsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ChatRoom[];
  } catch (error) {
    console.error("Error getting user chat rooms:", error);
    throw error;
  }
};

/**
 * チャットルームの情報を更新する
 *
 * @param chatId - チャットルームID
 * @param updates - 更新するフィールドと値
 */
export const updateChatRoom = async (
  chatId: string,
  updates: Partial<ChatRoom>
): Promise<void> => {
  try {
    const chatRoomRef = doc(db, "chatRooms", chatId);
    await updateDoc(chatRoomRef, {
      ...updates,
      updatedAt: serverTimestamp() as any, // FieldValue型をanyでキャスト
    });
    console.log("Chat room updated:", chatId);
  } catch (error) {
    console.error("Error updating chat room:", error);
    throw error;
  }
};

/**
 * メッセージを既読にする
 *
 * @param chatId - チャットルームID
 * @param messageId - メッセージID
 * @param userId - 既読したユーザーのID
 */
export const markMessageAsRead = async (
  chatId: string,
  messageId: string,
  userId: string
): Promise<void> => {
  try {
    const messageRef = doc(db, "chatRooms", chatId, "messages", messageId);
    const messageDoc = await getDoc(messageRef);

    if (!messageDoc.exists()) {
      throw new Error("Message not found");
    }

    const message = messageDoc.data();
    const readBy = message.readBy || [];

    if (!readBy.includes(userId)) {
      await updateDoc(messageRef, {
        readBy: [...readBy, userId],
      });
      console.log("Message marked as read:", messageId);
    }
  } catch (error) {
    console.error("Error marking message as read:", error);
    throw error;
  }
};

/**
 * メッセージ送信時の通知を送信
 * （変更理由）：メッセージが送信された時に受信者に通知を送信
 */
const sendMessageNotification = async (
  chatId: string,
  senderId: string,
  messageText: string
): Promise<void> => {
  try {
    // チャットルームの情報を取得
    const chatRoomDoc = await getDoc(doc(db, "chatRooms", chatId));
    if (!chatRoomDoc.exists()) {
      console.log("❌ Chat room not found:", chatId);
      return;
    }

    const chatRoom = chatRoomDoc.data() as ChatRoom;

    // 送信者以外の参加者に通知を送信
    const recipients = chatRoom.participants.filter(
      (participantId) => participantId !== senderId
    );

    const notificationService = NotificationService.getInstance();

    // 各受信者に通知を送信
    for (const recipientId of recipients) {
      await notificationService.sendChatMessageNotification(
        chatId,
        senderId,
        messageText,
        recipientId
      );
    }
  } catch (error) {
    console.error("❌ Send message notification error:", error);
    // 通知の送信に失敗してもメッセージ送信は成功とする
  }
};
