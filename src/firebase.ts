// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

// --- PASTE YOUR CONFIG HERE ---
const firebaseConfig = {
  apiKey: "AIzaSyCWkeCymaMM4OB5zwuCnhQAC-FRmUg4HFY",
  authDomain: "sampleims-7b034.firebaseapp.com",
  projectId: "sampleims-7b034",
  storageBucket: "sampleims-7b034.firebasestorage.app",
  messagingSenderId: "645595361934",
  appId: "1:645595361934:web:ce747dda6fb461396b0fdf"
};

// 1. Initialize Firebase
const app = initializeApp(firebaseConfig);

// 2. Export the Database
export const db = getFirestore(app);

// 3. Enable Offline Persistence (The "Resilience Feature")
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code == 'failed-precondition') {
    console.log('Persistence failed: Multiple tabs open.');
  } else if (err.code == 'unimplemented') {
    console.log('Persistence not supported by browser.');
  }
});