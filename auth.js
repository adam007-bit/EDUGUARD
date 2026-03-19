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

// --- 1. AMBIL SENARAI SUPERVISOR ---
async function loadSupervisors() {
    const svSelect = document.getElementById('supervisorSelect');
    if (!svSelect) return;

    try {
        // Tarik semua user yang mempunyai role 'supervisor'
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
    } catch (error) {
        console.error("Ralat load supervisor:", error);
    }
}

// --- 2. UI SWITCH ROLE ---
window.switchRole = function(role) {
    currentRole = role;
    const nameField = document.getElementById('nameField');
    const courseField = document.getElementById('courseField');
    const supervisorField = document.getElementById('supervisorField');
    const authTitle = document.getElementById('authTitle');
    const authBtn = document.getElementById('authBtn');
    const passLabel = document.getElementById('passLabel');

    document.querySelectorAll('.btn-outline-primary').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`btn-${role}`).classList.add('active');

    // Paparan Field
    nameField.style.display = isLoginMode ? "none" : "block";
    courseField.style.display = (role === 'student' && !isLoginMode) ? "block" : "none";
    
    // Logik Papar Dropdown Supervisor
    if (supervisorField) {
        if (role === 'student' && !isLoginMode) {
            supervisorField.style.display = "block";
            loadSupervisors();
        } else {
            supervisorField.style.display = "none";
        }
    }

    if (role === 'student') {
        authTitle.innerText = isLoginMode ? "Semak Keputusan Pelajar" : "Pendaftaran Subjek Baru";
        passLabel.innerText = "ID Pelajar";
        authBtn.innerText = isLoginMode ? "Semak Keputusan" : "Daftar Subjek";
    } else {
        const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
        authTitle.innerText = isLoginMode ? `Log Masuk ${roleLabel}` : `Daftar ${roleLabel} Baru`;
        passLabel.innerText = "Kata Laluan";
        authBtn.innerText = isLoginMode ? "Log Masuk" : "Daftar Akaun";
    }
};

// --- 3. SUBMIT FORM ---
document.getElementById('authForm').onsubmit = async function(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value; // ID Pelajar jika role=student
    const fullName = document.getElementById('fullName').value;

    // A. LOGIK STUDENT
    if (currentRole === 'student') {
        if (!isLoginMode) {
            const studentCourse = document.getElementById('courseSelect').value;
            const selectedSVEmail = document.getElementById('supervisorSelect').value;

            if(!studentCourse || !selectedSVEmail) return alert("Sila pilih kursus dan supervisor!");
            
            try {
                // Simpan profil
                await setDoc(doc(db, "students", password), {
                    name: fullName, id: password, studentEmail: email
                }, { merge: true });

                // Simpan Pendaftaran (Auto-Connect ke SV)
                const regID = `${password}_${studentCourse.replace(/\s+/g, '')}`;
                await setDoc(doc(db, "course_registrations", regID), {
                    studentID: password,
                    studentName: fullName,
                    course: studentCourse,
                    supervisorEmail: selectedSVEmail,
                    quiz: 0, test: 0, midterm: 0,
                    grade: "-", status: "Pending",
                    timestamp: new Date()
                });

                alert(`✅ Berjaya mendaftar ${studentCourse}!`);
                document.getElementById('courseSelect').value = "";
            } catch (err) { alert("Ralat: " + err.message); }
        } else {
            // Check ID Pelajar
            localStorage.setItem("currentStudentID", password);
            window.location.href = "student-view.html";
        }
        return;
    }

    // B. LOGIK SUPERVISOR & HOST
    try {
        if (isLoginMode) {
            const userCred = await signInWithEmailAndPassword(auth, email, password);
            const userDoc = await getDoc(doc(db, "users", userCred.user.uid));
            if (userDoc.exists() && userDoc.data().role === currentRole) {
                window.location.href = (currentRole === 'host') ? "host.html" : "dashboard.html";
            } else {
                alert("Peranan tidak padan!");
                await auth.signOut();
            }
        } else {
            const userCred = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(userCred.user, { displayName: fullName });
            await setDoc(doc(db, "users", userCred.user.uid), {
                name: fullName, email: email, role: currentRole
            });
            window.location.href = (currentRole === 'host') ? "host.html" : "dashboard.html";
        }
    } catch (error) { alert("Ralat: " + error.message); }
};

// --- 4. TOGGLE DAFTAR/LOGIN ---
document.getElementById('toggleAuth').onclick = function(e) {
    e.preventDefault();
    isLoginMode = !isLoginMode;
    document.getElementById('toggleText').innerText = isLoginMode ? "Belum ada akaun?" : "Sudah ada akaun?";
    document.getElementById('toggleAuth').innerText = isLoginMode ? "Daftar Sini" : "Log Masuk Sini";
    switchRole(currentRole);
};