// ===== Spin Tracker engine: Betclic parser, pots, evaluator, all-in EV =====
(function (G) {
  'use strict';
  const RANKS = '23456789TJQKA', SUITS = 'cdhs';
  function cardId(s) { return RANKS.indexOf(s[0]) * 4 + SUITS.indexOf(s[1]); }

  // ---------- Parser ----------
  const VERBS = 'Posts SB|Posts BB|Folds|Checks|Calls|Bets|Raises to|Sits out|Sits in|Reconnected|Disconnected|Posts ante';
  const RE_ACT = new RegExp('^(\\d\\d):(\\d\\d):(\\d\\d) - (.+): (' + VERBS + ')(?: (\\d+))?( and is all-in)?\\s*$');
  const RE_SEAT = /^Seat (\d+): (.+) \((\d+)\) \[([^\]]*)\]\s*$/;
  const RE_HOLE = /^(.+): \[(\w\w) (\w\w)\]\s*$/;
  const RE_WIN = /^(.+) wins (?:main pot|\d+\w\w side pot) of (\d+)\s*$/;
  const RE_FIN = /^(.+) finished (\d+)\w\w(?: and wins ([\d.,]+) EUR)?\s*$/;
  const RE_SHOW = /^(.+) shows \[(\w\w) (\w\w)\]/;
  const STREETS = { 'PRE-FLOP': 0, 'FLOP': 1, 'TURN': 2, 'RIVER': 3, 'SHOWDOWN': 4, 'SUMMARY': 5, 'HEADER': -3, 'PLAYERS': -2, 'HOLE CARDS': -1 };
  const num = (s) => parseFloat(String(s).replace(',', '.').replace(/[^\d.\-]/g, '')) || 0;

  function parseHand(block) {
    const lines = block.split(/\r?\n/);
    const h = { players: [], acts: [], board: [], hole: {}, won: {}, fin: [], shown: {} };
    let sec = null;
    for (let raw of lines) {
      const line = raw.replace(/\s+$/, '');
      if (!line) continue;
      const m0 = /^\*\*\* ([A-Z\- ]+) \*\*\*(?: \[([^\]]*)\])?/.exec(line);
      if (m0) {
        sec = STREETS[m0[1]] !== undefined ? STREETS[m0[1]] : sec;
        if (m0[2] && (sec === 1 || sec === 2 || sec === 3)) h.board = m0[2].trim().split(/\s+/);
        continue;
      }
      if (sec === -3) {
        const i = line.indexOf(': ');
        if (i < 0) continue;
        const k = line.slice(0, i), v = line.slice(i + 2);
        switch (k) {
          case 'Site': h.site = v; break;
          case 'Game Mode': h.mode = v; break;
          case 'Game Name': h.gname = v; break;
          case 'Game ID': h.gid = v; break;
          case 'Prize pool': h.prize = num(v); break;
          case 'Multiplier': h.mult = num(v); break;
          case 'Buy In': h.bi = num(v); break;
          case 'Hand ID': h.id = v; break;
          case 'Date & Time': {
            const m = /(\d{4})-(\d\d)-(\d\d) (\d\d):(\d\d):(\d\d)/.exec(v);
            if (m) h.ts = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
            break;
          }
          case 'Table ID': h.tid = v; break;
          case 'Blinds': { const p = v.split('/'); h.sb = num(p[0]); h.bb = num(p[1]); break; }
          case 'Total Pot': h.pot = num(v); break;
          case 'Rake': h.rake = num(v); break;
        }
      } else if (sec === -2) {
        const m = RE_SEAT.exec(line);
        if (m) {
          const tags = m[4].split(/\s+/);
          h.players.push({ seat: +m[1], name: m[2], stack: +m[3], btn: tags.includes('BTN'), sbp: tags.includes('SB'), bbp: tags.includes('BB'), hero: tags.includes('Hero') });
        }
      } else if (sec === -1) {
        const m = RE_HOLE.exec(line);
        if (m) h.hole[m[1]] = [m[2], m[3]];
      } else if (sec >= 0 && sec <= 3) {
        const m = RE_ACT.exec(line);
        if (m) {
          const v = m[5];
          let a = null;
          if (v === 'Posts SB') a = 'sb'; else if (v === 'Posts BB') a = 'bb'; else if (v === 'Posts ante') a = 'ante';
          else if (v === 'Folds') a = 'f'; else if (v === 'Checks') a = 'x'; else if (v === 'Calls') a = 'c';
          else if (v === 'Bets') a = 'b'; else if (v === 'Raises to') a = 'r';
          if (a) h.acts.push({ st: sec, p: m[4], a, n: m[6] ? +m[6] : 0, ai: !!m[7] });
        }
      } else if (sec === 4) {
        const m = RE_SHOW.exec(line);
        if (m) h.shown[m[1]] = [m[2], m[3]];
      } else if (sec === 5) {
        let m = RE_WIN.exec(line);
        if (m) { h.won[m[1]] = (h.won[m[1]] || 0) + (+m[2]); continue; }
        m = RE_FIN.exec(line);
        if (m) h.fin.push({ p: m[1], place: +m[2], eur: m[3] ? num(m[3]) : 0 });
      }
    }
    if (!h.id || !h.players.length) return null;
    for (const k in h.shown) if (!h.hole[k]) h.hole[k] = h.shown[k];
    finalize(h);
    return h;
  }

  function finalize(h) {
    const n = h.players.length; h.n = n;
    const hero = h.players.find(p => p.hero); h.hero = hero ? hero.name : null;
    for (const p of h.players) {
      if (n === 2) p.pos = p.btn ? 'SB' : 'BB';
      else p.pos = p.btn ? 'BTN' : p.sbp ? 'SB' : p.bbp ? 'BB' : '?';
    }
    // contributions, per-street commitments
    const contrib = {}, folded = {}, committed = {};
    let st = -1;
    for (const p of h.players) { contrib[p.name] = 0; folded[p.name] = false; }
    for (const a of h.acts) {
      if (a.st !== st) { st = a.st; for (const k in committed) committed[k] = 0; }
      if (!(a.p in committed)) committed[a.p] = 0;
      let add = 0;
      if (a.a === 'sb' || a.a === 'bb' || a.a === 'c' || a.a === 'b' || a.a === 'ante') add = a.n;
      else if (a.a === 'r') add = a.n - committed[a.p];
      else if (a.a === 'f') folded[a.p] = true;
      if (a.a !== 'ante') committed[a.p] += add;
      contrib[a.p] = (contrib[a.p] || 0) + add;
      a.add = add;
    }
    // uncalled excess (not written in Betclic HH) is returned to the top contributor
    // (Betclic's "Total Pot" excludes it when the bet was partially called by an all-in player)
    const order = Object.keys(contrib).sort((a, b) => contrib[b] - contrib[a]);
    const totC = Object.values(contrib).reduce((x, y) => x + y, 0);
    const wonTot = Object.values(h.won).reduce((x, y) => x + y, 0);
    if (h.pot == null && wonTot > 0) h.pot = wonTot;
    if (h.pot != null && totC > h.pot && order.length) { h.uncalled = totC - h.pot; h.uncalledTo = order[0]; contrib[order[0]] -= h.uncalled; }
    h.contrib = contrib; h.folded = folded;
    h.net = {};
    for (const p of h.players) h.net[p.name] = (h.won[p.name] || 0) - contrib[p.name];
    h.sd = h.players.filter(p => !folded[p.name]).length >= 2 && Object.keys(h.shown).length >= 2;
  }

  function parseFile(text) {
    const out = [];
    const blocks = text.split(/\r?\n-{6,}\s*\r?\n/);
    for (const b of blocks) {
      if (b.indexOf('*** HEADER ***') < 0) continue;
      try { const h = parseHand(b.slice(b.indexOf('*** HEADER ***'))); if (h) { h.raw = b.trim(); out.push(h); } } catch (e) { /* skip */ }
    }
    return out;
  }

  // ---------- Evaluator (7 cards -> comparable int) ----------
  const bitCount = (x) => { let c = 0; while (x) { x &= x - 1; c++; } return c; };
  function topBits(mask, k) { let r = 0, c = 0; for (let i = 12; i >= 0 && c < k; i--) if (mask & (1 << i)) { r = (r << 4) | i; c++; } while (c < k) { r <<= 4; c++; } return r; }
  function straightHigh(mask) {
    const m = mask;
    for (let hi = 12; hi >= 4; hi--) { const need = 0x1f << (hi - 4); if ((m & need) === need) return hi; }
    if ((m & 0x100f) === 0x100f) return 3; // wheel A-2-3-4-5
    return -1;
  }
  const cnt = new Int32Array(13), sc = new Int32Array(4), sm = new Int32Array(4);
  function eval7(cards, len) {
    cnt.fill(0); sc.fill(0); sm.fill(0);
    let mask = 0;
    for (let i = 0; i < len; i++) { const c = cards[i], r = c >> 2, s = c & 3; cnt[r]++; sc[s]++; sm[s] |= 1 << r; mask |= 1 << r; }
    for (let s = 0; s < 4; s++) if (sc[s] >= 5) {
      const sh = straightHigh(sm[s]);
      if (sh >= 0) return (8 << 20) | sh;
      return (5 << 20) | topBits(sm[s], 5);
    }
    let quad = -1, trips = -1, trips2 = -1, p1 = -1, p2 = -1;
    for (let r = 12; r >= 0; r--) {
      const c = cnt[r];
      if (c === 4) quad = r;
      else if (c === 3) { if (trips < 0) trips = r; else if (trips2 < 0) trips2 = r; }
      else if (c === 2) { if (p1 < 0) p1 = r; else if (p2 < 0) p2 = r; }
    }
    if (quad >= 0) return (7 << 20) | (quad << 4) | topBits(mask & ~(1 << quad), 1);
    if (trips >= 0 && (trips2 >= 0 || p1 >= 0)) { const pr = Math.max(trips2, p1); return (6 << 20) | (trips << 4) | pr; }
    const sh = straightHigh(mask);
    if (sh >= 0) return (4 << 20) | sh;
    if (trips >= 0) return (3 << 20) | (trips << 8) | topBits(mask & ~(1 << trips), 2);
    if (p1 >= 0 && p2 >= 0) return (2 << 20) | (p1 << 8) | (p2 << 4) | topBits(mask & ~(1 << p1) & ~(1 << p2), 1);
    if (p1 >= 0) return (1 << 20) | (p1 << 12) | topBits(mask & ~(1 << p1), 3);
    return topBits(mask, 5);
  }

  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

  // ---------- Pots ----------
  function buildPots(h) {
    const live = h.players.map(p => p.name).filter(n => !h.folded[n]);
    const levels = [...new Set(live.map(n => h.contrib[n]))].sort((a, b) => a - b);
    const pots = []; let prev = 0;
    for (const L of levels) {
      let amt = 0;
      for (const p of h.players) { const c = h.contrib[p.name]; amt += Math.max(0, Math.min(c, L) - Math.min(c, prev)); }
      const elig = live.filter(n => h.contrib[n] >= L);
      if (amt > 0) pots.push({ amt, elig });
      prev = L;
    }
    // dead money above highest live level (shouldn't happen) goes to last pot
    let rest = 0; for (const p of h.players) rest += Math.max(0, h.contrib[p.name] - prev);
    if (rest && pots.length) pots[pots.length - 1].amt += rest;
    return pots;
  }

  // ---------- All-in EV ----------
  // returns { adj:bool, ev:{name:netEV}, vr:{name:variance}, eq:{name:equity of total}, st }
  function computeEV(h, trials) {
    trials = trials || 12000;
    const res = { adj: false, ev: Object.assign({}, h.net), vr: {}, st: -1 };
    const live = h.players.map(p => p.name).filter(n => !h.folded[n]);
    if (live.length < 2) return res;
    let S = 0; for (const a of h.acts) if (a.st > S) S = a.st;
    const boardKnown = S === 0 ? 0 : S + 2;
    if (boardKnown >= 5) return res;
    for (const n of live) if (!h.hole[n]) return res;
    const stackOf = {}; for (const p of h.players) stackOf[p.name] = p.stack;
    const notAllIn = live.filter(n => h.contrib[n] < stackOf[n]);
    if (notAllIn.length > 1) return res;
    const pots = buildPots(h);
    const board = h.board.slice(0, boardKnown).map(cardId);
    const holes = live.map(n => h.hole[n].map(cardId));
    const dead = new Set(board); holes.forEach(x => x.forEach(c => dead.add(c)));
    // include any other known hole cards as dead
    for (const k in h.hole) if (!live.includes(k)) h.hole[k].forEach(c => dead.add(cardId(c)));
    const deck = []; for (let c = 0; c < 52; c++) if (!dead.has(c)) deck.push(c);
    const need = 5 - boardKnown;
    const L = live.length, sum = new Float64Array(L), sum2 = new Float64Array(L);
    const cards = new Int32Array(7), full = new Int32Array(5), score = new Int32Array(L), take = new Float64Array(L);
    const potElig = pots.map(p => p.elig.map(n => live.indexOf(n)));
    function settle() {
      for (let i = 0; i < L; i++) {
        cards[0] = holes[i][0]; cards[1] = holes[i][1];
        for (let j = 0; j < 5; j++) cards[2 + j] = full[j];
        score[i] = eval7(cards, 7);
      }
      take.fill(0);
      for (let k = 0; k < pots.length; k++) {
        const el = potElig[k]; let best = -1, nb = 0;
        for (const i of el) { if (score[i] > best) { best = score[i]; nb = 1; } else if (score[i] === best) nb++; }
        const share = pots[k].amt / nb;
        for (const i of el) if (score[i] === best) take[i] += share;
      }
      for (let i = 0; i < L; i++) { sum[i] += take[i]; sum2[i] += take[i] * take[i]; }
    }
    for (let j = 0; j < boardKnown; j++) full[j] = board[j];
    let N = 0;
    if (need <= 2) {
      if (need === 1) { for (let a = 0; a < deck.length; a++) { full[4] = deck[a]; settle(); N++; } }
      else { for (let a = 0; a < deck.length; a++) for (let b = a + 1; b < deck.length; b++) { full[3] = deck[a]; full[4] = deck[b]; settle(); N++; } }
    } else {
      const rnd = mulberry32(hashStr(h.id)); const d = deck.slice(); const D = d.length;
      for (let t = 0; t < trials; t++) {
        for (let j = 0; j < need; j++) { const k = j + Math.floor(rnd() * (D - j)); const tmp = d[j]; d[j] = d[k]; d[k] = tmp; full[boardKnown + j] = d[j]; }
        settle(); N++;
      }
    }
    res.adj = true; res.st = S; res.eq = {};
    const totalPot = pots.reduce((s, p) => s + p.amt, 0);
    live.forEach((n, i) => {
      const m = sum[i] / N;
      res.ev[n] = m - h.contrib[n];
      res.vr[n] = Math.max(0, sum2[i] / N - m * m);
      res.eq[n] = totalPot ? m / totalPot : 0;
    });
    return res;
  }

  // ---------- Preflop analysis helpers ----------
  // Per player preflop decisions with situation key
  function preflopInfo(h) {
    const info = {}; // name -> {vpip, pfr, limp, decisions:[{key, act}] , btnFirstIn, btnLimp}
    for (const p of h.players) info[p.name] = { vpip: false, pfr: false, decisions: [], btnOpp: false, btnLimp: false, threeBet: false, threeBetOpp: false };
    const posOf = {}; for (const p of h.players) posOf[p.name] = p.pos;
    const stackOf = {}; for (const p of h.players) stackOf[p.name] = p.stack;
    const bbAllInPost = h.acts.some(a => a.st === 0 && a.a === 'bb' && a.ai);
    let raises = 0, curBet = 0; const committed = {}; const seq = [];
    for (const a of h.acts) {
      if (a.st !== 0) break;
      if (a.a === 'sb' || a.a === 'bb' || a.a === 'ante') { if (a.a !== 'ante') { committed[a.p] = (committed[a.p] || 0) + a.n; curBet = Math.max(curBet, committed[a.p]); } continue; }
      const I = info[a.p]; if (!I) continue;
      const pos = posOf[a.p];
      const label = h.n === 2 ? 'HU ' + pos : pos;
      // classify action
      let act;
      const allin = a.ai || ((committed[a.p] || 0) + a.add >= stackOf[a.p]);
      if (a.a === 'f') act = 'fold';
      else if (a.a === 'x') act = 'check';
      else if (a.a === 'c') act = raises === 0 ? 'limp' : 'call';
      else if (a.a === 'r' || a.a === 'b') act = allin ? 'shove' : 'raise';
      else act = a.a;
      if (a.a === 'c' && allin && raises === 0) act = 'limp';
      // situation key (actions faced, by others and self, before this decision)
      const key = label + ' | ' + (seq.length ? seq.join(', ') : 'premier à parler');
      const effBB = effStackBB(h, a.p);
      I.decisions.push({ key, act, eff: effBB, first: !I.decisions.length });
      // stats
      if (act === 'limp' || act === 'call' || act === 'raise' || act === 'shove') I.vpip = true;
      if (act === 'raise' || act === 'shove') I.pfr = true;
      if (h.n === 3 && pos === 'BTN' && I.decisions.length === 1 && !bbAllInPost) { I.btnOpp = true; if (act === 'limp') I.btnLimp = true; }
      if (raises === 1 && I.decisions.length === 1) { I.threeBetOpp = true; if (act === 'raise' || act === 'shove') I.threeBet = true; }
      // update sequence
      const shortPos = h.n === 2 ? pos : pos;
      seq.push(shortPos + ' ' + act);
      if (a.a === 'r' || a.a === 'b') raises++;
      committed[a.p] = (committed[a.p] || 0) + a.add;
      curBet = Math.max(curBet, committed[a.p]);
    }
    return info;
  }

  function effStackBB(h, name) {
    const me = h.players.find(p => p.name === name); if (!me || !h.bb) return 0;
    let mx = 0; for (const p of h.players) if (p.name !== name) mx = Math.max(mx, p.stack);
    return Math.min(me.stack, mx) / h.bb;
  }

  // Postflop stats for a player in a hand
  function postflopInfo(h, name) {
    const r = { sawFlop: false, cbOpp: false, cb: false, fcbOpp: false, fcb: false, wtsd: false, wsd: false, af_b: 0, af_c: 0 };
    if (h.folded[name] && !h.acts.some(a => a.st >= 1 && a.p === name)) {
      // folded preflop or never saw flop
    }
    const sawFlop = h.board.length >= 3 && !h.acts.some(a => a.st === 0 && a.p === name && a.a === 'f');
    r.sawFlop = sawFlop;
    if (!sawFlop) return r;
    // preflop aggressor
    let pfa = null; for (const a of h.acts) if (a.st === 0 && (a.a === 'r' || a.a === 'b')) pfa = a.p;
    const flop = h.acts.filter(a => a.st === 1);
    let betSeen = false, cbetBy = null;
    for (const a of flop) {
      if (a.p === name && (a.a === 'b' || a.a === 'r')) r.af_b++;
      if (a.p === name && a.a === 'c') r.af_c++;
      if (!betSeen) {
        if (a.p === name && pfa === name) { r.cbOpp = true; if (a.a === 'b') r.cb = true; }
        if (a.a === 'b') { betSeen = true; cbetBy = a.p === pfa ? a.p : null; }
      } else if (cbetBy && a.p === name && name !== cbetBy && !r.fcbOpp) { r.fcbOpp = true; if (a.a === 'f') r.fcb = true; }
    }
    for (const a of h.acts) if (a.st >= 2 && a.p === name) { if (a.a === 'b' || a.a === 'r') r.af_b++; if (a.a === 'c') r.af_c++; }
    r.wtsd = !h.folded[name] && h.sd;
    r.wsd = r.wtsd && (h.won[name] || 0) > 0;
    return r;
  }

  // Compact action string per street for hero (like PST: F C X B R, A for all-in)
  function actionLine(h, name) {
    const out = [[], [], [], []];
    for (const a of h.acts) {
      if (a.st < 0 || a.st > 3 || a.a === 'sb' || a.a === 'bb' || a.a === 'ante') continue;
      const L = { f: 'F', x: 'X', c: 'C', b: 'B', r: 'R' }[a.a];
      out[a.st].push({ L, me: a.p === name, ai: a.ai });
    }
    return out;
  }


  // ---------- Compact storage format ----------
  function pack(h) {
    const idx = {}; h.players.forEach((p, i) => idx[p.name] = i);
    const I = (n) => (n in idx ? idx[n] : n);
    const o = {
      i: h.id, g: h.gid, t: h.tid, ts: h.ts, bi: h.bi, pz: h.prize, m: h.mult, b: [h.sb, h.bb], pt: h.pot, gn: h.gname, si: h.site, mo: h.mode,
      P: h.players.map(p => [p.seat, p.name, p.stack, (p.btn ? 1 : 0) | (p.sbp ? 2 : 0) | (p.bbp ? 4 : 0) | (p.hero ? 8 : 0)]),
      A: h.acts.map(a => [a.st, I(a.p), a.a, a.n, a.ai ? 1 : 0]),
      B: h.board.join(' '), H: {}, W: {}, F: h.fin.map(f => [I(f.p), f.place, f.eur]), S: Object.keys(h.shown).map(I)
    };
    for (const k in h.hole) o.H[I(k)] = h.hole[k].join(' ');
    for (const k in h.won) o.W[I(k)] = h.won[k];
    if (h.E) o.E = h.E.adj ? { st: h.E.st, ev: h.players.map(p => +(h.E.ev[p.name] || 0).toFixed(2)), vr: h.players.map(p => Math.round(h.E.vr[p.name] || 0)), eq: h.players.map(p => h.E.eq[p.name] != null ? +h.E.eq[p.name].toFixed(4) : null) } : 0;
    return o;
  }
  function unpack(o) {
    const players = o.P.map(x => ({ seat: x[0], name: x[1], stack: x[2], btn: !!(x[3] & 1), sbp: !!(x[3] & 2), bbp: !!(x[3] & 4), hero: !!(x[3] & 8) }));
    const N = (v) => (typeof v === 'number' && players[v] ? players[v].name : v);
    const h = { id: o.i, gid: o.g, tid: o.t, ts: o.ts, bi: o.bi, prize: o.pz, mult: o.m, sb: o.b[0], bb: o.b[1], pot: o.pt, gname: o.gn, site: o.si, mode: o.mo, rake: 0,
      players, acts: o.A.map(a => ({ st: a[0], p: N(a[1]), a: a[2], n: a[3], ai: !!a[4] })), board: o.B ? o.B.split(' ') : [], hole: {}, won: {}, shown: {},
      fin: o.F.map(f => ({ p: N(f[0]), place: f[1], eur: f[2] })) };
    for (const k in o.H) h.hole[N(isNaN(+k) ? k : +k)] = o.H[k].split(' ');
    for (const k in o.W) h.won[N(isNaN(+k) ? k : +k)] = o.W[k];
    for (const k of o.S) { const n = N(k); h.shown[n] = h.hole[n]; }
    finalize(h);
    if (o.E !== undefined) {
      if (!o.E) h.E = { adj: false, ev: Object.assign({}, h.net), vr: {}, st: -1 };
      else { const ev = {}, vr = {}, eq = {}; players.forEach((p, i) => { ev[p.name] = o.E.ev[i]; vr[p.name] = o.E.vr[i]; if (o.E.eq[i] != null) eq[p.name] = o.E.eq[i]; }); h.E = { adj: true, st: o.E.st, ev, vr, eq }; }
    }
    return h;
  }
  // Rebuild a Betclic-style text history from parsed data
  function toText(h) {
    const d = new Date(h.ts), z = (x) => String(x).padStart(2, '0');
    const dt = d.getUTCFullYear() + '-' + z(d.getUTCMonth() + 1) + '-' + z(d.getUTCDate()) + ' ' + z(d.getUTCHours()) + ':' + z(d.getUTCMinutes()) + ':' + z(d.getUTCSeconds());
    const tm = dt.slice(11);
    const L = ['*** HEADER ***', 'Site: ' + (h.site || 'Betclic.fr'), 'Game Mode: Spin', "Game Type: NL Texas Hold'em", 'Game Name: ' + (h.gname || ''), 'Game ID: ' + h.gid,
      'Prize pool: ' + (h.prize || 0).toFixed(2) + '€', 'Multiplier: x' + h.mult, 'Buy In: ' + (h.bi || 0).toFixed(2) + '€', 'Hand ID: ' + h.id, 'Date & Time: ' + dt + ' (UTC)',
      'Table ID: ' + h.tid, 'Blinds: ' + h.sb + '/' + h.bb, 'Total Pot: ' + h.pot, 'Rake: 0', '*** PLAYERS ***'];
    for (const p of h.players) { const t = []; if (p.btn) t.push('BTN'); if (p.sbp) t.push('SB'); if (p.bbp) t.push('BB'); if (p.hero) t.push('Hero'); L.push('Seat ' + p.seat + ': ' + p.name + ' (' + p.stack + ') [' + t.join(' ') + ']'); }
    L.push('*** HOLE CARDS ***');
    for (const k in h.hole) L.push(k + ': [' + h.hole[k].join(' ') + ']');
    const names = ['*** PRE-FLOP ***', '*** FLOP *** [' + h.board.slice(0, 3).join(' ') + ']', '*** TURN *** [' + h.board.slice(0, 4).join(' ') + ']', '*** RIVER *** [' + h.board.join(' ') + ']'];
    const V = { sb: 'Posts SB', bb: 'Posts BB', f: 'Folds', x: 'Checks', c: 'Calls', b: 'Bets', r: 'Raises to', ante: 'Posts ante' };
    for (let s = 0; s < 4; s++) {
      if (s > 0 && h.board.length < s + 2) break;
      L.push(names[s]);
      for (const a of h.acts) if (a.st === s) L.push(tm + ' - ' + a.p + ': ' + V[a.a] + (a.a === 'f' || a.a === 'x' ? '' : ' ' + a.n) + (a.ai ? ' and is all-in' : ''));
    }
    if (Object.keys(h.shown).length) { L.push('*** SHOWDOWN ***'); for (const k in h.shown) L.push(k + ' shows [' + h.shown[k].join(' ') + ']'); }
    L.push('*** SUMMARY ***');
    for (const k in h.won) L.push(k + ' wins main pot of ' + h.won[k]);
    for (const f of h.fin) L.push(f.p + ' finished ' + f.place + (f.place === 1 ? 'st' : f.place === 2 ? 'nd' : f.place === 3 ? 'rd' : 'th') + (f.eur ? ' and wins ' + f.eur.toFixed(2) + ' EUR' : ''));
    return L.join('\n');
  }

  G.SpinEngine = { parseFile, parseHand, computeEV, buildPots, eval7, cardId, preflopInfo, postflopInfo, effStackBB, actionLine, pack, unpack, toText, finalize };
})(typeof window !== 'undefined' ? window : globalThis);
