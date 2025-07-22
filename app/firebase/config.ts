import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// デバッグ用: 環境変数の確認
console.log("Firebase Config Debug:");
console.log(
  "API Key:",
  process.env.EXPO_PUBLIC_FIREBASE_API_KEY ? "Set" : "Not Set"
);
console.log(
  "Auth Domain:",
  process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ? "Set" : "Not Set"
);
console.log(
  "Project ID:",
  process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ? "Set" : "Not Set"
);
console.log(
  "App ID:",
  process.env.EXPO_PUBLIC_FIREBASE_APP_ID ? "Set" : "Not Set"
);

let auth: any;
let db: any;

// 一時的にFirebase初期化をスキップ（環境変数が設定されていない場合）
if (!process.env.EXPO_PUBLIC_FIREBASE_API_KEY) {
  console.warn("Firebase environment variables not set. Using mock auth.");

  // モック認証インスタンスを作成
  const mockAuth = {
    onAuthStateChanged: (callback: (user: any) => void) => {
      console.log("Mock auth: No user logged in");
      callback(null);
      return () => {};
    },
  } as any;

  auth = mockAuth;
  db = {} as any;
} else {
  // 必須環境変数の検証
  const requiredEnvVars = [
    "EXPO_PUBLIC_FIREBASE_API_KEY",
    "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN",
    "EXPO_PUBLIC_FIREBASE_PROJECT_ID",
    "EXPO_PUBLIC_FIREBASE_APP_ID",
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.error(`Missing required environment variable: ${envVar}`);
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }

  let app;
  try {
    // アプリ内で1回だけ初期化
    app = initializeApp(firebaseConfig);
    console.log("Firebase initialized successfully");
  } catch (error) {
    console.error("Firebase initialization error:", error);
    throw error;
  }

  // 認証とFirestoreのインスタンスを取得
  auth = getAuth(app);
  db = getFirestore(app);

  console.log("Firebase Auth and Firestore instances created");
}

export { auth, db };
