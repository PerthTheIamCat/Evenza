// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDdDzH6l3Y5uwYC_0gX5gbBPLW4wSLMP9s",
  authDomain: "eventza-2b9c0.firebaseapp.com",
  projectId: "eventza-2b9c0",
  storageBucket: "eventza-2b9c0.firebasestorage.app",
  messagingSenderId: "937347399961",
  appId: "1:937347399961:web:230bf17c7901335a138588",
  measurementId: "G-PVW87TQDWP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);