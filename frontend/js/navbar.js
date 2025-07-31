// --- Bagian Logika Navbar Modern ---
const loggedInUser = localStorage.getItem("loggedInUser");
if (!loggedInUser) {
    alert("❗ Anda harus login terlebih dahulu.");
    window.location.href = "index.html";
    // Hentikan eksekusi sisa skrip jika tidak login
    // Ini penting agar tidak ada error di console
    throw new Error("User not logged in"); 
}
const loggedInUserDisplay = document.getElementById("loggedInUser");
if (loggedInUserDisplay) loggedInUserDisplay.textContent = loggedInUser;

const userAvatar = document.querySelector(".user-avatar");
if (userAvatar) userAvatar.textContent = loggedInUser.charAt(0).toUpperCase();

const dropdownTrigger = document.getElementById("userDropdownTrigger");
const dropdownContent = document.getElementById("userDropdownContent");
if (dropdownTrigger && dropdownContent) {
    dropdownTrigger.addEventListener("click", (event) => {
        event.stopPropagation();
        dropdownContent.style.display = dropdownContent.style.display === "block" ? "none" : "block";
    });
}
window.onclick = function(event) {
    if (dropdownContent && dropdownContent.style.display === 'block') {
        dropdownContent.style.display = "none";
    }
}
const logoutButton = document.getElementById("logoutBtn");
if (logoutButton) {
    logoutButton.addEventListener("click", () => {
        // Hapus semua data sesi
        localStorage.clear(); 
        window.location.href = "index.html";
    });
}
const hamburgerBtn = document.getElementById("hamburgerBtn");
const navLinks = document.getElementById("navLinks");

if (hamburgerBtn && navLinks) {
    hamburgerBtn.addEventListener("click", () => {
        navLinks.classList.toggle("show");
    });
}