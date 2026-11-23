// ---------- Review: hand filters, built like PT4's filter window ----------
// Every filter reads "facts" computed once per hand (h._fx) from the hero's point of view.
const HF_SN = ['Préflop', 'Flop', 'Turn', 'River'];
const hfR = (c) => RK.indexOf(c[0]);
function hfStraightHi(set) { // best straight high card in a set of rank indexes (ace also low), -1 if none
  const has = (r) => set.has(r < 0 ? 12 : r);
  for (let hi = 12; hi >= 3; hi--) { let ok = true; for (let k = 0; k < 5; k++) if (!has(hi - k)) { ok = false; break; } if (ok) return hi; }
  return -1;
}
// hero's made hand, only counting what his hole cards bring (a pair on the board alone is "nothing")
function hfMade(hole, board) {
  const all = hole.concat(board), cnt = Array(13).fill(0), bc = Array(13).fill(0);
  for (const c of all) cnt[hfR(c)]++; for (const c of board) bc[hfR(c)]++;
  const hr = hole.map(hfR), suits = {};
  for (const c of all) suits[c[1]] = (suits[c[1]] || 0) + 1;
  let fs = null; for (const s in suits) if (suits[s] >= 5 && hole.some(c => c[1] === s)) fs = s;
  const allSet = new Set(all.map(hfR)), bSet = new Set(board.map(hfR));
  if (fs && hfStraightHi(new Set(all.filter(c => c[1] === fs).map(hfR))) > hfStraightHi(new Set(board.filter(c => c[1] === fs).map(hfR)))) return 'sf';
  if (hr.some(r => cnt[r] === 4)) return 'quads';
  const trips = [], pairs = []; for (let r = 12; r >= 0; r--) { if (cnt[r] >= 3) trips.push(r); else if (cnt[r] === 2) pairs.push(r); }
  if (trips.length && (trips.length > 1 || pairs.length)) { const t = trips[0], p = trips.length > 1 ? trips[1] : pairs[0]; if (hr.includes(t) || hr.includes(p)) return 'full'; }
  if (fs) return 'flush';
  if (hfStraightHi(allSet) > hfStraightHi(bSet)) return 'straight';
  if (hr[0] === hr[1]) { if (bc[hr[0]] >= 1) return 'set'; }
  else for (const r of hr) if (bc[r] >= 2) return 'trips';
  if (hr[0] !== hr[1] && bc[hr[0]] >= 1 && bc[hr[1]] >= 1) return 'twopair';
  const bu = [...bSet].sort((a, b) => b - a);
  if (hr[0] === hr[1]) return hr[0] > bu[0] ? 'overpair' : 'pp';
  const pr = hr.filter(r => bc[r] >= 1);
  if (pr.length) { const r = Math.max(...pr); return r === bu[0] ? 'toppair' : r === bu[bu.length - 1] ? 'bottompair' : 'midpair'; }
  return 'nothing';
}
function hfDraws(hole, board, s) {
  const all = hole.concat(board), sa = {}, out = [];
  for (const c of all) sa[c[1]] = (sa[c[1]] || 0) + 1;
  let fd = false, bd = false, made = false;
  for (const su in sa) {
    if (!hole.some(c => c[1] === su)) continue;
    if (sa[su] >= 5) made = true; else if (sa[su] === 4) fd = true; else if (s === 1 && sa[su] === 3) bd = true;
  }
  if (made) fd = bd = false;
  const allSet = new Set(all.map(hfR)), bSet = new Set(board.map(hfR)); let outs = 0;
  if (hfStraightHi(allSet) < 0) for (let r = 0; r < 13; r++) {
    if (allSet.has(r)) continue;
    const a2 = new Set(allSet), b2 = new Set(bSet); a2.add(r); b2.add(r);
    const ha = hfStraightHi(a2); if (ha >= 0 && ha > hfStraightHi(b2)) outs++;
  }
  if (fd) out.push('fd'); if (bd) out.push('bdfd');
  if (outs >= 2) out.push('oesd'); else if (outs === 1) out.push('gs');
  if (fd && outs) out.push('combo');
  if (!fd && !bd && !outs) out.push('none');
  return out;
}
function hfBoard(b) {
  const rc = {}, sc = {}; for (const c of b) { rc[c[0]] = (rc[c[0]] || 0) + 1; sc[c[1]] = (sc[c[1]] || 0) + 1; }
  const v = Object.values(rc), np = v.filter(x => x === 2).length, ms = Math.max(...Object.values(sc));
  const rs = new Set(b.map(hfR)); if (rs.has(12)) rs.add(-1);
  let mx = 0; for (let lo = -1; lo <= 8; lo++) { let k = 0; for (let r = lo; r < lo + 5; r++) if (rs.has(r)) k++; if (k > mx) mx = k; }
  const hi = Math.max(...b.map(hfR));
  const o = { pair: v.some(x => x >= 3) || np >= 2 ? 't' : np === 1 ? 'p' : 'np', suit: ms >= 4 ? 'm4' : ms === 3 ? 'm3' : ms === 2 ? 'tt' : 'r',
    conn: mx >= 4 ? ['q1', 'qa'] : mx === 3 ? ['q', 'qa'] : ['n'], high: hi >= 8 ? RK[hi] : '9-', has: [...new Set(b.map(c => c[0]))], card: [] };
  if (b.length > 3) {
    const c = b[b.length - 1], p = b.slice(0, -1), r = hfR(c), pm = Math.max(...p.map(hfR));
    const pr = p.some(x => x[0] === c[0]), ov = r > pm;
    if (ov) o.card.push('over'); if (pr) o.card.push('pair');
    if (p.filter(x => x[1] === c[1]).length === 2) o.card.push('fl3');
    if (!ov && !pr) o.card.push('low');
  }
  return o;
}
function hfFacts(h) {
  if (h._fx) return h._fx;
  const me = h.hero, bb = h.bb || 1, x = { made: [], draw: [], bd: [], st: [] };
  const posOf = {}; for (const p of h.players) posOf[p.name] = p.pos;
  x.n = String(h.n); x.pos = h.n === 2 ? 'HU ' + posOf[me] : posOf[me];
  x.pot = (h.pot || 0) / bb; x.eff = E.effStackBB(h, me); x.inv = (h.contrib[me] || 0) / bb; x.net = (h.net[me] || 0) / bb;
  x.res = x.net > 0 ? 'won' : x.net < 0 ? 'lost' : 'even';
  const hole = h.hole[me]; x.hk = hole && hole.length === 2 ? handKey(hole) : null;
  x.setup = !!(h.SU && h.SU.adj[me] != null);
  x.sd = h.sd && !h.folded[me] ? ['sd', (h.won[me] || 0) > 0 ? 'wsd' : 'lsd'] : ['nosd'];
  // ---- preflop
  let raises = 0, limps = 0, faceAI = false, pfa = null, heroLimp = false; const my = [];
  for (const a of h.acts) {
    if (a.st !== 0) continue;
    if (a.a === 'sb' || a.a === 'bb' || a.a === 'ante') continue;
    if (a.p === me) {
      const facing = raises === 0 ? (limps ? 'limp' : 'unopened') : raises === 1 ? 'open' : raises === 2 ? '3b' : '4b';
      const act = a.a === 'f' ? 'f' : a.a === 'x' ? 'x' : a.a === 'c' ? (raises === 0 ? 'limp' : 'call') : (a.ai ? 'shove' : 'raise');
      my.push({ act, facing, ai: raises > 0 && faceAI });
    }
    if (a.a === 'c' && raises === 0) { limps++; if (a.p === me) heroLimp = true; }
    if (a.a === 'r' || a.a === 'b') { raises++; pfa = a.p; faceAI = !!a.ai; }
  }
  const ag = (m) => m && (m.act === 'raise' || m.act === 'shove');
  x.pfMax = raises === 0 ? 'none' : raises === 1 ? 'r1' : raises === 2 ? 'r2' : 'r3';
  x.limp = limps ? (heroLimp ? ['any', 'hero'] : ['any']) : ['none'];
  x.vpip = my.some(m => m.act !== 'f' && m.act !== 'x') ? 'y' : 'n';
  x.pfr = my.some(ag) ? 'y' : 'n';
  const act2 = (m) => m ? (ag(m) ? [m.act, 'rs'] : [m.act]) : [];
  x.pf1 = act2(my[0]); x.pf2 = act2(my[1]);
  x.pfsit = my[0] ? [my[0].facing].concat(my[0].ai ? ['faceai'] : []) : ['walk'];
  const N = new Set(), m0 = my[0], m1 = my[1];
  if (m0 && m0.facing === 'unopened') {
    if (m0.act === 'raise') N.add('open'); else if (m0.act === 'shove') N.add('openshove');
    else if (m0.act === 'limp') { N.add('limp'); if (m1) N.add(m1.act === 'f' ? 'limpfold' : m1.act === 'call' ? 'limpcall' : 'limpraise'); }
  }
  for (const m of my) {
    if (m.facing === 'limp' && ag(m)) N.add('iso');
    if (m.facing === 'open') N.add(m.act === 'f' ? 'foldopen' : m.act === 'call' ? 'callopen' : ag(m) ? '3bet' : '');
    if (m.facing === '3b') N.add(m.act === 'f' ? 'f3b' : m.act === 'call' ? 'c3b' : ag(m) ? '4bet' : '');
    if (m.ai) N.add(m.act === 'f' ? 'foldshove' : m.act === 'call' ? 'callshove' : '');
  }
  N.delete(''); x.pfn = [...N];
  x.ai = []; for (const a of h.acts) if (a.p === me && a.ai && a.st >= 0 && a.st <= 3) { x.ai = ['any', String(a.st)]; break; }
  // ---- postflop, street by street
  const order = h.n === 2 ? ['BB', 'SB'] : ['SB', 'BB', 'BTN'];
  const folded = new Set(), allin = new Set();
  for (const a of h.acts) if (a.st === 0) { if (a.a === 'f') folded.add(a.p); if (a.ai) allin.add(a.p); }
  x.saw = [];
  let A = pfa, cbCand = pfa;
  for (let s = 1; s <= 3; s++) {
    if (h.board.length >= s + 2) x.bd[s] = hfBoard(h.board.slice(0, s + 2));
    if (h.board.length < s + 2 || folded.has(me)) continue;
    x.saw.push('ftr'[s - 1]);
    if (x.hk) { const md = hfMade(hole, h.board.slice(0, s + 2)); x.made[s] = [md, /pair|^pp$/.test(md) && md !== 'twopair' ? 'anypair' : '', /^(twopair|trips|set|straight|flush|full|quads|sf)$/.test(md) ? 'twoplus' : ''].filter(Boolean); if (s < 3) x.draw[s] = hfDraws(hole, h.board.slice(0, s + 2), s); }
    const canAct = h.players.map(p => p.name).filter(n => !folded.has(n) && !allin.has(n)).sort((a, b) => order.indexOf(posOf[a]) - order.indexOf(posOf[b]));
    const T = new Set(), O = new Set(), myA = [], acted = new Set();
    let nB = 0, firstB = null, isCb = false, last = null;
    for (const a of h.acts) {
      if (a.st !== s) continue;
      const agg = a.a === 'b' || a.a === 'r';
      if (a.p === me) {
        if (!myA.length) {
          if (nB === 0) {
            O.add('first');
            if (cbCand === me) { O.add('cbopp'); T.add(a.a === 'b' ? 'cbet' : 'nocbet'); }
            else if (a.a === 'b' && A && A !== me && !folded.has(A) && !allin.has(A) && !acted.has(A)) T.add('donk');
          } else if (isCb && nB === 1) { O.add('facecb'); T.add(a.a === 'f' ? 'fcb' : a.a === 'c' ? 'ccb' : 'rcb'); }
        }
        if (nB > 0) O.add('facebet');
        myA.push({ a: a.a, nB, ai: a.ai });
      }
      if (agg) { nB++; if (nB === 1) { firstB = a.p; isCb = a.a === 'b' && a.p === cbCand; } last = a.p; }
      if (a.a === 'f') folded.add(a.p);
      if (a.ai) allin.add(a.p);
      acted.add(a.p);
    }
    const q = myA.map(m => m.a);
    if (q[0] === 'b') { T.add('bet'); if (q[1] === 'f') T.add('bf'); else if (q[1] === 'c') T.add('bc'); else if (q[1] === 'r') T.add('b3'); if (q.length > 1) O.add('facer'); }
    if (q[0] === 'x') { if (q[1] === 'r') T.add('cr'); else if (q[1] === 'c') T.add('cc'); else if (q[1] === 'f') T.add('cf'); else if (nB === 0) T.add('xx'); }
    if (q.includes('r')) T.add('raise');
    if (q.includes('c')) T.add('call');
    if (myA.some(m => m.a === 'f' && m.nB > 0)) T.add('fold');
    if (myA.some(m => m.ai)) T.add('ai');
    x.st[s] = { T: [...T], O: [...O], f1: q[0] ? [q[0]] : [], f2: q[1] ? [q[1]] : [], pos: canAct.length >= 2 && canAct.includes(me) ? [canAct[canAct.length - 1] === me ? 'ip' : 'oop'] : [] };
    cbCand = isCb ? firstB : null; A = last;
  }
  if (!x.saw.length) x.saw = ['pfonly'];
  h._fx = x; return x;
}

// ---------- filter definitions ----------
const HF_CATS = [['det', 'Détails de la main', '<path d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm9 16-4.3-4.3"/>'], ['val', 'Valeur de la main', '<rect x="3" y="5" width="10" height="14" rx="2"/><path d="M15 7.5 19.5 9 16 20"/>'], ['brd', 'Texture du board', '<rect x="2" y="7" width="6" height="9" rx="1.5"/><rect x="9" y="7" width="6" height="9" rx="1.5"/><rect x="16" y="7" width="6" height="9" rx="1.5"/>'], ['act', 'Actions et opportunités', '<path d="M5 12h14M13 6l6 6-6 6"/>']];
const HF_MADE = [['nothing', 'Rien (hauteur)'], ['bottompair', 'Petite paire'], ['midpair', 'Paire moyenne'], ['toppair', 'Top pair'], ['pp', 'Paire servie sous la carte haute'], ['overpair', 'Overpair'], ['anypair', 'Une paire (toutes)'], ['twopair', 'Deux paires'], ['set', 'Brelan (set)'], ['trips', 'Brelan (trips)'], ['straight', 'Quinte'], ['flush', 'Couleur'], ['full', 'Full'], ['quads', 'Carré ou quinte flush'], ['twoplus', 'Deux paires ou mieux']];
const HF_RANKS = [...RK].reverse().map(r => [r, r === 'T' ? '10' : r]);
const HF_DEFS = [
  { id: 'players', cat: 'det', g: 'Table', lab: 'Nombre de joueurs', opts: [['3', '3 joueurs'], ['2', 'Heads-up']], tags: x => [x.n] },
  { id: 'pos', cat: 'det', g: 'Table', lab: 'Position du héros', opts: [['BTN', 'BTN'], ['SB', 'SB'], ['BB', 'BB'], ['HU SB', 'HU SB (bouton)'], ['HU BB', 'HU BB']], tags: x => [x.pos] },
  { id: 'eff', cat: 'det', g: 'Table', lab: 'Tapis effectif (bb)', type: 'range', val: x => x.eff },
  { id: 'pfmax', cat: 'det', g: 'Préflop', lab: 'Relance préflop maximale', opts: [['none', 'Aucune relance (limp ou walk)'], ['r1', 'Une relance (open)'], ['r2', '3-bet'], ['r3', '4-bet ou plus']], tags: x => [x.pfMax] },
  { id: 'limp', cat: 'det', g: 'Préflop', lab: 'Limp préflop', opts: [['any', 'Au moins un joueur a limpé'], ['hero', 'Le héros a limpé'], ['none', 'Personne n\'a limpé']], tags: x => x.limp },
  { id: 'setup', cat: 'det', g: 'Préflop', lab: 'Setup préflop (cEV ajusté)', type: 'bool', tags: x => x.setup ? ['y'] : [] },
  { id: 'pot', cat: 'det', g: 'Pot et résultat', lab: 'Taille du pot (bb)', type: 'range', val: x => x.pot },
  { id: 'inv', cat: 'det', g: 'Pot et résultat', lab: 'Montant investi par le héros (bb)', type: 'range', val: x => x.inv },
  { id: 'res', cat: 'det', g: 'Pot et résultat', lab: 'Gain / perte', opts: [['won', 'Main gagnée'], ['lost', 'Main perdue'], ['even', 'Ni gagnée ni perdue']], tags: x => [x.res] },
  { id: 'net', cat: 'det', g: 'Pot et résultat', lab: 'Résultat net (bb)', type: 'range', val: x => x.net },
  { id: 'saw', cat: 'det', g: 'Déroulement', lab: 'Streets vues par le héros', opts: [['pfonly', 'Main finie préflop'], ['f', 'A vu le flop'], ['t', 'A vu la turn'], ['r', 'A vu la river']], tags: x => x.saw },
  { id: 'sd', cat: 'det', g: 'Déroulement', lab: 'Abattage', opts: [['sd', 'Allé à l\'abattage'], ['wsd', 'Gagné à l\'abattage'], ['lsd', 'Perdu à l\'abattage'], ['nosd', 'Sans abattage']], tags: x => x.sd },
  { id: 'ai', cat: 'det', g: 'Déroulement', lab: 'Le héros est à tapis', opts: [['any', 'À n\'importe quelle street'], ['0', 'Préflop'], ['1', 'Au flop'], ['2', 'À la turn'], ['3', 'À la river']], tags: x => x.ai },
  { id: 'fav', cat: 'det', g: 'Déroulement', lab: 'Main en favori', type: 'bool', live: (h) => !!S.prefs.favs[h.id] },
  { id: 'range', cat: 'val', g: 'Cartes', lab: 'Cartes du héros', type: 'grid', val: x => x.hk },
  { id: 'made', cat: 'val', st: [1, 2, 3], g: 'Main faite', lab: 'Main faite', opts: HF_MADE, tags: (x, s) => x.made[s] || [] },
  { id: 'draw', cat: 'val', st: [1, 2], g: 'Tirages', lab: 'Tirage', opts: [['fd', 'Tirage couleur'], ['bdfd', 'Backdoor couleur'], ['oesd', 'Tirage quinte par les deux bouts (ou double ventral)'], ['gs', 'Tirage quinte ventral'], ['combo', 'Couleur + quinte'], ['none', 'Aucun tirage']], tags: (x, s) => x.draw[s] || [] },
  { id: 'bpair', cat: 'brd', st: [1, 2, 3], g: 'Board', lab: 'Paires sur le board', opts: [['np', 'Board non pairé'], ['p', 'Board pairé'], ['t', 'Brelan ou deux paires sur le board']], tags: (x, s) => x.bd[s] ? [x.bd[s].pair] : [] },
  { id: 'bsuit', cat: 'brd', st: [1, 2, 3], g: 'Board', lab: 'Couleurs du board', opts: [['r', 'Arc-en-ciel (aucune carte de la même couleur)'], ['tt', 'Bicolore (2 cartes de la même couleur)'], ['m3', '3 cartes de la même couleur (monotone au flop)'], ['m4', '4 cartes ou plus de la même couleur']], tags: (x, s) => x.bd[s] ? [x.bd[s].suit] : [] },
  { id: 'bconn', cat: 'brd', st: [1, 2, 3], g: 'Board', lab: 'Quintes possibles', opts: [['n', 'Aucune quinte possible'], ['qa', 'Quinte possible'], ['q', 'Quinte possible avec deux cartes seulement'], ['q1', 'Quinte possible avec une seule carte']], tags: (x, s) => x.bd[s] ? x.bd[s].conn : [] },
  { id: 'bhigh', cat: 'brd', st: [1, 2, 3], g: 'Board', lab: 'Carte la plus haute', opts: [['A', 'As'], ['K', 'Roi'], ['Q', 'Dame'], ['J', 'Valet'], ['T', '10'], ['9-', '9 ou moins']], tags: (x, s) => x.bd[s] ? [x.bd[s].high] : [] },
  { id: 'bcard', cat: 'brd', st: [2, 3], g: 'Board', lab: 'Carte qui tombe', opts: [['over', 'Overcard (plus haute que le board)'], ['pair', 'Paire le board'], ['fl3', 'Amène 3 cartes de la même couleur'], ['low', 'Carte basse (ni overcard, ni paire)']], tags: (x, s) => x.bd[s] ? x.bd[s].card : [] },
  { id: 'bhas', cat: 'brd', st: [1, 2, 3], g: 'Board', lab: 'Le board contient', opts: HF_RANKS, chips: 1, tags: (x, s) => x.bd[s] ? x.bd[s].has : [] },
  { id: 'pfn', cat: 'act', st: [0], g: 'Actions', lab: 'Action du héros', opts: [['open', 'Open-raise'], ['openshove', 'Open-shove (tapis en premier)'], ['limp', 'Limp'], ['limpfold', 'Limp puis fold'], ['limpcall', 'Limp puis call'], ['limpraise', 'Limp puis relance'], ['iso', 'Iso (relance d\'un limp)'], ['callopen', 'Call d\'une relance'], ['foldopen', 'Fold face à une relance'], ['3bet', '3-bet'], ['f3b', 'Fold face à un 3-bet'], ['c3b', 'Call d\'un 3-bet'], ['4bet', '4-bet'], ['callshove', 'Call d\'un tapis'], ['foldshove', 'Fold face à un tapis']], tags: x => x.pfn },
  { id: 'pfsit', cat: 'act', st: [0], g: 'Opportunités', lab: 'Situation à sa première décision', opts: [['unopened', 'Pot non ouvert'], ['limp', 'Face à un limp'], ['open', 'Face à une relance'], ['3b', 'Face à un 3-bet'], ['4b', 'Face à un 4-bet ou plus'], ['faceai', 'Face à un tapis'], ['walk', 'Aucune décision (walk)']], tags: x => x.pfsit },
  { id: 'vpip', cat: 'act', st: [0], g: 'Opportunités', lab: 'A mis de l\'argent volontairement (VPIP)', opts: [['y', 'Oui'], ['n', 'Non']], tags: x => [x.vpip] },
  { id: 'pfr', cat: 'act', st: [0], g: 'Opportunités', lab: 'A relancé préflop (PFR)', opts: [['y', 'Oui'], ['n', 'Non']], tags: x => [x.pfr] },
  { id: 'pf1', cat: 'act', st: [0], g: 'Séquence', lab: 'Première action préflop', opts: [['f', 'Fold'], ['x', 'Check'], ['limp', 'Limp'], ['call', 'Call'], ['raise', 'Relance'], ['shove', 'Tapis'], ['rs', 'Relance ou tapis']], tags: x => x.pf1 },
  { id: 'pf2', cat: 'act', st: [0], g: 'Séquence', lab: 'Deuxième action préflop', opts: [['f', 'Fold'], ['call', 'Call'], ['raise', 'Relance'], ['shove', 'Tapis'], ['rs', 'Relance ou tapis']], tags: x => x.pf2 },
  { id: 'pn', cat: 'act', st: [1, 2, 3], g: 'Actions', lab: 'Action du héros', opts: [['cbet', 'C-bet'], ['nocbet', 'Pas de c-bet (check en tant qu\'agresseur)'], ['donk', 'Donk bet'], ['bet', 'Mise'], ['cr', 'Check-raise'], ['cc', 'Check-call'], ['cf', 'Check-fold'], ['xx', 'Check, personne ne mise'], ['bf', 'Mise puis fold'], ['bc', 'Mise puis call'], ['b3', 'Mise puis relance'], ['raise', 'Relance'], ['call', 'Call'], ['fold', 'Fold face à une mise'], ['fcb', 'Fold face au c-bet'], ['ccb', 'Call du c-bet'], ['rcb', 'Relance du c-bet'], ['ai', 'Tapis sur cette street']], tags: (x, s) => x.st[s] ? x.st[s].T : [] },
  { id: 'po', cat: 'act', st: [1, 2, 3], g: 'Opportunités', lab: 'Opportunités', opts: [['first', 'Personne n\'a misé avant lui'], ['cbopp', 'Pouvait faire un c-bet'], ['facecb', 'Face à un c-bet'], ['facebet', 'Face à une mise'], ['facer', 'Relancé après avoir misé']], tags: (x, s) => x.st[s] ? x.st[s].O : [] },
  { id: 'pp', cat: 'act', st: [1, 2, 3], g: 'Opportunités', lab: 'Position', opts: [['ip', 'En position (parle en dernier)'], ['oop', 'Hors de position']], tags: (x, s) => x.st[s] ? x.st[s].pos : [] },
  { id: 'p1', cat: 'act', st: [1, 2, 3], g: 'Séquence', lab: 'Première action', opts: [['x', 'Check'], ['b', 'Mise'], ['c', 'Call'], ['r', 'Relance'], ['f', 'Fold']], tags: (x, s) => x.st[s] ? x.st[s].f1 : [] },
  { id: 'p2', cat: 'act', st: [1, 2, 3], g: 'Séquence', lab: 'Deuxième action', opts: [['f', 'Fold'], ['c', 'Call'], ['r', 'Relance']], tags: (x, s) => x.st[s] ? x.st[s].f2 : [] }
];
const HF_BY = {}; for (const d of HF_DEFS) HF_BY[d.id] = d;
const HF_PRESETS = [
  ['C-bets au flop', [{ k: 'pn@1', sel: ['cbet'] }]], ['Check-raise à la turn', [{ k: 'pn@2', sel: ['cr'] }]], ['Fold face au c-bet flop', [{ k: 'pn@1', sel: ['fcb'] }]],
  ['Open-shove', [{ k: 'pfn@0', sel: ['openshove'] }]], ['Call d\'un tapis préflop', [{ k: 'pfn@0', sel: ['callshove'] }]], ['Top pair ou mieux au flop', [{ k: 'made@1', sel: ['toppair', 'overpair', 'twoplus'] }]]
];
function hfSplit(k) { const [id, s] = k.split('@'); return [HF_BY[id], s == null ? null : +s]; }
function hfTest(h, it) {
  const [d, s] = hfSplit(it.k); if (!d) return true;
  const x = hfFacts(h); let ok;
  if (d.type === 'range') { const v = d.val(x); ok = v != null && isFinite(v) && (it.min == null || v >= it.min) && (it.max == null || v <= it.max); }
  else if (d.type === 'bool') ok = d.live ? d.live(h) : d.tags(x, s).length > 0;
  else if (d.type === 'grid') { const v = d.val(x); ok = !!v && it.sel.includes(v); }
  else { const t = d.tags(x, s); ok = it.sel.some(v => t.includes(v)); }
  return it.not ? !ok : ok;
}
function hfMatch(h, items) { for (const it of items) if (!hfTest(h, it)) return false; return true; }
function hfCombos(k) { return k.length === 2 ? 6 : k[2] === 's' ? 4 : 12; }
function hfDesc(it) {
  const [d, s] = hfSplit(it.k); if (!d) return '?';
  let t = (s != null ? HF_SN[s] + ' · ' : '') + d.lab;
  if (d.type === 'range') t += it.min != null && it.max != null ? ' : de ' + fmtN(it.min, 1) + ' à ' + fmtN(it.max, 1) : it.min != null ? ' : au moins ' + fmtN(it.min, 1) : ' : au plus ' + fmtN(it.max, 1);
  else if (d.type === 'grid') { const c = it.sel.reduce((a, k) => a + hfCombos(k), 0); t += ' : ' + (it.sel.length <= 8 ? it.sel.join(', ') : it.sel.slice(0, 6).join(', ') + '… (' + it.sel.length + ' mains, ' + fmtN(c / 1326 * 100, 1) + ' %)'); }
  else if (d.type !== 'bool') t += ' : ' + it.sel.map(v => (d.opts.find(o => o[0] === v) || [v, v])[1]).join(' ou ');
  return t;
}
function hfOn(it) { const [d] = hfSplit(it.k); return d.type === 'range' ? it.min != null || it.max != null : d.type === 'bool' ? !!it.on : it.sel && it.sel.length > 0; }

// ---------- the filter window ----------
const HFM = { on: false, view: 'list', items: [], cat: 'act', st: { val: 1, brd: 1, act: 1 }, add: {}, paint: null, name: '' };
function hfBase() { return F.H.filter(x => x.hero); }
function hfOpen() { Object.assign(HFM, { on: true, view: 'list', items: JSON.parse(JSON.stringify(S.ui.rv.hf || [])), add: {}, name: '' }); hfRender(); }
function hfClose() { HFM.on = false; $('#modalRoot').innerHTML = ''; }
function hfCount(items) { const b = hfBase(); let n = 0; for (const h of b) if (hfMatch(h, items)) n++; return [n, b.length]; }
function hfRender() {
  if (!HFM.on) return;
  const body = HFM.view === 'list' ? hfListHtml() : hfAddHtml();
  $('#modalRoot').innerHTML = '<div class="modal-bg" data-hf="bg"><div class="fm hfm" role="dialog" aria-modal="true" aria-label="Filtres de mains">' +
    '<div class="hf-head"><b>Filtres de mains</b><span class="note">Review · mains du héros</span><button class="fm-x" data-hf="close" aria-label="Fermer">✕</button></div>' + body + '</div></div>';
}
function hfListHtml() {
  const [n, tot] = hfCount(HFM.items), q = S.prefs.hfq || [];
  return '<div class="hf-bar"><button class="btn" data-hf="close">Annuler</button><div class="grow"></div><span class="note"><b>' + fmtN(n) + '</b> mains sur ' + fmtN(tot) + '</span><button class="btn primary" data-hf="apply">Appliquer les filtres</button></div>' +
    '<div class="hf-box"><div class="hf-boxh"><span>Filtres actifs</span><button class="btn small" data-hf="toadd">Ajouter un filtre ›</button></div>' +
    (HFM.items.length ? HFM.items.map((it, i) => '<div class="hf-row' + (it.not ? ' not' : '') + '"><button class="hf-not' + (it.not ? ' on' : '') + '" data-hf="not" data-i="' + i + '" aria-pressed="' + !!it.not + '" title="Inverser : garder les mains qui NE correspondent PAS">NON</button><span>' + esc(hfDesc(it)) + '</span><button class="hf-del" data-hf="del" data-i="' + i + '" aria-label="Retirer ce filtre">✕</button></div>').join('')
      : '<div class="hf-empty">Aucun filtre : toutes les mains sont gardées. Clique sur « Ajouter un filtre ».</div>') +
    '<p class="note hf-tip">Les filtres s\'additionnent : une main doit les remplir tous. Dans une liste d\'options, une seule suffit. « NON » garde les mains qui ne remplissent pas le filtre.</p></div>' +
    '<div class="hf-q"><h4>Filtres rapides</h4><div class="hf-chips">' + q.map((f, i) => '<span class="hf-chip"><button data-hf="qload" data-i="' + i + '">' + esc(f.n) + '</button><button class="x" data-hf="qdel" data-i="' + i + '" aria-label="Supprimer ' + esc(f.n) + '">✕</button></span>').join('') +
    HF_PRESETS.map(([l], i) => '<span class="hf-chip ex"><button data-hf="pload" data-i="' + i + '">' + esc(l) + '</button></span>').join('') + '</div>' +
    '<div class="hf-save"><input type="text" id="hfName" placeholder="Nom du filtre" value="' + esc(HFM.name) + '" aria-label="Nom du filtre rapide"><button class="btn small" data-hf="qsave"' + (HFM.items.length ? '' : ' disabled') + '>Enregistrer comme filtre rapide</button><div class="grow"></div><button class="btn small" data-hf="clear" style="border:0;background:none;color:var(--muted)"' + (HFM.items.length ? '' : ' disabled') + '>Tout effacer</button></div></div>';
}
function hfDraft(k) { let it = HFM.add[k]; if (!it) { const [d] = hfSplit(k); it = HFM.add[k] = d.type === 'range' ? { k, min: null, max: null } : d.type === 'bool' ? { k, on: false } : { k, sel: [] }; } return it; }
function hfItemHtml(d, s) {
  const k = d.id + (s != null ? '@' + s : ''), it = HFM.add[k] || hfDraft(k), on = hfOn(it);
  const sw = '<button class="hf-sw' + (on ? ' on' : '') + '" role="switch" aria-checked="' + on + '" data-hf="sw" data-k="' + k + '" aria-label="' + esc(d.lab) + '"><i></i>' + (on ? 'ON' : 'OFF') + '</button>';
  let o = '<div class="hf-item' + (on ? ' on' : '') + '" data-item="' + k + '"><div class="hf-ih"><span>' + esc(d.lab) + '</span>' + sw + '</div>';
  if (d.type === 'range') o += '<div class="hf-range">entre <input type="number" step="0.5" data-hfin="' + k + ':min" value="' + (it.min ?? '') + '" placeholder="min" aria-label="Minimum"> et <input type="number" step="0.5" data-hfin="' + k + ':max" value="' + (it.max ?? '') + '" placeholder="max" aria-label="Maximum"></div>';
  else if (d.type === 'grid') o += hfGridHtml(it);
  else if (d.type !== 'bool') o += '<div class="hf-opts' + (d.chips ? ' chips' : '') + '">' + d.opts.map(([v, l]) => '<button class="hf-opt' + (it.sel.includes(v) ? ' sel' : '') + '" data-hf="opt" data-k="' + k + '" data-v="' + esc(v) + '" aria-pressed="' + it.sel.includes(v) + '">' + esc(l) + '</button>').join('') + '</div>';
  return o + '</div>';
}
function hfGridHtml(it) {
  const R = [...RK].reverse(); let g = '<div class="hf-grid" role="grid" aria-label="Sélection de mains">';
  for (let i = 0; i < 13; i++) for (let j = 0; j < 13; j++) {
    const key = i === j ? R[i] + R[i] : i < j ? R[i] + R[j] + 's' : R[j] + R[i] + 'o';
    g += '<button class="hf-cell ' + (i === j ? 'pp' : i < j ? 'su' : 'of') + (it.sel.includes(key) ? ' sel' : '') + '" data-cell="' + key + '" data-k="' + it.k + '">' + key + '</button>';
  }
  const c = it.sel.reduce((a, k) => a + hfCombos(k), 0);
  return g + '</div><div class="hf-gq"><button class="btn small" data-hf="gq" data-q="pp" data-k="' + it.k + '">Paires</button><button class="btn small" data-hf="gq" data-q="su" data-k="' + it.k + '">Assorties</button><button class="btn small" data-hf="gq" data-q="bw" data-k="' + it.k + '">Broadways</button><button class="btn small" data-hf="gq" data-q="ax" data-k="' + it.k + '">As-x</button><button class="btn small" data-hf="gq" data-q="clr" data-k="' + it.k + '">Effacer</button><span class="note" id="hfGc">' + it.sel.length + ' mains · ' + fmtN(c / 1326 * 100, 1) + ' % des combos</span></div>';
}
function hfAddHtml() {
  const cat = HFM.cat, title = HF_CATS.find(c => c[0] === cat)[1];
  const defs = HF_DEFS.filter(d => d.cat === cat);
  const sts = [...new Set(defs.flatMap(d => d.st || []))].sort();
  let s = sts.length ? HFM.st[cat] : null; if (s != null && !sts.includes(s)) s = HFM.st[cat] = sts[0];
  const nOn = Object.values(HFM.add).filter(hfOn).length;
  let groups = '', gl = null;
  for (const d of defs) {
    if (d.st && !d.st.includes(s)) continue;
    if (d.g !== gl) { if (gl != null) groups += '</div>'; groups += '<h4>' + esc(d.g) + '</h4><div class="hf-group">'; gl = d.g; }
    groups += hfItemHtml(d, d.st ? s : null);
  }
  if (gl != null) groups += '</div>';
  return '<div class="hf-add"><nav class="hf-cats" aria-label="Catégories">' + HF_CATS.map(([k, l, ic]) => '<button class="' + (k === cat ? 'on' : '') + '" data-hf="cat" data-c="' + k + '"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ic + '</svg>' + l + '</button>').join('') + '</nav>' +
    '<section class="hf-pane"><div class="hf-bar"><button class="btn" data-hf="back">‹ Retour</button><div class="grow"></div><button class="btn primary" data-hf="addok"' + (nOn ? '' : ' disabled') + '>Ajouter au filtre' + (nOn ? ' (' + nOn + ')' : '') + '</button></div>' +
    '<h3>' + title + '</h3>' + (sts.length > 1 ? '<div class="seg hf-st">' + sts.map(x => '<button class="' + (x === s ? 'on' : '') + '" data-hf="st" data-s="' + x + '">' + HF_SN[x] + '</button>').join('') + '</div>' : '') +
    '<div class="hf-list">' + groups + '</div></section></div>';
}
function hfRefreshAddBtn() { const b = $('.hfm [data-hf="addok"]'); if (!b) return; const n = Object.values(HFM.add).filter(hfOn).length; b.disabled = !n; b.textContent = 'Ajouter au filtre' + (n ? ' (' + n + ')' : ''); }
function hfSyncItem(k) { // update one item's switch in place (keeps focus in inputs)
  const el = document.querySelector('.hf-item[data-item="' + k + '"]'); if (!el) return;
  const on = hfOn(HFM.add[k]); el.classList.toggle('on', on);
  const sw = el.querySelector('.hf-sw'); sw.classList.toggle('on', on); sw.setAttribute('aria-checked', on); sw.innerHTML = '<i></i>' + (on ? 'ON' : 'OFF');
  if (HFM.add[k].sel && el.querySelector('#hfGc')) { const it = HFM.add[k]; $('#hfGc').textContent = it.sel.length + ' mains · ' + fmtN(it.sel.reduce((a, x) => a + hfCombos(x), 0) / 1326 * 100, 1) + ' % des combos'; }
  hfRefreshAddBtn();
}
function hfApply(items) { S.ui.rv.hf = items; S.ui.rv.page = 0; render(); }
document.addEventListener('click', (e) => {
  const op = e.target.closest('[data-hfopen]'); if (op) { e.stopPropagation(); hfOpen(); return; }
  const rm = e.target.closest('[data-hfrm]'); if (rm) { e.stopPropagation(); const a = (S.ui.rv.hf || []).slice(); if (rm.dataset.hfrm === 'all') a.length = 0; else a.splice(+rm.dataset.hfrm, 1); hfApply(a); return; }
  if (!HFM.on) return;
  if (!$('.hfm')) { HFM.on = false; return; }
  e.stopPropagation();
  if (e.target.closest('[data-cell]')) return; // handled on mousedown
  const t = e.target.closest('[data-hf]'); if (!t) return;
  const d = t.dataset, a = d.hf;
  if (a === 'bg') { if (e.target === t) hfClose(); return; }
  if (a === 'close') return hfClose();
  if (a === 'apply') { hfClose(); hfApply(HFM.items); return; }
  if (a === 'toadd') { HFM.view = 'add'; HFM.add = {}; }
  else if (a === 'back') HFM.view = 'list';
  else if (a === 'cat') HFM.cat = d.c;
  else if (a === 'st') HFM.st[HFM.cat] = +d.s;
  else if (a === 'not') HFM.items[+d.i].not = !HFM.items[+d.i].not;
  else if (a === 'del') HFM.items.splice(+d.i, 1);
  else if (a === 'clear') HFM.items = [];
  else if (a === 'qload') HFM.items = JSON.parse(JSON.stringify(S.prefs.hfq[+d.i].items));
  else if (a === 'pload') HFM.items = JSON.parse(JSON.stringify(HF_PRESETS[+d.i][1]));
  else if (a === 'qdel') { S.prefs.hfq.splice(+d.i, 1); savePrefs(); }
  else if (a === 'qsave') { const n = ($('#hfName').value || '').trim() || 'Filtre ' + (S.prefs.hfq.length + 1); S.prefs.hfq = (S.prefs.hfq || []).filter(f => f.n !== n); S.prefs.hfq.push({ n, items: JSON.parse(JSON.stringify(HFM.items)) }); savePrefs(); HFM.name = ''; toast('Filtre rapide « ' + n + ' » enregistré'); }
  else if (a === 'sw') { const it = hfDraft(d.k), [df] = hfSplit(d.k); if (hfOn(it)) { if (df.type === 'range') it.min = it.max = null; else if (df.type === 'bool') it.on = false; else it.sel = []; } else { if (df.type === 'bool') it.on = true; else if (df.type === 'range') { const i = document.querySelector('[data-hfin="' + d.k + ':min"]'); if (i) i.focus(); return; } else if (df.type === 'grid') return; else it.sel = [df.opts[0][0]]; } }
  else if (a === 'opt') { const it = hfDraft(d.k), i = it.sel.indexOf(d.v); if (i >= 0) it.sel.splice(i, 1); else it.sel.push(d.v); }
  else if (a === 'gq') { const it = hfDraft(d.k), R = [...RK].reverse(), all = []; for (let i = 0; i < 13; i++) for (let j = 0; j < 13; j++) all.push(i === j ? R[i] + R[i] : i < j ? R[i] + R[j] + 's' : R[j] + R[i] + 'o');
    const pick = { pp: (k) => k.length === 2, su: (k) => k[2] === 's', bw: (k) => RK.indexOf(k[0]) >= 8 && RK.indexOf(k[1]) >= 8, ax: (k) => k[0] === 'A' && k[1] !== 'A' }[d.q];
    if (!pick) it.sel = []; else { const add = all.filter(pick); it.sel = [...new Set(it.sel.concat(add))]; } }
  else if (a === 'addok') {
    for (const it of Object.values(HFM.add)) if (hfOn(it)) { const c = JSON.parse(JSON.stringify(it)); delete c.on; const j = HFM.items.findIndex(x => x.k === c.k); if (j >= 0) HFM.items[j] = c; else HFM.items.push(c); }
    HFM.view = 'list'; HFM.add = {};
  }
  const sc = $('.hfm .hf-list'), top = sc ? sc.scrollTop : 0;
  hfRender();
  const sc2 = $('.hfm .hf-list'); if (sc2) sc2.scrollTop = top;
}, true);
// range grid: click or drag to paint
document.addEventListener('mousedown', (e) => {
  const c = HFM.on && e.target.closest('[data-cell]'); if (!c) return;
  e.preventDefault(); const it = hfDraft(c.dataset.k); HFM.paint = !it.sel.includes(c.dataset.cell); hfPaint(c);
});
document.addEventListener('mouseover', (e) => { if (HFM.paint == null || !(e.buttons & 1)) return; const c = e.target.closest('[data-cell]'); if (c) hfPaint(c); });
document.addEventListener('mouseup', () => { HFM.paint = null; });
function hfPaint(c) {
  const it = hfDraft(c.dataset.k), k = c.dataset.cell, i = it.sel.indexOf(k);
  if (HFM.paint && i < 0) it.sel.push(k); else if (!HFM.paint && i >= 0) it.sel.splice(i, 1);
  c.classList.toggle('sel', HFM.paint); hfSyncItem(c.dataset.k);
}
document.addEventListener('input', (e) => {
  const t = e.target; if (!HFM.on) return;
  if (t.id === 'hfName') { HFM.name = t.value; return; }
  if (!t.dataset.hfin) return;
  const [k, w] = t.dataset.hfin.split(':'), it = hfDraft(k), v = t.value === '' ? null : +t.value;
  it[w] = v != null && isFinite(v) ? v : null; hfSyncItem(k);
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && HFM.on) HFM.on = false; }, true);
// chips under the Review bar
function hfBarHtml() {
  const a = S.ui.rv.hf || []; if (!a.length) return '';
  return '<div class="hf-active">' + a.map((it, i) => '<span class="hf-chip on"><button data-hfopen="1">' + esc(hfDesc(it)) + '</button><button class="x" data-hfrm="' + i + '" aria-label="Retirer ce filtre">✕</button></span>').join('') + '<button class="lnk" data-hfrm="all">Tout effacer</button></div>';
}
