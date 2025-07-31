// dashboard.js (Versi Perbaikan Final)

// === FUNGSI UTILITY ===
// Fungsi untuk menghitung sisa hari kalibrasi
const hitungTenggat = (nextDue) => {
    if (!nextDue) return { text: '-', class: '' };
    const now = new Date(); now.setHours(0,0,0,0);
    const due = new Date(nextDue); due.setHours(0,0,0,0);
    const diff = (due - now) / (1000 * 60 * 60 * 24);
    if (diff < 0) return { text: `Lewat ${Math.abs(diff)} hari`, class: 'tenggat-lewat' };
    if (diff === 0) return { text: `Hari Ini`, class: 'tenggat-segera' };
    if (diff <= 7) return { text: `${diff} hari lagi`, class: 'tenggat-segera' };
    return { text: `${Math.ceil(diff)} hari lagi`, class: 'tenggat-aman' };
};

// Fungsi untuk menampilkan notifikasi di dashboard
const showNotification = (message, type = 'success') => {
    const notificationBox = document.getElementById("notificationBox");
    if(notificationBox) {
        notificationBox.innerHTML = message;
        notificationBox.className = 'notification';
        notificationBox.classList.add(type === 'success' ? 'notif-success' : 'notif-warning', 'show');
        setTimeout(() => {
            notificationBox.classList.remove('show');
        }, 3000);
    }
};

// === FUNGSI UTAMA UNTUK MENGINISIALISASI HALAMAN DASHBOARD ===
async function inisialisasiDashboard() {
    console.log("Memuat data untuk dashboard...");

    try {
        const response = await fetch('http://localhost:3000/api/alat');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const alatList = await response.json();
        console.log("Data alat berhasil dimuat untuk dashboard:", alatList);
        
        renderStatCards(alatList);
        setupGrafikKalibrasi(alatList);
        renderJadwalKalibrasi(alatList);
        renderStatusKalibrasi(alatList);
        
    } catch (error) {
        console.error("Gagal memuat data dashboard:", error);
        showNotification("Gagal memuat data dari server.", 'warning');
    }
}

// Fungsi baru untuk setup grafik dan filternya
let chartInstance;
const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const bulanFilter = document.getElementById('bulanFilter');
const tahunFilter = document.getElementById('tahunFilter');

function setupGrafikKalibrasi(alatList) {
    if (!bulanFilter || !tahunFilter) return;

    // Mengambil tahun unik dari data tanggal selesai
    const years = [...new Set(alatList
        .filter(alat => alat.tanggalSelesai || alat.tanggal_selesai)
        .map(alat => new Date(alat.tanggalSelesai || alat.tanggal_selesai).getFullYear()))]
        .sort((a, b) => b - a);

    // Mengisi dropdown tahun
    if (years.length > 0) {
        years.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            tahunFilter.appendChild(option);
        });
    }

    // Mengisi dropdown bulan
    monthNames.forEach((name, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = name;
        bulanFilter.appendChild(option);
    });

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    bulanFilter.value = currentMonth;
    tahunFilter.value = currentYear;

    // Render grafik pertama kali
    renderGrafikKalibrasi(alatList, currentMonth, currentYear);

    // Menambahkan event listener
    bulanFilter.addEventListener('change', (e) => {
        renderGrafikKalibrasi(alatList, parseInt(e.target.value), parseInt(tahunFilter.value));
    });

    tahunFilter.addEventListener('change', (e) => {
        renderGrafikKalibrasi(alatList, parseInt(bulanFilter.value), parseInt(e.target.value));
    });
}

function renderGrafikKalibrasi(alatList, selectedMonth, selectedYear) {
    if (chartInstance) { chartInstance.destroy(); }
    const ctx = document.getElementById("grafikKalibrasi").getContext("2d");

    // Filter data berdasarkan bulan dan tahun yang dipilih, dan pastikan ada tanggal selesai
    const filteredData = alatList.filter(alat => {
        const tanggalSelesai = alat.tanggalSelesai || alat.tanggal_selesai;
        if (!tanggalSelesai) return false;
        const selesaiDate = new Date(tanggalSelesai);
        return selesaiDate.getMonth() === selectedMonth && selesaiDate.getFullYear() === selectedYear;
    });

    const weeklyData = [0, 0, 0, 0, 0];
    filteredData.forEach(alat => {
        const tanggalSelesai = alat.tanggalSelesai || alat.tanggal_selesai;
        const selesaiDate = new Date(tanggalSelesai);
        const dayOfMonth = selesaiDate.getDate();
        const weekIndex = Math.floor((dayOfMonth - 1) / 7);
        if (weekIndex < weeklyData.length) {
            weeklyData[weekIndex]++;
        }
    });

    const labels = ["Minggu 1", "Minggu 2", "Minggu 3", "Minggu 4", "Minggu 5"];
    
    chartInstance = new Chart(ctx, {
        type: "bar", 
        data: { 
            labels, 
            datasets: [{ 
                label: "Jumlah Kalibrasi", 
                data: weeklyData, 
                backgroundColor: "#0077b6", 
                borderRadius: 5 
            }] 
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false, 
            plugins: { 
                legend: { display: false } 
            }, 
            scales: { 
                y: { beginAtZero: true, ticks: { stepSize: 1 } } 
            } 
        }
    });
}

function renderStatCards(alatList) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let prosesCount = 0, segeraCount = 0, lewatCount = 0;
    alatList.forEach(alat => {
        const status = alat.status || '-';
        if (status === "Proses") { prosesCount++; }
        else {
            const nextDue = alat.nextDue || alat.next_due;
            if (nextDue) {
                const dueDate = new Date(nextDue);
                const diffDays = Math.floor((dueDate - today) / (1000 * 60 * 60 * 24));
                if (diffDays < 0) lewatCount++;
                else if (diffDays <= 7) segeraCount++;
            }
        }
    });
    document.getElementById("statTotalAlat").textContent = alatList.length;
    document.getElementById("statProses").textContent = prosesCount;
    document.getElementById("statSegeraJatuhTempo").textContent = segeraCount;
    document.getElementById("statLewatTenggat").textContent = lewatCount;
}

function renderJadwalKalibrasi(alatList) {
    const tableBody = document.querySelector("#jadwalKalibrasiTable tbody");
    if (!tableBody) return;

    tableBody.innerHTML = "";
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const data = alatList
        .filter(alat => {
            const status = alat.status || '-';
            if (status === "Proses" || status === "Selesai") return false;

            const nextDue = alat.nextDue || alat.next_due;
            if (!nextDue) return false;

            const nextDueDateObj = new Date(nextDue);
            if(isNaN(nextDueDateObj)) return false;

            const diffDays = (nextDueDateObj - today) / (1000 * 60 * 60 * 24);
            return diffDays <= 7 && diffDays >= 0;
        })
        .sort((a, b) => new Date(a.nextDue || a.next_due) - new Date(b.nextDue || b.next_due));

    if (data.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="3" class="text-center">Tidak ada jadwal kalibrasi terdekat.</td></tr>`;
        return;
    }

    data.forEach(item => {
        const nextDue = item.nextDue || item.next_due;
        const dueDate = new Date(nextDue);
        const diffDays = Math.floor((dueDate - today) / (1000 * 60 * 60 * 24));
        let statusLabel, statusColor;
        if (diffDays < 0) { statusLabel = "Jatuh Tempo"; statusColor = "#d62839"; }
        else if (diffDays === 0) { statusLabel = "Hari Ini"; statusColor = "#f9a825"; }
        else if (diffDays <= 7) { statusLabel = "Segera"; statusColor = "#f9a825"; }
        else { statusLabel = "Aman"; statusColor = "#00b4d8"; }
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${item.description}</td>
            <td>${nextDue ? nextDue.split('T')[0] : '-'}</td>
            <td><span class="status-label" style="background-color:${statusColor}">${statusLabel}</span></td>
        `;
        tableBody.appendChild(row);
    });
}

function renderStatusKalibrasi(alatList) {
    const tableBody = document.querySelector("#statusKalibrasiTable tbody");
    if (!tableBody) return;

    tableBody.innerHTML = "";
    const today = new Date();
    
    const data = alatList.filter(alat => (alat.status || '-') === "Proses");
    
    if (data.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="3" class="text-center">Tidak ada alat yang sedang dalam proses kalibrasi.</td></tr>`;
        return;
    }

    data.forEach(item => {
        const calibrationEnd = item.calibrationEnd || item.calibration_end;
        const selesai = new Date(calibrationEnd);
        const sisaHari = Math.ceil((selesai - today) / (1000 * 60 * 60 * 24));
        
        let sisaWaktuLabel = `✅ Selesai`;
        if (sisaHari > 0) sisaWaktuLabel = `⏳ ${sisaHari} hari lagi`;
        else if (sisaHari === 0) sisaWaktuLabel = `Hari Ini`;
        
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${item.description}</td>
            <td>${calibrationEnd ? calibrationEnd.split('T')[0] : "-"}</td>
            <td>${sisaWaktuLabel}</td>
        `;
        tableBody.appendChild(row);
    });
}

// === EVENT LISTENER UTAMA ===
window.addEventListener('DOMContentLoaded', inisialisasiDashboard);
window.addEventListener('pageshow', function(event) {
    if (event.persisted) {
        console.log("Halaman dimuat dari cache. Inisialisasi ulang.");
        inisialisasiDashboard();
    }
});