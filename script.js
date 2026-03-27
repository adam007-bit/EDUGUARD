// Anda perlu dapatkan config ini dari Firebase Console (Firebase Settings)
const firebaseConfig = {
  apiKey: "AIzaSyDup2zZ06JLmQCHPc8zGbetLUsXMjX3mjw",
  authDomain: "eduguard-ai-2742b.firebaseapp.com",
  projectId: "eduguard-ai-2742b",
  storageBucket: "eduguard-ai-2742b.firebasestorage.app",
  messagingSenderId: "96233022148",
  appId: "1:96233022148:web:1f903d72b3f79690409f91"
};

// Import Firebase functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

let isLoginMode = true;

// Tukar antara Login dan Register
document.getElementById('toggleAuth').addEventListener('click', (e) => {
    e.preventDefault();
    isLoginMode = !isLoginMode;
    document.getElementById('authTitle').innerText = isLoginMode ? "Log Masuk Supervisor" : "Daftar Supervisor Baru";
    document.getElementById('authBtn').innerText = isLoginMode ? "Log Masuk" : "Daftar Akaun";
    document.getElementById('toggleText').innerText = isLoginMode ? "Belum ada akaun?" : "Sudah ada akaun?";
});

// Handle Submit
document.getElementById('authForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        if (isLoginMode) {
            // LOG MASUK
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            alert("Selamat Datang!");
            window.location.href = "dashboard.html"; // Pergi ke dashboard anda
        } else {
            // DAFTAR BARU
            await createUserWithEmailAndPassword(auth, email, password);
            alert("Akaun berjaya dicipta! Sila log masuk.");
            location.reload();
        }
    } catch (error) {
        alert("Ralat: " + error.message);
    }
});
