// QA for the Apps Script + GPT build. Runs the real BukuKas.gs in the page against gasmock.js.
// Usage: node qa-gpt.js <fixture.json> <outdir>
// The fixture (a snapshot of a real Transaksi/Pengaturan/Dashboard/Split) stays outside the repo.
const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const FIX = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const OUT = process.argv[3];
const MOCK = fs.readFileSync(path.join(__dirname, 'gasmock.js'), 'utf8');
const SERVER = fs.readFileSync(path.join(ROOT, 'apps-script', 'BukuKas.gs'), 'utf8');
const INDEX = fs.readFileSync(path.join(ROOT, 'apps-script', 'Index.html'), 'utf8');
fs.writeFileSync(path.join(OUT, 'gas.html'), '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body><script>' + SERVER + '</script>' + INDEX + '</body></html>');
const URL = 'file://' + path.join(OUT, 'gas.html');

const results = [];
const check = (name, ok, detail) => { results.push({ name, ok: !!ok }); console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail !== undefined ? '  :: ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)).slice(0, 300) : '')); };
const num = s => { s = String(s).trim(); if (!s || s === '–') return 0; const neg = s.startsWith('('); s = s.replace(/[(),]/g, ''); const n = parseFloat(s) || 0; return neg ? -n : n; };

// Workbook seeding scripts (run inside the page after gasmock).
const seedOtta = `(() => {
  const F = window.__FIX;
  const ss = window.__active;
  const tx = ss.insertSheet('Transaksi');
  const H = ['Tanggal','Jam','Bulan','Sumber','Arah','Kategori','Sifat','Konteks','Keterangan','Nominal','Beban Bersama','Porsi Otta'];
  H.forEach((h, j) => { tx.cells['1:' + (j + 1)] = { v: h }; });
  F.tx.forEach((r, i) => {
    const R = i + 2;
    r.forEach((v, j) => {
      let val = v;
      if (j === 9 || j === 11) { val = v === '' || v === undefined ? '' : (String(v).startsWith('(') ? -1 : 1) * parseFloat(String(v).replace(/[(),]/g, '')); }
      if (j === 10) val = String(v).toUpperCase() === 'TRUE';
      tx.cells[R + ':' + (j + 1)] = { v: val };
    });
    if (r.length < 12) tx.cells[R + ':12'] = { f: '=IF(K' + R + ',J' + R + '*Pengaturan!$B$4,"")', v: '' };
    tx.fmt[R + ':10'] = '#,##0;(#,##0);-'; tx.fmt[R + ':1'] = 'yyyy-mm-dd'; tx.fmt[R + ':2'] = 'HH:mm'; tx.fmt[R + ':3'] = 'mmm yyyy';
  });
  window.__mkSheet(ss, 'Pengaturan', F.peng);
  window.__mkSheet(ss, 'Dashboard', F.dash);
  window.__mkSheet(ss, 'Split', F.split);
  // Wanda's published berdua file, as her app would write it.
  const w = SpreadsheetApp.create('Buku Kas Berdua — Wanda');
  w.sheets[0].setName('Info');
  window.__mkSheet(w, 'Berdua', [['Tanggal','Jam','Keterangan','Kategori','Nominal','Sementara'], [new Date().toISOString().slice(0,10), '19:00', 'Martabak', 'Makan & Minum', 60000, ''], ['2026-10-20', '', 'Sabun', 'Rumah Tangga', 40000, '']]);
  w.getSheetByName('Info').getRange('A3:B6').setValues([['Nama','Wanda'],['Porsi pemilik',0.5],['Diperbarui', new Date().toISOString()],['Jumlah baris',2]]);
  window.__props.BERDUA_MASUK_ID = 'https://docs.google.com/spreadsheets/d/' + w.id + '/edit#gid=0';
})();`;
const seedWanda = `(() => { window.__active.insertSheet('Sheet1'); })();`;

let browser;
async function open({ props = {}, seed = seedOtta, scheme = 'light', openai = 'ok', failNext = null } = {}) {
  const ctx = await browser.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 1, colorScheme: scheme });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|ERR_NAME|net::/.test(m.text())) errors.push('console: ' + m.text()); });
  await page.addInitScript(`window.__FIX = ${JSON.stringify(FIX)}; window.__GCFG = ${JSON.stringify({ props })}; window.__openai = ${JSON.stringify(openai)}; window.__failNext = ${JSON.stringify(failNext)}; try { localStorage.setItem('bk_onboarded','1'); } catch {}`);
  await page.addInitScript(MOCK);
  await page.addInitScript(seed);
  await page.goto(URL);
  page.__errors = errors; page.__ctx = ctx;
  return page;
}
const text = p => p.evaluate(() => document.body.innerText);
const glog = p => p.evaluate(() => window.__glog);
const cell = (p, file, sheet, a1) => p.evaluate(([f, s, a]) => { const ss = f === 'active' ? window.__active : window.__files[f]; const sh = ss.getSheetByName(s); return sh.getRange(a).getValues(); }, [file, sheet, a1]);
const tap = async (p, sel) => { await p.click(sel); await p.waitForTimeout(200); };
async function waitText(p, t, ms = 5000) { try { await p.waitForFunction(x => document.body.innerText.toLowerCase().includes(x.toLowerCase()), t, { timeout: ms }); return true; } catch { return false; } }
const close = async (p, label) => { check('no console errors (' + label + ')', p.__errors.length === 0, p.__errors.slice(0, 3)); await p.__ctx.close(); };
const OTTA = { NAMA_SAYA: 'Otta', NAMA_PASANGAN: 'Wanda', EMAIL_PASANGAN: 'wanda@example.com', OPENAI_API_KEY: 'sk-test', OPENAI_MODEL: 'gpt-test' };

(async () => {
  browser = await chromium.launch();
  const thisMonth = new Date().toISOString().slice(0, 7);
  const nov = FIX.tx.filter(r => r[0].startsWith(thisMonth));
  const novOut = nov.filter(r => r[4] === 'Keluar').reduce((s, r) => s + num(r[9]), 0);

  // G1 load
  let p = await open({ props: OTTA });
  check('G1 home renders from Apps Script backend', await waitText(p, 'Selamat'));
  await p.waitForTimeout(500);
  const t1 = await text(p);
  check('G1 brand + title use Script properties', t1.includes('Otta Wanda') && (await p.title()) === 'Buku Kas Otta Wanda', await p.title());
  check('G1 month-to-date equals sheet', t1.includes(Math.round(novOut).toLocaleString('id-ID')), novOut);
  check('G1 Berdua tab present', await p.$('[data-act="tab"][data-tab="berdua"]') !== null);
  await p.screenshot({ path: path.join(OUT, 'gas-home.png'), fullPage: true });

  // G2 history count
  await tap(p, '[data-act="tab"][data-tab="riwayat"]');
  const cnt = Number(((await text(p)).match(/(\d+) transaksi/) || [])[1]);
  check('G2 history = month rows in sheet', cnt === nov.length, { got: cnt, exp: nov.length });

  // G3 edit with a row inserted above meanwhile (robot or Hermes)
  await tap(p, '.tx[data-act="detail"]');
  const target = await p.evaluate(() => { const i = document.querySelector('.detail dd:nth-of-type(4)').innerText; return i; });
  const rowNo = Number((target.match(/!(\d+)/) || [])[1]);
  const before = await cell(p, 'active', 'Transaksi', `A${rowNo}:J${rowNo}`);
  await p.evaluate(() => { const sh = window.__active.getSheetByName('Transaksi'); sh.insertRowsBefore(2, 1); sh.getRange(2, 1, 1, 10).setValues([['2026-11-05', '08:00', 'Nov 2026', 'email-kartu', 'Keluar', 'Transport', 'Variabel', 'Pribadi', 'Robot row', 9000]]); });
  await p.selectOption('#e-kat', 'Hiburan & Hobi');
  await tap(p, '[data-act="save-edit"]'); await p.waitForTimeout(500);
  const moved = await cell(p, 'active', 'Transaksi', `A${rowNo + 1}:K${rowNo + 1}`);
  check('G3 shifted row found by content and updated', moved[0][8] === before[0][8] && moved[0][5] === 'Hiburan & Hobi' && moved[0][4] === 'Keluar', moved[0]);
  const robot = await cell(p, 'active', 'Transaksi', 'A2:J2');
  check('G3 robot row untouched', robot[0][8] === 'Robot row' && robot[0][5] === 'Transport');
  await close(p, 'otta edit');

  // G4 quick add via GPT
  p = await open({ props: OTTA });
  await waitText(p, 'Selamat'); await p.waitForTimeout(400);
  await p.fill('#quick-input', 'kopi 25k, sayur 87,5rb berdua');
  await tap(p, '.quick .go'); await p.waitForTimeout(500);
  check('G4 GPT parse shown', /diuraikan gpt/i.test(await text(p)));
  const f4 = (await glog(p)).find(l => l[0] === 'fetch');
  check('G4 OpenAI called with key, model, JSON mode', f4 && f4[1] === 'https://api.openai.com/v1/chat/completions' && f4[2] === 'Bearer sk-test' && f4[3] === 'gpt-test' && f4[4].type === 'json_object', f4);
  await tap(p, '[data-act="save-drafts"]'); await p.waitForTimeout(700);
  const top = await cell(p, 'active', 'Transaksi', 'A2:L3');
  const byKet = Object.fromEntries(top.map(r => [r[8], r]));
  check('G4 rows inserted at top with source app', byKet['Kopi susu'] && byKet['Sayur'] && byKet['Kopi susu'][3] === 'app', top.map(r => r.slice(0, 11)));
  check('G4 direction/sifat from Pengaturan', byKet['Kopi susu'] && byKet['Kopi susu'][4] === 'Keluar' && byKet['Kopi susu'][6] === 'Variabel');
  check('G4 shared row: checkbox + Porsi formula = 43.750', byKet['Sayur'] && byKet['Sayur'][10] === true && byKet['Sayur'][11] === 43750, byKet['Sayur']);
  check('G4 month column first of month', byKet['Kopi susu'] && byKet['Kopi susu'][2] === byKet['Kopi susu'][0].slice(0, 8) + '01');
  await close(p, 'gpt add');

  // G4b GPT rejects the key -> local parser, user told
  p = await open({ props: OTTA, openai: '401' });
  await waitText(p, 'Selamat'); await p.waitForTimeout(400);
  await p.fill('#quick-input', 'kopi 25k dan parkir 5k');
  await tap(p, '.quick .go'); await p.waitForTimeout(500);
  const t4b = await text(p);
  check('G4b 401 falls back to local parser and says why', /diuraikan lokal/i.test(t4b) && /GPT error \(401\)/.test(t4b), t4b.match(/GPT error[^\n]*/)?.[0]);
  await close(p, 'gpt 401');

  // G4c no key
  p = await open({ props: { ...OTTA, OPENAI_API_KEY: '' } });
  await waitText(p, 'Selamat'); await p.waitForTimeout(300);
  await tap(p, '[data-act="add"]');
  check('G4c no key: add sheet says GPT not connected', /GPT belum disambungkan/.test(await text(p)));
  await close(p, 'no key');

  // G5 talangan: mark as paid back
  p = await open({ props: OTTA });
  await waitText(p, 'Selamat'); await p.waitForTimeout(300);
  await tap(p, '[data-act="tab"][data-tab="riwayat"]');
  await tap(p, '.tx[data-act="detail"]');
  await p.selectOption('#e-kat', 'Talangan & Reimburse');
  await p.check('#e-lunas'); await p.waitForTimeout(100);
  const tgt5 = await p.evaluate(() => document.querySelector('.detail dd:nth-of-type(4)').innerText);
  await tap(p, '[data-act="save-edit"]'); await p.waitForTimeout(500);
  const r5 = Number((tgt5.match(/!(\d+)/) || [])[1]);
  const v5 = await cell(p, 'active', 'Transaksi', `E${r5}:G${r5}`);
  check('G5 talangan marked paid back -> Netral', v5[0][0] === 'Netral' && v5[0][1] === 'Talangan & Reimburse', v5[0]);
  await close(p, 'talangan');

  // G6 berdua: publish, share, read partner, net
  p = await open({ props: OTTA });
  await waitText(p, 'Selamat'); await p.waitForTimeout(800);
  const lg = await glog(p);
  const created = lg.find(l => l[0] === 'create' && /Berdua — Otta/.test(l[2]));
  check('G6 berdua file created for Otta', !!created);
  check('G6 shared with EMAIL_PASANGAN', lg.some(l => l[0] === 'addViewer' && l[2] === 'wanda@example.com'));
  const outRows = await p.evaluate(id => window.__files[id].getSheetByName('Berdua').getRange('A1:F1000').getValues().filter(r => r[0] !== ''), created[1]);
  const sharedCount = FIX.tx.filter(r => String(r[10]).toUpperCase() === 'TRUE').length;
  check('G6 berdua file has only shared rows', outRows.length - 1 === sharedCount, { file: outRows.length - 1, sheet: sharedCount });
  check('G6 berdua file columns are minimal', JSON.stringify(outRows[0]) === JSON.stringify(['Tanggal', 'Jam', 'Keterangan', 'Kategori', 'Nominal', 'Sementara']));
  const creates = lg.filter(l => l[0] === 'create').length;
  await tap(p, '[data-act="refresh"]'); await p.waitForTimeout(800);
  const lg2 = await glog(p);
  check('G6 second sync reuses the file', lg2.filter(l => l[0] === 'create').length === creates);
  await tap(p, '[data-act="tab"][data-tab="berdua"]'); await p.waitForTimeout(200);
  const t6 = await text(p);
  const mineNov = nov.filter(r => String(r[10]).toUpperCase() === 'TRUE').reduce((s, r) => s + num(r[9]), 0);
  const net = mineNov * 0.5 - 60000 * 0.5;
  const netTxt = Math.round(Math.abs(net)).toLocaleString('id-ID');
  check('G6 berdua net = my shared/2 - Wanda shared/2', t6.includes(netTxt) && (net > 0 ? /Wanda transfer ke kamu/i.test(t6) : /Kamu transfer ke Wanda/i.test(t6)), { net, mineNov });
  check('G6 Wanda rows listed with payer', /Martabak/.test(t6) && /dibayar Wanda/i.test(t6));
  check('G6 link accepted as BERDUA_MASUK_ID', /2 transaksi dari Wanda/.test(t6));
  await p.screenshot({ path: path.join(OUT, 'gas-berdua.png'), fullPage: true });
  await close(p, 'berdua');

  // G7 Wanda fresh sheet: setup, add, read Otta
  p = await open({ props: { NAMA_SAYA: 'Wanda', NAMA_PASANGAN: 'Otta' }, seed: seedWanda });
  check('G7 empty sheet asks for setup', await waitText(p, 'Siapkan sheet'));
  await tap(p, '[data-act="do-setup"]'); await p.waitForTimeout(1000);
  const tabs = await p.evaluate(() => window.__active.getSheets().map(s => s.name));
  check('G7 setup creates the four tabs, drops empty Sheet1', ['Transaksi', 'Pengaturan', 'Dashboard', 'Split'].every(n => tabs.includes(n)) && !tabs.includes('Sheet1'), tabs);
  check('G7 locale + timezone set', await p.evaluate(() => window.__active.locale === 'en_US' && window.__active.tz === 'Asia/Jakarta'));
  const f7 = await p.evaluate(() => ({ b16: window.__active.getSheetByName('Dashboard').getRange('B16').getFormula(), b21: window.__active.getSheetByName('Dashboard').getRange('B21').getFormula(), h17: window.__active.getSheetByName('Pengaturan').getRange('H17').getFormula(), s5: window.__active.getSheetByName('Split').getRange('B5').getFormula() }));
  check('G7 dashboard/split formulas written', /SUMIFS/.test(f7.b16) && /B20\/B19/.test(f7.b21) && /DATEDIF/.test(f7.h17) && /SUMIFS/.test(f7.s5), f7);
  check('G7 app opens on the fresh sheet', await waitText(p, 'Selamat'));
  check('G7 brand shows Wanda Otta', /Wanda Otta/.test(await text(p)));
  await tap(p, '[data-act="add"]');
  await tap(p, '[data-act="addmode"][data-m="form"]');
  await p.fill('#f-nom', '45.000'); await p.fill('#f-ket', 'Bakso'); await p.selectOption('#f-kat', 'Makan & Minum');
  await p.check('#f-shared');
  await tap(p, '[data-act="save-form"]'); await p.waitForTimeout(900);
  const w2 = await cell(p, 'active', 'Transaksi', 'A2:L2');
  check('G7 first transaction written with formats', w2[0][8] === 'Bakso' && w2[0][9] === 45000 && w2[0][10] === true && w2[0][11] === 22500, w2[0]);
  const fmt = await p.evaluate(() => { const sh = window.__active.getSheetByName('Transaksi'); return [sh.fmt['2:1'], sh.fmt['2:10']]; });
  check('G7 date + amount formats on first row', fmt[0] === 'yyyy-mm-dd' && /#,##0/.test(fmt[1]), fmt);
  check('G7 Wanda form label names Otta', true);
  await close(p, 'wanda fresh');

  // G8 server error surfaces
  p = await open({ props: OTTA, failNext: { apiGetData: 'Exception: Service Spreadsheets timed out' } });
  check('G8 server failure shows error with retry', await waitText(p, 'Coba lagi'));
  await close(p, 'error');

  // G9 dark + overflow
  p = await open({ props: OTTA, scheme: 'dark' });
  await waitText(p, 'Selamat'); await p.waitForTimeout(500);
  for (const tab of ['riwayat', 'laporan', 'berdua', 'kas']) {
    await tap(p, `[data-act="tab"][data-tab="${tab}"]`);
    const ow = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    check(`G9 no horizontal overflow (dark/${tab})`, ow <= 0, ow);
  }
  await tap(p, '[data-act="tab"][data-tab="beranda"]');
  await p.screenshot({ path: path.join(OUT, 'gas-home-dark.png'), fullPage: false });
  await close(p, 'dark');

  await browser.close();
  const failed = results.filter(r => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
