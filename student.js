import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getFirestore, collection, query, where, getDocs, addDoc, setDoc, doc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDup2zZ06JLmQCHPc8zGbetLUsXMjX3mjw",
    authDomain: "eduguard-ai-2742b.firebaseapp.com",
    projectId: "eduguard-ai-2742b",
    storageBucket: "eduguard-ai-2742b.firebasestorage.app",
    messagingSenderId: "96233022148",
    appId: "1:96233022148:web:1f903d72b3f79690409f91"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Pemboleh ubah global untuk simpan data pelajar yang sedang log masuk
let activeStudent = null;

// --- 1. FUNGSI PENGESAHAN (LOGIN) ---
window.verifyStudent = async function() {
    const id = document.getElementById('verifyID').value.trim();
    if(!id) return alert("Sila masukkan ID Pelajar!");

    try {
        // Cari dalam 'students' untuk profil, atau terus ke 'course_registrations'
        const q = query(collection(db, "course_registrations"), where("studentID", "==", id));
        const snap = await getDocs(q);

        if(snap.empty) {
            alert("ID Pelajar tidak dijumpai! Pastikan anda telah mendaftar.");
            return;
        }

        // Ambil data dari dokumen pertama yang dijumpai
        activeStudent = snap.docs[0].data();

        // Paparkan UI Portal
        document.getElementById('verifySection').classList.add('d-none');
        document.getElementById('mainPortal').classList.remove('d-none');
        
        // Kemaskini Header
        document.getElementById('userDisplayName').innerText = activeStudent.studentName;
        document.getElementById('userDisplayID').innerText = activeStudent.studentID;
        document.getElementById('userDisplaySV').innerText = activeStudent.supervisorEmail;

        // Load data sampingan
        loadResults(id);
        fetchSVForRegistration();
    } catch (e) {
        console.error(e);
        alert("Ralat sistem semasa pengesahan.");
    }
}

// --- 2. FUNGSI LOAD KEPUTUSAN MARKAH ---
async function loadResults(id) {
    const list = document.getElementById('resultsList');
    list.innerHTML = `<p class="text-center text-muted small">Memuatkan markah...</p>`;
    
    try {
        const q = query(collection(db, "course_registrations"), where("studentID", "==", id));
        const snap = await getDocs(q);
        
        list.innerHTML = ""; // Kosongkan loader

        snap.forEach(doc => {
            const data = doc.data();
            let gradeClass = 'bg-light text-dark'; 
            if (data.grade === 'A' || data.grade === 'A-') gradeClass = 'bg-grade-a';
            if (data.grade === 'G' || data.grade === 'F') gradeClass = 'bg-grade-g';

            list.innerHTML += `
                <div class="card portal-card mb-3 border-start border-4 ${data.status === 'High Risk' ? 'border-danger' : 'border-success'}">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="fw-bold mb-1">${data.course}</h6>
                            <p class="small text-muted mb-2">Semester: ${data.semester || 'N/A'}</p>
                            <div class="d-flex gap-3 small text-muted">
                                <span>Quiz: ${data.quiz || 0}%</span>
                                <span>Test: ${data.test || 0}%</span>
                                <span>Mid: ${data.midterm || 0}%</span>
                            </div>
                        </div>
                        <div class="grade-circle ${gradeClass} shadow-sm">${data.grade || '-'}</div>
                    </div>
                </div>`;
        });
    } catch (e) {
        list.innerHTML = `<p class="text-danger">Gagal memuatkan maklumat.</p>`;
    }
}

// --- 3. FUNGSI LOAD SENARAI SV (UNTUK TAB DAFTAR) ---
async function fetchSVForRegistration() {
    const svSelect = document.getElementById('newSupervisor');
    if (!svSelect) return;

    try {
        const q = query(collection(db, "users"), where("role", "==", "supervisor"));
        const snap = await getDocs(q);
        svSelect.innerHTML = '<option value="">-- Pilih Supervisor --</option>';
        snap.forEach(doc => {
            const sv = doc.data();
            svSelect.innerHTML += `<option value="${sv.email}">${sv.name}</option>`;
        });
    } catch (e) {
        svSelect.innerHTML = '<option value="">Gagal muat senarai SV</option>';
    }
}

// --- 4. FUNGSI DAFTAR KURSUS BARU ---
window.registerNewCourse = async function() {
    if(!activeStudent) return alert("Sila log masuk semula.");

    const course = document.getElementById('newCourse').value;
    const sem = document.getElementById('newSemester').value;
    const svEmail = document.getElementById('newSupervisor').value;

    if(!svEmail) return alert("Sila pilih Supervisor!");

    const regID = `${activeStudent.studentID}_${course.replace(/\s+/g, '')}_${sem.replace(/\s+/g, '')}`;

    try {
        await setDoc(doc(db, "course_registrations", regID), {
            studentID: activeStudent.studentID,
            studentName: activeStudent.studentName,
            course: course,
            semester: sem,
            supervisorEmail: svEmail,
            quiz: 0, test: 0, midterm: 0,
            grade: "-",
            status: "Normal",
            timestamp: serverTimestamp()
        });

        alert(`✅ Berjaya mendaftar: ${course}`);
        loadResults(activeStudent.studentID);
        
        // Switch balik ke tab keputusan
        const resultsTab = new bootstrap.Tab(document.querySelector('[data-bs-target="#content-results"]'));
        resultsTab.show();
    } catch (e) {
        alert("Gagal mendaftar kursus baru.");
    }
}

// --- 5. FUNGSI PENILAIAN KENDIRI (STRESS/LOAD) ---
window.submitAssessment = async function() {
    if(!activeStudent) return alert("Sila log masuk semula.");

    const s = parseInt(document.getElementById('stress').value);
    const l = parseInt(document.getElementById('load').value);
    
    try {
        await addDoc(collection(db, "assessments"), {
            studentID: activeStudent.studentID,
            studentName: activeStudent.studentName,
            course: activeStudent.course, 
            supervisorEmail: activeStudent.supervisorEmail,
            stress: s,
            load: l,
            timestamp: serverTimestamp(),
            risk: (s >= 4 || l >= 4) ? "HIGH" : "LOW"
        });
        alert("Terima kasih! Penilaian anda telah dihantar kepada SV.");
    } catch (e) {
        alert("Gagal menghantar penilaian.");
    }
};

// Listener untuk key Enter pada kotak carian ID
document.getElementById('verifyID').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') window.verifyStudent();
});