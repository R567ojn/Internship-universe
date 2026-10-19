/* ============================================================
   FIREBASE INIT · Cloud Firestore project: interpro-6f20c
   Retained from the working build. Do NOT replace with invented
   values. Compat SDK is loaded before this file via CDN.
   ============================================================ */

const firebaseConfig = {
  apiKey: "AIzaSyANDOKLaxq85j3FIrOgvquJ2Xayie0C_Yc",
  authDomain: "internship-274f9.firebaseapp.com",
  projectId: "internship-274f9",
  storageBucket: "internship-274f9.firebasestorage.app",
  messagingSenderId: "604637845238",
  appId: "1:604637845238:web:69b96b6a47cd8eaed1fed7",
  measurementId: "G-PV09MLBH71"
};

firebase.initializeApp(firebaseConfig);

const firebaseAuth = firebase.auth();
const firebaseDB = firebase.firestore();

// FieldValue / serverTimestamp shortcuts used across services.
const FV = firebase.firestore.FieldValue;
const serverTs = () => firebase.firestore.FieldValue.serverTimestamp();
