// lib/firebase/firestore.ts
import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "./config";

// 型定義
export interface Message {
  id?: string;
  chatId: string;
  text: string;
  sender: string;
  timestamp?: Date;
}

export interface Chat {
  id?: string;
  participants: string[];
  lastMessage?: {
    text: string;
    timestamp: Date;
    sender: string;
  };
  createdAt?: Date;
}

// メッセージ送信
export const addMessage = async (
  message: Omit<Message, "id" | "timestamp">
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, "messages"), {
      ...message,
      timestamp: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    throw new Error("メッセージの送信に失敗しました");
  }
};

// メッセージ取得
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
  } catch (error) {
    throw new Error("メッセージの取得に失敗しました");
  }
};

// リアルタイムメッセージ監視
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

// チャット作成
export const createChat = async (participants: string[]): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, "chats"), {
      participants,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    throw new Error("チャットの作成に失敗しました");
  }
};

// チャット取得
export const getChats = async (userId: string): Promise<Chat[]> => {
  try {
    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", userId),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Chat[];
  } catch (error) {
    throw new Error("チャットの取得に失敗しました");
  }
};

// バッチ処理（複数メッセージ送信）
export const addMultipleMessages = async (
  messages: Omit<Message, "id" | "timestamp">[]
): Promise<void> => {
  try {
    const batch = writeBatch(db);

    messages.forEach((message) => {
      const docRef = doc(collection(db, "messages"));
      batch.set(docRef, {
        ...message,
        timestamp: serverTimestamp(),
      });
    });

    await batch.commit();
  } catch (error) {
    throw new Error("メッセージの一括送信に失敗しました");
  }
};
