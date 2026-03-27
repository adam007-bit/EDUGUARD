import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDup2zZ06JLmQCHPc8zGbetLUsXMjX3mjw",
    authDomain: "eduguard-ai-2742b.firebaseapp.com",
    projectId: "eduguard-ai-2742b",
    storageBucket: "eduguard-ai-2742b.firebasestorage.app",
    messagingSenderId: "96233022148",
    appId: "1:96233022148:web:1f903d72b3f79690409f91"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentRole = 'supervisor';
let isLoginMode = true;

// --- FUNGSI SEMAK PENDAFTARAN (SUPERVISOR/HOST) ---
async function checkIfUserExists(email, role) {
    const q = query(collection(db, "users"), where("email", "==", email), where("role", "==", role));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
}

// --- PHASE 1: LOAD SUPERVISOR ---
async function loadSupervisors() {
    const svSelect = document.getElementById('supervisorSelect');
    if (!svSelect) return;
    try {
        const q = query(collection(db, "users"), where("role", "==", "supervisor"));
        const querySnapshot = await getDocs(q);
        svSelect.innerHTML = '<option value="">-- Pilih Supervisor --</option>';
        querySnapshot.forEach((doc) => {
            const sv = doc.data();
            const option = document.createElement('option');
            option.value = sv.email; 
            option.text = sv.name;   
            svSelect.appendChild(option);
        });
    } catch (error) { console.error("Ralat load supervisor:", error); }
}

// --- PHASE 2: UI SWITCHING ---
window.switchRole = function(role) {
    currentRole = role;
    const nameField = document.getElementById('nameField');
    const authTitle = document.getElementById('authTitle');
    const authBtn = document.getElementById('authBtn');
    const passLabel = document.getElementById('passLabel');
    const passHint = document.getElementById('passHint');

    document.querySelectorAll('.role-selector .btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`btn-${role}`).classList.add('active');

    nameField.style.display = isLoginMode ? "none" : "block";
    
    if (role === 'student') {
        authTitle.innerText = isLoginMode ? "Semak Keputusan Pelajar" : "Daftar Profil Pelajar";
        passLabel.innerText = "ID Pelajar";
        authBtn.innerText = isLoginMode ? "Semak Keputusan" : "Daftar & Teruskan";
        if (passHint) passHint.style.display = isLoginMode ? "none" : "block";
    } else {
        const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
        authTitle.innerText = isLoginMode ? `Log Masuk ${roleLabel}` : `Daftar ${roleLabel} Baru`;
        passLabel.innerText = "Kata Laluan";
        authBtn.innerText = isLoginMode ? "Log Masuk" : "Daftar Akaun";
        if (passHint) passHint.style.display = "none";
    }
};

// --- PHASE 3: SUBMIT LOGIC ---
document.getElementById('authForm').onsubmit = async function(e) {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value; 
    const fullName = document.getElementById('fullName').value.trim();

    // --- LOGIK PELAJAR ---
    if (currentRole === 'student') {
        if (!isLoginMode) {
            // DAFTAR PROFIL ASAS
            if(!fullName || !password) return alert("Sila masukkan Nama dan ID!");
            try {
                await setDoc(doc(db, "students", password), {
                    name: fullName,
                    id: password,
                    studentEmail: email,
                    registrationStatus: "pending_course" 
                }, { merge: true });

                localStorage.setItem("tempStudentID", password);
                localStorage.setItem("tempStudentName", fullName);

                alert("Profil disimpan! Sila lengkapkan pendaftaran kursus.");
                window.location.href = "register_course.html";
            } catch (err) { alert(err.message); }
        } else {
            // LOG MASUK / SEMAK ID
            try {
                const studentDoc = await getDoc(doc(db, "students", password));
                if (studentDoc.exists()) {
                    const data = studentDoc.data();
                    if(data.registrationStatus === "pending_course") {
                        localStorage.setItem("tempStudentID", password);
                        localStorage.setItem("tempStudentName", data.name);
                        window.location.href = "register_course.html";
                    } else {
                        localStorage.setItem("currentStudentID", password);
                        localStorage.setItem("currentStudentName", data.name);
                        window.location.href = "student-view.html";
                    }
                } else {
                    alert("ID Pelajar tidak dijumpai! Sila daftar profil dahulu.");
                }
            } catch (err) { alert(err.message); }
        }
        return; // Keluar dari function onsubmit untuk role student
    }

    // --- LOGIK SUPERVISOR / HOST ---
    try {
        if (isLoginMode) {
            const exists = await checkIfUserExists(email, currentRole);
            if (!exists) return alert(`Akaun ${currentRole} tidak dijumpai.`);

            await signInWithEmailAndPassword(auth, email, password);
            window.location.href = (currentRole === 'host') ? "host.html" : "dashboard.html";
        } else {
            const userCred = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(userCred.user, { displayName: fullName });
            await setDoc(doc(db, "users", userCred.user.uid), {
                name: fullName, email: email, role: currentRole, uid: userCred.user.uid
            });
            window.location.href = (currentRole === 'host') ? "host.html" : "dashboard.html";
        }
    } catch (error) { 
        alert("Ralat: " + error.message);
    }
};

// --- PHASE 4: UTILITIES ---
document.getElementById('toggleAuth').onclick = function(e) {
    e.preventDefault();
    isLoginMode = !isLoginMode;
    document.getElementById('toggleText').innerText = isLoginMode ? "Belum ada akaun?" : "Sudah ada akaun?";
    document.getElementById('toggleAuth').innerText = isLoginMode ? "Daftar Sini" : "Log Masuk Sini";
    window.switchRole(currentRole);
};

// Set default role
window.onload = () => window.switchRole('supervisor');