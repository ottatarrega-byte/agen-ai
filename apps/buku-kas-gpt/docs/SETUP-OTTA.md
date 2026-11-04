# Buku Kas Otta Wanda: pasang di sheet V2

Versi ini jalan di Google Apps Script, menempel ke **Spending Tracker 2026 V2**. Tidak butuh claude.ai, server, atau Hermes. Catatan bebas ("kopi 25k dan parkir 5k") diurai oleh GPT lewat OpenAI API.

Waktu pasang: sekitar 15 menit.

## Yang perlu disiapkan

- **OpenAI API key** dari platform.openai.com > API keys. Ini terpisah dari langganan ChatGPT: perlu kartu di Billing, dan biayanya dihitung per pemakaian. Satu catatan transaksi biasanya jauh di bawah Rp100. Tanpa key app tetap jalan, hanya saja pakai pengurai lokal yang lebih kaku.
- Email Google Wanda, untuk fitur berdua.

## Langkah

1. Buka sheet **Spending Tracker 2026 V2**, lalu klik **Extensions > Apps Script**. Di situ sudah ada `Code.gs` (Robot V2). **Jangan diubah.**
2. Klik **+** di sebelah Files, pilih **Script**, beri nama `BukuKas`. Hapus isi bawaannya, lalu tempel seluruh isi `apps-script/BukuKas.gs`.
3. Klik **+**, pilih **HTML**, beri nama `Index` (huruf I besar). Hapus isi bawaannya, lalu tempel seluruh isi `apps-script/Index.html`.
4. Simpan (Ctrl+S).
5. Klik ikon gerigi **Project Settings**. Di bagian **Script properties**, tambahkan:

   | Property | Isi |
   |---|---|
   | `NAMA_SAYA` | `Otta` |
   | `NAMA_PASANGAN` | `Wanda` |
   | `EMAIL_PASANGAN` | email Google Wanda |
   | `OPENAI_API_KEY` | key dari OpenAI (`sk-...`) |
   | `OPENAI_MODEL` | opsional, default `gpt-4o-mini`. Isi model lain kalau akun kamu punya yang lebih baru. |

6. Klik **Deploy > New deployment**. Pilih jenis **Web app**, lalu atur:
   - Execute as: **Me**
   - Who has access: **Only myself**

   Klik **Deploy**, setujui izin yang diminta Google, lalu salin **Web app URL**.
7. Buka URL itu di HP. Di Safari, pilih Share > Add to Home Screen. Di Chrome, pilih menu > Add to Home screen.

**Jangan jalankan `setupSheet`** di sheet ini. Tab-tabnya sudah ada.

## Fitur berdua dengan Wanda

- Setiap app dibuka, transaksi yang dicentang **Beban Bersama** diterbitkan ke file baru **"Buku Kas Berdua — Otta"**. File ini otomatis dibagikan ke `EMAIL_PASANGAN` sebagai Viewer.
- File itu cuma berisi tanggal, jam, keterangan, kategori, nominal, dan tanda sementara. Saldo, runway, dan transaksi pribadi tidak ikut.
- Setelah Wanda memasang app-nya, dia akan mengirim link file **"Buku Kas Berdua — Wanda"**. Tempel link itu (boleh link utuh) ke Script property `BERDUA_MASUK_ID`.
- Tab **Berdua** di app lalu menghitung siapa transfer ke siapa per bulan.

## Kalau ganti kode nanti

Tempel kode baru, simpan, lalu klik **Deploy > Manage deployments**. Klik ikon pensil, pilih **Version: New version**, lalu **Deploy**. URL-nya tetap sama.

## Masalah umum

| Gejala | Penyebab dan solusi |
|---|---|
| "Script function not found: doGet" | Nama file HTML harus `Index` persis, dan `BukuKas.gs` harus sudah tersimpan. |
| "GPT error (401)" | Key salah atau sudah dicabut. Ganti `OPENAI_API_KEY`. |
| "GPT error (429)" | Saldo atau limit OpenAI habis. Cek Billing. |
| "GPT error (404)" | Nama model salah. Kosongkan `OPENAI_MODEL` atau isi model yang tersedia. |
| "Baris di sheet sudah bergeser" | Robot atau Hermes baru menambah baris. App memuat ulang sendiri, lalu coba lagi. |
| Tab Berdua: file Wanda belum bisa dibaca | Wanda belum membagikan filenya ke akun Google kamu, atau link di `BERDUA_MASUK_ID` salah. |
