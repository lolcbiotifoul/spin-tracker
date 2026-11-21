// ---------- installable app: linked hand-history folder, offline, backups ----------
const FSA = { handle: null, name: '', last: 0, busy: false, perm: 'none' };
const KV = {
  get(k) { return new Promise(res => { try { const q = IDB.db.transaction('kv').objectStore('kv').get(k); q.onsuccess = () => res(q.result); q.onerror = () => res(undefined); } catch (e) { res(undefined); } }); },
  set(k, v) { return new Promise(res => { try { const tx = IDB.db.transaction('kv', 'readwrite'); tx.objectStore('kv').put(v, k); tx.oncomplete = () => res(true); tx.onerror = () => res(false); } catch (e) { res(false); } }); }
};
const fsaOk = () => 'showDirectoryPicker' in window;
async function walkDir(dir, prefix, out, depth) {
  // one unreadable sub-folder must not stop the whole update
  try {
    for await (const [name, h] of dir.entries()) {
      if (h.kind === 'file') { if (/\.txt$/i.test(name)) { try { const f = await h.getFile(); f._path = prefix + name; out.push(f); } catch (e) { } } }
      else if (h.kind === 'directory' && (depth || 0) < 8 && name[0] !== '.') await walkDir(h, prefix + name + '/', out, (depth || 0) + 1);
    }
  } catch (e) { FSA.skipped = (FSA.skipped || 0) + 1; }
}
async function pickDir() {
  if (!fsaOk()) { location.hash = 'imports'; toast('Ce navigateur ne sait pas relier un dossier : utilise Chrome ou Edge, ou importe tes fichiers à la main.'); return; }
  let h; try { h = await window.showDirectoryPicker({ id: 'betclic-hh', mode: 'read' }); } catch (e) { return; }
  FSA.handle = h; FSA.name = h.name; FSA.perm = 'granted'; FSA.last = 0;
  if (S.storage === 'idb') await KV.set('dir', h);
  renderSync(); if (currentView() === 'imports') render();
  await syncDir(true);
}
async function syncDir(gesture, quiet) {
  if (!FSA.handle) { if (gesture) return pickDir(); return; }
  if (FSA.busy) { if (gesture) toast('Mise à jour déjà en cours… ' + (FSA.step || '')); return; }
  let p = 'denied';
  try { p = await FSA.handle.queryPermission({ mode: 'read' }); if (p !== 'granted' && gesture) p = await FSA.handle.requestPermission({ mode: 'read' }); } catch (e) { }
  FSA.perm = p; renderSync();
  if (p !== 'granted') { if (gesture) toast('Accès au dossier refusé : clique sur « Autoriser » quand Chrome le demande.'); return; }
  FSA.busy = true; FSA.step = 'lecture du dossier'; FSA.skipped = 0; renderSync();
  window.onImpProgress = (pr, m) => { FSA.step = Math.round(pr * 100) + ' %'; const s = $('#syncState'); if (s) s.textContent = FSA.name + ' · ' + FSA.step; };
  const before = S.hands.length;
  try {
    const files = []; await walkDir(FSA.handle, FSA.handle.name + '/', files);
    if (!quiet) toast('Dossier lu : ' + files.length + ' fichier(s) .txt trouvé(s)' + (FSA.skipped ? ' · ' + FSA.skipped + ' sous-dossier(s) illisible(s)' : '') + '…', 2500);
    await importFiles(files, true, quiet);
    FSA.last = Date.now(); LS.set('st_last_sync', String(FSA.last));
    if (quiet && S.hands.length > before) toast('Dossier relu : ' + fmtN(S.hands.length - before) + ' nouvelles mains');
  } catch (e) { if (!quiet) toast('Lecture du dossier impossible : ' + (e.message || e)); }
  finally { FSA.busy = false; FSA.step = ''; window.onImpProgress = null; renderSync(); if (currentView() === 'imports') render(); }
}
function renderSync() {
  const b = $('#syncBtn'), s = $('#syncState'); if (!b) return;
  if (!fsaOk()) { b.textContent = 'Importer des mains'; s.textContent = ''; return; }
  b.disabled = FSA.busy;
  b.textContent = FSA.busy ? 'Mise à jour…' : FSA.handle ? '⟳ Mettre à jour' : 'Relier mon dossier';
  s.textContent = FSA.busy && FSA.handle ? FSA.name + ' · ' + (FSA.step || '') : FSA.handle ? FSA.name + (FSA.perm !== 'granted' ? ' · clique pour autoriser' : FSA.last ? ' · ' + ago(FSA.last) : '') : 'Aucun dossier relié';
}
function folderPanel() {
  if (!fsaOk()) return '<div class="banner">Ce navigateur ne permet pas de relier un dossier. Avec Chrome ou Edge, l\'appli relit ton dossier d\'historiques toute seule. En attendant, importe tes fichiers ci-dessous.</div>';
  if (!FSA.handle) return '<div class="panel"><h3>Dossier d\'historiques</h3><p class="note" style="font-size:13px">Range tous tes exports Betclic (fichiers ExportHH_….txt) dans un même dossier, puis relie-le une seule fois. Ensuite, « Mettre à jour » importe les nouveaux fichiers.</p><div class="row"><button class="btn primary" data-pickdir="1">Relier mon dossier d\'historiques</button></div></div>';
  return '<div class="panel"><h3>Dossier d\'historiques relié</h3><p style="margin:0 0 8px"><b>' + esc(FSA.name) + '</b>' + (FSA.last ? ' · dernière mise à jour ' + ago(FSA.last) : '') + (FSA.perm !== 'granted' ? ' · <span style="color:var(--accent)">autorisation à redonner</span>' : '') + '</p><div class="row"><button class="btn primary" data-sync="1"' + (FSA.busy ? ' disabled' : '') + '>⟳ Mettre à jour maintenant</button><button class="btn" data-pickdir="1">Changer de dossier</button></div><p class="note">Pendant que l\'appli est ouverte, le dossier est relu toutes les 3 minutes. À la réouverture, Chrome peut redemander l\'autorisation : clique alors sur « Mettre à jour ».</p></div>';
}
function exportPrefs() {
  try {
    const blob = new Blob([JSON.stringify(S.prefs, null, 1)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'spin-tracker-reglages.json'; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 3000);
  } catch (e) { toast('Export impossible'); }
}
async function importPrefs(file) {
  if (!file) return;
  try { const p = JSON.parse(await file.text()); S.prefs = migrate(Object.assign(defaultPrefs(), p)); S.prefs.cls = Object.assign(defaultPrefs().cls, p.cls || {}); savePrefs(); refresh(); toast('Réglages restaurés'); }
  catch (e) { toast('Ce fichier n\'est pas une sauvegarde de réglages'); }
}
async function pwaInit() {
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register('sw.js').catch(() => { });
  try { if (navigator.storage && navigator.storage.persist) await navigator.storage.persist(); } catch (e) { }
  FSA.last = +(LS.get('st_last_sync') || 0);
  if (S.storage === 'idb' && fsaOk()) {
    const h = await KV.get('dir');
    if (h) { FSA.handle = h; FSA.name = h.name; try { FSA.perm = await h.queryPermission({ mode: 'read' }); } catch (e) { } }
  }
  renderSync(); if (currentView() === 'imports') render();
  if (FSA.perm === 'granted') syncDir(false, true);
  setInterval(() => { if (FSA.handle && FSA.perm === 'granted' && !document.hidden) syncDir(false, true); }, 180000);
  setInterval(renderSync, 60000);
}
