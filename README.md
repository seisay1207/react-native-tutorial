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

#### よくあるエラー

- `Firebase not configured`: 環境変数が設定されていません
- `auth/user-not-found`: ユーザーが存在しません（先にサインアップが必要）
- `auth/wrong-password`: パスワードが間違っています
- `auth/invalid-email`: メールアドレスの形式が正しくありません

## プロジェクト構成

```
app/
├── auth/           # 認証関連画面
├── firebase/       # Firebase設定・認証機能
├── contexts/       # React Context
└── (tabs)/         # メイン画面
```

## 機能

- ユーザー認証（ログイン・サインアップ・ログアウト）
- Firebase Authentication 連携
- エラーハンドリング
- デバッグログ機能
