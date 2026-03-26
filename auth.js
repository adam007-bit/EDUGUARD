import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

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

// --- 1. LOAD SUPERVISOR ---
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

// --- 2. DYNAMIC COURSE ROWS ---
window.addCourseRow = function() {
    const container = document.getElementById('courseListContainer');
    const newRow = document.createElement('div');
    newRow.className = 'row g-2 mb-2 course-row';
    newRow.innerHTML = `
        <div class="col-5"><input type="text" class="form-control form-control-sm course-name" placeholder="Nama Kursus"></div>
        <div class="col-4"><input type="text" class="form-control form-control-sm course-code" placeholder="Kod"></div>
        <div class="col-3">
            <div class="input-group input-group-sm">
                <input type="number" class="form-control course-credit" placeholder="Kredit">
                <button class="btn btn-outline-danger" type="button" onclick="this.closest('.course-row').remove()">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        </div>
    `;
    container.appendChild(newRow);
};

// --- 3. UI SWITCHING ---
window.switchRole = function(role) {
    currentRole = role;
    const nameField = document.getElementById('nameField');
    const academicSection = document.getElementById('academicSection');
    const authTitle = document.getElementById('authTitle');
    const authBtn = document.getElementById('authBtn');
    const passLabel = document.getElementById('passLabel');
    const passHint = document.getElementById('passHint');

    document.querySelectorAll('.btn-outline-primary').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`btn-${role}`).classList.add('active');

    nameField.style.display = isLoginMode ? "none" : "block";
    
    // Tunjuk Academic Section hanya untuk Student & Register Mode
    if (role === 'student' && !isLoginMode) {
        academicSection.style.display = "block";
        loadSupervisors();
    } else {
        academicSection.style.display = "none";
    }

    if (role === 'student') {
        authTitle.innerText = isLoginMode ? "Semak Keputusan Pelajar" : "Pendaftaran Pelajar Baru";
        passLabel.innerText = "ID Pelajar";
        authBtn.innerText = isLoginMode ? "Semak Keputusan" : "Daftar & Simpan";
        if (passHint) passHint.style.display = isLoginMode ? "none" : "block";
    } else {
        const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
        authTitle.innerText = isLoginMode ? `Log Masuk ${roleLabel}` : `Daftar ${roleLabel}`;
        passLabel.innerText = "Kata Laluan";
        authBtn.innerText = isLoginMode ? "Log Masuk" : "Daftar Akaun";
        if (passHint) passHint.style.display = "none";
    }
};

// --- 4. SUBMIT LOGIC ---
document.getElementById('authForm').onsubmit = async function(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value; 
    const fullName = document.getElementById('fullName').value;

    if (currentRole === 'student') {
        if (!isLoginMode) {
            const program = document.getElementById('programInput').value;
            const year = document.getElementById('yearSelect').value;
            const semester = document.getElementById('semesterSelect').value;
            const svEmail = document.getElementById('supervisorSelect').value;
            
            const courseRows = document.querySelectorAll('.course-row');
            let coursesData = [];
            courseRows.forEach(row => {
                const name = row.querySelector('.course-name').value;
                const code = row.querySelector('.course-code').value;
                const credit = row.querySelector('.course-credit').value;
                if(name && code) coursesData.push({ name, code, credit });
            });

            if(!svEmail || coursesData.length === 0) return alert("Sila pilih Supervisor dan masukkan kursus!");

            try {
                // Simpan Profil
                await setDoc(doc(db, "students", password), {
                    name: fullName, id: password, studentEmail: email, program: program, role: "student"
                }, { merge: true });

                // Simpan Setiap Kursus
                for (const course of coursesData) {
                    const regID = `${password}_${course.code.replace(/\s+/g, '')}_Sem${semester}`;
                    await setDoc(doc(db, "course_registrations", regID), {
                        studentID: password,
                        studentName: fullName,
                        program: program,
                        year: year,
                        semester: `Semester ${semester}`,
                        course: course.name,
                        courseCode: course.code,
                        creditHours: course.credit,
                        supervisorEmail: svEmail,
                        quiz: 0, test: 0, midterm: 0,
                        grade: "-", status: "Pending",
                        timestamp: serverTimestamp()
                    });
                }
                alert("✅ Pendaftaran Berjaya!");
                location.reload(); 
            } catch (err) { alert("Ralat: " + err.message); }
        } else {
            localStorage.setItem("currentStudentID", password);
            window.location.href = "student-view.html";
        }
        return;
    }

    // Logik Supervisor/Host
    try {
        if (isLoginMode) {
            const userCred = await signInWithEmailAndPassword(auth, email, password);
            const userDoc = await getDoc(doc(db, "users", userCred.user.uid));
            if (userDoc.exists() && userDoc.data().role === currentRole) {
                window.location.href = (currentRole === 'host') ? "host.html" : "dashboard.html";
            } else {
                alert("Peranan tidak sah!");
                await auth.signOut();
            }
        } else {
            const userCred = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(userCred.user, { displayName: fullName });
            await setDoc(doc(db, "users", userCred.user.uid), {
                name: fullName, email: email, role: currentRole, uid: userCred.user.uid
            });
            window.location.href = (currentRole === 'host') ? "host.html" : "dashboard.html";
        }
    } catch (error) { alert("Ralat: " + error.message); }
};

// --- 5. TOGGLE & INIT ---
document.getElementById('toggleAuth').onclick = function(e) {
    e.preventDefault();
    isLoginMode = !isLoginMode;
    document.getElementById('toggleText').innerText = isLoginMode ? "Belum ada akaun?" : "Sudah ada akaun?";
    document.getElementById('toggleAuth').innerText = isLoginMode ? "Daftar Sini" : "Log Masuk Sini";
    window.switchRole(currentRole);
};

const togglePassBtn = document.getElementById('togglePassword');
if (togglePassBtn) {
    togglePassBtn.onclick = function() {
        const passInput = document.getElementById('password');
        const isPass = passInput.type === "password";
        passInput.type = isPass ? "text" : "password";
        this.innerHTML = isPass ? '<i class="bi bi-eye-slash"></i>' : '<i class="bi bi-eye"></i>';
    };
}

window.switchRole('supervisor');
