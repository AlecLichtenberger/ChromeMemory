// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB8YNDT-w7vzz7D9xcFHlwwCGVkSB-N6fs",
  authDomain: "chrome-memory-366cc.firebaseapp.com",
  projectId: "chrome-memory-366cc",
  storageBucket: "chrome-memory-366cc.firebasestorage.app",
  messagingSenderId: "352673548223",
  appId: "1:352673548223:web:3d4d1f913d5d3ba015830a",
  measurementId: "G-ED05S95PK9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
provider.addScope("https://www.googleapis.com/auth/calendar.readonly");

export { auth, provider, signInWithPopup };