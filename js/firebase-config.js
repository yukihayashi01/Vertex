// js/firebase-config.js

// TODO: Replace the following with your app's Firebase project configuration
// You can find this in the Firebase Console -> Project Settings -> General -> Your Apps
const firebaseConfig = {
    apiKey: "AIzaSyDjvcti-iJgcnnjYjdPrboyj2GbblCqvus",
    authDomain: "portfolio-f61f8.firebaseapp.com",
    projectId: "portfolio-f61f8",
    storageBucket: "portfolio-f61f8.firebasestorage.app",
    messagingSenderId: "465423289330",
    appId: "1:465423289330:web:3e635c861bd5800e2cb96b",
    measurementId: "G-BWTP7SPBMX"
};

// Initialize Firebase
// Make sure to include the Firebase SDKs in your HTML before this file!
// e.g. <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
//      <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js"></script>
//      <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js"></script>

const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
