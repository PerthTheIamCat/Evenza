import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LinearGradient } from "expo-linear-gradient";

import { useRouter } from "expo-router";

import { SquareActionButton } from "@/components/CustomButton";
import { LogoSmallWhiteOutline } from "@/components/Logos/Logos";
import { Text } from "@/components/Themed";
import { useColorScheme } from "@/components/useColorScheme";

import { FirebaseError } from "firebase/app";
import {
  onAuthStateChanged,
  sendEmailVerification,
  User,
} from "firebase/auth";

import { auth } from "@/lib/firebase";

const getAuthErrorMessage = (error: unknown) => {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/invalid-email":
        return "Email address invalid";
      case "auth/missing-email":
        return "Email address missing";
      case "auth/too-many-requests":
        return "Too many attempts, please try again later";
      case "auth/network-request-failed":
        return "Network error, please check your connection";
      default:
        return "Unable to send verification email";
    }
  }
  return "Unexpected error, please try again";
};

export default function Verification() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(() => auth.currentUser);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [sending, setSending] = useState<boolean>(false);
  const [checking, setChecking] = useState<boolean>(false);
  const autoSentRef = useRef<boolean>(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      if (nextUser?.emailVerified) {
        router.replace("/(tabs)/home");
      }
    });
    return unsubscribe;
  }, [router]);

  const currentEmail = user?.email ?? "";

  const handleSendVerification = useCallback(async () => {
    if (!user) {
      setError("Please sign in again");
      return;
    }
    if (user.emailVerified) {
      setInfo("Your email is already verified");
      return;
    }
    setSending(true);
    setError(null);
    setInfo(null);
    try {
      await sendEmailVerification(user);
      setInfo(`We sent a verification link to ${user.email}`);
    } catch (err) {
      setError(getAuthErrorMessage(err));
      autoSentRef.current = false;
    } finally {
      setSending(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user || user.emailVerified || autoSentRef.current) {
      return;
    }
    autoSentRef.current = true;
    handleSendVerification().catch(() => {
      // error state already handled in handler
    });
  }, [user, handleSendVerification]);

  const gradient =
    colorScheme === "dark"
      ? (["#0B1F5F", "#1E3C8F", "#320040"] as const)
      : (["#132B7A", "#1E3E8B", "#440027"] as const);

  const buttonState = useMemo(() => {
    if (checking) {
      return "loading" as const;
    }
    return user ? ("active" as const) : ("disabled" as const);
  }, [checking, user]);

  const handleCheckVerified = async () => {
    if (checking) {
      return;
    }
    if (!user) {
      setError("Please sign in again");
      return;
    }
    setChecking(true);
    setError(null);
    setInfo(null);
    try {
      await user.reload();
      const refreshed = auth.currentUser;
      setUser(refreshed);
      if (refreshed?.emailVerified) {
        router.replace("/(tabs)/home");
        return;
      }
      setError("Email not verified yet. Please check your inbox.");
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setChecking(false);
    }
  };

  return (
    <LinearGradient
      colors={gradient}
      style={styles.gradient}
      locations={[0, 0.45, 1]}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboardContainer}
        >
          <View style={styles.header}>
            <LogoSmallWhiteOutline />
            <Text style={styles.brand}>Evenza</Text>
          </View>

          <View style={styles.body}>
            <Text style={styles.title}>Verification</Text>
            <Text style={styles.subtitle}>
              We will send a verification link to your email so you can receive
              event notifications.
            </Text>
            {currentEmail ? (
              <Text style={styles.emailText}>{currentEmail}</Text>
            ) : (
              <Text style={styles.emailMissing}>
                No email detected. Please sign in again.
              </Text>
            )}
            <TouchableOpacity
              onPress={handleSendVerification}
              disabled={sending || !user}
              style={styles.sendButton}
            >
              <Text style={styles.sendButtonLabel}>
                {sending ? "Sending..." : "Resend verification email"}
              </Text>
            </TouchableOpacity>

            {info && <Text style={styles.infoText}>{info}</Text>}
            {error && <Text style={styles.errorText}>{error}</Text>}
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              onPress={() => {
                router.replace("/(tabs)/home");
              }}
            >
              <Text style={styles.link}>Skip</Text>
            </TouchableOpacity>
            <SquareActionButton
              onPress={handleCheckVerified}
              state={buttonState}
              accessibilityLabel="Check email verification status"
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "space-between",
  },
  header: {
    alignItems: "center",
    gap: 16,
  },
  brand: {
    fontSize: 48,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  body: {
    width: "80%",
    maxWidth: 340,
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    color: "#FFFFFF",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    color: "rgba(255,255,255,0.9)",
    marginBottom: 20,
    textAlign: "center",
  },
  emailText: {
    fontSize: 18,
    color: "#FFFFFF",
    marginBottom: 24,
  },
  emailMissing: {
    fontSize: 18,
    color: "#FF3B30",
    marginBottom: 24,
    textAlign: "center",
  },
  sendButton: {
    marginTop: 16,
  },
  sendButtonLabel: {
    fontSize: 16,
    color: "#FFFFFF",
    textDecorationLine: "underline",
  },
  link: {
    fontSize: 16,
    color: "#FFFFFF",
    textDecorationLine: "underline",
  },
  errorText: {
    marginTop: 20,
    fontSize: 16,
    color: "#FF3B30",
    textAlign: "center",
  },
  footer: {
    alignItems: "center",
    gap: 24,
  },
  infoText: {
    marginTop: 20,
    fontSize: 16,
    color: "#4CD964",
    textAlign: "center",
  },
});
