import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  type User,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

type AuthSuccess =
  | { success: true; user: User; action: "signin" }
  | { success: true; user: User; action: "signup" };

type AuthError = { success: false; error: string; code?: string };

type AuthResult = AuthSuccess | AuthError;

export const authenticateUser = async (
  email: string,
  password: string,
): Promise<AuthResult> => {
  try {
    // Attempt to sign in first; if the account does not exist fall back to creating one.
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      await AsyncStorage.setItem("userEmail", email);
      try {
        await setDoc(
          doc(db, "users", email.toLowerCase()),
          { uid: credential.user.uid, email: email.toLowerCase(), lastSignInAt: serverTimestamp() },
          { merge: true },
        );
      } catch (firestoreError) {
        console.warn("Failed to update user record after service sign-in", firestoreError);
      }
      return {
        success: true,
        user: credential.user,
        action: "signin",
      };
    } catch (error: any) {
      if (error?.code !== "auth/user-not-found") {
        throw error;
      }
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(credential.user);
      await AsyncStorage.setItem("userEmail", email);
      try {
        await setDoc(
          doc(db, "users", email.toLowerCase()),
          {
            uid: credential.user.uid,
            email: email.toLowerCase(),
            createdAt: serverTimestamp(),
          },
          { merge: true },
        );
      } catch (firestoreError) {
        console.warn("Failed to persist user record after service sign-up", firestoreError);
      }
      return {
        success: true,
        user: credential.user,
        action: "signup",
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error?.message ?? "Authentication failed",
      code: error?.code,
    };
  }
};

export const resendVerificationEmail = async () => {
  const user = auth.currentUser;
  if (!user) {
    return {
      success: false,
      error: "No authenticated user available.",
    };
  }

  try {
    await user.reload();
  } catch (reloadError) {
    console.warn(
      "Failed to refresh auth user before resending verification",
      reloadError,
    );
  }

  if (user.emailVerified) {
    return {
      success: false,
      error: "Email is already verified.",
    };
  }

  try {
    await sendEmailVerification(user);
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message ?? "Unable to resend verification email.",
    };
  }
};
