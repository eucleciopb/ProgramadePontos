// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBoEFGxMUgb-MUbWpNzRbUEpEQDXes4wcc",
  authDomain: "programa-de-pontos-nh.firebaseapp.com",
  projectId: "programa-de-pontos-nh",
  storageBucket: "programa-de-pontos-nh.firebasestorage.app",
  messagingSenderId: "136030554657",
  appId: "1:136030554657:web:9bc5561eddc658ab087160"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);