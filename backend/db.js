// db.js (Versi Perbaikan Final yang Benar)
import postgres from 'postgres'
import 'dotenv/config'

const connectionString = process.env.DATABASE_URL

const sql = postgres(connectionString, {
  // Konfigurasi `types` diletakkan di sini, di dalam objek opsi
  types: {
    // Menambahkan parser untuk OID tipe data DATE (1082)
    // yang mengembalikan nilainya sebagai string
    1082: (val) => val
  },
  // Tambahkan opsi 'transform' untuk mengubah snake_case menjadi camelCase
  transform: {
    column: postgres.fromSnake
  }
})

export default sql