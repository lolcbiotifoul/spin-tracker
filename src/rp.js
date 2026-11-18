// ---------- Hand replayer ----------
const RP = { list: [], idx: 0, title: '', step: 0, snaps: [], actStep: [], playing: false, timer: null, unit: 'bb', hide: false, chain: true, speed: 1 };
function rpLabel(a) {
  const n = a.n, ai = a.ai ? ' all-in' : '';
  return { sb: 'SB ' + rpAmt(n), bb: 'BB ' + rpAmt(n), ante: 'Ante ' + rpAmt(n), f: 'Fold', x: 'Check', c: 'Call ' + rpAmt(n), b: 'Bet ' + rpAmt(n), r: 'Raise ' + rpAmt(n) }[a.a] + ai;
}
function rpAmt(v) { const h = RP.h; if (!h) return fmtN(v); return RP.unit === 'bb' ? fmtN(v / h.bb, Math.abs(v / h.bb) < 100 ? 1 : 0) + ' bb' : fmtN(v); }
function buildSnaps(h) {
  const st = { p: {}, pot: 0, board: 0, reveal: false, active: null, note: 'Début de la main', eq: null, log: -1, end: false };
  for (const p of h.players) st.p[p.name] = { stack: p.stack, bet: 0, folded: false, act: null, allin: false, won: 0 };
  const snaps = [], actStep = [];
  const push = () => snaps.push(JSON.parse(JSON.stringify(st)));
  push();
  let street = 0;
  const collect = () => { for (const n in st.p) { st.pot += st.p[n].bet; st.p[n].bet = 0; if (!st.p[n].folded && !st.p[n].allin) st.p[n].act = null; } };
  const deal = (s) => { collect(); street = s; st.board = s === 1 ? 3 : s === 2 ? 4 : 5; st.note = ['', 'Flop', 'Turn', 'River'][s]; st.active = null; st.log = -1; push(); };
  h.acts.forEach((a, k) => {
    if (a.st > street) for (let s = street + 1; s <= a.st; s++) deal(s);
    const P = st.p[a.p]; if (!P) return;
    P.stack -= a.add || 0; P.bet += a.add || 0;
    if (P.stack <= 0 && a.a !== 'f') { P.stack = 0; P.allin = true; }
    if (a.a === 'f') P.folded = true;
    P.act = { a: a.a, n: a.n, ai: a.ai };
    st.active = a.p; st.log = k; st.note = ''; actStep[k] = snaps.length; push();
  });
  st.active = null; st.log = -1;
  if (h.uncalled && st.p[h.uncalledTo]) {
    const P = st.p[h.uncalledTo]; const fromBet = Math.min(P.bet, h.uncalled);
    P.bet -= fromBet; st.pot -= (h.uncalled - fromBet); P.stack += h.uncalled; if (P.stack > 0) P.allin = false;
    st.note = 'Mise non suivie rendue à ' + h.uncalledTo; push();
  }
  const live = h.players.map(p => p.name).filter(n => !h.folded[n]);
  if (live.length >= 2 && h.board.length > st.board) {
    collect(); st.reveal = true; if (h.E && h.E.adj && h.E.eq) st.eq = h.E.eq; st.note = 'All-in : cartes retournées'; push();
    for (let s = street + 1; s <= 3; s++) if (h.board.length >= (s === 1 ? 3 : s === 2 ? 4 : 5)) deal(s);
  }
  if (live.length >= 2) { collect(); st.reveal = true; st.note = 'Showdown'; push(); }
  collect();
  for (const n in h.won) if (st.p[n]) { st.p[n].stack += h.won[n]; st.p[n].won = h.won[n]; }
  st.pot = 0; st.end = true; st.active = null;
  const winners = Object.keys(h.won);
  st.note = winners.length ? winners.map(n => n + ' gagne ' + fmtN(h.won[n])).join(' · ') : 'Fin de la main';
  push();
  return { snaps, actStep };
}
function openReplayer(list, idx, title) {
  if (!list || !list.length) return;
  rpStop(); RP.list = list; RP.idx = Math.max(0, Math.min(idx || 0, list.length - 1)); RP.title = title || '';
  rpLoad(0); rpRender();
}
function rpLoad(step) {
  const h = RP.list[RP.idx]; RP.h = h; const b = buildSnaps(h); RP.snaps = b.snaps; RP.actStep = b.actStep;
  RP.step = step === 'end' ? RP.snaps.length - 1 : 0;
}
function rpStop() { RP.playing = false; clearTimeout(RP.timer); }
function rpClose() { rpStop(); RP.h = null; $('#modalRoot').innerHTML = ''; }
function rpTick() {
  if (!RP.playing || !RP.h) return;
  if (RP.step < RP.snaps.length - 1) { RP.step++; rpUpdate(); RP.timer = setTimeout(rpTick, 950 / RP.speed); }
  else if (RP.chain && RP.idx < RP.list.length - 1) { RP.timer = setTimeout(() => { if (!RP.playing) return; RP.idx++; rpLoad(0); rpRender(); RP.timer = setTimeout(rpTick, 700 / RP.speed); }, 1500 / RP.speed); }
  else { RP.playing = false; rpUpdate(); }
}
function rpLayout(h) {
  const sorted = h.players.slice().sort((a, b) => a.seat - b.seat);
  const hero = h.players.find(p => p.hero) || sorted[0]; const hi = sorted.indexOf(hero);
  const order = sorted.map((_, k) => sorted[(hi + k) % sorted.length]);
  const P = sorted.length === 2 ? [[50, 83, 50, 63, 61, 76], [50, 17, 50, 37, 39, 25]] : [[50, 83, 50, 63, 61, 76], [17, 30, 31, 44, 27, 47], [83, 30, 69, 44, 73, 47]];
  return order.map((p, i) => ({ p, x: P[i][0], y: P[i][1], bx: P[i][2], by: P[i][3], dx: P[i][4], dy: P[i][5] }));
}
function rpCard(c, hidden) { if (!c || hidden) return '<span class="card big back"></span>'; const r = c[0] === 'T' ? '10' : c[0]; const sym = { s: '♠', h: '♥', d: '♦', c: '♣' }[c[1]]; return '<span class="card big c-' + c[1] + '">' + r + '<small>' + sym + '</small></span>'; }
function rpFelt() {
  const h = RP.h, s = RP.snaps[RP.step];
  let o = '<div class="felt-in"></div>';
  if (s.note) o += '<div class="rp-note">' + esc(s.note) + '</div>';
  if (s.pot) o += '<div class="rp-pot">Pot ' + rpAmt(s.pot) + '</div>';
  o += '<div class="rp-board">' + [0, 1, 2, 3, 4].map(i => i < s.board ? rpCard(h.board[i]) : '<span class="card big slot"></span>').join('') + '</div>';
  for (const L of rpLayout(h)) {
    const p = L.p, ps = s.p[p.name]; const known = h.hole[p.name];
    const hidden = !p.hero && (RP.hide ? !(s.reveal && h.shown[p.name]) : false);
    const act = ps.act ? rpLabel(Object.assign({ a: ps.act.a, n: ps.act.n, ai: ps.act.ai })) : '';
    const eq = s.eq && s.eq[p.name] != null && !ps.folded ? '<span class="rp-eq">' + fmtP(s.eq[p.name] * 100, 1) + '</span>' : '';
    o += '<div class="rp-seat' + (ps.folded ? ' folded' : '') + (s.active === p.name ? ' active' : '') + (p.hero ? ' hero' : '') + (s.end && ps.won ? ' winner' : '') + '" style="left:' + L.x + '%;top:' + L.y + '%">' +
      '<div class="rp-cards">' + (known ? rpCard(known[0], hidden) + rpCard(known[1], hidden) : rpCard(null) + rpCard(null)) + '</div>' +
      '<div class="rp-box"><div class="rp-name">' + (p.hero ? '' : tagHtml(p.name, true) + ' ') + esc(p.name) + ' <span class="pill">' + p.pos + '</span></div><div class="rp-stack">' + (ps.allin && !s.end ? '<b style="color:var(--accent)">ALL-IN</b>' : rpAmt(ps.stack)) + eq + '</div></div>' +
      (act ? '<div class="rp-act a-' + ps.act.a + (ps.act.ai ? ' ai' : '') + '">' + esc(act) + '</div>' : (s.end && ps.won ? '<div class="rp-act win">+' + rpAmt(ps.won) + '</div>' : '')) + '</div>';
    if (ps.bet) o += '<div class="rp-bet" style="left:' + L.bx + '%;top:' + L.by + '%"><i></i>' + rpAmt(ps.bet) + '</div>';
    if (p.btn) o += '<div class="rp-dealer" style="left:' + L.dx + '%;top:' + L.dy + '%">D</div>';
  }
  return o;
}
function rpLog() {
  const h = RP.h, s = RP.snaps[RP.step]; const st = ['Preflop', 'Flop', 'Turn', 'River']; let o = '', cur = -1;
  h.acts.forEach((a, k) => {
    if (a.st !== cur) { cur = a.st; o += '<div class="rp-st">' + st[a.st] + (a.st ? ' ' + cardsHtml(a.st === 1 ? h.board.slice(0, 3) : h.board.slice(a.st + 1, a.st + 2)) : '') + '</div>'; }
    const done = RP.actStep[k] != null && RP.actStep[k] <= RP.step;
    o += '<button class="rp-line' + (s.log === k ? ' on' : '') + (done ? '' : ' todo') + (a.p === h.hero ? ' me' : '') + '" data-rpgo="' + (RP.actStep[k] != null ? RP.actStep[k] : 0) + '">' + esc(a.p) + ' · ' + esc(rpLabel(a)) + '</button>';
  });
  for (let s2 = cur + 1; s2 <= 3; s2++) if (h.board.length >= (s2 === 1 ? 3 : s2 + 2)) o += '<div class="rp-st">' + st[s2] + ' ' + cardsHtml(s2 === 1 ? h.board.slice(0, 3) : h.board.slice(s2 + 1, s2 + 2)) + '</div>';
  return o;
}
function rpRender() {
  const h = RP.h; const hero = h.hero; const t = S.tours.find(z => z.gid === h.gid);
  const net = h.net[hero] || 0, ev = h.E.ev[hero] || 0;
  const posInSpin = t ? t.hands.indexOf(h) + 1 : 0;
  const me = h.players.find(p => p.hero);
  let o = '<div class="rp-bg" data-rp="bg"><div class="rp" role="dialog" aria-modal="true" aria-label="Replayer de mains">' +
    '<div class="rp-top"><div><div class="rp-title">Main du ' + fmtDate(h.ts, true) + ' <span class="pill">' + esc(h.posKey || '') + '</span> <span class="pill">Blinds ' + h.sb + '/' + h.bb + '</span> <span class="pill">' + fmtE(h.bi, 0) + ' · x' + h.mult + '</span></div>' +
    '<div class="sub">' + esc(RP.title) + (t ? ' · main ' + posInSpin + ' / ' + t.hands.length + ' du spin' : '') + '</div></div>' +
    '<div class="rp-nav"><button class="btn small" data-rp="prevHand"' + (RP.idx ? '' : ' disabled') + ' aria-label="Main précédente">◀ Main préc.</button><span class="mono">' + (RP.idx + 1) + ' / ' + RP.list.length + '</span><button class="btn small" data-rp="nextHand"' + (RP.idx < RP.list.length - 1 ? '' : ' disabled') + ' aria-label="Main suivante">Main suiv. ▶</button><button class="btn small" data-rp="close">Fermer</button></div></div>' +
    '<div class="rp-body"><div class="rp-main"><div class="felt" id="rpFelt"></div>' +
    '<div class="rp-ctrl"><button class="btn" data-rp="first" aria-label="Début">⏮</button><button class="btn" data-rp="back" aria-label="Action précédente">◀</button><button class="btn primary rp-play" data-rp="play" id="rpPlay" aria-label="Lecture">▶</button><button class="btn" data-rp="fwd" aria-label="Action suivante">▶▶</button><button class="btn" data-rp="last" aria-label="Fin">⏭</button>' +
    '<input type="range" id="rpSlider" min="0" max="' + (RP.snaps.length - 1) + '" value="' + RP.step + '" aria-label="Position dans la main">' +
    '<select id="rpSpeed" aria-label="Vitesse">' + [0.5, 1, 2, 4].map(v => '<option value="' + v + '"' + (RP.speed === v ? ' selected' : '') + '>x' + String(v).replace('.', ',') + '</option>').join('') + '</select>' +
    '<span class="seg"><button class="' + (RP.unit === 'bb' ? 'on' : '') + '" data-rp="unit:bb">bb</button><button class="' + (RP.unit === 'chips' ? 'on' : '') + '" data-rp="unit:chips">chips</button></span>' +
    '<label class="rp-chk" for="rpHide"><input type="checkbox" id="rpHide"' + (RP.hide ? ' checked' : '') + '> Cacher les cartes adverses</label>' +
    '<label class="rp-chk" for="rpChain"><input type="checkbox" id="rpChain"' + (RP.chain ? ' checked' : '') + '> Enchaîner les mains</label></div>' +
    '<div class="note" style="text-align:center">Clavier : ← → action, espace lecture, ↑ ↓ main précédente / suivante, Échap fermer</div></div>' +
    '<aside class="rp-side"><div class="rp-res"><div><span class="sub">Net</span><b class="' + cls(net) + '">' + fmtS(net) + '</b><span class="sub">' + fmtS(net / h.bb, 1) + ' bb</span></div><div><span class="sub">EV</span><b class="' + cls(ev) + '">' + fmtS(ev) + '</b><span class="sub">' + fmtS(ev / h.bb, 1) + ' bb</span></div></div>' +
    (h.E.adj && h.E.eq ? '<div class="note">All-in ' + ['préflop', 'flop', 'turn', 'river'][h.E.st] + ' · équités : ' + Object.keys(h.E.eq).map(n => esc(n) + ' ' + fmtP(h.E.eq[n] * 100, 1)).join(' · ') + '</div>' : '') +
    '<div class="note">Tapis de départ de ' + esc(hero) + ' : ' + fmtN(me ? me.stack : 0) + ' (' + fmtN(me ? me.stack / h.bb : 0, 1) + ' bb)</div>' +
    '<div class="rp-log" id="rpLog"></div>' +
    '<div class="row"><button class="btn small star-btn" data-rp="fav">' + (S.prefs.favs[h.id] ? '★ Favori' : '☆ Ajouter aux favoris') + '</button><button class="btn small" data-rp="copy">Copier l\'historique</button>' + (t ? '<button class="btn small" data-rp="spin">Rejouer tout le spin</button>' : '') + '</div><pre id="hhText" style="display:none">' + esc(E.toText(h)) + '</pre></aside></div></div></div>';
  $('#modalRoot').innerHTML = o;
  rpUpdate();
}
function rpUpdate() {
  const f = $('#rpFelt'); if (!f) return;
  f.innerHTML = rpFelt();
  $('#rpLog').innerHTML = rpLog();
  const on = $('#rpLog .rp-line.on'); if (on) on.scrollIntoView({ block: 'nearest' });
  const sl = $('#rpSlider'); if (sl) sl.value = RP.step;
  const pb = $('#rpPlay'); if (pb) { pb.textContent = RP.playing ? '❚❚' : '▶'; pb.setAttribute('aria-label', RP.playing ? 'Pause' : 'Lecture'); }
}
function rpCmd(c) {
  if (c === 'bg' || c === 'close') { rpClose(); return; }
  if (c === 'first') { rpStop(); RP.step = 0; }
  else if (c === 'back') { rpStop(); RP.step = Math.max(0, RP.step - 1); }
  else if (c === 'fwd') { rpStop(); RP.step = Math.min(RP.snaps.length - 1, RP.step + 1); }
  else if (c === 'last') { rpStop(); RP.step = RP.snaps.length - 1; }
  else if (c === 'play') { if (RP.playing) rpStop(); else { RP.playing = true; if (RP.step >= RP.snaps.length - 1 && !(RP.chain && RP.idx < RP.list.length - 1)) RP.step = 0; RP.timer = setTimeout(rpTick, 250); } }
  else if (c === 'prevHand' || c === 'nextHand') { const pl = RP.playing; rpStop(); RP.idx = Math.max(0, Math.min(RP.list.length - 1, RP.idx + (c === 'nextHand' ? 1 : -1))); rpLoad(0); rpRender(); if (pl) { RP.playing = true; RP.timer = setTimeout(rpTick, 600); } return; }
  else if (c.startsWith('unit:')) { RP.unit = c.slice(5); rpRender(); return; }
  else if (c === 'fav') { const id = RP.h.id; if (S.prefs.favs[id]) delete S.prefs.favs[id]; else S.prefs.favs[id] = 1; savePrefs(); rpRender(); return; }
  else if (c === 'copy') { try { navigator.clipboard.writeText($('#hhText').textContent).then(() => toast('Historique copié'), () => toast('Copie refusée par le navigateur')); } catch (e) { toast('Copie refusée par le navigateur'); } return; }
  else if (c === 'spin') { const t = S.tours.find(z => z.gid === RP.h.gid); if (t) openReplayer(t.hands, t.hands.indexOf(RP.h), 'Spin du ' + fmtDate(t.start, true)); return; }
  rpUpdate();
}
function openSpin(gid) { const t = S.tours.find(z => z.gid === gid); if (t) openReplayer(t.hands, 0, 'Spin du ' + fmtDate(t.start, true) + ' · x' + t.mult + ' · ' + (t.place ? (t.place === 1 ? '1er' : t.place + 'e') : 'incomplet') + ' · cEV ' + fmtS(t.ev)); }
