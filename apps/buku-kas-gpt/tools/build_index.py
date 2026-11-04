"""Build apps-script/Index.html (Apps Script + GPT version) from the claude.ai app in ../buku-kas/index.html.

Run: python3 -I tools/build_index.py   (from apps/buku-kas-gpt)
Every replacement must match exactly once, so a drift in the source fails loudly instead of shipping a half-ported page.
"""
import pathlib, re, sys

HERE = pathlib.Path(__file__).resolve().parent.parent
src = (HERE.parent / 'buku-kas' / 'index.html').read_text(encoding='utf-8')
s = src


def rep(old, new, count=1):
    global s
    n = s.count(old)
    if n != count:
        sys.exit(f'expected {count} match(es), found {n}: {old[:90]!r}')
    s = s.replace(old, new)


def region(start, end, new):
    """Replace from `start` (inclusive) up to `end` (exclusive)."""
    global s
    i, j = s.find(start), s.find(end)
    if i < 0 or j < 0 or j < i or s.count(start) != 1:
        sys.exit(f'region not found: {start[:60]!r} .. {end[:60]!r}')
    s = s[:i] + new + s[j:]


# ---------- document head ----------
rep('<title>Buku Kas Otta Wanda</title>', '<title>Buku Kas</title>')
rep("const SHEET_ID = '1E5jpWWc7ZuA1TlApU9f5hmdGYGQCasgg4_m0N2k3WpU';", "/* Names, GPT status and links come from the server (Script properties). */\nconst CFG = { me: 'Saya', partner: '', hasAi: false, model: '', linked: false, outUrl: '', sheetUrl: '' };")

# ---------- base reset the claude.ai skeleton used to provide ----------
rep('*{box-sizing:border-box}', '*{box-sizing:border-box}\nhtml,body{margin:0}\n[hidden]{display:none!important}\nimg{max-width:100%}')

# ---------- state ----------
rep("""  // Wanda's view: she reads only rows marked Beban Bersama, synced by Otta's page into the artifact db.
  role: 'owner', db: null, preview: false,
  partner: null, pState: 'idle', pErr: null, pMonth: null,
  sync: { status: 'idle', at: null, count: 0, err: null }""",
    """  // Shared expenses: mine come from this sheet, the partner's from their published "Buku Kas Berdua" file.
  berduaIn: null, bMonth: null, bAll: false, settingUp: false,
  sync: { status: 'idle', at: null, count: 0, err: null, url: '', sharedWith: '' }""")

# ---------- settings labels are per person now ----------
rep("if (a === 'Porsi Otta untuk beban bersama') S.porsi = num(b) || 0.5;", "if (/^Porsi .*beban bersama/i.test(a)) S.porsi = num(b) || 0.5;")
rep("if (a === 'Saldo BCA terakhir') {", "if (/^Saldo .*terakhir/i.test(a)) {")

# ---------- data layer: claude.ai connectors -> google.script.run ----------
region('/* ---------- connector ---------- */', 'function localTx(d){', r'''/* ---------- backend (Google Apps Script) ---------- */
const GS = (typeof google !== 'undefined' && google.script && google.script.run) ? google.script.run : null;
function api(fn, ...args){
  return new Promise((resolve, reject) => {
    if (!GS) { reject({ code:'no_backend', message:'Halaman ini dibuka di luar Apps Script.' }); return; }
    GS.withSuccessHandler(resolve).withFailureHandler(e => {
      const msg = String((e && e.message) || e || '').replace(/^Error:\s*/, '');
      const m = msg.match(/^([A-Z][A-Z_]*[0-9]*):\s*([\s\S]*)$/);
      reject({ code: m ? m[1] : 'error', message: m ? m[2] : msg });
    })[fn](...args);
  });
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
function applyConfig(c){
  if (!c) return;
  Object.assign(CFG, c);
  try { document.title = 'Buku Kas ' + CFG.me + (CFG.partner ? ' ' + CFG.partner : ''); } catch {}
}
async function loadAll(refresh){
  if (!GS) return enterSample();
  S.refreshing = true;
  if (S.mode !== 'live') S.mode = 'loading';
  render();
  let d;
  try { d = await api('apiGetData'); }
  catch (e) {
    S.refreshing = false; S.err = e;
    S.mode = S.tx.length ? 'live' : 'error';
    if (S.mode === 'live') toast(errCopy(e).short);
    render(); return;
  }
  S.refreshing = false;
  applyConfig(d.config);
  if (d.needsSetup) { S.mode = 'setup'; render(); return; }
  S.err = null;
  S.tx = shapeTx(d.tx || []);
  S.kurs = []; S.sections = {};
  shapeSettings(d.peng || []); shapeDash(d.dash || []); shapeSplit(d.split || []);
  S.berduaIn = d.berduaIn || null;
  S.loadedAt = d.loadedAt || Date.now();
  S.mode = 'live';
  if (!S.month) S.month = mkey(today());
  render();
  syncBerdua();
}
function errCopy(e){
  const code = (e && e.code) || '', msg = (e && e.message) || '';
  if (code === 'NO_KEY') return { title:'GPT belum disambungkan', body:'Isi OPENAI_API_KEY di Script properties.', short:'GPT belum disambungkan', retry:false };
  if (/^OPENAI_/.test(code)) return { title:'GPT menolak permintaan', body:msg, short:'GPT error (' + code.replace('OPENAI_', '') + '): ' + msg.slice(0, 70), retry:true };
  if (code === 'BERGESER') return { title:'Baris sudah bergeser', body:msg, short:'Baris di sheet sudah bergeser. Memuat ulang…', retry:true };
  if (code === 'no_backend') return { title:'Belum tersambung ke sheet', body:'Buka app lewat link Web app dari Apps Script.', short:'Belum tersambung ke sheet', retry:false };
  if (/authoriz|permission|izin/i.test(msg)) return { title:'Izin belum diberikan', body:'Buka Apps Script, jalankan setupSheet sekali, lalu setujui izin yang diminta.', short:'Izin belum diberikan', retry:true };
  return { title:'Sheet belum bisa dibaca', body: msg || 'Terjadi masalah saat menghubungi Google Sheets.', short:'Gagal: ' + (msg || 'coba lagi').slice(0, 80), retry:true };
}

/* ---------- writes ---------- */
async function saveDrafts(drafts){
  const valid = drafts.filter(d => d.ket && d.nominal && d.date && d.kat);
  if (!valid.length) { toast('Isi keterangan dan nominal dulu'); return false; }
  if (S.mode === 'sample') {
    valid.forEach(d => S.tx.unshift(localTx(d)));
    S.tx.sort((a,b) => (b.date + b.time).localeCompare(a.date + a.time));
    toast(`Mode contoh: ${valid.length} transaksi tidak dikirim ke sheet`);
    return true;
  }
  try {
    await api('apiAppend', valid.map(d => ({ date:d.date, time:d.time || '', kat:d.kat, konteks:d.konteks || 'Pribadi', ket:d.ket, nominal:Math.round(d.nominal), shared:!!d.shared })));
    toast(valid.length > 1 ? `${valid.length} transaksi masuk ke sheet` : 'Masuk ke sheet');
    loadAll(true);
    return true;
  } catch (e) {
    toast(errCopy(e).short);
    loadAll(true);
    return false;
  }
}
''')

region('async function saveEdit(t, patch){', '/* ---------- text parsing ---------- */', r'''async function saveEdit(t, patch){
  const cat = catInfo(patch.kat) || { arah:t.arah, sifat:t.sifat };
  const arah = patch.kat === TALANGAN ? (patch.lunas ? 'Netral' : 'Keluar') : cat.arah;
  const next = { ...t, kat:patch.kat, konteks:patch.konteks, shared:patch.shared, arah, sifat:cat.sifat };
  if (S.mode === 'sample') { Object.assign(t, next); toast('Mode contoh: perubahan tidak dikirim'); return true; }
  if (!t.row) { toast('Baris ini belum punya nomor di sheet. Muat ulang dulu.'); return false; }
  try {
    const r = await api('apiUpdate', { row:t.row, expect:{ date:t.date, ket:t.ket, nominal:t.nominal }, kat:patch.kat, konteks:patch.konteks, shared:!!patch.shared, lunas:!!patch.lunas });
    Object.assign(t, next, { row:r.row, arah:r.arah, sifat:r.sifat });
    toast('Sheet diperbarui');
    syncBerdua();
    return true;
  } catch (e) {
    toast(errCopy(e).short);
    if (e.code === 'BERGESER') loadAll(true);
    return false;
  }
}

''')

# ---------- text parsing: partner name + GPT ----------
rep("const shared = /berdua|sama wanda|split|bagi dua/i.test(seg);",
    "const sharedRe = new RegExp('berdua|split|bagi dua' + (CFG.partner ? '|sama ' + CFG.partner.toLowerCase().replace(/[^a-z0-9 ]/g, '') : ''), 'i');\n    const shared = sharedRe.test(seg);")
rep("replace(/kemarin|berdua|sama wanda|split|bagi dua|rp\\.?/gi, '')",
    "replace(new RegExp('kemarin|berdua|split|bagi dua|rp\\\\.?' + (CFG.partner ? '|sama ' + CFG.partner.toLowerCase().replace(/[^a-z0-9 ]/g, '') : ''), 'gi'), '')")
rep("const hit = KEYWORDS.find(([re]) => re.test(seg));", "const hit = KEYWORDS.find(([re, k]) => re.test(seg) && catInfo(k));")
rep("konteks: /studio|klien|produksi|mixing|mastering/i.test(seg)", "konteks: /klien|kantor|kerjaan|studio|produksi/i.test(seg)")
region('async function smartParse(text){', '/* ---------- sample mode ---------- */', r'''async function smartParse(text){
  if (GS && CFG.hasAi) {
    const now = new Date();
    const y = new Date(now); y.setDate(y.getDate() - 1);
    try {
      const arr = await api('apiParse', text, { today: ymd(now), hari: HARI[now.getDay()], now: hm(now), yesterday: ymd(y) });
      if (Array.isArray(arr) && arr.length) {
        const names = new Set(S.cats.map(c => c.name));
        return { via:'gpt', rows: arr.map(o => ({
          ket: String(o.ket || 'Pengeluaran').slice(0, 120),
          nominal: Math.abs(Math.round(Number(o.nominal) || 0)),
          kat: names.has(o.kategori) ? o.kategori : UNCLEAR,
          date: /^\d{4}-\d{2}-\d{2}$/.test(o.tanggal) ? o.tanggal : ymd(now),
          time: /^\d{2}:\d{2}$/.test(o.jam) ? o.jam : '',
          konteks: o.konteks === 'Kerja' ? 'Kerja' : 'Pribadi',
          shared: !!o.berdua
        })).filter(r => r.nominal > 0) };
      }
    } catch (e) { toast(errCopy(e).short + '. Pakai pengurai lokal.'); }
  }
  return { via:'lokal', rows: localParse(text) };
}

''')

# ---------- branding ----------
rep("const BRAND = `<div class=\"brand\"><span class=\"mark\" aria-hidden=\"true\">OW</span><span class=\"brand-name\">Buku Kas <span class=\"brand-sub\">Otta Wanda</span></span></div>`;",
    "const initials = () => ((CFG.me[0] || 'B') + (CFG.partner ? CFG.partner[0] : (CFG.me[1] || 'K'))).toUpperCase();\nconst brand = () => `<div class=\"brand\"><span class=\"mark\" aria-hidden=\"true\">${esc(initials())}</span><span class=\"brand-name\">Buku Kas <span class=\"brand-sub\">${esc(CFG.me === 'Saya' ? '' : CFG.me)}${CFG.partner ? ' ' + esc(CFG.partner) : ''}</span></span></div>`;")
s = s.replace('${BRAND}', '${brand()}')
rep("return `<div class=\"banner\"><span>Ini data contoh. Buka halaman ini di claude.ai dengan Google Sheets tersambung untuk melihat transaksi kamu.</span></div>`;",
    "return `<div class=\"banner\"><span>Ini data contoh. Buka app lewat link Web app dari Apps Script untuk melihat transaksi kamu.</span></div>`;")
rep("Dari tab Dashboard di sheet. Saldo BCA ", "Dari tab Dashboard di sheet. Saldo ")
rep('<span class="small muted">Saldo BCA terakhir</span>', '<span class="small muted">Saldo terakhir</span>')

# ---------- Kas: split card, berdua card, source card ----------
rep('<section class="card" aria-label="Split dengan Wanda">', '<section class="card" aria-label="Split">')
rep('<h2>Split dengan Wanda</h2><span class="small muted">porsi Otta ${Math.round(S.porsi * 100)}%</span>',
    '<h2>Split${CFG.partner ? \' dengan \' + esc(CFG.partner) : \'\'}</h2><span class="small muted">porsi ${esc(CFG.me)} ${Math.round(S.porsi * 100)}%</span>')
rep("${['Bulan','Total','Otta','Wanda'].map(", "${['Bulan','Total',CFG.me,CFG.partner || 'Pasangan'].map(")
rep('${viewSyncCard()}', '${CFG.partner ? viewBerduaCard() : \'\'}')
rep('<b>Spending Tracker 2026 V2</b><p class="small muted">Sumber kebenaran tetap Obsidian. Transaksi baru dari app ditandai sumber “app”.',
    '<b>Google Sheet kamu</b><p class="small muted">Semua angka dibaca dari tab Transaksi, Pengaturan, Dashboard, dan Split. Transaksi baru dari app ditandai sumber “app”.')
rep('href="https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit"', 'href="${esc(CFG.sheetUrl || \'#\')}"')

# ---------- onboarding + setup ----------
rep('Catat sekali ketik, langsung masuk ke Spending Tracker 2026 V2. Kategori, runway, dan split sama Wanda ikut dari sheet yang sama.',
    'Catat sekali ketik, langsung masuk ke Google Sheet kamu. Kategori, runway, dan pembagian berdua dihitung dari sheet yang sama.')
region('''  return `<div class="ob">
    <div class="row"><button class="iconbtn" data-act="ob-back"''', 'function viewSetup(){' if 'function viewSetup(){' in s else '/* ---------- Wanda', r'''  return `<div class="ob">
    <div class="row"><button class="iconbtn" data-act="ob-back" aria-label="Kembali">${ICON.left}</button></div>
    <div class="stack"><h1>Semua tersimpan di sheet kamu</h1><p class="muted">App ini tidak punya database sendiri. Semuanya dibaca dan ditulis ke Google Sheet tempat script ini dipasang.</p></div>
    <div class="stack" style="gap:10px">
      <div class="opt"><span class="glyph" aria-hidden="true">TR</span><div style="min-width:0"><b>Catat cepat</b><p class="small muted">Ketik seperti chat. GPT memecahnya jadi baris transaksi lengkap dengan kategori.</p></div></div>
      <div class="opt"><span class="glyph" aria-hidden="true" style="--g:var(--c2)">2</span><div style="min-width:0"><b>Hitung berdua</b><p class="small muted">Centang Beban Bersama, app menghitung siapa transfer ke siapa.</p></div></div>
      <div class="opt"><span class="glyph" aria-hidden="true" style="--g:var(--c5)">✎</span><div style="min-width:0"><b>Pilah dan rapikan</b><p class="small muted">Ubah kategori kapan saja. Baris dicek dulu sebelum ditimpa.</p></div></div>
    </div>
    <div class="steps"><i class="on"></i><i class="on"></i></div>
    <button class="btn wide" data-act="ob-connect">${ICON.sheet} Buka buku kas</button>
  </div>`;
}
function viewSetup(){
  return `${topBar()}<section class="card" style="margin-top:20px">
    <h2>Siapkan sheet</h2>
    <p class="muted">Sheet ini belum punya tab Buku Kas. Tombol di bawah membuat tab Transaksi, Pengaturan, Dashboard, dan Split. Tab yang sudah ada tidak disentuh.</p>
    <button class="btn wide" data-act="do-setup" ${S.settingUp ? 'disabled' : ''}>${S.settingUp ? 'Menyiapkan…' : 'Siapkan sheet'}</button>
  </section>`;
}

''')

# ---------- berdua view (replaces the claude.ai partner view) ----------
region("/* ---------- Wanda's view (shared expenses only) ---------- */", 'function viewError(){', r'''/* ---------- berdua: who owes whom ---------- */
function myShared(){ return S.tx.filter(t => t.shared).map(t => ({ d:t.date, t:t.time || '', ket:t.ket, kat:t.kat, n:Math.round(t.nominal), sem:t.src.startsWith('email'), by:'me' })); }
function theirShared(){ const b = S.berduaIn; return b && !b.error ? (b.rows || []).filter(r => /^\d{4}-\d{2}-\d{2}/.test(r.d)).map(r => ({ ...r, d:r.d.slice(0, 10), by:'them' })) : []; }
function berduaMonth(k){
  const mine = myShared().filter(r => mkey(r.d) === k), theirs = theirShared().filter(r => mkey(r.d) === k);
  const pMe = S.porsi || 0.5, pThem = (S.berduaIn && !S.berduaIn.error && S.berduaIn.porsi) || 0.5;
  const A = mine.reduce((s,r) => s + r.n, 0), B = theirs.reduce((s,r) => s + r.n, 0);
  const theyOwe = A * (1 - pMe), iOwe = B * (1 - pThem);
  return { k, mine, theirs, A, B, theyOwe, iOwe, net: theyOwe - iOwe, pMe, pThem };
}
function netText(m){
  const P = esc(CFG.partner || 'Pasangan');
  if (Math.abs(m.net) < 1) return 'Impas';
  return m.net > 0 ? `${P} transfer ke kamu` : `Kamu transfer ke ${P}`;
}
function syncBerdua(){
  if (!GS || S.mode !== 'live' || !CFG.partner || S.sync.status === 'busy') return;
  S.sync = { ...S.sync, status:'busy' };
  api('apiSyncBerdua').then(r => {
    S.sync = { status:'ok', at:Date.now(), count:r.count || 0, url:r.url || '', sharedWith:r.sharedWith || '', err:null };
  }).catch(e => { S.sync = { ...S.sync, status:'error', err:e }; })
    .then(() => { if ((S.tab === 'kas' || S.tab === 'berdua') && !S.sheet) render(); });
}
function viewBerduaCard(){
  const m = berduaMonth(mkey(today()));
  return `<section class="card" aria-label="Berdua">
    <div class="row between"><h2>Berdua dengan ${esc(CFG.partner)}</h2><button class="link" data-act="tab" data-tab="berdua">Buka</button></div>
    <div class="row between wrap" style="align-items:flex-end"><span class="muted">${netText(m)} bulan ini</span><b class="num" style="font-family:var(--display);font-size:22px">${rp(Math.abs(m.net))}</b></div>
    ${CFG.linked ? '' : `<p class="small muted">Baru dari catatan kamu. Sambungkan file berdua milik ${esc(CFG.partner)} supaya hitungannya lengkap.</p>`}
  </section>`;
}
function viewBerdua(){
  const P = esc(CFG.partner || 'Pasangan');
  const all = [...myShared(), ...theirShared()];
  const months = [...new Set(all.map(r => mkey(r.d)))].sort().reverse();
  const cur = mkey(today());
  if (!months.includes(cur)) months.unshift(cur);
  if (!S.bMonth || !months.includes(S.bMonth)) S.bMonth = cur;
  const i = months.indexOf(S.bMonth);
  const m = berduaMonth(S.bMonth);
  const rows = [...m.mine, ...m.theirs].sort((a,b) => (b.d + b.t).localeCompare(a.d + a.t));
  const LIMIT = 25, shown = S.bAll ? rows : rows.slice(0, LIMIT), more = rows.length - shown.length;
  const byDay = {}; shown.forEach(r => (byDay[r.d] = byDay[r.d] || []).push(r));
  const days = Object.keys(byDay).sort().reverse();
  const b = S.berduaIn, sy = S.sync;
  const theirStatus = !CFG.linked ? `Belum disambungkan. Minta ${P} kirim link file “Buku Kas Berdua — ${P}”, lalu isi BERDUA_MASUK_ID di Script properties.`
    : b && b.error ? `File ${P} belum bisa dibaca: ${esc(b.error)}. Pastikan file itu sudah dibagikan ke akun Google kamu.`
    : b ? `${b.rows.length} transaksi dari ${P}${b.updatedAt ? ' · diperbarui ' + new Date(b.updatedAt).toLocaleString('id-ID', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' }) : ''}.` : 'Memuat…';
  const myStatus = sy.status === 'busy' ? 'Menerbitkan…'
    : sy.status === 'error' ? `Gagal menerbitkan: ${esc(errCopy(sy.err).short)}`
    : sy.status === 'ok' ? `${sy.count} transaksi berdua kamu sudah terbit${sy.sharedWith ? ' dan dibagikan ke ' + esc(sy.sharedWith) : '. Bagikan filenya ke ' + P + ' sebagai Viewer'}.`
    : S.mode === 'sample' ? 'Mode contoh: tidak ada yang diterbitkan.' : 'Belum diterbitkan.';
  return `${topBar()}${sampleBanner()}${errBanner()}
  <div class="row between wrap"><h1>Berdua</h1>
    <div class="row" style="gap:4px">
      <button class="iconbtn" data-act="bmonth" data-d="1" aria-label="Bulan sebelumnya" ${i >= months.length - 1 ? 'disabled' : ''}>${ICON.left}</button>
      <b style="min-width:84px;text-align:center">${monthLabel(m.k)}</b>
      <button class="iconbtn" data-act="bmonth" data-d="-1" aria-label="Bulan berikutnya" ${i <= 0 ? 'disabled' : ''}>${ICON.right}</button>
    </div>
  </div>
  <section class="hero hero-card partner-hero" aria-label="Hitungan berdua">
    <span class="label">${netText(m)}</span>
    <div class="big num"><small>Rp</small>${Math.round(Math.abs(m.net)).toLocaleString('id-ID')}</div>
    <div class="kv">
      <div><span class="small muted">Kamu bayar berdua</span><b>${rpShort(m.A)}</b><span class="small muted">bagian ${P} ${rpShort(m.theyOwe)}</span></div>
      <div><span class="small muted">${P} bayar berdua</span><b>${CFG.linked ? rpShort(m.B) : '–'}</b><span class="small muted">${CFG.linked ? 'bagian kamu ' + rpShort(m.iOwe) : 'belum disambungkan'}</span></div>
    </div>
  </section>
  <section class="card" style="gap:4px" aria-label="Transaksi berdua">
    <h2 style="margin-bottom:6px">Transaksi berdua</h2>
    ${days.length ? days.map(d => {
      const dt = parseYMD(d), list = byDay[d];
      return `<div class="dayhead"><span class="label">${HARI[dt.getDay()]}, ${dt.getDate()} ${BLN[dt.getMonth()]}</span></div>
      <div>${list.map(r => `<div class="tx" role="listitem">${glyph(r.kat)}
        <span class="main"><span class="ttl">${esc(r.ket || '(tanpa keterangan)')}</span>
        <span class="sub">${esc(r.kat)}${r.t ? ' · ' + esc(r.t) : ''} <span class="pill ${r.by === 'me' ? 'acc' : 'in'}">${r.by === 'me' ? 'dibayar kamu' : 'dibayar ' + P}</span>${r.sem ? ' <span class="pill">sementara</span>' : ''}</span></span>
        <span style="text-align:right"><span class="amt" style="display:block">${rp(r.n)}</span><span class="small muted num">bagian ${r.by === 'me' ? P : 'kamu'} ${rp(r.n * (1 - (r.by === 'me' ? m.pMe : m.pThem)))}</span></span>
      </div>`).join('')}</div>`;
    }).join('') : `<div class="empty">Belum ada transaksi berdua di ${monthLabel(m.k, true)}. Centang Beban Bersama saat mencatat.</div>`}
    ${more > 0 ? `<button class="btn ghost wide" style="margin-top:8px" data-act="ball">Tampilkan ${more} transaksi lagi</button>` : ''}
  </section>
  <section class="card" aria-label="Sambungan berdua">
    <h2>Sambungan</h2>
    <div class="stack" style="gap:6px"><b>File berdua kamu</b><p class="small muted">${myStatus}</p>${sy.url ? `<a class="link" href="${esc(sy.url)}" target="_blank" rel="noopener">Buka file berdua kamu</a>` : ''}</div>
    <div class="stack" style="gap:6px"><b>File berdua ${P}</b><p class="small muted">${theirStatus}</p></div>
    <p class="small muted">Yang dibagikan hanya transaksi yang dicentang Beban Bersama. Transaksi pribadi, saldo, dan runway tidak ikut.</p>
  </section>`;
}

''')

rep('${c.perms ? \'<button class="btn ghost" data-act="perms">Buka izin</button>\' : \'\'}', '')
rep('<p class="muted">Membaca Spending Tracker 2026 V2…</p>', '<p class="muted">Membaca sheet…</p>')

# ---------- render ----------
rep("  if (S.role === 'partner' || S.preview) { root.innerHTML = viewPartner(); bar.hidden = true; return; }\n",
    "  if (S.mode === 'setup') { root.innerHTML = viewSetup(); bar.hidden = true; return; }\n")
rep("root.innerHTML = S.tab === 'riwayat' ? viewHistory() :", "root.innerHTML = S.tab === 'berdua' && CFG.partner ? viewBerdua() : S.tab === 'riwayat' ? viewHistory() :")
rep("const tabs = [['beranda','Beranda',ICON.home],['riwayat','Riwayat',ICON.list],['laporan','Laporan',ICON.chart],['kas','Kas',ICON.kas]];",
    "const tabs = [['beranda','Beranda',ICON.home],['riwayat','Riwayat',ICON.list],['laporan','Laporan',ICON.chart],['kas','Kas',ICON.kas]];\n  if (CFG.partner) tabs.splice(3, 0, ['berdua','Berdua',ICON.duo]);")
rep("  plus:'<svg", "  duo:'<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\"><circle cx=\"9\" cy=\"9\" r=\"3.5\"/><circle cx=\"16\" cy=\"11\" r=\"3\"/><path d=\"M3 20c.6-3.4 3-5.5 6-5.5s5.4 2.1 6 5.5M14.5 15.2c3 .1 5.2 2 5.7 4.8\" stroke-linecap=\"round\"/></svg>',\n  plus:'<svg")

# ---------- add / detail sheets: names, GPT, talangan ----------
rep("“berdua” atau “sama Wanda” menandai beban bersama.${S.sample ? ' Diuraikan oleh Claude, dengan daftar kategori dari tab Pengaturan.' : ''}",
    "“berdua”${CFG.partner ? ' atau “sama ' + esc(CFG.partner) + '”' : ''} menandai beban bersama.${CFG.hasAi ? ' Diuraikan oleh GPT, dengan daftar kategori dari tab Pengaturan.' : ' GPT belum disambungkan, jadi pengurai lokal yang dipakai.'}")
rep("diuraikan ${s.via === 'claude' ? 'Claude' : 'lokal'}", "diuraikan ${s.via === 'gpt' ? 'GPT' : 'lokal'}")
rep("Beban bersama dengan Wanda (porsi Otta ${Math.round(S.porsi * 100)}%)", "Beban bersama${CFG.partner ? ' dengan ' + esc(CFG.partner) : ''} (porsi ${esc(CFG.me)} ${Math.round(S.porsi * 100)}%)")
rep("<dt>Porsi Otta</dt>", "<dt>Porsi ${esc(CFG.me)}</dt>")
rep('''<label class="check"><input type="checkbox" id="e-shared" ${s.shared ? 'checked' : ''}> Beban bersama dengan Wanda</label>''',
    '''<label class="check"><input type="checkbox" id="e-shared" ${s.shared ? 'checked' : ''}> Beban bersama${CFG.partner ? ' dengan ' + esc(CFG.partner) : ''}</label>
    ${s.kat === TALANGAN ? `<label class="check"><input type="checkbox" id="e-lunas" ${s.lunas ? 'checked' : ''}> Sudah diganti (tidak dihitung pengeluaran)</label>` : ''}''')
rep("s.shared === t.shared && !arahOff({ kat:s.kat, arah:t.arah })) ? 'disabled'",
    "s.shared === t.shared && !arahOff({ kat:s.kat, arah:t.arah }) && !(s.kat === TALANGAN && !!s.lunas !== (t.arah === 'Netral'))) ? 'disabled'")
rep("openSheet({ kind:'detail', t, kat:t.kat, konteks:t.konteks, shared:t.shared });", "openSheet({ kind:'detail', t, kat:t.kat, konteks:t.konteks, shared:t.shared, lunas:t.arah === 'Netral' });")
rep("saveEdit(s.t, { kat:s.kat, konteks:s.konteks, shared:s.shared })", "saveEdit(s.t, { kat:s.kat, konteks:s.konteks, shared:s.shared, lunas:!!s.lunas })")
rep("  if (t.id === 'e-shared') { S.sheet.shared = t.checked; renderSheet(); }", "  if (t.id === 'e-shared') { S.sheet.shared = t.checked; renderSheet(); }\n  if (t.id === 'e-lunas') { S.sheet.lunas = t.checked; renderSheet(); }")

# ---------- events ----------
region("    case 'ob-connect':", "    case 'tab':", r'''    case 'ob-connect': S.onboard = -1; store.set('onboarded', '1'); if (GS) loadAll(false); else { enterSample(); toast('Belum tersambung ke sheet. Menampilkan data contoh.'); } break;
    case 'refresh': if (GS && !S.refreshing) loadAll(true); break;
    case 'do-setup': {
      if (S.settingUp) break;
      S.settingUp = true; render();
      try { await api('apiSetup'); toast('Sheet siap'); S.settingUp = false; await loadAll(true); }
      catch (e) { S.settingUp = false; toast(errCopy(e).short); render(); }
      break;
    }
    case 'bmonth': {
      const all = [...new Set([...myShared(), ...theirShared()].map(r => mkey(r.d)))].sort().reverse();
      if (!all.includes(mkey(today()))) all.unshift(mkey(today()));
      const j = all.indexOf(S.bMonth) + Number(el.dataset.d);
      if (j >= 0 && j < all.length) { S.bMonth = all[j]; S.bAll = false; render(); }
      break;
    }
    case 'ball': S.bAll = true; render(); break;
''')
rep("['beranda','riwayat','laporan','kas'].includes(h)", "['beranda','riwayat','laporan','kas','berdua'].includes(h)")
rep("['beranda','riwayat','laporan','kas'].includes(h0)", "['beranda','riwayat','laporan','kas','berdua'].includes(h0)")

# ---------- boot ----------
region("(async () => {\n  const c = window.claude;", "})();\n</script>", r'''(async () => {
  if (S.onboard >= 0) { S.mode = 'idle'; render(); return; }
  if (GS) loadAll(false); else enterSample();
})();
''')

# ---------- leftovers that must be gone ----------
for bad in ['S.mcp', 'S.sample', 'S.db', 'window.claude', 'viewPartner', 'syncPartner', 'Spending Tracker 2026 V2', 'Wanda', 'Otta', 'claude.ai', 'SHEET_ID']:
    if bad in s:
        lines = [i + 1 for i, l in enumerate(s.splitlines()) if bad in l]
        sys.exit(f'leftover {bad!r} on lines {lines[:8]}')

out = HERE / 'apps-script' / 'Index.html'
out.write_text(s, encoding='utf-8')
print('wrote', out, len(s), 'bytes')
