import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LinearGradient } from "expo-linear-gradient";

import { SquareActionButton } from "@/components/CustomButton";
import { CustomInput } from "@/components/CustomInput";
import { LogoSmallWhiteOutline } from "@/components/Logos/Logos";
import { Text } from "@/components/Themed";
import { useColorScheme } from "@/components/useColorScheme";

type VerificationStage = "email" | "otp";

const otpCode = "123456";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Verification() {
  const colorScheme = useColorScheme();
  const [stage, setStage] = useState<VerificationStage>("email");
  const [email, setEmail] = useState<string>("");
  const [otp, setOtp] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [justResent, setJustResent] = useState<boolean>(false);

  const normalizedEmail = email.trim();
  const isEmailValid = emailRegex.test(normalizedEmail);
  const isOtpComplete = otp.trim().length === otpCode.length;

  const gradient =
    colorScheme === "dark"
      ? (["#0B1F5F", "#1E3C8F", "#320040"] as const)
      : (["#132B7A", "#1E3E8B", "#440027"] as const);

  const buttonState = useMemo(() => {
    if (loading) {
      return "loading" as const;
    }
    if (stage === "email") {
      return isEmailValid ? ("active" as const) : ("disabled" as const);
    }
    return isOtpComplete ? ("active" as const) : ("disabled" as const);
  }, [loading, stage, isEmailValid, isOtpComplete]);

  const handleContinue = () => {
    if (loading) {
      return;
    }
    if (stage === "email") {
      if (!isEmailValid) {
        return;
      }
      setLoading(true);
      setError(null);
      setJustResent(false);
      setTimeout(() => {
        setLoading(false);
        setStage("otp");
      }, 800);
      return;
    }

    if (!isOtpComplete) {
      return;
    }

    setLoading(true);
    setError(null);
    setTimeout(() => {
      setLoading(false);
      if (otp.trim() !== otpCode) {
        setError("Invalid Code");
        return;
      }
      setError(null);
      // Placeholder success path
    }, 900);
  };

  const handleResend = () => {
    if (loading || stage !== "otp") {
      return;
    }
    setLoading(true);
    setError(null);
    setTimeout(() => {
      setLoading(false);
      setOtp("");
      setJustResent(true);
    }, 800);
  };

  const otpStatus = error ? ("error" as const) : ("default" as const);

  return (
    <LinearGradient colors={gradient} style={styles.gradient} locations={[0, 0.45, 1]}>
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
            <Text style={styles.subtitle}>Verify email for notifications</Text>

            <CustomInput
              placeholder="Email"
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                if (stage === "otp") {
                  setStage("email");
                  setOtp("");
                  setError(null);
                  setJustResent(false);
                }
              }}
              containerStyle={styles.inputSpacing}
              iconName="mail-outline"
              keyboardType="email-address"
              autoCapitalize="none"
              textContentType="emailAddress"
            />

            {stage === "otp" && (
              <>
                <CustomInput
                  placeholder="OTP"
                  value={otp}
                  onChangeText={(value) => {
                    setOtp(value);
                    if (error) {
                      setError(null);
                    }
                  }}
                  containerStyle={styles.inputSpacing}
                  iconName="keypad-outline"
                  keyboardType="number-pad"
                  textContentType="oneTimeCode"
                  status={otpStatus}
                  maxLength={6}
                />
                <View style={styles.resendRow}>
                  <TouchableOpacity onPress={handleResend} disabled={loading}>
                    <Text style={styles.link}>resend</Text>
                  </TouchableOpacity>
                  {justResent && !loading && (
                    <Text style={styles.resendInfo}>Code sent</Text>
                  )}
                </View>
                {error && <Text style={styles.errorText}>{error}</Text>}
              </>
            )}
          </View>

          <View style={styles.footer}>
            <TouchableOpacity onPress={() => {}}>
              <Text style={styles.link}>Skip</Text>
            </TouchableOpacity>
            <SquareActionButton
              onPress={handleContinue}
              state={buttonState}
              accessibilityLabel="Continue verification"
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
    marginBottom: 36,
    textAlign: "center",
  },
  inputSpacing: {
    marginTop: 20,
  },
  resendRow: {
    width: "100%",
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 12,
  },
  link: {
    fontSize: 16,
    color: "#FFFFFF",
    textDecorationLine: "underline",
  },
  resendInfo: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: "#FF3B30",
  },
  footer: {
    alignItems: "center",
    gap: 24,
  },
});
