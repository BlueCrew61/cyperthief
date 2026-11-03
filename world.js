/* ============================================================
   world.js: dunia 2D top-down untuk c1ph3rth3ft

   Alur:
     brief -> openWorld() -> jalan ke terminal -> [E] membuka puzzle cipher
     (screen-play di game.js) -> flag benar -> pintu keluar terbuka
     -> jalan ke pintu -> leaveLevel() (game.js) -> level berikutnya.

   Aturan nyawa TIDAK berubah: nyawa hanya berkurang karena flag salah.
   Penjaga dan kamera hanya mengembalikan pemain ke titik awal.

   Semua gambar dibuat dengan canvas (tanpa file gambar).
   ============================================================ */
(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);

  const TS = 32;
  const COLS = 20;
  const ROWS = 12;
  const CW = COLS * TS;
  const CH = ROWS * TS;

  /* Legenda peta:
     # dinding   . lantai   x properti (solid)   T terminal   D pintu keluar (di dinding atas)   S titik awal */
  const MAPS = [
    /* Level 1: Gudang */
    [
      '#########D##########',
      '#S.................#',
      '#..xx..........xx..#',
      '#..xx..........xx..#',
      '#..................#',
      '#.....xx....T......#',
      '#.....xx...........#',
      '#..................#',
      '#..xx..........xx..#',
      '#..xx..........xx..#',
      '#..................#',
      '####################',
    ],
    /* Level 2: Rumah */
    [
      '###########D########',
      '#S.......#.........#',
      '#........#..xx.....#',
      '#..xx....#.........#',
      '#..xx..............#',
      '#........#.........#',
      '#........#....T....#',
      '#........#.........#',
      '#...xx...#..xx.....#',
      '#..................#',
      '#........#.........#',
      '####################',
    ],
    /* Level 3: Hotel */
    [
      '#########D##########',
      '#S.................#',
      '#..................#',
      '#..xxxxxx..xxxxxx..#',
      '#..................#',
      '#.......x....x.....#',
      '#..................#',
      '#..xx..........xx..#',
      '#..xx....T.....xx..#',
      '#..................#',
      '#..................#',
      '####################',
    ],
    /* Level 4: Laboratorium */
    [
      '##########D#########',
      '#S.................#',
      '#.xxxxx.....xxxxx..#',
      '#..................#',
      '#.xxxxx.....xxxxx..#',
      '#..................#',
      '#........T.........#',
      '#..................#',
      '#.xxxxx.....xxxxx..#',
      '#..................#',
      '#.xxxxx.....xxxxx..#',
      '####################',
    ],
    /* Level 5: Gedung Pemerintah */
    [
      '#########D##########',
      '#S.................#',
      '#..x...x...x...x...#',
      '#..................#',
      '#.xxxxxx....xxxxxx.#',
      '#..................#',
      '#..................#',
      '#.xxxxxx....xxxxxx.#',
      '#..................#',
      '#.......T..........#',
      '#..x...x...x...x...#',
      '####################',
    ],
  ];

  const THEMES = [
    { prop: 'crate',  floor: '#191d24', floor2: '#1f242c', wall: '#2b3340', wallTop: '#3d4859', accent: '#c98a3a' },
    { prop: 'sofa',   floor: '#33261a', floor2: '#3b2c1e', wall: '#4a3646', wallTop: '#5d4659', accent: '#d9a066' },
    { prop: 'desk',   floor: '#2a1a33', floor2: '#31203b', wall: '#3b2a4a', wallTop: '#4f3a63', accent: '#e0b84a' },
    { prop: 'bench',  floor: '#1b2a31', floor2: '#203139', wall: '#1f4350', wallTop: '#2c5a6a', accent: '#39e6c8' },
    { prop: 'pillar', floor: '#1f222b', floor2: '#262a36', wall: '#2c2f3f', wallTop: '#42465c', accent: '#8fb4ff' },
  ];

  /* Koordinat dalam satuan tile. guards: bolak-balik dari a ke b.
     cams: kamera di dinding yang menyapu ke kiri-kanan. */
  const ENEMIES = [
    { guards: [], cams: [] },
    { guards: [{ a: [15, 2], b: [15, 10], speed: 52, range: 84 }], cams: [] },
    {
      guards: [
        { a: [2, 2], b: [17, 2], speed: 66, range: 88 },
        { a: [17, 6], b: [2, 6], speed: 66, range: 88 },
      ],
      cams: [],
    },
    {
      guards: [
        { a: [2, 3], b: [17, 3], speed: 78, range: 92 },
        { a: [17, 9], b: [2, 9], speed: 78, range: 92 },
      ],
      cams: [{ x: 0.5, y: 5.5, base: 0, swing: 0.6, speed: 1.1 }],
    },
    {
      guards: [
        { a: [2, 3], b: [17, 3], speed: 88, range: 96 },
        { a: [17, 6], b: [2, 6], speed: 88, range: 96 },
        { a: [2, 8], b: [17, 8], speed: 88, range: 96 },
      ],
      cams: [{ x: 19.5, y: 9.5, base: Math.PI, swing: 0.6, speed: 1.3 }],
    },
  ];

  const SCARF = { peretas: '#39ff88', mahasiswa: '#4da3ff', teknisi: '#ffb347', yatim: '#c58bff' };

  const PLAYER_HALF = 7;
  const PLAYER_SPEED = 118;
  const GUARD_HALF_ANGLE = 0.62;
  const CAM_RANGE = 170;
  const CAM_HALF_ANGLE = 0.38;
  const NEAR_TERMINAL = 52;

  /* ---------- State dunia ---------- */
  const W = {
    loaded: false,
    level: -1,
    grid: [],
    bg: null,
    px: 0, py: 0, startX: 0, startY: 0,
    face: 'down', moving: false, anim: 0,
    guards: [], cams: [],
    t: 0,
    term: { x: 0, y: 0, c: 0, r: 0 },
    door: { x: 0, y: 0, c: 0, r: 0 },
    msg: '', msgT: 0, doorHintCd: 0,
    flash: 0, invuln: 0,
    exiting: false,
  };

  const keys = { left: false, right: false, up: false, down: false };
  let canvas = null;
  let ctx = null;
  let vignette = null;
  let running = false;
  let lastTs = 0;

  /* ---------- Utilitas ---------- */
  function worldVisible() {
    const s = $('screen-world');
    return !!s && !s.classList.contains('hidden');
  }

  function solidTile(c, r) {
    if (r < 0 || c < 0 || r >= ROWS || c >= COLS) return true;
    const ch = W.grid[r][c];
    if (ch === '#' || ch === 'x' || ch === 'T') return true;
    if (ch === 'D') return !state.doorOpen;
    return false;
  }

  function solidPx(x, y) {
    return solidTile(Math.floor(x / TS), Math.floor(y / TS));
  }

  function hitsAt(x, y) {
    const h = PLAYER_HALF;
    return solidPx(x - h, y - h) || solidPx(x + h, y - h) || solidPx(x - h, y + h) || solidPx(x + h, y + h);
  }

  function toast(text, secs) {
    W.msg = text;
    W.msgT = secs || 2.6;
  }

  function normAngle(a) {
    return Math.atan2(Math.sin(a), Math.cos(a));
  }

  /* ---------- Memuat level ---------- */
  function loadLevel(idx) {
    const rows = MAPS[idx];
    W.grid = rows.map((r) => r.split(''));
    W.level = idx;
    W.loaded = true;
    W.exiting = false;
    W.t = 0;
    W.flash = 0;
    W.invuln = 0;
    W.msg = '';
    W.msgT = 0;
    W.doorHintCd = 0;
    W.face = 'down';
    W.moving = false;

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const ch = W.grid[r][c];
        if (ch === 'S') {
          W.startX = (c + 0.5) * TS;
          W.startY = (r + 0.5) * TS;
          W.grid[r][c] = '.';
        } else if (ch === 'T') {
          W.term = { c, r, x: (c + 0.5) * TS, y: (r + 0.5) * TS };
        } else if (ch === 'D') {
          W.door = { c, r, x: (c + 0.5) * TS, y: (r + 0.5) * TS };
        }
      }
    }
    W.px = W.startX;
    W.py = W.startY;

    const cfg = ENEMIES[idx];
    W.guards = cfg.guards.map((g) => {
      const a = { x: (g.a[0] + 0.5) * TS, y: (g.a[1] + 0.5) * TS };
      const b = { x: (g.b[0] + 0.5) * TS, y: (g.b[1] + 0.5) * TS };
      return {
        kind: 'guard', x: a.x, y: a.y, a, b, toB: true, speed: g.speed, range: g.range,
        half: GUARD_HALF_ANGLE, ang: Math.atan2(b.y - a.y, b.x - a.x), anim: 0, moving: true,
        pts: [], sees: false,
      };
    });
    W.cams = cfg.cams.map((c) => ({
      kind: 'cam', x: c.x * TS, y: c.y * TS, base: c.base, swing: c.swing, speed: c.speed,
      range: CAM_RANGE, half: CAM_HALF_ANGLE, ang: c.base, pts: [], sees: false,
    }));

    buildStatic(idx);
    refreshCones();
  }

  /* ---------- Gambar statis (lantai, dinding, properti) ---------- */
  function isWallTile(c, r) {
    if (r < 0 || c < 0 || r >= ROWS || c >= COLS) return true;
    const ch = W.grid[r][c];
    return ch === '#' || ch === 'D';
  }

  function box(g, x, y, topCol, frontCol) {
    g.fillStyle = 'rgba(0,0,0,.35)';
    g.fillRect(x + 2, y + TS - 5, TS - 2, 5);
    g.fillStyle = topCol;
    g.fillRect(x + 1, y + 3, TS - 2, 14);
    g.fillStyle = frontCol;
    g.fillRect(x + 1, y + 17, TS - 2, 12);
  }

  function drawProp(g, style, x, y, th) {
    switch (style) {
      case 'crate':
        box(g, x, y, '#a1703f', '#7a5230');
        g.strokeStyle = '#4f3320';
        g.lineWidth = 1;
        g.strokeRect(x + 1.5, y + 3.5, TS - 3, 25);
        g.beginPath();
        g.moveTo(x + 2, y + 17.5); g.lineTo(x + TS - 2, y + 17.5);
        g.moveTo(x + 2, y + 5); g.lineTo(x + TS - 2, y + 28);
        g.stroke();
        break;
      case 'sofa':
        box(g, x, y, '#8a4a4a', '#6b3a3a');
        g.fillStyle = '#a45a5a';
        g.fillRect(x + 4, y + 6, 11, 9);
        g.fillRect(x + 17, y + 6, 11, 9);
        g.fillStyle = '#4f2a2a';
        g.fillRect(x + 1, y + 3, TS - 2, 3);
        break;
      case 'desk':
        box(g, x, y, '#a07a34', '#6e5322');
        g.fillStyle = '#e8dcb0';
        g.fillRect(x + 6, y + 6, 8, 6);
        g.fillStyle = '#2b3a4a';
        g.fillRect(x + 19, y + 5, 8, 7);
        g.fillStyle = th.accent;
        g.fillRect(x + 21, y + 7, 4, 3);
        break;
      case 'bench':
        box(g, x, y, '#3a8896', '#2a6370');
        g.fillStyle = '#9ff7ff';
        g.fillRect(x + 6, y + 6, 4, 7);
        g.fillStyle = '#ff7ad9';
        g.fillRect(x + 14, y + 8, 4, 5);
        g.fillStyle = '#9dff7a';
        g.fillRect(x + 22, y + 6, 4, 7);
        break;
      default: { /* pillar */
        g.fillStyle = 'rgba(0,0,0,.4)';
        g.beginPath(); g.ellipse(x + 16, y + 28, 12, 4, 0, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#5a6078';
        g.fillRect(x + 8, y + 6, 16, 22);
        g.fillStyle = '#7b829c';
        g.fillRect(x + 8, y + 6, 6, 22);
        g.fillStyle = '#9aa2bd';
        g.beginPath(); g.ellipse(x + 16, y + 6, 8, 3.5, 0, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#4a4f66';
        g.fillRect(x + 6, y + 26, 20, 3);
      }
    }
  }

  function buildStatic(idx) {
    const off = document.createElement('canvas');
    off.width = CW;
    off.height = CH;
    const g = off.getContext('2d');
    const th = THEMES[idx];
    let seed = 9301 + idx * 7919;
    const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = c * TS;
        const y = r * TS;
        if (isWallTile(c, r)) {
          g.fillStyle = th.wallTop;
          g.fillRect(x, y, TS, TS);
          if (!isWallTile(c, r + 1)) {
            g.fillStyle = th.wall;
            g.fillRect(x, y + TS - 14, TS, 14);
            g.fillStyle = 'rgba(0,0,0,.28)';
            g.fillRect(x, y + TS - 3, TS, 3);
            g.fillStyle = 'rgba(255,255,255,.06)';
            g.fillRect(x, y + TS - 14, TS, 2);
            g.fillStyle = 'rgba(0,0,0,.18)';
            for (let i = 0; i < 2; i++) g.fillRect(x + (i * 17 + (r % 2) * 8) % TS, y + TS - 12, 1, 9);
          } else {
            g.fillStyle = 'rgba(0,0,0,.18)';
            g.fillRect(x, y, TS, 1);
            g.fillRect(x, y, 1, TS);
          }
          continue;
        }

        /* lantai */
        const checker = (c + r) % 2 === 0;
        g.fillStyle = checker ? th.floor : th.floor2;
        g.fillRect(x, y, TS, TS);
        if (idx === 0) { /* beton bercak */
          g.fillStyle = 'rgba(255,255,255,.035)';
          for (let i = 0; i < 4; i++) g.fillRect(x + rand() * 30, y + rand() * 30, 2, 2);
        } else if (idx === 1) { /* papan kayu */
          g.fillStyle = 'rgba(0,0,0,.22)';
          for (let i = 1; i < 4; i++) g.fillRect(x, y + i * 8, TS, 1);
          g.fillRect(x + ((r * 13 + c * 7) % 28) + 2, y, 1, 8);
        } else if (idx === 2) { /* karpet berpola */
          g.fillStyle = 'rgba(224,184,74,.18)';
          g.fillRect(x + 15, y + 11, 2, 10);
          g.fillRect(x + 11, y + 15, 10, 2);
        } else if (idx === 3) { /* ubin lab */
          g.strokeStyle = 'rgba(57,230,200,.12)';
          g.lineWidth = 1;
          g.strokeRect(x + 0.5, y + 0.5, TS - 1, TS - 1);
        } else { /* marmer */
          g.strokeStyle = 'rgba(143,180,255,.07)';
          g.beginPath();
          g.moveTo(x + rand() * TS, y);
          g.lineTo(x + rand() * TS, y + TS);
          g.stroke();
        }
        if (isWallTile(c, r - 1)) { /* bayangan di bawah dinding */
          g.fillStyle = 'rgba(0,0,0,.3)';
          g.fillRect(x, y, TS, 6);
        }
        if (W.grid[r][c] === 'x') drawProp(g, th.prop, x, y, th);
      }
    }
    W.bg = off;
  }

  function buildVignette() {
    const v = document.createElement('canvas');
    v.width = CW;
    v.height = CH;
    const g = v.getContext('2d');
    const grad = g.createRadialGradient(CW / 2, CH / 2, CH * 0.35, CW / 2, CH / 2, CW * 0.62);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,.6)');
    g.fillStyle = grad;
    g.fillRect(0, 0, CW, CH);
    g.fillStyle = 'rgba(0,0,0,.07)';
    for (let y = 0; y < CH; y += 3) g.fillRect(0, y, CW, 1);
    vignette = v;
  }

  /* ---------- Penglihatan penjaga / kamera ---------- */
  function losClear(x0, y0, x1, y1) {
    const d = Math.hypot(x1 - x0, y1 - y0);
    const steps = Math.max(1, Math.floor(d / 6));
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      if (solidPx(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t)) return false;
    }
    return true;
  }

  /* Titik asal pandangan. Kamera menempel di dinding, jadi digeser sedikit ke dalam ruangan. */
  function eyeOf(e) {
    if (e.kind === 'cam') return { x: e.x + Math.cos(e.ang) * 20, y: e.y + Math.sin(e.ang) * 20 };
    return { x: e.x, y: e.y - 6 };
  }

  function castCone(e) {
    const o = eyeOf(e);
    const pts = [[o.x, o.y]];
    const n = 16;
    for (let i = 0; i <= n; i++) {
      const a = e.ang - e.half + (2 * e.half * i) / n;
      let t = 0;
      while (t < e.range) {
        const nt = t + 5;
        if (solidPx(o.x + Math.cos(a) * nt, o.y + Math.sin(a) * nt)) break;
        t = nt;
      }
      pts.push([o.x + Math.cos(a) * t, o.y + Math.sin(a) * t]);
    }
    return pts;
  }

  function canSeePlayer(e) {
    const o = eyeOf(e);
    const dx = W.px - o.x;
    const dy = W.py - o.y;
    const d = Math.hypot(dx, dy);
    if (d > e.range) return false;
    if (d > 10 && Math.abs(normAngle(Math.atan2(dy, dx) - e.ang)) > e.half) return false;
    return losClear(o.x, o.y, W.px, W.py);
  }

  function refreshCones() {
    W.guards.forEach((e) => { e.pts = castCone(e); e.sees = canSeePlayer(e); });
    W.cams.forEach((e) => { e.pts = castCone(e); e.sees = canSeePlayer(e); });
  }

  /* ---------- Update ---------- */
  function tryMove(mx, my) {
    if (mx) { const nx = W.px + mx; if (!hitsAt(nx, W.py)) W.px = nx; }
    if (my) { const ny = W.py + my; if (!hitsAt(W.px, ny)) W.py = ny; }
  }

  function interact() {
    if (!worldVisible() || W.exiting) return;
    const d = Math.hypot(W.px - W.term.x, W.py - W.term.y);
    if (d > NEAR_TERMINAL) {
      toast('Dekati terminal (layar hijau) dulu, lalu tekan E.');
      return;
    }
    if (state.doorOpen) {
      toast('Terminal sudah diretas. Keluar lewat pintu yang terbuka!');
      return;
    }
    clearKeys();
    openPlay();
  }

  function caught() {
    W.flash = 0.55;
    W.invuln = 1.5;
    W.px = W.startX;
    W.py = W.startY;
    W.face = 'down';
    toast('TERDETEKSI! Kamu kembali ke titik awal. Nyawa tidak berkurang.', 3);
  }

  function update(dt) {
    W.t += dt;
    if (W.msgT > 0) W.msgT -= dt;
    if (W.flash > 0) W.flash -= dt;
    if (W.invuln > 0) W.invuln -= dt;
    if (W.doorHintCd > 0) W.doorHintCd -= dt;

    let dx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    let dy = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
    W.moving = dx !== 0 || dy !== 0;
    if (W.moving) {
      if (Math.abs(dx) >= Math.abs(dy) && dx !== 0) W.face = dx > 0 ? 'right' : 'left';
      else W.face = dy > 0 ? 'down' : 'up';
      if (dx && dy) { dx *= 0.7071; dy *= 0.7071; }
      const sp = PLAYER_SPEED * dt;
      tryMove(dx * sp, 0);
      tryMove(0, dy * sp);
      W.anim += dt;
    }

    W.guards.forEach((g) => {
      const tgt = g.toB ? g.b : g.a;
      const vx = tgt.x - g.x;
      const vy = tgt.y - g.y;
      const d = Math.hypot(vx, vy);
      const st = g.speed * dt;
      if (d <= st) {
        g.x = tgt.x; g.y = tgt.y; g.toB = !g.toB;
      } else {
        g.x += (vx / d) * st; g.y += (vy / d) * st;
        g.ang = Math.atan2(vy, vx);
      }
      g.anim += dt;
    });
    W.cams.forEach((c) => { c.ang = c.base + Math.sin(W.t * c.speed) * c.swing; });

    refreshCones();
    if (W.invuln <= 0 && (W.guards.some((e) => e.sees) || W.cams.some((e) => e.sees))) caught();

    /* pintu keluar */
    const dd = Math.hypot(W.px - W.door.x, W.py - (W.door.y + TS * 0.5));
    if (state.doorOpen) {
      /* Zona keluar sengaja lebih lebar dari bukaan pintu supaya tidak perlu pas lurus. */
      if (W.py < TS * 1.45 && Math.abs(W.px - W.door.x) < 22 && !W.exiting) {
        W.exiting = true;
        running = false;
        clearKeys();
        leaveLevel();
        return;
      }
    } else if (dd < 46 && W.doorHintCd <= 0) {
      W.doorHintCd = 3.2;
      toast('Pintu terkunci. Retas terminal untuk membukanya.');
    }
  }

  /* ---------- Gambar dinamis ---------- */
  function roundRectPath(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  }

  function pill(g, text, cx, cy, col) {
    g.font = 'bold 11px Consolas, "Courier New", monospace';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    const w = g.measureText(text).width + 16;
    roundRectPath(g, cx - w / 2, cy - 10, w, 20, 6);
    g.fillStyle = 'rgba(4,10,8,.88)';
    g.fill();
    g.strokeStyle = col;
    g.lineWidth = 1;
    g.stroke();
    g.fillStyle = col;
    g.fillText(text, cx, cy + 0.5);
  }

  function drawTerminal(g) {
    const x = W.term.c * TS;
    const y = W.term.r * TS;
    const solved = state.doorOpen;
    const near = Math.hypot(W.px - W.term.x, W.py - W.term.y) <= NEAR_TERMINAL;
    const col = solved ? '#39ff88' : '#ffb347';
    g.fillStyle = 'rgba(0,0,0,.4)';
    g.fillRect(x + 2, y + TS - 4, TS - 2, 4);
    g.fillStyle = '#10161f';
    g.fillRect(x + 3, y + 2, TS - 6, TS - 6);
    g.strokeStyle = near ? '#39ff88' : '#2a3a4a';
    g.lineWidth = 2;
    g.strokeRect(x + 3, y + 2, TS - 6, TS - 6);
    g.save();
    g.shadowColor = col;
    g.shadowBlur = near || solved ? 14 : 6;
    g.fillStyle = '#03100a';
    g.fillRect(x + 6, y + 5, TS - 12, 14);
    g.restore();
    g.fillStyle = col;
    if (solved) {
      g.fillRect(x + 10, y + 12, 3, 3);
      g.fillRect(x + 13, y + 14, 3, 3);
      g.fillRect(x + 16, y + 11, 3, 3);
      g.fillRect(x + 19, y + 8, 3, 3);
    } else {
      for (let i = 0; i < 3; i++) {
        const w = 6 + ((Math.floor(W.t * 2) + i * 5) % 11);
        g.fillRect(x + 8, y + 7 + i * 4, w, 2);
      }
      if (Math.floor(W.t * 2) % 2 === 0) g.fillRect(x + 8, y + 17 - 1, 4, 1);
    }
    g.fillStyle = '#1c2836';
    g.fillRect(x + 6, y + 21, TS - 12, 4);
    g.fillStyle = '#3a4a5e';
    for (let i = 0; i < 4; i++) g.fillRect(x + 8 + i * 5, y + 22, 3, 2);
  }

  /* Petunjuk tombol dirata-atas kepala pemain (digambar setelah semua sprite agar tidak tertutup). */
  function drawPrompt(g) {
    if (state.doorOpen) return;
    if (Math.hypot(W.px - W.term.x, W.py - W.term.y) > NEAR_TERMINAL) return;
    const cx = Math.max(70, Math.min(CW - 70, W.px));
    const cy = Math.max(44, W.py - 58);
    pill(g, '[E] Retas terminal', cx, cy, '#39ff88');
  }

  function drawDoor(g) {
    const x = W.door.c * TS;
    const y = W.door.r * TS;
    const open = state.doorOpen;
    g.fillStyle = '#10161f';
    g.fillRect(x + 2, y, TS - 4, TS);
    if (open) {
      const grad = g.createLinearGradient(0, y, 0, y + TS + 30);
      grad.addColorStop(0, 'rgba(57,255,136,.55)');
      grad.addColorStop(1, 'rgba(57,255,136,0)');
      g.fillStyle = '#062a14';
      g.fillRect(x + 4, y + 2, TS - 8, TS - 2);
      g.fillStyle = grad;
      g.fillRect(x - 6, y, TS + 12, TS + 30);
      g.strokeStyle = '#39ff88';
      g.lineWidth = 2;
      g.strokeRect(x + 3, y + 1, TS - 6, TS - 1);
      const bob = Math.sin(W.t * 5) * 2;
      g.fillStyle = '#39ff88';
      g.beginPath();
      g.moveTo(x + 16, y + TS + 6 + bob);
      g.lineTo(x + 9, y + TS + 15 + bob);
      g.lineTo(x + 23, y + TS + 15 + bob);
      g.closePath();
      g.fill();
      pill(g, 'KELUAR', x + 16, y + TS + 30, '#39ff88');
    } else {
      g.fillStyle = '#3a1218';
      g.fillRect(x + 4, y + 2, TS - 8, TS - 2);
      g.strokeStyle = '#ff4d5e';
      g.lineWidth = 2;
      g.strokeRect(x + 3, y + 1, TS - 6, TS - 1);
      g.fillStyle = '#ff4d5e';
      g.fillRect(x + 11, y + 15, 10, 9);
      g.strokeRect(x + 12.5, y + 8.5, 7, 8);
      g.fillStyle = Math.floor(W.t * 2) % 2 === 0 ? '#ff4d5e' : '#5a1a22';
      g.fillRect(x + 14, y + 4, 4, 3);
    }
  }

  function drawCone(g, e) {
    if (!e.pts.length) return;
    const o = eyeOf(e);
    const alert = e.sees;
    const grad = g.createRadialGradient(o.x, o.y, 4, o.x, o.y, e.range);
    grad.addColorStop(0, alert ? 'rgba(255,60,80,.55)' : 'rgba(255,230,120,.42)');
    grad.addColorStop(1, alert ? 'rgba(255,60,80,.06)' : 'rgba(255,230,120,.04)');
    g.beginPath();
    g.moveTo(e.pts[0][0], e.pts[0][1]);
    for (let i = 1; i < e.pts.length; i++) g.lineTo(e.pts[i][0], e.pts[i][1]);
    g.closePath();
    g.fillStyle = grad;
    g.fill();
  }

  function drawPerson(g, x, y, face, moving, anim, pal) {
    const bob = moving ? -Math.abs(Math.sin(anim * 12)) * 2 : 0;
    const step = moving ? Math.sin(anim * 12) * 3 : 0;
    g.fillStyle = 'rgba(0,0,0,.4)';
    g.beginPath(); g.ellipse(x, y + 9, 9, 4, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = pal.pants;
    g.fillRect(x - 6, y - 2 + (step > 0 ? -1 : 0), 5, 10);
    g.fillRect(x + 1, y - 2 + (step < 0 ? -1 : 0), 5, 10);
    g.fillStyle = pal.body;
    g.fillRect(x - 8, y - 16 + bob, 16, 16);
    g.fillRect(x - 11, y - 14 + bob + (step > 0 ? 1 : 0), 3, 10);
    g.fillRect(x + 8, y - 14 + bob + (step < 0 ? 1 : 0), 3, 10);
    g.fillStyle = pal.accent;
    g.fillRect(x - 8, y - 15 + bob, 16, 3);
    if (pal.bag && face === 'up') {
      g.fillStyle = pal.bag;
      g.fillRect(x - 6, y - 13 + bob, 12, 11);
      g.strokeStyle = pal.accent;
      g.lineWidth = 1;
      g.strokeRect(x - 5.5, y - 12.5 + bob, 11, 10);
    }
    g.fillStyle = pal.head;
    g.fillRect(x - 7, y - 28 + bob, 14, 13);
    if (face !== 'up') {
      g.fillStyle = pal.skin;
      if (face === 'down') {
        g.fillRect(x - 5, y - 25 + bob, 10, 5);
        g.fillStyle = '#05080c';
        g.fillRect(x - 3, y - 24 + bob, 2, 2);
        g.fillRect(x + 1, y - 24 + bob, 2, 2);
      } else if (face === 'left') {
        g.fillRect(x - 6, y - 25 + bob, 6, 5);
        g.fillStyle = '#05080c';
        g.fillRect(x - 4, y - 24 + bob, 2, 2);
      } else {
        g.fillRect(x, y - 25 + bob, 6, 5);
        g.fillStyle = '#05080c';
        g.fillRect(x + 2, y - 24 + bob, 2, 2);
      }
    }
    if (pal.cap) {
      g.fillStyle = pal.cap;
      g.fillRect(x - 8, y - 31 + bob, 16, 5);
      g.fillStyle = '#05080c';
      if (face === 'down') g.fillRect(x - 8, y - 27 + bob, 16, 2);
    }
  }

  function drawPlayer(g) {
    if (W.invuln > 0 && Math.floor(W.t * 14) % 2 === 0) return;
    const scarf = SCARF[state.player && state.player.bg ? state.player.bg.id : ''] || '#39ff88';
    drawPerson(g, W.px, W.py, W.face, W.moving, W.anim, {
      pants: '#0a0e14', body: '#11161d', head: '#0b0f14', skin: '#d8a77a',
      accent: scarf, bag: '#1a2533',
    });
    const name = (state.player && state.player.name) || '';
    if (name) {
      g.font = 'bold 10px Consolas, "Courier New", monospace';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      const w = g.measureText(name).width + 10;
      g.fillStyle = 'rgba(4,10,8,.7)';
      g.fillRect(W.px - w / 2, W.py - 46, w, 14);
      g.fillStyle = scarf;
      g.fillText(name, W.px, W.py - 38.5);
    }
  }

  function drawGuard(g, e) {
    const dx = Math.cos(e.ang);
    const dy = Math.sin(e.ang);
    const face = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    drawPerson(g, e.x, e.y, face, true, e.anim, {
      pants: '#0a1a33', body: '#0f2a55', head: '#0a1a33', skin: '#d8a77a',
      accent: '#ffd54a', cap: '#0a1a33', bag: null,
    });
  }

  function drawCam(g, e) {
    g.save();
    g.translate(e.x, e.y);
    g.rotate(e.ang);
    g.fillStyle = '#2a3646';
    g.fillRect(-8, -7, 16, 14);
    g.fillStyle = e.sees ? '#ff3b3b' : '#ffd54a';
    g.fillRect(4, -3, 6, 6);
    g.restore();
  }

  function draw() {
    const g = ctx;
    g.clearRect(0, 0, CW, CH);
    g.drawImage(W.bg, 0, 0);
    drawDoor(g);
    drawTerminal(g);
    W.guards.forEach((e) => drawCone(g, e));
    W.cams.forEach((e) => drawCone(g, e));
    W.cams.forEach((e) => drawCam(g, e));

    const ents = W.guards.map((e) => ({ y: e.y, fn: () => drawGuard(g, e) }));
    ents.push({ y: W.py, fn: () => drawPlayer(g) });
    ents.sort((a, b) => a.y - b.y).forEach((o) => o.fn());

    g.drawImage(vignette, 0, 0);
    drawPrompt(g);

    if (W.flash > 0) {
      g.fillStyle = 'rgba(255,30,60,' + (Math.min(1, W.flash / 0.55) * 0.5).toFixed(3) + ')';
      g.fillRect(0, 0, CW, CH);
    }

    const lvl = LEVELS[state.levelIdx];
    g.font = 'bold 11px Consolas, "Courier New", monospace';
    g.textAlign = 'left';
    g.textBaseline = 'middle';
    const label = 'LEVEL ' + (state.levelIdx + 1) + ' • ' + lvl.place.toUpperCase();
    const lw = g.measureText(label).width + 14;
    g.fillStyle = 'rgba(4,10,8,.8)';
    g.fillRect(CW - lw - 6, 6, lw, 20);
    g.fillStyle = '#39ff88';
    g.fillText(label, CW - lw + 1, 16.5);

    if (W.msgT > 0) pill(g, W.msg, CW / 2, CH - 20, '#ffb347');
  }

  /* ---------- Loop ---------- */
  function frame(ts) {
    if (!running) return;
    if (!worldVisible()) { running = false; return; }
    const dt = Math.min(0.05, (ts - lastTs) / 1000 || 0);
    lastTs = ts;
    update(dt);
    if (!running) return;
    draw();
    requestAnimationFrame(frame);
  }

  function setGoal() {
    const lvl = LEVELS[state.levelIdx];
    $('world-title').textContent = 'Level ' + (state.levelIdx + 1) + ': ' + lvl.place;
    $('world-goal').textContent = state.doorOpen
      ? 'Terminal berhasil diretas. Pintu keluar sudah terbuka, jalan ke pintu hijau di dinding atas.'
      : 'Tujuan: dekati terminal, tekan E untuk membuka sandinya, lalu keluar lewat pintu.' +
        (ENEMIES[state.levelIdx].guards.length || ENEMIES[state.levelIdx].cams.length
          ? ' Hindari cahaya penjaga dan kamera: kalau ketahuan, kamu kembali ke titik awal (nyawa tidak berkurang).'
          : '');
  }

  function clearKeys() {
    keys.left = keys.right = keys.up = keys.down = false;
  }

  function openWorld() {
    if (!W.loaded || W.level !== state.levelIdx) loadLevel(state.levelIdx);
    W.exiting = false;
    renderHud();
    setGoal();
    show('screen-world');
    clearKeys();
    if (!running) {
      running = true;
      lastTs = performance.now();
      requestAnimationFrame(frame);
    }
  }

  function worldReset() {
    W.loaded = false;
  }

  /* ---------- Input ---------- */
  const KEYMAP = {
    ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
    ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
  };

  function isTyping(t) {
    return !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT');
  }

  function init() {
    canvas = $('world-canvas');
    if (!canvas) return;
    canvas.width = CW;
    canvas.height = CH;
    ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    buildVignette();

    window.addEventListener('keydown', (e) => {
      if (!worldVisible() || isTyping(e.target)) return;
      const k = KEYMAP[e.code];
      if (k) { keys[k] = true; e.preventDefault(); return; }
      if (e.code === 'KeyE' || e.code === 'Space' || e.code === 'Enter') {
        if (e.target && e.target.tagName === 'BUTTON') return;
        e.preventDefault();
        if (!e.repeat) interact();
      }
    });
    window.addEventListener('keyup', (e) => {
      const k = KEYMAP[e.code];
      if (k) keys[k] = false;
    });
    window.addEventListener('blur', clearKeys);

    document.querySelectorAll('.dp-btn').forEach((b) => {
      const dir = b.getAttribute('data-dir');
      const on = (e) => { e.preventDefault(); keys[dir] = true; };
      const off = (e) => { e.preventDefault(); keys[dir] = false; };
      b.addEventListener('pointerdown', on);
      b.addEventListener('pointerup', off);
      b.addEventListener('pointerleave', off);
      b.addEventListener('pointercancel', off);
    });
    $('btn-interact').addEventListener('click', interact);
  }

  window.openWorld = openWorld;
  window.worldReset = worldReset;
  window.WORLD_DATA = { MAPS, ENEMIES, TS, COLS, ROWS };
  window.c1phWorld = W;

  init();
})();
