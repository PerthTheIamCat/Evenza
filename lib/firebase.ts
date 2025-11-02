import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const STORAGE_AVAILABLE_KEY = "__evenza_auth_storage_available";

const createReactNativePersistence = (
  storage: Pick<typeof AsyncStorage, "getItem" | "setItem" | "removeItem"> | null,
) => {
  return class {
    static readonly type = "LOCAL";
    readonly type = "LOCAL" as const;

    async _isAvailable() {
      try {
        if (!storage) {
          return false;
        }
        await storage.setItem(STORAGE_AVAILABLE_KEY, "1");
        await storage.removeItem(STORAGE_AVAILABLE_KEY);
        return true;
      } catch {
        return false;
      }
    }

    async _set(key: string, value: unknown) {
      if (!storage) {
        return;
      }
      await storage.setItem(key, JSON.stringify(value));
    }

    async _get<T>(key: string): Promise<T | null> {
      if (!storage) {
        return null;
      }
      const json = await storage.getItem(key);
      return json ? (JSON.parse(json) as T) : null;
    }

    async _remove(key: string) {
      if (!storage) {
        return;
      }
      await storage.removeItem(key);
    }

    // Persistence listeners are not supported on React Native storage.
    _addListener(_key: string, _listener: unknown) {
      return;
    }

    _removeListener(_key: string, _listener: unknown) {
      return;
    }
  };
};

const ReactNativePersistence = createReactNativePersistence(AsyncStorage);

const auth =
  getApps().length === 0
    ? initializeAuth(app, { persistence: ReactNativePersistence as any })
    : getAuth(app);

const db = getFirestore(app);

export { app, auth, db };
