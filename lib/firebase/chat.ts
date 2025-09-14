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
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "./config";
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
    // チャットルームのデータを作成
    const chatRoomData: Omit<ChatRoom, "id"> = {
      type,
      participants,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
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
    // メッセージにタイムスタンプを追加
    const messageData = {
      ...message,
      timestamp: serverTimestamp(),
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
      updatedAt: serverTimestamp(),
    });

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
  limit: number = 50
): Promise<ExtendedMessage[]> => {
  try {
    const messagesQuery = query(
      collection(db, "chatRooms", chatId, "messages"),
      orderBy("timestamp", "desc"),
      limit(limit)
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
  const messagesQuery = query(
    collection(db, "chatRooms", chatId, "messages"),
    orderBy("timestamp", "desc")
  );

  return onSnapshot(messagesQuery, (snapshot) => {
    const messages = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ExtendedMessage[];

    callback(messages.reverse());
  });
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
      updatedAt: serverTimestamp(),
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
