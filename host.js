// --- 1. SATUKAN SEMUA IMPORT DALAM SATU TEMPAT ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { 
    getFirestore, 
    doc, 
    updateDoc, 
    collection, 
    query, 
    where, 
    getDocs, 
    addDoc, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

// --- 2. KONFIGURASI FIREBASE ---
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

// --- 3. FUNGSI CARI PELAJAR ---
window.searchBySubject = async function() {
    const courseDropdown = document.getElementById('courseSelect');
    const resultsArea = document.getElementById('searchResults');
    const hostForm = document.getElementById('hostForm');

    if (!courseDropdown) return;
    const selectedCourse = courseDropdown.value;
    if (!selectedCourse) return alert("Sila pilih subjek dahulu!");

    resultsArea.innerHTML = `<div class="text-center p-3"><div class="spinner-border text-primary"></div></div>`;

    try {
        const q = query(collection(db, "course_registrations"), where("course", "==", selectedCourse));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            resultsArea.innerHTML = `<div class="alert alert-warning">Tiada pelajar berdaftar untuk subjek: ${selectedCourse}</div>`;
            hostForm.style.display = 'none';
            return;
        }

        const uniqueStudents = new Map();
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            uniqueStudents.set(data.studentID, { docId: docSnap.id, ...data });
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
                        <tbody>`;

        uniqueStudents.forEach((data) => {
            const statusBadge = data.status === 'Marked' ? 'bg-success' : 'bg-secondary';
            const gradeDisplay = data.grade || '-';
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
                        <button class="btn btn-sm btn-primary" onclick="prepareEdit('${data.docId}', '${data.studentName}', '${data.course}', ${data.quiz || 0}, ${data.test || 0}, ${data.midterm || 0}, '${data.supervisorEmail || ''}')">
                            <i class="bi bi-pencil-fill"></i> Isi Markah
                        </button>
                    </td>
                </tr>`;
        });

        tableHTML += `</tbody></table></div></div>`;
        resultsArea.innerHTML = tableHTML;
    } catch (err) { alert("Ralat Carian: " + err.message); }
};

// --- 4. PERSEDIAAN EDIT MARKAH ---
window.prepareEdit = function(docId, name, course, q, t, m, svEmail) {
    currentEditDocId = docId;
    document.getElementById('studentName').value = name;
    document.getElementById('subjectSelect').innerHTML = `<option value="${course}">${course}</option>`;
    document.getElementById('svEmail').value = svEmail || "";
    document.getElementById('quiz').value = q;
    document.getElementById('test').value = t;
    document.getElementById('midterm').value = m;

    document.getElementById('hostForm').style.display = 'block';
    document.getElementById('hostForm').scrollIntoView({ behavior: 'smooth' });
};

// --- 5. SIMPAN MARKAH & KIRA GRED ---
const hostFormElement = document.getElementById('hostForm');
if(hostFormElement) {
    hostFormElement.onsubmit = async (e) => {
        e.preventDefault();
        if (!currentEditDocId) return alert("Sila pilih pelajar dahulu!");

        const quiz = Number(document.getElementById('quiz').value);
        const test = Number(document.getElementById('test').value);
        const midterm = Number(document.getElementById('midterm').value);
        const svEmail = document.getElementById('svEmail').value;

        const totalMark = (quiz * 0.2) + (test * 0.3) + (midterm * 0.5); 
        let grade = totalMark >= 80 ? "A" : totalMark >= 60 ? "B" : totalMark >= 40 ? "C" : "GAGAL";

        try {
            await updateDoc(doc(db, "course_registrations", currentEditDocId), {
                quiz, test, midterm,
                totalMark: totalMark.toFixed(2),
                grade,
                supervisorEmail: svEmail,
                lastUpdated: serverTimestamp(),
                status: "Marked"
            });

            alert(`✅ Berjaya! Gred: ${grade} (${totalMark.toFixed(2)}%)`);
            window.searchBySubject(); 
            hostFormElement.style.display = 'none';
        } catch (error) { alert("Ralat simpan: " + error.message); }
    };
}

// --- 6. FUNGSI MUAT NAIK BAHAN (UPLOAD MATERIAL) ---
window.uploadMaterial = async function() {
    const course = document.getElementById('postCourse').value;
    const category = document.getElementById('postCategory').value;
    const title = document.getElementById('postTitle').value;
    const content = document.getElementById('postContent').value;

    if(!title || !content) return alert("Sila isi tajuk dan kandungan bahan!");

    try {
        await addDoc(collection(db, "materials"), {
            course: course,
            category: category,
            title: title,
            content: content,
            datePosted: serverTimestamp()
        });

        alert(`✅ Berjaya! Bahan ${category} dihantar ke subjek ${course}.`);
        
        // Reset form
        document.getElementById('postTitle').value = "";
        document.getElementById('postContent').value = "";
    } catch (e) {
        alert("Ralat Upload: " + e.message);
    }
};
