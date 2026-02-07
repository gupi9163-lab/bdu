// Global state
let socket;
let currentUser = null;
let currentFaculty = null;
let currentPrivateChat = null;
let selectedAvatar = 1;
let verificationQuestions = [];
let faculties = [];
let isSuper = false;

// Utility functions
function showError(message) {
    alert('Xəta: ' + message);
}

function showSuccess(message) {
    alert(message);
}

function showLoading(show = true) {
    const loadingScreen = document.getElementById('loadingScreen');
    if (show) {
        loadingScreen.classList.remove('hidden');
    } else {
        loadingScreen.classList.add('hidden');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
});

// Check authentication
async function checkAuth() {
    try {
        showLoading(true);
        const res = await fetch('/api/me');
        if (res.ok) {
            currentUser = await res.json();
            await loadFaculties();
            showChatScreen();
        } else {
            showAuthScreen();
        }
    } catch (error) {
        console.error('Autentifikasiya xətası:', error);
        showAuthScreen();
    } finally {
        showLoading(false);
    }
}

// Load faculties
async function loadFaculties() {
    try {
        const res = await fetch('/api/faculties');
        if (!res.ok) {
            throw new Error('Fakultələr yüklənə bilmədi');
        }
        faculties = await res.json();
        
        // Populate faculty dropdowns
        const regFacultySelect = document.getElementById('regFaculty');
        const profileFacultySelect = document.getElementById('profileFaculty');
        
        // Clear existing options
        regFacultySelect.innerHTML = '';
        profileFacultySelect.innerHTML = '';
        
        faculties.forEach(f => {
            const option1 = document.createElement('option');
            option1.value = f.name;
            option1.textContent = f.name;
            regFacultySelect.appendChild(option1);
            
            const option2 = document.createElement('option');
            option2.value = f.name;
            option2.textContent = f.name;
            profileFacultySelect.appendChild(option2);
        });
    } catch (error) {
        console.error('Fakultələr yüklənmə xətası:', error);
        showError('Fakultələr yüklənmədi. Səhifəni yeniləyin.');
    }
}

// Switch auth tab
function switchAuthTab(tab) {
    const tabs = ['login', 'register', 'admin'];
    tabs.forEach(t => {
        document.getElementById(`${t}Form`).classList.add('hidden');
        document.getElementById(`${t}Tab`).classList.remove('btn-primary');
        document.getElementById(`${t}Tab`).classList.add('btn-secondary');
    });
    
    document.getElementById(`${tab}Form`).classList.remove('hidden');
    document.getElementById(`${tab}Tab`).classList.remove('btn-secondary');
    document.getElementById(`${tab}Tab`).classList.add('btn-primary');
}

// Select avatar
function selectAvatar(num) {
    selectedAvatar = num;
    document.querySelectorAll('.avatar-option').forEach(el => el.classList.remove('selected'));
    document.querySelector(`.avatar-option:nth-child(${num})`).classList.add('selected');
}

// Start verification
async function startVerification() {
    const fullName = document.getElementById('regFullName').value.trim();
    const emailPrefix = document.getElementById('regEmailPrefix').value.trim();
    const phone = document.getElementById('regPhone').value.trim();
    const faculty = document.getElementById('regFaculty').value;
    const degree = document.getElementById('regDegree').value;
    const course = document.getElementById('regCourse').value;
    const password = document.getElementById('regPassword').value;

    if (!fullName || !emailPrefix || !phone || !faculty || !password) {
        alert('Bütün sahələri doldurun');
        return;
    }

    if (phone.length !== 9) {
        alert('Telefon nömrəsi 9 rəqəm olmalıdır');
        return;
    }

    try {
        const res = await fetch('/api/verification-questions');
        verificationQuestions = await res.json();
        
        const container = document.getElementById('verificationQuestions');
        container.innerHTML = '';
        
        verificationQuestions.forEach((q, idx) => {
            const div = document.createElement('div');
            div.className = 'form-group';
            div.innerHTML = `
                <label>${q.question}</label>
                <select id="verifyAnswer${idx}">
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="əsas">əsas korpus</option>
                </select>
            `;
            container.appendChild(div);
        });
        
        document.getElementById('verificationModal').classList.remove('hidden');
    } catch (error) {
        alert('Xəta baş verdi');
    }
}

// Submit registration
async function submitRegistration() {
    const fullName = document.getElementById('regFullName').value.trim();
    const emailPrefix = document.getElementById('regEmailPrefix').value.trim();
    const email = emailPrefix + '@bsu.edu.az';
    const phone = '+994' + document.getElementById('regPhone').value.trim();
    const faculty = document.getElementById('regFaculty').value;
    const degree = document.getElementById('regDegree').value;
    const course = document.getElementById('regCourse').value;
    const password = document.getElementById('regPassword').value;

    const verification_answers = verificationQuestions.map((q, idx) => ({
        faculty: q.faculty,
        answer: document.getElementById(`verifyAnswer${idx}`).value
    }));

    try {
        const res = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                full_name: fullName,
                email,
                phone,
                faculty,
                degree,
                course,
                password,
                avatar: selectedAvatar,
                verification_answers
            })
        });

        const data = await res.json();

        if (res.ok) {
            alert('Qeydiyyat uğurlu! Daxil olursunuz...');
            currentUser = data.user;
            closeVerification();
            await loadFaculties();
            showChatScreen();
        } else {
            alert(data.error || 'Qeydiyyat uğursuz');
        }
    } catch (error) {
        alert('Server xətası');
    }
}

// Close verification
function closeVerification() {
    document.getElementById('verificationModal').classList.add('hidden');
}

// Login
async function login() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        alert('Bütün sahələri doldurun');
        return;
    }

    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (res.ok) {
            currentUser = data.user;
            await loadFaculties();
            showChatScreen();
        } else {
            alert(data.error || 'Giriş uğursuz');
        }
    } catch (error) {
        alert('Server xətası');
    }
}

// Admin login
async function adminLogin() {
    const username = document.getElementById('adminUsername').value.trim();
    const password = document.getElementById('adminPassword').value;

    if (!username || !password) {
        alert('Bütün sahələri doldurun');
        return;
    }

    try {
        const res = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();

        if (res.ok) {
            isSuper = data.admin.is_super;
            showAdminPanel();
        } else {
            alert(data.error || 'Giriş uğursuz');
        }
    } catch (error) {
        alert('Server xətası');
    }
}

// Show auth screen
function showAuthScreen() {
    document.getElementById('loadingScreen').classList.add('hidden');
    document.getElementById('authScreen').classList.remove('hidden');
    document.getElementById('chatScreen').classList.add('hidden');
    document.getElementById('adminPanel').classList.add('hidden');
}

// Show chat screen
async function showChatScreen() {
    document.getElementById('loadingScreen').classList.add('hidden');
    document.getElementById('authScreen').classList.add('hidden');
    document.getElementById('chatScreen').classList.remove('hidden');
    document.getElementById('adminPanel').classList.add('hidden');

    // Setup socket
    socket = io();

    // Update user info
    const avatarUrl = currentUser.avatar === 1 ? '/avatar1.png' : '/avatar2.png';
    document.getElementById('userAvatar').src = avatarUrl;
    document.getElementById('userName').textContent = currentUser.full_name;
    document.getElementById('userFaculty').textContent = currentUser.faculty;

    // Load topic of day
    await loadTopicOfDay();

    // Load faculty list
    loadFacultyList();

    // Socket listeners
    socket.on('new-message', (message) => {
        if (currentFaculty === message.faculty && !currentPrivateChat) {
            appendMessage(message);
        }
    });

    socket.on('new-private-message', (message) => {
        if (currentPrivateChat && 
            ((message.sender_id === currentUser.id && message.receiver_id === currentPrivateChat.id) ||
             (message.sender_id === currentPrivateChat.id && message.receiver_id === currentUser.id))) {
            appendPrivateMessage(message);
        }
    });

    // Join private room
    socket.emit('join-private', currentUser.id);
}

// Show admin panel
async function showAdminPanel() {
    document.getElementById('loadingScreen').classList.add('hidden');
    document.getElementById('authScreen').classList.add('hidden');
    document.getElementById('chatScreen').classList.add('hidden');
    document.getElementById('adminPanel').classList.remove('hidden');

    if (!isSuper) {
        document.getElementById('adminCreateTab').style.display = 'none';
    }

    await loadAdminUsers();
    await loadAdminSettings();
}

// Load topic of day
async function loadTopicOfDay() {
    try {
        const res = await fetch('/api/topic-of-day');
        const data = await res.json();
        
        if (data.topic && data.topic.trim()) {
            document.getElementById('topicBanner').textContent = data.topic;
            document.getElementById('topicBanner').classList.remove('hidden');
        } else {
            document.getElementById('topicBanner').classList.add('hidden');
        }
    } catch (error) {
        console.error('Topic yüklənmə xətası:', error);
    }
}

// Load faculty list
function loadFacultyList() {
    const container = document.getElementById('facultyList');
    container.innerHTML = '';

    faculties.forEach(f => {
        const div = document.createElement('div');
        div.className = 'faculty-item';
        div.textContent = f.name;
        div.onclick = () => selectFaculty(f.name);
        container.appendChild(div);
    });

    // Auto-select user's faculty
    selectFaculty(currentUser.faculty);
}

// Select faculty
async function selectFaculty(faculty) {
    currentFaculty = faculty;
    currentPrivateChat = null;

    // Update UI
    document.querySelectorAll('.faculty-item').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.faculty-item').forEach(el => {
        if (el.textContent === faculty) {
            el.classList.add('active');
        }
    });

    document.getElementById('chatTitle').textContent = faculty;
    document.getElementById('chatSubtitle').textContent = 'Qrup Söhbəti';

    // Join room
    socket.emit('join-faculty', faculty);

    // Load messages
    await loadMessages(faculty);
}

// Load messages
async function loadMessages(faculty) {
    try {
        const res = await fetch(`/api/messages/${encodeURIComponent(faculty)}`);
        const messages = await res.json();

        const container = document.getElementById('messagesContainer');
        container.innerHTML = '';

        messages.forEach(msg => appendMessage(msg, false));

        // Scroll to bottom
        scrollToBottom();
    } catch (error) {
        console.error('Mesajlar yüklənmə xətası:', error);
    }
}

// Append message
function appendMessage(message, scroll = true) {
    const container = document.getElementById('messagesContainer');
    const isOwn = message.user_id === currentUser.id;

    const avatarUrl = message.avatar === 1 ? '/avatar1.png' : '/avatar2.png';

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isOwn ? 'own' : ''}`;
    messageDiv.dataset.userId = message.user_id;
    messageDiv.dataset.messageId = message.id;

    const time = new Date(message.created_at).toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' });

    messageDiv.innerHTML = `
        <img src="${avatarUrl}" alt="Avatar" class="message-avatar">
        <div class="message-content">
            ${!isOwn ? `
                <div class="message-header">
                    <span style="font-weight: 600;">${message.full_name}</span>
                    <span>${message.degree} • ${message.course}-ci kurs</span>
                </div>
            ` : ''}
            <div class="message-text">${message.message}</div>
            <div class="message-time">${time}</div>
            ${!isOwn ? `
                <div class="message-options" onclick="showMessageOptions(${message.user_id}, ${message.id})">
                    <i class="fas fa-ellipsis-v"></i>
                </div>
            ` : ''}
        </div>
    `;

    container.appendChild(messageDiv);

    if (scroll) {
        scrollToBottom();
    }
}

// Send message
function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();

    if (!message) return;

    socket.emit('send-message', {
        faculty: currentFaculty,
        message,
        userId: currentUser.id
    });

    input.value = '';
}

// Handle enter key
function handleEnter(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

// Show message options
function showMessageOptions(userId, messageId) {
    // Remove existing menus
    document.querySelectorAll('.options-menu').forEach(el => el.remove());

    const messageDiv = document.querySelector(`[data-message-id="${messageId}"]`);
    const optionsBtn = messageDiv.querySelector('.message-options');

    const menu = document.createElement('div');
    menu.className = 'options-menu';
    menu.innerHTML = `
        <button onclick="openPrivateChat(${userId}); closeMessageOptions();">
            <i class="fas fa-comment"></i> Şəxsi mesaj
        </button>
        <button onclick="blockUser(${userId}); closeMessageOptions();">
            <i class="fas fa-ban"></i> Əngəllə
        </button>
        <button onclick="reportUser(${userId}); closeMessageOptions();">
            <i class="fas fa-flag"></i> Şikayət et
        </button>
    `;

    optionsBtn.style.position = 'relative';
    optionsBtn.appendChild(menu);

    // Close menu when clicking outside
    setTimeout(() => {
        document.addEventListener('click', closeMessageOptions);
    }, 0);
}

// Close message options
function closeMessageOptions() {
    document.querySelectorAll('.options-menu').forEach(el => el.remove());
    document.removeEventListener('click', closeMessageOptions);
}

// Open private chat
async function openPrivateChat(userId) {
    try {
        // Get user info
        const res = await fetch('/api/me');
        currentUser = await res.json();

        // Find user from last messages
        const messagesRes = await fetch(`/api/private-messages/${userId}`);
        const messages = await messagesRes.json();

        // Get user info from first message or from group chat
        let userName, userFaculty, userDegree, userCourse, userAvatar;
        
        if (messages.length > 0) {
            const firstMsg = messages.find(m => m.sender_id === userId);
            userName = firstMsg.full_name;
            userAvatar = firstMsg.avatar;
        } else {
            // Get from current messages in group chat
            const messageDiv = document.querySelector(`[data-user-id="${userId}"]`);
            if (messageDiv) {
                const header = messageDiv.querySelector('.message-header');
                userName = header.children[0].textContent;
                const info = header.children[1].textContent.split(' • ');
                userDegree = info[0];
                userCourse = info[1];
                userAvatar = messageDiv.querySelector('.message-avatar').src.includes('rtVcG30L') ? 1 : 2;
            }
        }

        currentPrivateChat = {
            id: userId,
            name: userName,
            avatar: userAvatar || 1
        };

        const avatarUrl = userAvatar === 1 ? 'https://www.genspark.ai/api/files/s/rtVcG30L' : 'https://www.genspark.ai/api/files/s/ld8DnPfU';

        document.getElementById('privateChatAvatar').src = avatarUrl;
        document.getElementById('privateChatName').textContent = userName;
        document.getElementById('privateChatInfo').textContent = userFaculty ? `${userFaculty} • ${userDegree} • ${userCourse}` : '';

        // Load messages
        const container = document.getElementById('privateMessagesContainer');
        container.innerHTML = '';

        messages.forEach(msg => appendPrivateMessage(msg, false));

        document.getElementById('privateChatModal').classList.remove('hidden');
        scrollPrivateToBottom();
    } catch (error) {
        console.error('Şəxsi chat xətası:', error);
        alert('Xəta baş verdi');
    }
}

// Close private chat
function closePrivateChat() {
    document.getElementById('privateChatModal').classList.add('hidden');
    currentPrivateChat = null;
}

// Append private message
function appendPrivateMessage(message, scroll = true) {
    const container = document.getElementById('privateMessagesContainer');
    const isOwn = message.sender_id === currentUser.id;

    const avatarUrl = message.avatar === 1 ? '/avatar1.png' : '/avatar2.png';

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isOwn ? 'own' : ''}`;

    const time = new Date(message.created_at).toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' });

    messageDiv.innerHTML = `
        <img src="${avatarUrl}" alt="Avatar" class="message-avatar">
        <div class="message-content">
            <div class="message-text">${message.message}</div>
            <div class="message-time">${time}</div>
            ${!isOwn ? `
                <div class="message-options" onclick="showPrivateMessageOptions(${message.sender_id})">
                    <i class="fas fa-ellipsis-v"></i>
                </div>
            ` : ''}
        </div>
    `;

    container.appendChild(messageDiv);

    if (scroll) {
        scrollPrivateToBottom();
    }
}

// Show private message options
function showPrivateMessageOptions(userId) {
    // Remove existing menus
    document.querySelectorAll('.options-menu').forEach(el => el.remove());

    const menu = document.createElement('div');
    menu.className = 'options-menu';
    menu.innerHTML = `
        <button onclick="blockUser(${userId}); closeMessageOptions();">
            <i class="fas fa-ban"></i> Əngəllə
        </button>
        <button onclick="reportUser(${userId}); closeMessageOptions();">
            <i class="fas fa-flag"></i> Şikayət et
        </button>
    `;

    event.target.style.position = 'relative';
    event.target.appendChild(menu);

    // Close menu when clicking outside
    setTimeout(() => {
        document.addEventListener('click', closeMessageOptions);
    }, 0);
}

// Send private message
function sendPrivateMessage() {
    const input = document.getElementById('privateMessageInput');
    const message = input.value.trim();

    if (!message || !currentPrivateChat) return;

    socket.emit('send-private-message', {
        senderId: currentUser.id,
        receiverId: currentPrivateChat.id,
        message
    });

    input.value = '';
}

// Handle private enter
function handlePrivateEnter(event) {
    if (event.key === 'Enter') {
        sendPrivateMessage();
    }
}

// Block user
async function blockUser(userId) {
    if (!confirm('Bu istifadəçini əngəlləmək istədiyinizə əminsiniz?')) return;

    try {
        const res = await fetch(`/api/block/${userId}`, {
            method: 'POST'
        });

        if (res.ok) {
            alert('İstifadəçi əngəlləndi');
            if (currentPrivateChat && currentPrivateChat.id === userId) {
                closePrivateChat();
            }
            // Reload messages
            await loadMessages(currentFaculty);
        } else {
            alert('Xəta baş verdi');
        }
    } catch (error) {
        alert('Server xətası');
    }
}

// Report user
async function reportUser(userId) {
    const reason = prompt('Şikayət səbəbi (ixtiyari):');

    try {
        const res = await fetch(`/api/report/${userId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason })
        });

        if (res.ok) {
            alert('Şikayət göndərildi');
        } else {
            alert('Xəta baş verdi');
        }
    } catch (error) {
        alert('Server xətası');
    }
}

// Show profile
async function showProfile() {
    try {
        const res = await fetch('/api/me');
        const user = await res.json();

        document.getElementById('profileFullName').value = user.full_name;
        document.getElementById('profileFaculty').value = user.faculty;
        document.getElementById('profileDegree').value = user.degree;
        document.getElementById('profileCourse').value = user.course;

        selectProfileAvatar(user.avatar);

        document.getElementById('profileModal').classList.remove('hidden');
    } catch (error) {
        alert('Xəta baş verdi');
    }
}

// Close profile
function closeProfile() {
    document.getElementById('profileModal').classList.add('hidden');
}

// Select profile avatar
function selectProfileAvatar(num) {
    selectedAvatar = num;
    document.querySelectorAll('#profileModal .avatar-option').forEach(el => el.classList.remove('selected'));
    document.querySelector(`#profileModal .avatar-option:nth-child(${num})`).classList.add('selected');
}

// Save profile
async function saveProfile() {
    const fullName = document.getElementById('profileFullName').value.trim();
    const faculty = document.getElementById('profileFaculty').value;
    const degree = document.getElementById('profileDegree').value;
    const course = document.getElementById('profileCourse').value;

    try {
        const res = await fetch('/api/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                full_name: fullName,
                faculty,
                degree,
                course,
                avatar: selectedAvatar
            })
        });

        if (res.ok) {
            alert('Profil yeniləndi');
            closeProfile();
            // Reload
            location.reload();
        } else {
            alert('Xəta baş verdi');
        }
    } catch (error) {
        alert('Server xətası');
    }
}

// Show rules
async function showRules() {
    try {
        const res = await fetch('/api/rules');
        const data = await res.json();
        
        alert(data.rules || 'Qaydalar hələ əlavə edilməyib');
    } catch (error) {
        alert('Xəta baş verdi');
    }
}

// Show about
async function showAbout() {
    try {
        const res = await fetch('/api/about');
        const data = await res.json();
        
        alert(data.about || 'Haqqında məlumat hələ əlavə edilməyib');
    } catch (error) {
        alert('Xəta baş verdi');
    }
}

// Logout
async function logout() {
    try {
        await fetch('/api/logout', { method: 'POST' });
        location.reload();
    } catch (error) {
        location.reload();
    }
}

// Admin logout
function adminLogout() {
    location.reload();
}

// Scroll to bottom
function scrollToBottom() {
    const container = document.getElementById('messagesContainer');
    container.scrollTop = container.scrollHeight;
}

// Scroll private to bottom
function scrollPrivateToBottom() {
    const container = document.getElementById('privateMessagesContainer');
    container.scrollTop = container.scrollHeight;
}

// Switch admin tab
function switchAdminTab(tab) {
    const tabs = ['users', 'suspicious', 'settings', 'create-admin'];
    tabs.forEach(t => {
        const content = document.getElementById(`admin${t.charAt(0).toUpperCase() + t.slice(1).replace('-', '')}Content`);
        const tabBtn = document.getElementById(`admin${t.charAt(0).toUpperCase() + t.slice(1).replace('-', '')}Tab`);
        
        if (content) content.classList.add('hidden');
        if (tabBtn) {
            tabBtn.classList.remove('btn-primary');
            tabBtn.classList.add('btn-secondary');
        }
    });

    const contentMap = {
        'users': 'adminUsersContent',
        'suspicious': 'adminSuspiciousContent',
        'settings': 'adminSettingsContent',
        'create-admin': 'adminCreateContent'
    };

    const tabMap = {
        'users': 'adminUsersTab',
        'suspicious': 'adminSuspiciousTab',
        'settings': 'adminSettingsTab',
        'create-admin': 'adminCreateTab'
    };

    document.getElementById(contentMap[tab]).classList.remove('hidden');
    document.getElementById(tabMap[tab]).classList.remove('btn-secondary');
    document.getElementById(tabMap[tab]).classList.add('btn-primary');

    if (tab === 'users') {
        loadAdminUsers();
    } else if (tab === 'suspicious') {
        loadSuspiciousUsers();
    }
}

// Load admin users
async function loadAdminUsers() {
    try {
        const res = await fetch('/api/admin/users');
        const users = await res.json();

        document.getElementById('usersCount').textContent = users.length;

        const tbody = document.getElementById('usersTableBody');
        tbody.innerHTML = '';

        users.forEach(user => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid #e0e0e0';
            tr.innerHTML = `
                <td style="padding: 12px;">${user.id}</td>
                <td style="padding: 12px;">${user.full_name}</td>
                <td style="padding: 12px;">${user.email}</td>
                <td style="padding: 12px;">${user.phone}</td>
                <td style="padding: 12px;">${user.faculty}</td>
                <td style="padding: 12px;">
                    <span style="padding: 4px 8px; border-radius: 4px; background: ${user.is_active ? '#10b981' : '#ef4444'}; color: white; font-size: 12px;">
                        ${user.is_active ? 'Aktiv' : 'Deaktiv'}
                    </span>
                </td>
                <td style="padding: 12px;">
                    <button onclick="toggleUserStatus(${user.id})" style="background: #667eea; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">
                        ${user.is_active ? 'Deaktiv et' : 'Aktiv et'}
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('İstifadəçilər yüklənmə xətası:', error);
    }
}

// Load suspicious users
async function loadSuspiciousUsers() {
    try {
        const res = await fetch('/api/admin/suspicious');
        const users = await res.json();

        const tbody = document.getElementById('suspiciousTableBody');
        tbody.innerHTML = '';

        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="padding: 24px; text-align: center; color: #666;">Şübhəli hesab yoxdur</td></tr>';
            return;
        }

        users.forEach(user => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid #e0e0e0';
            tr.innerHTML = `
                <td style="padding: 12px;">${user.id}</td>
                <td style="padding: 12px;">${user.full_name}</td>
                <td style="padding: 12px;">${user.email}</td>
                <td style="padding: 12px;">
                    <span style="padding: 4px 8px; border-radius: 4px; background: #ef4444; color: white; font-weight: 600;">
                        ${user.report_count}
                    </span>
                </td>
                <td style="padding: 12px;">
                    <span style="padding: 4px 8px; border-radius: 4px; background: ${user.is_active ? '#10b981' : '#ef4444'}; color: white; font-size: 12px;">
                        ${user.is_active ? 'Aktiv' : 'Deaktiv'}
                    </span>
                </td>
                <td style="padding: 12px;">
                    <button onclick="toggleUserStatus(${user.id})" style="background: #667eea; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">
                        ${user.is_active ? 'Deaktiv et' : 'Aktiv et'}
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Şübhəli hesablar yüklənmə xətası:', error);
    }
}

// Toggle user status
async function toggleUserStatus(userId) {
    try {
        const res = await fetch(`/api/admin/users/${userId}/toggle`, {
            method: 'PUT'
        });

        if (res.ok) {
            // Reload current tab
            const activeContent = document.querySelector('[id$="Content"]:not(.hidden)');
            if (activeContent.id === 'adminUsersContent') {
                await loadAdminUsers();
            } else if (activeContent.id === 'adminSuspiciousContent') {
                await loadSuspiciousUsers();
            }
        }
    } catch (error) {
        alert('Xəta baş verdi');
    }
}

// Load admin settings
async function loadAdminSettings() {
    try {
        const res = await fetch('/api/admin/settings');
        const settings = await res.json();

        document.getElementById('settingTopicOfDay').value = settings.topic_of_day || '';
        document.getElementById('settingRules').value = settings.rules || '';
        document.getElementById('settingAbout').value = settings.about || '';
        document.getElementById('settingFilterWords').value = settings.filter_words || '';

        const groupExpiry = parseInt(settings.group_message_expiry_minutes) || 0;
        const privateExpiry = parseInt(settings.private_message_expiry_minutes) || 0;

        document.getElementById('settingGroupExpiry').value = groupExpiry;
        document.getElementById('settingPrivateExpiry').value = privateExpiry;
    } catch (error) {
        console.error('Parametrlər yüklənmə xətası:', error);
    }
}

// Save admin settings
async function saveAdminSettings() {
    try {
        const topicOfDay = document.getElementById('settingTopicOfDay').value;
        const rules = document.getElementById('settingRules').value;
        const about = document.getElementById('settingAbout').value;
        const filterWords = document.getElementById('settingFilterWords').value;

        let groupExpiry = parseInt(document.getElementById('settingGroupExpiry').value) || 0;
        let privateExpiry = parseInt(document.getElementById('settingPrivateExpiry').value) || 0;

        const groupUnit = document.getElementById('settingGroupExpiryUnit').value;
        const privateUnit = document.getElementById('settingPrivateExpiryUnit').value;

        if (groupUnit === 'hours') groupExpiry *= 60;
        if (privateUnit === 'hours') privateExpiry *= 60;

        const res = await fetch('/api/admin/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                topic_of_day: topicOfDay,
                rules,
                about,
                filter_words: filterWords,
                group_message_expiry_minutes: groupExpiry.toString(),
                private_message_expiry_minutes: privateExpiry.toString()
            })
        });

        if (res.ok) {
            alert('Parametrlər saxlanıldı');
        } else {
            alert('Xəta baş verdi');
        }
    } catch (error) {
        alert('Server xətası');
    }
}

// Create sub admin
async function createSubAdmin() {
    const username = document.getElementById('newAdminUsername').value.trim();
    const password = document.getElementById('newAdminPassword').value;

    if (!username || !password) {
        alert('Bütün sahələri doldurun');
        return;
    }

    try {
        const res = await fetch('/api/admin/create-sub-admin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (res.ok) {
            alert('Alt admin yaradıldı');
            document.getElementById('newAdminUsername').value = '';
            document.getElementById('newAdminPassword').value = '';
        } else {
            const data = await res.json();
            alert(data.error || 'Xəta baş verdi');
        }
    } catch (error) {
        alert('Server xətası');
    }
}
