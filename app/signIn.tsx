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
import { useRouter } from "expo-router";

import { SquareActionButton } from "@/components/CustomButton";
import { CustomInput } from "@/components/CustomInput";
import { LogoSmallWhiteOutline } from "@/components/Logos/Logos";

import { Text } from "@/components/Themed";
import { useColorScheme } from "@/components/useColorScheme";

type AuthStage = "username" | "createPassword" | "existingPassword";

type UserStore = Record<string, { password: string }>;

const initialUsers: UserStore = {
  sunny: { password: "sunny123" },
  luna: { password: "moonlight" },
};

export default function SignIn() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [users, setUsers] = useState<UserStore>(initialUsers);
  const [stage, setStage] = useState<AuthStage>("username");
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const trimmedUsername = username.trim();
  const lowerUsername = trimmedUsername.toLowerCase();
  const activeUser = users[lowerUsername];

  const buttonState = useMemo(() => {
    if (loading) {
      return "loading" as const;
    }
    if (stage === "username") {
      return trimmedUsername.length > 0 ? ("active" as const) : ("disabled" as const);
    }
    if (stage === "createPassword") {
      return password.length > 0 && confirmPassword.length > 0
        ? ("active" as const)
        : ("disabled" as const);
    }
    return password.length > 0 ? ("active" as const) : ("disabled" as const);
  }, [loading, stage, trimmedUsername.length, password.length, confirmPassword.length]);

  const resetPasswordFields = () => {
    setPassword("");
    setConfirmPassword("");
  };

  const moveToPasswordStage = (nextStage: AuthStage) => {
    setStage(nextStage);
    resetPasswordFields();
    setError(null);
  };

  const handlePrimaryAction = () => {
    if (loading) {
      return;
    }
    if (stage === "username") {
      if (!trimmedUsername) {
        return;
      }
      setLoading(true);
      setError(null);
      setTimeout(() => {
        setLoading(false);
        if (users[lowerUsername]) {
          moveToPasswordStage("existingPassword");
        } else {
          moveToPasswordStage("createPassword");
        }
      }, 700);
      return;
    }

    if (stage === "createPassword") {
      if (!password || !confirmPassword) {
        return;
      }
      if (password !== confirmPassword) {
        setError("Password Not Match");
        return;
      }
      setLoading(true);
      setError(null);
      setTimeout(() => {
        setUsers((prev) => ({
          ...prev,
          [lowerUsername]: { password },
        }));
        setLoading(false);
        moveToPasswordStage("existingPassword");
        router.push("/verification");
      }, 900);
      return;
    }

    if (!password) {
      return;
    }

    setLoading(true);
    setError(null);
    setTimeout(() => {
      setLoading(false);
      if (!activeUser || activeUser.password !== password) {
        setError("Username or password incorrect");
        return;
      }
      setError(null);
      // Placeholder for navigation on successful sign-in.
    }, 900);
  };

  const isCreateStage = stage === "createPassword";
  const isLoginStage = stage === "existingPassword";
  const showForgotPassword = isLoginStage;
  const isPasswordMismatch = error === "Password Not Match";

  const usernameStatus =
    error && isLoginStage && !isPasswordMismatch
      ? ("error" as const)
      : ("default" as const);
  const passwordStatus =
    error && (isLoginStage || isPasswordMismatch)
      ? ("error" as const)
      : ("default" as const);

  const gradient =
    colorScheme === "dark"
      ? (["#0B1F5F", "#1E3C8F", "#320040"] as const)
      : (["#132B7A", "#1E3E8B", "#440027"] as const);

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

          <View style={styles.form}>
            <Text style={styles.headline}>Sign In</Text>
            {stage === "createPassword" && (
              <>
                <Text style={styles.subTitle}>Look like you are new</Text>
                <Text style={styles.subCopy}>
                  Please enter password to setup your new account
                </Text>
              </>
            )}
            {stage === "existingPassword" && (
              <Text style={styles.subTitle}>Welcome Back</Text>
            )}
            <CustomInput
              placeholder="Username"
              value={username}
              onChangeText={(text) => {
                setUsername(text);
                if (stage !== "username") {
                  setStage("username");
                  resetPasswordFields();
                  setError(null);
                }
              }}
              status={usernameStatus}
              containerStyle={styles.inputSpacing}
              iconName="person-outline"
              textContentType="username"
            />

            {stage !== "username" && (
              <>
                <CustomInput
                  placeholder={isCreateStage ? "Password" : "Password"}
                  secureTextEntry
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (error) {
                      setError(null);
                    }
                  }}
                  status={passwordStatus}
                  containerStyle={styles.inputSpacing}
                  iconName="lock-closed-outline"
                  textContentType="password"
                />
                {isCreateStage && (
                  <CustomInput
                    placeholder="Confirm Password"
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      if (error) {
                        setError(null);
                      }
                    }}
                    status={passwordStatus}
                    containerStyle={styles.inputSpacing}
                    iconName="lock-closed-outline"
                    textContentType="password"
                  />
                )}
                {error && <Text style={styles.errorText}>{error}</Text>}
                {isCreateStage ? (
                  <TouchableOpacity
                    onPress={() => {
                      moveToPasswordStage("existingPassword");
                    }}
                  >
                    <Text style={styles.link}>No I already have an account</Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    {showForgotPassword && (
                      <TouchableOpacity onPress={() => {}}>
                        <Text style={styles.link}>Forgot Password</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      onPress={() => {
                        moveToPasswordStage("createPassword");
                      }}
                    >
                      <Text style={styles.link}>Create New Account</Text>
                    </TouchableOpacity>
                  </>
                )}
              </>
            )}
          </View>

          <SquareActionButton
            onPress={handlePrimaryAction}
            state={buttonState}
            accessibilityLabel="Submit sign in details"
          />
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 24,
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
  form: {
    width: "80%",
    maxWidth: 340,
    alignItems: "center",
  },
  headline: {
    fontSize: 32,
    color: "#FFFFFF",
    marginBottom: 24,
  },
  subTitle: {
    fontSize: 20,
    color: "#FFFFFF",
    marginBottom: 8,
  },
  subCopy: {
    fontSize: 16,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    marginBottom: 20,
  },
  inputSpacing: {
    marginTop: 12,
  },
  errorText: {
    marginTop: 12,
    color: "#FF3B30",
    fontSize: 16,
  },
  link: {
    marginTop: 16,
    fontSize: 16,
    color: "#FFFFFF",
    textDecorationLine: "underline",
  },
});
