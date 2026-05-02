// universal_chat.js - Shared chat module for ALL roles
// Import this in ALL dashboard HTML files

export function initUniversalChat(currentUserId, currentUserName, currentUserRole) {
    
    const chatHTML = `
        <div id="universalChatBtn" class="universal-chat-btn">
            <i class="bi bi-chat-dots-fill fs-4 text-white"></i>
            <span id="chatTotalUnread" class="chat-unread-badge" style="display: none;">0</span>
        </div>
        <div id="universalChatContainer" class="universal-chat-container">
            <div class="universal-chat-header">
                <span><i class="bi bi-globe me-2"></i> Unified Chat - All Roles</span>
                <i class="bi bi-chevron-down" style="cursor: pointer;" onclick="toggleUniversalChat()"></i>
            </div>
            <div class="universal-chat-tabs">
                <div class="universal-chat-tab active" data-tab="chats" onclick="switchChatTab('chats')">💬 Chats</div>
                <div class="universal-chat-tab" data-tab="contacts" onclick="switchChatTab('contacts')">👥 All Contacts</div>
            </div>
            <div id="universalContactsList" class="universal-chat-contacts" style="max-height: 200px;"></div>
            <div id="universalChatMessages" class="universal-chat-messages" style="flex: 1; min-height: 250px;">
                <div class="text-center text-muted py-5">Select a contact to start chatting</div>
            </div>
            <div class="universal-chat-input">
                <div class="d-flex gap-2">
                    <input type="text" id="universalChatInput" class="form-control rounded-pill" placeholder="Type your message..." disabled>
                    <button class="btn btn-primary rounded-pill px-4" onclick="sendUniversalMessage()" disabled><i class="bi bi-send"></i> Send</button>
                </div>
            </div>
        </div>
    `;
    
    // Add styles if not present
    if (!document.getElementById('universalChatStyles')) {
        const styles = document.createElement('style');
        styles.id = 'universalChatStyles';
        styles.innerHTML = `
            .universal-chat-btn { position: fixed; bottom: 30px; right: 30px; width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg, #4361ee, #8b5cf6); display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 6px 25px rgba(0,0,0,0.2); z-index: 1050; transition: all 0.3s; }
            .universal-chat-btn:hover { transform: scale(1.08); }
            .universal-chat-container { position: fixed; bottom: 100px; right: 30px; width: 400px; height: 550px; background: white; border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); display: none; flex-direction: column; z-index: 1060; overflow: hidden; border: 1px solid #e2e8f0; }
            .universal-chat-header { background: linear-gradient(135deg, #4361ee, #8b5cf6); color: white; padding: 15px 20px; font-weight: 700; display: flex; justify-content: space-between; align-items: center; cursor: pointer; }
            .universal-chat-tabs { display: flex; border-bottom: 1px solid #e2e8f0; background: #f8fafc; }
            .universal-chat-tab { flex: 1; text-align: center; padding: 12px; cursor: pointer; font-size: 0.8rem; font-weight: 600; transition: 0.2s; }
            .universal-chat-tab.active { background: white; color: #4361ee; border-bottom: 2px solid #4361ee; }
            .universal-chat-contacts { max-height: 200px; overflow-y: auto; border-bottom: 1px solid #e2e8f0; background: #f8fafc; }
            .universal-contact-item { padding: 12px 15px; cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 12px; border-bottom: 1px solid #e2e8f0; }
            .universal-contact-item:hover { background: #eef2ff; }
            .universal-contact-item.active { background: #e0e7ff; border-left: 3px solid #4361ee; }
            .contact-avatar { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #667eea, #764ba2); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; }
            .contact-info { flex: 1; }
            .contact-name { font-weight: 600; font-size: 0.85rem; }
            .contact-role { font-size: 0.65rem; color: #64748b; }
            .contact-role-badge { font-size: 0.6rem; padding: 2px 6px; border-radius: 20px; margin-left: 6px; }
            .role-student { background: #dbeafe; color: #1e40af; }
            .role-supervisor { background: #fef3c7; color: #92400e; }
            .role-host { background: #dcfce7; color: #166534; }
            .role-counselor { background: #fce7f3; color: #9d174d; }
            .unread-dot { width: 10px; height: 10px; background: #ef4444; border-radius: 50%; }
            .universal-chat-messages { flex: 1; overflow-y: auto; padding: 20px; background: #f9fafb; display: flex; flex-direction: column; gap: 12px; }
            .universal-message { max-width: 80%; display: flex; flex-direction: column; }
            .universal-message.sent { align-self: flex-end; }
            .universal-message.received { align-self: flex-start; }
            .universal-message .message-bubble { padding: 10px 16px; border-radius: 20px; word-wrap: break-word; }
            .universal-message.sent .message-bubble { background: linear-gradient(135deg, #4361ee, #8b5cf6); color: white; border-bottom-right-radius: 4px; }
            .universal-message.received .message-bubble { background: white; color: #1e293b; border-bottom-left-radius: 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
            .universal-message .message-time { font-size: 10px; margin-top: 4px; color: #94a3b8; }
            .universal-chat-input { padding: 15px; border-top: 1px solid #e2e8f0; background: white; }
            .chat-unread-badge { position: absolute; top: -5px; right: -5px; background: #ef4444; color: white; border-radius: 50%; width: 22px; height: 22px; font-size: 10px; display: flex; align-items: center; justify-content: center; font-weight: bold; }
            body.dark-mode .universal-chat-container { background: #1e293b; border-color: #334155; }
            body.dark-mode .universal-chat-messages { background: #0f172a; }
            body.dark-mode .universal-message.received .message-bubble { background: #334155; color: #e2e8f0; }
            body.dark-mode .universal-chat-tabs { background: #1e293b; }
            body.dark-mode .universal-chat-tab.active { background: #1e293b; }
            body.dark-mode .universal-chat-contacts { background: #1e293b; }
            body.dark-mode .universal-contact-item:hover { background: #334155; }
            body.dark-mode .universal-contact-item.active { background: #2d3a4a; }
            @media (max-width: 640px) { .universal-chat-container { width: 320px; height: 480px; right: 10px; bottom: 80px; } .universal-chat-btn { width: 50px; height: 50px; bottom: 20px; right: 20px; } }
        `;
        document.head.appendChild(styles);
    }
    
    // Append chat HTML
    document.body.insertAdjacentHTML('beforeend', chatHTML);
    
    // State variables
    let currentContact = null;
    let chatUnsubscribe = null;
    let allUsers = [];
    let activeTab = 'chats';
    let totalUnread = 0;
    
    // Role priority for display
    const roleOrder = { 'supervisor': 1, 'host': 2, 'counselor': 3, 'student': 4 };
    const roleNames = { 'supervisor': 'RPS', 'host': 'Coordinator', 'counselor': 'Counselor', 'student': 'Student' };
    
    // Load all users from Firestore
    async function loadAllUsers() {
        const { getFirestore, collection, getDocs, query, where } = await import("https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js");
        const { getAuth } = await import("https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js");
        const app = firebase.app();
        const db = getFirestore(app);
        const auth = getAuth(app);
        
        const usersSnap = await getDocs(collection(db, "users"));
        allUsers = [];
        usersSnap.forEach(doc => {
            const data = doc.data();
            if (doc.id !== currentUserId && data.role !== 'admin') {
                allUsers.push({
                    id: doc.id,
                    name: data.name || doc.id.split('@')[0],
                    email: data.email || doc.id,
                    role: data.role,
                    avatar: data.name?.charAt(0).toUpperCase() || 'U'
                });
            }
        });
        allUsers.sort((a, b) => roleOrder[a.role] - roleOrder[b.role]);
        renderContacts();
        calculateTotalUnread();
    }
    
    function renderContacts() {
        const container = document.getElementById('universalContactsList');
        let filtered = allUsers;
        
        if (activeTab === 'chats') {
            // Show only users with recent conversations (simplified - show all for now)
            filtered = allUsers;
        }
        
        if (filtered.length === 0) {
            container.innerHTML = '<div class="text-center py-4 text-muted small">No users found</div>';
            return;
        }
        
        let html = '';
        filtered.forEach(user => {
            const isActive = currentContact?.id === user.id;
            const roleClass = `role-${user.role}`;
            html += `
                <div class="universal-contact-item ${isActive ? 'active' : ''}" onclick="selectUniversalContact('${user.id}', '${escapeHtml(user.name)}', '${user.role}')">
                    <div class="contact-avatar">${user.avatar}</div>
                    <div class="contact-info">
                        <div class="contact-name">${escapeHtml(user.name)}</div>
                        <div><span class="contact-role-badge ${roleClass}">${roleNames[user.role]}</span></div>
                    </div>
                    <div id="unread_${user.id}" class="unread-dot" style="display: none;"></div>
                </div>
            `;
        });
        container.innerHTML = html;
    }
    
    window.selectUniversalContact = async (userId, userName, userRole) => {
        currentContact = { id: userId, name: userName, role: userRole };
        
        // Update UI
        document.querySelectorAll('.universal-contact-item').forEach(el => el.classList.remove('active'));
        event.target.closest('.universal-contact-item')?.classList.add('active');
        
        // Enable chat input
        document.getElementById('universalChatInput').disabled = false;
        document.querySelector('#universalChatContainer button')?.removeAttribute('disabled');
        
        // Mark messages as read
        await markMessagesAsRead(userId);
        
        // Load messages
        loadChatMessages(userId);
    };
    
    async function markMessagesAsRead(otherUserId) {
        const { getFirestore, collection, query, where, getDocs, updateDoc, doc } = await import("https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js");
        const app = firebase.app();
        const db = getFirestore(app);
        
        const chatId = [currentUserId, otherUserId].sort().join('_');
        const messagesRef = collection(db, "universal_chats", chatId, "messages");
        const unreadQuery = query(messagesRef, where("read", "==", false), where("senderId", "!=", currentUserId));
        const unreadSnap = await getDocs(unreadQuery);
        
        unreadSnap.forEach(async (docSnap) => {
            await updateDoc(doc(db, "universal_chats", chatId, "messages", docSnap.id), { read: true });
        });
        
        document.getElementById(`unread_${otherUserId}`).style.display = 'none';
        calculateTotalUnread();
    }
    
    function loadChatMessages(otherUserId) {
        if (chatUnsubscribe) chatUnsubscribe();
        
        const chatId = [currentUserId, otherUserId].sort().join('_');
        const messagesRef = firebase.firestore().collection("universal_chats").doc(chatId).collection("messages");
        const q = messagesRef.orderBy("timestamp", "asc");
        
        chatUnsubscribe = q.onSnapshot((snapshot) => {
            const messagesArea = document.getElementById('universalChatMessages');
            if (snapshot.empty) {
                messagesArea.innerHTML = '<div class="text-center text-muted py-5"><i class="bi bi-chat-dots fs-1 d-block mb-3"></i>No messages yet. Start the conversation!</div>';
                return;
            }
            
            let html = '';
            snapshot.forEach(docSnap => {
                const msg = docSnap.data();
                const isSent = msg.senderId === currentUserId;
                const time = msg.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || '';
                
                html += `
                    <div class="universal-message ${isSent ? 'sent' : 'received'}">
                        <div class="message-bubble">
                            <div class="small fw-semibold mb-1" style="font-size: 0.65rem;">${isSent ? 'You' : (msg.senderName || currentContact?.name)}</div>
                            ${escapeHtml(msg.text)}
                        </div>
                        <div class="message-time">${time}</div>
                    </div>
                `;
            });
            
            messagesArea.innerHTML = html;
            messagesArea.scrollTop = messagesArea.scrollHeight;
        });
    }
    
    window.sendUniversalMessage = async () => {
        const input = document.getElementById('universalChatInput');
        const message = input.value.trim();
        if (!message || !currentContact) return;
        
        input.value = '';
        
        const { getFirestore, collection, doc, addDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js");
        const app = firebase.app();
        const db = getFirestore(app);
        
        const chatId = [currentUserId, currentContact.id].sort().join('_');
        
        await addDoc(collection(db, "universal_chats", chatId, "messages"), {
            text: message,
            senderId: currentUserId,
            senderName: currentUserName,
            receiverId: currentContact.id,
            receiverName: currentContact.name,
            timestamp: serverTimestamp(),
            read: false
        });
        
        // Also add notification
        await addDoc(collection(db, "notifications"), {
            userID: currentContact.id,
            message: `💬 New message from ${currentUserName} (${roleNames[currentUserRole]}): "${message.substring(0, 50)}..."`,
            sender: currentUserId,
            senderName: currentUserName,
            senderRole: currentUserRole,
            type: "chat",
            status: "unread",
            timestamp: serverTimestamp()
        });
        
        const messagesArea = document.getElementById('universalChatMessages');
        messagesArea.scrollTop = messagesArea.scrollHeight;
    };
    
    async function calculateTotalUnread() {
        const { getFirestore, collection, query, where, getDocs } = await import("https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js");
        const app = firebase.app();
        const db = getFirestore(app);
        
        let total = 0;
        for (const user of allUsers) {
            const chatId = [currentUserId, user.id].sort().join('_');
            const messagesRef = collection(db, "universal_chats", chatId, "messages");
            const unreadQuery = query(messagesRef, where("read", "==", false), where("senderId", "!=", currentUserId));
            const unreadSnap = await getDocs(unreadQuery);
            const count = unreadSnap.size;
            if (count > 0) {
                total += count;
                document.getElementById(`unread_${user.id}`).style.display = 'flex';
            }
        }
        
        totalUnread = total;
        const badge = document.getElementById('chatTotalUnread');
        if (total > 0) {
            badge.style.display = 'flex';
            badge.innerText = total > 9 ? '9+' : total;
        } else {
            badge.style.display = 'none';
        }
    }
    
    window.toggleUniversalChat = () => {
        const container = document.getElementById('universalChatContainer');
        const isOpen = container.style.display === 'flex';
        container.style.display = isOpen ? 'none' : 'flex';
        if (!isOpen && currentContact) {
            markMessagesAsRead(currentContact.id);
            document.getElementById('universalChatInput').focus();
        }
    };
    
    window.switchChatTab = (tab) => {
        activeTab = tab;
        document.querySelectorAll('.universal-chat-tab').forEach(el => el.classList.remove('active'));
        document.querySelector(`.universal-chat-tab[data-tab="${tab}"]`).classList.add('active');
        renderContacts();
    };
    
    document.getElementById('universalChatInput')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && currentContact) sendUniversalMessage();
    });
    
    function escapeHtml(str) { if (!str) return ''; return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m])); }
    
    // Initialize
    loadAllUsers();
    setInterval(calculateTotalUnread, 10000);
    
    return { toggleChat: toggleUniversalChat };
}

// Helper to check if Firebase is initialized
if (typeof firebase === 'undefined') {
    console.error('Firebase not loaded. Make sure to initialize Firebase first.');
}
