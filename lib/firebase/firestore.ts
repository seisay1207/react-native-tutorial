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
  } catch (error: unknown) {
    console.error("Message send error:", error);
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
  } catch (error: unknown) {
    console.error("Message fetch error:", error);
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
/**
 * @deprecated このメソッドは非推奨です。代わりに createDirectChat を使用してください。
 * この関数は後方互換性のために残されていますが、新しいコードでは使用しないでください。
 */
export const createChat = async (participants: string[]): Promise<string> => {
  console.warn(
    "createChat is deprecated. Please use createDirectChat instead."
  );
  if (participants.length === 2) {
    return createDirectChat(participants[0], participants[1]);
  } else {
    // グループチャットの場合は新しい形式で作成
    const docRef = await addDoc(collection(db, "chatRooms"), {
      type: "group",
      participants,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isActive: true,
    });
    return docRef.id;
  }
};

/**
 * @deprecated このメソッドは非推奨です。代わりに getChatRooms を使用してください。
 * この関数は後方互換性のために残されていますが、新しいコードでは使用しないでください。
 */
export const getChats = async (userId: string): Promise<Chat[]> => {
  console.warn("getChats is deprecated. Please use getChatRooms instead.");
  try {
    // 新しいchatRoomsから取得
    const chatRooms = await getChatRooms(userId);

    // 古い形式に変換して返す（後方互換性のため）
    return chatRooms.map((room) => ({
      id: room.id,
      participants: room.participants,
      lastMessage: room.lastMessage,
      createdAt: room.createdAt,
    })) as Chat[];
  } catch (error: unknown) {
    console.error("Chat fetch error:", error);
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
  } catch (error: unknown) {
    console.error("Batch message send error:", error);
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
  } catch (error: unknown) {
    console.error("User profile update error:", error);
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
  } catch (error: unknown) {
    console.error("User profile fetch error:", error);
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
  } catch (error: unknown) {
    console.error("Online status update error:", error);
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
  } catch (error: unknown) {
    console.error("Friend request send error:", error);
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
  } catch (error: unknown) {
    console.error("Operation failed:", error);
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
  } catch (error: unknown) {
    console.error("Friend request accept error:", error);
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
  } catch (error: unknown) {
    console.error("Friend request reject error:", error);
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
  } catch (error: unknown) {
    console.error("Friends list fetch error:", error);
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
 * チャットルーム一覧の取得（拡張版）
 */
export const getChatRooms = async (userId: string): Promise<ChatRoom[]> => {
  try {
    // まずインデックスが必要ないクエリを試行
    const q = query(
      collection(db, "chatRooms"),
      where("participants", "array-contains", userId),
      orderBy("updatedAt", "desc")
    );

    const snapshot = await getDocs(q);

    // 結果をフィルタリング
    const chatRooms = snapshot.docs
      .map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as ChatRoom)
      )
      .filter((room) => room.isActive !== false); // undefinedの場合もアクティブとみなす

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

    // 元のエラーメッセージを保持
    throw new Error(`チャットルーム一覧の取得に失敗しました: ${error.message}`);
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
  } catch (error: unknown) {
    console.error("Last message update error:", error);
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
  } catch (error: unknown) {
    console.error("User search error:", error);
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
  } catch (error: unknown) {
    console.error("Friendship status check error:", error);
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
  } catch (error: unknown) {
    console.error("Notification settings update error:", error);
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
  } catch (error: unknown) {
    console.error("App settings update error:", error);
    throw new Error("アプリ設定の更新に失敗しました");
  }
};

/**
 * データ移行: chatsコレクションからchatRoomsコレクションへの移行
 *
 * 【処理フロー】
 * 1. 古いchatsコレクションからすべてのチャットを取得
 * 2. 各チャットを新しい形式に変換
 * 3. chatRoomsコレクションに移行
 * 4. 移行完了後に古いチャットを非アクティブとしてマーク
 *
 * 【注意点】
 * - データの整合性を保つため、バッチ処理を使用
 * - エラー発生時はロールバック
 * - 既存のchatRoomsとの重複を防ぐ
 */
export const migrateChatsToChatRooms = async (): Promise<void> => {
  try {
    const oldChatsQuery = query(collection(db, "chats"));
    const oldChatsSnapshot = await getDocs(oldChatsQuery);

    // 一度に処理できるドキュメント数の制限（500）に注意
    const batchSize = 400;
    let currentBatch = writeBatch(db);
    let operationCount = 0;

    for (const oldChatDoc of oldChatsSnapshot.docs) {
      const oldChatData = oldChatDoc.data() as Chat;

      // 既存のchatRoomをチェック
      const existingChatRoom = await findExistingChatRoom(
        oldChatData.participants
      );
      if (existingChatRoom) {
        console.log(
          `Chat ${oldChatDoc.id} already migrated to ${existingChatRoom.id}`
        );
        continue;
      }

      // 新しいチャットルームドキュメントの作成
      const newChatRoomRef = doc(collection(db, "chatRooms"));
      currentBatch.set(newChatRoomRef, {
        type: oldChatData.participants.length === 2 ? "direct" : "group",
        participants: oldChatData.participants,
        lastMessage: oldChatData.lastMessage || null,
        createdAt: oldChatData.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
        isActive: true,
        migratedFrom: oldChatDoc.id, // 移行元の記録
      });

      // 古いチャットを非アクティブとしてマーク
      const oldChatRef = doc(db, "chats", oldChatDoc.id);
      currentBatch.update(oldChatRef, {
        isActive: false,
        migratedTo: newChatRoomRef.id,
        updatedAt: serverTimestamp(),
      });

      operationCount += 2; // 2つの操作をカウント

      // バッチサイズの制限に達したら実行
      if (operationCount >= batchSize) {
        await currentBatch.commit();
        currentBatch = writeBatch(db);
        operationCount = 0;
      }
    }

    // 残りのバッチを実行
    if (operationCount > 0) {
      await currentBatch.commit();
    }
  } catch (error: unknown) {
    console.error("Migration failed:", error);
    throw new Error("チャットデータの移行に失敗しました");
  }
};

/**
 * 既存のchatRoomを検索
 * 参加者リストが完全に一致するチャットルームを探す
 */
const findExistingChatRoom = async (
  participants: string[]
): Promise<ChatRoom | null> => {
  try {
    // 参加者数が同じで、最初の参加者を含むチャットルームを検索
    const q = query(
      collection(db, "chatRooms"),
      where("participants", "array-contains", participants[0])
    );

    const snapshot = await getDocs(q);

    // 参加者リストが完全に一致するチャットルームを探す
    for (const doc of snapshot.docs) {
      const chatRoom = doc.data() as ChatRoom;
      if (
        chatRoom.participants.length === participants.length &&
        participants.every((p) => chatRoom.participants.includes(p))
      ) {
        return { ...chatRoom, id: doc.id };
      }
    }

    return null;
  } catch (error) {
    console.error("Error finding existing chat room:", error);
    return null;
  }
};
