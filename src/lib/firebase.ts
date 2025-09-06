import { initializeApp, getApp, getApps } from 'firebase/app';

const firebaseConfig = {
  projectId: "rakshitai",
  appId: "1:324157262921:web:17f350319fcae648280398",
  storageBucket: "rakshitai.firebasestorage.app",
  apiKey: "AIzaSyBxjz5O_H5vdXL3Hs7H1PKz3Qz8QBfWNA4",
  authDomain: "rakshitai.firebaseapp.com",
  measurementId: "",
  messagingSenderId: "324157262921"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export { app };
