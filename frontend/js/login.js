document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const loginMessage = document.getElementById("loginMessage");
    const passwordInput = document.getElementById("password");
    const togglePassword = document.getElementById("togglePassword");
    const notificationBox = document.getElementById("notificationBox");

    if (!loginForm || !passwordInput || !togglePassword) {
        console.error("Satu atau lebih elemen form login tidak ditemukan!");
        return;
    }

    function showNotification(message, type = 'success') {
        if(notificationBox) {
            notificationBox.innerHTML = message;
            notificationBox.className = 'notification';
            notificationBox.classList.add(type === 'success' ? 'notif-success' : 'notif-warning', 'show');
            setTimeout(() => {
                notificationBox.classList.remove('show');
            }, 3000);
        }
    }

    loginForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const loginButton = document.getElementById("loginButton"); 
        loginMessage.textContent = "";
        loginMessage.className = "login-message";

        const username = document.getElementById("username").value.trim();
        const password = passwordInput.value.trim();
        
        // Perbaikan: Lakukan validasi di awal. Jika gagal, kembalikan tombol.
        if (!username || !password) {
            loginMessage.textContent = "❗ Username dan password harus diisi.";
            loginMessage.classList.add("error");
            return; // Berhenti di sini, tombol tidak akan stuck
        }

        // Sekarang kita aman untuk mengubah status tombol
        loginButton.textContent = "Loading...";
        loginButton.disabled = true;

        const loginData = { username, password };

        try {
            const response = await fetch('http://localhost:3000/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(loginData),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Terjadi kesalahan');
            }

            loginMessage.textContent = "✅ Login berhasil! Mengarahkan...";
            loginMessage.classList.add("success");
            
            localStorage.setItem("isLoggedIn", "true");
            localStorage.setItem("loggedInUser", result.user.username);
            localStorage.setItem("currentUser", JSON.stringify(result.user));

            setTimeout(() => {
                window.location.href = "dashboard.html";
            }, 1500);

        } catch (error) {
            console.error("Login gagal:", error);
            loginMessage.textContent = `❗ ${error.message}`;
            loginMessage.classList.add("error");
        } finally {
            loginButton.textContent = "Login";
            loginButton.disabled = false;
        }
    });

    if (togglePassword) {
        togglePassword.addEventListener("click", () => {
            const isPassword = passwordInput.type === "password";
            passwordInput.type = isPassword ? "text" : "password";
            togglePassword.classList.toggle("fa-eye");
            togglePassword.classList.toggle("fa-eye-slash");
        });
    }

    const notificationMessage = sessionStorage.getItem("notification");
    if (notificationMessage) {
        showNotification(`✅ ${notificationMessage}`);
        sessionStorage.removeItem("notification");
    }
});