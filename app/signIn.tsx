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

import {
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

import { SquareActionButton } from "@/components/CustomButton";
import { CustomInput } from "@/components/CustomInput";
import { LogoSmallWhiteOutline } from "@/components/Logos/Logos";
import { Text } from "@/components/Themed";
import { useColorScheme } from "@/components/useColorScheme";
import { auth, db } from "@/lib/firebase";

type AuthStage = "email" | "createPassword" | "existingPassword";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getAuthErrorMessage = (error: unknown) => {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/invalid-email":
        return "Invalid email address";
      case "auth/user-disabled":
        return "This account has been disabled";
      case "auth/email-already-in-use":
        return "Email already registered";
      case "auth/weak-password":
        return "Password should be at least 6 characters";
      case "auth/invalid-credential":
      case "auth/wrong-password":
        return "Incorrect password";
      case "auth/user-not-found":
        return "Account not found";
      case "auth/too-many-requests":
        return "Too many attempts, please try again later";
      case "auth/network-request-failed":
        return "Network error, please check your connection";
      default:
        return "Authentication failed, please try again";
    }
  }
  return "Unexpected error, please try again";
};

export default function SignIn() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [stage, setStage] = useState<AuthStage>("email");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const trimmedEmail = email.trim();
  const normalizedEmail = trimmedEmail.toLowerCase();
  const isEmailValid = emailRegex.test(trimmedEmail);

  const buttonState = useMemo(() => {
    if (loading) {
      return "loading" as const;
    }
    if (stage === "email") {
      return trimmedEmail.length > 0 ? ("active" as const) : ("disabled" as const);
    }
    if (stage === "createPassword") {
      return password.length > 0 && confirmPassword.length > 0
        ? ("active" as const)
        : ("disabled" as const);
    }
    return password.length > 0 ? ("active" as const) : ("disabled" as const);
  }, [loading, stage, trimmedEmail.length, password.length, confirmPassword.length]);

  const resetPasswordFields = () => {
    setPassword("");
    setConfirmPassword("");
  };

  const moveToPasswordStage = (nextStage: AuthStage) => {
    setStage(nextStage);
    resetPasswordFields();
    setError(null);
    setMessage(null);
  };

  const handleIdentifyAccount = async () => {
    if (!trimmedEmail) {
      return;
    }
    if (!isEmailValid) {
      setError("Please enter a valid email");
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      let shouldGoToExistingPassword = false;

      try {
        const userDoc = await getDoc(doc(db, "users", normalizedEmail));
        shouldGoToExistingPassword = userDoc.exists();
        console.log("User doc data:", userDoc.data());
        console.log("email checked:", normalizedEmail);
      } catch (firestoreError) {
        console.warn("Failed to read users collection", firestoreError);
      }

      if (!shouldGoToExistingPassword) {
        try {
          const methods = await fetchSignInMethodsForEmail(
            auth,
            normalizedEmail,
          );
          shouldGoToExistingPassword = methods.length > 0;
        } catch (authError) {
          console.warn("Fallback method lookup failed", authError);
        }
      }

      moveToPasswordStage(
        shouldGoToExistingPassword ? "existingPassword" : "createPassword",
      );
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    if (!password || !confirmPassword) {
      return;
    }
    if (password !== confirmPassword) {
      setError("Password Not Match");
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const credential = await createUserWithEmailAndPassword(
        auth,
        normalizedEmail,
        password,
      );

      try {
        await sendEmailVerification(credential.user);
      } catch (verificationError) {
        console.warn("Failed to send verification email", verificationError);
      }

      try {
        await setDoc(
          doc(db, "users", normalizedEmail),
          {
            uid: credential.user.uid,
            email: normalizedEmail,
            createdAt: serverTimestamp(),
          },
          { merge: true },
        );
      } catch (firestoreError) {
        console.warn("Failed to persist user record", firestoreError);
      }

      moveToPasswordStage("existingPassword");
      router.push("/verification");
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleExistingSignIn = async () => {
    if (!password) {
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const credential = await signInWithEmailAndPassword(
        auth,
        normalizedEmail,
        password,
      );

      try {
        await credential.user.reload();
      } catch (reloadError) {
        console.warn("Failed to refresh auth user", reloadError);
      }

      try {
        await setDoc(
          doc(db, "users", normalizedEmail),
          {
            uid: credential.user.uid,
            email: normalizedEmail,
            lastSignInAt: serverTimestamp(),
          },
          { merge: true },
        );
      } catch (firestoreError) {
        console.warn("Failed to update user record after sign in", firestoreError);
      }

      if (credential.user.emailVerified) {
        router.replace("/(tabs)/home");
      } else {
        router.replace("/verification");
      }
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handlePrimaryAction = async () => {
    if (loading) {
      return;
    }
    if (stage === "email") {
      await handleIdentifyAccount();
      return;
    }
    if (stage === "createPassword") {
      await handleCreateAccount();
      return;
    }
    await handleExistingSignIn();
  };

  const handleForgotPassword = async () => {
    if (loading) {
      return;
    }
    if (!trimmedEmail) {
      setError("Enter your email first");
      setStage("email");
      return;
    }
    if (!isEmailValid) {
      setError("Please enter a valid email");
      setStage("email");
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await sendPasswordResetEmail(auth, normalizedEmail);
      setMessage("Password reset email sent");
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const isCreateStage = stage === "createPassword";
  const isLoginStage = stage === "existingPassword";
  const showForgotPassword = isLoginStage;
  const isPasswordMismatch = error === "Password Not Match";

  const emailStatus =
    error && stage === "email" ? ("error" as const) : ("default" as const);
  const passwordStatus =
    error && stage !== "email" ? ("error" as const) : ("default" as const);

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
              placeholder="Email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (stage !== "email") {
                  setStage("email");
                  resetPasswordFields();
                }
                setError(null);
                setMessage(null);
              }}
              status={emailStatus}
              containerStyle={styles.inputSpacing}
              iconName="mail-outline"
              keyboardType="email-address"
              textContentType="emailAddress"
              autoCapitalize="none"
            />

            {stage !== "email" && (
              <>
                <CustomInput
                  placeholder="Password"
                  secureTextEntry
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (error) {
                      setError(null);
                    }
                    if (message) {
                      setMessage(null);
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
                      if (message) {
                        setMessage(null);
                      }
                    }}
                    status={passwordStatus}
                    containerStyle={styles.inputSpacing}
                    iconName="lock-closed-outline"
                    textContentType="password"
                  />
                )}
                {error && <Text style={styles.errorText}>{error}</Text>}
                {message && <Text style={styles.infoText}>{message}</Text>}
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
                      <TouchableOpacity onPress={handleForgotPassword}>
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
  infoText: {
    marginTop: 12,
    color: "#4CD964",
    fontSize: 16,
  },
  link: {
    marginTop: 16,
    fontSize: 16,
    color: "#FFFFFF",
    textDecorationLine: "underline",
  },
});
