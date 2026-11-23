// ---------- "?" help windows ----------
const HELP = {
  chips: { t: 'Graphique des chips', i: [
    ['#22c55e', 'Chips', 'Tes chips gagnés ou perdus, cumulés main après main (stacks ramenés à 500 chips par joueur au départ).'],
    ['#3b82f6', 'Chips (SD)', 'La part gagnée ou perdue dans les mains allées à l\'abattage (showdown).'],
    ['#ef4444', 'Chips (NSD)', 'La part gagnée ou perdue sans abattage : pots ramassés parce que l\'adversaire a foldé, blindes perdues en foldant. Si elle monte, tu voles bien.'],
    ['#fb923c', 'cEV', 'Tes chips si chaque all-in avait été payé à ton équité au moment du tapis. C\'est ta vraie performance, sans la chance des all-in.'],
    ['#f472b6', 'cEV ajusté', '<p>Le <b>cEV</b>, sans en plus la chance des <b>setups préflop</b> : les all-in préflop où tout le monde a une grosse main (AA contre KK, QQ contre AK…). Personne ne peut s\'en sortir : c\'est la distribution des cartes qui décide.</p><p>Dans ces coups-là, chaque pot est <b>partagé à parts égales</b> entre les joueurs encore dedans, comme si tu avais eu la meilleure main une fois sur deux. Sur le long terme, ça ne change pas ton résultat moyen, mais ça retire du bruit.</p><p>Grosses mains retenues selon le tapis effectif : <b>20 bb et plus</b> : TT+, AK · <b>12 à 20 bb</b> : 88+, AQ+, AJs · <b>moins de 12 bb</b> : 66+, AJ+, ATs, KQs.</p>']],
    f: 'Le badge en haut à gauche compare Chips et EV : l\'écart est ta chance aux all-in, et le pourcentage indique la probabilité d\'être au moins aussi chanceux (ou malchanceux) sur ce nombre d\'all-in. Clique sur un point de la courbe pour ouvrir la main dans le replayer.' },
  br: { t: 'Graphique de bankroll', i: [
    ['#3b82f6', 'Profit', '<p>L\'<b>argent réellement gagné</b> : gains − buy-ins + rakeback.</p>'],
    ['#f472b6', 'EV Profit effectif', '<p>L\'<b>argent que tu aurais dû gagner</b>, avec ton niveau de jeu (cEV), ton rakeback et des <b>multiplicateurs réalistes pour ton volume</b>.</p><p>Contrairement à <i class="hd" style="background:#a855f7"></i><b>EV Profit</b>, il ignore les très gros multiplicateurs que ton volume avait très peu de chances de toucher (moins d\'une fois attendue) et garde seulement ceux que tu pouvais raisonnablement rencontrer.</p><p>Le <b>pourcentage entre parenthèses</b> est ton <b>rake effectif</b> : la grille Betclic donne ~7 %, mais comme les très gros multiplicateurs sont très rares, le rake que tu paies réellement sur ce volume est plus élevé.</p>'],
    ['#fb923c', 'EV Multi Profit', '<p>L\'<b>argent que tu aurais dû gagner</b> avec ton niveau de jeu, les <b>multiplicateurs réellement tirés</b> à tes tables et ton rakeback.</p><p>Il enlève la chance aux all-in mais garde celle des multiplicateurs : l\'écart avec <i class="hd" style="background:#3b82f6"></i><b>Profit</b> vient des all-in et de l\'issue des spins.</p>'],
    ['#a855f7', 'EV Profit', '<p>Ton <b>gain théorique à long terme</b>, calculé avec ton niveau de jeu (cEV), la grille complète des multiplicateurs Betclic et ton rakeback.</p><p><i class="hd" style="background:#a855f7"></i><b>EV Profit</b>, contrairement à <i class="hd" style="background:#f472b6"></i><b>EV Profit effectif</b>, ne tient pas compte du fait qu\'à moins de jouer un volume énorme, <b>ta probabilité de tomber sur les très gros multiplicateurs est faible</b>.</p>'],
    ['#2dd4bf', 'Multiplicateur neutralisé', '<p>Tes <b>vraies victoires et défaites</b>, mais chaque victoire payée au <b>multiplicateur moyen</b>.</p><p>L\'écart avec <i class="hd" style="background:#3b82f6"></i><b>Profit</b> = ta chance sur les multiplicateurs des spins que tu as gagnés.</p>'],
    ['#ffffff', 'Évènements marquants', '<p>Les <b>moments clés</b> de ta bankroll sur la courbe bleue : plus gros jackpots (x10 et plus gagnés), downswings de 20 buy-ins ou plus, plus longues périodes <b>breakeven</b> (sans rien gagner), point haut et point bas.</p>']],
    f: 'Le badge compare Profit et EV Profit effectif, avec la probabilité d\'avoir au moins autant d\'écart par pure variance. Le rakeback (en bas à gauche) s\'ajoute à toutes les courbes. Clique sur un point pour rejouer le spin.' },
  dash: { t: 'Résumé', i: [
    [null, 'Profit net', '<p>L\'<b>argent réellement gagné</b> sur la période filtrée : gains − buy-ins + rakeback. ROI = profit ÷ total des buy-ins.</p>'],
    [null, 'EV Profit', '<p>Ton <b>gain théorique à long terme</b> : ta part de chips en EV (cEV) payée au multiplicateur moyen de la grille Betclic, rakeback compris. C\'est la courbe violette « EV Profit » de l\'onglet Bankroll.</p>'],
    [null, 'Taux horaire net', '<p>Profit net ÷ temps de jeu. Le temps compte les périodes où au moins un spin était ouvert : jouer 4 tables pendant une heure compte pour une heure.</p>'],
    [null, 'Taux horaire expected', '<p>EV Profit ÷ temps de jeu : ce que tu aurais dû gagner par heure avec ton niveau de jeu, sans la chance des all-in ni des multiplicateurs.</p><p><b>Ajusté setups</b> : pareil, en retirant aussi la chance des setups préflop (voir cEV ajusté).</p>'],
    [null, 'cEV', '<p>Chips gagnés en moyenne par spin, chaque all-in étant compté à ton équité au moment du tapis. Départ à 500 chips par joueur.</p><p>± = intervalle de confiance à 95 % : ta vraie cEV a 95 % de chances d\'être dans cette fourchette.</p>'],
    [null, 'cEV ajusté', '<p>La cEV sans la chance des <b>setups préflop</b> (AA contre KK, QQ contre AK…) : dans ces all-in, chaque pot est partagé à parts égales, car c\'est la distribution des cartes qui décide, pas ton jeu.</p><p>Au-dessus de la cEV = tu as perdu des setups ; en dessous = tu en as gagné plus que ta part.</p>'],
    [null, 'cEV préflop', '<p>La part de ta cEV par spin gagnée dans les mains <b>finies avant le flop</b> pour toi : vols de blindes, folds, 3-bets, all-in préflop.</p><p>Préflop + postflop = cEV.</p>'],
    [null, 'cEV postflop', '<p>La part de ta cEV par spin gagnée dans les mains où tu as encore <b>joué après le flop</b> (c-bets, calls, all-in au flop, au turn…).</p><p>Préflop + postflop = cEV.</p>'],
    [null, 'cEV 3-way', '<p>La part de ta cEV par spin gagnée tant que les trois joueurs sont encore là.</p><p>3-way + heads-up = cEV.</p>'],
    [null, 'cEV heads-up', '<p>La part de ta cEV par spin gagnée en heads-up. En dessous : la moyenne par heads-up effectivement joué.</p>'],
    [null, 'Chance aux all-in', '<p>Chips réellement gagnés − cEV, par spin : ce que les tirages du board t\'ont donné (+) ou pris (−) aux all-in. C\'est l\'écart entre les courbes verte et orange.</p>'],
    [null, 'Chance aux setups', '<p>cEV − cEV ajusté, par spin : ce que la distribution des cartes t\'a donné (+) ou pris (−) dans les setups préflop (AA contre KK, QQ contre AK…). C\'est l\'écart entre les courbes orange et rose.</p><p>« voir » ouvre la liste de ces setups dans Review.</p>']] },
  multi: { t: 'D\'où vient ta chance (en €)', i: [
    ['#f472b6', 'Chance totale', 'Profit − EV profit : tout ce que la variance t\'a donné ou pris.'],
    ['#fb923c', 'Chance multiplicateurs', 'Profit − Multiplicateur neutralisé : l\'argent gagné ou perdu parce que tes victoires sont tombées sur des multiplicateurs au-dessus ou en dessous de la moyenne. Gagner un x2 coûte de l\'EV, gagner un x10 en rapporte.'],
    ['#3b82f6', 'Chance jeu', 'Multiplicateur neutralisé − EV profit : l\'argent gagné ou perdu parce que tu as gagné plus ou moins de spins que ce que tes chips en EV prévoyaient (all-in, flips, issue des heads-up).']],
    f: 'La chance totale est la somme des deux autres. Au-dessus de 0 = chanceux, en dessous = malchanceux. Le badge porte sur la chance multiplicateurs.' },
  mavg: { t: 'Multiplicateur moyen', i: [
    ['#fb923c', 'Tous tes spins', 'Moyenne des multiplicateurs tirés sur tous tes spins, depuis le début de la période.'],
    ['#22c55e', 'Tes victoires', 'Moyenne des multiplicateurs des spins que tu as gagnés : c\'est elle qui compte pour ton argent.'],
    ['#a3a3a3', 'Attendu', 'Le multiplicateur moyen de la grille officielle Betclic (rake compris). Les deux courbes devraient s\'en rapprocher avec le volume.']],
    f: 'Au-dessus de la ligne grise = tu as tiré (ou gagné) de meilleurs multiplicateurs que la moyenne.' },
  mtab: { t: 'Tableau des multiplicateurs', i: [
    [null, 'Réel / Attendu', 'Part de tes spins tombés sur chaque multiplicateur, et la fréquence officielle de la grille Betclic.'],
    [null, 'Écart', 'Nombre de spins en plus (+) ou en moins (−) par rapport à ce qu\'annonce la grille pour ton volume.'],
    [null, 'Victoires', 'Spins gagnés sur ce multiplicateur, et ton taux de victoire entre parenthèses.'],
    [null, '75/15/10', 'Grands multiplicateurs où le prize pool est partagé : 75 % au 1er, 15 % au 2e, 10 % au 3e.']] },
  pos: { t: 'cEV par position', i: [
    ['#ef4444', 'vs Reg', 'Chips gagnés en EV quand ton adversaire principal du coup est un reg.'],
    ['#3b82f6', 'vs Fish', 'Pareil contre un fish.'],
    ['#fb923c', 'Tous', 'Toutes les mains de la position.'],
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
  const [topic, idx] = k.split(':'); let H = HELP[topic]; if (!H) return;
  if (idx != null && H.i[+idx]) H = { t: H.i[+idx][1], i: [H.i[+idx]] };
  $('#modalRoot').innerHTML = '<div class="modal-bg" data-act="closeModal"><div class="modal help-modal" role="dialog" aria-modal="true" aria-label="' + esc(H.t) + '"><div class="row"><h3 style="margin:0;font:700 22px var(--display)">' + esc(H.t) + '</h3><div class="grow" style="flex:1"></div><button class="btn small" data-act="closeModal">Fermer</button></div>' +
    '<dl class="help-list">' + H.i.map(([c, n, d]) => '<dt>' + (c ? '<i style="background:' + c + '"></i>' : '') + esc(n) + '</dt><dd>' + (d[0] === '<' ? d : esc(d)) + '</dd>').join('') + '</dl>' + (H.f ? '<p class="note" style="margin:0;font-size:13px">' + esc(H.f) + '</p>' : '') + '</div></div>';
}
// small "?" next to a curve: a card above it (hover to peek, click to pin)
let HPOP = null;
function hpopShow(btn, pin) {
  const [topic, idx] = btn.dataset.help.split(':'), H = HELP[topic], it = H && H.i[+idx]; if (!it) return;
  hpopHide(true);
  const d = document.createElement('div'); d.className = 'hpop'; d.setAttribute('role', 'tooltip');
  d.innerHTML = '<h4>' + esc(it[1]) + '</h4>' + (it[2][0] === '<' ? it[2] : '<p>' + esc(it[2]) + '</p>');
  document.body.appendChild(d);
  const r = btn.getBoundingClientRect();
  d.style.left = Math.max(8, Math.min(r.left - 30, window.innerWidth - d.offsetWidth - 8)) + 'px';
  if (r.top > d.offsetHeight + 16) d.style.bottom = (window.innerHeight - r.top + 8) + 'px'; else d.style.top = (r.bottom + 8) + 'px';
  HPOP = { d, btn, pin };
}
function hpopHide(force) { if (HPOP && (force || !HPOP.pin)) { HPOP.d.remove(); HPOP = null; } }
document.addEventListener('mouseover', (e) => { const b = e.target.closest('.qm.sm'); if (b && (!HPOP || HPOP.btn !== b)) hpopShow(b, false); });
document.addEventListener('mouseout', (e) => { const b = e.target.closest('.qm.sm'); if (b && !b.contains(e.relatedTarget)) hpopHide(false); });
document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-help]');
  if (t && t.classList.contains('sm')) { e.stopPropagation(); if (HPOP && HPOP.btn === t && HPOP.pin) hpopHide(true); else hpopShow(t, true); return; }
  if (HPOP && !e.target.closest('.hpop')) hpopHide(true);
  if (t) { e.stopPropagation(); openHelp(t.dataset.help); }
}, true);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hpopHide(true); });

// ---------- "Évènements marquants" on the bankroll curve ----------
function brEvents(P, C) {
  const n = P.length; if (n < 20) return null;
  const bi = C.reduce((x, t) => x + t.bi, 0) / n, pts = [], lines = [];
  let hi = 0, lo = 0; for (let i = 0; i < n; i++) { if (P[i] > P[hi]) hi = i; if (P[i] < P[lo]) lo = i; }
  pts.push({ i: hi, v: P[hi], label: 'Plus haut ' + fmtS(P[hi], 0) + ' €', up: 1 });
  pts.push({ i: lo, v: P[lo], label: 'Plus bas ' + fmtS(P[lo], 0) + ' €' });
  // downswings of 20 buy-ins or more: biggest drop, then the biggest ones before its peak and after its trough
  const dd = [];
  (function rec(a, b) {
    if (b - a < 2 || dd.length >= 4) return;
    let pk = a, best = 0, bp = -1, bt = -1;
    for (let i = a; i <= b; i++) { if (P[i] > P[pk]) pk = i; if (P[pk] - P[i] > best) { best = P[pk] - P[i]; bp = pk; bt = i; } }
    if (best < 20 * bi) return; dd.push([bp, bt, best]); rec(a, bp); rec(bt, b);
  })(0, n - 1);
  for (const [p, t, d] of dd) { lines.push({ i1: p, v1: P[p], i2: t, v2: P[t] }); const lab = 'Downswing −' + fmtN(d / bi, 0) + ' BI (−' + fmtN(d, 0) + ' €)'; if (t !== lo) pts.push({ i: t, v: P[t], label: lab }); else pts[1].label = lab + ' · plus bas ' + fmtS(P[lo], 0) + ' €'; }
  // longest stretches without making money (end no higher than the start)
  const minLen = Math.max(40, Math.round(n * 0.12)), be = [];
  (function rec(a, b) {
    if (b - a < minLen || be.length >= 3) return;
    const ix = []; let bi0 = -1, bj = -1;
    for (let j = a; j <= b; j++) {
      if (!ix.length || P[j] > P[ix[ix.length - 1]]) ix.push(j);
      let l = 0, h = ix.length - 1; while (l < h) { const m = (l + h) >> 1; if (P[ix[m]] >= P[j]) h = m; else l = m + 1; }
      if (j - ix[l] > bj - bi0) { bi0 = ix[l]; bj = j; }
    }
    if (bj - bi0 < minLen) return; be.push([bi0, bj]); rec(a, bi0); rec(bj, b);
  })(0, n - 1);
  for (const [i, j] of be) lines.push({ i1: i, v1: P[i], i2: j, v2: P[i], label: fmtN(j - i) + ' spins breakeven' });
  // biggest jackpots won
  C.map((t, i) => ({ t, i })).filter(x => x.t.place === 1 && x.t.mult >= 10).sort((a, b) => b.t.mult - a.t.mult || b.t.eur - a.t.eur).slice(0, 3)
    .forEach(x => pts.push({ i: x.i, v: P[x.i], label: 'Jackpot x' + fmtN(x.t.mult) + ' (+' + fmtN(x.t.eur, 0) + ' €)', up: 1 }));
  return { pts, lines };
}

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
  const series = [{ k: 't', name: 'Chance totale', color: '#f472b6', data: tot, help: 'multi:0' }, { k: 'm', name: 'Chance multiplicateurs', color: '#fb923c', data: ml, help: 'multi:1' }, { k: 'g', name: 'Chance jeu', color: '#3b82f6', data: gl, help: 'multi:2' }].map(s => Object.assign(s, { on: !!ser[s.k] }));
  const tip = (i) => 'Tournoi ' + fmtN(i + 1) + ' · ' + fmtDate(C[i].start, true) + ' · x' + C[i].mult + (C[i].place ? ' · ' + C[i].place + (C[i].place === 1 ? 'er' : 'e') : '');
  lineChart($('#chart'), { series, xLabel: 'Tournois joués', yFmt: (v) => fmtN(v, Math.abs(v) < 10 && v % 1 ? 1 : 0) + ' €', tipHead: tip, onPick: (i) => openSpin(C[i].gid), badge: LB.html, badgeCls: LB.cls });
  legend(series, 'mu');
  const s2 = [{ name: 'Tous tes spins', color: '#fb923c', data: am, on: 1 }, { name: 'Tes victoires', color: '#22c55e', data: aw, on: 1 }, { name: 'Attendu', color: '#a3a3a3', data: ex, on: 1, dash: 1 }];
  lineChart($('#chart2'), { series: s2, xLabel: 'Tournois joués', noZero: 1, yFmt: (v) => v == null ? '—' : 'x' + fmtN(v, 2), tipHead: tip, onPick: (i) => openSpin(C[i].gid) });
  $('#legend2').innerHTML = s2.map(s => '<span class="chip"><i class="dot" style="background:' + s.color + '"></i>' + esc(s.name) + '</span>').join('');
}

// close the "Autres" curve menu on an outside click
document.addEventListener('click', (e) => {
  if (!S.ui.moreOpen || e.target.closest('.lg-more')) return;
  S.ui.moreOpen = null; document.querySelectorAll('.lg-menu').forEach(x => x.remove());
  document.querySelectorAll('.lg-mbtn').forEach(b => { b.setAttribute('aria-expanded', 'false'); const p = b.querySelector('path'); if (p) p.setAttribute('d', 'M1 1l4 4 4-4'); });
});
