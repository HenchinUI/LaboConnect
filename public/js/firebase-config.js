// Firebase Configuration for LaboConnect
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyD-M0zR5YxMhv5TlWLmmqdQuSnSuLx2Hyk",
  authDomain: "laboconnect-5dda0.firebaseapp.com",
  projectId: "laboconnect-5dda0",
  storageBucket: "laboconnect-5dda0.firebasestorage.app",
  messagingSenderId: "482508527852",
  appId: "1:482508527852:web:721384b9cd0a85d9b12dc9",
  measurementId: "G-NQ2FX5HB08"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Allow international phone numbers
auth.settings.appVerificationDisabledForTesting = false;

export { auth };
