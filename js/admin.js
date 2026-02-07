// js/admin.js

document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const userListContainer = document.getElementById('user-list');
    const projectListContainer = document.getElementById('project-list');
    const projectForm = document.getElementById('create-project-form');
    let currentUsers = [];

    // Check Admin Role
    auth.onAuthStateChanged(user => {
        if (user) {
            // Verify if user is admin in Firestore
            db.collection('users').doc(user.uid).get().then(doc => {
                if (doc.exists) {
                    const role = doc.data().role;
                    console.log("Admin Check - Role:", role); // Debug

                    if (role === 'admin') {
                        // Is Admin - Load Data
                        loadUsers();
                        loadProjects();
                        loadSiteStats();
                    } else {
                        // Not Admin - Redirect
                        showNotification(`Access Denied: You are logged in as '${role}' (Account: ${user.email}). Redirecting to User Dashboard.`, 'error');
                        window.location.href = 'dashboard.html';
                    }
                } else {
                    console.error("No user document found for ID:", user.uid);
                    showNotification("Account configuration error: No user profile found.", 'error');
                    window.location.href = 'dashboard.html';
                }
            }).catch(error => {
                console.error("Error verifying admin:", error);
                showNotification("Error verifying admin permissions: " + error.message, 'error');
                window.location.href = 'dashboard.html';
            });
        } else {
            console.log("No user signed in on admin page.");
            window.location.href = 'login.html';
        }
    });

    // --- Load Users (Real-time) ---
    function loadUsers() {
        db.collection('users').onSnapshot((querySnapshot) => {
            currentUsers = [];
            userListContainer.innerHTML = ''; // Clear list

            querySnapshot.forEach((doc) => {
                const userData = doc.data();
                userData.id = doc.id; // Add ID to object
                currentUsers.push(userData);

                const userCard = document.createElement('div');
                userCard.className = 'glass-panel user-card';
                userCard.style.padding = '15px';
                userCard.style.marginBottom = '10px';
                userCard.style.display = 'flex';
                userCard.style.justifyContent = 'space-between';
                userCard.style.alignItems = 'center';

                userCard.innerHTML = `
                    <div style="display:flex; align-items:center; gap:15px; flex: 1;">
                        <div style="position:relative;">
                            <img src="${userData.photoURL || 'https://via.placeholder.com/40'}" style="width:40px; height:40px; border-radius:50%; object-fit:cover; border: 2px solid var(--glass-border);">
                            ${userData.role === 'employee' ?
                        `<div style="position:absolute; bottom:0; right:0; width:12px; height:12px; border-radius:50%; border:2px solid #1a1a2e; background-color: ${userData.isOnline ? '#00b894' : '#636e72'};" title="${userData.isOnline ? 'Online' : 'Offline'}"></div>`
                        : ''}
                        </div>
                        <div>
                            <h4 style="margin:0; font-size: 1rem; color: white;">${userData.displayName || userData.username || 'No Name'}</h4>
                            <small style="color:#aaa;">${userData.email}</small>
                        </div>
                    </div>
                    
                    <div style="display:flex; align-items:center; gap:15px;">
                        <!-- Clean Role Selector -->
                        <div style="display:flex; align-items:center; gap:5px; background: rgba(0,0,0,0.3); padding: 5px 10px; border-radius: 8px;">
                            <label style="font-size:0.75rem; color:#888; text-transform:uppercase;">Role:</label>
                            <select class="role-select" data-uid="${doc.id}" style="background:transparent; border:none; color:white; font-family:inherit; cursor:pointer; outline:none;">
                                <option value="user" ${userData.role === 'user' ? 'selected' : ''}>User</option>
                                <option value="employee" ${userData.role === 'employee' ? 'selected' : ''}>Employee</option>
                                <option value="admin" ${userData.role === 'admin' ? 'selected' : ''}>Admin</option>
                            </select>
                        </div>
                        
                        <button class="btn btn-primary btn-sm assign-project-btn" data-uid="${doc.id}" style="padding: 6px 15px; font-size: 0.8rem;">Assign Project</button>
                    </div>
                `;
                userListContainer.appendChild(userCard);
            });

            updateOnlineEmployeesList();

        }, (error) => {
            console.error("Error getting users: ", error);
        });
    }

    // --- Update Online Employees Widget ---
    function updateOnlineEmployeesList() {
        const container = document.getElementById('online-employees-list');
        if (!container) return;

        const onlineEmployees = currentUsers.filter(u => (u.role === 'employee' || u.role === 'admin') && u.isOnline);

        container.innerHTML = '';
        if (onlineEmployees.length === 0) {
            container.innerHTML = '<p style="color:#aaa; font-style:italic; font-size:0.9rem;">No employees online...</p>';
            return;
        }

        onlineEmployees.forEach(user => {
            const el = document.createElement('div');
            el.className = 'glass-panel';
            el.style.padding = '5px 12px';
            el.style.display = 'flex';
            el.style.alignItems = 'center';
            el.style.gap = '10px';
            el.style.borderRadius = '20px';
            el.style.background = 'rgba(255,255,255,0.05)';
            el.style.border = '1px solid var(--glass-border)';

            el.innerHTML = `
                <div style="position:relative;">
                    <img src="${user.photoURL || 'https://via.placeholder.com/30'}" style="width:30px; height:30px; border-radius:50%; object-fit:cover;">
                    <div style="position:absolute; bottom:0; right:0; width:8px; height:8px; border-radius:50%; background-color: #00b894; border:1px solid #1a1a2e;"></div>
                </div>
                <span style="font-size:0.85rem; color:white;">${user.displayName || user.username}</span>
            `;
            container.appendChild(el);
        });
    }

    // --- Populate Modal Dropdowns ---
    function populateModalDropdowns() {
        const clientSelect = document.getElementById('project-client');
        const employeeSelect = document.getElementById('project-employee');

        if (!clientSelect || !employeeSelect) return;

        // Clear existing (keep first loading/default option if you want, but rebuilding is easier)
        clientSelect.innerHTML = '<option value="">-- Select Client --</option>';
        employeeSelect.innerHTML = '<option value="">-- Select Employee --</option>';

        currentUsers.forEach(user => {
            // Populate Clients (Role: User)
            if (user.role === 'user') {
                const opt = document.createElement('option');
                opt.value = user.id;
                opt.innerText = `${user.displayName || user.email} (${user.username || 'User'})`;
                clientSelect.appendChild(opt);
            }

            // Populate Employees (Role: Employee or Admin, AND Online)
            // User Request: "make the available employees based of the onlien employees present"
            if ((user.role === 'employee' || user.role === 'admin') && user.isOnline) {
                const opt = document.createElement('option');
                opt.value = user.id;
                opt.innerText = `🟢 ${user.displayName || user.email}`;
                employeeSelect.appendChild(opt);
            }
        });
    }

    // --- Event Delegation for User Actions ---
    userListContainer.addEventListener('change', (e) => {
        // Change Role via Dropdown
        if (e.target.classList.contains('role-select')) {
            const uid = e.target.getAttribute('data-uid');
            const newRole = e.target.value;
            const previousRole = currentUsers.find(u => u.id === uid).role;

            if (confirm(`Change this user's role from ${previousRole} to ${newRole}?`)) {
                db.collection('users').doc(uid).update({ role: newRole })
                    .catch(error => {
                        console.error("Error updating role:", error);
                        showNotification("Failed to update role", 'error');
                        e.target.value = previousRole; // Revert on fail
                    });
            } else {
                e.target.value = previousRole; // Revert on cancel
            }
        }
    });

    userListContainer.addEventListener('click', (e) => {
        // Assign Project
        if (e.target.classList.contains('assign-project-btn')) {
            const uid = e.target.getAttribute('data-uid');
            openProjectModal(uid);
        }
    });

    // --- Load Projects (Real-time) ---
    function loadProjects() {
        db.collection('projects').orderBy('timestamp', 'desc').onSnapshot((querySnapshot) => {
            projectListContainer.innerHTML = '';
            querySnapshot.forEach((doc) => {
                const project = doc.data();
                const projectCard = document.createElement('div');
                projectCard.className = 'glass-panel project-item';
                projectCard.style.padding = '15px';
                projectCard.style.marginBottom = '10px';

                projectCard.innerHTML = `
                    <div style="display:flex; justify-content:space-between;">
                        <h4>${project.title}</h4>
                        <span class="badge" style="background:rgba(255,255,255,0.1);">${project.status}</span>
                    </div>
                    <p style="font-size:0.9rem; color:#ccc;">${project.description}</p>
                    <div style="margin-top:10px; font-size:0.8rem; color:#aaa; display:flex; gap:15px;">
                        <span>Client: <strong style="color:white;">${project.clientName}</strong></span>
                        <span>Employee: <strong style="color:var(--accent-color);">${project.employeeName}</strong></span>
                    </div>
                `;
                projectListContainer.appendChild(projectCard);
            });
        });
    }

    // --- Modal Logic ---
    // --- Modal Logic ---
    const modal = document.getElementById('project-modal');
    const closeModal = document.querySelector('.close-modal');
    const openCreateBtn = document.getElementById('open-create-project-btn');

    if (openCreateBtn) {
        openCreateBtn.addEventListener('click', () => {
            modal.style.display = 'flex';
        });
    }

    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
        projectForm.reset();
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // --- Create Project ---
    projectForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('project-title').value;
        const desc = document.getElementById('project-desc').value;
        const status = document.getElementById('project-status').value;

        const clientId = document.getElementById('project-client').value;
        const employeeId = document.getElementById('project-employee').value;

        const clientObj = currentUsers.find(u => u.id === clientId);
        const employeeObj = currentUsers.find(u => u.id === employeeId);

        if (clientId && employeeId) {
            db.collection('projects').add({
                title: title,
                description: desc,
                status: status,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),

                // Client Data
                clientId: clientId,
                clientName: clientObj ? (clientObj.displayName || clientObj.email) : 'Unknown',
                clientEmail: clientObj ? clientObj.email : '',

                // Employee Data
                employeeId: employeeId,
                employeeName: employeeObj ? (employeeObj.displayName || employeeObj.email) : 'Unknown',
                employeeEmail: employeeObj ? employeeObj.email : '',

                // Legacy support (optional)
                assignedTo: employeeId

            }).then(() => {
                showNotification('Project Created!', 'success');
                modal.style.display = 'none';
                projectForm.reset();
            }).catch(err => {
                console.error(err);
                showNotification('Error creating project', 'error');
            });
        } else {
            showNotification("Please select both a Client and an Employee.", 'warning');
        }
    });

    // Logout
    document.getElementById('admin-logout').addEventListener('click', () => {
        auth.signOut().then(() => window.location.href = 'index.html');
    });
    // --- Site Stats Logic ---
    const statsForm = document.getElementById('site-stats-form');

    function loadSiteStats() {
        if (!statsForm) return;

        db.collection('site_stats').doc('global').get().then(doc => {
            if (doc.exists) {
                const data = doc.data();
                document.getElementById('stat-projects').value = data.projects || 0;
                document.getElementById('stat-satisfaction').value = data.satisfaction || 0;
                document.getElementById('stat-awards').value = data.awards || 0;
                document.getElementById('stat-experience').value = data.experience || 0;
            } else {
                // Initialize if not exists
                db.collection('site_stats').doc('global').set({ projects: 150, satisfaction: 98, awards: 12, experience: 5 });
            }
        });
    }

    if (statsForm) {
        statsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const projects = parseInt(document.getElementById('stat-projects').value);
            const satisfaction = parseInt(document.getElementById('stat-satisfaction').value);
            const awards = parseInt(document.getElementById('stat-awards').value);
            const experience = parseInt(document.getElementById('stat-experience').value);

            db.collection('site_stats').doc('global').set({
                projects: projects,
                satisfaction: satisfaction,
                awards: awards,
                experience: experience
            }).then(() => {
            }).then(() => {
                showNotification("Site Stats Updated!", 'success');
            }).catch(err => {
                console.error("Error updating stats:", err);
                showNotification("Failed to update stats.", 'error');
            });
        });
    }

    // --- Profile Dropdown Logic (Admin) ---
    const profileBtn = document.querySelector('.nav-profile-btn');
    const dropdown = document.querySelector('.profile-dropdown');

    if (profileBtn && dropdown) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('active');
        });

        document.addEventListener('click', (e) => {
            if (!profileBtn.contains(e.target)) {
                dropdown.classList.remove('active');
            }
        });
    }

    // Set Admin Avatar if available
    auth.onAuthStateChanged(user => {
        if (user && user.photoURL) {
            const adminAvatar = document.getElementById('admin-avatar');
            if (adminAvatar) adminAvatar.src = user.photoURL;
        }
    });

});
