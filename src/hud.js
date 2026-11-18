// ---------- PT4-style HUDs (Leak Finder): heads-up and 3-way, with your own reference values ----------
const HUD_BK = ['14+', '8-14', '0-8'];
const hudBk = (bb) => bb >= 14 ? 0 : bb >= 8 ? 1 : 2;
// stat -> [header label, header colour class, long name, explanation]
const HUD_ST = {
  VPIP: ['VPiP', 'hw', 'VPIP', 'Tu mets de l\'argent volontairement (limp, call ou relance) quand c\'est à toi d\'ouvrir.'],
  LIMP: ['LiMP', 'hc', 'Limp', 'Tu complètes la blinde (limp) en premier à parler.'],
  LF: ['L/F', 'hc', 'Limp / fold', 'Tu as limpé, l\'adversaire relance (ou fait tapis) et tu foldes.'],
  O: ['O', 'ho', 'Open raise', 'Tu relances (hors tapis) en premier à parler.'],
  OS: ['OS', 'ho', 'Open shove', 'Tu fais tapis en premier à parler (ou une relance qui couvre tout le monde).'],
  OFAI: ['O/FvAi', 'ho', 'Open puis fold face au tapis', 'Tu as fait open raise, un adversaire fait tapis derrière et tu foldes.'],
  ISO: ['ISO', 'hp', 'Iso raise', 'Face au limp, tu relances (hors tapis).'],
  ISOAI: ['ISOAI', 'hp', 'Iso tapis', 'Face au limp, tu fais tapis.'],
  FVO: ['FvO', 'ho', 'Fold face à l\'open', 'Face à une open raise (hors tapis), tu foldes.'],
  '3B': ['3B', 'ho', '3-bet', 'Face à une open raise (hors tapis), tu relances (tapis compris).'],
  FVOS: ['FvOS', 'ho', 'Fold face à l\'open shove', 'Face à un tapis d\'ouverture, tu foldes.']
};
const HUD_BOX = {
  hu: [
    { id: 'hu.SB', t: 'SB', c: 'hr', d: 'SB (bouton) en heads-up, premier à parler', s: ['VPIP', 'LIMP', 'LF', 'O', 'OS'] },
    { id: 'hu.BB', t: 'BB', c: 'hb', d: 'BB en heads-up, face à la SB', s: ['ISO', 'ISOAI', 'FVO', '3B', 'FVOS'] }
  ],
  '3': [
    { id: '3.BvS', t: 'BvS', c: 'hb', d: 'BB face à la SB, le bouton a foldé', s: ['ISO', 'ISOAI', 'FVO', '3B', 'FVOS'] },
    { id: '3.SvB', t: 'SvB', c: 'hr', d: 'SB face à la BB, le bouton a foldé', s: ['VPIP', 'LIMP', 'LF', 'O', 'OS'] },
    { id: '3.BU', t: 'BU', c: 'hy', d: 'Bouton à 3 joueurs, premier à parler', s: ['O', 'OS', 'OFAI'], top: 'LIMP' },
    { id: '3.BvBU', t: 'BvBU', c: 'hb', d: 'BB face à l\'open raise du bouton, la SB a foldé', s: ['3B'] },
    { id: '3.SvBU', t: 'SvBU', c: 'hr', d: 'SB face à l\'open raise du bouton', s: ['3B'] }
  ]
};
const HUD_COLS = [['FL', 'F', 'hc', 'flop, pot limpé'], ['FR', 'F', 'ho', 'flop, pot relancé'], ['T', 'T', 'hg', 'turn'], ['R', 'R', 'hg', 'river']];
const HUD_POST = [
  ['CB', 'CB', 'C-bet', 'Tu étais l\'agresseur de la street d\'avant et tu mises quand personne n\'a misé avant toi. En pot limpé, l\'« agresseur » est le joueur qui parle en dernier.'],
  ['FVR', 'FvR', 'Fold face à une relance', 'Tu as misé, on te relance et tu foldes.'],
  ['XF', 'X/F', 'Check / fold', 'Tu checkes, quelqu\'un mise et tu foldes.'],
  ['FVPROBE', 'FvPROBE', 'Fold face à une probe', 'Tu étais l\'agresseur, la street d\'avant a été checkée, on mise devant toi et tu foldes (turn, river).'],
  ['FVCB', 'FvCB', 'Fold face au c-bet', 'L\'agresseur fait son c-bet et tu foldes.', 1],
  ['RVCB', 'RvCB', 'Relance face au c-bet', 'L\'agresseur fait son c-bet et tu relances.'],
  ['BVX', 'BvX', 'Mise après le check de l\'agresseur', 'L\'agresseur checke devant toi et tu mises.'],
  ['DK', 'Dk', 'Donk bet', 'Tu mises avant l\'agresseur, qui parle après toi.'],
  ['PROBE', 'PROBE', 'Probe', 'La street d\'avant a été checkée par tout le monde et tu mises avant l\'agresseur (turn, river).']
];

function hudPre(h, me, add) {
  if (h.acts.some(a => a.st === 0 && (a.a === 'sb' || a.a === 'bb') && a.ai)) return;
  const pos = {}, stack = {}; for (const p of h.players) { pos[p.name] = p.pos; stack[p.name] = p.stack; }
  if (!(me in pos)) return;
  const put = {}, out = {}, seq = [];
  for (const a of h.acts) {
    if (a.st !== 0) continue;
    if (a.a === 'ante' || a.a === 'sb' || a.a === 'bb') { put[a.p] = (put[a.p] || 0) + (a.add || 0); continue; }
    const after = (put[a.p] || 0) + (a.add || 0); let k;
    if (a.a === 'f') { k = 'fold'; out[a.p] = 1; }
    else if (a.a === 'x') k = 'check';
    else if (a.a === 'c') k = seq.some(x => x.k === 'raise' || x.k === 'shove') ? 'call' : 'limp';
    else if (a.a === 'r' || a.a === 'b') {
      let cover = true; for (const q in stack) if (q !== a.p && !out[q] && stack[q] > after) cover = false;
      k = (a.ai || after >= stack[a.p] || cover) ? 'shove' : 'raise';
    } else continue;
    put[a.p] = after; seq.push({ p: a.p, k });
  }
  const mine = seq.filter(x => x.p === me); if (!mine.length) return;
  const f = mine[0], P = pos[me], ix = (x) => seq.indexOf(x);
  const vol = (k) => k !== 'fold' && k !== 'check', ag = (k) => k === 'raise' || k === 'shove';
  const first = (role) => { const p = h.players.find(z => z.pos === role); return p ? seq.find(x => x.p === p.name) : null; };
  const sbSide = (box) => {
    add(box + 'VPIP', vol(f.k)); add(box + 'LIMP', f.k === 'limp'); add(box + 'O', f.k === 'raise'); add(box + 'OS', f.k === 'shove');
    if (f.k === 'limp') { const r = seq.slice(ix(f) + 1).find(x => x.p !== me); if (r && ag(r.k) && mine[1]) add(box + 'LF', mine[1].k === 'fold'); }
  };
  const bbSide = (box, o) => {
    if (!o || ix(o) > ix(f)) return;
    if (o.k === 'limp') { add(box + 'ISO', f.k === 'raise'); add(box + 'ISOAI', f.k === 'shove'); }
    else if (o.k === 'raise') { add(box + 'FVO', f.k === 'fold'); add(box + '3B', ag(f.k)); }
    else if (o.k === 'shove') add(box + 'FVOS', f.k === 'fold');
  };
  if (h.n === 2) { if (P === 'SB') sbSide('hu.SB.'); else bbSide('hu.BB.', first('SB')); return; }
  const bA = first('BTN'), sA = first('SB');
  if (P === 'BTN') {
    add('3.BU.LIMP', f.k === 'limp'); add('3.BU.O', f.k === 'raise'); add('3.BU.OS', f.k === 'shove');
    if (f.k === 'raise') { const ai = seq.slice(ix(f) + 1).find(x => x.p !== me && x.k === 'shove'); if (ai && mine[1] && ix(mine[1]) > ix(ai)) add('3.BU.OFAI', mine[1].k === 'fold'); }
  } else if (P === 'SB') { if (bA && bA.k === 'fold') sbSide('3.SvB.'); else if (bA && bA.k === 'raise') add('3.SvBU.3B', ag(f.k)); }
  else if (P === 'BB') {
    if (bA && bA.k === 'fold' && sA && sA.k !== 'fold') bbSide('3.BvS.', sA);
    else if (bA && bA.k === 'raise' && sA && sA.k === 'fold') add('3.BvBU.3B', ag(f.k));
  }
}

function hudPost(h, me, g, add) {
  if (h.board.length < 3) return;
  const pre = h.acts.filter(a => a.st === 0);
  const folded = new Set(pre.filter(a => a.a === 'f').map(a => a.p)); if (folded.has(me)) return;
  const posOf = {}; for (const p of h.players) posOf[p.name] = p.pos;
  if (!(me in posOf)) return;
  let pfa = null; for (const a of pre) if (a.a === 'r' || a.a === 'b') pfa = a.p;
  const order = h.n === 2 ? ['BB', 'SB'] : ['SB', 'BB', 'BTN'];
  const alive = h.players.map(p => p.name).filter(n => !folded.has(n)).sort((a, b) => order.indexOf(posOf[a]) - order.indexOf(posOf[b]));
  const limped = !pfa; let A = limped ? alive[alive.length - 1] : pfa, L = A;
  for (let s = 1; s <= 3; s++) {
    const acts = h.acts.filter(a => a.st === s); if (!acts.length) break;
    const col = s === 1 ? (limped ? 'FL' : 'FR') : s === 2 ? 'T' : 'R', P = g + '.P.';
    let nB = 0, firstB = null, cbet = false, Achk = false, last = null;
    let myFirst = true, faced = false, iChk = false, myAggN = 0, facedR = false;
    const acted = new Set();
    for (const a of acts) {
      const agg = a.a === 'b' || a.a === 'r';
      if (a.p === me) {
        if (agg || a.a === 'c' || a.a === 'f') add(g + '.M.AF' + s, agg);
        if (myFirst && nB === 0) {
          const bet = a.a === 'b';
          if (A === me) add(P + 'CB.' + col, bet);
          else if (A && !folded.has(A) && !acted.has(A)) add(P + 'DK.' + col, bet);
          else if (A && Achk) add(P + 'BVX.' + col, bet);
          if (s >= 2 && !A && L && L !== me && !folded.has(L) && !acted.has(L)) add(P + 'PROBE.' + col, bet);
          if (a.a === 'x') iChk = true;
        }
        if (nB > 0 && !faced) {
          faced = true;
          if (nB === 1 && cbet && A !== me) { add(P + 'FVCB.' + col, a.a === 'f'); add(P + 'RVCB.' + col, a.a === 'r'); }
          if (nB === 1 && s >= 2 && !A && me === L && firstB !== me) add(P + 'FVPROBE.' + col, a.a === 'f');
          if (iChk) add(P + 'XF.' + col, a.a === 'f');
        }
        if (myAggN && nB > myAggN && !facedR) { facedR = true; add(P + 'FVR.' + col, a.a === 'f'); }
        myFirst = false;
      }
      if (agg) { nB++; if (nB === 1) { firstB = a.p; cbet = a.p === A; } last = a.p; if (a.p === me) myAggN = nB; }
      if (a.p === A && nB === 0 && a.a === 'x' && !acted.has(A)) Achk = true;
      if (a.a === 'f') folded.add(a.p);
      acted.add(a.p);
    }
    if (folded.has(me)) break;
    A = last; if (last) L = last;
  }
}

function hudCompute(hs, pick) {
  const M = new Map(), X = { hu: { n: 0, ev: 0, t: new Set() }, '3': { n: 0, ev: 0, t: new Set() } };
  const put = (k, hit, h) => { let r = M.get(k); if (!r) M.set(k, r = { o: 0, x: 0, hs: [] }); r.o++; if (hit) r.x++; r.hs.push(h); };
  for (const h of hs) {
    if (h.n !== 2 && h.n !== 3) continue;
    const g = h.n === 2 ? 'hu' : '3';
    for (const me of pick(h)) {
      const I = h.pf[me]; if (!I) continue;
      X[g].n++; X[g].ev += EVc(h, me); X[g].t.add(h.gid);
      if (I.decisions.length) { put(g + '.M.VPIP', I.vpip, h); put(g + '.M.PFR', I.pfr, h); }
      const b = hudBk(E.effStackBB(h, me));
      hudPre(h, me, (k, hit) => { put(k + '.' + b, hit, h); put(k + '.a', hit, h); });
      hudPost(h, me, g, (k, hit) => put(k, hit, h));
    }
  }
  return { M, X };
}
// population reference (regs or fish of the whole base), cached
let HUD_POP = { key: '', M: null };
function hudPop(src) {
  if (src !== 'reg' && src !== 'fish') return null;
  const key = src + '|' + S.hands.length + '|' + JSON.stringify(S.prefs.cls) + '|' + JSON.stringify(S.prefs.overrides);
  if (HUD_POP.key !== key) HUD_POP = { key, M: hudCompute(S.hands, (h) => h.opps.filter(o => tagOf(o) === src)).M };
  return HUD_POP.M;
}
function hudRef(key, R) {
  const c = S.prefs.hudRefs[key], t = c && c.t != null ? c.t : S.prefs.hudTol;
  if (c && c.v != null) return { v: c.v, t, src: 'Ta référence' };
  if (R) { const r = R.get(key); if (r && r.o >= 30) return { v: r.x / r.o * 100, t, src: (S.ui.lf.hudSrc === 'fish' ? 'Fish' : 'Regs') + ' de ta base (' + fmtN(r.o) + ' occasions)', n: r.o }; }
  return null;
}
function hudEval(key, D, R) {
  const r = D.M.get(key); if (!r || !r.o) return null;
  const v = r.x / r.o * 100, ref = hudRef(key, R);
  let c = 'nr', d = null;
  if (r.o < S.prefs.hudMin) c = 'few';
  else if (ref) { d = v - ref.v; c = Math.abs(d) <= ref.t ? 'ok' : d > 0 ? (d > 2 * ref.t ? 'hi2' : 'hi') : (d < -2 * ref.t ? 'lo2' : 'lo'); }
  return { r, v, ref, c, d };
}
function hudLabel(key) {
  const p = key.split('.');
  if (p[1] === 'M') return (p[0] === 'hu' ? 'Heads-up' : '3 joueurs') + ' · ' + (p[2] === 'VPIP' ? 'VPIP' : p[2] === 'PFR' ? 'PFR' : 'Fréquence d\'agression ' + ['', 'flop', 'turn', 'river'][+p[2].slice(2)]);
  if (p[1] === 'P') { const s = HUD_POST.find(x => x[0] === p[2]); return (p[0] === 'hu' ? 'Heads-up' : '3 joueurs') + ' · ' + s[2] + ' · ' + HUD_COLS.find(c => c[0] === p[3])[3]; }
  const box = HUD_BOX[p[0]].find(b => b.id === p[0] + '.' + p[1]);
  return box.t + ' · ' + HUD_ST[p[2]][2] + ' · ' + (p[3] === 'a' ? 'tous stacks' : HUD_BK[+p[3]] + ' bb');
}
function hudDesc(key) {
  const p = key.split('.');
  if (p[1] === 'M') return p[2] === 'VPIP' ? 'Part des mains où tu mets de l\'argent volontairement préflop.' : p[2] === 'PFR' ? 'Part des mains où tu relances préflop (tapis compris).' : '(mises + relances) / (mises + relances + calls + folds) sur cette street.';
  if (p[1] === 'P') return HUD_POST.find(x => x[0] === p[2])[3];
  const box = HUD_BOX[p[0]].find(b => b.id === p[0] + '.' + p[1]);
  return box.d + '. ' + HUD_ST[p[2]][3] + (p[3] !== 'a' ? ' Stack effectif ' + HUD_BK[+p[3]] + ' bb au début de la main.' : '');
}
function hudTd(key, D, R, extra) {
  const e = hudEval(key, D, R);
  if (!e) return '<td class="hv na"' + (extra || '') + '>-</td>';
  const tip = hudLabel(key) + '\n' + fmtN(e.r.x) + ' / ' + fmtN(e.r.o) + ' = ' + fmtP(e.v, 1) + (e.ref ? '\nRéférence ' + fmtP(e.ref.v, 0) + ' ± ' + e.ref.t + ' (' + e.ref.src + ')' : '\nPas de référence') + '\nClic : détail, référence, replayer';
  return '<td class="hv ' + e.c + (S.prefs.hudRefs[key] ? ' mine' : '') + '" data-hud="' + key + '" title="' + esc(tip) + '"' + (extra || '') + '>' + Math.round(e.v) + '</td>';
}
function hudBoxHtml(b, D, R) {
  let h = '<table class="hud-box">';
  if (b.top) h += '<tr><td class="hl blank"></td><th class="' + HUD_ST[b.top][1] + '">' + HUD_ST[b.top][0] + '</th>' + hudTd(b.id + '.' + b.top + '.a', D, R) + '<td colspan="' + (b.s.length - 2) + '" class="blank"></td></tr>';
  h += '<tr><th class="' + b.c + '" title="' + esc(b.d) + '">' + b.t + '</th>' + b.s.map(s => '<th class="' + HUD_ST[s][1] + '" title="' + esc(HUD_ST[s][2] + ' : ' + HUD_ST[s][3]) + '">' + HUD_ST[s][0] + '</th>').join('') + '</tr>';
  for (let i = 0; i < 3; i++) h += '<tr><td class="hl">' + HUD_BK[i] + '</td>' + b.s.map(s => hudTd(b.id + '.' + s + '.' + i, D, R)).join('') + '</tr>';
  return h + '</table>';
}
function hudMainHtml(g, D, R, label) {
  const X = D.X[g];
  return '<table class="hud-box hud-main"><tr><td class="nm" colspan="3">' + esc(label) + '</td><td class="cnt" title="Mains ' + (g === 'hu' ? 'en heads-up' : 'à 3 joueurs') + '">' + fmtN(X.n) + '</td></tr>' +
    '<tr><th>VPiP</th>' + hudTd(g + '.M.VPIP', D, R) + '<th>PFR</th>' + hudTd(g + '.M.PFR', D, R) + '</tr>' +
    '<tr><th title="Fréquence d\'agression flop / turn / river">AF' + (g === 'hu' ? '.hu' : '') + '</th>' + [1, 2, 3].map(s => hudTd(g + '.M.AF' + s, D, R)).join('') + '</tr>' +
    '<tr><th>cEV' + (g === 'hu' ? '.hu' : '') + '</th><td colspan="3" class="cev ' + cls(X.ev) + '" title="Chips EV cumulés sur ces mains (' + fmtS(X.n ? X.ev / X.n : NaN, 1) + ' par main)">' + fmtS(X.ev) + '</td></tr></table>';
}
function hudPostHtml(g, D, R) {
  let h = '<table class="hud-box hud-post"><tr><th class="hg">POST-F</th>' + HUD_COLS.map(c => '<th class="' + c[2] + '" title="' + esc(c[3]) + '">' + c[1] + '</th>').join('') + '</tr>';
  for (const r of HUD_POST) {
    h += '<tr' + (r[4] ? ' class="sep"' : '') + '><td class="hl" title="' + esc(r[2] + ' : ' + r[3]) + '">' + r[1] + '</td>' + HUD_COLS.map(c => (c[0] === 'FL' || c[0] === 'FR') && /PROBE/.test(r[0]) ? '<td class="hv na">-</td>' : hudTd(g + '.P.' + r[0] + '.' + c[0], D, R)).join('') + '</tr>';
  }
  return h + '</table>';
}
function hudKeys(g) {
  const k = [g + '.M.VPIP', g + '.M.PFR', g + '.M.AF1', g + '.M.AF2', g + '.M.AF3'];
  for (const b of HUD_BOX[g]) { if (b.top) k.push(b.id + '.' + b.top + '.a'); for (const s of b.s) for (let i = 0; i < 3; i++) k.push(b.id + '.' + s + '.' + i); }
  for (const r of HUD_POST) for (const c of HUD_COLS) if (!(/PROBE/.test(r[0]) && c[0][0] === 'F')) k.push(g + '.P.' + r[0] + '.' + c[0]);
  return k;
}
// results are cached: switching tab or HUD reuses them, and they are prepared in the background after loading
let HUD_C = { key: '', F: null, D: null };
const hudKey = () => S.ui.lf.prof + '|' + S.ui.lf.who + '|' + S.hands.length + '|' + JSON.stringify(S.prefs.cls) + '|' + JSON.stringify(S.prefs.overrides);
function hudData() {
  const k = hudKey(), byF = S.ui.lf.prof === 'hero';
  if (HUD_C.key === k && (!byF || HUD_C.F === F)) return HUD_C.D;
  const P = lfProfileHands(); HUD_C = { key: k, F, D: hudCompute(P.hs, P.pick) }; return HUD_C.D;
}
let hudWarmT = null;
function hudWarm() {
  clearTimeout(hudWarmT);
  hudWarmT = setTimeout(() => {
    const idle = window.requestIdleCallback || ((f) => setTimeout(f, 1));
    idle(() => { if (S.hands.length && S.ui.lf.prof === 'hero') hudData(); idle(() => { if (S.hands.length) hudPop(S.ui.lf.hudSrc); }); });
  }, 400);
}
function viewHud(g) {
  const u = S.ui.lf, P = lfProfileHands();
  const D = hudData(), R = hudPop(u.hudSrc), label = u.prof === 'hero' ? (S.hero || 'Hero') : P.label;
  S.hudCur = { D, R };
  const nMine = Object.keys(S.prefs.hudRefs).filter(k => k.startsWith(g + '.')).length;
  let h = '<div class="bar hud-bar"><label class="f" for="hudSrc">Sans référence perso, comparer aux<select id="hudSrc"><option value="reg"' + (u.hudSrc === 'reg' ? ' selected' : '') + '>Regs de ta base</option><option value="fish"' + (u.hudSrc === 'fish' ? ' selected' : '') + '>Fish de ta base</option><option value="none"' + (u.hudSrc === 'none' ? ' selected' : '') + '>Rien (seulement tes références)</option></select></label>' +
    '<label class="f" for="hudTol">Écart toléré (± pts)<input type="number" id="hudTol" min="1" max="50" step="1" value="' + S.prefs.hudTol + '"></label>' +
    '<label class="f" for="hudMin">Échantillon mini<input type="number" id="hudMin" min="1" max="500" step="1" value="' + S.prefs.hudMin + '"></label>' +
    '<div class="grow"></div><button class="btn small" data-hudact="copy" title="Fixe tes références sur les valeurs actuelles des ' + (u.hudSrc === 'fish' ? 'fish' : 'regs') + ' de ta base, pour les ajuster ensuite">Copier les ' + (u.hudSrc === 'fish' ? 'fish' : 'regs') + ' dans mes références</button>' + (nMine ? '<button class="btn small" data-hudact="clear">Effacer mes ' + nMine + ' références</button>' : '') + '<button class="qm" data-help="hud" aria-label="Aide sur le HUD">?</button></div>';
  if (!D.X[g].n) return h + '<div class="panel empty">Aucune main ' + (g === 'hu' ? 'en heads-up' : 'à 3 joueurs') + ' pour ce profil et ces filtres.</div>';
  const B = (id) => hudBoxHtml(HUD_BOX[g].find(b => b.id === id), D, R);
  h += '<div class="hud-wrap"><div class="hud ' + (g === 'hu' ? 'hud-hu' : 'hud-3') + '">';
  if (g === 'hu') h += '<div class="hcol">' + hudMainHtml(g, D, R, label) + B('hu.BB') + '</div><div class="hcol">' + hudPostHtml(g, D, R) + B('hu.SB') + '</div>';
  else h += '<div class="hcol">' + B('3.BvS') + B('3.BU') + '<div class="hrow">' + B('3.BvBU') + B('3.SvBU') + '</div></div><div class="hcol">' + B('3.SvB') + hudMainHtml(g, D, R, label) + hudPostHtml(g, D, R) + '</div>';
  h += '</div><div class="hud-side"><div class="hud-legend"><span><i class="ok"></i>dans ta zone</span><span><i class="hi"></i>trop haut</span><span><i class="lo"></i>trop bas</span><span><i class="nr"></i>pas de référence</span><span><i class="few"></i>moins de ' + S.prefs.hudMin + ' occasions</span><span><u>souligné</u> = ta référence perso</span></div>';
  // biggest gaps
  const gaps = [];
  for (const k of hudKeys(g)) { const e = hudEval(k, D, R); if (e && e.ref && e.r.o >= S.prefs.hudMin && Math.abs(e.d) > e.ref.t) gaps.push({ k, e, sc: (Math.abs(e.d) - e.ref.t) * Math.sqrt(e.r.o) }); }
  gaps.sort((a, b) => b.sc - a.sc);
  h += '<div class="panel hud-gaps"><h3>À travailler <span class="help">les écarts les plus nets avec ta référence</span></h3>' + (gaps.length ? '<table><tbody>' + gaps.slice(0, 12).map(x => '<tr data-hud="' + x.k + '"><td>' + esc(hudLabel(x.k)) + '<div class="sub">' + fmtN(x.e.r.o) + ' occasions · réf. ' + fmtP(x.e.ref.v, 0) + ' ± ' + x.e.ref.t + '</div></td><td class="n"><b class="' + (x.e.d > 0 ? 'c-agg' : 'c-pas') + '">' + fmtP(x.e.v, 0) + '</b><div class="sub">' + (x.e.d > 0 ? 'trop haut' : 'trop bas') + ' de ' + fmtN(Math.abs(x.e.d), 0) + ' pts</div></td></tr>').join('') + '</tbody></table>' : '<p class="note">Rien hors de ta zone pour l\'instant (cases avec au moins ' + S.prefs.hudMin + ' occasions et une référence).</p>') + '</div></div></div>';
  return h;
}
function hudOpen(key) {
  const C = S.hudCur; if (!C) return;
  const e = hudEval(key, C.D, C.R), mine = S.prefs.hudRefs[key] || {};
  const n = e ? e.r.o : 0;
  let h = '<div class="modal-bg" data-act="closeModal"><div class="modal hud-modal" role="dialog" aria-modal="true" aria-label="Statistique"><div class="row"><h3 style="margin:0;font:700 22px var(--display)">' + esc(hudLabel(key)) + '</h3><div class="grow" style="flex:1"></div><button class="btn small" data-act="closeModal">Fermer</button></div>' +
    '<p class="note" style="margin:0;font-size:13px">' + esc(hudDesc(key)) + '</p><div class="grid3">' +
    '<div class="tile"><div class="l">Ta valeur</div><div class="v">' + (e ? fmtP(e.v, 1) : '—') + '</div><div class="theo">' + (e ? fmtN(e.r.x) + ' sur ' + fmtN(e.r.o) + ' occasions' : 'aucune occasion') + '</div></div>' +
    '<div class="tile"><div class="l">Référence utilisée</div><div class="v">' + (e && e.ref ? fmtP(e.ref.v, 0) + ' <span style="font-size:15px">± ' + e.ref.t + '</span>' : '—') + '</div><div class="theo">' + (e && e.ref ? esc(e.ref.src) : 'aucune') + '</div></div>' +
    '<div class="tile"><div class="l">Écart</div><div class="v ' + (e && e.d != null ? (Math.abs(e.d) <= e.ref.t ? 'pos' : 'neg') : '') + '">' + (e && e.d != null ? fmtS(e.d, 0) + ' pts' : '—') + '</div><div class="theo">' + (!e ? '' : e.c === 'few' ? 'échantillon trop petit (< ' + S.prefs.hudMin + ')' : e.d == null ? '' : Math.abs(e.d) <= e.ref.t ? 'dans ta zone' : e.d > 0 ? 'trop haut' : 'trop bas') + '</div></div></div>' +
    '<div class="row hud-edit"><label class="f" for="hrV">Ma référence (%)<input type="number" id="hrV" min="0" max="100" step="1" value="' + (mine.v != null ? mine.v : '') + '" placeholder="' + (e && e.ref && e.ref.src !== 'Ta référence' ? Math.round(e.ref.v) : '') + '"></label>' +
    '<label class="f" for="hrT">Écart toléré (± pts)<input type="number" id="hrT" min="1" max="50" step="1" value="' + (mine.t != null ? mine.t : '') + '" placeholder="' + S.prefs.hudTol + '"></label>' +
    '<button class="btn primary" data-hudact="save" data-key="' + key + '">Enregistrer</button>' + (mine.v != null ? '<button class="btn" data-hudact="del" data-key="' + key + '">Retirer ma référence</button>' : '') +
    '<div class="grow" style="flex:1"></div>' + (n ? '<button class="btn" data-hudact="replay" data-key="' + key + '">▶ Revoir ces ' + fmtN(n) + ' mains</button>' : '') + '</div>' +
    '<p class="note" style="margin:0">Laisse « Ma référence » vide pour comparer aux ' + (S.ui.lf.hudSrc === 'fish' ? 'fish' : 'regs') + ' de ta base. Écart toléré vide = réglage général (± ' + S.prefs.hudTol + ').</p></div></div>';
  $('#modalRoot').innerHTML = h;
  const i = $('#hrV'); if (i) i.focus();
}
function hudAct(t) {
  const a = t.dataset.hudact, key = t.dataset.key, R = S.prefs.hudRefs;
  if (a === 'save') {
    const v = $('#hrV').value.trim(), tl = $('#hrT').value.trim();
    if (v === '' && tl === '') delete R[key];
    else { const o = R[key] || {}; if (v !== '') o.v = Math.max(0, Math.min(100, +v)); else delete o.v; if (tl !== '') o.t = Math.max(1, Math.min(50, +tl)); else delete o.t; if (o.v == null && o.t == null) delete R[key]; else R[key] = o; }
    savePrefs(); $('#modalRoot').innerHTML = ''; render(); toast('Référence enregistrée');
  } else if (a === 'del') { delete R[key]; savePrefs(); $('#modalRoot').innerHTML = ''; render(); toast('Référence retirée'); }
  else if (a === 'replay') { const r = S.hudCur && S.hudCur.D.M.get(key); if (r) { $('#modalRoot').innerHTML = ''; const hs = [...new Set(r.hs)].sort((x, y) => x.ts - y.ts); openReplayer(hs, 0, hudLabel(key)); } }
  else if (a === 'copy') {
    const g = S.ui.lf.sub === 'hudhu' ? 'hu' : '3', P = hudPop(S.ui.lf.hudSrc === 'fish' ? 'fish' : 'reg'); let n = 0;
    for (const k of hudKeys(g)) { const r = P.get(k); if (r && r.o >= 30) { R[k] = Object.assign(R[k] || {}, { v: Math.round(r.x / r.o * 100) }); n++; } }
    savePrefs(); render(); toast(n + ' références copiées : clique une case pour l\'ajuster');
  } else if (a === 'clear') {
    const g = S.ui.lf.sub === 'hudhu' ? 'hu' : '3';
    if (!t.dataset.sure) { t.dataset.sure = '1'; t.textContent = 'Sûr ? Clique encore'; t.classList.add('danger'); return; }
    for (const k of Object.keys(R)) if (k.startsWith(g + '.')) delete R[k];
    savePrefs(); render(); toast('Références effacées');
  }
}
document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-hud],[data-hudact]'); if (!t) return;
  if (t.dataset.hudact) hudAct(t); else hudOpen(t.dataset.hud);
});
document.addEventListener('change', function (e) {
  const t = e.target;
  if (t.id === 'hudSrc') { S.ui.lf.hudSrc = t.value; render(); }
  else if (t.id === 'hudTol') { S.prefs.hudTol = Math.max(1, Math.min(50, +t.value || 8)); savePrefs(); render(); }
  else if (t.id === 'hudMin') { S.prefs.hudMin = Math.max(1, Math.min(500, +t.value || 15)); savePrefs(); render(); }
});
document.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.target.id === 'hrV' || e.target.id === 'hrT')) { const b = $('[data-hudact="save"]'); if (b) b.click(); } });
