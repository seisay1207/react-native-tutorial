# React Native + Firebase 入門チャットアプリ開発

## 開発環境

### 必要なツール

- Node.js
- Expo CLI
- Firebase Console

### Firebase 設定

このアプリを動作させるには、Firebase プロジェクトの設定が必要です。

#### 1. Firebase プロジェクトの作成

1. [Firebase Console](https://console.firebase.google.com/)にアクセス
2. 新しいプロジェクトを作成
3. Authentication を有効化（Email/Password 認証を有効にする）
4. Firestore Database を有効化

#### 2. 環境変数の設定

プロジェクトルートに`.env`ファイルを作成し、以下の内容を追加してください：

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key_here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

これらの値は、Firebase Console の「プロジェクト設定」→「全般」→「マイアプリ」で確認できます。

#### 3. 設定値の取得方法

1. Firebase Console でプロジェクトを選択
2. 左側メニューから「プロジェクト設定」をクリック
3. 「全般」タブで「マイアプリ」セクションを確認
4. Web アプリの設定から必要な値をコピー

#### 4. Firestore セキュリティルールの設定

Firebase Console で Firestore Database の「ルール」タブを開き、以下のルールを設定してください：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // メッセージのルール
    match /messages/{messageId} {
      allow read, write: if request.auth != null;
    }

    // チャットのルール
    match /chats/{chatId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**注意**: より詳細なセキュリティルールは `lib/firebase/firestore.rules` ファイルに定義されています。

### セットアップ

```bash
# 依存関係のインストール
npm install

# アプリの起動
npx expo start
```

### トラブルシューティング

#### ログインが失敗する場合

1. **環境変数の確認**: `.env`ファイルが正しく設定されているか確認
2. **Firebase 設定の確認**: Firebase Console で Authentication が有効になっているか確認
3. **コンソールログの確認**: アプリ実行時にコンソールに表示されるデバッグ情報を確認

#### チャット機能が動作しない場合

1. **Firestore の有効化**: Firebase Console で Firestore Database が有効になっているか確認
2. **セキュリティルール**: Firestore のルールが正しく設定されているか確認
3. **ネットワーク接続**: インターネット接続を確認

#### よくあるエラー

- `Firebase not configured`: 環境変数が設定されていません
- `auth/user-not-found`: ユーザーが存在しません（先にサインアップが必要）
- `auth/wrong-password`: パスワードが間違っています
- `auth/invalid-email`: メールアドレスの形式が正しくありません
- `Permission denied`: Firestore のセキュリティルールを確認してください

## プロジェクト構成

```
app/
├── auth/           # 認証関連画面
├── firebase/       # Firebase設定・認証機能
├── contexts/       # React Context
└── (tabs)/         # メイン画面

lib/
├── firebase/
│   ├── config.ts           # Firebase設定
│   ├── auth.ts             # 認証機能
│   ├── firestore.ts        # Firestore機能（拡張済み）
│   ├── models.ts           # データモデル定義（新規追加）
│   └── firestore.rules     # セキュリティルール（新規追加）
└── contexts/
    └── AuthContext.tsx     # 認証状態管理
```

## 機能

### 認証機能

- ユーザー認証（ログイン・サインアップ・ログアウト）
- Firebase Authentication 連携
- エラーハンドリング
- デバッグログ機能

### チャット機能

- リアルタイムメッセージ送受信
- Firestore Database 連携
- メッセージの表示（自分のメッセージと他の人のメッセージを区別）
- タイムスタンプ表示
- サンプルメッセージ追加機能
- キーボード対応（iOS/Android）
- 自動スクロール機能

### 拡張されたデータモデル（新規追加）

#### ユーザー管理

- **ユーザープロフィール**: 表示名、アバター、オンライン状態
- **友達機能**: リクエスト送受信、承認・拒否、友達リスト
- **ユーザー検索**: 表示名による検索機能

#### チャットルーム管理

- **個別チャット**: 1 対 1 チャットの動的作成
- **グループチャット**: 複数ユーザー参加のチャット
- **最新メッセージ**: チャットルーム一覧での最新メッセージ表示

#### 設定管理

- **通知設定**: プッシュ通知、メール通知のカスタマイズ
- **アプリ設定**: テーマ、言語、UI 設定の管理

### UI/UX

- モダンなチャット UI
- メッセージバブル（自分のメッセージは右、他の人のメッセージは左）
- システムメッセージ（中央表示）
- レスポンシブデザイン
- ローディング状態の表示

## 使用方法

1. **ログイン/サインアップ**: アプリを起動してアカウントを作成またはログイン
2. **チャット画面**: メイン画面でメッセージを送信
3. **サンプルメッセージ**: 「サンプル」ボタンを押してサンプルメッセージを追加
4. **リアルタイム更新**: 他のユーザーが送信したメッセージがリアルタイムで表示

## 技術スタック

- **React Native**: モバイルアプリ開発フレームワーク
- **Expo**: 開発プラットフォーム
- **Firebase Authentication**: ユーザー認証
- **Firestore Database**: リアルタイムデータベース
- **TypeScript**: 型安全な開発
- **React Context**: グローバル状態管理

## 開発状況

### 完了済み機能

- ✅ 基本的な認証機能
- ✅ 基本的なチャット機能（固定チャットルーム）
- ✅ リアルタイムメッセージ更新
- ✅ 基本的な UI/UX

### 実装済み（基盤）

- ✅ 拡張されたデータモデル
- ✅ 友達機能のバックエンド
- ✅ 個別チャットルーム管理
- ✅ セキュリティルール

### 次のステップ

- 🔄 個別チャット対応の UI 実装
- 🔄 友達機能の UI 実装
- 🔄 チャットルーム選択画面
- 🔄 ユーザー検索・友達追加画面
