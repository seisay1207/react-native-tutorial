# React Native アプリ デプロイガイド

## 概要

このガイドでは、Expo SDK 54 を使用した React Native アプリのデプロイ方法を説明します。

## デプロイ方法

### 1. Expo EAS Build（推奨）

#### 必要な準備

1. **Expo アカウントの作成**

   - [Expo.dev](https://expo.dev)でアカウントを作成
   - 無料プランでも基本的なデプロイが可能

2. **EAS CLI のインストール**

   ```bash
   npm install -g eas-cli
   ```

3. **ログイン**
   ```bash
   npx eas-cli login
   ```

#### ビルド手順

1. **開発用ビルド**

   ```bash
   npx eas-cli build --platform ios --profile development
   npx eas-cli build --platform android --profile development
   ```

2. **プレビュー用ビルド**

   ```bash
   npx eas-cli build --platform ios --profile preview
   npx eas-cli build --platform android --profile preview
   ```

3. **本番用ビルド**
   ```bash
   npx eas-cli build --platform ios --profile production
   npx eas-cli build --platform android --profile production
   ```

#### アプリストアへの提出

1. **iOS App Store**

   ```bash
   npx eas-cli submit --platform ios
   ```

2. **Google Play Store**
   ```bash
   npx eas-cli submit --platform android
   ```

### 2. Web 版デプロイ

#### 静的ファイルのビルド

```bash
npm run build:web
```

#### デプロイ先の選択

- **Vercel**: `vercel --prod`
- **Netlify**: `netlify deploy --prod --dir dist`
- **GitHub Pages**: `gh-pages -d dist`
- **Firebase Hosting**: `firebase deploy`

### 3. Expo Go（開発・テスト用）

#### 開発サーバーの起動

```bash
npm start
```

#### QR コードでテスト

- iOS: Camera.app で QR コードをスキャン
- Android: Expo Go アプリで QR コードをスキャン

## デプロイ前チェックリスト

### ✅ 基本設定

- [ ] `app.json`の設定が完了している
- [ ] アプリ名、バージョン、アイコンが設定されている
- [ ] Bundle ID / Package Name が設定されている
- [ ] 必要な権限が設定されている

### ✅ Firebase 設定

- [ ] Firebase 設定ファイルが本番環境用に設定されている
- [ ] API キーが環境変数で管理されている
- [ ] Firestore セキュリティルールが適切に設定されている

### ✅ 機能テスト

- [ ] 認証機能が正常に動作する
- [ ] チャット機能が正常に動作する
- [ ] 通知機能が正常に動作する
- [ ] 画像アップロード機能が正常に動作する

### ✅ パフォーマンス

- [ ] アプリの起動時間が適切
- [ ] メモリ使用量が適切
- [ ] ネットワーク通信が最適化されている

### ✅ セキュリティ

- [ ] 機密情報がハードコードされていない
- [ ] API キーが適切に保護されている
- [ ] ユーザーデータが適切に暗号化されている

### ✅ アプリストア要件

- [ ] プライバシーポリシーが準備されている
- [ ] アプリの説明文が準備されている
- [ ] スクリーンショットが準備されている
- [ ] 年齢制限が適切に設定されている

## 環境変数の設定

### 開発環境

```bash
# .env.local
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
```

### 本番環境

EAS Build で環境変数を設定：

```bash
npx eas-cli env:create --name EXPO_PUBLIC_FIREBASE_API_KEY --value your_production_api_key
```

## トラブルシューティング

### よくある問題

1. **ビルドエラー**

   - `eas.json`の設定を確認
   - 依存関係のバージョンを確認
   - ログを確認: `npx eas-cli build --platform ios --profile production --clear-cache`

2. **Firebase 接続エラー**

   - 環境変数が正しく設定されているか確認
   - Firebase 設定ファイルが最新か確認

3. **権限エラー**
   - `app.json`の権限設定を確認
   - プラットフォーム固有の設定を確認

### サポート

- [Expo Documentation](https://docs.expo.dev/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Firebase Documentation](https://firebase.google.com/docs)

## 次のステップ

1. **アナリティクス**: Firebase Analytics の設定
2. **クラッシュレポート**: Firebase Crashlytics の設定
3. **A/B テスト**: Firebase Remote Config の設定
4. **プッシュ通知**: Firebase Cloud Messaging の設定
5. **継続的デプロイ**: GitHub Actions の設定
