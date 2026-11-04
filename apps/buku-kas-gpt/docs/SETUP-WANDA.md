# Buku Kas Wanda: panduan pasang

Buku Kas adalah app pencatat pengeluaran di HP yang menyimpan semuanya ke **Google Sheet milik kamu sendiri**. Otta tidak bisa melihat sheet ini.

- Kamu bisa mencatat seperti chat, misalnya "kopi 25k dan parkir 5k" atau "sayur 87rb berdua". GPT yang memecahnya jadi transaksi lengkap dengan kategori.
- Ada laporan bulanan, runway (berapa bulan saldo cukup), dan tab **Berdua** yang menghitung siapa harus transfer ke siapa dengan Otta.

Waktu pasang: sekitar 20 menit. Cukup sekali.

> Mau dipandu? Buka ChatGPT, tempel isi file `PROMPT-UNTUK-CHATGPT.md`, lalu ikuti langkahnya satu per satu.

## Yang perlu disiapkan

1. **Akun Google** (Gmail).
2. **OpenAI API key** dari https://platform.openai.com/api-keys. Ini **beda dari langganan ChatGPT**: perlu isi kartu di menu Billing, dan biayanya dihitung per pemakaian (satu catatan biasanya jauh di bawah Rp100). Tanpa key, app tetap jalan, tapi pemecah catatannya lebih kaku.
3. **Email Google Otta**, supaya catatan berdua bisa saling dibagikan.

## Langkah 1: bikin sheet

1. Buka https://sheets.new.
2. Ganti judulnya jadi **Buku Kas Wanda**.

## Langkah 2: pasang kode

1. Di sheet itu, klik **Extensions > Apps Script**.
2. Di file `Code.gs`, hapus semua isinya, lalu tempel seluruh isi `apps-script/BukuKas.gs`.
3. Klik **+** di sebelah Files, pilih **HTML**, dan beri nama `Index` (huruf I besar, tanpa `.html`). Hapus isi bawaannya, lalu tempel seluruh isi `apps-script/Index.html`.
4. Simpan dengan Ctrl+S (Mac: Cmd+S).

## Langkah 3: isi pengaturan

Klik ikon gerigi **Project Settings**. Gulir ke **Script properties**, klik **Add script property**, lalu isi:

| Property | Isi |
|---|---|
| `NAMA_SAYA` | `Wanda` |
| `NAMA_PASANGAN` | `Otta` |
| `EMAIL_PASANGAN` | email Google Otta |
| `OPENAI_API_KEY` | key dari OpenAI (diawali `sk-`) |

Klik **Save script properties**.

**Penting:** API key cuma ditempel di sini. Jangan kirim key ke siapa pun, termasuk ke ChatGPT.

## Langkah 4: siapkan sheet

1. Kembali ke editor (ikon `< >`).
2. Di menu dropdown fungsi di atas, pilih `setupSheet`, lalu klik **Run**.
3. Google akan minta izin:
   - Klik **Review permissions** dan pilih akun kamu.
   - Kalau muncul "Google hasn't verified this app", klik **Advanced**, lalu **Go to ... (unsafe)**. Ini normal: app-nya buatan kamu sendiri dan cuma bisa diakses akun kamu.
   - Klik **Allow**.
4. Buka lagi sheet-nya. Sekarang ada tab **Transaksi, Pengaturan, Dashboard, Split**.
5. Di tab **Pengaturan**, isi **Saldo rekening terakhir** (sel kuning). Angka ini dipakai untuk menghitung runway.

## Langkah 5: jadikan app

1. Di Apps Script, klik **Deploy > New deployment**.
2. Klik ikon gerigi di sebelah "Select type", lalu pilih **Web app**. Atur:
   - Description: `Buku Kas`
   - Execute as: **Me**
   - Who has access: **Only myself**
3. Klik **Deploy**, lalu salin **Web app URL**.
4. Buka URL itu di HP. Di iPhone (Safari), pilih tombol Share > **Add to Home Screen**. Di Android (Chrome), pilih menu ⋮ > **Add to Home screen**.

## Langkah 6: sambungkan dengan Otta

1. Buka app sekali. App otomatis membuat file **"Buku Kas Berdua — Wanda"** dan membagikannya ke email Otta.
2. File itu cuma berisi transaksi yang kamu centang **Beban Bersama**. Transaksi pribadi, saldo, dan runway tidak ikut.
3. Kirim link file itu ke Otta. Linknya ada di app: tab **Berdua > Sambungan > Buka file berdua kamu**.
4. Otta akan mengirim link file **"Buku Kas Berdua — Otta"**. Tempel link itu ke Script property `BERDUA_MASUK_ID`.
5. Tab **Berdua** sekarang menghitung siapa transfer ke siapa tiap bulan.

## Cara pakai harian

- **Catat:** ketik di kolom "Catat" di Beranda. Tambahkan kata **berdua** untuk belanja bersama. Bisa banyak sekaligus: "nasi padang 32k dan es teh 8k".
- **Ubah:** tap transaksi untuk ganti kategori atau centang Beban Bersama.
- **Talangan:** kalau kamu membayari orang lain, pilih kategori Talangan & Reimburse. Setelah uangnya diganti, centang "Sudah diganti" supaya tidak terhitung sebagai pengeluaran.

## Masalah umum

| Gejala | Solusi |
|---|---|
| Halaman kosong atau "Script function not found" | Pastikan file HTML bernama `Index` persis dan semua file sudah disimpan. |
| App minta "Siapkan sheet" | Klik tombolnya, atau jalankan `setupSheet` dari editor. |
| "GPT error (401)" | API key salah. Ganti `OPENAI_API_KEY`. |
| "GPT error (429)" | Saldo atau limit OpenAI habis. Cek Billing di platform.openai.com. |
| "GPT error (404)" | Model tidak tersedia. Tambahkan property `OPENAI_MODEL` dengan nama model yang ada di akun kamu. |
| Tab Berdua: file Otta belum bisa dibaca | Minta Otta membagikan filenya ke email kamu, lalu cek link di `BERDUA_MASUK_ID`. |
| Setelah ganti kode, tampilan belum berubah | Deploy > Manage deployments > ikon pensil > Version: **New version** > Deploy. |
