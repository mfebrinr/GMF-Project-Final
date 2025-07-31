document.addEventListener("DOMContentLoaded", () => {
    let currentUser = JSON.parse(localStorage.getItem("currentUser"));
    const notificationBox = document.getElementById("notificationBox");

    function showNotification(message, type = 'success') {
        if(notificationBox) {
            notificationBox.innerHTML = message;
            notificationBox.className = 'notification';
            notificationBox.classList.add(type === 'success' ? 'notif-success' : 'notif-warning', 'show');
            setTimeout(() => {
                notificationBox.classList.remove('show');
            }, 3000);
        } else {
            alert(message);
        }
    }
    
    function populateProfileData() {
        if (currentUser && currentUser.username) {
            document.getElementById("profileAvatar").textContent = currentUser.username.charAt(0).toUpperCase();
            document.getElementById("profileUsernameDisplay").textContent = currentUser.username;
            document.getElementById("profileIdDisplay").textContent = `ID Pegawai: ${currentUser.id}`;
            document.getElementById("displayId").textContent = currentUser.id;
            document.getElementById("displayUsername").textContent = currentUser.username;
            document.getElementById("displayPhone").textContent = currentUser.phone;
        } else {
            showNotification("Sesi tidak valid, silakan login kembali.", "warning");
            setTimeout(() => { window.location.href = "index.html"; }, 2000);
        }
    }

    const toggleEditPassword = document.getElementById("toggleEditPassword");
    const editPasswordInput = document.getElementById("editPassword");
    if (toggleEditPassword && editPasswordInput) {
        toggleEditPassword.addEventListener("click", () => {
            const isPassword = editPasswordInput.type === "password";
            editPasswordInput.type = isPassword ? "text" : "password";
            toggleEditPassword.classList.toggle("fa-eye");
            toggleEditPassword.classList.toggle("fa-eye-slash");
        });
    }

    const showModal = (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove("hidden");
    };
    const hideModal = (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.add("hidden");
    };

    document.querySelectorAll('.modal-close-btn, .btn-secondary').forEach(button => {
        button.addEventListener('click', () => {
            const modalId = button.getAttribute('data-modal-id');
            if(modalId) hideModal(modalId);
        });
    });

    const openEditModalBtn = document.getElementById("openEditModalBtn");
    const editProfileForm = document.getElementById("editProfileForm");
    if (openEditModalBtn) {
        openEditModalBtn.addEventListener("click", () => {
            document.getElementById("editId").value = currentUser.id;
            document.getElementById("editUsername").value = currentUser.username;
            document.getElementById("editPhone").value = currentUser.phone;
            document.getElementById("editPassword").value = "";
            showModal("editProfileModal");
        });
    }

    if (editProfileForm) {
        editProfileForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const newUsername = document.getElementById("editUsername").value.trim();
            const newPhone = document.getElementById("editPhone").value.trim();
            const newPassword = document.getElementById("editPassword").value;

            const updatedData = {
                username: newUsername,
                phone: newPhone,
            };

            if (newPassword) {
                if (newPassword.length < 4) {
                    showNotification("Password baru minimal 4 karakter.", "warning");
                    return;
                }
                updatedData.password = newPassword;
            }

            try {
                const response = await fetch(`http://localhost:3000/api/users/${currentUser.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedData)
                });

                const result = await response.json();
                if (!response.ok) {
                    throw new Error(result.error || 'Gagal memperbarui profil.');
                }

                localStorage.setItem("currentUser", JSON.stringify(result.user));
                localStorage.setItem("loggedInUser", result.user.username);

                populateProfileData(); 
                hideModal("editProfileModal");
                showNotification("✅ Profil berhasil diperbarui!");
                document.getElementById("loggedInUser").textContent = result.user.username;

            } catch (error) {
                showNotification(error.message, "warning");
            }
        });
    }

    const openDeleteModalBtn = document.getElementById("openDeleteModalBtn");
    const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
    if (openDeleteModalBtn) {
        openDeleteModalBtn.addEventListener("click", () => {
            showModal("deleteConfirmModal");
        });
    }
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener("click", async () => {
            try {
                const response = await fetch(`/api/users/${currentUser.id}`, {
                    method: 'DELETE'
                });

                const result = await response.json();
                if (!response.ok) {
                    throw new Error(result.error);
                }

                localStorage.clear();
                sessionStorage.setItem("notification", "Akun Anda telah berhasil dihapus.");
                window.location.href = "index.html";

            } catch (error) {
                console.error("Gagal menghapus akun:", error);
                showNotification(error.message, 'warning'); 
            }
        });
    }
    populateProfileData();
});