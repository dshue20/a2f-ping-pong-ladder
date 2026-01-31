// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAFApBh1bXAByvMpzktUu17F6uyis6HYoQ",
  authDomain: "ping-pong-ladder-fa1bc.firebaseapp.com",
  projectId: "ping-pong-ladder-fa1bc",
  storageBucket: "ping-pong-ladder-fa1bc.firebasestorage.app",
  messagingSenderId: "1072641443184",
  appId: "1:1072641443184:web:57df4b5daee1111f107bb5",
  measurementId: "G-E9FJ3WJ19N",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
