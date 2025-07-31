import axios from 'axios';
import 'dotenv/config';

const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

// Mengatur URL API secara dinamis
const apiUrl = `https://graph.facebook.com/v19.0/${phoneId}/messages`;

export async function sendWhatsAppReminder(toPhoneNumber, toolData) {
    if (!phoneId || !accessToken) {
        console.error('Kredensial WhatsApp tidak lengkap. Pengiriman notifikasi dibatalkan.');
        return;
    }
    
    let formattedPhoneNumber = toPhoneNumber.replace(/\D/g, ''); // Hapus semua non-digit
    
    // --- Perbaikan di sini: Mengganti '0' di awal dengan '62' ---
    if (formattedPhoneNumber.startsWith('0')) {
        formattedPhoneNumber = '62' + formattedPhoneNumber.substring(1);
    }
    
    const to = `+${formattedPhoneNumber}`; // Tambahkan prefix '+'

    // --- Perbaikan di sini: Mengakses properti dengan aman ---
    const nextDue = toolData.nextDue || toolData.next_due;
    const nextDueDate = nextDue ? new Date(nextDue).toISOString().split('T')[0] : 'N/A';

    const messageBody = `
    🔔 *Pengingat Kalibrasi* 🔔
    Halo! Alat dengan detail berikut akan jatuh tempo 7 hari lagi:
    - *Nama Alat*: ${toolData.description}
    - *Registrasi*: ${toolData.registration}
    - *Next Due*: ${nextDueDate}

    Silakan siapkan alat untuk kalibrasi.
    `;

    try {
        await axios.post(
            apiUrl,
            {
                messaging_product: 'whatsapp',
                to: to,
                type: 'text',
                text: {
                    body: messageBody,
                },
            },
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        console.log(`Notifikasi berhasil dikirim ke ${to} untuk alat ${toolData.registration}`);
    } catch (error) {
        console.error(`Gagal mengirim notifikasi ke ${to}:`, error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
    }
}