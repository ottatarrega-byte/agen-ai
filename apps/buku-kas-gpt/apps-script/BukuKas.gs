/**
 * BUKU KAS — web app Google Apps Script (versi GPT)
 *
 * Satu file server untuk app Buku Kas. Dipasang di Apps Script yang menempel
 * ke Google Sheet (Extensions > Apps Script), lalu di-deploy sebagai Web app.
 *
 * Script Properties (Project Settings > Script properties):
 *   NAMA_SAYA        nama pemilik sheet, mis. "Otta"
 *   NAMA_PASANGAN    nama pasangan untuk fitur berdua, mis. "Wanda" (boleh kosong)
 *   EMAIL_PASANGAN   email Google pasangan; file berdua otomatis dibagikan ke sini
 *   OPENAI_API_KEY   kunci OpenAI untuk mengurai catatan bebas (boleh kosong: pakai pengurai lokal)
 *   OPENAI_MODEL     model GPT, default gpt-4o-mini
 *   BERDUA_MASUK_ID  ID file "Buku Kas Berdua" milik pasangan (diisi setelah pasangan membagikannya)
 *   SHEET_ID         opsional, kalau script ini tidak menempel ke sheet
 *   (BERDUA_KELUAR_ID dan BERDUA_HASH diisi otomatis)
 *
 * Aman dipasang di samping script lain (mis. robot email BCA): tidak ada onOpen,
 * semua fungsi internal berakhiran garis bawah.
 */

var BK_TX = 'Transaksi';
var BK_SET = 'Pengaturan';
var BK_DASH = 'Dashboard';
var BK_SPLIT = 'Split';
var BK_TALANGAN = 'Talangan & Reimburse';
var BK_HEADERS = ['Tanggal', 'Jam', 'Bulan', 'Sumber', 'Arah', 'Kategori', 'Sifat', 'Konteks', 'Keterangan', 'Nominal', 'Beban Bersama', 'Porsi Saya'];
var BK_KATEGORI = [
  ['Sewa', 'Tetap', 'Keluar'], ['Utilitas & Tagihan', 'Tetap', 'Keluar'], ['Subscriptions', 'Tetap', 'Keluar'], ['Asuransi', 'Tetap', 'Keluar'], ['Cicilan', 'Tetap', 'Keluar'],
  ['Makan & Minum', 'Variabel', 'Keluar'], ['Groceries', 'Variabel', 'Keluar'], ['Transport', 'Variabel', 'Keluar'], ['Rumah Tangga', 'Variabel', 'Keluar'], ['Kesehatan', 'Variabel', 'Keluar'],
  ['Hiburan & Hobi', 'Variabel', 'Keluar'], ['Belanja', 'Variabel', 'Keluar'], ['Perawatan Diri', 'Variabel', 'Keluar'], ['Perjalanan', 'Sekali', 'Keluar'], ['Hadiah & Sosial', 'Sekali', 'Keluar'],
  ['Top-up E-wallet', 'Variabel', 'Keluar'], ['Kerja & Tools', 'Variabel', 'Keluar'], ['Pendapatan (belum dipilah)', 'Variabel', 'Masuk'], ['Pendapatan Kerja', 'Variabel', 'Masuk'], ['Pendapatan Lain', 'Variabel', 'Masuk'],
  ['Bayar CC', 'Sekali', 'Netral'], ['Transfer Antar Rekening Sendiri', 'Sekali', 'Netral'], ['Transfer ke Orang', 'Sekali', 'Netral'], ['Investasi', 'Sekali', 'Netral'], [BK_TALANGAN, 'Sekali', 'Netral'], ['Bukan Pendapatan', 'Sekali', 'Netral']
];

/* ---------------- web app ---------------- */

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle(bkJudul_())
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover');
}

function bkConfig_() {
  var p = PropertiesService.getScriptProperties();
  return {
    me: (p.getProperty('NAMA_SAYA') || 'Saya').trim(),
    partner: (p.getProperty('NAMA_PASANGAN') || '').trim(),
    partnerEmail: (p.getProperty('EMAIL_PASANGAN') || '').trim(),
    key: (p.getProperty('OPENAI_API_KEY') || '').trim(),
    model: (p.getProperty('OPENAI_MODEL') || 'gpt-4o-mini').trim(),
    inId: bkFileId_(p.getProperty('BERDUA_MASUK_ID')),
    outId: (p.getProperty('BERDUA_KELUAR_ID') || '').trim()
  };
}
function bkJudul_() { var c = bkConfig_(); return 'Buku Kas ' + c.me + (c.partner ? ' ' + c.partner : ''); }
/** Terima ID atau link Google Sheets utuh. */
function bkFileId_(s) { s = String(s || '').trim(); var m = s.match(/\/d\/([A-Za-z0-9_-]{20,})/); return m ? m[1] : s; }
function bkSS_() {
  var id = bkFileId_(PropertiesService.getScriptProperties().getProperty('SHEET_ID'));
  return id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
}
function bkPublicConfig_() {
  var c = bkConfig_();
  var url = '';
  try { url = bkSS_().getUrl(); } catch (e) { }
  return { me: c.me, partner: c.partner, hasAi: !!c.key, model: c.model, linked: !!c.inId, outUrl: c.outId ? 'https://docs.google.com/spreadsheets/d/' + c.outId + '/edit' : '', sheetUrl: url };
}

/* ---------------- baca ---------------- */

function bkTxRows_(ss) {
  var sh = ss.getSheetByName(BK_TX);
  var n = sh.getLastRow() - 1;
  if (n < 1) return [];
  var raw = sh.getRange(2, 1, n, 12).getValues();
  var disp = sh.getRange(2, 1, n, 12).getDisplayValues();
  var tz = ss.getSpreadsheetTimeZone();
  var out = [];
  for (var i = 0; i < n; i++) {
    var r = raw[i], d = disp[i];
    var tgl = /^\d{4}-\d{2}-\d{2}/.test(d[0]) ? d[0].slice(0, 10) : (r[0] instanceof Date ? Utilities.formatDate(r[0], tz, 'yyyy-MM-dd') : '');
    var jam = /^\d{1,2}:\d{2}/.test(d[1]) ? d[1].slice(0, 5) : '';
    out.push([tgl, jam, d[2], String(r[3]), String(r[4]), String(r[5]), String(r[6]), String(r[7]), String(r[8]),
      Number(r[9]) || 0, r[10] === true || String(r[10]).toUpperCase() === 'TRUE' ? 'TRUE' : 'FALSE', r[11] === '' ? '' : Number(r[11]) || 0]);
  }
  return out;
}
function bkDisp_(ss, nama, a1) { var sh = ss.getSheetByName(nama); return sh ? sh.getRange(a1).getDisplayValues() : []; }

function apiGetData() {
  var ss = bkSS_();
  if (!ss.getSheetByName(BK_TX)) return { needsSetup: true, config: bkPublicConfig_() };
  return {
    config: bkPublicConfig_(),
    tx: bkTxRows_(ss),
    peng: bkDisp_(ss, BK_SET, 'A1:I60'),
    dash: bkDisp_(ss, BK_DASH, 'A1:E80'),
    split: bkDisp_(ss, BK_SPLIT, 'A1:D30'),
    berduaIn: bkBacaBerdua_(),
    loadedAt: Date.now()
  };
}

/* ---------------- tulis ---------------- */

function bkArahKategori_(ss) {
  var sh = ss.getSheetByName(BK_SET), map = {};
  if (!sh) return map;
  sh.getRange('A12:C40').getValues().forEach(function (r) {
    var k = String(r[0]).trim(), s = String(r[1]).trim(), a = String(r[2]).trim();
    if (k && /^(Keluar|Masuk|Netral)$/.test(a)) map[k] = { sifat: s || 'Variabel', arah: a };
  });
  return map;
}
/** Arah ikut default kategori. Talangan tetap Keluar sampai diganti. */
function bkPaksa_(kat, map) {
  if (kat === BK_TALANGAN) return { arah: 'Keluar', sifat: 'Sekali' };
  return map[kat] || { arah: 'Keluar', sifat: 'Variabel' };
}

/** items: [{date:'yyyy-MM-dd', time:'HH:mm'|'' , kat, konteks, ket, nominal, shared}] */
function apiAppend(items) {
  if (!items || !items.length) throw new Error('KOSONG: tidak ada transaksi untuk disimpan');
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var ss = bkSS_(), sh = ss.getSheetByName(BK_TX), map = bkArahKategori_(ss);
    var rows = items.map(function (it) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(it.date)) throw new Error('DATA: tanggal tidak valid');
      var n = Math.round(Number(it.nominal));
      if (!n) throw new Error('DATA: nominal kosong');
      var kat = String(it.kat || 'BELUM JELAS'), c = bkPaksa_(kat, map);
      return [it.date, /^\d{2}:\d{2}$/.test(it.time || '') ? it.time : '', it.date.slice(0, 8) + '01', 'app', c.arah, kat, c.sifat,
        it.konteks === 'Kerja' ? 'Kerja' : 'Pribadi', String(it.ket || '').slice(0, 120), n, !!it.shared];
    });
    rows.sort(function (a, b) { return (b[0] + b[1]).localeCompare(a[0] + a[1]); });
    var punyaData = sh.getLastRow() > 1;
    sh.insertRowsBefore(2, rows.length);
    if (punyaData) sh.getRange(2 + rows.length, 1, 1, 12).copyFormatToRange(sh, 1, 12, 2, 1 + rows.length);
    else bkFormatBaris_(sh, 2, rows.length);
    sh.getRange(2, 11, rows.length, 1).insertCheckboxes();
    sh.getRange(2, 1, rows.length, 11).setValues(rows);
    var f = [];
    for (var i = 0; i < rows.length; i++) f.push(['=IF(K' + (2 + i) + ',J' + (2 + i) + '*' + BK_SET + '!$B$4,"")']);
    sh.getRange(2, 12, rows.length, 1).setFormulas(f);
    SpreadsheetApp.flush();
    return { saved: rows.length };
  } finally { lock.releaseLock(); }
}

/** p: {row, expect:{date, ket, nominal}, kat, konteks, shared, lunas}. Baris dicari ulang kalau sudah bergeser.
 *  lunas hanya berlaku untuk Talangan: true = sudah diganti, jadi Netral. */
function apiUpdate(p) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var ss = bkSS_(), sh = ss.getSheetByName(BK_TX);
    var rows = bkTxRows_(ss);
    var cocok = function (r) { return r && r[0] === p.expect.date && r[8].trim() === String(p.expect.ket).trim() && Math.round(r[9]) === Math.round(p.expect.nominal); };
    var idx = p.row - 2;
    if (!cocok(rows[idx])) {
      var calon = [];
      rows.forEach(function (r, i) { if (cocok(r)) calon.push(i); });
      if (calon.length !== 1) throw new Error('BERGESER: baris tidak ditemukan dengan pasti (' + calon.length + ' calon). Muat ulang dulu.');
      idx = calon[0];
    }
    var map = bkArahKategori_(ss), c = bkPaksa_(p.kat, map);
    if (p.kat === BK_TALANGAN && p.lunas) c = { arah: 'Netral', sifat: 'Sekali' };
    var baris = idx + 2;
    sh.getRange(baris, 5, 1, 4).setValues([[c.arah, p.kat, c.sifat, p.konteks === 'Kerja' ? 'Kerja' : 'Pribadi']]);
    sh.getRange(baris, 11).setValue(!!p.shared);
    if (sh.getRange(baris, 12).getFormula() === '' && p.shared) sh.getRange(baris, 12).setFormula('=IF(K' + baris + ',J' + baris + '*' + BK_SET + '!$B$4,"")');
    SpreadsheetApp.flush();
    return { row: baris, arah: c.arah, sifat: c.sifat };
  } finally { lock.releaseLock(); }
}

/* ---------------- GPT ---------------- */

function apiParse(teks, ctx) {
  var c = bkConfig_();
  if (!c.key) throw new Error('NO_KEY: OPENAI_API_KEY belum diisi di Script properties');
  var ss = bkSS_(), map = bkArahKategori_(ss);
  var kat = Object.keys(map).map(function (k) { return k + ' | ' + map[k].arah; }).join('; ');
  var sistem = 'Kamu mengubah catatan pengeluaran bebas (Indonesia/Inggris) menjadi baris transaksi.\n' +
    'Hari ini ' + ctx.today + ' (' + ctx.hari + ') jam ' + ctx.now + '. Kemarin = ' + ctx.yesterday + '.\n' +
    'Kategori yang boleh (nama | arah): ' + kat + '; atau "BELUM JELAS" kalau tidak yakin.\n' +
    'Aturan: "25k"/"25rb" = 25000, "1,2jt" = 1200000, "25.000" = 25000. Satu baris per transaksi; pisahkan bila ada "dan", koma, atau baris baru. ' +
    'Jam = jam sekarang kecuali tanggalnya bukan hari ini (isi ""). "berdua", "split", "bagi dua"' + (c.partner ? ', "sama ' + c.partner + '"' : '') + ' berarti berdua=true. ' +
    'Konteks "Kerja" hanya bila jelas soal pekerjaan atau klien; selain itu "Pribadi". Keterangan singkat, huruf awal kapital, tanpa nominal.\n' +
    'Balas HANYA objek JSON: {"transaksi":[{"ket":string,"nominal":number,"kategori":string,"tanggal":"YYYY-MM-DD","jam":"HH:MM" atau "","konteks":"Pribadi"|"Kerja","berdua":boolean}]}';
  var res = UrlFetchApp.fetch('https://api.openai.com/v1/chat/completions', {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    headers: { Authorization: 'Bearer ' + c.key },
    payload: JSON.stringify({ model: c.model, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: sistem }, { role: 'user', content: String(teks).slice(0, 2000) }] })
  });
  var kode = res.getResponseCode(), body = res.getContentText();
  if (kode !== 200) {
    var pesan = ''; try { pesan = JSON.parse(body).error.message; } catch (e) { pesan = body.slice(0, 200); }
    throw new Error('OPENAI_' + kode + ': ' + pesan);
  }
  var isi = JSON.parse(body).choices[0].message.content;
  var obj = JSON.parse(isi);
  return Array.isArray(obj) ? obj : (obj.transaksi || []);
}

/* ---------------- berdua ---------------- */

/** Terbitkan baris Beban Bersama ke file terpisah yang dibagikan ke pasangan. Hanya menulis kalau berubah. */
function apiSyncBerdua() {
  var c = bkConfig_();
  if (!c.partner) return { skipped: 'NAMA_PASANGAN kosong' };
  var ss = bkSS_(), props = PropertiesService.getScriptProperties();
  var porsi = Number(ss.getSheetByName(BK_SET).getRange('B4').getValue()) || 0.5;
  var rows = bkTxRows_(ss).filter(function (r) { return r[10] === 'TRUE'; })
    .map(function (r) { return [r[0], r[1], r[8], r[5], r[9], r[3].indexOf('email') === 0 ? 'ya' : '']; });
  var hash = Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, JSON.stringify([porsi, c.me, rows])));
  var out = c.outId ? SpreadsheetApp.openById(c.outId) : null;
  if (!out) {
    out = SpreadsheetApp.create('Buku Kas Berdua — ' + c.me);
    props.setProperty('BERDUA_KELUAR_ID', out.getId());
    var info0 = out.getSheets()[0].setName('Info');
    info0.getRange('A1:B1').setValues([['Isi file ini ditulis otomatis oleh Buku Kas ' + c.me + '. Jangan diedit.', '']]);
    out.insertSheet('Berdua');
  }
  if (c.partnerEmail && props.getProperty('BERDUA_DIBAGI') !== c.partnerEmail) {
    try { out.addViewer(c.partnerEmail); props.setProperty('BERDUA_DIBAGI', c.partnerEmail); } catch (e) { /* dibagikan manual saja */ }
  }
  var changed = props.getProperty('BERDUA_HASH') !== hash;
  if (changed) {
    var b = out.getSheetByName('Berdua');
    b.clearContents();
    b.getRange(1, 1, 1, 6).setValues([['Tanggal', 'Jam', 'Keterangan', 'Kategori', 'Nominal', 'Sementara']]);
    if (rows.length) {
      b.getRange(2, 1, rows.length, 2).setNumberFormat('@');
      b.getRange(2, 1, rows.length, 6).setValues(rows);
    }
    out.getSheetByName('Info').getRange('A3:B6').setValues([['Nama', c.me], ['Porsi pemilik', porsi], ['Diperbarui', new Date().toISOString()], ['Jumlah baris', rows.length]]);
    props.setProperty('BERDUA_HASH', hash);
  }
  return { changed: changed, count: rows.length, url: out.getUrl(), sharedWith: props.getProperty('BERDUA_DIBAGI') || '' };
}

function bkBacaBerdua_() {
  var c = bkConfig_();
  if (!c.inId) return null;
  try {
    var f = SpreadsheetApp.openById(c.inId);
    var info = {};
    f.getSheetByName('Info').getRange('A3:B6').getValues().forEach(function (r) { info[r[0]] = r[1]; });
    var b = f.getSheetByName('Berdua'), n = b.getLastRow() - 1;
    var rows = n > 0 ? b.getRange(2, 1, n, 6).getValues().map(function (r) {
      return { d: String(r[0]), t: String(r[1]), ket: String(r[2]), kat: String(r[3]), n: Number(r[4]) || 0, sem: r[5] === 'ya' };
    }) : [];
    return { name: String(info['Nama'] || c.partner), porsi: Number(info['Porsi pemilik']) || 0.5, updatedAt: String(info['Diperbarui'] || ''), rows: rows };
  } catch (e) {
    return { error: String(e.message || e) };
  }
}

/* ---------------- setup sheet baru ---------------- */

/** Bikin tab Transaksi, Pengaturan, Dashboard, Split di sheet kosong. Aman diulang: tab yang sudah ada dilewati. */
function apiSetup() {
  var ss = bkSS_();
  var log = [];
  if (!ss.getSheetByName(BK_TX)) {
    // Sheet baru saja: angka dan rumus memakai format en_US. Sheet yang sudah dipakai tidak diubah.
    ss.setSpreadsheetLocale('en_US');
    ss.setSpreadsheetTimeZone('Asia/Jakarta');
  }
  if (!ss.getSheetByName(BK_SET)) { bkSetupPengaturan_(ss); log.push('Pengaturan'); }
  if (!ss.getSheetByName(BK_TX)) { bkSetupTransaksi_(ss); log.push('Transaksi'); }
  if (!ss.getSheetByName(BK_DASH)) { bkSetupDashboard_(ss); log.push('Dashboard'); }
  if (!ss.getSheetByName(BK_SPLIT)) { bkSetupSplit_(ss); log.push('Split'); }
  var kosong = ss.getSheetByName('Sheet1');
  if (kosong && kosong.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(kosong);
  return { created: log };
}
/** Bisa dijalankan dari editor Apps Script (Run > setupSheet) sebagai ganti tombol di app. */
function setupSheet() { Logger.log(JSON.stringify(apiSetup())); }

function bkSetupPengaturan_(ss) {
  var c = bkConfig_();
  var sh = ss.insertSheet(BK_SET);
  sh.getRange('A1').setValue('PENGATURAN').setFontWeight('bold').setFontSize(14);
  sh.getRange('A3:C6').setValues([
    ['Bulan aktif di Dashboard', '=DATE(YEAR(TODAY()),MONTH(TODAY()),1)', 'Otomatis bulan berjalan. Boleh diganti tanggal 1 bulan lain.'],
    ['Porsi ' + c.me + ' untuk beban bersama', 0.5, 'Bagian kamu di pengeluaran berdua.'],
    ['Saldo rekening terakhir', 0, 'Isi manual tiap kamu cek saldo. Dipakai untuk runway.'],
    ['Cicilan rutin per bulan (manual)', 0, 'Isi kalau ada cicilan di luar transaksi.']
  ]);
  sh.getRange('B3').setNumberFormat('mmmm yyyy');
  sh.getRange('B4').setNumberFormat('0%');
  sh.getRange('B5:B6').setNumberFormat('#,##0');
  sh.getRange('B4:B6').setBackground('#FFF6C4');
  sh.getRange('A8').setValue('Sel kuning = boleh diisi manual. Sisanya formula, jangan ditimpa.');
  sh.getRange('A10').setValue('DAFTAR KATEGORI').setFontWeight('bold');
  sh.getRange('A11:C11').setValues([['Kategori', 'Sifat default', 'Arah']]).setFontWeight('bold');
  sh.getRange(12, 1, BK_KATEGORI.length, 3).setValues(BK_KATEGORI);
  sh.getRange('G15').setValue('RATA-RATA DASHBOARD').setFontWeight('bold');
  sh.getRange('G16:G18').setValues([['Bulan berjalan'], ['Jumlah bulan lengkap (maks 12)'], ['Rata-rata dihitung mulai']]);
  sh.getRange('H16').setFormula('=DATE(YEAR(TODAY()),MONTH(TODAY()),1)').setNumberFormat('mmmm yyyy');
  sh.getRange('H17').setFormula('=IF(COUNT(' + BK_TX + '!C2:C)=0,1,MAX(1,MIN(12,DATEDIF(MIN(' + BK_TX + '!C2:C),H16,"M"))))').setNumberFormat('0 "bulan"');
  sh.getRange('H18').setFormula('=EDATE(H16,-H17)').setNumberFormat('mmmm yyyy');
  sh.setColumnWidth(1, 260); sh.setColumnWidth(3, 320); sh.setColumnWidth(7, 220);
}

function bkSetupTransaksi_(ss) {
  var sh = ss.insertSheet(BK_TX, 0);
  sh.getRange(1, 1, 1, 12).setValues([BK_HEADERS]).setFontWeight('bold').setBackground('#221B33').setFontColor('#FFFFFF');
  sh.setFrozenRows(1);
  bkFormatBaris_(sh, 2, 999);
  var set = ss.getSheetByName(BK_SET);
  sh.getRange('F2:F').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInRange(set.getRange('A12:A40'), true).setAllowInvalid(true).build());
}
function bkFormatBaris_(sh, dari, n) {
  sh.getRange(dari, 1, n, 1).setNumberFormat('yyyy-mm-dd');
  sh.getRange(dari, 2, n, 1).setNumberFormat('HH:mm');
  sh.getRange(dari, 3, n, 1).setNumberFormat('mmm yyyy');
  sh.getRange(dari, 10, n, 1).setNumberFormat('#,##0;(#,##0);-');
  sh.getRange(dari, 12, n, 1).setNumberFormat('#,##0;(#,##0);-');
}

function bkSetupDashboard_(ss) {
  var sh = ss.insertSheet(BK_DASH, 0);
  var T = BK_TX + '!', J = T + '$J:$J', C = T + '$C:$C', E = T + '$E:$E', G = T + '$G:$G', F = T + '$F:$F', K = T + '$K:$K';
  var awal = BK_SET + '!$H$18', kini = BK_SET + '!$H$16', nb = BK_SET + '!$H$17';
  var rentang = ',' + C + ',">="&' + awal + ',' + C + ',"<"&' + kini;
  sh.getRange('A1').setValue('BUKU KAS').setFontWeight('bold').setFontSize(16);
  sh.getRange('A4').setValue('BULAN AKTIF');
  sh.getRange('B4').setFormula('=' + BK_SET + '!B3').setNumberFormat('mmmm yyyy');
  sh.getRange('A5').setValue('RINGKASAN BULAN INI').setFontWeight('bold');
  sh.getRange('D5').setValue('PERINGATAN').setFontWeight('bold');
  var baris = [
    ['A6', 'Pengeluaran bulan ini', '=SUMIFS(' + J + ',' + C + ',$B$4,' + E + ',"Keluar")'],
    ['A7', 'Pemasukan bulan ini', '=SUMIFS(' + J + ',' + C + ',$B$4,' + E + ',"Masuk")'],
    ['A8', 'Net bulan ini', '=B7-B6'],
    ['A16', 'Biaya tetap per bulan (rata-rata)', '=ROUND(SUMIFS(' + J + ',' + E + ',"Keluar",' + G + ',"Tetap"' + rentang + ')/' + nb + ',0)+' + BK_SET + '!$B$6'],
    ['A17', 'Variabel per bulan (rata-rata)', '=ROUND(SUMIFS(' + J + ',' + E + ',"Keluar",' + G + ',"Variabel"' + rentang + ')/' + nb + ',0)'],
    ['A18', 'Pengeluaran sekali per bulan (tidak masuk minimum)', '=ROUND(SUMIFS(' + J + ',' + E + ',"Keluar",' + G + ',"Sekali"' + rentang + ')/' + nb + ',0)'],
    ['A19', 'Minimum monthly need (tetap + variabel)', '=B16+B17'],
    ['A20', 'Saldo rekening terakhir', '=' + BK_SET + '!B5'],
    ['A21', 'Runway tanpa income baru (bulan)', '=IFERROR(ROUND(B20/B19,1),0)']
  ];
  baris.forEach(function (b) { sh.getRange(b[0]).setValue(b[1]); sh.getRange(b[0].replace('A', 'B')).setFormula(b[2]); });
  sh.getRange('A15').setValue('ANGKA KUNCI').setFontWeight('bold');
  sh.getRange('B6:B20').setNumberFormat('#,##0;-#,##0;"–"');
  sh.getRange('B21').setNumberFormat('0.0 "bulan"');
  sh.getRange('D6').setValue('Baris belum dipilah / BELUM JELAS');
  sh.getRange('E6').setFormula('=COUNTIF(' + F + ',"BELUM JELAS")+COUNTIF(' + F + ',"Pendapatan (belum dipilah)")');
  sh.getRange('D10').setValue('BEBAN BERSAMA BULAN INI').setFontWeight('bold');
  sh.getRange('D11').setValue('Total ditandai berdua');
  sh.getRange('E11').setFormula('=SUMIFS(' + J + ',' + C + ',$B$4,' + K + ',TRUE)').setNumberFormat('#,##0');
  sh.setColumnWidth(1, 330); sh.setColumnWidth(2, 140); sh.setColumnWidth(4, 260);
}

function bkSetupSplit_(ss) {
  var c = bkConfig_();
  var sh = ss.insertSheet(BK_SPLIT);
  var T = BK_TX + '!', J = T + '$J:$J', C = T + '$C:$C', K = T + '$K:$K';
  sh.getRange('A1').setValue('SPLIT' + (c.partner ? ' DENGAN ' + c.partner.toUpperCase() : '')).setFontWeight('bold').setFontSize(14);
  sh.getRange('A2').setValue('Baris di Transaksi yang Beban Bersama = TRUE. Porsi diatur di Pengaturan!B4.');
  sh.getRange('A4:D4').setValues([['Bulan', 'Total beban bersama', 'Porsi ' + c.me, 'Porsi ' + (c.partner || 'pasangan')]]).setFontWeight('bold');
  var f = [];
  for (var i = 0; i < 12; i++) {
    var r = 5 + i;
    f.push(['=DATE(YEAR(TODAY()),' + (i + 1) + ',1)', '=SUMIFS(' + J + ',' + C + ',A' + r + ',' + K + ',TRUE)', '=B' + r + '*' + BK_SET + '!$B$4', '=B' + r + '-C' + r]);
  }
  sh.getRange(5, 1, 12, 4).setFormulas(f);
  sh.getRange('A17:D17').setFormulas([['TOTAL', '=SUM(B5:B16)', '=SUM(C5:C16)', '=SUM(D5:D16)']]);
  sh.getRange('A17').setValue('TOTAL');
  sh.getRange('A5:A16').setNumberFormat('mmmm yyyy');
  sh.getRange('B5:D17').setNumberFormat('#,##0;-#,##0;"–"');
}
