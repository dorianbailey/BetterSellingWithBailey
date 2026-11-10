// Scanner accuracy test harness v2 (detail edition). Runs inside a bettersellingwithbailey.com page.
// Simulates the phone: the item sits in a 3:4 camera view at 720p or 1080p, then the scanner sends
// the whole view (and optionally a sharp close-up of the ring area) to the relay.
(async () => {
const EV = window.EV = window.EV || {};
EV.API = 'https://qnsomzxhnagzjwjhetzu.supabase.co/functions/v1/price-scanner';
const base = EV.BASE;
EV.cases = await fetch(base + 'cases.json?' + Date.now()).then((r) => r.json());
await new Promise((ok, bad) => { const s = document.createElement('script'); s.src = base + 'prompts.js?' + Date.now(); s.onload = ok; s.onerror = bad; document.head.appendChild(s); });
EV.prompts = window.PROMPTS;
for (const f of ['harley-davidson-jackets.jpg', 'estate-sale-christmas-garage.jpg', 'outdoor-sports-sale-gear-closeup.jpg', 'collectibles-garage-sale.jpg', 'star-wars-sale-tv-crew.jpg'])
  EV.cases.push({ file: f, brand: [], detail: null, real: true, url: location.origin + '/assets/photos/' + f });
const need = EV.cases.filter((c) => !c.url);
for (let i = 0; i < need.length; i += 40) {
  const titles = need.slice(i, i + 40).map((c) => 'File:' + c.file).join('|');
  const j = await fetch('https://commons.wikimedia.org/w/api.php?action=query&titles=' + encodeURIComponent(titles) + '&prop=imageinfo&iiprop=url&iiurlwidth=1600&format=json&origin=*').then((r) => r.json());
  const norm = {}; for (const n of (j.query.normalized || [])) norm[n.to] = n.from;
  const urls = {}; for (const p of Object.values(j.query.pages)) { const t = (norm[p.title] || p.title).replace('File:', ''); if (p.imageinfo) urls[t] = p.imageinfo[0].thumburl || p.imageinfo[0].url; }
  for (const c of need.slice(i, i + 40)) c.url = urls[c.file];
}
EV.img = {};
await Promise.all(EV.cases.map(async (c) => { if (!c.url) return; const im = new Image(); im.crossOrigin = 'anonymous'; im.src = c.url; try { await im.decode(); EV.img[c.file] = im; } catch (e) {} }));
EV.cases = EV.cases.filter((c) => EV.img[c.file]);

// ---- the phone's camera view: item in the middle of a 3:4 frame, background around it ----
const VIEW = { 720: [589, 785], 1080: [883, 1178] };
EV.view = (im, res) => {
  const [W, H] = VIEW[res], c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d');
  const cs = Math.max(W / im.naturalWidth, H / im.naturalHeight);           // blurred surroundings
  x.filter = 'blur(18px) brightness(.85)'; x.drawImage(im, (W - im.naturalWidth * cs) / 2, (H - im.naturalHeight * cs) / 2, im.naturalWidth * cs, im.naturalHeight * cs); x.filter = 'none';
  const fs = Math.min(W * .86 / im.naturalWidth, H * .8 / im.naturalHeight); // the item, filling most of the ring
  x.drawImage(im, (W - im.naturalWidth * fs) / 2, (H - im.naturalHeight * fs) / 2, im.naturalWidth * fs, im.naturalHeight * fs);
  return c;
};
const jpg = (c, q = .72) => c.toDataURL('image/jpeg', q).split(',')[1];
EV.inputs = (im, mode) => {
  // mode: '720' (today), '1080' (whole only), '1080+d' (whole + close-up), '1080big' (whole at full size)
  const res = mode.startsWith('1080') ? 1080 : 720, v = EV.view(im, res);
  const whole = (max) => { const s = Math.min(1, max / Math.max(v.width, v.height)); const c = document.createElement('canvas'); c.width = Math.round(v.width * s); c.height = Math.round(v.height * s); c.getContext('2d').drawImage(v, 0, 0, c.width, c.height); return jpg(c); };
  if (mode === '1080big') return [whole(4000)];
  const out = [whole(800)];
  if (mode === '1080+d') {   // sharp close-up of the ring area at full camera resolution
    const side = Math.round(v.width * .72), c = document.createElement('canvas'); c.width = c.height = side;
    c.getContext('2d').drawImage(v, (v.width - side) / 2, (v.height - side) / 2, side, side, 0, 0, side, side);
    out.push(jpg(c));
  }
  return out;
};
EV.one = async (c, cfg) => {
  const imgs = EV.inputs(EV.img[c.file], cfg.mode || '720');
  const content = imgs.map((b) => ({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: b } }));
  content.push({ type: 'text', text: imgs.length > 1 ? 'Photo 1 is the whole view. Photo 2 is a sharper close-up of the middle of the same view: use it to read small text, logos and numbers. Price the item in the center. JSON only.' : 'Price the item in the center. JSON only.' });
  const t0 = performance.now(); let first = 0, text = '';
  const res = await fetch(EV.API, { method: 'POST', headers: { 'content-type': 'application/json', 'x-scanner-pass': EV.PASS, 'x-scanner-user': 'ZzEval', 'x-scanner-kind': 'eval' },
    body: JSON.stringify({ model: cfg.model || 'claude-haiku-5-5', max_tokens: 300, stream: true, system: EV.prompts[cfg.prompt || 'v5'], messages: [{ role: 'user', content }] }) });
  if (!res.ok) return { file: c.file, err: res.status + ' ' + (await res.text()).slice(0, 120) };
  const rd = res.body.getReader(), dec = new TextDecoder(); let buf = '';
  for (;;) { const { done, value } = await rd.read(); if (done) break; buf += dec.decode(value, { stream: true }); let i;
    while ((i = buf.indexOf('\n')) >= 0) { const l = buf.slice(0, i).trim(); buf = buf.slice(i + 1); if (!l.startsWith('data:')) continue;
      try { const ev = JSON.parse(l.slice(5)); if (ev.type === 'content_block_delta' && ev.delta.text) { text += ev.delta.text; if (!first && /"price"\s*:\s*\d+\s*[,}]/.test(text)) first = performance.now() - t0; } } catch (e) {} } }
  let j = null; try { j = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1)); } catch (e) {}
  const name = (j && j.name) || '', hay = (name + ' | ' + ((j && j.seen) || '')).toLowerCase(), nm = name.toLowerCase();
  const brandOk = c.real ? null : c.brand.some((k) => hay.includes(k));
  const detailOk = c.detail ? c.detail.some((k) => hay.includes(k)) && !(c.neg || []).some((k) => nm.includes(k)) : null;
  return { file: c.file, set: c.set, generic: c.generic, real: c.real, name, seen: j && j.seen, look: j && j.look, match: j && j.match, conf: j && j.conf, price: j && j.price, upside: j && j.upside, note: j && j.note,
    brandOk, detailOk, messy: /\?|\bor\b|\//i.test(name), priced: !!(j && j.price != null && j.name), ms: Math.round(performance.now() - t0), priceMs: Math.round(first), kb: Math.round(imgs.reduce((a, b) => a + b.length, 0) * .75 / 1024), raw: j ? '' : text.slice(0, 160) };
};
EV.results = EV.results || {};
EV.status = EV.status || {};
EV.summary = (label) => {
  const out = EV.results[label]; if (!out) return null;
  const ok = out.filter((r) => r && !r.err), sc = (f) => ok.filter(f).length;
  const med = (a) => { a = a.filter((x) => x > 0).sort((x, y) => x - y); return a.length ? a[a.length >> 1] : null; };
  const branded = ok.filter((r) => !r.generic && !r.real), det = ok.filter((r) => r.detailOk !== null);
  const detNew = det.filter((r) => r.set === 'new'), detOld = det.filter((r) => r.set !== 'new');
  return { label, brand: sc((r) => !r.generic && !r.real && r.brandOk) + '/' + branded.length, generic: sc((r) => r.generic && r.brandOk) + '/' + ok.filter((r) => r.generic).length,
    detail: det.filter((r) => r.detailOk).length + '/' + det.length, detailNew: detNew.filter((r) => r.detailOk).length + '/' + detNew.length, detailOld: detOld.filter((r) => r.detailOk).length + '/' + detOld.length,
    priced: sc((r) => r.priced) + '/' + out.length, messy: sc((r) => r.messy), notJson: sc((r) => r.raw), errors: out.filter((r) => !r || r.err).length,
    withLook: sc((r) => r.look), medPriceMs: med(ok.map((r) => r.priceMs)), medTotalMs: med(ok.map((r) => r.ms)), medKB: med(ok.map((r) => r.kb)) };
};
EV.run = (label, cfg, conc = 4) => {
  const items = EV.cases.slice(), out = new Array(items.length); let k = 0, done = 0;
  EV.status[label] = 'running 0/' + items.length;
  EV.results[label] = out;
  return Promise.all(Array.from({ length: conc }, async () => {
    while (k < items.length) { const i = k++; for (let a = 0; a < 3; a++) { try { out[i] = await EV.one(items[i], cfg); } catch (e) { out[i] = { file: items[i].file, err: String(e) }; }
      if (!(out[i].err && /429|529|overloaded|Failed to fetch/i.test(out[i].err))) break; await new Promise((r) => setTimeout(r, 2500 * (a + 1))); }
      EV.status[label] = 'running ' + (++done) + '/' + items.length; }
  })).then(() => { EV.status[label] = 'done'; return EV.summary(label); });
};
EV.ready = { cases: EV.cases.length, images: Object.keys(EV.img).length, prompts: Object.keys(EV.prompts) };
})();
