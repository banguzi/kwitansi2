'use strict';

/* =========================================================
   Kwitansi Thermal 58mm — app.js
   Vanilla JS, tanpa dependensi eksternal.
   ========================================================= */

/* ---------------------------------------------------------
   1. UTILITAS: RUPIAH & TERBILANG
   --------------------------------------------------------- */

/** Mengubah string input (bisa mengandung titik/karakter lain) menjadi angka murni. */
function parseRupiah(str) {
  if (!str) return 0;
  const digits = String(str).replace(/[^\d]/g, '');
  if (!digits) return 0;
  const n = parseInt(digits, 10);
  return Number.isNaN(n) ? 0 : n;
}

/** Memformat angka menjadi "150.000" (tanpa prefix Rp). */
function formatRupiahNumber(n) {
  n = Math.max(0, Math.floor(Number(n) || 0));
  return n.toLocaleString('id-ID');
}

/** Memformat angka menjadi "Rp150.000". */
function formatRupiahFull(n) {
  return 'Rp' + formatRupiahNumber(n);
}

const SATUAN = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];

/** Mengubah angka menjadi rangkaian kata bahasa Indonesia (rekursif). */
function angkaKeKata(num) {
  num = Math.floor(Math.abs(num));
  if (num < 12) return SATUAN[num];
  if (num < 20) return angkaKeKata(num - 10) + ' belas';
  if (num < 100) {
    const sisa = num % 10;
    return angkaKeKata(Math.floor(num / 10)) + ' puluh' + (sisa !== 0 ? ' ' + angkaKeKata(sisa) : '');
  }
  if (num < 200) {
    const sisa = num % 100;
    return 'seratus' + (sisa !== 0 ? ' ' + angkaKeKata(sisa) : '');
  }
  if (num < 1000) {
    const sisa = num % 100;
    return angkaKeKata(Math.floor(num / 100)) + ' ratus' + (sisa !== 0 ? ' ' + angkaKeKata(sisa) : '');
  }
  if (num < 2000) {
    const sisa = num % 1000;
    return 'seribu' + (sisa !== 0 ? ' ' + angkaKeKata(sisa) : '');
  }
  if (num < 1000000) {
    const sisa = num % 1000;
    return angkaKeKata(Math.floor(num / 1000)) + ' ribu' + (sisa !== 0 ? ' ' + angkaKeKata(sisa) : '');
  }
  if (num < 1000000000) {
    const sisa = num % 1000000;
    return angkaKeKata(Math.floor(num / 1000000)) + ' juta' + (sisa !== 0 ? ' ' + angkaKeKata(sisa) : '');
  }
  if (num < 1000000000000) {
    const sisa = num % 1000000000;
    return angkaKeKata(Math.floor(num / 1000000000)) + ' miliar' + (sisa !== 0 ? ' ' + angkaKeKata(sisa) : '');
  }
  const sisa = num % 1000000000000;
  return angkaKeKata(Math.floor(num / 1000000000000)) + ' triliun' + (sisa !== 0 ? ' ' + angkaKeKata(sisa) : '');
}

/** Terbilang lengkap dengan kapital di awal dan akhiran "rupiah". */
function terbilangRupiah(n) {
  n = Math.floor(Number(n) || 0);
  if (n <= 0) return '-';
  const kata = angkaKeKata(n).trim().replace(/\s+/g, ' ');
  const kapital = kata.charAt(0).toUpperCase() + kata.slice(1);
  return kapital + ' rupiah';
}

/** Format tanggal "YYYY-MM-DD" -> "26 September 2026". */
function formatTanggalPanjang(isoDate) {
  if (!isoDate) return '-';
  const bulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  const [y, m, d] = parts;
  const mi = parseInt(m, 10) - 1;
  if (mi < 0 || mi > 11) return isoDate;
  return `${parseInt(d, 10)} ${bulan[mi]} ${y}`;
}

function escapeHtml(str) {
  if (str === undefined || str === null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function nl2br(str) {
  return escapeHtml(str).replace(/\n/g, '<br>');
}

/* ---------------------------------------------------------
   2. STORAGE KEYS
   --------------------------------------------------------- */

const LS_SETTINGS = 'trpwa_settings_v1';
const LS_DRAFTS = 'trpwa_drafts_v1';
const LS_COUNTERS = 'trpwa_counters_v1';

const DOC_LABELS = {
  'kwitansi': 'Kwitansi',
  'nota': 'Nota',
  'bon': 'Bon',
  'bukti-pembayaran': 'Bukti Pembayaran',
  'serah-terima': 'Bukti Serah Terima Uang'
};

const DOC_PREFIX = {
  'kwitansi': 'KWT',
  'nota': 'NTA',
  'bon': 'BON',
  'bukti-pembayaran': 'BP',
  'serah-terima': 'BST'
};

/* ---------------------------------------------------------
   3. STATE
   --------------------------------------------------------- */

const state = {
  docType: 'kwitansi',
  items: {
    nota: [],
    bon: []
  }
};

let itemRowSeq = 1;

/* ---------------------------------------------------------
   4. SETTINGS (localStorage)
   --------------------------------------------------------- */

const DEFAULT_SETTINGS = {
  businessName: '',
  businessAddress: '',
  businessPhone: '',
  footerNote: '',
  contentWidth: '50',
  printOffset: '0',
  orientation: 'portrait'
};

function loadSettings() {
  try {
    const raw = localStorage.getItem(LS_SETTINGS);
    if (!raw) return Object.assign({}, DEFAULT_SETTINGS);
    const parsed = JSON.parse(raw);
    return Object.assign({}, DEFAULT_SETTINGS, parsed);
  } catch (e) {
    console.error('Gagal memuat pengaturan:', e);
    return Object.assign({}, DEFAULT_SETTINGS);
  }
}

function saveSettings(settings) {
  try {
    localStorage.setItem(LS_SETTINGS, JSON.stringify(settings));
    return true;
  } catch (e) {
    console.error('Gagal menyimpan pengaturan:', e);
    showToast('Gagal menyimpan pengaturan (penyimpanan penuh atau diblokir).', 'error');
    return false;
  }
}

function getSettingsFromForm() {
  return {
    businessName: document.getElementById('setBusinessName').value.trim(),
    businessAddress: document.getElementById('setBusinessAddress').value.trim(),
    businessPhone: document.getElementById('setBusinessPhone').value.trim(),
    footerNote: document.getElementById('setFooterNote').value.trim(),
    contentWidth: document.getElementById('setContentWidth').value,
    printOffset: document.getElementById('setPrintOffset').value,
    orientation: document.getElementById('setOrientation').value
  };
}

function applySettingsToForm(settings) {
  document.getElementById('setBusinessName').value = settings.businessName || '';
  document.getElementById('setBusinessAddress').value = settings.businessAddress || '';
  document.getElementById('setBusinessPhone').value = settings.businessPhone || '';
  document.getElementById('setFooterNote').value = settings.footerNote || '';
  document.getElementById('setContentWidth').value = settings.contentWidth || '50';
  document.getElementById('setPrintOffset').value = settings.printOffset || '0';
  document.getElementById('setOrientation').value = settings.orientation || 'portrait';
  applyContentWidth(settings.contentWidth || '50');
  applyPrintOffset(settings.printOffset || '0');
  applyPrintOrientation(settings.orientation || 'portrait');
}

function applyContentWidth(mm) {
  document.documentElement.style.setProperty('--content-width', mm + 'mm');
}

/** Menggeser posisi horizontal hasil cetak (mm) untuk kalibrasi printer. */
function applyPrintOffset(mm) {
  document.documentElement.style.setProperty('--print-offset-x', mm + 'mm');
}

/**
 * Menyisipkan/memperbarui aturan @page khusus cetak sesuai orientasi.
 * @page tidak bisa memakai CSS custom property secara andal di semua
 * browser, jadi ditulis ulang lewat <style> yang disisipkan setelah
 * styles.css agar menimpa aturan @page default (portrait) di sana.
 */
function applyPrintOrientation(orientation) {
  let styleEl = document.getElementById('dynamicPrintPageStyle');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'dynamicPrintPageStyle';
    document.head.appendChild(styleEl);
  }
  const sizeValue = orientation === 'landscape' ? '58mm auto landscape' : '58mm auto';
  styleEl.textContent = '@media print { @page { size: ' + sizeValue + '; margin: 0; } }';
}

/* ---------------------------------------------------------
   5. NOMOR OTOMATIS
   --------------------------------------------------------- */

function loadCounters() {
  try {
    const raw = localStorage.getItem(LS_COUNTERS);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function saveCounters(counters) {
  try {
    localStorage.setItem(LS_COUNTERS, JSON.stringify(counters));
  } catch (e) {
    console.error('Gagal menyimpan counter nomor:', e);
  }
}

function generateAutoNumber(docType) {
  const counters = loadCounters();
  const today = new Date();
  const ymd = today.getFullYear().toString() +
    String(today.getMonth() + 1).padStart(2, '0') +
    String(today.getDate()).padStart(2, '0');
  const key = `${docType}_${ymd}`;
  const next = (counters[key] || 0) + 1;
  counters[key] = next;
  saveCounters(counters);
  const prefix = DOC_PREFIX[docType] || 'DOC';
  return `${prefix}/${ymd}/${String(next).padStart(3, '0')}`;
}

/* ---------------------------------------------------------
   6. DYNAMIC FORM: SWITCH DOC TYPE
   --------------------------------------------------------- */

function switchDocType(docType) {
  state.docType = docType;
  document.querySelectorAll('.type-fields').forEach(function (fs) {
    fs.classList.toggle('active', fs.getAttribute('data-for') === docType);
  });
  clearAllFieldErrors();
  renderPreview();
}

/* ---------------------------------------------------------
   7. ITEM TABLE (NOTA / BON)
   --------------------------------------------------------- */

function addItemRow(docType, itemData) {
  const row = itemData || { id: 'row' + (itemRowSeq++), nama: '', qty: 1, harga: 0 };
  state.items[docType].push(row);
  renderItemsTable(docType);
}

function removeItemRow(docType, rowId) {
  state.items[docType] = state.items[docType].filter(function (r) { return r.id !== rowId; });
  renderItemsTable(docType);
}

function renderItemsTable(docType) {
  const tbody = document.getElementById(docType === 'nota' ? 'notaItemsBody' : 'bonItemsBody');
  tbody.innerHTML = '';
  state.items[docType].forEach(function (row) {
    const tr = document.createElement('tr');
    tr.setAttribute('data-row-id', row.id);

    const tdNama = document.createElement('td');
    const inputNama = document.createElement('input');
    inputNama.type = 'text';
    inputNama.placeholder = 'Nama barang';
    inputNama.value = row.nama;
    inputNama.addEventListener('input', function () {
      row.nama = inputNama.value;
      renderPreview();
    });
    tdNama.appendChild(inputNama);

    const tdQty = document.createElement('td');
    tdQty.className = 'qty-cell';
    const inputQty = document.createElement('input');
    inputQty.type = 'number';
    inputQty.min = '0';
    inputQty.step = '1';
    inputQty.value = row.qty;
    inputQty.addEventListener('input', function () {
      row.qty = parseFloat(inputQty.value) || 0;
      updateSubtotalCell(tr, row);
      renderPreview();
    });
    tdQty.appendChild(inputQty);

    const tdHarga = document.createElement('td');
    const inputHarga = document.createElement('input');
    inputHarga.type = 'text';
    inputHarga.inputMode = 'numeric';
    inputHarga.placeholder = '0';
    inputHarga.value = row.harga ? formatRupiahNumber(row.harga) : '';
    inputHarga.addEventListener('input', function () {
      const raw = parseRupiah(inputHarga.value);
      row.harga = raw;
      inputHarga.value = raw ? formatRupiahNumber(raw) : '';
      updateSubtotalCell(tr, row);
      renderPreview();
    });
    tdHarga.appendChild(inputHarga);

    const tdSubtotal = document.createElement('td');
    tdSubtotal.className = 'subtotal-cell';
    tdSubtotal.textContent = formatRupiahFull(row.qty * row.harga);

    const tdRemove = document.createElement('td');
    tdRemove.className = 'remove-cell';
    const btnRemove = document.createElement('button');
    btnRemove.type = 'button';
    btnRemove.className = 'btn-remove-row';
    btnRemove.setAttribute('aria-label', 'Hapus item');
    btnRemove.textContent = '✕';
    btnRemove.addEventListener('click', function () {
      removeItemRow(docType, row.id);
      renderPreview();
    });
    tdRemove.appendChild(btnRemove);

    tr.appendChild(tdNama);
    tr.appendChild(tdQty);
    tr.appendChild(tdHarga);
    tr.appendChild(tdSubtotal);
    tr.appendChild(tdRemove);
    tbody.appendChild(tr);
  });
}

function updateSubtotalCell(tr, row) {
  const cell = tr.querySelector('.subtotal-cell');
  if (cell) cell.textContent = formatRupiahFull(row.qty * row.harga);
}

function getItemsTotal(docType) {
  return state.items[docType]
    .filter(function (r) { return r.nama && r.nama.trim() !== ''; })
    .reduce(function (sum, r) { return sum + (r.qty * r.harga); }, 0);
}

/* ---------------------------------------------------------
   8. MONEY INPUT AUTO-FORMAT + TERBILANG LIVE
   --------------------------------------------------------- */

function setupMoneyInput(input) {
  input.addEventListener('input', function () {
    const raw = parseRupiah(input.value);
    input.value = raw ? formatRupiahNumber(raw) : '';
    updateTerbilangPreview(input.id, raw);
    renderPreview();
  });
}

function updateTerbilangPreview(inputId, raw) {
  const el = document.querySelector('[data-terbilang-for="' + inputId + '"]');
  if (!el) return;
  el.textContent = raw > 0 ? terbilangRupiah(raw) : '';
}

/* ---------------------------------------------------------
   9. VALIDASI
   --------------------------------------------------------- */

function clearAllFieldErrors() {
  document.querySelectorAll('.field-error').forEach(function (el) { el.textContent = ''; });
  document.querySelectorAll('.invalid').forEach(function (el) { el.classList.remove('invalid'); });
}

function setFieldError(fieldId, message) {
  const errorEl = document.querySelector('[data-error-for="' + fieldId + '"]');
  if (errorEl) errorEl.textContent = message;
  const inputEl = document.getElementById(fieldId);
  if (inputEl) inputEl.classList.add('invalid');
}

function val(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function validateForm() {
  clearAllFieldErrors();
  let isValid = true;
  let firstInvalidId = null;

  function fail(fieldId, message) {
    setFieldError(fieldId, message);
    isValid = false;
    if (!firstInvalidId) firstInvalidId = fieldId;
  }

  if (!val('docNumber')) fail('docNumber', 'Nomor dokumen wajib diisi.');
  if (!val('docDate')) fail('docDate', 'Tanggal wajib diisi.');

  const type = state.docType;

  if (type === 'kwitansi') {
    if (!val('kwitansiDari')) fail('kwitansiDari', 'Nama pembayar wajib diisi.');
    if (parseRupiah(val('kwitansiJumlah')) <= 0) fail('kwitansiJumlah', 'Jumlah uang harus lebih dari 0.');
    if (!val('kwitansiUntuk')) fail('kwitansiUntuk', 'Keterangan pembayaran wajib diisi.');
  } else if (type === 'nota' || type === 'bon') {
    const items = state.items[type];
    const validItems = items.filter(function (r) { return r.nama.trim() && r.qty > 0 && r.harga > 0; });
    if (validItems.length === 0) {
      const key = type === 'nota' ? 'notaItems' : 'bonItems';
      fail(key, 'Tambahkan minimal 1 item dengan nama, qty, dan harga yang valid.');
    }
  } else if (type === 'bukti-pembayaran') {
    if (!val('bpDibayarkanOleh')) fail('bpDibayarkanOleh', 'Wajib diisi.');
    if (!val('bpDibayarkanKepada')) fail('bpDibayarkanKepada', 'Wajib diisi.');
    if (parseRupiah(val('bpJumlah')) <= 0) fail('bpJumlah', 'Jumlah harus lebih dari 0.');
    if (!val('bpKeperluan')) fail('bpKeperluan', 'Keperluan wajib diisi.');
  } else if (type === 'serah-terima') {
    if (!val('stMenyerahkan')) fail('stMenyerahkan', 'Wajib diisi.');
    if (!val('stMenerima')) fail('stMenerima', 'Wajib diisi.');
    if (parseRupiah(val('stJumlah')) <= 0) fail('stJumlah', 'Jumlah harus lebih dari 0.');
    if (!val('stTujuan')) fail('stTujuan', 'Tujuan wajib diisi.');
  }

  if (!isValid && firstInvalidId) {
    const el = document.getElementById(firstInvalidId) || document.querySelector('[data-error-for="' + firstInvalidId + '"]');
    if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  return isValid;
}

/* ---------------------------------------------------------
   10. RENDER PRATINJAU STRUK
   --------------------------------------------------------- */

function renderPreview() {
  const settings = getSettingsFromForm();
  const type = state.docType;
  const preview = document.getElementById('receipt-preview');

  let html = '';
  html += '<div class="r-block r-center">';
  if (settings.businessName) html += '<div class="r-title">' + escapeHtml(settings.businessName) + '</div>';
  if (settings.businessAddress) html += '<div>' + nl2br(settings.businessAddress) + '</div>';
  if (settings.businessPhone) html += '<div>' + escapeHtml(settings.businessPhone) + '</div>';
  html += '</div>';
  html += '<hr class="r-sep">';

  html += '<div class="r-block r-center r-bold">' + escapeHtml(DOC_LABELS[type] || '') + '</div>';

  const docNumber = val('docNumber');
  const docDate = val('docDate');
  html += '<div class="r-block">';
  html += '<div class="r-row"><span>No.</span><span>' + escapeHtml(docNumber || '-') + '</span></div>';
  html += '<div class="r-row"><span>Tanggal</span><span>' + escapeHtml(formatTanggalPanjang(docDate)) + '</span></div>';
  html += '</div>';
  html += '<hr class="r-sep">';

  if (type === 'kwitansi') {
    const dari = val('kwitansiDari');
    const jumlah = parseRupiah(val('kwitansiJumlah'));
    const untuk = val('kwitansiUntuk');
    const penerima = val('kwitansiPenerima');
    html += '<div class="r-block">';
    html += '<div class="r-row"><span>Terima dari</span></div><div class="r-bold">' + escapeHtml(dari || '-') + '</div>';
    html += '</div>';
    html += '<div class="r-block">';
    html += '<div class="r-row"><span>Jumlah</span><span class="r-bold">' + formatRupiahFull(jumlah) + '</span></div>';
    html += '<div style="font-style:italic;">(' + escapeHtml(terbilangRupiah(jumlah)) + ')</div>';
    html += '</div>';
    html += '<div class="r-block"><div>Untuk pembayaran:</div><div>' + nl2br(untuk || '-') + '</div></div>';
    html += '<hr class="r-sep">';
    html += '<div class="r-sig-row">';
    html += '<div class="r-sig-box"><div class="r-sig-line">' + escapeHtml(penerima || 'Penerima') + '</div></div>';
    html += '</div>';
  } else if (type === 'nota' || type === 'bon') {
    const pembeliId = type === 'nota' ? 'notaPembeli' : 'bonPelanggan';
    const catatanId = type === 'nota' ? 'notaCatatan' : 'bonCatatan';
    const namaPembeli = val(pembeliId);
    if (namaPembeli) {
      html += '<div class="r-block"><div class="r-row"><span>Pelanggan</span><span>' + escapeHtml(namaPembeli) + '</span></div></div>';
      html += '<hr class="r-sep">';
    }
    const items = state.items[type];
    html += '<table class="r-items">';
    const filledItems = items.filter(function (row) { return row.nama && row.nama.trim() !== ''; });
    filledItems.forEach(function (row) {
      html += '<tr><td colspan="2">' + escapeHtml(row.nama) + '</td></tr>';
      html += '<tr><td>' + row.qty + ' x ' + formatRupiahNumber(row.harga) + '</td><td class="r-right">' + formatRupiahFull(row.qty * row.harga) + '</td></tr>';
    });
    if (filledItems.length === 0) {
      html += '<tr><td class="r-empty">Belum ada item</td></tr>';
    }
    html += '</table>';
    html += '<hr class="r-sep">';
    html += '<div class="r-row r-bold"><span>TOTAL</span><span>' + formatRupiahFull(getItemsTotal(type)) + '</span></div>';
    const catatan = val(catatanId);
    if (catatan) html += '<div class="r-block">Catatan: ' + nl2br(catatan) + '</div>';
  } else if (type === 'bukti-pembayaran') {
    const oleh = val('bpDibayarkanOleh');
    const kepada = val('bpDibayarkanKepada');
    const jumlah = parseRupiah(val('bpJumlah'));
    const metode = val('bpMetode');
    const keperluan = val('bpKeperluan');
    const keterangan = val('bpKeterangan');
    html += '<div class="r-block">';
    html += '<div class="r-row"><span>Dibayarkan oleh</span></div><div class="r-bold">' + escapeHtml(oleh || '-') + '</div>';
    html += '<div class="r-row"><span>Dibayarkan kepada</span></div><div class="r-bold">' + escapeHtml(kepada || '-') + '</div>';
    html += '</div>';
    html += '<div class="r-block">';
    html += '<div class="r-row"><span>Jumlah</span><span class="r-bold">' + formatRupiahFull(jumlah) + '</span></div>';
    html += '<div style="font-style:italic;">(' + escapeHtml(terbilangRupiah(jumlah)) + ')</div>';
    html += '<div class="r-row"><span>Metode</span><span>' + escapeHtml(metode) + '</span></div>';
    html += '</div>';
    html += '<div class="r-block"><div>Untuk keperluan:</div><div>' + nl2br(keperluan || '-') + '</div></div>';
    if (keterangan) html += '<div class="r-block"><div>Keterangan:</div><div>' + nl2br(keterangan) + '</div></div>';
    html += '<hr class="r-sep">';
    html += '<div class="r-sig-row">';
    html += '<div class="r-sig-box"><div class="r-sig-line">Pembayar</div></div>';
    html += '<div class="r-sig-box"><div class="r-sig-line">Penerima</div></div>';
    html += '</div>';
  } else if (type === 'serah-terima') {
    const menyerahkan = val('stMenyerahkan');
    const menerima = val('stMenerima');
    const jumlah = parseRupiah(val('stJumlah'));
    const tujuan = val('stTujuan');
    const keterangan = val('stKeterangan');
    html += '<div class="r-block">';
    html += '<div class="r-row"><span>Menyerahkan</span></div><div class="r-bold">' + escapeHtml(menyerahkan || '-') + '</div>';
    html += '<div class="r-row"><span>Menerima</span></div><div class="r-bold">' + escapeHtml(menerima || '-') + '</div>';
    html += '</div>';
    html += '<div class="r-block">';
    html += '<div class="r-row"><span>Jumlah</span><span class="r-bold">' + formatRupiahFull(jumlah) + '</span></div>';
    html += '<div style="font-style:italic;">(' + escapeHtml(terbilangRupiah(jumlah)) + ')</div>';
    html += '</div>';
    html += '<div class="r-block"><div>Tujuan/Keperluan:</div><div>' + nl2br(tujuan || '-') + '</div></div>';
    if (keterangan) html += '<div class="r-block"><div>Keterangan:</div><div>' + nl2br(keterangan) + '</div></div>';
    html += '<hr class="r-sep">';
    html += '<div class="r-sig-row">';
    html += '<div class="r-sig-box"><div class="r-sig-line">Menyerahkan</div></div>';
    html += '<div class="r-sig-box"><div class="r-sig-line">Menerima</div></div>';
    html += '</div>';
  }

  if (settings.footerNote) {
    html += '<div class="r-footer">' + escapeHtml(settings.footerNote) + '</div>';
  }

  preview.innerHTML = html;
}

/* ---------------------------------------------------------
   10b. TEKS POLOS UNTUK BAGIKAN (WHATSAPP, DLL)
   --------------------------------------------------------- */

const PLAIN_SEP = '------------------------------';

/** Membangun versi teks polos dari dokumen saat ini, untuk dibagikan lewat WhatsApp. */
function buildReceiptPlainText() {
  const settings = getSettingsFromForm();
  const type = state.docType;
  const lines = [];

  if (settings.businessName) lines.push(settings.businessName.toUpperCase());
  if (settings.businessAddress) lines.push(settings.businessAddress);
  if (settings.businessPhone) lines.push(settings.businessPhone);
  lines.push(PLAIN_SEP);
  lines.push('*' + (DOC_LABELS[type] || '') + '*');
  lines.push('No.      : ' + (val('docNumber') || '-'));
  lines.push('Tanggal  : ' + formatTanggalPanjang(val('docDate')));
  lines.push(PLAIN_SEP);

  if (type === 'kwitansi') {
    const jumlah = parseRupiah(val('kwitansiJumlah'));
    lines.push('Terima dari : ' + (val('kwitansiDari') || '-'));
    lines.push('Jumlah      : ' + formatRupiahFull(jumlah));
    lines.push('(' + terbilangRupiah(jumlah) + ')');
    lines.push('Untuk       : ' + (val('kwitansiUntuk') || '-'));
    if (val('kwitansiPenerima')) lines.push('Diterima ol. : ' + val('kwitansiPenerima'));
  } else if (type === 'nota' || type === 'bon') {
    const pembeliId = type === 'nota' ? 'notaPembeli' : 'bonPelanggan';
    const catatanId = type === 'nota' ? 'notaCatatan' : 'bonCatatan';
    if (val(pembeliId)) lines.push('Pelanggan : ' + val(pembeliId));
    const filledItems = state.items[type].filter(function (r) { return r.nama && r.nama.trim() !== ''; });
    filledItems.forEach(function (row) {
      lines.push('- ' + row.nama + ' (' + row.qty + ' x ' + formatRupiahNumber(row.harga) + ') = ' + formatRupiahFull(row.qty * row.harga));
    });
    if (filledItems.length === 0) lines.push('(belum ada item)');
    lines.push(PLAIN_SEP);
    lines.push('*TOTAL: ' + formatRupiahFull(getItemsTotal(type)) + '*');
    if (val(catatanId)) lines.push('Catatan: ' + val(catatanId));
  } else if (type === 'bukti-pembayaran') {
    const jumlah = parseRupiah(val('bpJumlah'));
    lines.push('Dibayarkan oleh   : ' + (val('bpDibayarkanOleh') || '-'));
    lines.push('Dibayarkan kepada : ' + (val('bpDibayarkanKepada') || '-'));
    lines.push('Jumlah            : ' + formatRupiahFull(jumlah));
    lines.push('(' + terbilangRupiah(jumlah) + ')');
    lines.push('Metode            : ' + (val('bpMetode') || '-'));
    lines.push('Keperluan         : ' + (val('bpKeperluan') || '-'));
    if (val('bpKeterangan')) lines.push('Keterangan        : ' + val('bpKeterangan'));
  } else if (type === 'serah-terima') {
    const jumlah = parseRupiah(val('stJumlah'));
    lines.push('Menyerahkan : ' + (val('stMenyerahkan') || '-'));
    lines.push('Menerima    : ' + (val('stMenerima') || '-'));
    lines.push('Jumlah      : ' + formatRupiahFull(jumlah));
    lines.push('(' + terbilangRupiah(jumlah) + ')');
    lines.push('Tujuan      : ' + (val('stTujuan') || '-'));
    if (val('stKeterangan')) lines.push('Keterangan  : ' + val('stKeterangan'));
  }

  if (settings.footerNote) {
    lines.push(PLAIN_SEP);
    lines.push(settings.footerNote);
  }

  return lines.join('\n');
}

/** Membuka WhatsApp (aplikasi di HP, atau WhatsApp Web di desktop) dengan teks dokumen siap kirim. */
function handleShareWhatsApp() {
  if (!validateForm()) {
    showToast('Periksa kembali data yang belum lengkap.', 'error');
    return;
  }
  const text = buildReceiptPlainText();
  const url = 'https://wa.me/?text=' + encodeURIComponent(text);
  const win = window.open(url, '_blank', 'noopener');
  if (!win) {
    showToast('Pop-up diblokir browser. Izinkan pop-up untuk situs ini agar bisa membuka WhatsApp.', 'error');
  }
}

/* ---------------------------------------------------------
   11. DRAFT (SIMPAN / MUAT)
   --------------------------------------------------------- */

function collectFormData() {
  const fieldIds = [
    'docNumber', 'docDate',
    'kwitansiDari', 'kwitansiJumlah', 'kwitansiUntuk', 'kwitansiPenerima',
    'notaPembeli', 'notaCatatan',
    'bonPelanggan', 'bonCatatan',
    'bpDibayarkanOleh', 'bpDibayarkanKepada', 'bpJumlah', 'bpMetode', 'bpKeperluan', 'bpKeterangan',
    'stMenyerahkan', 'stMenerima', 'stJumlah', 'stTujuan', 'stKeterangan'
  ];
  const data = { docType: state.docType, fields: {}, items: { nota: state.items.nota, bon: state.items.bon } };
  fieldIds.forEach(function (id) {
    const el = document.getElementById(id);
    if (el) data.fields[id] = el.value;
  });
  return data;
}

function applyFormData(data) {
  document.getElementById('docType').value = data.docType || 'kwitansi';
  switchDocType(data.docType || 'kwitansi');
  Object.keys(data.fields || {}).forEach(function (id) {
    const el = document.getElementById(id);
    if (el) el.value = data.fields[id];
  });
  ['kwitansiJumlah', 'bpJumlah', 'stJumlah'].forEach(function (id) {
    const el = document.getElementById(id);
    if (el && el.value) {
      const raw = parseRupiah(el.value);
      el.value = raw ? formatRupiahNumber(raw) : '';
      updateTerbilangPreview(id, raw);
    }
  });
  state.items.nota = (data.items && data.items.nota) || [];
  state.items.bon = (data.items && data.items.bon) || [];
  state.items.nota.forEach(function (r) { if (!r.id) r.id = 'row' + (itemRowSeq++); });
  state.items.bon.forEach(function (r) { if (!r.id) r.id = 'row' + (itemRowSeq++); });
  renderItemsTable('nota');
  renderItemsTable('bon');
  renderPreview();
}

function loadDrafts() {
  try {
    const raw = localStorage.getItem(LS_DRAFTS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Gagal memuat draft:', e);
    return [];
  }
}

function saveDrafts(drafts) {
  try {
    localStorage.setItem(LS_DRAFTS, JSON.stringify(drafts));
    return true;
  } catch (e) {
    console.error('Gagal menyimpan draft:', e);
    showToast('Gagal menyimpan draft (penyimpanan penuh atau diblokir).', 'error');
    return false;
  }
}

function handleSaveDraft() {
  const defaultName = (DOC_LABELS[state.docType] || 'Dokumen') + ' - ' + (val('docNumber') || 'tanpa nomor');
  const name = window.prompt('Nama draft:', defaultName);
  if (name === null) return;
  const trimmedName = name.trim() || defaultName;
  const drafts = loadDrafts();
  drafts.unshift({
    id: 'draft_' + Date.now(),
    name: trimmedName,
    savedAt: new Date().toISOString(),
    data: collectFormData()
  });
  if (drafts.length > 50) drafts.length = 50;
  if (saveDrafts(drafts)) showToast('Draft "' + trimmedName + '" tersimpan.', 'success');
}

function renderDraftList() {
  const drafts = loadDrafts();
  const container = document.getElementById('draftList');
  container.innerHTML = '';
  if (drafts.length === 0) {
    container.innerHTML = '<p class="hint">Belum ada draft tersimpan.</p>';
    return;
  }
  drafts.forEach(function (draft) {
    const row = document.createElement('div');
    row.className = 'draft-item';

    const info = document.createElement('div');
    info.className = 'draft-item-info';
    const dt = new Date(draft.savedAt);
    const dtLabel = isNaN(dt.getTime()) ? '' : dt.toLocaleString('id-ID');
    info.innerHTML = '<div class="draft-name">' + escapeHtml(draft.name) + '</div>' +
      '<div class="draft-meta">' + escapeHtml(DOC_LABELS[draft.data.docType] || '') + ' &middot; ' + escapeHtml(dtLabel) + '</div>';

    const actions = document.createElement('div');
    actions.className = 'draft-item-actions';

    const btnLoad = document.createElement('button');
    btnLoad.type = 'button';
    btnLoad.className = 'btn-small btn-primary';
    btnLoad.textContent = 'Muat';
    btnLoad.addEventListener('click', function () {
      applyFormData(draft.data);
      document.getElementById('draftDialog').close();
      showToast('Draft "' + draft.name + '" dimuat.', 'success');
    });

    const btnDelete = document.createElement('button');
    btnDelete.type = 'button';
    btnDelete.className = 'btn-small btn-danger';
    btnDelete.textContent = 'Hapus';
    btnDelete.addEventListener('click', function () {
      if (!window.confirm('Hapus draft "' + draft.name + '"?')) return;
      const remaining = loadDrafts().filter(function (d) { return d.id !== draft.id; });
      saveDrafts(remaining);
      renderDraftList();
    });

    actions.appendChild(btnLoad);
    actions.appendChild(btnDelete);
    row.appendChild(info);
    row.appendChild(actions);
    container.appendChild(row);
  });
}

/* ---------------------------------------------------------
   12. BERSIHKAN FORM
   --------------------------------------------------------- */

function handleClearForm() {
  if (!window.confirm('Bersihkan semua isian formulir? Pengaturan usaha dan draft tersimpan tidak akan terhapus.')) return;
  document.getElementById('receiptForm').reset();
  document.getElementById('docDate').value = todayIso();
  state.items.nota = [];
  state.items.bon = [];
  renderItemsTable('nota');
  renderItemsTable('bon');
  document.querySelectorAll('.terbilang-preview').forEach(function (el) { el.textContent = ''; });
  clearAllFieldErrors();
  renderPreview();
  showToast('Formulir dibersihkan.', 'success');
}

function todayIso() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/* ---------------------------------------------------------
   13. CETAK
   --------------------------------------------------------- */

function handlePrintRequest() {
  if (!validateForm()) {
    showToast('Periksa kembali data yang belum lengkap.', 'error');
    return;
  }
  renderPreview();
  const skip = localStorage.getItem('trpwa_skip_print_help') === '1';
  if (skip) {
    doPrint();
  } else {
    document.getElementById('printHelpDialog').showModal();
  }
}

function doPrint() {
  window.print();
}

/* ---------------------------------------------------------
   14. TOAST
   --------------------------------------------------------- */

let toastTimer = null;
function showToast(message, kind) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = 'toast show' + (kind === 'error' ? ' toast-error' : kind === 'success' ? ' toast-success' : '');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(function () {
    toast.classList.remove('show');
  }, 3200);
}

/* ---------------------------------------------------------
   15. ONLINE / OFFLINE STATUS
   --------------------------------------------------------- */

function updateOnlineStatus() {
  const badge = document.getElementById('onlineStatus');
  if (navigator.onLine) {
    badge.textContent = '🟢 Online';
    badge.className = 'status-badge online';
  } else {
    badge.textContent = '⚪ Offline (tetap bisa dipakai)';
    badge.className = 'status-badge offline';
  }
}

/* ---------------------------------------------------------
   16. INISIALISASI
   --------------------------------------------------------- */

function init() {
  // Pengaturan
  const settings = loadSettings();
  applySettingsToForm(settings);
  ['setBusinessName', 'setBusinessAddress', 'setBusinessPhone', 'setFooterNote'].forEach(function (id) {
    document.getElementById(id).addEventListener('input', function () {
      saveSettings(getSettingsFromForm());
      renderPreview();
    });
  });
  document.getElementById('setContentWidth').addEventListener('change', function () {
    const s = getSettingsFromForm();
    saveSettings(s);
    applyContentWidth(s.contentWidth);
  });
  document.getElementById('setPrintOffset').addEventListener('change', function () {
    const s = getSettingsFromForm();
    saveSettings(s);
    applyPrintOffset(s.printOffset);
  });
  document.getElementById('setOrientation').addEventListener('change', function () {
    const s = getSettingsFromForm();
    saveSettings(s);
    applyPrintOrientation(s.orientation);
  });

  // Jenis dokumen
  document.getElementById('docType').addEventListener('change', function (e) {
    switchDocType(e.target.value);
  });
  switchDocType('kwitansi');

  // Tanggal default hari ini
  document.getElementById('docDate').value = todayIso();
  document.getElementById('docDate').addEventListener('change', renderPreview);

  // Nomor otomatis
  document.getElementById('btnAutoNumber').addEventListener('click', function () {
    document.getElementById('docNumber').value = generateAutoNumber(state.docType);
    renderPreview();
  });
  document.getElementById('docNumber').addEventListener('input', renderPreview);

  // Input teks/textarea biasa -> re-render preview
  ['kwitansiDari', 'kwitansiUntuk', 'kwitansiPenerima',
    'notaPembeli', 'notaCatatan', 'bonPelanggan', 'bonCatatan',
    'bpDibayarkanOleh', 'bpDibayarkanKepada', 'bpMetode', 'bpKeperluan', 'bpKeterangan',
    'stMenyerahkan', 'stMenerima', 'stTujuan', 'stKeterangan'
  ].forEach(function (id) {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', renderPreview);
  });

  // Input uang
  ['kwitansiJumlah', 'bpJumlah', 'stJumlah'].forEach(function (id) {
    setupMoneyInput(document.getElementById(id));
  });

  // Tombol tambah item
  document.querySelectorAll('[data-add-item]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      addItemRow(btn.getAttribute('data-add-item'));
      renderPreview();
    });
  });

  // Mulai dengan 1 baris item kosong untuk nota & bon
  addItemRow('nota');
  addItemRow('bon');

  // Tombol aksi utama
  document.getElementById('btnPrint').addEventListener('click', handlePrintRequest);
  document.getElementById('btnShareWA').addEventListener('click', handleShareWhatsApp);
  document.getElementById('btnSaveDraft').addEventListener('click', handleSaveDraft);
  document.getElementById('btnClear').addEventListener('click', handleClearForm);

  document.getElementById('btnLoadDraft').addEventListener('click', function () {
    renderDraftList();
    document.getElementById('draftDialog').showModal();
  });
  document.getElementById('btnCloseDraftDialog').addEventListener('click', function () {
    document.getElementById('draftDialog').close();
  });

  // Dialog petunjuk cetak
  document.getElementById('btnProceedPrint').addEventListener('click', function () {
    const dontShow = document.getElementById('dontShowPrintHelp').checked;
    if (dontShow) localStorage.setItem('trpwa_skip_print_help', '1');
    document.getElementById('printHelpDialog').close();
    doPrint();
  });
  document.getElementById('btnCancelPrint').addEventListener('click', function () {
    document.getElementById('printHelpDialog').close();
  });

  // Status online/offline
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  updateOnlineStatus();

  // Render awal
  renderPreview();

  // Service worker
  registerServiceWorker();
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function (err) {
        console.error('Registrasi service worker gagal:', err);
      });
    });
  }
}

document.addEventListener('DOMContentLoaded', init);
