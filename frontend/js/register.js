document.addEventListener("DOMContentLoaded", () => {
    // === ELEMEN DOM ===
    const registerForm = document.getElementById("registerForm");
    const togglePassword = document.getElementById("togglePassword");
    const passwordInput = document.getElementById("regPassword");
    const registerMessage = document.getElementById("registerMessage");

    if (!registerForm || !togglePassword || !passwordInput) {
        console.error("Elemen form pendaftaran tidak ditemukan!");
        return;
    }

    // === FITUR TOGGLE PASSWORD ===
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener("click", () => {
            const isPassword = passwordInput.type === "password";
            passwordInput.type = isPassword ? "text" : "password";
            togglePassword.classList.toggle("fa-eye");
            togglePassword.classList.toggle("fa-eye-slash");
        });
    }

    // === FUNGSI VALIDASI ===
    function showFieldError(fieldId, message) {
        const errorField = document.getElementById(`error${fieldId}`);
        const inputField = document.getElementById(`reg${fieldId}`);
        if (errorField) errorField.textContent = message;
        if (inputField) inputField.classList.add("input-error");
    }

    function clearAllErrors() {
        document.querySelectorAll(".error-field").forEach(field => field.textContent = "");
        document.querySelectorAll(".input-error").forEach(field => field.classList.remove("input-error"));
    }

    // === EVENT SUBMIT FORM (DENGAN LOGIKA BARU) ===
    registerForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        clearAllErrors();

        const registerButton = document.getElementById("registerButton");

        // 2. Tambahkan status loading
        registerButton.textContent = "Mendaftar...";
        registerButton.disabled = true;

        // 1. Kumpulkan data dari form
        const newUser = {
            id: document.getElementById("regId").value.trim(),
            username: document.getElementById("regUsername").value.trim(),
            password: passwordInput.value,
            phone: document.getElementById("regPhone").value.trim(),
        };
        
        // Validasi frontend (tetap ada sebagai lapisan pertama)
        if (!newUser.id || !newUser.username || !newUser.password || !newUser.phone) {
            alert("Semua kolom wajib diisi!");
            return;
        }
        if (newUser.password.length < 4) {
            showFieldError("Password", "Password minimal 4 karakter.");
            return;
        }
        if (!/^08[0-9]{8,12}$/.test(newUser.phone)) {
            showFieldError("Phone", "Format Nomor HP tidak valid.");
            return;
        }
        
        try {
            // 2. Kirim data ke server menggunakan fetch
            const response = await fetch('http://localhost:3000/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newUser),
            });

            const result = await response.json();

            if (!response.ok) {
                // Jika server merespons dengan error, tampilkan pesannya
                throw new Error(result.error || 'Terjadi kesalahan saat mendaftar.');
            }

            // 3. Jika berhasil, tampilkan pesan sukses dan arahkan ke halaman login
            if (registerMessage) {
                registerMessage.textContent = "✅ Akun berhasil dibuat! Mengarahkan ke halaman login...";
                registerMessage.classList.add("success");
            }
            
            setTimeout(() => {
                window.location.href = "index.html";
            }, 2000);

        } catch (error) {
            console.error("Gagal mendaftar:", error);
            if (registerMessage) {
                registerMessage.textContent = `❗ ${error.message}`;
                registerMessage.classList.add("error");
            }
        } finally {
            // 3. Tambahkan blok finally untuk mengembalikan tombol
            registerButton.textContent = "Daftar Akun";
            registerButton.disabled = false;
        }
    });
});
