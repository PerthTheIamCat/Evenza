import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, type ReactNode } from "react";
import "react-native-reanimated";

import AppSplash from "@/components/AppSplash";
import { useColorScheme } from "@/components/useColorScheme";
import { AuthTokenProvider, useAuthToken } from "@/context/AuthTokenContext";
import { EventsProvider } from "@/context/EventsContext";
import { JoinedEventsProvider } from "@/context/JoinedEventsContext";
import { NotificationPreferencesProvider } from "@/context/NotificationPreferencesContext";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: "(tabs)",
};

// Keep the native splash on until we decide to hide it.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    Montserrat: require("../assets/fonts/Montserrat-VariableFont_wght.ttf"),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  return (
    <AuthTokenProvider>
      <RootLayoutInner fontsLoaded={loaded} />
    </AuthTokenProvider>
  );
}

function RootLayoutInner({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { initialized } = useAuthToken();

  useEffect(() => {
    // As soon as JS is ready, hide the native splash so we can show our custom one.
    // We'll still gate app navigation until resources are ready.
    SplashScreen.hideAsync().catch(() => {
      // no-op: splash might already be hidden
    });
  }, [fontsLoaded, initialized]);

  // While fonts/auth are not ready, show our custom splash screen
  if (!fontsLoaded || !initialized) return <AppSplash />;

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <NotificationPreferencesProvider>
      <EventsProvider>
        <JoinedEventsProvider>
          <ThemeProvider
            value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
          >
            <AuthNavigationGate>
              <Stack>
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="signIn" options={{ headerShown: false }} />
                <Stack.Screen
                  name="verification"
                  options={{ headerShown: false }}
                />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              </Stack>
            </AuthNavigationGate>
          </ThemeProvider>
        </JoinedEventsProvider>
      </EventsProvider>
    </NotificationPreferencesProvider>
  );
}

function AuthNavigationGate({ children }: { children: ReactNode }) {
  const { status, user, initialized } = useAuthToken();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!initialized || status === "checking") {
      return;
    }

    const [rootSegment] = segments;
    const inTabsGroup = rootSegment === "(tabs)";
    const isAuthScreen = rootSegment === undefined || rootSegment === "signIn";
    const needsVerification = user != null && user.emailVerified === false;

    if (status === "authenticated") {
      if (needsVerification) {
        if (rootSegment !== "verification") {
          router.replace("/verification");
        }
        return;
      }
      if (!inTabsGroup) {
        router.replace("/(tabs)/home");
      }
      return;
    }

    if (status === "unauthenticated") {
      if (inTabsGroup || (!isAuthScreen && rootSegment !== "verification")) {
        router.replace("/signIn");
      }
    }
  }, [initialized, status, user, segments, router]);

  if (status === "checking") {
    return null;
  }

  return <>{children}</>;
}
