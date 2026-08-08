import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// ============================================================
// Your Firebase project config.
// Firebase Console → Project Settings → General → Your apps → SDK setup
// ============================================================
const firebaseConfig = {
  apiKey: "AIzaSyB4WfsOR27j3WjYbmzenhiiGa1jldfjeDk",
  authDomain: "reactra-a1b5a.firebaseapp.com",
  projectId: "reactra-a1b5a",
  storageBucket: "reactra-a1b5a.firebasestorage.app",
  messagingSenderId: "283381744794",
  appId: "",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;