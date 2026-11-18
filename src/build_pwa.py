import json, os, shutil
from PIL import Image, ImageDraw
exec(open('build.py').read())  # builds site/index.html (Claude version)
s = open('site/index.html').read()
def rep(a, b, n=1):
    global s
    assert s.count(a) == n, (s.count(a), a[:90]); s = s.replace(a, b)
rep('<title>Spin Tracker Betclic</title>', '<title>Spin Tracker</title>\n<link rel="manifest" href="manifest.webmanifest">\n<meta name="theme-color" content="#0a0a0a">\n<link rel="icon" type="image/png" href="icons/icon-192.png">\n<link rel="apple-touch-icon" href="icons/icon-192.png">')
rep("indexedDB.open('spintracker', 1); r.onupgradeneeded = () => r.result.createObjectStore('hands', { keyPath: 'i' });",
    "indexedDB.open('spintracker', 2); r.onupgradeneeded = () => { const d = r.result; if (!d.objectStoreNames.contains('hands')) d.createObjectStore('hands', { keyPath: 'i' }); if (!d.objectStoreNames.contains('kv')) d.createObjectStore('kv'); };")
rep('<span>Spin <b>Tracker</b></span></div>', '<span>Spin <b>Tracker</b></span></div>\n    <button class="btn primary sync-btn" id="syncBtn" data-sync="1">⟳ Mettre à jour</button><div class="sync-state" id="syncState"></div>')
rep(".store-state { font-size: 12px;", ".sync-btn { margin: 0 4px 2px; justify-content: center; }\n.sync-btn:disabled { opacity: .6; cursor: progress; }\n.sync-state { font-size: 11px; color: var(--muted); padding: 2px 10px 10px; text-align: center; }\n@media (max-width: 760px) { .sync-state { display: none; } .sync-btn { margin: 0; white-space: nowrap; } }\n.store-state { font-size: 12px;")
rep("const fileKey = (f) => (f.webkitRelativePath || f.name)", "const fileKey = (f) => (f._path || f.webkitRelativePath || f.name)")
rep("async function importFiles(files, folder) {", "async function importFiles(files, folder, quiet) {")
rep("  if (!files.length) { toast('Rien de nouveau : les ' + total + ' fichiers sont déjà importés'); return; }", "  if (!files.length) { if (!quiet) toast('Rien de nouveau : les ' + total + ' fichiers sont déjà importés'); return; }")
rep("    S.imports.push({ name: f.webkitRelativePath || f.name,", "    S.imports.push({ name: f._path || f.webkitRelativePath || f.name,")
rep("  toast('Import terminé : ' + fmtN(newHands)", "  if (!quiet || newHands) toast('Import terminé : ' + fmtN(newHands)")
# no bundled personal data in the public app
i = s.index("  else if (LS.get('st_seed_off') !== '1') {"); j = s.index("  recompute();\n  if (!S.hands.length && !location.hash)")
s = s[:i] + s[j:]
rep("  connectCloud();\n})();", "  pwaInit();\n})();")
rep("/*REPLAYER*/" if "/*REPLAYER*/" in s else "// ---------- boot ----------", open('pwa.js').read() + "\n// ---------- boot ----------")
rep("  let h = '<div class=\"drop\" id=\"drop\">", "  let h = folderPanel() + '<div class=\"drop\" id=\"drop\">")
rep("  const fo = e.target.closest('[data-fopen]');", "  const sy = e.target.closest('[data-sync],[data-pickdir],[data-exportprefs]'); if (sy) { if (sy.dataset.pickdir) pickDir(); else if (sy.dataset.exportprefs) exportPrefs(); else syncDir(true); return; }\n  const fo = e.target.closest('[data-fopen]');")
rep("document.addEventListener('change', (e) => {\n", "document.addEventListener('change', (e) => {\n  if (e.target.id === 'prefsIn') { importPrefs(e.target.files[0]); e.target.value = ''; return; }\n")
rep("    '<div class=\"panel\"><h3>Où sont gardées tes données</h3>", "    '<div class=\"panel\"><h3>Sauvegarde des réglages</h3><p class=\"note\" style=\"font-size:13px\">Tes corrections Reg/Fish, favoris et réglages restent dans ce navigateur. Exporte-les de temps en temps, ou pour les passer sur un autre ordinateur.</p><div class=\"row\"><button class=\"btn\" data-exportprefs=\"1\">Exporter mes réglages</button><label class=\"btn\" for=\"prefsIn\" style=\"cursor:pointer\">Restaurer une sauvegarde</label><input type=\"file\" id=\"prefsIn\" accept=\".json,application/json\" style=\"display:none\"></div></div>' +\n    '<div class=\"panel\"><h3>Où sont gardées tes données</h3>")
rep("Les mains sont stockées dans ce navigateur.", "Les mains sont stockées dans ce navigateur, sur ton ordinateur : rien n\\'est envoyé sur internet. Si tu vides la base, un clic sur « Mettre à jour » relit tout ton dossier.")

out = 'pwa_site'; shutil.rmtree(out, ignore_errors=True); os.makedirs(out + '/icons')
open(out + '/index.html', 'w').write(s)
open(out + '/manifest.webmanifest', 'w').write(json.dumps({
  "name": "Spin Tracker", "short_name": "Spin Tracker", "description": "Tracker de Spin & Rush Betclic : cEV, positions, regs/fish, replayer.",
  "start_url": "./#tableau", "scope": "./", "display": "standalone", "orientation": "any",
  "background_color": "#0a0a0a", "theme_color": "#0a0a0a", "lang": "fr",
  "icons": [{"src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any"},
            {"src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any"},
            {"src": "icons/maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"}]}, ensure_ascii=False, indent=1))
open(out + '/sw.js', 'w').write("""// Spin Tracker service worker: app shell offline, network first so updates show up at once
const CACHE = 'spin-tracker-v2';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    e.respondWith(fetch(req).then((r) => { const cp = r.clone(); caches.open(CACHE).then((c) => c.put(req, cp)); return r; })
      .catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match('./index.html'))));
  } else if (/fonts\\.(googleapis|gstatic)\\.com$/.test(url.hostname)) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((r) => { const cp = r.clone(); caches.open(CACHE).then((c) => c.put(req, cp)); return r; })));
  }
});
""")
def icon(size, pad, path, radius=True):
    S_ = size * 4
    im = Image.new('RGBA', (S_, S_), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    if radius: d.rounded_rectangle([0, 0, S_ - 1, S_ - 1], radius=int(S_ * 0.22), fill=(16, 17, 20, 255))
    else: d.rectangle([0, 0, S_, S_], fill=(16, 17, 20, 255))
    pts = [(13, 2), (4, 14), (11, 14), (10, 22), (19, 10), (12, 10)]
    inner = S_ * (1 - 2 * pad); off = S_ * pad
    d.polygon([(off + (x - 3.5) / 17 * inner, off + (y - 2) / 20 * inner) for x, y in pts], fill=(242, 169, 59, 255))
    im.resize((size, size), Image.LANCZOS).save(path)
icon(192, 0.16, out + '/icons/icon-192.png'); icon(512, 0.16, out + '/icons/icon-512.png'); icon(512, 0.26, out + '/icons/maskable-512.png', radius=False)
print('pwa built', len(s))
