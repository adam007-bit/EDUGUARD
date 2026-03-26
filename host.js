import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getFirestore, doc, updateDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDup2zZ06JLmQCHPc8zGbetLUsXMjX3mjw",
    authDomain: "eduguard-ai-2742b.firebaseapp.com",
    projectId: "eduguard-ai-2742b",
    storageBucket: "eduguard-ai-2742b.firebasestorage.app",
    messagingSenderId: "96233022148",
    appId: "1:96233022148:web:1f903d72b3f79690409f91"
};

const app = initializeApp(firebaseConfig);import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getFirestore, doc, updateDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

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

let currentEditDocId = null;

// --- 1. FUNGSI CARI PELAJAR + INFO AKADEMIK (PROG/THN/SEM) ---
window.searchBySubject = async function() {
    const selectedCourse = document.getElementById('searchSubject').value;
    const resultsArea = document.getElementById('searchResults');
    const hostForm = document.getElementById('hostForm');

    if (!selectedCourse) return alert("Sila pilih subjek dahulu!");

    try {
        const q = query(collection(db, "course_registrations"), where("course", "==", selectedCourse));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            resultsArea.innerHTML = `<div class="alert alert-warning">Tiada pelajar berdaftar untuk subjek: ${selectedCourse}</div>`;
            hostForm.style.display = 'none';
            return;
        }

        // --- LOGIK BUANG DUPLIKASI ---
        const uniqueStudents = new Map();
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const studentID = data.studentID;
            if (!uniqueStudents.has(studentID)) {
                uniqueStudents.set(studentID, {
                    docId: docSnap.id,
                    ...data
                });
            }
        });

        let tableHTML = `
            <div class="card p-3 mt-3 shadow-sm border-primary">
                <h5 class="fw-bold mb-3 text-primary"><i class="bi bi-person-badge"></i> Senarai Pelajar: ${selectedCourse}</h5>
                <div class="table-responsive">
                    <table class="table table-hover align-middle">
                        <thead class="table-light">
                            <tr>
                                <th>Nama Pelajar</th>
                                <th>ID Pelajar</th>
                                <th>Info Akademik (Prog/Thn/Sem)</th>
                                <th>Markah (Q/T/M)</th>
                                <th>Gred</th>
                                <th>Tindakan</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        uniqueStudents.forEach((data) => {
            const statusBadge = data.status === 'Marked' ? 'bg-success' : 'bg-secondary';
            const gradeDisplay = data.grade || '-';
            const svEmail = data.supervisorEmail || "";
            
            // Maklumat tambahan dari pendaftaran pelajar
            const progInfo = data.program || "N/A";
            const yearInfo = data.year || "-";
            const semInfo = data.semester || "-";

            tableHTML += `
                <tr>
                    <td>
                        <div class="fw-bold">${data.studentName}</div>
                        <span class="badge ${statusBadge}" style="font-size: 0.7rem;">${data.status || 'Pending'}</span>
                    </td>
                    <td><code>${data.studentID}</code></td>
                    <td>
                        <div class="small fw-bold text-dark">${progInfo}</div>
                        <div class="small text-muted">Tahun ${yearInfo} (${semInfo})</div>
                    </td>
                    <td>${data.quiz || 0} / ${data.test || 0} / ${data.midterm || 0}</td>
                    <td><strong class="text-primary">${gradeDisplay}</strong></td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="prepareEdit('${data.docId}', '${data.studentName}', '${data.course}', ${data.quiz || 0}, ${data.test || 0}, ${data.midterm || 0}, '${svEmail}')">
                            <i class="bi bi-pencil-fill"></i> Isi Markah
                        </button>
                    </td>
                </tr>
            `;
        });

        tableHTML += `</tbody></table></div></div>`;
        resultsArea.innerHTML = tableHTML;
        hostForm.style.display = 'none';

    } catch (err) {
        alert("Ralat Carian: " + err.message);
    }
};

// --- 2. FUNGSI SEDIAKAN BORANG EDIT ---
window.prepareEdit = function(docId, name, course, q, t, m, svEmail) {
    currentEditDocId = docId;
    document.getElementById('studentName').value = name;
    
    const subjectSelect = document.getElementById('subjectSelect');
    subjectSelect.innerHTML = `<option value="${docId}" selected>${course}</option>`;
    
    const svInput = document.getElementById('svEmail');
    svInput.value = svEmail || "Tiada Supervisor"; 

    document.getElementById('quiz').value = q;
    document.getElementById('test').value = t;
    document.getElementById('midterm').value = m;

    document.getElementById('hostForm').style.display = 'block';
    document.getElementById('hostForm').scrollIntoView({ behavior: 'smooth' });
};

// --- 3. FUNGSI SIMPAN KEMASKINI + LOGIK GRED ---
document.getElementById('hostForm').onsubmit = async (e) => {
    e.preventDefault();

    if (!currentEditDocId) return alert("Sila pilih pelajar dari senarai dahulu!");

    const quiz = Number(document.getElementById('quiz').value);
    const test = Number(document.getElementById('test').value);
    const midterm = Number(document.getElementById('midterm').value);
    const svEmail = document.getElementById('svEmail').value;

    // Logik Pengiraan Gred (20% Quiz, 30% Test, 50% Midterm)
    const totalMark = (quiz * 0.2) + (test * 0.3) + (midterm * 0.5); 
    let grade = "";

    if (totalMark >= 80) grade = "A";
    else if (totalMark >= 60) grade = "B";
    else if (totalMark >= 40) grade = "C";
    else grade = "GAGAL";

    try {
        const regRef = doc(db, "course_registrations", currentEditDocId);
        
        await updateDoc(regRef, {
            quiz: quiz,
            test: test,
            midterm: midterm,
            totalMark: totalMark,
            grade: grade,
            supervisorEmail: svEmail,
            lastUpdated: new Date(),
            status: "Marked"
        });

        alert(`Berjaya! Markah dikemaskini. Gred: ${grade}`);
        searchBySubject(); 
        document.getElementById('hostForm').style.display = 'none';
    } catch (error) {
        alert("Ralat simpan: " + error.message);
    }
};
const db = getFirestore(app);

let currentEditDocId = null;
// --- 1. FUNGSI CARI PELAJAR BERDASARKAN SUBJEK (VERSI UNIK) ---
window.searchBySubject = async function() {
    const selectedCourse = document.getElementById('searchSubject').value;
    const resultsArea = document.getElementById('searchResults');
    const hostForm = document.getElementById('hostForm');

    if (!selectedCourse) return alert("Sila pilih subjek dahulu!");

    try {
        const q = query(collection(db, "course_registrations"), where("course", "==", selectedCourse));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            resultsArea.innerHTML = `<div class="alert alert-warning">Tiada pelajar berdaftar untuk subjek: ${selectedCourse}</div>`;
            hostForm.style.display = 'none';
            return;
        }

        // --- LOGIK UNTUK BUANG DUPLIKASI ---
        const uniqueStudents = new Map();

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const studentID = data.studentID;

            // Jika studentID sudah ada, kita simpan yang paling terbaru (atau abaikan)
            // Di sini kita simpan data ke dalam Map menggunakan studentID sebagai 'key'
            if (!uniqueStudents.has(studentID)) {
                uniqueStudents.set(studentID, {
                    docId: docSnap.id,
                    ...data
                });
            }
        });

        let tableHTML = `
            <div class="card p-3 mt-3 shadow-sm border-primary">
                <h5 class="fw-bold mb-3 text-primary"><i class="bi bi-person-badge"></i> Senarai Pelajar: ${selectedCourse}</h5>
                <div class="table-responsive">
                    <table class="table table-hover align-middle">
                        <thead class="table-light">
                            <tr>
                                <th>Nama Pelajar</th>
                                <th>ID Pelajar</th>
                                <th>Markah (Q/T/M)</th>
                                <th>Gred</th>
                                <th>Tindakan</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        // Iterasi menggunakan data unik yang telah ditapis
        uniqueStudents.forEach((data) => {
            const statusBadge = data.status === 'Marked' ? 'bg-success' : 'bg-secondary';
            const gradeDisplay = data.grade || '-';
            const svEmail = data.supervisorEmail || "";

            tableHTML += `
                <tr>
                    <td>
                        <div class="fw-bold">${data.studentName}</div>
                        <span class="badge ${statusBadge}" style="font-size: 0.7rem;">${data.status || 'Pending'}</span>
                    </td>
                    <td><code>${data.studentID}</code></td>
                    <td>${data.quiz || 0} / ${data.test || 0} / ${data.midterm || 0}</td>
                    <td><strong class="text-primary">${gradeDisplay}</strong></td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="prepareEdit('${data.docId}', '${data.studentName}', '${data.course}', ${data.quiz || 0}, ${data.test || 0}, ${data.midterm || 0}, '${svEmail}')">
                            <i class="bi bi-pencil-fill"></i> Isi Markah
                        </button>
                    </td>
                </tr>
            `;
        });

        tableHTML += `</tbody></table></div></div>`;
        resultsArea.innerHTML = tableHTML;
        hostForm.style.display = 'none';

    } catch (err) {
        alert("Ralat Carian: " + err.message);
    }
};
// --- 2. FUNGSI SEDIAKAN BORANG EDIT (Auto-Fill Email) ---
window.prepareEdit = function(docId, name, course, q, t, m, svEmail) {
    currentEditDocId = docId;
    document.getElementById('studentName').value = name;
    
    const subjectSelect = document.getElementById('subjectSelect');
    subjectSelect.innerHTML = `<option value="${docId}" selected>${course}</option>`;
    
    // Auto-isi emel supervisor dan jadikan ia tidak boleh diubah (readonly)
    const svInput = document.getElementById('svEmail');
    svInput.value = svEmail || "Tiada Supervisor"; 

    document.getElementById('quiz').value = q;
    document.getElementById('test').value = t;
    document.getElementById('midterm').value = m;

    document.getElementById('hostForm').style.display = 'block';
    document.getElementById('hostForm').scrollIntoView({ behavior: 'smooth' });
};

// --- 3. FUNGSI SIMPAN KEMASKINI + LOGIK GRED ---
document.getElementById('hostForm').onsubmit = async (e) => {
    e.preventDefault();

    if (!currentEditDocId) return alert("Sila pilih pelajar dari senarai dahulu!");

    const quiz = Number(document.getElementById('quiz').value);
    const test = Number(document.getElementById('test').value);
    const midterm = Number(document.getElementById('midterm').value);
    const svEmail = document.getElementById('svEmail').value;

    const totalMark = (quiz * 0.2) + (test * 0.3) + (midterm * 0.5); 
    let grade = "";

    if (totalMark >= 80) grade = "A";
    else if (totalMark >= 60) grade = "B";
    else if (totalMark >= 40) grade = "C";
    else grade = "GAGAL";

    try {
        const regRef = doc(db, "course_registrations", currentEditDocId);
        
        await updateDoc(regRef, {
            quiz: quiz,
            test: test,
            midterm: midterm,
            totalMark: totalMark,
            grade: grade,
            supervisorEmail: svEmail, // Simpan emel yang ditarik tadi
            lastUpdated: new Date(),
            status: "Marked"
        });

        alert(`Berjaya! Markah dikemaskini. Gred: ${grade}`);
        searchBySubject(); 
        document.getElementById('hostForm').style.display = 'none';
    } catch (error) {
        alert("Ralat simpan: " + error.message);
    }
};
