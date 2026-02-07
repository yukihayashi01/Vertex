document.addEventListener('DOMContentLoaded', () => {
    const editForm = document.getElementById('edit-profile-form');
    const nameInput = document.getElementById('display-name');
    const photoInput = document.getElementById('photo-url');
    const avatarPreview = document.getElementById('avatar-preview');
    const avatarOptions = document.querySelectorAll('.avatar-option');

    // 1. Protected Route Check & Populate Data
    auth.onAuthStateChanged(user => {
        if (user) {
            // Populate form
            nameInput.value = user.displayName || '';
            photoInput.value = user.photoURL || '';

            if (user.photoURL) {
                avatarPreview.src = user.photoURL;
                // Highlight if matches preset
                highlightPreset(user.photoURL);
            } else {
                avatarPreview.src = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
            }

        } else {
            // Not logged in
            window.location.href = 'login.html';
        }
    });

    // 2. Live Preview for Image URL
    photoInput.addEventListener('input', () => {
        const url = photoInput.value.trim();
        if (url) {
            avatarPreview.src = url;
            highlightPreset(url);
        }
    });

    // 3. Preset Selection Logic
    avatarOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            const url = opt.getAttribute('data-url');
            photoInput.value = url;
            avatarPreview.src = url;
            highlightPreset(url);
        });
    });

    function highlightPreset(url) {
        avatarOptions.forEach(opt => {
            if (opt.getAttribute('data-url') === url) {
                opt.classList.add('selected');
            } else {
                opt.classList.remove('selected');
            }
        });
    }

    // 4. Handle Save
    editForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const user = auth.currentUser;
        if (!user) return;

        const newName = nameInput.value.trim();
        const newPhoto = photoInput.value.trim();

        const submitBtn = editForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerText;
        submitBtn.innerText = 'Saving...';
        submitBtn.disabled = true;

        // Update Auth Profile
        user.updateProfile({
            displayName: newName,
            photoURL: newPhoto || null
        }).then(() => {
            // ALSO Update Firestore Document
            return db.collection('users').doc(user.uid).update({
                displayName: newName,
                photoURL: newPhoto || null
            });
        }).then(() => {
            // Update successful
            showNotification('Profile Updated Successfully!', 'success');

            // Redirect based on Role
            db.collection('users').doc(user.uid).get().then(doc => {
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
                    window.location.href = 'dashboard.html';
                }
            });
        }).catch((error) => {
            // An error occurred
            console.error(error);
            showNotification('Error updating profile: ' + error.message, 'error');
            submitBtn.innerText = originalText;
            submitBtn.disabled = false;
        });
    });
});
