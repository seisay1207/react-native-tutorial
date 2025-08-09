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
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "./config";

/**
 * メッセージの型定義
 *
 * 【設計思想】
 * - チャットアプリに特化したデータ構造
 * - 送信者情報の管理
 * - タイムスタンプの自動生成
 * - チャットルームの識別
 */
export interface Message {
  id?: string; // FirestoreのドキュメントID（自動生成）
  chatId: string; // チャットルームの識別子
  text: string; // メッセージの内容
  sender: string; // 送信者のメールアドレス
  timestamp?: Timestamp; // 送信時刻（サーバー側で自動生成）
}

/**
 * チャットルームの型定義
 *
 * 【設計思想】
 * - 複数ユーザーの参加管理
 * - 最新メッセージの表示
 * - 作成時刻の記録
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
