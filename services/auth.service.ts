import { auth } from '@/firebase/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    createUserWithEmailAndPassword,
    sendEmailVerification,
    sendPasswordResetEmail,
    signInWithEmailAndPassword
} from 'firebase/auth';

export const authenticateUser = async (email: string, password: string) => {
  try {
    // พยายาม sign in ก่อน
    try {
      const signInResult = await signInWithEmailAndPassword(auth, email, password);
      await AsyncStorage.setItem('userEmail', email);
      return {
        success: true,
        user: signInResult.user,
        action: 'signin'
      };
    } catch (error: any) {
      // ถ้า user ไม่มีในระบบ ให้ทำการ sign up
      if (error.code === 'auth/user-not-found') {
        const signUpResult = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(signUpResult.user);
        await AsyncStorage.setItem('userEmail', email);
        return {
          success: true,
          user: signUpResult.user,
          action: 'signup'
        };
      }
      throw error;
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      code: error.code
    };
  }
};

export const resendVerificationEmail = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
};