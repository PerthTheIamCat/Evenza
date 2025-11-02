import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";

import { Text } from "@/components/Themed";
import { useColorScheme } from "@/components/useColorScheme";
import { AUTH_TOKEN_STORAGE_KEY } from "@/constants/auth";
import { auth } from "@/lib/firebase";
import {
  useNotificationPreferences,
  type NotificationPreferenceKey,
} from "@/context/NotificationPreferencesContext";

const notificationItems: Array<{
  key: NotificationPreferenceKey;
  label: string;
  description: string;
}> = [
  {
    key: "notifyOnJoin",
    label: "Notify me when I join an event",
    description:
      "Receive confirmations and reminders for events you add to your list.",
  },
  {
    key: "notifyOnCancellation",
    label: "Alert me if an event is canceled",
    description:
      "Get notified when organizers cancel events you've already joined.",
  },
];

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { preferences, setPreference, loading } = useNotificationPreferences();
  const [signingOut, setSigningOut] = useState(false);

  const gradient =
    colorScheme === "dark"
      ? (["#080F3C", "#1A2671", "#300141"] as const)
      : (["#142860", "#223C92", "#4B0A74"] as const);

  return (
    <LinearGradient
      colors={gradient}
      style={styles.gradient}
      locations={[0, 0.4, 1]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>
          Keep track of your event activity without leaving this device.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Event notifications</Text>
          {notificationItems.map((item) => (
            <View key={item.key} style={styles.settingRow}>
              <View>
                <Text style={styles.settingLabel}>{item.label}</Text>
                <Text style={styles.settingDescription}>
                  {item.description}
                </Text>
              </View>
              <Switch
                value={preferences[item.key]}
                onValueChange={(value) => setPreference(item.key, value)}
                disabled={loading}
                thumbColor={preferences[item.key] ? "#6A6DFF" : "#DAD9F5"}
                trackColor={{
                  false: "rgba(255,255,255,0.2)",
                  true: "rgba(106,109,255,0.45)",
                }}
              />
            </View>
          ))}
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={async () => {
            if (signingOut) {
              return;
            }
            setSigningOut(true);
            try {
              await Promise.all([
                AsyncStorage.removeItem("userEmail"),
                AsyncStorage.removeItem(AUTH_TOKEN_STORAGE_KEY),
              ]);
              await signOut(auth);
              router.replace("/signIn");
            } catch (error) {
              console.warn("Failed to sign out", error);
            } finally {
              setSigningOut(false);
            }
          }}
          style={styles.signOutButton}
        >
          <Text style={styles.signOutLabel}>
            {signingOut ? "Signing out..." : "Sign out"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 120,
    gap: 28,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "600",
  },
  subtitle: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 16,
    width: "80%",
  },
  section: {
    backgroundColor: "rgba(9, 15, 46, 0.6)",
    borderRadius: 26,
    padding: 20,
    gap: 20,
  },
  sectionLabel: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  settingLabel: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
  settingDescription: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 14,
    marginTop: 4,
    width: 250,
  },
  signOutButton: {
    marginTop: 12,
    paddingVertical: 16,
    borderRadius: 18,
    backgroundColor: "rgba(255, 82, 82, 0.18)",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,82,82,0.45)",
  },
  signOutLabel: {
    color: "#FF5252",
    fontSize: 16,
    fontWeight: "600",
  },
});
