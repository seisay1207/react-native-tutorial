# React Native + Firebase チャットアプリ

## 概要

このアプリは、React Native + Expo + Firebase を使用して開発されたリアルタイムチャットアプリケーションです。認証、リアルタイムメッセージング、プッシュ通知、友達機能などの機能を提供します。

## 主な機能

- 🔐 **ユーザー認証**: Firebase Authentication による安全なログイン・サインアップ
- 💬 **リアルタイムチャット**: Firestore を使用したリアルタイムメッセージング
- 👥 **友達機能**: 友達リクエストの送受信、友達リスト管理
- 🔔 **プッシュ通知**: Firebase Cloud Messaging による通知機能
- 📱 **クロスプラットフォーム**: iOS、Android、Web 対応
- 🎨 **モダン UI**: 直感的で美しいユーザーインターフェース

## 技術スタック

- **フロントエンド**: React Native 0.79.5 + Expo SDK 54
- **バックエンド**: Firebase (Authentication, Firestore, Cloud Messaging)
- **言語**: TypeScript
- **状態管理**: React Context + Hooks
- **ナビゲーション**: Expo Router
- **UI**: カスタムコンポーネント + Expo Vector Icons

## 開発環境

### 必要なツール

- Node.js (推奨: 18.x 以上)
- npm または yarn
- Expo CLI
- Firebase Console アカウント

### セットアップ

1. **リポジトリのクローン**

   ```bash
   git clone <repository-url>
   cd official_toutrial
   ```

2. **依存関係のインストール**

   ```bash
   npm install
   ```

3. **Firebase 設定**

   - [Firebase Console](https://console.firebase.google.com/)でプロジェクトを作成
   - Authentication（Email/Password）を有効化
   - Firestore Database を有効化
   - Cloud Messaging を有効化

4. **環境変数の設定**

   プロジェクトルートに`.env`ファイルを作成：

   ```env
   EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key_here
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
   EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

5. **アプリの起動**

   ```bash
   # 開発サーバー起動
   npm start

   # プラットフォーム別起動
   npm run ios      # iOS シミュレーター
   npm run android  # Android エミュレーター
   npm run web      # Web ブラウザ
   ```

### Firestore セキュリティルール

Firebase Console で Firestore Database の「ルール」タブを開き、以下のルールを設定してください：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ユーザー情報
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // 友達リクエスト
    match /friendRequests/{requestId} {
      allow read, write: if request.auth != null &&
        (request.auth.uid == resource.data.fromUserId ||
         request.auth.uid == resource.data.toUserId);
    }

    // チャットルーム
    match /chats/{chatId} {
      allow read, write: if request.auth != null &&
        request.auth.uid in resource.data.participants;
    }

    // メッセージ
    match /messages/{messageId} {
      allow read, write: if request.auth != null &&
        request.auth.uid in get(/databases/$(database)/documents/chats/$(resource.data.chatId)).data.participants;
    }
  }
}
```

**注意**: より詳細なセキュリティルールは `lib/firebase/firestore.rules` ファイルに定義されています。

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
app/                          # Expo Router による画面構成
├── (auth)/                   # 認証関連画面
│   ├── _layout.tsx          # 認証レイアウト
│   ├── index.tsx            # ログイン画面
│   └── signup.tsx           # サインアップ画面
├── (tabs)/                   # メインタブ画面
│   ├── _layout.tsx          # タブレイアウト
│   ├── index.tsx            # ホーム画面
│   └── friends.tsx          # 友達画面
├── chat.tsx                  # チャット画面
├── select-user.tsx          # ユーザー選択画面
└── _layout.tsx              # ルートレイアウト

components/                   # 再利用可能なUIコンポーネント
├── ui/                      # UIコンポーネント
│   ├── Avatar.tsx           # アバターコンポーネント
│   ├── Button.tsx           # ボタンコンポーネント
│   ├── ChatInput.tsx        # チャット入力コンポーネント
│   ├── ChatMessage.tsx      # メッセージ表示コンポーネント
│   ├── FriendRequestNotification.tsx  # 友達リクエスト通知
│   ├── NotificationList.tsx # 通知一覧
│   ├── NotificationSettings.tsx       # 通知設定
│   └── TabBarBackground.tsx # タブバー背景
├── ThemedText.tsx           # テーマ対応テキスト
└── ThemedView.tsx           # テーマ対応ビュー

lib/                         # ライブラリ・ユーティリティ
├── contexts/
│   └── AuthContext.tsx      # 認証状態管理
├── firebase/                # Firebase関連
│   ├── config.ts            # Firebase設定
│   ├── auth.ts              # 認証機能
│   ├── firestore.ts         # Firestore機能
│   ├── messaging.ts         # プッシュ通知
│   ├── models.ts            # データモデル定義
│   ├── storage.ts           # ファイルストレージ
│   └── firestore.rules      # セキュリティルール
├── services/
│   └── NotificationService.ts # 通知サービス
└── utils/
    └── notificationTestData.ts # 通知テストデータ

hooks/                       # カスタムフック
├── useColorScheme.ts        # カラースキーム管理
├── useFriends.ts            # 友達機能
├── useNotifications.ts      # 通知管理
└── useThemeColor.ts         # テーマカラー管理
```

## 機能詳細

### 🔐 認証機能

- **ユーザー登録・ログイン**: Email/Password による認証
- **セッション管理**: 自動ログイン・ログアウト
- **エラーハンドリング**: 分かりやすいエラーメッセージ表示
- **状態管理**: React Context による認証状態の一元管理

### 💬 チャット機能

- **リアルタイムメッセージング**: Firestore による即座のメッセージ同期
- **メッセージ表示**: 送信者別のメッセージバブル表示
- **タイムスタンプ**: メッセージ送信時刻の表示
- **キーボード対応**: iOS/Android のキーボード表示に最適化
- **自動スクロール**: 新しいメッセージへの自動スクロール

### 👥 友達機能

- **友達リクエスト**: 他のユーザーへの友達リクエスト送信
- **リクエスト管理**: 受信したリクエストの承認・拒否
- **友達リスト**: 承認済み友達の一覧表示
- **ユーザー検索**: 表示名による友達検索

### 🔔 通知機能

- **プッシュ通知**: Firebase Cloud Messaging による通知
- **通知権限管理**: ユーザーの通知設定に基づく制御
- **通知一覧**: 受信した通知の履歴表示
- **通知設定**: 通知のオン/オフ切り替え

### 🎨 UI/UX

- **モダンデザイン**: 直感的で美しいインターフェース
- **レスポンシブ**: 様々な画面サイズに対応
- **テーマ対応**: ライト/ダークモード切り替え
- **アニメーション**: スムーズな画面遷移とインタラクション

## 使用方法

### 初回セットアップ

1. **アプリ起動**: `npm start` で開発サーバーを起動
2. **アカウント作成**: サインアップ画面でメールアドレスとパスワードを入力
3. **ログイン**: 作成したアカウントでログイン

### 基本的な使い方

1. **チャット**: ホーム画面でメッセージを送受信
2. **友達追加**: 友達画面でユーザーを検索してリクエスト送信
3. **通知確認**: 通知タブで受信した通知を確認
4. **設定変更**: 通知設定でプッシュ通知をカスタマイズ

## 開発状況

### ✅ 完了済み機能

#### 認証・ユーザー管理

- ユーザー登録・ログイン・ログアウト
- Firebase Authentication 連携
- 認証状態の管理
- エラーハンドリング

#### チャット機能

- リアルタイムメッセージ送受信
- メッセージ表示（送信者別バブル）
- タイムスタンプ表示
- キーボード対応
- 自動スクロール

#### 友達機能

- 友達リクエストの送受信
- リクエストの承認・拒否
- 友達リスト管理
- ユーザー検索

#### 通知機能

- Firebase Cloud Messaging 設定
- プッシュ通知の受信・処理
- 通知権限管理
- 通知一覧・設定画面
- 既読/未読管理

#### UI/UX

- モダンなチャットインターフェース
- レスポンシブデザイン
- テーマ対応（ライト/ダークモード）
- スムーズなアニメーション

### 🔄 開発中・計画中

#### 個別チャット機能

- 1 対 1 チャットルームの動的作成
- チャットルーム選択画面
- グループチャット機能

#### 高度な機能

- 画像・ファイル送信
- メッセージの編集・削除
- オンライン状態表示
- メッセージ検索

#### パフォーマンス最適化

- メッセージのページネーション
- 画像の最適化
- オフライン対応

## デプロイ

### 開発環境での実行

```bash
# 依存関係のインストール
npm install

# 開発サーバー起動
npm start

# プラットフォーム別実行
npm run ios      # iOS シミュレーター
npm run android  # Android エミュレーター
npm run web      # Web ブラウザ
```

### 本番環境へのデプロイ

詳細なデプロイ手順については、[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) を参照してください。

#### 主要なデプロイ方法

- **Expo EAS Build**: モバイルアプリのビルド・配布
- **Web デプロイ**: Vercel、Netlify、Firebase Hosting
- **アプリストア**: App Store、Google Play Store

## ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。

## 貢献

プルリクエストやイシューの報告を歓迎します。詳細については、[CONTRIBUTING.md](./CONTRIBUTING.md) を参照してください。

## サポート

- **ドキュメント**: [Expo Documentation](https://docs.expo.dev/)
- **Firebase**: [Firebase Documentation](https://firebase.google.com/docs)
- **React Native**: [React Native Documentation](https://reactnative.dev/docs/getting-started)
