import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getFirestore, collection, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";

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
const auth = getAuth(app);

let allStudentsData = []; // Data mentah dari Firebase

// 1. Semak Status Login
onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('svEmailDisplay').innerText = user.email;
        document.getElementById('svName').innerText = user.displayName || "Supervisor";
        loadStudentData(user.email);
    } else {
        window.location.href = "index.html";
    }
});

// 2. Tarik Data Real-time
function loadStudentData(svEmail) {
    const q = query(collection(db, "course_registrations"), where("supervisorEmail", "==", svEmail));

    onSnapshot(q, (snapshot) => {
        allStudentsData = [];
        let totalQ = 0, totalM = 0, markedCount = 0;

        snapshot.forEach((doc) => {
            const data = doc.data();
            allStudentsData.push(data);
            
            if(data.status === 'Marked') {
                markedCount++;
                totalQ += data.quiz || 0;
                totalM += data.midterm || 0;
            }
        });

        renderTable(allStudentsData);
        updateStats(allStudentsData.length, markedCount, totalQ, totalM);
    });
}

// 3. Fungsi Render Jadual (Grouping mengikut Pelajar)
function renderTable(dataArray) {
    const tbody = document.getElementById('studentTableBody');
    tbody.innerHTML = "";
    
    // Grouping data mengikut studentID
    const grouped = dataArray.reduce((acc, obj) => {
        const key = obj.studentID;
        if (!acc[key]) {
            acc[key] = { name: obj.studentName, id: obj.studentID, subjects: [] };
        }
        acc[key].subjects.push(obj);
        return acc;
    }, {});

    Object.values(grouped).forEach((student) => {
        const studentRowId = `subjects-${student.id.replace(/\s+/g, '-')}`;
        
        const row = `
            <tr style="cursor: pointer;" onclick="toggleSubjects('${studentRowId}')" class="align-middle">
                <td><i class="bi bi-chevron-right me-2"></i><code class="text-primary fw-bold">${student.id}</code></td>
                <td><span class="fw-bold">${student.name}</span></td>
                <td colspan="4"><span class="badge rounded-pill bg-info text-dark">${student.subjects.length} Subjek Terdaftar</span></td>
                <td class="text-end"><span class="btn btn-sm btn-light border text-primary">Lihat Detail</span></td>
            </tr>
            
            <tr id="${studentRowId}" class="d-none bg-light">
                <td colspan="7" class="p-3">
                    <div class="table-responsive shadow-sm rounded">
                        <table class="table table-sm table-hover mb-0 bg-white">
                            <thead class="table-dark">
                                <tr>
                                    <th>Subjek</th>
                                    <th>Quiz (%)</th>
                                    <th>Test (%)</th>
                                    <th>Midterm (%)</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${student.subjects.map(sub => `
                                    <tr>
                                        <td>${sub.course}</td>
                                        <td>${sub.quiz || 0}%</td>
                                        <td>${sub.test || 0}%</td>
                                        <td>${sub.midterm || 0}%</td>
                                        <td><span class="badge ${sub.status === 'Marked' ? 'badge-marked' : 'badge-pending'}">${sub.status || 'Pending'}</span></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

// 4. Logik Expand/Collapse
window.toggleSubjects = (id) => {
    const element = document.getElementById(id);
    const parentRow = element.previousElementSibling;
    const icon = parentRow.querySelector('.bi');
    
    if (element.classList.contains('d-none')) {
        element.classList.remove('d-none');
        icon.classList.replace('bi-chevron-right', 'bi-chevron-down');
        parentRow.classList.add('table-active');
    } else {
        element.classList.add('d-none');
        icon.classList.replace('bi-chevron-down', 'bi-chevron-right');
        parentRow.classList.remove('table-active');
    }
};

// 5. Kemaskini Statistik
function updateStats(totalRecords, markedCount, totalQ, totalM) {
    document.getElementById('totalStudents').innerText = totalRecords;
    document.getElementById('avgQuiz').innerText = markedCount > 0 ? (totalQ / markedCount).toFixed(1) + "%" : "0%";
    document.getElementById('avgMidterm').innerText = markedCount > 0 ? (totalM / markedCount).toFixed(1) + "%" : "0%";
}

// 6. Carian (Search)
document.getElementById('tableSearch').addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = allStudentsData.filter(s => 
        s.studentName.toLowerCase().includes(term) || 
        s.studentID.toLowerCase().includes(term) ||
        s.course.toLowerCase().includes(term)
    );
    renderTable(filtered);
});

// 7. Eksport ke Excel (CSV)
window.exportToExcel = () => {
    if (allStudentsData.length === 0) return alert("Tiada data!");
    let csv = "ID Pelajar,Nama Pelajar,Subjek,Quiz,Test,Midterm,Status\n";
    allStudentsData.forEach(s => {
        csv += `${s.studentID},${s.studentName},${s.course},${s.quiz || 0},${s.test || 0},${s.midterm || 0},${s.status || 'Pending'}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Laporan_EduGuard_${new Date().toLocaleDateString()}.csv`;
    a.click();
};

// 8. Log Keluar
window.logout = () => {
    signOut(auth).then(() => window.location.href = "index.html");
};