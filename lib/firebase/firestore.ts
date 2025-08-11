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

// lib/firebase/firestore.ts
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
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "./config";

// 新しいデータモデルをインポート
import {
  AppSettings,
  ChatRoom,
  FriendRequest,
  Friendship,
  MessageSummary,
  NotificationSettings,
  UserProfile,
  UserSearchResult,
} from "./models";

/**
 * 既存のMessage型をExtendedMessageに置き換え
 * 後方互換性を保つため、Message型も残す
 */
export interface Message {
  id?: string; // FirestoreのドキュメントID（自動生成）
  chatId: string; // チャットルームの識別子
  text: string; // メッセージの内容
  sender: string; // 送信者のメールアドレス
  timestamp?: Timestamp; // 送信時刻（サーバー側で自動生成）
}

/**
 * 既存のChat型をChatRoomに置き換え
 * 後方互換性を保つため、Chat型も残す
 */
export interface Chat {
  id?: string; // FirestoreのドキュメントID
  participants: string[]; // 参加者のメールアドレス配列
  lastMessage?: {
    // 最新メッセージの情報
    text: string;
    timestamp: Timestamp;
    sender: string;
  };
  createdAt?: Timestamp; // チャットルームの作成時刻
}

/**
 * メッセージ送信機能
 *
 * 【処理フロー】
 * 1. Firestoreのmessagesコレクションにドキュメントを追加
 * 2. サーバー側でタイムスタンプを自動生成
 * 3. 生成されたドキュメントIDを返却
 *
 * 【エラーハンドリング】
 * - ネットワークエラー
 * - Firestore接続エラー
 * - 権限エラー
 *
 * 【戻り値】
 * - 成功時: 生成されたドキュメントID
 * - 失敗時: エラーを投げる
 */
export const addMessage = async (
  message: Omit<Message, "id" | "timestamp">
): Promise<string> => {
  try {
    // Firestoreのmessagesコレクションにドキュメントを追加
    const docRef = await addDoc(collection(db, "messages"), {
      ...message,
      timestamp: serverTimestamp(), // サーバー側でタイムスタンプを生成
    });
    return docRef.id; // 生成されたドキュメントIDを返却
  } catch (error) {
    throw new Error("メッセージの送信に失敗しました");
  }
};

/**
 * メッセージ取得機能
 *
 * 【処理フロー】
 * 1. 指定されたチャットルームのメッセージをクエリ
 * 2. タイムスタンプ順でソート
 * 3. 結果を配列として返却
 *
 * 【クエリ条件】
 * - chatId: 指定されたチャットルーム
 * - orderBy: タイムスタンプの昇順ソート
 *
 * 【注意点】
 * - 大量のメッセージがある場合はページネーションが必要
 * - リアルタイム更新にはsubscribeToMessagesを使用
 */
export const getMessages = async (chatId: string): Promise<Message[]> => {
  try {
    // Firestoreクエリの構築
    const q = query(
      collection(db, "messages"),
      where("chatId", "==", chatId), // チャットルームでフィルタ
      orderBy("timestamp", "asc") // タイムスタンプ順でソート
    );

    const snapshot = await getDocs(q);

    // ドキュメントをMessage型の配列に変換
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Message[];
  } catch (error) {
    throw new Error("メッセージの取得に失敗しました");
  }
};

/**
 * リアルタイムメッセージ監視機能
 *
 * 【役割】
 * - 指定されたチャットルームのメッセージ変更をリアルタイム監視
 * - 新しいメッセージの自動検知
 * - メッセージの削除・更新も検知
 *
 * 【戻り値】
 * - クリーンアップ関数（リスナーの解除用）
 *
 * 【使用方法】
 * const unsubscribe = subscribeToMessages(chatId, (messages) => {
 *   // メッセージが変更された時の処理
 *   setMessages(messages);
 * });
 *
 * // コンポーネントアンマウント時にクリーンアップ
 * return unsubscribe;
 *
 * 【技術的詳細】
 * - onSnapshot: Firestoreのリアルタイムリスナー
 * - 初回呼び出し時に現在のデータを取得
 * - 以降の変更をリアルタイムで検知
 */
export const subscribeToMessages = (
  chatId: string,
  callback: (messages: Message[]) => void
) => {
  // Firestoreクエリの構築
  const q = query(
    collection(db, "messages"),
    where("chatId", "==", chatId), // チャットルームでフィルタ
    orderBy("timestamp", "asc") // タイムスタンプ順でソート
  );

  // リアルタイムリスナーの設定
  return onSnapshot(q, (snapshot) => {
    // ドキュメントをMessage型の配列に変換
    const messages = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Message[];

    // コールバック関数を呼び出し
    callback(messages);
  });
};

/**
 * チャットルーム作成機能
 *
 * 【処理フロー】
 * 1. 新しいチャットルームドキュメントを作成
 * 2. 参加者情報を設定
 * 3. 作成時刻を自動生成
 * 4. 生成されたドキュメントIDを返却
 *
 * 【用途】
 * - 新しいチャットの開始
 * - グループチャットの作成
 * - プライベートチャットの作成
 */
export const createChat = async (participants: string[]): Promise<string> => {
  try {
    // Firestoreのchatsコレクションにドキュメントを追加
    const docRef = await addDoc(collection(db, "chats"), {
      participants, // 参加者リスト
      createdAt: serverTimestamp(), // サーバー側で作成時刻を生成
    });
    return docRef.id; // 生成されたドキュメントIDを返却
  } catch (error) {
    throw new Error("チャットの作成に失敗しました");
  }
};

/**
 * チャットルーム取得機能
 *
 * 【処理フロー】
 * 1. 指定されたユーザーが参加しているチャットをクエリ
 * 2. 作成時刻順でソート
 * 3. 結果を配列として返却
 *
 * 【クエリ条件】
 * - participants: 指定されたユーザーが含まれるチャット
 * - orderBy: 作成時刻の降順ソート（最新のチャットが上）
 *
 * 【用途】
 * - ユーザーのチャット一覧表示
 * - チャット履歴の管理
 */
export const getChats = async (userId: string): Promise<Chat[]> => {
  try {
    // Firestoreクエリの構築
    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", userId), // ユーザーが参加しているチャット
      orderBy("createdAt", "desc") // 作成時刻の降順ソート
    );

    const snapshot = await getDocs(q);

    // ドキュメントをChat型の配列に変換
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Chat[];
  } catch (error) {
    throw new Error("チャットの取得に失敗しました");
  }
};

/**
 * バッチ処理（複数メッセージ送信）
 *
 * 【役割】
 * - 複数のメッセージを一度に送信
 * - トランザクション的な処理
 * - パフォーマンスの向上
 *
 * 【処理フロー】
 * 1. バッチオブジェクトの作成
 * 2. 複数のドキュメントをバッチに追加
 * 3. バッチの一括実行
 *
 * 【用途】
 * - サンプルメッセージの一括追加
 * - 初期データの投入
 * - データ移行
 *
 * 【技術的詳細】
 * - writeBatch: Firestoreのバッチ処理API
 * - すべての操作が成功するか、すべて失敗する
 * - ネットワーク効率が良い
 */
export const addMultipleMessages = async (
  messages: Omit<Message, "id" | "timestamp">[]
): Promise<void> => {
  try {
    // バッチオブジェクトの作成
    const batch = writeBatch(db);

    // 各メッセージをバッチに追加
    messages.forEach((message) => {
      const docRef = doc(collection(db, "messages")); // 新しいドキュメント参照を作成
      batch.set(docRef, {
        ...message,
        timestamp: serverTimestamp(), // サーバー側でタイムスタンプを生成
      });
    });

    // バッチの一括実行
    await batch.commit();
  } catch (error) {
    throw new Error("メッセージの一括送信に失敗しました");
  }
};

/**
 * ユーザープロフィール管理機能
 */

/**
 * ユーザープロフィールの作成・更新
 */
export const upsertUserProfile = async (
  userId: string,
  profile: Partial<UserProfile>
): Promise<void> => {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      // 既存プロフィールの更新
      await updateDoc(userRef, {
        ...profile,
        updatedAt: serverTimestamp(),
      });
    } else {
      // 新規プロフィールの作成
      await setDoc(userRef, {
        id: userId,
        ...profile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isOnline: true,
        lastSeen: serverTimestamp(),
      });
    }
  } catch (error) {
    throw new Error("ユーザープロフィールの更新に失敗しました");
  }
};

/**
 * ユーザープロフィールの取得
 */
export const getUserProfile = async (
  userId: string
): Promise<UserProfile | null> => {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    }
    return null;
  } catch (error) {
    throw new Error("ユーザープロフィールの取得に失敗しました");
  }
};

/**
 * ユーザーのオンライン状態を更新
 */
export const updateUserOnlineStatus = async (
  userId: string,
  isOnline: boolean
): Promise<void> => {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      isOnline,
      lastSeen: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    throw new Error("オンライン状態の更新に失敗しました");
  }
};

/**
 * 友達機能
 */

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
    const existingRequest = await getExistingFriendRequest(
      fromUserId,
      toUserId
    );
    if (existingRequest) {
      throw new Error("既に友達リクエストが存在します");
    }

    const docRef = await addDoc(collection(db, "friendRequests"), {
      fromUser: fromUserId,
      toUser: toUserId,
      message,
      status: "pending",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return docRef.id;
  } catch (error) {
    throw new Error("友達リクエストの送信に失敗しました");
  }
};

/**
 * 既存の友達リクエストをチェック
 */
const getExistingFriendRequest = async (
  fromUserId: string,
  toUserId: string
): Promise<FriendRequest | null> => {
  try {
    const q = query(
      collection(db, "friendRequests"),
      where("fromUser", "in", [fromUserId, toUserId]),
      where("toUser", "in", [fromUserId, toUserId]),
      where("status", "==", "pending")
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as FriendRequest;
  } catch (error) {
    return null;
  }
};

/**
 * 友達リクエストの承認
 */
export const acceptFriendRequest = async (requestId: string): Promise<void> => {
  try {
    const batch = writeBatch(db);

    // リクエストの状態を更新
    const requestRef = doc(db, "friendRequests", requestId);
    batch.update(requestRef, {
      status: "accepted",
      updatedAt: serverTimestamp(),
    });

    // 友達関係を作成
    const requestDoc = await getDoc(requestRef);
    if (requestDoc.exists()) {
      const requestData = requestDoc.data() as FriendRequest;
      const friendshipRef = doc(collection(db, "friendships"));
      batch.set(friendshipRef, {
        user1: requestData.fromUser,
        user2: requestData.toUser,
        status: "accepted",
        requestedBy: requestData.fromUser,
        requestedAt: requestData.createdAt,
        acceptedAt: serverTimestamp(),
      });
    }

    await batch.commit();
  } catch (error) {
    throw new Error("友達リクエストの承認に失敗しました");
  }
};

/**
 * 友達リクエストの拒否
 */
export const rejectFriendRequest = async (requestId: string): Promise<void> => {
  try {
    const requestRef = doc(db, "friendRequests", requestId);
    await updateDoc(requestRef, {
      status: "rejected",
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    throw new Error("友達リクエストの拒否に失敗しました");
  }
};

/**
 * 友達リストの取得
 */
export const getFriendsList = async (
  userId: string
): Promise<UserProfile[]> => {
  try {
    const q = query(
      collection(db, "friendships"),
      where("status", "==", "accepted"),
      where("user1", "in", [userId])
    );

    const snapshot = await getDocs(q);
    const friendIds = snapshot.docs.map((doc) => {
      const data = doc.data() as Friendship;
      return data.user1 === userId ? data.user2 : data.user1;
    });

    // 友達のプロフィールを取得
    const friends: UserProfile[] = [];
    for (const friendId of friendIds) {
      const profile = await getUserProfile(friendId);
      if (profile) {
        friends.push(profile);
      }
    }

    return friends;
  } catch (error) {
    throw new Error("友達リストの取得に失敗しました");
  }
};

/**
 * 拡張されたチャット機能
 */

/**
 * 個別チャットルームの作成
 */
export const createDirectChat = async (
  user1Id: string,
  user2Id: string
): Promise<string> => {
  try {
    // 既存のチャットルームをチェック
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
  } catch (error) {
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
  } catch (error) {
    return null;
  }
};

/**
 * チャットルーム一覧の取得（拡張版）
 */
export const getChatRooms = async (userId: string): Promise<ChatRoom[]> => {
  try {
    const q = query(
      collection(db, "chatRooms"),
      where("participants", "array-contains", userId),
      where("isActive", "==", true),
      orderBy("updatedAt", "desc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ChatRoom[];
  } catch (error) {
    throw new Error("チャットルーム一覧の取得に失敗しました");
  }
};

/**
 * 最新メッセージのサマリーを更新
 */
export const updateChatRoomLastMessage = async (
  chatId: string,
  message: MessageSummary
): Promise<void> => {
  try {
    const chatRef = doc(db, "chatRooms", chatId);
    await updateDoc(chatRef, {
      lastMessage: message,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    throw new Error("最新メッセージの更新に失敗しました");
  }
};

/**
 * ユーザー検索機能
 */
export const searchUsers = async (
  searchTerm: string,
  currentUserId: string,
  maxResults: number = 10
): Promise<UserSearchResult[]> => {
  try {
    // 注意: Firestoreでは部分一致検索が制限されているため、
    // 実装は簡略化されています。本格的な検索にはAlgolia等の使用を推奨
    const q = query(
      collection(db, "users"),
      where("displayName", ">=", searchTerm),
      where("displayName", "<=", searchTerm + "\uf8ff"),
      orderBy("displayName", "asc"), // 名前順にソート
      limit(maxResults)
    );

    const snapshot = await getDocs(q);
    const users: UserSearchResult[] = [];

    for (const docSnapshot of snapshot.docs) {
      const userData = docSnapshot.data() as UserProfile;
      if (userData.id !== currentUserId) {
        // 友達関係の状態を取得
        const friendshipStatus = await getFriendshipStatus(
          currentUserId,
          userData.id
        );

        users.push({
          id: userData.id,
          displayName: userData.displayName,
          avatar: userData.avatar,
          email: userData.email,
          isOnline: userData.isOnline,
          friendshipStatus,
        });
      }
    }

    return users;
  } catch (error) {
    throw new Error("ユーザー検索に失敗しました");
  }
};

/**
 * 友達関係の状態を取得
 */
const getFriendshipStatus = async (
  user1Id: string,
  user2Id: string
): Promise<"none" | "pending" | "accepted" | "rejected" | "blocked"> => {
  try {
    const q = query(
      collection(db, "friendships"),
      where("user1", "in", [user1Id, user2Id]),
      where("user2", "in", [user1Id, user2Id])
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return "none";

    const friendship = snapshot.docs[0].data() as Friendship;
    return friendship.status;
  } catch (error) {
    return "none";
  }
};

/**
 * 設定管理機能
 */

/**
 * 通知設定の取得・更新
 */
export const upsertNotificationSettings = async (
  userId: string,
  settings: Partial<NotificationSettings>
): Promise<void> => {
  try {
    const settingsRef = doc(db, "notificationSettings", userId);
    const settingsDoc = await getDoc(settingsRef);

    if (settingsDoc.exists()) {
      await updateDoc(settingsRef, {
        ...settings,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(settingsRef, {
        userId,
        ...settings,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    throw new Error("通知設定の更新に失敗しました");
  }
};

/**
 * アプリ設定の取得・更新
 */
export const upsertAppSettings = async (
  userId: string,
  settings: Partial<AppSettings>
): Promise<void> => {
  try {
    const settingsRef = doc(db, "appSettings", userId);
    const settingsDoc = await getDoc(settingsRef);

    if (settingsDoc.exists()) {
      await updateDoc(settingsRef, {
        ...settings,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(settingsRef, {
        userId,
        ...settings,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    throw new Error("アプリ設定の更新に失敗しました");
  }
};
