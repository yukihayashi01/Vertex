// js/dashboard.js

document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const nameDisplay = document.getElementById('dashboard-name');
    const emailDisplay = document.getElementById('dashboard-email');
    const avatarDisplay = document.getElementById('dashboard-avatar');
    const activityContainer = document.querySelector('.recent-activity');
    const statsActive = document.querySelector('.stat-box:nth-child(1) h4');
    const statsCompleted = document.querySelector('.stat-box:nth-child(2) h4');

    // Auth Check & Data Load
    auth.onAuthStateChanged(user => {
        if (user) {
            // Display Basic Info
            emailDisplay.innerText = user.email;
            nameDisplay.innerText = user.displayName || 'User';

            // Generic Photo Logic
            const defaultPhoto = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
            if (user.photoURL) {
                avatarDisplay.src = user.photoURL;
            } else {
                avatarDisplay.src = defaultPhoto;
            }

            // Fetch Projects
            loadUserProjects(user.uid);

            // Check Online Status
            checkOnlineStatus(user.uid);

        } else {
            // Not logged in, redirect
            window.location.href = 'login.html';
        }
    });

    // --- Online Status Logic ---
    const onlineBtn = document.getElementById('online-toggle-btn');
    let isOnline = false;

    function checkOnlineStatus(uid) {
        db.collection('users').doc(uid).onSnapshot(doc => {
            if (doc.exists) {
                isOnline = doc.data().isOnline || false;
                updateOnlineUI();
            }
        });
    }

    function updateOnlineUI() {
        if (isOnline) {
            onlineBtn.innerHTML = '● You represent Online';
            onlineBtn.style.background = '#00b894'; // Green
            onlineBtn.style.color = 'white';
            onlineBtn.style.border = '1px solid #00b894';
            onlineBtn.style.boxShadow = '0 0 15px rgba(0, 184, 148, 0.5)';
        } else {
            onlineBtn.innerHTML = '○ You represent Offline';
            onlineBtn.style.background = '#2d3436'; // Grey
            onlineBtn.style.color = '#b2bec3';
            onlineBtn.style.border = '1px solid #636e72';
            onlineBtn.style.boxShadow = 'none';
        }
    }

    if (onlineBtn) {
        onlineBtn.addEventListener('click', () => {
            const user = auth.currentUser;
            if (user) {
                db.collection('users').doc(user.uid).update({
                    isOnline: !isOnline
                }).catch(err => console.error("Error setting status:", err));
            }
        });
    }

    // Logout Handler
    const dbLogout = document.getElementById('dashboard-logout-btn');
    if (dbLogout) {
        dbLogout.addEventListener('click', () => {
            auth.signOut().then(() => window.location.href = 'index.html');
        });
    }

    // --- Fetch Projects (Real-time) ---
    function loadUserProjects(uid) {
        db.collection('projects')
            .where('employeeId', '==', uid) // Changed to employeeId
            // .orderBy('timestamp', 'desc')
            // .orderBy('timestamp', 'desc') // Removed to avoid index requirement
            .onSnapshot((querySnapshot) => {

                // Reset Activity Container
                activityContainer.innerHTML = '<h3>Assigned Projects</h3>';

                if (querySnapshot.empty) {
                    activityContainer.innerHTML += '<p style="margin-top: 15px; color: rgba(255,255,255,0.6);">No projects assigned yet.</p>';
                    // Reset stats if empty
                    statsActive.innerText = 0;
                    statsCompleted.innerText = 0;
                    return;
                }

                let activeCount = 0;
                let completedCount = 0;

                let projects = [];
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    data.id = doc.id; // useless here but good practice
                    projects.push(data);
                });

                // Client-side Sort
                projects.sort((a, b) => {
                    const timeA = a.timestamp ? a.timestamp.seconds : 0;
                    const timeB = b.timestamp ? b.timestamp.seconds : 0;
                    return timeB - timeA;
                });

                projects.forEach((project) => {
                    if (project.status === 'Completed') {
                        completedCount++;
                    } else {
                        activeCount++;
                    }

                    const projectCard = document.createElement('div');
                    projectCard.className = 'glass-panel';
                    projectCard.style.marginTop = '15px';
                    projectCard.style.padding = '15px';
                    projectCard.style.borderLeft = `4px solid ${getStatusColor(project.status)}`;

                    projectCard.innerHTML = `
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <h4 style="margin:0;">${project.title}</h4>
                            <select class="status-select" data-id="${project.id}" style="background:rgba(0,0,0,0.3); color:${getStatusColor(project.status)}; border:1px solid rgba(255,255,255,0.1); border-radius:4px; padding:2px 5px; font-size:0.8rem;">
                                <option value="Just Started" ${project.status === 'Just Started' ? 'selected' : ''}>Just Started</option>
                                <option value="In Progress" ${project.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                                <option value="Under Review" ${project.status === 'Under Review' ? 'selected' : ''}>Under Review</option>
                                <option value="Completed" ${project.status === 'Completed' ? 'selected' : ''}>Completed</option>
                            </select>
                        </div>
                        <p style="font-size:0.9rem; color:#ddd; margin-top:5px;">${project.description}</p>
                        <div style="margin-top:10px; display:flex; justify-content:space-between; align-items:center;">
                            <small style="color:#aaa;">Client: <strong style="color:white;">${project.clientName || 'Unknown'}</strong></small>
                            <button class="btn btn-outline btn-sm open-chat-btn" data-id="${project.id}" data-title="${project.title}" style="padding:5px 10px; font-size:0.8rem;">Chat 💬</button>
                        </div>
                    `;
                    activityContainer.appendChild(projectCard);
                });

                // Update Stats
                statsActive.innerText = activeCount;
                statsCompleted.innerText = completedCount;

            }, (error) => {
                console.error("Error loading projects: ", error);
            });
    }

    // --- Chat Logic ---
    const chatModal = document.getElementById('chat-modal');
    const chatMessages = document.getElementById('chat-messages');
    const chatForm = document.getElementById('chat-form');
    let currentChatUnsubscribe = null;
    let currentProjectId = null;

    // Open Chat (Delegated) - Now just switches the active project in the side panel
    activityContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('open-chat-btn')) {
            currentProjectId = e.target.getAttribute('data-id');
            const title = e.target.getAttribute('data-title');

            document.getElementById('chat-project-title').innerText = title;
            // chatModal.style.display = 'flex'; // No longer needed

            // Visual feedback on the side panel
            chatModal.style.opacity = '1';

            loadMessages(currentProjectId);
        }
    });

    // Close Chat - Removed or repurposed (maybe clear selection?)
    /*
    document.querySelector('.close-chat').addEventListener('click', () => {
        chatModal.style.display = 'none';
        if (currentChatUnsubscribe) currentChatUnsubscribe();
    });
    */

    // Load Messages
    function loadMessages(projectId) {
        if (currentChatUnsubscribe) currentChatUnsubscribe();

        chatMessages.innerHTML = '<div style="text-align:center; padding:20px;">Loading...</div>';

        currentChatUnsubscribe = db.collection('projects').doc(projectId).collection('messages')
            .orderBy('timestamp', 'asc')
            .onSnapshot(snapshot => {
                chatMessages.innerHTML = '';
                if (snapshot.empty) {
                    chatMessages.innerHTML = '<div style="text-align:center; color:#888; margin-top:20px;">No messages yet.</div>';
                }

                snapshot.forEach(doc => {
                    const msg = doc.data();
                    const isMe = msg.senderId === auth.currentUser.uid;

                    const bubble = document.createElement('div');
                    bubble.style.maxWidth = '70%';
                    bubble.style.padding = '8px 12px';
                    bubble.style.margin = '5px 0';
                    bubble.style.borderRadius = '10px';
                    bubble.style.fontSize = '0.9rem';

                    if (isMe) {
                        bubble.style.alignSelf = 'flex-end';
                        bubble.style.marginLeft = 'auto'; // Force right align
                        bubble.style.background = 'var(--accent-color)';
                        bubble.style.color = 'white';
                    } else {
                        bubble.style.alignSelf = 'flex-start';
                        bubble.style.background = 'rgba(255,255,255,0.1)';
                        bubble.style.color = '#ddd';
                    }

                    bubble.innerHTML = `
                        <div style="font-size:0.7rem; opacity:0.8; margin-bottom:2px;">${msg.senderName}</div>
                        <div>${msg.text}</div>
                    `;
                    chatMessages.appendChild(bubble);
                });
                // Scroll to bottom
                chatMessages.scrollTop = chatMessages.scrollHeight;
            });
    }

    // Send Message
    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('chat-input');
        const text = input.value.trim();

        if (text && currentProjectId) {
            const user = auth.currentUser;
            db.collection('projects').doc(currentProjectId).collection('messages').add({
                text: text,
                senderId: user.uid,
                senderName: user.displayName || 'Employee',
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            input.value = '';
        }
    });

    // --- Event Delegation for Status Update ---
    activityContainer.addEventListener('change', (e) => {
        if (e.target.classList.contains('status-select')) {
            const projectId = e.target.getAttribute('data-id');
            const newStatus = e.target.value;

            // Visual Update immediately (color)
            e.target.style.color = getStatusColor(newStatus);
            e.target.closest('.glass-panel').style.borderLeftColor = getStatusColor(newStatus);

            // Firestore Update
            db.collection('projects').doc(projectId).update({
                status: newStatus
            }).then(() => {
                console.log("Status updated");
            }).catch(err => {
                console.error("Error updating status:", err);
                showNotification("Failed to update status", 'error');
            });
        }
    });

    function getStatusColor(status) {
        switch (status) {
            case 'Just Started': return '#a29bfe';
            case 'In Progress': return '#00cec9';
            case 'Under Review': return '#ffeaa7';
            case 'Completed': return '#00b894';
            default: return '#ffffff';
        }
    }
});
