import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { getFirestore, collection, onSnapshot, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

// 1. Konfigurasi Firebase
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

// Global Variables
let allData = [];
let riskChartInstance = null;
let gradeChartInstance = null;
let isInitialLoad = true; 

// 2. Pantau Status Log Masuk
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("Supervisor Aktif:", user.email);
        loadSupervisorDashboard(user.email);
    } else {
        window.location.href = "index.html";
    }
});

// 3. Fungsi Utama: Load Dashboard (Real-Time)
async function loadSupervisorDashboard(svEmail) {
    // Bina container untuk Notifikasi pop-up
    if (!document.querySelector('.toast-container')) {
        const container = document.createElement('div');
        container.className = 'toast-container position-fixed top-0 end-0 p-3';
        container.style.zIndex = "9999";
        document.body.appendChild(container);
    }

    // LISTENER 1: Dengar pendaftaran/markah (Koleksi: course_registrations)
    const qMarks = query(
        collection(db, "course_registrations"), 
        where("supervisorEmail", "==", svEmail)
    );

    onSnapshot(qMarks, (marksSnap) => {
        const marksMap = new Map();
        
        // Notifikasi jika ada pelajar baru berdaftar (Bukan initial load)
        marksSnap.docChanges().forEach((change) => {
            if (change.type === "added" && !isInitialLoad) {
                const newData = change.doc.data();
                showNotification(`Pelajar Baru: ${newData.studentName}`);
            }
        });

        marksSnap.forEach(doc => {
            const d = doc.data();
            marksMap.set(d.studentID, d);
        });

        // LISTENER 2: Dengar penilaian/risiko (Koleksi: assessments)
        const qAssess = query(
            collection(db, "assessments"), 
            where("supervisorEmail", "==", svEmail),
            orderBy("timestamp", "desc")
        );

        onSnapshot(qAssess, (assessSnap) => {
            renderDashboard(assessSnap, marksMap);
            isInitialLoad = false; 
        });
    });
}

// 4. Fungsi Render UI
function renderDashboard(snap, marksMap) {
    const tbody = document.getElementById('dashTable');
    if (!tbody) return;

    tbody.innerHTML = '';
    allData = [];
    let highRiskCount = 0;
    let counts = { HIGH: 0, MEDIUM: 0, LOW: 0 };
    let grades = { A: 0, B: 0, C: 0, GAGAL: 0 };

    if (snap.empty) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center p-4">Tiada rekod pelajar aktif.</td></tr>';
        return;
    }

    snap.forEach(doc => {
        const s = doc.data();
        const academic = marksMap.get(s.studentID) || {};
        
        // Simpan untuk export CSV
        allData.push({ ...s, ...academic });

        // Kira Statistik
        if (s.risk === 'HIGH') highRiskCount++;
        if (counts[s.risk] !== undefined) counts[s.risk]++;
        
        const g = (academic.grade || "").toUpperCase();
        if (['A', 'B', 'C'].includes(g)) grades[g]++;
        else if (g === 'F' || g === 'GAGAL') grades.GAGAL++;

        // Render Baris Jadual
        const gredDisplay = academic.grade ? `<span class="fw-bold text-primary">${academic.grade}</span>` : `<span class="text-muted small">N/A</span>`;
        const rowClass = (s.risk === 'HIGH' && (g === 'F' || g === 'GAGAL')) ? 'table-danger' : '';

        tbody.innerHTML += `
            <tr class="${rowClass} animate__animated animate__fadeIn">
                <td class="ps-3">
                    <div class="fw-bold">${s.studentName}</div>
                    <small class="text-muted">ID: ${s.studentID}</small>
                </td>
                <td><span class="badge bg-light text-primary border">${s.course || academic.course || 'Kursus'}</span></td>
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

    // Update Header Stats
    if(document.getElementById('totalCount')) document.getElementById('totalCount').innerText = snap.size;
    if(document.getElementById('highRiskCount')) document.getElementById('highRiskCount').innerText = highRiskCount;
    
    updateCharts(counts, grades);
}

// 5. Fungsi Notifikasi
function showNotification(message) {
    const container = document.querySelector('.toast-container');
    const toast = document.createElement('div');
    toast.className = 'bg-white border-start border-primary border-5 p-3 mb-2 shadow rounded animate__animated animate__slideInRight';
    toast.style.minWidth = "250px";
    toast.innerHTML = `
        <div class="d-flex align-items-center gap-2">
            <i class="bi bi-bell-fill text-primary"></i>
            <div>
                <strong class="d-block small">Notifikasi Real-Time</strong>
                <span class="small">${message}</span>
            </div>
        </div>
    `;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.replace('animate__slideInRight', 'animate__slideOutRight');
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}

// 6. Fungsi Lukis Carta (Chart.js)
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
                label: 'Pelajar',
                data: [gradeData.A, gradeData.B, gradeData.C, gradeData.GAGAL],
                backgroundColor: '#4361ee',
                borderRadius: 8
            }]
        },
        options: { maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
    });
}

// 7. Window Functions (Export & Logout)
window.exportToCSV = () => {
    if (allData.length === 0) return alert("Tiada data!");
    let csv = "Nama Pelajar,ID Pelajar,Kursus,Stress,Risiko,Markah,Gred\n";
    allData.forEach(r => {
        csv += `"${r.studentName}","${r.studentID}","${r.course || '-'}",${r.stress},"${r.risk}","${r.totalMark || '-'}","${r.grade || '-'}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EduGuard_Report_${new Date().toLocaleDateString()}.csv`;
    a.click();
};

window.handleLogout = async () => {
    if(confirm("Adakah anda pasti untuk log keluar?")) {
        signOut(auth).then(() => window.location.href = "index.html");
    }
};
