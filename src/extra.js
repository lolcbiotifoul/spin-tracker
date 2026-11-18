// ---------- "?" help windows ----------
const HELP = {
  chips: { t: 'Graphique des chips', i: [
    ['#33c27a', 'Chips', 'Tes chips gagnés ou perdus, cumulés main après main (stacks ramenés à 500 chips par joueur au départ).'],
    ['#4a90ff', 'Chips (SD)', 'La part gagnée ou perdue dans les mains allées à l\'abattage (showdown).'],
    ['#ec5257', 'Chips (NSD)', 'La part gagnée ou perdue sans abattage : pots ramassés parce que l\'adversaire a foldé, blindes perdues en foldant. Si elle monte, tu voles bien.'],
    ['#f2a93b', 'EV (chips)', 'Tes chips si chaque all-in avait été payé à ton équité au moment du tapis. C\'est ta vraie performance, sans la chance des all-in.']],
    f: 'Le badge en haut à gauche compare Chips et EV : l\'écart est ta chance aux all-in, et le pourcentage indique la probabilité d\'être au moins aussi chanceux (ou malchanceux) sur ce nombre d\'all-in. Clique sur un point de la courbe pour ouvrir la main dans le replayer.' },
  br: { t: 'Graphique de bankroll', i: [
    ['#4a90ff', 'Profit', 'L\'argent réellement gagné : gains − buy-ins + rakeback.'],
    ['#e861ae', 'EV profit', 'Ce que tu aurais gagné sans aucune chance : ta part de chips en EV × le prize pool moyen (multiplicateur moyen de la grille Betclic). Le meilleur indicateur de ton niveau.'],
    ['#f2a93b', 'Multiplicateur neutralisé', 'Tes vraies victoires et défaites, mais chaque victoire payée au multiplicateur moyen. L\'écart avec Profit = ta chance sur les multiplicateurs ; l\'écart avec EV profit = ta chance sur les all-in et l\'issue des spins.']],
    f: 'Le badge compare Profit et EV profit, avec la probabilité d\'avoir au moins autant d\'écart par pure variance. Le rakeback (en bas à gauche) s\'ajoute aux trois courbes. Clique sur un point pour rejouer le spin.' },
  multi: { t: 'D\'où vient ta chance (en €)', i: [
    ['#e861ae', 'Chance totale', 'Profit − EV profit : tout ce que la variance t\'a donné ou pris.'],
    ['#f2a93b', 'Chance multiplicateurs', 'Profit − Multiplicateur neutralisé : l\'argent gagné ou perdu parce que tes victoires sont tombées sur des multiplicateurs au-dessus ou en dessous de la moyenne. Gagner un x2 coûte de l\'EV, gagner un x10 en rapporte.'],
    ['#4a90ff', 'Chance jeu', 'Multiplicateur neutralisé − EV profit : l\'argent gagné ou perdu parce que tu as gagné plus ou moins de spins que ce que tes chips en EV prévoyaient (all-in, flips, issue des heads-up).']],
    f: 'La chance totale est la somme des deux autres. Au-dessus de 0 = chanceux, en dessous = malchanceux. Le badge porte sur la chance multiplicateurs.' },
  mavg: { t: 'Multiplicateur moyen', i: [
    ['#f2a93b', 'Tous tes spins', 'Moyenne des multiplicateurs tirés sur tous tes spins, depuis le début de la période.'],
    ['#33c27a', 'Tes victoires', 'Moyenne des multiplicateurs des spins que tu as gagnés : c\'est elle qui compte pour ton argent.'],
    ['#8d9198', 'Attendu', 'Le multiplicateur moyen de la grille officielle Betclic (rake compris). Les deux courbes devraient s\'en rapprocher avec le volume.']],
    f: 'Au-dessus de la ligne grise = tu as tiré (ou gagné) de meilleurs multiplicateurs que la moyenne.' },
  mtab: { t: 'Tableau des multiplicateurs', i: [
    [null, 'Réel / Attendu', 'Part de tes spins tombés sur chaque multiplicateur, et la fréquence officielle de la grille Betclic.'],
    [null, 'Écart', 'Nombre de spins en plus (+) ou en moins (−) par rapport à ce qu\'annonce la grille pour ton volume.'],
    [null, 'Victoires', 'Spins gagnés sur ce multiplicateur, et ton taux de victoire entre parenthèses.'],
    [null, '75/15/10', 'Grands multiplicateurs où le prize pool est partagé : 75 % au 1er, 15 % au 2e, 10 % au 3e.']] },
  pos: { t: 'cEV par position', i: [
    ['#ec5257', 'vs Reg', 'Chips gagnés en EV quand ton adversaire principal du coup est un reg.'],
    ['#4a90ff', 'vs Fish', 'Pareil contre un fish.'],
    ['#f2a93b', 'Tous', 'Toutes les mains de la position.'],
    [null, 'Barres fines', 'Intervalle de confiance à 95 % : tant qu\'il est large, la valeur peut encore beaucoup bouger.']],
    f: 'SB vs BTN = tu es SB et le bouton est entré dans le coup ; SB vs BB = le bouton a foldé. BB vs 2 = bouton et SB tous deux entrés. « Par main » = moyenne par main jouée à ce poste, « Par tournoi » = cumul par spin.' },
  prof: { t: 'cEV par profil de table', i: [
    [null, 'Spin R R / R F / F F', 'cEV par spin selon tes deux adversaires : deux regs, un reg et un fish, deux fish.'],
    [null, 'HU vs R / HU vs F', 'cEV sur la phase de heads-up seulement, selon l\'adversaire restant.'],
    [null, 'Barres fines', 'Intervalle de confiance à 95 %.']] },
  mt: { t: 'Multi-tabling', i: [
    [null, 'Tables', 'Nombre moyen de spins ouverts en même temps pendant chaque spin (arrondi, 6+ au-delà).'],
    [null, '€/h', 'Profit par heure de jeu réelle à ce nombre de tables.'],
    [null, 'cEV', 'Chips EV par spin : montre si ta qualité de jeu baisse quand tu ouvres plus de tables.']] },
  fin: { t: 'Finishes', i: [[null, '1er / 2e / 3e', 'Part de tes spins terminés à chaque place. Sur un format à 3 où le gagnant prend tout, seule la 1re place compte (sauf grands multiplicateurs).']] },
  theo: { t: 'Gain réel et théorique', i: [
    [null, 'Gain réel', 'Ce que tu as vraiment gagné, rakeback compris.'],
    [null, 'Théorique', 'Ce que tu aurais dû gagner : tes chips en EV et le multiplicateur moyen de la grille, rakeback compris (= EV profit).'],
    [null, 'Écart', 'Réel − théorique : positif = tu as eu de la chance.'],
    [null, 'Par heure', 'Divisé par ton temps de jeu réel (les spins joués en même temps ne comptent qu\'une fois).']] },
  hud: { t: 'Les HUD du Leak Finder', i: [
    [null, '14+ / 8-14 / 0-8', 'Stack effectif en big blinds au début de la main (le plus petit entre toi et le plus gros adversaire).'],
    [null, 'BvS, SvB, BU…', 'La situation : BvS = tu es BB face à la SB (bouton foldé), SvB = SB face à la BB, BU = bouton premier à parler, BvBU = BB face à l\'open du bouton (SB foldée), SvBU = SB face à l\'open du bouton.'],
    [null, 'VPiP, LiMP, L/F', 'Joue la main · limp · limp puis fold face à une relance.'],
    [null, 'O, OS, O/FvAi', 'Open raise (hors tapis) · open shove · open puis fold face à un tapis.'],
    [null, 'ISO, ISOAI', 'Face au limp : relance · tapis.'],
    [null, 'FvO, 3B, FvOS', 'Face à une open raise : fold · relance (3-bet, tapis compris). Face à un open shove : fold.'],
    [null, 'AF', 'Fréquence d\'agression flop / turn / river : (mises + relances) / (mises + relances + calls + folds).'],
    [null, 'POST-F', 'Colonnes : F bleu = flop en pot limpé, F orange = flop en pot relancé, T = turn, R = river. CB = c-bet, FvR = fold face à une relance, X/F = check-fold, FvPROBE = fold face à une probe, FvCB / RvCB = fold / relance face au c-bet, BvX = mise quand l\'agresseur checke, Dk = donk bet, PROBE = mise après une street checkée.'],
    [null, 'Couleurs', 'Vert = dans ta zone (référence ± écart toléré), rouge = trop haut, bleu = trop bas (plus vif quand l\'écart dépasse deux fois la tolérance), blanc = pas de référence, gris = trop peu d\'occasions. Un chiffre souligné utilise ta référence perso.']],
    f: 'Clique une case pour voir le détail, fixer ta propre référence (et sa tolérance) ou rejouer les mains concernées. Sans référence perso, la case est comparée aux regs (ou fish) de ta base dès qu\'ils ont 30 occasions. Survole un en-tête pour sa définition.' }
};
function qm(topic) { return '<button class="qm" data-help="' + topic + '" aria-label="Explications">?</button>'; }
function openHelp(k) {
  const H = HELP[k]; if (!H) return;
  $('#modalRoot').innerHTML = '<div class="modal-bg" data-act="closeModal"><div class="modal help-modal" role="dialog" aria-modal="true" aria-label="' + esc(H.t) + '"><div class="row"><h3 style="margin:0;font:700 22px var(--display)">' + esc(H.t) + '</h3><div class="grow" style="flex:1"></div><button class="btn small" data-act="closeModal">Fermer</button></div>' +
    '<dl class="help-list">' + H.i.map(([c, n, d]) => '<dt>' + (c ? '<i style="background:' + c + '"></i>' : '') + esc(n) + '</dt><dd>' + esc(d) + '</dd>').join('') + '</dl>' + (H.f ? '<p class="note" style="margin:0;font-size:13px">' + esc(H.f) + '</p>' : '') + '</div></div>';
}
document.addEventListener('click', (e) => { const t = e.target.closest('[data-help]'); if (t) { e.stopPropagation(); openHelp(t.dataset.help); } }, true);

// ---------- styled dropdowns: native <select> kept for logic, custom menu for looks ----------
let DD = null;
function ddClose() { if (DD) { DD.menu.remove(); DD.btn.setAttribute('aria-expanded', 'false'); DD = null; } }
function ddLabel(sel) { const o = sel.options[sel.selectedIndex]; return o ? o.textContent : ''; }
function enhanceSelect(sel) {
  if (sel.dataset.dd) return; sel.dataset.dd = '1';
  const b = document.createElement('button'); b.type = 'button'; b.className = 'dd' + (sel.dataset.ov !== undefined ? ' dd-tag ' + (sel.dataset.tag || '') : '');
  b.setAttribute('aria-haspopup', 'listbox'); b.setAttribute('aria-expanded', 'false');
  if (sel.getAttribute('aria-label')) b.setAttribute('aria-label', sel.getAttribute('aria-label'));
  if (sel.id) { b.id = sel.id + '_dd'; const lab = document.querySelector('label[for="' + sel.id + '"]'); if (lab) lab.htmlFor = b.id; }
  const lab = () => sel.dataset.ov !== undefined ? (sel.dataset.tagl || ddLabel(sel)) + (sel.value ? ' <span class="man">manuel</span>' : '') : esc(ddLabel(sel));
  b.innerHTML = '<span>' + lab() + '</span><svg viewBox="0 0 10 6" width="9" height="6" aria-hidden="true"><path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
  sel.style.display = 'none'; sel.after(b);
  b.onclick = (e) => {
    e.stopPropagation(); const open = DD && DD.btn === b; ddClose(); if (open) return;
    const m = document.createElement('div'); m.className = 'dd-menu'; m.setAttribute('role', 'listbox');
    const many = sel.options.length > 12;
    m.innerHTML = (many ? '<input type="text" class="dd-q" placeholder="Filtrer…" aria-label="Filtrer">' : '') + '<div class="dd-list">' + [...sel.options].map((o, i) => '<button type="button" role="option" data-i="' + i + '" class="' + (i === sel.selectedIndex ? 'on' : '') + '">' + esc(o.textContent) + '</button>').join('') + '</div>';
    document.body.appendChild(m);
    const r = b.getBoundingClientRect(); m.style.minWidth = Math.max(r.width, 140) + 'px';
    const mh = m.offsetHeight, below = window.innerHeight - r.bottom;
    m.style.left = Math.min(r.left, window.innerWidth - m.offsetWidth - 8) + 'px';
    m.style.top = (below < mh + 8 && r.top > mh ? r.top - mh - 4 : r.bottom + 4) + 'px';
    DD = { menu: m, btn: b }; b.setAttribute('aria-expanded', 'true');
    const cur = m.querySelector('.on'); if (cur) cur.scrollIntoView({ block: 'nearest' });
    const q = m.querySelector('.dd-q'); if (q) { q.focus(); q.oninput = () => { const v = q.value.toLowerCase(); m.querySelectorAll('.dd-list button').forEach(x => x.style.display = x.textContent.toLowerCase().includes(v) ? '' : 'none'); }; } else if (cur) cur.focus();
    m.onclick = (ev) => { const o = ev.target.closest('[data-i]'); if (!o) return; ev.stopPropagation(); ddClose(); if (+o.dataset.i !== sel.selectedIndex) { sel.selectedIndex = +o.dataset.i; b.firstChild.innerHTML = lab(); sel.dispatchEvent(new Event('change', { bubbles: true })); } b.focus(); };
    m.onkeydown = (ev) => {
      const items = [...m.querySelectorAll('.dd-list button')].filter(x => x.style.display !== 'none'); const i = items.indexOf(document.activeElement);
      if (ev.key === 'ArrowDown') { ev.preventDefault(); (items[i + 1] || items[0]).focus(); }
      else if (ev.key === 'ArrowUp') { ev.preventDefault(); (items[i - 1] || items[items.length - 1]).focus(); }
      else if (ev.key === 'Escape') { ev.stopPropagation(); ddClose(); b.focus(); }
      else if (ev.key === 'Enter' && document.activeElement.classList.contains('dd-q') && items[0]) { ev.preventDefault(); items[0].click(); }
    };
  };
}
function enhanceAll(root) { (root || document).querySelectorAll('select:not([data-dd]):not(.native)').forEach(enhanceSelect); }
new MutationObserver(() => enhanceAll()).observe(document.documentElement, { childList: true, subtree: true });
document.addEventListener('click', (e) => { if (DD && !DD.menu.contains(e.target)) ddClose(); });
window.addEventListener('resize', ddClose);
document.addEventListener('scroll', (e) => { if (DD && !DD.menu.contains(e.target)) ddClose(); }, true);

// ---------- Multiplicateurs tab ----------
function viewMulti() {
  const C = F.C;
  const mu = new Map(); for (const t of C) { const r = mu.get(t.mult) || { n: 0, w: 0, eur: 0 }; r.n++; if (t.place === 1) r.w++; r.eur += t.eur; mu.set(t.mult, r); }
  const grid = gridFor(C.length ? C[0].bi : 10); for (const g of grid) if (!mu.has(g[0])) mu.set(g[0], { n: 0, w: 0, eur: 0 });
  const ml = [...mu.keys()].sort((a, b) => a - b); const gp = (m) => { const g = grid.find(x => x[0] === m); return g ? g[1] / 1e6 : null; };
  const avgM = C.length ? C.reduce((x, t) => x + t.mult, 0) / C.length : NaN, expM = C.length ? C.reduce((x, t) => x + expMult(t.bi), 0) / C.length : NaN;
  const W = C.filter(t => t.place === 1), avgW = W.length ? W.reduce((x, t) => x + t.mult, 0) / W.length : NaN;
  const mLuck = C.reduce((x, t) => x + t.profit - t.nmProfit, 0), gLuck = C.reduce((x, t) => x + t.nmProfit - t.evProfit, 0);
  let h = '<div class="grid6 g4">' + [
    ['Multiplicateur moyen', '<div class="v">x' + fmtN(avgM, 2) + '</div><div class="theo">attendu x' + fmtN(expM, 2) + '</div>'],
    ['Sur tes victoires', '<div class="v ' + cls(avgW - expM) + '">x' + fmtN(avgW, 2) + '</div><div class="theo">' + fmtN(W.length) + ' spins gagnés</div>'],
    ['Chance multiplicateurs', '<div class="v ' + cls(mLuck) + '">' + fmtS(mLuck, 2) + ' €</div><div class="theo">victoires payées au-dessus ou en dessous de la moyenne</div>'],
    ['Chance jeu', '<div class="v ' + cls(gLuck) + '">' + fmtS(gLuck, 2) + ' €</div><div class="theo">spins gagnés vs ce que prévoyait ton EV</div>']
  ].map(([l, v]) => '<div class="tile"><div class="l">' + l + '</div>' + v + '</div>').join('') + '</div>';
  h += '<div class="panel"><h3>D\'où vient ta chance <span class="help">en €, cumulé spin après spin</span><span class="r">' + qm('multi') + '</span></h3><div class="chart-wrap short" id="chart"></div><div class="legend" id="legend"></div></div>';
  h += '<div class="grid2b"><div class="panel"><h3>Multiplicateur moyen <span class="help">moyenne cumulée</span><span class="r">' + qm('mavg') + '</span></h3><div class="chart-wrap mini" id="chart2"></div><div class="legend" id="legend2"></div></div>' +
    '<div class="panel"><h3>Multiplicateurs <span class="help">réels vs grille officielle Betclic</span><span class="r">' + qm('mtab') + '</span></h3><div class="scroll"><table><thead><tr><th>Multiplicateur</th><th class="n">Spins</th><th class="n">Réel</th><th class="n">Attendu</th><th class="n">Écart</th><th class="n">Victoires</th><th class="n">Gains</th></tr></thead><tbody>' + ml.map(m => { const r = mu.get(m), e = gp(m), en = e != null ? e * C.length : null; return '<tr><td><span class="pill">x' + fmtN(m) + '</span>' + (grid.find(x => x[0] === m && x[2]) ? ' <span class="sub">75/15/10</span>' : '') + '</td><td class="n">' + fmtN(r.n) + '</td><td class="n">' + fmtP(C.length ? r.n / C.length * 100 : NaN, m >= 20 ? 2 : 1) + '</td><td class="n mut">' + (e != null ? fmtP(e * 100, m >= 20 ? 3 : 1) : '—') + '</td><td class="n ' + (en != null ? cls(r.n - en) : '') + '">' + (en != null ? fmtS(r.n - en, en < 10 ? 1 : 0) : '—') + '</td><td class="n">' + fmtN(r.w) + (r.n ? ' <span class="sub">(' + fmtP(r.w / r.n * 100, 0) + ')</span>' : '') + '</td><td class="n">' + fmtE(r.eur, 0) + '</td></tr>'; }).join('') + '</tbody></table></div></div></div>';
  return h;
}
function afterMulti() {
  const C = F.C; const tot = [], ml = [], gl = [], am = [], aw = [], ex = [];
  let a = 0, b = 0, sm = 0, sw = 0, nw = 0, se = 0, vr = 0;
  for (let i = 0; i < C.length; i++) {
    const t = C[i]; b += t.profit - t.nmProfit; a += t.nmProfit - t.evProfit;
    tot.push(a + b); ml.push(b); gl.push(a);
    sm += t.mult; se += expMult(t.bi); if (t.place === 1) { sw += t.mult; nw++; }
    am.push(sm / (i + 1)); ex.push(se / (i + 1)); aw.push(nw ? sw / nw : null);
    // variance of what this finish pays, over the Betclic grid
    const g = gridFor(t.bi), k = t.place ? t.place - 1 : -1;
    if (k >= 0) { let m1 = 0, m2 = 0; for (const q of g) { const w = (q[2] ? [0.75, 0.15, 0.1] : [1, 0, 0])[k] * q[0] * t.bi; m1 += q[1] / 1e6 * w; m2 += q[1] / 1e6 * w * w; } vr += m2 - m1 * m1; }
  }
  const LB = luckBadge(b, vr, '€');
  LB.html = LB.html.replace('<b>', '<b>Multiplicateurs : ').replace('vs EV', 'vs multiplicateur moyen');
  const ser = S.ui.series.mu;
  const series = [{ k: 't', name: 'Chance totale', color: '#e861ae', data: tot }, { k: 'm', name: 'Chance multiplicateurs', color: '#f2a93b', data: ml }, { k: 'g', name: 'Chance jeu', color: '#4a90ff', data: gl }].map(s => Object.assign(s, { on: !!ser[s.k] }));
  const tip = (i) => 'Tournoi ' + fmtN(i + 1) + ' · ' + fmtDate(C[i].start, true) + ' · x' + C[i].mult + (C[i].place ? ' · ' + C[i].place + (C[i].place === 1 ? 'er' : 'e') : '');
  lineChart($('#chart'), { series, xLabel: 'Tournois joués', yFmt: (v) => fmtN(v, Math.abs(v) < 10 && v % 1 ? 1 : 0) + ' €', tipHead: tip, onPick: (i) => openSpin(C[i].gid), badge: LB.html, badgeCls: LB.cls });
  legend(series, 'mu');
  const s2 = [{ name: 'Tous tes spins', color: '#f2a93b', data: am, on: 1 }, { name: 'Tes victoires', color: '#33c27a', data: aw, on: 1 }, { name: 'Attendu', color: '#8d9198', data: ex, on: 1, dash: 1 }];
  lineChart($('#chart2'), { series: s2, xLabel: 'Tournois joués', noZero: 1, yFmt: (v) => v == null ? '—' : 'x' + fmtN(v, 2), tipHead: tip, onPick: (i) => openSpin(C[i].gid) });
  $('#legend2').innerHTML = s2.map(s => '<span class="chip"><i class="dot" style="background:' + s.color + '"></i>' + esc(s.name) + '</span>').join('');
}
