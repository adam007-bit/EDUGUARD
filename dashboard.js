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
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { getFirestore, collection, onSnapshot, query, where, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

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

let allData = [];
let riskChartInstance = null;
let gradeChartInstance = null;

// Pantau Log Masuk
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("Supervisor Logged In:", user.email);
        loadSupervisorDashboard(user.email);
    } else {
        window.location.href = "index.html";
    }
});

// FUNGSI UTAMA (Hanya ada satu pengisytiharan di sini)
async function loadSupervisorDashboard(svEmail) {
    const qAssess = query(
        collection(db, "assessments"), 
        where("supervisorEmail", "==", svEmail),
        orderBy("timestamp", "desc")
    );

    onSnapshot(qAssess, async (snap) => {
        const tbody = document.getElementById('dashTable');
        
        // 1. Ambil data akademik dari course_registrations
        const qMarks = query(collection(db, "course_registrations"), where("supervisorEmail", "==", svEmail));
        const marksSnap = await getDocs(qMarks);
        const marksMap = new Map();
        marksSnap.forEach(doc => {
            const d = doc.data();
            marksMap.set(d.studentID, d);
        });

        // 2. Persediaan Data Table & Chart
        tbody.innerHTML = '';
        allData = [];
        let highRiskCount = 0;
        let counts = { HIGH: 0, MEDIUM: 0, LOW: 0 };
        let grades = { A: 0, B: 0, C: 0, GAGAL: 0, F: 0 };

        if (snap.empty) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center p-4">Tiada rekod pelajar.</td></tr>';
            return;
        }

        // 3. Loop Data
        snap.forEach(doc => {
            const s = doc.data();
            const academic = marksMap.get(s.studentID) || {};
            
            allData.push({ ...s, ...academic });

            // Kira Stats & Chart
            if (s.risk === 'HIGH') highRiskCount++;
            if (counts[s.risk] !== undefined) counts[s.risk]++;
            
            let g = (academic.grade || "").toUpperCase();
            if (g === 'A') grades.A++;
            else if (g === 'B') grades.B++;
            else if (g === 'C') grades.C++;
            else if (g === 'F' || g === 'GAGAL') { grades.GAGAL++; grades.F++; }

            // Render Table
            const gredDisplay = academic.grade ? `<span class="fw-bold text-primary">${academic.grade}</span>` : `<span class="text-muted small">N/A</span>`;
            const rowClass = (s.risk === 'HIGH' && (g === 'F' || g === 'GAGAL')) ? 'table-danger' : '';

            tbody.innerHTML += `
                <tr class="${rowClass}">
                    <td class="ps-3">
                        <div class="fw-bold">${s.studentName}</div>
                        <small class="text-muted">ID: ${s.studentID}</small>
                    </td>
                    <td><span class="badge bg-light text-primary border">${s.course}</span></td>
                    <td class="text-center">${s.stress}/5</td>
                    <td class="text-center">
                        <span class="badge ${s.risk === 'HIGH' ? 'bg-danger' : (s.risk === 'MEDIUM' ? 'bg-warning text-dark' : 'bg-success')} shadow-sm">
                            ${s.risk}
                        </span>
                    </td>
                    <td class="text-center">${academic.totalMark ? academic.totalMark + '%' : '-'}</td>
                    <td class="text-center">${gredDisplay}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary" onclick="alert('Info Pelajar: ${s.studentID}')">
                            <i class="bi bi-eye"></i>
                        </button>
                    </td>
                </tr>`;
        });

        // 4. Kemaskini UI & Chart
        if(document.getElementById('totalCount')) document.getElementById('totalCount').innerText = snap.size;
        if(document.getElementById('highRiskCount')) document.getElementById('highRiskCount').innerText = highRiskCount;
        updateCharts(counts, grades);
    });
}

// FUNGSI LUKIS CARTA
function updateCharts(riskData, gradeData) {
    const ctxRisk = document.getElementById('riskChart')?.getContext('2d');
    const ctxGrade = document.getElementById('gradeChart')?.getContext('2d');

    if (!ctxRisk || !ctxGrade) return;

    if (riskChartInstance) riskChartInstance.destroy();
    if (gradeChartInstance) gradeChartInstance.destroy();

    riskChartInstance = new Chart(ctxRisk, {
        type: 'doughnut',
        data: {
            labels: ['High', 'Medium', 'Low'],
            datasets: [{
                data: [riskData.HIGH, riskData.MEDIUM, riskData.LOW],
                backgroundColor: ['#ef4444', '#f59e0b', '#10b981'],
                borderWidth: 0
            }]
        },
        options: { maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
    });

    gradeChartInstance = new Chart(ctxGrade, {
        type: 'bar',
        data: {
            labels: ['A', 'B', 'C', 'F/Gagal'],
            datasets: [{
                label: 'Bilangan Pelajar',
                data: [gradeData.A, gradeData.B, gradeData.C, gradeData.GAGAL],
                backgroundColor: '#4361ee',
                borderRadius: 8
            }]
        },
        options: { maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
    });
}

// REGISTER KE WINDOW (Penyelesaian Export & Logout)
window.exportToCSV = () => {
    if (allData.length === 0) return alert("Tiada data untuk dieksport!");
    let csv = "Nama Pelajar,ID Pelajar,Kursus,Stress,Risiko,Markah,Gred\n";
    allData.forEach(r => {
        csv += `"${r.studentName}","${r.studentID}","${r.course}",${r.stress},"${r.risk}","${r.totalMark || '-'}","${r.grade || '-'}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EduGuard_Report_${new Date().toLocaleDateString()}.csv`;
    a.click();
};

window.handleLogout = async () => {
    if(confirm("Adakah anda pasti untuk log keluar?")) {
        const { getAuth, signOut } = await import("https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js");
        const auth = getAuth();
        signOut(auth).then(() => window.location.href = "index.html");
    }
};
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
