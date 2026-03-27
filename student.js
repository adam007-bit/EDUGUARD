import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

// --- KONFIGURASI FIREBASE ---
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

window.checkResults = async function() {
    const inputID = document.getElementById('inputStudentID').value.trim();
    const profileSection = document.getElementById('studentProfile');
    const resultsList = document.getElementById('resultsList');
    const noDataMsg = document.getElementById('noDataMsg');
    const dispName = document.getElementById('dispStudentName');
    const dispID = document.getElementById('dispStudentID');

    if (!inputID) return alert("Sila masukkan ID Pelajar!");

    profileSection.classList.add('d-none');
    noDataMsg.classList.add('d-none');
    resultsList.innerHTML = "";

    try {
        const q = query(collection(db, "course_registrations"), where("studentID", "==", inputID));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            noDataMsg.classList.remove('d-none');
            return;
        }

        let firstDoc = true;
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            
            if (firstDoc) {
                dispName.innerText = data.studentName;
                dispID.innerText = `ID: ${data.studentID}`;
                profileSection.classList.remove('d-none');
                firstDoc = false;
            }

            // Logik Warna Gred (Boleh ditambah ikut keperluan gred anda)
            let gradeClass = 'bg-light text-dark'; 
            if (data.grade === 'A' || data.grade === 'A-') gradeClass = 'bg-grade-a';
            if (data.grade === 'G' || data.grade === 'F') gradeClass = 'bg-grade-g';
            
            // Build card dengan info Semester
            resultsList.innerHTML += `
                <div class="card result-card p-3 mb-3 border-start border-4 ${data.status === 'High Risk' ? 'border-danger' : 'border-success'}">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="fw-bold mb-0">${data.course}</h6>
                            <small class="badge bg-light text-dark mb-2">${data.semester || 'N/A'}</small>
                            <div class="d-flex gap-3 small text-muted">
                                <span>Quiz: ${data.quiz}%</span>
                                <span>Test: ${data.test}%</span>
                                <span>Mid: ${data.midterm}%</span>
                            </div>
                        </div>
                        <div class="grade-circle ${gradeClass} shadow-sm">
                            ${data.grade || '-'}
                        </div>
                    </div>
                </div>
            `;
        });

    } catch (error) {
        console.error("Ralat semakan:", error);
        alert("Sistem mengalami ralat. Sila cuba lagi.");
    }
};

// Listener untuk butang Enter
document.getElementById('inputStudentID').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        window.checkResults();
    }
});