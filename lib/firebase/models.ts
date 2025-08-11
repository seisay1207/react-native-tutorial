/**
 * models.ts
 *
 * 拡張されたデータモデルの定義
 *
 * 【学習ポイント】
 * 1. TypeScriptでの型安全なデータモデル設計
 * 2. Firebase Firestoreに最適化されたデータ構造
 * 3. リアルタイム更新に対応したモデル設計
 * 4. セキュリティを考慮したデータ構造
 */

import { Timestamp } from "firebase/firestore";

/**
 * ユーザープロフィールの型定義
 *
 * 【設計思想】
 * - 基本的なユーザー情報の管理
 * - オンライン状態の追跡
 * - プライバシーを考慮した情報設計
 */
export interface UserProfile {
  id: string; // ユーザーID（Firebase Auth UID）
  email: string; // メールアドレス
  displayName: string; // 表示名
  avatar?: string; // アバター画像URL（オプション）
  isOnline: boolean; // オンライン状態
  lastSeen: Timestamp; // 最後にアクティブだった時刻
  createdAt: Timestamp; // アカウント作成時刻
  updatedAt: Timestamp; // プロフィール更新時刻
  status?: string; // ステータスメッセージ（オプション）
}

/**
 * 拡張されたチャットルームの型定義
 *
 * 【設計思想】
 * - 1対1チャットとグループチャットの両方に対応
 * - 最新メッセージの効率的な取得
 * - 参加者の権限管理
 */
export interface ChatRoom {
  id: string; // チャットルームID
  type: "direct" | "group"; // チャットタイプ（1対1 or グループ）
  name?: string; // グループチャット名（グループの場合のみ）
  participants: string[]; // 参加者のユーザーID配列
  lastMessage?: MessageSummary; // 最新メッセージのサマリー
  createdAt: Timestamp; // 作成時刻
  updatedAt: Timestamp; // 更新時刻
  createdBy: string; // 作成者のユーザーID
  isActive: boolean; // アクティブ状態
}

/**
 * メッセージサマリーの型定義
 *
 * 【設計思想】
 * - チャットルーム一覧での最新メッセージ表示
 * - パフォーマンスを考慮した軽量な構造
 */
export interface MessageSummary {
  id: string; // メッセージID
  text: string; // メッセージ内容（短縮版）
  sender: string; // 送信者のユーザーID
  timestamp: Timestamp; // 送信時刻
  type: "text" | "image" | "file" | "system"; // メッセージタイプ
}

/**
 * 拡張されたメッセージの型定義
 *
 * 【設計思想】
 * - 既存のMessage型を拡張
 * - メッセージタイプの追加
 * - 編集・削除履歴の管理
 */
export interface ExtendedMessage {
  id?: string; // FirestoreのドキュメントID
  chatId: string; // チャットルームID
  text: string; // メッセージ内容
  sender: string; // 送信者のユーザーID
  timestamp?: Timestamp; // 送信時刻
  type: "text" | "image" | "file" | "system"; // メッセージタイプ
  editedAt?: Timestamp; // 編集時刻（編集された場合）
  deletedAt?: Timestamp; // 削除時刻（削除された場合）
  replyTo?: string; // 返信先メッセージID（返信の場合）
  metadata?: {
    // メタデータ（画像・ファイルの場合）
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    url?: string;
  };
}

/**
 * 友達関係の型定義
 *
 * 【設計思想】
 * - 友達リクエストの状態管理
 * - 双方向の関係性の管理
 * - セキュリティを考慮した設計
 */
export interface Friendship {
  id: string; // 友達関係ID
  user1: string; // ユーザー1のID
  user2: string; // ユーザー2のID
  status: "pending" | "accepted" | "rejected" | "blocked"; // 関係の状態
  requestedBy: string; // リクエストを送信したユーザーID
  requestedAt: Timestamp; // リクエスト送信時刻
  acceptedAt?: Timestamp; // 承認時刻
  rejectedAt?: Timestamp; // 拒否時刻
  blockedAt?: Timestamp; // ブロック時刻
  blockedBy?: string; // ブロックしたユーザーID
}

/**
 * 友達リクエストの型定義
 *
 * 【設計思想】
 * - 友達リクエストの送受信管理
 * - 通知システムとの連携
 * - ユーザー体験の向上
 */
export interface FriendRequest {
  id: string; // リクエストID
  fromUser: string; // 送信者のユーザーID
  toUser: string; // 受信者のユーザーID
  message?: string; // リクエストメッセージ（オプション）
  status: "pending" | "accepted" | "rejected"; // リクエストの状態
  createdAt: Timestamp; // 作成時刻
  updatedAt: Timestamp; // 更新時刻
  expiresAt?: Timestamp; // 有効期限（オプション）
}

/**
 * ユーザー検索結果の型定義
 *
 * 【設計思想】
 * - 検索結果の表示に必要な最小限の情報
 * - プライバシーを考慮した情報設計
 * - パフォーマンスを考慮した軽量な構造
 */
export interface UserSearchResult {
  id: string; // ユーザーID
  displayName: string; // 表示名
  avatar?: string; // アバター画像URL
  email: string; // メールアドレス
  isOnline: boolean; // オンライン状態
  friendshipStatus?: "none" | "pending" | "accepted" | "rejected" | "blocked"; // 友達関係の状態
}

/**
 * 通知設定の型定義
 *
 * 【設計思想】
 * - ユーザーごとの通知設定管理
 * - プライバシー設定の管理
 * - カスタマイズ可能な設定
 */
export interface NotificationSettings {
  id: string; // 設定ID
  userId: string; // ユーザーID
  pushNotifications: boolean; // プッシュ通知の有効/無効
  emailNotifications: boolean; // メール通知の有効/無効
  messageNotifications: boolean; // メッセージ通知の有効/無効
  friendRequestNotifications: boolean; // 友達リクエスト通知の有効/無効
  soundEnabled: boolean; // 通知音の有効/無効
  vibrationEnabled: boolean; // バイブレーションの有効/無効
  quietHours: {
    // おやすみモード設定
    enabled: boolean;
    startTime: string; // HH:mm形式
    endTime: string; // HH:mm形式
  };
  updatedAt: Timestamp; // 設定更新時刻
}

/**
 * アプリ設定の型定義
 *
 * 【設計思想】
 * - ユーザーごとのアプリ設定管理
 * - UI/UXのカスタマイズ設定
 * - パフォーマンス設定
 */
export interface AppSettings {
  id: string; // 設定ID
  userId: string; // ユーザーID
  theme: "light" | "dark" | "auto"; // テーマ設定
  language: string; // 言語設定
  fontSize: "small" | "medium" | "large"; // フォントサイズ
  autoScroll: boolean; // 自動スクロールの有効/無効
  showOnlineStatus: boolean; // オンライン状態の表示/非表示
  showReadReceipts: boolean; // 既読表示の有効/無効
  updatedAt: Timestamp; // 設定更新時刻
}
