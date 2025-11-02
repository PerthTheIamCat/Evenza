import AsyncStorage from "@react-native-async-storage/async-storage";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { AUTH_TOKEN_STORAGE_KEY } from "@/constants/auth";
import { auth } from "@/lib/firebase";

type AuthStatus = "checking" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  status: AuthStatus;
  user: User | null;
  initialized: boolean;
};

const AuthTokenContext = createContext<AuthContextValue>({
  status: "checking",
  user: null,
  initialized: false,
});

export function AuthTokenProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthContextValue>({
    status: "checking",
    user: null,
    initialized: false,
  });

  const hasHandledInitialState = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const handleStoredToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
        console.log(storedToken);
        if (!isMounted || hasHandledInitialState.current) {
          return;
        }
        if (storedToken) {
          setState((prev) => ({
            ...prev,
            status: "authenticated",
          }));
        } else {
          setState((prev) => ({
            ...prev,
            status: "unauthenticated",
          }));
        }
      } catch (error) {
        console.warn("Failed to read stored auth token", error);
        if (!isMounted || hasHandledInitialState.current) {
          return;
        }
        setState((prev) => ({
          ...prev,
          status: "unauthenticated",
        }));
      }
    };

    handleStoredToken();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!isMounted) {
        return;
      }
      hasHandledInitialState.current = true;
      if (user) {
        try {
          const token = await user.getIdToken();
          await AsyncStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
        } catch (error) {
          console.warn("Failed to cache auth token from listener", error);
        }
        setState({
          status: "authenticated",
          user,
          initialized: true,
        });
      } else {
        try {
          await AsyncStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
        } catch (error) {
          console.warn("Failed to clear cached auth token", error);
        }
        setState({
          status: "unauthenticated",
          user: null,
          initialized: true,
        });
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const value = useMemo(() => state, [state]);

  return (
    <AuthTokenContext.Provider value={value}>
      {children}
    </AuthTokenContext.Provider>
  );
}

export const useAuthToken = () => useContext(AuthTokenContext);
