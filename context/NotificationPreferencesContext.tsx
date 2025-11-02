import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type NotificationPreferenceKey =
  | "notifyOnJoin"
  | "notifyOnCancellation";

export type NotificationPreferences = Record<
  NotificationPreferenceKey,
  boolean
>;

const defaultPreferences: NotificationPreferences = {
  notifyOnJoin: true,
  notifyOnCancellation: true,
};

const STORAGE_KEY = "evenza.localNotificationPreferences";

type NotificationPreferencesContextValue = {
  preferences: NotificationPreferences;
  setPreference: (key: NotificationPreferenceKey, value: boolean) => void;
  loading: boolean;
};

const NotificationPreferencesContext =
  createContext<NotificationPreferencesContextValue | undefined>(undefined);

export function NotificationPreferencesProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [preferences, setPreferences] =
    useState<NotificationPreferences>(defaultPreferences);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    const hydrate = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (!stored || !isMounted) {
          return;
        }
        const parsed = JSON.parse(stored) as Partial<NotificationPreferences>;
        setPreferences((prev) => ({
          ...prev,
          ...parsed,
        }));
      } catch (error) {
        console.warn("Failed to load notification preferences", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    hydrate().catch((error) => {
      console.warn("Failed to hydrate notification preferences", error);
      setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const setPreference = useCallback(
    (key: NotificationPreferenceKey, value: boolean) => {
      setPreferences((prev) => {
        const next = {
          ...prev,
          [key]: value,
        };
        void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(
          (error) => {
            console.warn(
              "Failed to persist notification preferences",
              error,
            );
          },
        );
        return next;
      });
    },
    [],
  );

  const value = useMemo(
    () => ({
      preferences,
      setPreference,
      loading,
    }),
    [preferences, setPreference, loading],
  );

  return (
    <NotificationPreferencesContext.Provider value={value}>
      {children}
    </NotificationPreferencesContext.Provider>
  );
}

export function useNotificationPreferences() {
  const context = useContext(NotificationPreferencesContext);
  if (!context) {
    throw new Error(
      "useNotificationPreferences must be used within NotificationPreferencesProvider",
    );
  }
  return context;
}
