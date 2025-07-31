// === FUNGSI UTILITY ===
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

const openEditModal = (alat) => {
    const modalEdit = document.getElementById("editModal");
    if (!modalEdit || !alat) return;

    document.getElementById("editRegistration").value = alat.registration || '';
    document.getElementById("editDescription").value = alat.description || '';
    document.getElementById("editMerk").value = alat.merk || '';
    document.getElementById("editModel").value = alat.model || '';
    document.getElementById("editPn").value = alat.pn || '';
    document.getElementById("editSn").value = alat.sn || '';
    document.getElementById("editUnit").value = alat.unit || '';
    document.getElementById("editUnitDesc").value = alat.unitDesc || alat.unit_desc || '';
    document.getElementById("editLocation").value = alat.location || '';
    
    const nextDue = alat.nextDue || alat.next_due;
    if (nextDue) {
        const dateObj = new Date(nextDue);
        if(!isNaN(dateObj)) {
            document.getElementById("editNextDue").value = dateObj.toISOString().split('T')[0];
        } else {
            document.getElementById("editNextDue").value = '';
        }
    } else {
        document.getElementById("editNextDue").value = '';
    }

    modalEdit.classList.remove('hidden');
};

// === EVENT LISTENER UTAMA UNTUK MEMASTIKAN HALAMAN SELALU TER-UPDATE ===
window.addEventListener('DOMContentLoaded', inisialisasiHalamanAlat);
window.addEventListener('pageshow', function(event) {
    if (event.persisted) {
        console.log("Halaman dimuat dari cache. Inisialisasi ulang.");
        inisialisasiHalamanAlat();
    }
});

// === FUNGSI UTAMA UNTUK MENGINISIALISASI SELURUH HALAMAN ===
async function inisialisasiHalamanAlat() {
    
    let alatList = [];
    let currentDataRegistration = null;
    const itemsPerPage = 10;
    let currentPage = 1;
    let currentFilter = "semua";

    const tableBody = document.querySelector("#alatTable tbody");
    const searchInput = document.getElementById("searchInput");
    const statusFilter = document.getElementById("statusFilter");
    const pagination = document.getElementById("pagination");
    const paginationInfo = document.getElementById("paginationInfo");
    const emptyState = document.getElementById("emptyState");
    const tableElement = document.getElementById("alatTable");
    const modalTambah = document.getElementById("alatModal");
    const modalEdit = document.getElementById("editModal");
    const modalKalibrasi = document.getElementById("kalibrasiModal");
    const modalHapus = document.getElementById("deleteAlatModal");
    const alatForm = document.getElementById("alatForm");
    const editForm = document.getElementById("editForm");
    const kalibrasiForm = document.getElementById("kalibrasiForm");
    const confirmDeleteAlatBtn = document.getElementById("confirmDeleteAlatBtn");
    const btnTambahAlat = document.getElementById("btnTambahAlat");

    try {
        const response = await fetch('http://localhost:3000/api/alat');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        alatList = await response.json();
        console.log("Data yang diterima dari server:", alatList);
    } catch (error) {
        console.error("Gagal mengambil data alat dari server:", error);
        showNotification("Gagal memuat data dari server!", "warning");
    }

    const hitungTenggat = (nextDue) => {
        const now = new Date(); now.setHours(0,0,0,0);
        const due = new Date(nextDue); due.setHours(0,0,0,0);
        const diff = (due - now) / (1000 * 60 * 60 * 24);
        if (diff < 0) return { text: `Lewat ${Math.abs(diff)} hari`, class: 'tenggat-lewat' };
        if (diff === 0) return { text: `Hari Ini`, class: 'tenggat-segera' };
        if (diff <= 7) return { text: `${diff} hari lagi`, class: 'tenggat-segera' };
        return { text: `${Math.ceil(diff)} hari lagi`, class: 'tenggat-aman' };
    };
    const showModal = (modalElement) => { if(modalElement) modalElement.classList.remove('hidden'); };
    const hideModal = (modalElement) => { if(modalElement) modalElement.classList.add('hidden'); };
    const hitungLamaKalibrasi = (mulai, selesai) => {
        const t1 = new Date(mulai);
        const t2 = new Date(selesai);
        const diffMs = t2 - t1;
        const hari = diffMs / (1000 * 60 * 60 * 24);
        return `${Math.ceil(hari)} hari`;
    };

    function renderTable() {
        if (!tableBody) return;
        const keyword = searchInput.value.toLowerCase();
        let filteredData = alatList.filter(alat => {
            const matchesKeyword = Object.values(alat).some(val => String(val).toLowerCase().includes(keyword));
            const matchesFilter = (currentFilter === "semua") || ((alat.status || '-') === currentFilter);
            return matchesKeyword && matchesFilter;
        });

        if (filteredData.length === 0) {
            if(tableElement) tableElement.classList.add('hidden');
            if(pagination) pagination.classList.add('hidden');
            if(paginationInfo) pagination.classList.add('hidden');
            if(emptyState) emptyState.classList.remove('hidden');
            tableBody.innerHTML = "";
            return;
        } else {
            if(tableElement) tableElement.classList.remove('hidden');
            if(pagination) pagination.classList.remove('hidden');
            if(paginationInfo) paginationInfo.classList.remove('hidden');
            if(emptyState) emptyState.classList.add('hidden');
        }

        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const paginatedData = filteredData.slice(start, end);
        tableBody.innerHTML = "";
        paginatedData.forEach(alat => {
            const nextDueValue = alat.nextDue || alat.next_due;
            const status = alat.status || '-';

            const isProcessed = status === "Proses" || status === "Selesai";
            const nextDueDate = nextDueValue ? new Date(nextDueValue) : null;
            
            const displayDate = (!isProcessed && nextDueDate && !isNaN(nextDueDate)) ? nextDueDate.toISOString().split('T')[0] : '-';
            const tenggat = (!isProcessed && nextDueDate && !isNaN(nextDueDate)) ? hitungTenggat(nextDueDate) : { text: '-', class: '' };

            let statusHtml = '-';
            if (status === 'Proses') statusHtml = `<span class="status-badge status-proses">Proses</span>`;
            else if (status === 'Selesai') statusHtml = `<span class="status-badge status-selesai">Selesai</span>`;
            else statusHtml = `<span class="status-badge status-standar">Standar</span>`;

            let aksiHtml = `
                <button class="action-btn edit-btn js-edit" title="Edit" data-registration="${alat.registration}"><i class="fa-solid fa-pen-to-square"></i></button>
                <button class="action-btn delete-btn js-delete" title="Hapus" data-registration="${alat.registration}"><i class="fa-solid fa-trash-can"></i></button>
            `;
            if (status === 'Proses') {
                aksiHtml += `<button class="action-btn complete-btn js-complete" title="Selesaikan Kalibrasi" data-registration="${alat.registration}"><i class="fa-solid fa-check"></i></button>`;
            } else if (status !== 'Selesai') {
                aksiHtml += `<button class="action-btn calibrate-btn js-calibrate" title="Mulai Kalibrasi" data-registration="${alat.registration}"><i class="fa-solid fa-sliders"></i></button>`;
            }
            
            // Logika perbaikan: tampilkan tanggal selesai jika statusnya 'Proses' atau 'Selesai'
            const tanggalSelesaiValue = (alat.tanggalSelesai || alat.tanggal_selesai);
            const tanggalSelesaiDisplay = ((status === 'Selesai' || status === 'Proses') && tanggalSelesaiValue) ? new Date(tanggalSelesaiValue).toISOString().split('T')[0] : '-';

            // Logika perbaikan: tampilkan lama kalibrasi hanya jika statusnya 'Proses' atau 'Selesai'
            const lamaKalibrasiDisplay = ((status === 'Selesai' || status === 'Proses') && (alat.lamaKalibrasi || alat.lama_kalibrasi)) ? (alat.lamaKalibrasi || alat.lama_kalibrasi) : '-';

            const row = document.createElement("tr");
            row.innerHTML = `<td>${alat.registration}</td><td>${alat.description}</td><td>${alat.merk || '-'}</td><td>${alat.model || '-'}</td><td>${alat.pn || '-'}</td><td>${alat.sn || '-'}</td><td>${alat.unit || '-'}</td><td>${alat.unitDesc || alat.unit_desc || '-'}</td><td>${alat.location || '-'}</td><td>${displayDate}</td><td class="${tenggat.class}">${tenggat.text}</td><td>${statusHtml}</td><td>${lamaKalibrasiDisplay}</td><td>${tanggalSelesaiDisplay}</td><td class="kolom-aksi-modern">${aksiHtml}</td>`;
            tableBody.appendChild(row);
        });

        renderPaginationControls(filteredData.length);
        if(paginationInfo) paginationInfo.textContent = `Menampilkan ${paginatedData.length > 0 ? start + 1 : 0} - ${start + paginatedData.length} dari ${filteredData.length} alat`;
    }

    function renderPaginationControls(totalItems) {
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        if(pagination) {
            pagination.innerHTML = "";
            if (totalPages > 1) {
                for (let i = 1; i <= totalPages; i++) {
                    const btn = document.createElement("button");
                    btn.textContent = i;
                    if (i === currentPage) btn.classList.add("active");
                    btn.addEventListener("click", () => {
                        currentPage = i;
                        renderTable();
                    });
                    pagination.appendChild(btn);
                }
            }
        }
    }

    if (tableBody) {
        tableBody.addEventListener('click', async function (event) {
            const button = event.target.closest('.action-btn');
            if (!button) return;

            const registration = button.dataset.registration;
            if (!registration) return;

            currentDataRegistration = registration;
            const alat = alatList.find(alat => alat.registration === registration);
            if (!alat) return;
            
            if (button.classList.contains('js-edit')) {
                openEditModal(alat);
            } else if (button.classList.contains('js-delete')) {
                document.getElementById("namaAlatDihapus").textContent = `"${alat.description}"`;
                document.getElementById("confirmDeleteAlatBtn").dataset.registration = alat.registration;
                showModal(document.getElementById("deleteAlatModal"));
            } else if (button.classList.contains('js-calibrate')) {
                if(kalibrasiForm) kalibrasiForm.reset();
                showModal(document.getElementById("kalibrasiModal"));
            } else if (button.classList.contains('js-complete')) {
                try {
                    const response = await fetch(`http://localhost:3000/api/alat/selesai/${registration}`, { 
                        method: 'PUT' 
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || 'Gagal update status ke server.');
                    }
                    
                    showNotification("✅ Kalibrasi selesai! Mohon perbarui jadwal kalibrasi selanjutnya.", 'success');
                    
                    await inisialisasiHalamanAlat();
                    const updatedAlat = alatList.find(a => a.registration === registration);
                    if (updatedAlat) {
                        setTimeout(() => openEditModal(updatedAlat), 1000);
                    }
                } catch (error) {
                    console.error(error);
                    showNotification(`Gagal menyelesaikan kalibrasi: ${error.message}`, 'warning');
                }
            }
        });
    }

    if(searchInput) searchInput.addEventListener("input", () => { currentPage = 1; renderTable(); });
    if(statusFilter) statusFilter.addEventListener("change", (e) => { currentPage = 1; currentFilter = e.target.value; renderTable(); });
    
    if(btnTambahAlat) btnTambahAlat.addEventListener("click", () => {
        if(alatForm) alatForm.reset();
        showModal(document.getElementById("alatModal"));
    });

    document.querySelectorAll('.modal-close-btn, .btn-secondary').forEach(button => {
        button.addEventListener('click', () => {
            const modalId = button.getAttribute('data-modal-id');
            const modalToHide = document.getElementById(modalId);
            hideModal(modalToHide);
        });
    });

    if(alatForm) alatForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const saveAlatButton = document.getElementById("saveAlatButton");
        saveAlatButton.textContent = "Menyimpan...";
        saveAlatButton.disabled = true;

        const alatBaru = {
            registration: document.getElementById("registration").value.trim(),
            description: document.getElementById("description").value,
            merk: document.getElementById("merk").value,
            model: document.getElementById("model").value,
            pn: document.getElementById("pn").value,
            sn: document.getElementById("sn").value.trim(),
            unit: document.getElementById("unit").value,
            unitDesc: document.getElementById("unitDesc").value,
            location: document.getElementById("location").value,
            nextDue: document.getElementById("nextDue").value,
        };

        if (!alatBaru.registration) {
            showNotification("Kode Registrasi wajib diisi!", "warning");
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/api/alat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(alatBaru),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Gagal menambahkan alat.');
            }

            await inisialisasiHalamanAlat();
            hideModal(document.getElementById("alatModal"));
            showNotification("✅ Alat baru berhasil ditambahkan!");
        } catch (error) {
            console.error("Gagal mengirim data ke server:", error);
            if (error.message.includes("alat_pkey")) {
                showNotification("Gagal: Kode Registrasi sudah digunakan. Harap gunakan kode yang unik.", "warning");
            } else {
                showNotification(error.message, "warning");
            }
        } finally {
            saveAlatButton.textContent = "Simpan Alat";
            saveAlatButton.disabled = false;
        }
    });

    if(editForm) editForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const updateAlatButton = document.getElementById("updateAlatButton");
        updateAlatButton.textContent = "Menyimpan...";
        updateAlatButton.disabled = true;

        const dataDiedit = {
            registration: document.getElementById("editRegistration").value,
            description: document.getElementById("editDescription").value,
            merk: document.getElementById("editMerk").value,
            model: document.getElementById("editModel").value,
            pn: document.getElementById("editPn").value,
            sn: document.getElementById("editSn").value,
            unit: document.getElementById("editUnit").value,
            unitDesc: document.getElementById("editUnitDesc").value,
            location: document.getElementById("editLocation").value,
            nextDue: document.getElementById("editNextDue").value,
        };

        const registrationAsli = currentDataRegistration; 
        if (!registrationAsli) {
            showNotification("Gagal mengidentifikasi alat yang akan diedit.", "warning");
            return;
        }

        try {
            const response = await fetch(`http://localhost:3000/api/alat/${registrationAsli}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataDiedit),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Gagal memperbarui data alat.');
            }

            await inisialisasiHalamanAlat();
            hideModal(document.getElementById("editModal"));
            showNotification("✅ Data alat berhasil diperbarui!");
        } catch (error) {
            console.error("Gagal mengirim pembaruan ke server:", error);
            showNotification(error.message, "warning");
        } finally {
            updateAlatButton.textContent = "Simpan Perubahan";
            updateAlatButton.disabled = false;
        }
    });

    if(kalibrasiForm) kalibrasiForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const registrationUntukDikalibrasi = currentDataRegistration;
        if (!registrationUntukDikalibrasi) return;

        const dataKalibrasi = {
            status: "Proses",
            calibrationStart: document.getElementById("kalMulai").value,
            calibrationEnd: document.getElementById("kalSelesai").value,
            lamaKalibrasi: hitungLamaKalibrasi(document.getElementById("kalMulai").value, document.getElementById("kalSelesai").value)
        };

        if (!dataKalibrasi.calibrationStart || !dataKalibrasi.calibrationEnd || new Date(dataKalibrasi.calibrationStart) > new Date(dataKalibrasi.calibrationEnd)) {
            showNotification("Tanggal tidak valid!", "warning");
            return;
        }

        try {
            const response = await fetch(`http://localhost:3000/api/alat/kalibrasi/${registrationUntukDikalibrasi}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataKalibrasi),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Gagal memulai kalibrasi.');
            }
            await inisialisasiHalamanAlat();
            hideModal(document.getElementById("kalibrasiModal"));
            showNotification("⚙️ Proses kalibrasi berhasil dimulai!");
        } catch (error) {
            console.error("Gagal memulai proses kalibrasi:", error);
            showNotification(error.message, "warning");
        }
    });

    if (confirmDeleteAlatBtn) {
        confirmDeleteAlatBtn.addEventListener("click", async (event) => {
            const deleteButton = event.currentTarget;
            const registrationUntukDihapus = deleteButton.dataset.registration;

            if (!registrationUntukDihapus) {
                showNotification("Gagal menghapus: ID alat tidak ditemukan.", "warning");
                return;
            }

            try {
                deleteButton.disabled = true;
                deleteButton.textContent = "Menghapus...";

                const response = await fetch(`http://localhost:3000/api/alat/${registrationUntukDihapus}`, {
                    method: 'DELETE',
                });

                if (!response.ok && response.status !== 404) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Gagal menghapus alat.');
                }
                
                await inisialisasiHalamanAlat();
                hideModal(document.getElementById("deleteAlatModal"));
                showNotification("🗑️ Alat berhasil dihapus.", "warning");
            } catch (error) {
                console.error("Gagal mengirim permintaan hapus:", error);
                showNotification(error.message, "warning");
            } finally {
                deleteButton.disabled = false;
                deleteButton.textContent = "Ya, Hapus";
            }
        });
    }
    
    renderTable();
}