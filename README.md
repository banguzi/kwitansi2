# Kwitansi Thermal 58mm

Aplikasi web/PWA **offline-first** untuk membuat dan mencetak lima jenis
dokumen keuangan pada printer thermal 58mm:

- Kwitansi
- Nota
- Bon
- Bukti Pembayaran
- Bukti Serah Terima Uang

Dibangun murni dengan **HTML, CSS, dan JavaScript vanilla** — tanpa
framework, tanpa server, tanpa database, tanpa CDN. Semua library dan aset
adalah file lokal di dalam folder ini.

---

## 1. Daftar File

| File                     | Fungsi                                                        |
|---------------------------|----------------------------------------------------------------|
| `index.html`              | Struktur halaman & form                                        |
| `styles.css`               | Tampilan layar + stylesheet cetak (`@media print`)              |
| `app.js`                  | Logika aplikasi (form dinamis, rupiah, terbilang, draft, cetak) |
| `manifest.webmanifest`    | Metadata PWA (nama, ikon, mode standalone)                       |
| `sw.js`                   | Service worker untuk cache offline                               |
| `icon.svg`                | Ikon aplikasi (vektor, lokal, tanpa dependensi eksternal)         |
| `README.md`               | Dokumen ini                                                      |

---

## 2. Cara Menjalankan

Aplikasi ini adalah **website statis** — tidak butuh Node.js, build tool,
atau proses instalasi apa pun. Cukup sajikan folder ini lewat HTTP(S) server
apa saja, misalnya:

- Ekstensi "Live Server" di VS Code, atau
- `python3 -m http.server 8080` dari dalam folder ini, lalu buka
  `http://localhost:8080`, atau
- Unggah seluruh folder ke hosting statis apa pun (GitHub Pages, Netlify,
  Vercel, hosting cPanel, dsb).

> **Catatan penting:** Service worker (dan karenanya mode offline serta
> instalasi PWA "Add to Home Screen") hanya aktif jika halaman diakses lewat
> **HTTPS** atau **`http://localhost`**. Membuka `index.html` langsung dari
> `file://` di sebagian browser akan membuat form tetap berfungsi, namun
> pendaftaran service worker biasanya gagal (ini normal dan tidak
> menghentikan aplikasi).

Setelah dibuka sekali secara online/localhost dan service worker aktif,
aplikasi bisa dibuka kembali dalam kondisi offline penuh.

---

## 3. Alur Pemakaian

1. Buka **⚙️ Pengaturan Usaha & Cetak** untuk mengisi nama usaha, alamat,
   nomor telepon, catatan kaki struk, lebar konten cetak (48/50/52mm),
   kalibrasi posisi cetak, dan orientasi cetak. Data ini otomatis
   tersimpan di `localStorage` perangkat.
2. Pilih **Jenis Dokumen** di bagian atas form.
3. Isi field yang muncul. Field bertanda wajib akan divalidasi sebelum
   cetak.
4. Untuk Nota/Bon, gunakan tombol **+ Tambah Item** untuk menambah baris
   barang. Subtotal dan total dihitung otomatis.
5. Pratinjau di sisi kanan (atau di bawah pada layar sempit) akan
   diperbarui secara langsung mengikuti isian form.
6. Klik **🖨️ Cetak** — aplikasi akan memvalidasi form, menampilkan
   petunjuk memilih printer (sekali, bisa dimatikan), lalu memanggil
   dialog cetak bawaan browser (`window.print()`).
7. **💾 Simpan Draft** menyimpan seluruh isian form (termasuk item nota/bon)
   ke `localStorage` dengan nama yang bisa Anda tentukan. **📂 Muat Draft**
   menampilkan daftar draft tersimpan untuk dimuat kembali atau dihapus.
8. **💬 Bagikan ke WhatsApp** memvalidasi form yang sama seperti Cetak,
   lalu membuka WhatsApp (aplikasi di HP atau WhatsApp Web di desktop)
   dengan teks dokumen yang sudah disusun rapi dan siap dikirim ke kontak
   pilihan Anda — cocok untuk mengirim bukti transaksi secara digital
   selain/tanpa mencetak fisik.
9. **🗑️ Bersihkan** mengosongkan form (dengan konfirmasi) tanpa menghapus
   pengaturan usaha maupun draft tersimpan. Form **tidak** otomatis
   terhapus setelah mencetak.

### 3.1 Mengatasi Hasil Cetak Mepet ke Salah Satu Sisi

Beberapa printer/driver melaporkan lebar kertas yang sedikit berbeda dari
58mm nominal, sehingga struk bisa tercetak mepet ke kiri atau kanan.
Aplikasi ini sudah memusatkan konten secara otomatis, namun jika hasil
cetak fisik Anda masih miring ke satu sisi:

1. Buka **⚙️ Pengaturan Usaha & Cetak > Kalibrasi Posisi Cetak**.
2. Jika struk mepet ke **kiri**, pilih opsi **"Geser ke kanan"** (mulai
   dari 1mm), lalu cetak ulang selembar untuk melihat hasilnya.
3. Jika struk mepet ke **kanan**, pilih opsi **"Geser ke kiri"**.
4. Ulangi dengan nilai berbeda (1–3mm) sampai hasil cetak fisik terlihat
   center. Nilai ini tersimpan otomatis dan berlaku untuk semua cetakan
   berikutnya di perangkat ini.

Jika setelah kalibrasi hasil masih belum rapi, coba juga turunkan **Lebar
Konten Cetak** ke 48mm — beberapa printer 58mm murah punya area cetak
efektif yang lebih sempit dari 58mm penuh.

### 3.2 Orientasi Cetak (Portrait / Landscape)

Hampir semua printer thermal 58mm mencetak dalam **Portrait** (bawaan
aplikasi ini). Opsi **Landscape** di Pengaturan disediakan khusus untuk
kasus tertentu di mana driver/print service (terutama sebagian print
service generik di Android) memaksa orientasi Landscape agar mau
mengeluarkan kertas — biasanya ditandai hasil cetak yang aneh/kepotong
saat memakai Portrait. Jika printer Anda mencetak normal di Portrait,
**biarkan pengaturan ini apa adanya** dan jangan diubah ke Landscape.

Data transaksi hanya tersimpan permanen jika Anda menekan **Simpan Draft**.
Selain itu, data hanya ada sementara di memori browser selama halaman
terbuka.

---

## 4. Batasan Teknis & Cara Mencetak ke Printer Thermal

### 4.1 Kenapa tidak pakai Web Bluetooth / Bluetooth Classic SPP?

Sebagian besar printer thermal 58mm murah menggunakan profil **Bluetooth
Classic SPP (Serial Port Profile)**. Web Bluetooth API di browser **hanya**
mendukung **Bluetooth Low Energy (BLE)** dan **tidak dapat** membuka koneksi
SPP langsung dari halaman web. Karena itu aplikasi ini **tidak** mencoba
menghubungkan printer via Bluetooth dari dalam browser, dan **tidak**
mengklaim mampu memilih atau menyambungkan printer Bluetooth secara
langsung.

### 4.2 Cara kerja pencetakan di aplikasi ini

Aplikasi memakai jalur yang didukung penuh oleh semua browser modern:

1. Printer thermal dipasangkan/di-install terlebih dahulu sebagai
   **printer sistem operasi** (lihat langkah per platform di bawah).
2. Tombol **Cetak** memanggil `window.print()`.
3. Browser menampilkan dialog cetak bawaan sistem, tempat Anda memilih
   printer thermal yang sudah terpasang tersebut.
4. Struk dicetak sesuai `styles.css` bagian `@media print`, yang:
   - Mengatur ukuran halaman `58mm auto` lewat `@page`.
   - Hanya menampilkan elemen pratinjau struk (`#receipt-preview`),
     menyembunyikan seluruh form, tombol, dan navigasi.
   - Menggunakan font monospace, teks hitam murni tanpa latar belakang.
   - Menjaga blok penting (item, tanda tangan) agar tidak terpotong
     antar-halaman (`page-break-inside: avoid`).

### 4.3 Tentang ESC/POS dan cetak tanpa dialog

Aplikasi ini **tidak** mengirim perintah ESC/POS (termasuk perintah potong
kertas otomatis) karena browser tidak menyediakan akses tingkat rendah ke
port printer maupun perintah cut dari halaman web biasa.

Jika Anda memerlukan:
- pencetakan **tanpa dialog** (silent printing),
- kontrol ESC/POS langsung (mis. potong kertas otomatis, buka laci kasir),
- atau koneksi Bluetooth Classic SPP langsung dari aplikasi,

maka itu memerlukan **aplikasi pendamping / local print bridge** di luar
aplikasi web ini — misalnya aplikasi native Android yang menerima data dari
web lewat WebView/Intent lalu mengirim perintah ESC/POS ke printer, atau
layanan lokal (mis. berbasis USB/Serial) yang dijalankan di komputer kasir.
Ini **di luar cakupan MVP web murni** yang diminta dan sengaja tidak
dibuat di sini agar tidak ada klaim yang menyesatkan tentang kemampuan
browser.

---

## 5. Memasang Printer Thermal 58mm sebagai Printer Sistem

### Windows
1. Hubungkan printer via USB, atau pasangkan via Bluetooth di
   **Settings > Bluetooth & devices**.
2. Install driver dari produsen printer jika tersedia (banyak printer
   thermal generik memakai driver "Generic / Text Only" atau driver ESC/POS
   bawaan Windows).
3. Buka **Settings > Printers & scanners**, pastikan printer muncul dan
   berstatus siap.

### macOS
1. Hubungkan printer via USB, atau pasangkan via **System Settings >
   Bluetooth**.
2. Buka **System Settings > Printers & Scanners**, tambahkan printer
   (`+`), pilih driver yang sesuai (AirPrint generik biasanya cukup untuk
   printer thermal yang mendukungnya).

### Android
1. Pasangkan printer di **Settings > Connected devices > Bluetooth**
   (untuk printer Bluetooth), atau hubungkan via USB (perlu adaptor OTG
   pada sebagian perangkat).
2. Install **plugin/print service** dari produsen printer melalui Play
   Store (mis. layanan cetak thermal generik), lalu aktifkan di
   **Settings > Connected devices > Connection preferences > Printing**.
3. Setelah plugin aktif, printer akan muncul sebagai opsi printer sistem
   di dialog cetak Chrome/browser lain.

> Ketersediaan driver/plugin cetak Bluetooth generik berbeda-beda antar
> merek printer dan versi Android. Jika produsen printer Anda tidak
> menyediakan plugin cetak resmi untuk Android, opsi yang tersisa adalah
> aplikasi pendamping/local print bridge seperti dijelaskan di bagian 4.3.

---

## 6. Instalasi sebagai PWA (Add to Home Screen / Install App)

- **Android (Chrome):** buka menu (⋮) → **Add to Home screen** / **Install
  app**.
- **Desktop (Chrome/Edge):** klik ikon install (⊕) di address bar, atau
  menu (⋮) → **Install [nama aplikasi]**.
- **iOS/iPadOS (Safari):** tombol **Share** → **Add to Home Screen**.
  (Safari punya dukungan PWA/offline yang lebih terbatas dibanding
  Chrome/Edge.)

Setelah terpasang, aplikasi dapat dibuka seperti aplikasi native dan tetap
berfungsi tanpa koneksi internet, karena seluruh file app shell (HTML, CSS,
JS, manifest, ikon) sudah disimpan oleh service worker (`sw.js`) di cache
browser.

---

## 7. Privasi & Penyimpanan Data

- **Tidak ada server** — semua kode berjalan 100% di perangkat pengguna.
- **Tidak ada data yang dikirim keluar** perangkat.
- **Pengaturan usaha** (nama, alamat, telepon, catatan kaki, lebar cetak)
  disimpan di `localStorage` agar tidak perlu diisi ulang setiap kali.
- **Data transaksi** (isian form dokumen) **tidak** disimpan otomatis.
  Data hanya menjadi permanen di `localStorage` jika pengguna menekan
  **Simpan Draft**.
- Menghapus data situs (site data) di browser akan menghapus pengaturan
  dan seluruh draft tersimpan.

---

## 8. Kustomisasi & Pemeliharaan

- **Menambah/mengubah field per jenis dokumen:** edit blok
  `<fieldset class="type-fields" data-for="...">` di `index.html`, lalu
  sesuaikan fungsi `validateForm()` dan `renderPreview()` di `app.js`.
- **Mengubah lebar cetak default:** ubah opsi `<select id="setContentWidth">`
  di `index.html` dan/atau nilai awal `contentWidth` di `loadSettings()`
  pada `app.js`.
- **Memperbarui cache service worker:** setelah mengubah `index.html`,
  `styles.css`, atau `app.js`, naikkan nilai `CACHE_VERSION` di `sw.js`
  agar pengguna lama otomatis mendapat file terbaru.
- **Mengganti ikon:** ganti isi `icon.svg` dengan desain sendiri (tetap
  file SVG lokal), atau tambahkan ikon PNG 192×192 dan 512×512 ke folder
  ini dan daftarkan di `manifest.webmanifest` untuk kompatibilitas maksimal
  di perangkat Android lama yang belum mendukung ikon SVG pada manifest.

---

## 9. Checklist Pengujian

### 9.1 Pengujian Fungsional Umum (Desktop & Android)

- [ ] Semua 5 jenis dokumen dapat dipilih dan menampilkan field yang sesuai.
- [ ] Berpindah jenis dokumen tidak menghapus isian jenis dokumen lain
      (item nota/bon tetap tersimpan di state saat berpindah tab).
- [ ] Input jumlah uang otomatis terformat dengan pemisah ribuan
      (mis. mengetik `150000` menjadi `150.000`).
- [ ] Teks terbilang muncul dan sesuai untuk beberapa nilai uji:
      `0`, `1`, `12`, `20`, `100`, `1.000`, `12.500`, `1.000.000`,
      `2.500.000`, `1.000.000.000`.
- [ ] Nota/Bon: menambah item baru menambah baris; menghapus item
      menghapus baris yang benar; subtotal per baris dan total keseluruhan
      terhitung benar saat qty/harga diubah.
- [ ] Tombol **Otomatis** pada Nomor Dokumen menghasilkan format
      `PREFIX/YYYYMMDD/urutan` dan urutan bertambah tiap kali ditekan pada
      hari & jenis dokumen yang sama.
- [ ] Validasi: mencoba **Cetak** dengan field wajib kosong menampilkan
      pesan error di bawah field terkait dan gagal membuka dialog cetak.
- [ ] Validasi Nota/Bon: mencoba cetak tanpa item valid (nama/qty/harga)
      menampilkan pesan error dan mencegah cetak.
- [ ] Setelah validasi berhasil dan dialog petunjuk cetak muncul, opsi
      **Jangan tampilkan lagi** benar-benar mencegah dialog muncul lagi
      pada percobaan cetak berikutnya.
- [ ] Pratinjau di kanan/bawah selalu sinkron dengan isian form secara
      langsung (tanpa perlu klik tombol apa pun).
- [ ] **Simpan Draft**: draft baru muncul di daftar **Muat Draft** dengan
      nama, jenis dokumen, dan waktu simpan yang benar.
- [ ] **Muat Draft**: memuat draft mengembalikan seluruh isian field dan
      item nota/bon persis seperti saat disimpan.
- [ ] Menghapus draft dari daftar benar-benar menghapusnya secara
      permanen (setelah dikonfirmasi).
- [ ] **Bersihkan**: menampilkan konfirmasi, lalu mengosongkan form
      (termasuk item nota/bon) tanpa menghapus pengaturan usaha maupun
      draft tersimpan.
- [ ] Setelah menekan **Cetak** dan menutup dialog cetak (baik jadi
      mencetak maupun dibatalkan), isian form **tidak hilang**.
- [ ] Pengaturan usaha (nama, alamat, telepon, catatan kaki, lebar cetak)
      tetap ada setelah me-reload halaman.
- [ ] Menutup dan membuka kembali browser tetap mempertahankan pengaturan
      dan draft (karena disimpan di `localStorage`, bukan sesi).

### 9.2 Pengujian Cetak (Print Preview)

- [ ] Buka **Print Preview** browser (Ctrl/Cmd+P) untuk tiap jenis
      dokumen: hanya struk yang tampil, seluruh tombol/form/navigasi
      tersembunyi.
- [ ] Lebar hasil pratinjau cetak konsisten dengan pengaturan lebar
      konten (48/50/52mm) yang dipilih.
- [ ] Tidak ada elemen yang terpotong di tengah pada dokumen dengan
      banyak item (uji dengan menambahkan 15–20 item pada Nota/Bon).
- [ ] Teks tercetak berwarna hitam murni tanpa elemen berwarna atau
      berbayang (bayangan kartu, tombol, dsb tidak ikut tercetak).
- [ ] Font yang tercetak adalah monospace (huruf-huruf sejajar rapi,
      bukan proporsional).
- [ ] Uji kalibrasi: ubah **Kalibrasi Posisi Cetak** ke beberapa nilai
      berbeda dan pastikan pratinjau cetak (Ctrl/Cmd+P) bergeser sesuai
      arah yang dipilih.
- [ ] Uji orientasi: ubah **Orientasi Cetak** ke Landscape, buka Print
      Preview, lalu kembalikan ke Portrait — pastikan tidak ada error di
      console dan @page berubah sesuai pilihan (cek di DevTools atau
      hasil cetak fisik bila printer mendukung).

### 9.2b Pengujian Bagikan ke WhatsApp

- [ ] Menekan **Bagikan ke WhatsApp** dengan field wajib kosong
      menampilkan pesan validasi yang sama seperti tombol Cetak, dan
      tidak membuka jendela baru.
- [ ] Dengan data lengkap, tombol ini membuka tab/aplikasi WhatsApp
      dengan teks dokumen sudah terisi otomatis dan format rapi
      (nominal, terbilang, dan daftar item/total untuk Nota/Bon terbaca
      jelas).
- [ ] Jika pop-up diblokir browser, muncul pesan yang meminta pengguna
      mengizinkan pop-up untuk situs ini.

### 9.3 Pengujian Offline / PWA (Desktop)

- [ ] Buka aplikasi via `http://localhost` atau HTTPS minimal sekali agar
      service worker terpasang (cek di DevTools → Application → Service
      Workers).
- [ ] Aktifkan mode **Offline** di DevTools (Network tab), lalu reload
      halaman — aplikasi tetap tampil dan berfungsi penuh.
- [ ] Ikon **Install** muncul di address bar Chrome/Edge; aplikasi bisa
      diinstal dan dibuka sebagai jendela mandiri (standalone).
- [ ] Setelah mengubah salah satu file dan menaikkan `CACHE_VERSION` di
      `sw.js`, reload dua kali (service worker baru butuh 1 reload untuk
      aktif) menampilkan versi terbaru, dan cache lama otomatis terhapus.

### 9.4 Pengujian Offline / PWA (Android)

- [ ] Buka aplikasi di Chrome Android via HTTPS, tunggu hingga selesai
      dimuat sekali dengan koneksi aktif.
- [ ] Aktifkan **Mode Pesawat**, buka kembali aplikasi (baik dari
      browser maupun dari ikon "Add to Home screen") — form dan pratinjau
      tetap berfungsi normal.
- [ ] **Add to Home screen** berhasil menampilkan ikon aplikasi sendiri
      (bukan ikon generik Chrome) dan membuka dalam mode standalone tanpa
      address bar.
- [ ] Uji cetak nyata: dari dialog cetak Chrome Android, pilih printer
      thermal 58mm yang sudah terpasang (lihat bagian 5), pilih ukuran
      kertas 58mm/roll paper, dan pastikan struk tercetak rapi tanpa
      terpotong di sisi kanan.
- [ ] Uji pada minimal 2 ukuran layar berbeda (ponsel kecil & tablet)
      untuk memastikan form tetap dapat digunakan dengan nyaman
      (responsif, tidak ada elemen terpotong horizontal).
- [ ] Uji dengan keyboard virtual terbuka (saat mengisi field teks) —
      tombol aksi (Cetak, Simpan Draft, dst.) tetap dapat dijangkau dengan
      men-scroll.

### 9.5 Uji Regresi Data

- [ ] Nilai uang sangat besar (mis. Rp 999.999.999) tetap terformat dan
      diterjemahkan ke terbilang dengan benar tanpa error di console.
- [ ] Karakter khusus pada nama (mis. `O'Brien & Co. <Toko>`) tidak merusak
      tampilan pratinjau maupun hasil cetak (harus otomatis di-escape).
- [ ] Baris item dengan nama kosong/qty 0/harga 0 diabaikan dari
      pratinjau dan validasi, tidak dihitung ke total.

---

## 10. Ringkasan Kepatuhan terhadap Batasan Proyek

- ✅ Tidak menggunakan Web Bluetooth / Bluetooth Classic SPP dari browser.
- ✅ Pencetakan sepenuhnya via `window.print()` + `@media print` /
  `@page`.
- ✅ Tidak ada klaim browser dapat memilih/menghubungkan printer Bluetooth
  secara langsung — dokumentasi mengarahkan pengguna memasang printer
  sebagai printer sistem terlebih dahulu.
- ✅ Tidak ada perintah ESC/POS atau perintah cut yang dikirim dari
  aplikasi; kebutuhan tersebut didokumentasikan sebagai memerlukan
  aplikasi pendamping/local print bridge di luar cakupan MVP ini.
- ✅ HTML/CSS/JS vanilla, dapat disajikan sebagai website statis.
- ✅ PWA offline-first dengan `manifest.webmanifest` dan `sw.js`.
- ✅ Tidak ada server, database, framework, atau CDN — seluruh aset
  lokal dalam folder ini.
- ✅ Preferensi (pengaturan usaha, lebar cetak) disimpan di
  `localStorage`; data transaksi hanya tersimpan bila pengguna memilih
  **Simpan Draft**.
