// js/auth.js

document.addEventListener('DOMContentLoaded', () => {

    // --- UI Elements ---
    const authLinksContainer = document.querySelector('.auth-links'); // In navbar
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const logoutBtn = document.getElementById('logout-btn');
    const googleBtn = document.getElementById('google-btn');

    // --- Authentication State Observer ---
    auth.onAuthStateChanged(user => {
        if (user) {
            console.log('User is signed in:', user.email);
            // User is signed in.
            updateNavbarState(true);
        } else {
            console.log('User is signed out');
            // User is signed out.
            updateNavbarState(false);
        }
    });

    // --- Helper to Update Navbar ---
    function updateNavbarState(isLoggedIn) {
        const navList = document.querySelector('.nav-links');
        if (!navList) return;

        // Remove old auth item if exists
        const existingAuthItem = document.getElementById('nav-auth-item');
        if (existingAuthItem) existingAuthItem.remove();

        const existingProfile = document.querySelector('.nav-profile-container');
        if (existingProfile) existingProfile.remove();

        if (isLoggedIn) {
            const user = auth.currentUser;
            const defaultPhoto = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
            const photoURL = user && user.photoURL ? user.photoURL : defaultPhoto;

            // Fetch Role for Correct Link
            db.collection('users').doc(user.uid).get().then(doc => {
                let dashboardLink = 'dashboard.html';
                if (doc.exists) {
                    const role = doc.data().role;
                    if (role === 'admin') dashboardLink = 'admin-dashboard.html';
                    if (role === 'employee') dashboardLink = 'employee-dashboard.html';
                }

                const li = document.createElement('li');
                li.id = 'nav-auth-item';

                const profileContainer = document.createElement('div');
                profileContainer.className = 'nav-profile-container';

                const profileBtn = document.createElement('div');
                profileBtn.className = 'nav-profile-btn';
                profileBtn.innerHTML = `<img src="${photoURL}" alt="Profile">`;

                const dropdown = document.createElement('div');
                dropdown.className = 'profile-dropdown';
                dropdown.innerHTML = `
                    <a href="edit-profile.html">
                        <span>✏️</span> Edit Profile
                    </a>
                    <a href="${dashboardLink}">
                        <span>📊</span> Dashboard
                    </a>
                    <div class="profile-dropdown-divider"></div>
                    <a href="#" id="dropdown-logout">
                        <span>🚪</span> Logout
                    </a>
                `;

                profileBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    dropdown.classList.toggle('active');
                });

                document.addEventListener('click', (e) => {
                    if (!profileContainer.contains(e.target)) {
                        dropdown.classList.remove('active');
                    }
                });

                setTimeout(() => {
                    const logoutLink = dropdown.querySelector('#dropdown-logout');
                    if (logoutLink) {
                        logoutLink.addEventListener('click', (e) => {
                            e.preventDefault();
                            logoutUser();
                        });
                    }
                }, 0);

                profileContainer.appendChild(profileBtn);
                profileContainer.appendChild(dropdown);
                li.appendChild(profileContainer);
                navList.appendChild(li);
            });

        } else {
            if (!window.location.pathname.includes('login.html')) {
                const li = document.createElement('li');
                li.id = 'nav-auth-item';
                const a = document.createElement('a');
                a.href = "login.html";
                a.textContent = "Login";
                li.appendChild(a);
                navList.appendChild(li);
            }
        }
    }

    // --- Login Function ---
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = loginForm['email'].value;
            const password = loginForm['password'].value;

            // Show loading state (optional)
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerText;
            submitBtn.innerText = 'Signing in...';
            submitBtn.disabled = true;

            auth.signInWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    const user = userCredential.user;
                    // Check Role
                    return db.collection('users').doc(user.uid).get();
                })
                .then(doc => {
                    if (doc.exists) {
                        const role = doc.data().role;
                        if (role === 'admin') {
                            window.location.href = 'admin-dashboard.html';
                        } else if (role === 'employee') {
                            window.location.href = 'employee-dashboard.html';
                        } else {
                            window.location.href = 'dashboard.html';
                        }
                    } else {
                        // Legacy User Migration: Create doc and redirect
                        const user = auth.currentUser;
                        return db.collection('users').doc(user.uid).set({
                            email: user.email,
                            role: 'user',
                            photoURL: user.photoURL || null,
                            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                            migratedAt: firebase.firestore.FieldValue.serverTimestamp()
                        }).then(() => {
                            window.location.href = 'dashboard.html';
                        });
                    }
                })
                .catch((error) => {
                    const errorCode = error.code;
                    const errorMessage = error.message;
                    showNotification("Login Failed: " + errorMessage, 'error');
                    submitBtn.innerText = originalText;
                    submitBtn.disabled = false;
                });
        });
    }

    // --- Register Function ---
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = registerForm['username'].value;
            const email = registerForm['email'].value;
            const password = registerForm['password'].value;
            const confirmPassword = registerForm['confirm-password'].value;

            if (password !== confirmPassword) {
                showNotification("Passwords do not match!", 'warning');
                return;
            }

            const submitBtn = registerForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerText;
            submitBtn.innerText = 'Creating Account...';
            submitBtn.disabled = true;

            auth.createUserWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    const user = userCredential.user;
                    // Create User Document in Firestore
                    return db.collection('users').doc(user.uid).set({
                        username: username,
                        displayName: username, // Set displayName to username initially
                        email: email,
                        role: 'user', // Default role
                        photoURL: null,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                })
                .then(() => {
                    // Update Auth Profile Display Name as well
                    const user = auth.currentUser;
                    return user.updateProfile({
                        displayName: username
                    });
                })
                .then(() => {
                    // Redirect to User Dashboard
                    window.location.href = 'dashboard.html';
                })
                .catch((error) => {
                    const errorCode = error.code;
                    const errorMessage = error.message;
                    showNotification("Registration Failed: " + errorMessage, 'error');
                    submitBtn.innerText = originalText;
                    submitBtn.disabled = false;
                });
        });
    }

    // --- Logout Function ---
    function logoutUser() {
        auth.signOut().then(() => {
            // Sign-out successful.
            window.location.href = 'index.html';
        }).catch((error) => {
            // An error happened.
            console.error(error);
        });
    }

    // --- Google Sign In (Optional) ---
    if (googleBtn) {
        googleBtn.addEventListener('click', () => {
            const provider = new firebase.auth.GoogleAuthProvider();
            auth.signInWithPopup(provider)
                .then((result) => {
                    window.location.href = 'index.html';
                }).catch((error) => {
                    console.error(error);
                    showNotification("Google Sign-In Failed: " + error.message, 'error');
                });
        });
    }
});
