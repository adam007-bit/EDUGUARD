import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getFirestore, collection, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDup2zZ06JLmQCHPc8zGbetLUsXMjX3mjw",
  authDomain: "eduguard-ai-2742b.firebaseapp.com",
  databaseURL: "https://eduguard-ai-2742b-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "eduguard-ai-2742b",
  storageBucket: "eduguard-ai-2742b.firebasestorage.app",
  messagingSenderId: "96233022148",
  appId: "1:96233022148:web:1f903d72b3f79690409f91"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

window.checkResults = function () {
    const studentID = document.getElementById('inputStudentID').value.trim();
    const resultsList = document.getElementById('resultsList');
    const profileDiv = document.getElementById('studentProfile');
    const noDataMsg = document.getElementById('noDataMsg');

    if (!studentID) return alert("Sila masukkan ID anda!");

    // Query Firestore mencari studentID
    const q = query(collection(db, "course_registrations"), where("studentID", "==", studentID));

    onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
            profileDiv.classList.add('d-none');
            noDataMsg.classList.remove('d-none');
            return;
        }

        noDataMsg.classList.add('d-none');
        profileDiv.classList.remove('d-none');
        resultsList.innerHTML = "";

        snapshot.forEach((docSnap) => {
            const data = docSnap.data();

            // Set maklumat profil (hanya sekali)
            document.getElementById('dispStudentName').innerText = data.studentName;
            document.getElementById('dispStudentID').innerText = "ID: " + data.studentID;

            // Buat kad keputusan untuk setiap subjek
            const gradeClass = data.grade === "GAGAL" ? "bg-grade-g" : "bg-grade-a";

            const cardHTML = `
                <div class="card result-card p-3 mb-3 border-start border-primary border-5">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="text-uppercase text-muted small fw-bold mb-1">Subjek</h6>
                            <h5 class="fw-bold mb-2">${data.course}</h5>
                            <div class="d-flex gap-3 text-muted" style="font-size: 0.9rem;">
                                <span>Quiz: <strong>${data.quiz || 0}%</strong></span>
                                <span>Test: <strong>${data.test || 0}%</strong></span>
                                <span>Midterm: <strong>${data.midterm || 0}%</strong></span>
                            </div>
                        </div>
                        <div class="text-center">
                            <div class="grade-circle ${gradeClass} mb-1">
                                ${data.grade || '-'}
                                
                            </div>
                            <small class="text-muted fw-bold">GRED</small>
                        </div>
                    </div>
                </div>
            `;
            resultsList.innerHTML += cardHTML;
        });
    });
};