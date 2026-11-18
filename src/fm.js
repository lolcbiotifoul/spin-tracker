// ---------- filters (modal like the old tracker) ----------
function defaultFilters() { return { date: { mode: 'all', hours: 6, spins: 100, d1: '', d2: '' }, dom: { on: false, a: 1, b: 15 }, hod: { on: false, a: 20, b: 2 }, bis: [], mults: [], tables: [], profile: 'all' }; }
const sod = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime(); };
const dayMs = (s, end) => s ? new Date(s + (end ? 'T23:59:59' : 'T00:00:00')).getTime() : (end ? Infinity : -Infinity);
function dateRange(f) {
  const d = (f || S.filters).date, now = new Date(), t0 = sod(now);
  switch (d.mode) {
    case 'today': return [t0, Infinity];
    case 'yesterday': return [t0 - 864e5, t0 - 1];
    case 'week': { const dow = (now.getDay() + 6) % 7; return [t0 - dow * 864e5, Infinity]; }
    case 'month': return [new Date(now.getFullYear(), now.getMonth(), 1).getTime(), Infinity];
    case 'year': return [new Date(now.getFullYear(), 0, 1).getTime(), Infinity];
    case 'hours': return [Date.now() - Math.max(1, +d.hours || 1) * 3600e3, Infinity];
    case 'd7': return [t0 - 6 * 864e5, Infinity];
    case 'd30': return [t0 - 29 * 864e5, Infinity];
    case 'd365': return [t0 - 364 * 864e5, Infinity];
    case 'since': return [dayMs(d.d1), Infinity];
    case 'until': return [-Infinity, dayMs(d.d1, true)];
    case 'between': return [dayMs(d.d1), dayMs(d.d2, true)];
    case 'on': return [dayMs(d.d1), dayMs(d.d1, true)];
    default: return [-Infinity, Infinity];
  }
}
function inRangeWrap(v, a, b) { return a <= b ? v >= a && v <= b : v >= a || v <= b; }
function filtered() {
  const f = S.filters; const [a, b] = dateRange(f);
  let T = S.tours.filter(t => {
    if (t.start < a || t.start > b) return false;
    if (f.bis.length && !f.bis.includes(t.bi)) return false;
    if (f.mults.length && !f.mults.includes(t.mult)) return false;
    if (f.tables.length && !f.tables.includes(t.tables)) return false;
    const d = new Date(t.start);
    if (f.dom.on && !inRangeWrap(d.getDate(), +f.dom.a, +f.dom.b)) return false;
    if (f.hod.on) { const h = d.getHours(), A = +f.hod.a % 24, B = +f.hod.b % 24; if (!(A <= B ? h >= A && h < B : h >= A || h < B) && A !== B) return false; }
    if (f.profile !== 'all') { const reg = t.opps.some(o => tagOf(o) === 'reg'); if (f.profile === 'noreg' ? reg : !reg) return false; }
    return true;
  });
  if (f.date.mode === 'spins') T = T.slice(-Math.max(1, +f.date.spins || 1));
  const hands = []; for (const t of T) for (const h of t.hands) hands.push(h);
  hands.sort((x, y) => x.ts - y.ts);
  return { T, C: T.filter(t => t.complete), H: hands };
}
function frDate(s) { if (!s) return '…'; const [y, m, d] = s.split('-'); return d + '/' + m + '/' + y.slice(2); }
function dateLabel(f) {
  const d = f.date;
  return ({ all: 'Tout', today: "Aujourd'hui", yesterday: 'Hier', week: 'Cette semaine', month: 'Ce mois-ci', year: 'Cette année', hours: d.hours + ' dernières heures', spins: d.spins + ' derniers spins', d7: '7 derniers jours', d30: '30 derniers jours', d365: '365 derniers jours',
    since: 'Depuis le ' + frDate(d.d1), until: "Jusqu'au " + frDate(d.d1), between: frDate(d.d1) + ' → ' + frDate(d.d2), on: 'Le ' + frDate(d.d1) })[d.mode] || 'Tout';
}
function activeCount(f) { return f.bis.length + f.mults.length + f.tables.length + (f.profile !== 'all' ? 1 : 0) + (f.dom.on ? 1 : 0) + (f.hod.on ? 1 : 0); }
function filterBar(extra) {
  const f = S.filters, n = activeCount(f);
  return '<div style="display:flex;gap:6px"><button class="btn" data-fopen="date">Date : ' + esc(dateLabel(f)) + '</button><button class="btn' + (n ? ' on-acc' : '') + '" data-fopen="bis"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4"/></svg>Filtres' + (n ? ' (' + n + ')' : '') + '</button></div>' + (extra || '');
}
const FM = { tab: 'date', draft: null };
function openFilters(tab) { FM.tab = tab || 'date'; FM.draft = JSON.parse(JSON.stringify(S.filters)); renderFilters(); }
function closeFilters() { FM.draft = null; $('#modalRoot').innerHTML = ''; }
function fmCard(mode, inner, icon) {
  const on = FM.draft.date.mode === mode;
  return '<div class="fm-card' + (on ? ' on' : '') + '" data-fmode="' + mode + '" role="button" tabindex="0">' + (icon ? '<span class="fm-ic">' + icon + '</span>' : '') + inner + '</div>';
}
const IC_CAL = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>';
const IC_CLK = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
function renderFilters() {
  const f = FM.draft, d = f.date, tab = FM.tab;
  const tabs = [['date', 'Date'], ['bis', 'Buy-ins'], ['mults', 'Multiplicateurs'], ['tables', 'Nombre de tables'], ['opp', 'Adversaires']];
  let body = '';
  if (tab === 'date') {
    const di = (id, v) => '<input type="date" id="' + id + '" value="' + esc(v) + '">';
    body = '<div class="fm-chip">Date : ' + esc(dateLabel(f)) + '</div>' +
      '<h4>Période</h4><div class="fm-row6">' + [['all', 'Tout'], ['today', "Aujourd'hui"], ['yesterday', 'Hier'], ['week', 'Cette semaine'], ['month', 'Ce mois-ci'], ['year', 'Cette année']].map(([k, l]) => fmCard(k, l)).join('') + '</div>' +
      '<h4>Période glissante</h4><div class="fm-roll">' +
      fmCard('hours', 'Dernières <input type="number" id="fmHours" min="1" value="' + d.hours + '" aria-label="Nombre d\'heures"> heures', IC_CLK) +
      fmCard('spins', 'Derniers <input type="number" id="fmSpins" min="1" value="' + d.spins + '" aria-label="Nombre de spins"> spins', IC_CLK) +
      fmCard('d7', '7 derniers jours') + fmCard('d30', '30 derniers jours') + fmCard('d365', '365 derniers jours') + '</div>' +
      '<h4>Personnalisé</h4><div class="fm-grid2">' +
      fmCard('since', 'Depuis une date' + (d.mode === 'since' ? di('fmD1', d.d1) : ''), IC_CAL) +
      fmCard('until', "Jusqu'à une date" + (d.mode === 'until' ? di('fmD1', d.d1) : ''), IC_CAL) +
      fmCard('between', 'Entre deux dates' + (d.mode === 'between' ? di('fmD1', d.d1) + ' et ' + di('fmD2', d.d2) : ''), IC_CAL) +
      fmCard('on', 'À une date précise' + (d.mode === 'on' ? di('fmD1', d.d1) : ''), IC_CAL) + '</div>' +
      '<h4>Jours du mois</h4><div class="fm-card fm-tog' + (f.dom.on ? ' on' : '') + '" data-ftoggle="dom" role="button" tabindex="0"><span class="fm-ic">' + IC_CAL + '</span>Du <input type="number" id="fmDomA" min="1" max="31" value="' + f.dom.a + '" aria-label="Premier jour"> au <input type="number" id="fmDomB" min="1" max="31" value="' + f.dom.b + '" aria-label="Dernier jour"> de chaque mois</div>' +
      '<h4>Heures de la journée</h4><div class="fm-card fm-tog' + (f.hod.on ? ' on' : '') + '" data-ftoggle="hod" role="button" tabindex="0"><span class="fm-ic">' + IC_CLK + '</span>De <input type="number" id="fmHodA" min="0" max="23" value="' + f.hod.a + '" aria-label="Heure de début"> h à <input type="number" id="fmHodB" min="0" max="24" value="' + f.hod.b + '" aria-label="Heure de fin"> h, tous les jours</div>' +
      '<p class="note">Les filtres de date portent sur l\'heure de début du spin, dans ton fuseau horaire. Une plage d\'heures peut passer minuit (de 20 h à 2 h).</p>';
  } else if (tab === 'opp') {
    body = '<h4>Adversaires du spin</h4><div class="fm-row6" style="grid-template-columns:repeat(3,1fr)">' + [['all', 'Tous'], ['noreg', 'Sans reg'], ['reg', 'Avec au moins un reg']].map(([k, l]) => '<div class="fm-card' + (f.profile === k ? ' on' : '') + '" data-fprof="' + k + '" role="button" tabindex="0">' + l + '</div>').join('') + '</div>';
  } else {
    const vals = tab === 'bis' ? [...new Set(S.tours.map(t => t.bi))].sort((a, b) => a - b) : tab === 'mults' ? [...new Set(S.tours.map(t => t.mult).concat(gridFor(10).map(g => g[0])))].sort((a, b) => a - b) : [1, 2, 3, 4, 5, 6];
    const lab = (v) => tab === 'bis' ? fmtE(v, v % 1 ? 2 : 0) : tab === 'mults' ? 'x' + fmtN(v) : (v === 6 ? '6 tables et +' : v + (v > 1 ? ' tables' : ' table'));
    const cnt = (v) => S.tours.filter(t => (tab === 'bis' ? t.bi : tab === 'mults' ? t.mult : t.tables) === v).length;
    body = '<h4>' + (tab === 'bis' ? 'Buy-ins' : tab === 'mults' ? 'Multiplicateurs' : 'Spins ouverts en même temps') + ' <span class="sub">(aucun sélectionné = tous)</span></h4><div class="fm-row6">' +
      vals.map(v => '<div class="fm-card' + (f[tab].includes(v) ? ' on' : '') + '" data-ftog="' + tab + '" data-val="' + v + '" role="button" tabindex="0">' + lab(v) + '<span class="sub">' + fmtN(cnt(v)) + ' spins</span></div>').join('') + '</div>';
  }
  const prev = (() => { const keep = S.filters; S.filters = f; const r = filtered(); S.filters = keep; return r; })();
  $('#modalRoot').innerHTML = '<div class="modal-bg" data-fclose="bg"><div class="fm" role="dialog" aria-modal="true" aria-label="Filtres">' +
    '<div class="fm-tabs">' + tabs.map(([k, l]) => '<button class="' + (tab === k ? 'on' : '') + '" data-ftab="' + k + '">' + l + (k !== 'date' && (k === 'opp' ? f.profile !== 'all' : f[k] && f[k].length) ? ' •' : '') + '</button>').join('') + '<button class="fm-x" data-fclose="x" aria-label="Fermer">✕</button></div>' +
    '<div class="fm-body">' + body + '</div>' +
    '<div class="fm-foot"><button class="btn" data-fact="reset" style="border:0;background:none;color:var(--muted)">Réinitialiser</button><span class="note">' + fmtN(prev.T.length) + ' spins correspondent</span><div style="flex:1"></div><button class="btn" data-fclose="x" style="border:0;background:none">Annuler</button><button class="btn primary" data-fact="apply" style="padding:8px 34px">Appliquer</button></div></div></div>';
}
function fmReadInputs() {
  const f = FM.draft; if (!f) return; const v = (id) => { const e = $('#' + id); return e ? e.value : null; };
  if (v('fmHours') != null) f.date.hours = Math.max(1, +v('fmHours') || 1);
  if (v('fmSpins') != null) f.date.spins = Math.max(1, +v('fmSpins') || 1);
  if (v('fmD1') != null) f.date.d1 = v('fmD1');
  if (v('fmD2') != null) f.date.d2 = v('fmD2');
  if (v('fmDomA') != null) { f.dom.a = Math.min(31, Math.max(1, +v('fmDomA') || 1)); f.dom.b = Math.min(31, Math.max(1, +v('fmDomB') || 31)); }
  if (v('fmHodA') != null) { f.hod.a = Math.min(23, Math.max(0, +v('fmHodA') || 0)); f.hod.b = Math.min(24, Math.max(0, +v('fmHodB') || 0)); }
}
function fmClick(e) {
  const t = e.target.closest('[data-ftab],[data-fmode],[data-ftoggle],[data-ftog],[data-fprof],[data-fact],[data-fclose]'); if (!t) return true;
  const d = t.dataset, f = FM.draft;
  if (e.target.tagName === 'INPUT') { // typing in a card selects it, but does not toggle it off
    if (d.fmode && f.date.mode !== d.fmode) { fmReadInputs(); f.date.mode = d.fmode; renderFilters(); const i = $('#' + e.target.id); if (i) i.focus(); }
    if (d.ftoggle && !f[d.ftoggle].on) { fmReadInputs(); f[d.ftoggle].on = true; renderFilters(); const i = $('#' + e.target.id); if (i) i.focus(); }
    return false;
  }
  if (d.fclose) { if (d.fclose === 'bg' && e.target !== t) return false; closeFilters(); return false; }
  fmReadInputs();
  if (d.ftab) FM.tab = d.ftab;
  else if (d.fmode) f.date.mode = d.fmode;
  else if (d.ftoggle) f[d.ftoggle].on = !f[d.ftoggle].on;
  else if (d.ftog) { const arr = f[d.ftog], v = +d.val, i = arr.indexOf(v); if (i >= 0) arr.splice(i, 1); else arr.push(v); }
  else if (d.fprof) f.profile = d.fprof;
  else if (d.fact === 'reset') FM.draft = defaultFilters();
  else if (d.fact === 'apply') { S.filters = FM.draft; closeFilters(); F = filtered(); render(); return false; }
  renderFilters(); return false;
}
