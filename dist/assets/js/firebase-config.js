/* ============================================================
   FIREBASE INIT · Cloud Firestore project: interpro-6f20c
   Retained from the working build. Do NOT replace with invented
   values. Compat SDK is loaded before this file via CDN.
   ============================================================ */

const firebaseConfig = {
  apiKey: "AIzaSyC5udblwPcVN8-dISSUpBWkEOOmHniMIH4",
  authDomain: "interpro-6f20c.firebaseapp.com",
  projectId: "interpro-6f20c",
  storageBucket: "interpro-6f20c.firebasestorage.app",
  messagingSenderId: "878927958683",
  appId: "1:878927958683:web:dce4991ff044a8bf532c3e"
};

firebase.initializeApp(firebaseConfig);

const firebaseAuth = firebase.auth();
const firebaseDB = firebase.firestore();

// FieldValue / serverTimestamp shortcuts used across services.
const FV = firebase.firestore.FieldValue;
const serverTs = () => firebase.firestore.FieldValue.serverTimestamp();
