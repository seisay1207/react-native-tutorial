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
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "./config";

// 新しいデータモデルをインポート
import { ChatRoom, FriendRequest, Friendship, UserProfile } from "./models";

/**
 * 友達リクエストの送信
 */
export const sendFriendRequest = async (
  fromUserId: string,
  toUserId: string,
  message?: string
): Promise<string> => {
  try {
    // 既存のリクエストをチェック
    const existingRequest = await checkExistingFriendRequest(
      fromUserId,
      toUserId
    );
    if (existingRequest) {
      throw new Error("既に友達リクエストが送信されています");
    }

    const docRef = await addDoc(collection(db, "friendRequests"), {
      fromUser: fromUserId,
      toUser: toUserId,
      message: message || "友達になりたいです！", // デフォルトメッセージを設定
      status: "pending",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return docRef.id;
  } catch (error: unknown) {
    console.error("Friend request send error:", error);
    throw error instanceof Error
      ? error
      : new Error("友達リクエストの送信に失敗しました");
  }
};

/**
 * 既存の友達リクエストをチェック
 */
const checkExistingFriendRequest = async (
  fromUserId: string,
  toUserId: string
): Promise<FriendRequest | null> => {
  const q = query(
    collection(db, "friendRequests"),
    where("fromUser", "==", fromUserId),
    where("toUser", "==", toUserId),
    where("status", "==", "pending")
  );

  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as FriendRequest;
  }
  return null;
};

/**
 * 友達リクエストの承認
 */
export const acceptFriendRequest = async (requestId: string): Promise<void> => {
  try {
    const docRef = doc(db, "friendRequests", requestId);
    const requestSnapshot = await getDoc(docRef);

    if (!requestSnapshot.exists()) {
      throw new Error("友達リクエストが見つかりません");
    }

    const request = requestSnapshot.data() as FriendRequest;
    if (request.status !== "pending") {
      throw new Error("このリクエストは既に処理されています");
    }

    // トランザクションで友達関係を作成
    await runTransaction(db, async (transaction) => {
      // リクエストを承認済みに更新
      transaction.update(docRef, {
        status: "accepted",
        updatedAt: serverTimestamp(),
      });

      // 友達関係を作成
      const friendshipRef = doc(collection(db, "friendships"));
      transaction.set(friendshipRef, {
        user1: request.fromUser,
        user2: request.toUser,
        status: "accepted",
        requestedBy: request.fromUser,
        requestedAt: request.createdAt,
        acceptedAt: serverTimestamp(),
      });
    });
  } catch (error: unknown) {
    console.error("Friend request accept error:", error);
    throw error instanceof Error
      ? error
      : new Error("友達リクエストの承認に失敗しました");
  }
};

/**
 * 友達リクエストの拒否
 */
export const rejectFriendRequest = async (requestId: string): Promise<void> => {
  try {
    const docRef = doc(db, "friendRequests", requestId);
    await updateDoc(docRef, {
      status: "rejected",
      updatedAt: serverTimestamp(),
      rejectedAt: serverTimestamp(),
    });
  } catch (error: unknown) {
    console.error("Friend request reject error:", error);
    throw new Error("友達リクエストの拒否に失敗しました");
  }
};

/**
 * 友達リストの取得
 */
export const getFriends = async (userId: string): Promise<UserProfile[]> => {
  try {
    // user1またはuser2としての友達関係を検索
    const q1 = query(
      collection(db, "friendships"),
      where("user1", "==", userId),
      where("status", "==", "accepted")
    );
    const q2 = query(
      collection(db, "friendships"),
      where("user2", "==", userId),
      where("status", "==", "accepted")
    );

    const [snapshot1, snapshot2] = await Promise.all([
      getDocs(q1),
      getDocs(q2),
    ]);

    // 友達のIDを収集
    const friendIds = new Set<string>();
    snapshot1.docs.forEach((doc) => {
      const friendship = doc.data() as Friendship;
      friendIds.add(friendship.user2);
    });
    snapshot2.docs.forEach((doc) => {
      const friendship = doc.data() as Friendship;
      friendIds.add(friendship.user1);
    });

    // 友達のプロフィール情報を取得
    const friendProfiles: UserProfile[] = [];
    for (const friendId of friendIds) {
      const userDoc = await getDoc(doc(db, "users", friendId));
      if (userDoc.exists()) {
        friendProfiles.push({
          id: userDoc.id,
          ...userDoc.data(),
        } as UserProfile);
      }
    }

    return friendProfiles;
  } catch (error: unknown) {
    console.error("Get friends error:", error);
    throw new Error("友達リストの取得に失敗しました");
  }
};

/**
 * 受信した友達リクエストの取得
 */
export const getReceivedFriendRequests = async (
  userId: string
): Promise<FriendRequest[]> => {
  try {
    const q = query(
      collection(db, "friendRequests"),
      where("toUser", "==", userId),
      where("status", "==", "pending"),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as FriendRequest[];
  } catch (error: unknown) {
    console.error("Get received friend requests error:", error);
    throw new Error("受信した友達リクエストの取得に失敗しました");
  }
};

/**
 * 友達関係の削除
 */
export const removeFriend = async (
  userId: string,
  friendId: string
): Promise<void> => {
  try {
    // user1またはuser2としての友達関係を検索
    const q1 = query(
      collection(db, "friendships"),
      where("user1", "==", userId),
      where("user2", "==", friendId),
      where("status", "==", "accepted")
    );
    const q2 = query(
      collection(db, "friendships"),
      where("user1", "==", friendId),
      where("user2", "==", userId),
      where("status", "==", "accepted")
    );

    const [snapshot1, snapshot2] = await Promise.all([
      getDocs(q1),
      getDocs(q2),
    ]);

    // 友達関係のドキュメントを削除
    const batch = writeBatch(db);
    snapshot1.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    snapshot2.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  } catch (error: unknown) {
    console.error("Remove friend error:", error);
    throw new Error("友達の削除に失敗しました");
  }
};

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
 * ユーザープロフィールの作成
 * （変更理由）：ユーザー新規作成時にプロフィールデータをFirestoreに保存する機能を追加
 */
export const createUserProfile = async (
  userId: string,
  email: string,
  displayName: string,
  avatar?: string,
  status?: string
): Promise<void> => {
  try {
    console.log("Creating user profile:", { userId, email, displayName });

    // （変更理由）：Firestoreではundefinedの値を保存できないため、undefinedのフィールドを除外
    const userProfileData: any = {
      email,
      displayName,
      isOnline: true,
      lastSeen: serverTimestamp() as Timestamp,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
      status: status || "こんにちは！",
    };

    // avatarがundefinedでない場合のみ追加
    if (avatar !== undefined && avatar !== null && avatar !== "") {
      userProfileData.avatar = avatar;
    }

    // （変更理由）：特定のドキュメントIDでユーザープロフィールを保存（Firebase AuthのUIDを使用）
    const userRef = doc(db, "users", userId);
    await setDoc(userRef, userProfileData);

    console.log("User profile created successfully:", userId);
  } catch (error: unknown) {
    console.error("User profile creation error:", error);
    throw new Error("プロフィールの作成に失敗しました");
  }
};

/**
 * ユーザープロフィールの取得
 * （変更理由）：特定のユーザーのプロフィール情報を取得する機能を追加
 */
export const getUserProfile = async (
  userId: string
): Promise<UserProfile | null> => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));

    if (userDoc.exists()) {
      return {
        id: userDoc.id,
        ...userDoc.data(),
      } as UserProfile;
    }

    return null;
  } catch (error: unknown) {
    console.error("Get user profile error:", error);
    throw new Error("プロフィールの取得に失敗しました");
  }
};

/**
 * ユーザープロフィールの更新
 * （変更理由）：プロフィール情報を更新する機能を追加
 */
export const updateUserProfile = async (
  userId: string,
  updates: Partial<Omit<UserProfile, "id" | "createdAt">>
): Promise<void> => {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });

    console.log("User profile updated successfully:", userId);
  } catch (error: unknown) {
    console.error("User profile update error:", error);
    throw new Error("プロフィールの更新に失敗しました");
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
