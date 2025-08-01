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
console.log("=== Firebase Config Debug ===");
console.log("Environment variables check:");
console.log(
  "API Key:",
  process.env.EXPO_PUBLIC_FIREBASE_API_KEY ? "✓ Set" : "✗ Not Set"
);
console.log(
  "Auth Domain:",
  process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ? "✓ Set" : "✗ Not Set"
);
console.log(
  "Project ID:",
  process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ? "✓ Set" : "✗ Not Set"
);
console.log(
  "App ID:",
  process.env.EXPO_PUBLIC_FIREBASE_APP_ID ? "✓ Set" : "✗ Not Set"
);
console.log("=============================");

let auth: any;
let db: any;

// 環境変数の検証
const requiredEnvVars = [
  "EXPO_PUBLIC_FIREBASE_API_KEY",
  "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "EXPO_PUBLIC_FIREBASE_PROJECT_ID",
  "EXPO_PUBLIC_FIREBASE_APP_ID",
];

const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error("❌ Missing required environment variables:");
  missingEnvVars.forEach((envVar) => console.error(`  - ${envVar}`));
  console.error("Please create a .env file with your Firebase configuration.");
  console.error("Example .env file:");
  console.error(`
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key_here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
  `);

  // モック認証インスタンスを作成
  const mockAuth = {
    onAuthStateChanged: (callback: (user: any) => void) => {
      console.log("⚠️ Mock auth: No user logged in (Firebase not configured)");
      callback(null);
      return () => {};
    },
    signInWithEmailAndPassword: async () => {
      throw new Error(
        "Firebase not configured. Please set up environment variables."
      );
    },
    createUserWithEmailAndPassword: async () => {
      throw new Error(
        "Firebase not configured. Please set up environment variables."
      );
    },
    signOut: async () => {
      throw new Error(
        "Firebase not configured. Please set up environment variables."
      );
    },
    signInAnonymously: async () => {
      throw new Error(
        "Firebase not configured. Please set up environment variables."
      );
    },
  } as any;

  auth = mockAuth;
  db = {} as any;
} else {
  console.log("✅ All required environment variables are set");

  let app;
  try {
    // アプリ内で1回だけ初期化
    app = initializeApp(firebaseConfig);
    console.log("✅ Firebase initialized successfully");
  } catch (error) {
    console.error("❌ Firebase initialization error:", error);
    throw error;
  }

  // 認証とFirestoreのインスタンスを取得
  try {
    auth = getAuth(app);
    db = getFirestore(app);
    console.log("✅ Firebase Auth and Firestore instances created");
  } catch (error) {
    console.error("❌ Error creating Auth/Firestore instances:", error);
    throw error;
  }
}

export { auth, db };
