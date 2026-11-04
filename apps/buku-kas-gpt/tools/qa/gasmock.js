// In-browser stand-ins for the Apps Script services BukuKas.gs uses, plus google.script.run.
// Not a general emulator: only the calls BukuKas.gs makes, with Sheets-like display formatting.
(() => {
  const CFG = window.__GCFG || {};
  const log = window.__glog = [];
  let nextId = 1;
  const files = window.__files = {};

  const colIdx = L => L.split('').reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0);
  function parseA1(a1) {
    const m = a1.replace(/\$/g, '').match(/^([A-Z]+)(\d+)?(?::([A-Z]+)(\d+)?)?$/);
    if (!m) throw new Error('bad a1 ' + a1);
    const c0 = colIdx(m[1]), r0 = m[2] ? +m[2] : 1, c1 = m[3] ? colIdx(m[3]) : c0, r1 = m[4] ? +m[4] : (m[3] ? 1000 : r0);
    return { r: r0, c: c0, nr: r1 - r0 + 1, nc: c1 - c0 + 1 };
  }
  const fmtNum = (v, fmt) => {
    if (typeof v !== 'number') return v;
    if (/%/.test(fmt || '')) return Math.round(v * 100) + '%';
    if (/#,##0/.test(fmt || '')) { const a = Math.round(Math.abs(v)).toLocaleString('en-US'); return v < 0 ? (/\(#,##0\)/.test(fmt) ? '(' + a + ')' : '-' + a) : (v === 0 && /;-$|"–"/.test(fmt) ? (/"–"/.test(fmt) ? '–' : '-') : a); }
    return String(v);
  };
  const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  function Sheet(ss, name) {
    this.ss = ss; this.name = name; this.cells = {}; this.fmt = {};
  }
  Sheet.prototype = {
    getName() { return this.name; }, setName(n) { this.name = n; return this; },
    key(r, c) { return r + ':' + c; },
    get(r, c) { return this.cells[this.key(r, c)]; },
    getLastRow() { let m = 0; for (const k in this.cells) { const cell = this.cells[k]; if (cell && (cell.v !== '' || cell.f)) m = Math.max(m, +k.split(':')[0]); } return m; },
    getRange(a, b, c, d) { if (typeof a === 'string') { const p = parseA1(a); return new Range(this, p.r, p.c, p.nr, p.nc); } return new Range(this, a, b, c || 1, d || 1); },
    insertRowsBefore(row, n) {
      const shift = obj => { const out = {}; for (const k in obj) { const [r, c] = k.split(':').map(Number); out[(r >= row ? r + n : r) + ':' + c] = obj[k]; } return out; };
      this.cells = shift(this.cells); this.fmt = shift(this.fmt);
      for (const k in this.cells) { const cell = this.cells[k]; if (cell.f) cell.f = cell.f.replace(/([A-Z])(\d+)\b(?![!(])/g, (m0, col, rr) => (+rr >= row && !/\$/.test(m0) ? col + (+rr + n) : m0)); }
      return this;
    },
    setFrozenRows() { return this; }, setColumnWidth() { return this; }, clearContents() { this.cells = {}; return this; }
  };
  function Range(sh, r, c, nr, nc) { this.sh = sh; this.r = r; this.c = c; this.nr = nr; this.nc = nc; }
  const chain = ['setBackground', 'setFontWeight', 'setFontSize', 'setFontColor', 'setDataValidation', 'setHorizontalAlignment'];
  Range.prototype = {
    each(fn) { for (let i = 0; i < this.nr; i++) for (let j = 0; j < this.nc; j++) fn(this.r + i, this.c + j, i, j); },
    getValues() { const out = []; for (let i = 0; i < this.nr; i++) { const row = []; for (let j = 0; j < this.nc; j++) { const cell = this.sh.get(this.r + i, this.c + j); row.push(cell ? evalCell(this.sh, this.r + i, cell) : ''); } out.push(row); } return out; },
    getValue() { return this.getValues()[0][0]; },
    getDisplayValues() {
      return this.getValues().map((row, i) => row.map((v, j) => {
        const f = this.sh.fmt[this.sh.key(this.r + i, this.c + j)] || '';
        if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
        if (v instanceof Date) { if (/mmm yyyy/.test(f)) return MON[v.getMonth()] + ' ' + v.getFullYear(); return v.toISOString().slice(0, 10); }
        return String(fmtNum(v, f));
      }));
    },
    setValues(vals) { vals.forEach((row, i) => row.forEach((v, j) => { this.sh.cells[this.sh.key(this.r + i, this.c + j)] = (typeof v === 'string' && v[0] === '=') ? { f: v, v: '' } : { v: parseInput(v, this.sh.fmt[this.sh.key(this.r + i, this.c + j)]) }; })); return this; },
    setValue(v) { return this.setValues([[v]]); },
    setFormula(f) { this.sh.cells[this.sh.key(this.r, this.c)] = { f, v: '' }; return this; },
    setFormulas(fs) { fs.forEach((row, i) => row.forEach((f, j) => { this.sh.cells[this.sh.key(this.r + i, this.c + j)] = f && f[0] === '=' ? { f, v: '' } : { v: f }; })); return this; },
    getFormula() { const cell = this.sh.get(this.r, this.c); return cell && cell.f ? cell.f : ''; },
    setNumberFormat(fmt) { this.each((r, c) => { this.sh.fmt[this.sh.key(r, c)] = fmt; }); return this; },
    insertCheckboxes() { this.each((r, c) => { const k = this.sh.key(r, c); if (!this.sh.cells[k]) this.sh.cells[k] = { v: false }; }); return this; },
    copyFormatToRange(sh, c0, c1, r0, r1) { for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) { const f = this.sh.fmt[this.sh.key(this.r, c)]; if (f) sh.fmt[sh.key(r, c)] = f; } return this; }
  };
  chain.forEach(m => { Range.prototype[m] = function () { return this; }; });
  function parseInput(v, fmt) { return v; }
  // Only the formula BukuKas.gs writes per transaction row is evaluated; others read as empty.
  function evalCell(sh, r, cell) {
    if (!cell.f) return cell.v;
    const m = cell.f.match(/^=IF\(K(\d+),J(\d+)\*Pengaturan!\$B\$4,""\)$/);
    if (m) { const k = sh.get(+m[1], 11), j = sh.get(+m[2], 10); const p = sh.ss.getSheetByName('Pengaturan'); const pv = p ? p.getRange('B4').getValue() : 0.5; return k && k.v === true ? (Number(j && j.v) || 0) * (typeof pv === 'number' ? pv : parseFloat(pv) / 100) : ''; }
    return '';
  }
  function Spreadsheet(name, id) { this.name = name; this.id = id || ('1Mock' + String(nextId++).padStart(4, '0') + 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');this.sheets = []; this.viewers = []; this.tz = 'Asia/Jakarta'; files[this.id] = this; }
  Spreadsheet.prototype = {
    getId() { return this.id; }, getUrl() { return 'https://docs.google.com/spreadsheets/d/' + this.id + '/edit'; },
    getSheetByName(n) { return this.sheets.find(s => s.name === n) || null; },
    getSheets() { return this.sheets.slice(); },
    insertSheet(n, idx) { const s = new Sheet(this, n); if (typeof idx === 'number') this.sheets.splice(idx, 0, s); else this.sheets.push(s); return s; },
    deleteSheet(s) { this.sheets = this.sheets.filter(x => x !== s); },
    setSpreadsheetLocale(l) { this.locale = l; }, setSpreadsheetTimeZone(t) { this.tz = t; }, getSpreadsheetTimeZone() { return this.tz; },
    addViewer(e) { log.push(['addViewer', this.id, e]); this.viewers.push(e); return this; }
  };
  window.__mkSheet = (ss, name, rows) => { const sh = ss.insertSheet(name); rows.forEach((row, i) => row.forEach((v, j) => { sh.cells[(i + 1) + ':' + (j + 1)] = { v }; })); return sh; };
  const active = new Spreadsheet('Active', 'active');
  window.__active = active;
  window.SpreadsheetApp = {
    getActiveSpreadsheet: () => active,
    openById: id => { log.push(['openById', id]); if (!files[id]) throw new Error('Spreadsheet not found or no access: ' + id); return files[id]; },
    create: name => { const s = new Spreadsheet(name); s.insertSheet('Sheet1'); log.push(['create', s.id, name]); return s; },
    flush: () => {},
    newDataValidation: () => { const b = { requireValueInRange: () => b, setAllowInvalid: () => b, build: () => ({}) }; return b; }
  };
  const props = Object.assign({}, CFG.props || {});
  window.__props = props;
  window.PropertiesService = { getScriptProperties: () => ({ getProperty: k => (k in props ? props[k] : null), setProperty: (k, v) => { props[k] = String(v); } }) };
  window.LockService = { getScriptLock: () => ({ waitLock() {}, tryLock: () => true, releaseLock() {} }) };
  window.Logger = { log: (...a) => log.push(['log', ...a]) };
  window.HtmlService = {};
  window.Utilities = {
    DigestAlgorithm: { MD5: 'MD5' },
    computeDigest: (alg, s) => { let h = 0; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) | 0; return [h & 255, (h >> 8) & 255, (h >> 16) & 255, String(s).length & 255]; },
    base64Encode: bytes => btoa(String.fromCharCode(...bytes.map(b => b & 255))),
    formatDate: (d, tz, f) => d.toISOString().slice(0, 10)
  };
  window.UrlFetchApp = {
    fetch: (url, opt) => {
      const body = JSON.parse(opt.payload);
      log.push(['fetch', url, opt.headers && opt.headers.Authorization, body.model, body.response_format]);
      const mode = window.__openai || 'ok';
      if (mode === '401') return { getResponseCode: () => 401, getContentText: () => JSON.stringify({ error: { message: 'Incorrect API key provided' } }) };
      const today = body.messages[0].content.match(/Hari ini (\d{4}-\d{2}-\d{2})/)[1];
      const content = JSON.stringify({ transaksi: [
        { ket: 'Kopi susu', nominal: 25000, kategori: 'Makan & Minum', tanggal: today, jam: '09:15', konteks: 'Pribadi', berdua: false },
        { ket: 'Sayur', nominal: 87500, kategori: 'Groceries', tanggal: today, jam: '', konteks: 'Pribadi', berdua: true }
      ] });
      return { getResponseCode: () => 200, getContentText: () => JSON.stringify({ choices: [{ message: { content } }] }) };
    }
  };
  // google.script.run: async proxy onto the global server functions, with a short delay like the real thing.
  function runner(ok, fail) {
    return new Proxy({}, { get(_, name) {
      if (name === 'withSuccessHandler') return fn => runner(fn, fail);
      if (name === 'withFailureHandler') return fn => runner(ok, fn);
      return (...args) => setTimeout(() => {
        const fn = window[name];
        log.push(['run', name]);
        try {
          if (typeof fn !== 'function') throw new Error('Script function not found: ' + name);
          if ((window.__failNext || {})[name]) { const m = window.__failNext[name]; delete window.__failNext[name]; throw new Error(m); }
          const res = JSON.parse(JSON.stringify(fn(...JSON.parse(JSON.stringify(args))) ?? null));
          ok && ok(res);
        } catch (e) { fail && fail(e); }
      }, 15);
    } });
  }
  window.google = { script: { run: runner(null, null) } };
})();
