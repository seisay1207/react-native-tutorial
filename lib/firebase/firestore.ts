/**
 * firestore.ts
 *
 * Firebase Firestore機能の実装
 *
 * 【学習ポイント】
 * 1. Firestore Database APIの使用方法
 * 2. リアルタイムデータベースの仕組み
 * 3. 非同期処理とエラーハンドリング
 * 4. 型安全な実装（TypeScript）
 * 5. バッチ処理の活用
 */

import {
  addDoc,
  collection,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  where,
} from "firebase/firestore";
import { db } from "./config";

// 新しいデータモデルをインポート
import { ChatRoom, UserProfile } from "./models";

/**
 * @deprecated このインターフェースは非推奨です。
 * 後方互換性のために残されていますが、新しいコードでは使用しないでください。
 */
export interface Message {
  id?: string;
  chatId: string;
  text: string;
  sender: string;
  timestamp?: Timestamp;
}

/**
 * @deprecated このインターフェースは非推奨です。
 * 後方互換性のために残されていますが、新しいコードでは使用しないでください。
 */
export interface Chat {
  id?: string;
  participants: string[];
  lastMessage?: {
    text: string;
    timestamp: Timestamp;
    sender: string;
  };
  createdAt?: Timestamp;
}

/**
 * メッセージ送信機能
 */
export const addMessage = async (
  message: Omit<Message, "id" | "timestamp">
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, "messages"), {
      ...message,
      timestamp: serverTimestamp(),
    });
    return docRef.id;
  } catch (error: unknown) {
    console.error("Message send error:", error);
    throw new Error("メッセージの送信に失敗しました");
  }
};

/**
 * メッセージ取得機能
 */
export const getMessages = async (chatId: string): Promise<Message[]> => {
  try {
    const q = query(
      collection(db, "messages"),
      where("chatId", "==", chatId),
      orderBy("timestamp", "asc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Message[];
  } catch (error: unknown) {
    console.error("Message fetch error:", error);
    throw new Error("メッセージの取得に失敗しました");
  }
};

/**
 * リアルタイムメッセージ監視機能
 */
export const subscribeToMessages = (
  chatId: string,
  callback: (messages: Message[]) => void
) => {
  const q = query(
    collection(db, "messages"),
    where("chatId", "==", chatId),
    orderBy("timestamp", "asc")
  );

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Message[];
    callback(messages);
  });
};

/**
 * チャットルーム作成機能
 */
export const createDirectChat = async (
  user1Id: string,
  user2Id: string
): Promise<string> => {
  try {
    const existingChat = await getExistingDirectChat(user1Id, user2Id);
    if (existingChat) {
      return existingChat.id!;
    }

    const docRef = await addDoc(collection(db, "chatRooms"), {
      type: "direct",
      participants: [user1Id, user2Id],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: user1Id,
      isActive: true,
    });

    return docRef.id;
  } catch (error: unknown) {
    console.error("Direct chat room creation error:", error);
    throw new Error("個別チャットルームの作成に失敗しました");
  }
};

/**
 * 既存の個別チャットルームをチェック
 */
const getExistingDirectChat = async (
  user1Id: string,
  user2Id: string
): Promise<ChatRoom | null> => {
  try {
    const q = query(
      collection(db, "chatRooms"),
      where("type", "==", "direct"),
      where("participants", "array-contains", user1Id)
    );

    const snapshot = await getDocs(q);
    for (const docSnapshot of snapshot.docs) {
      const chatData = docSnapshot.data() as ChatRoom;
      if (chatData.participants.includes(user2Id)) {
        return { ...chatData, id: docSnapshot.id };
      }
    }
    return null;
  } catch (error: unknown) {
    console.error("Operation failed:", error);
    return null;
  }
};

/**
 * チャットルーム一覧の取得
 */
export const getChatRooms = async (userId: string): Promise<ChatRoom[]> => {
  try {
    const q = query(
      collection(db, "chatRooms"),
      where("participants", "array-contains", userId),
      orderBy("updatedAt", "desc")
    );

    const snapshot = await getDocs(q);
    const chatRooms = snapshot.docs
      .map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as ChatRoom)
      )
      .filter((room) => room.isActive !== false);

    return chatRooms;
  } catch (error: any) {
    console.error("Firestore error details:", {
      code: error.code,
      message: error.message,
      details: error.details,
    });

    if (error.code === "permission-denied") {
      throw new Error("チャットルームへのアクセス権限がありません");
    }

    if (
      error.code === "failed-precondition" ||
      error.message?.includes("index")
    ) {
      throw new Error(
        "インデックスの設定が必要です。Firebase Consoleを確認してください"
      );
    }

    throw new Error(`チャットルーム一覧の取得に失敗しました: ${error.message}`);
  }
};

/**
 * ユーザー一覧の取得
 */
export const getAllUsers = async (
  currentUserId: string
): Promise<UserProfile[]> => {
  try {
    const q = query(collection(db, "users"), orderBy("displayName"));

    const snapshot = await getDocs(q);
    return snapshot.docs
      .filter((doc) => doc.id !== currentUserId) // 現在のユーザーを除外
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as UserProfile[];
  } catch (error: unknown) {
    console.error("Users fetch error:", error);
    throw new Error("ユーザー一覧の取得に失敗しました");
  }
};
