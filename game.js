'use strict';

/* ============================================================
   c1ph3rth3ft
   Alur enkripsi siswa:
     1. plaintext -> angka   (tabel kuantifikasi)
     2. angka -> angka       (method enkripsi, berurutan)
     3. angka -> teks        (tabel dekuantifikasi)
   Teks hasil langkah 3 adalah kata/kalimat bermakna, dan
   dikirim dalam format flag: CYMT{teks}

   Kuantifikasi: spasi = 0, A-Z = 1..26, a-z = -1..-26
   Dekuantifikasi: angka di luar -26..26 dikembalikan ke rentang
   itu dengan menambah/mengurangi 53 (jumlah nilai dari -26..26).

   Method terakhir tiap level adalah "Fungsi Linear Berkunci":
   f(x_i) = a * x_i + k_i. Daftar kunci k dihitung otomatis supaya
   hasil akhirnya tepat menjadi flag yang bermakna.
   ============================================================ */

/* ---------- Utilitas ---------- */
const $ = (id) => document.getElementById(id);
const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/* ---------- Kuantifikasi (huruf -> angka) ---------- */
function charToNum(ch) {
  if (ch === ' ') return 0;
  const c = ch.charCodeAt(0);
  if (c >= 65 && c <= 90) return c - 64;
  if (c >= 97 && c <= 122) return -(c - 96);
  return 0;
}
const textToNums = (t) => Array.from(t).map(charToNum);

/* ---------- Dekuantifikasi (angka -> huruf) ---------- */
function wrapNum(n) {
  return ((((n + 26) % 53) + 53) % 53) - 26;
}

function numToChar(n) {
  const w = wrapNum(n);
  if (w === 0) return ' ';
  if (w > 0) return String.fromCharCode(64 + w);
  return String.fromCharCode(96 - w);
}
const numsToText = (arr) => arr.map(numToChar).join('');

/* ---------- Method (cipher) ---------- */
function swapPairs(arr) {
  const r = arr.slice();
  for (let i = 0; i + 1 < r.length; i += 2) {
    [r[i], r[i + 1]] = [r[i + 1], r[i]];
  }
  return r;
}

const FACTORY = {
  linear() {
    const a = pick([2, 3, 4, 5]);
    let b = rnd(-6, 9);
    if (b === 0) b = 2;
    return {
      title: 'Fungsi Linear',
      desc: `Ciphertext adalah ${a} kali lipat plaintext yang kemudian ${b < 0 ? 'dikurangi' : 'ditambah'} ${Math.abs(b)}.`,
      formula: `f(x) = ${a}x ${b < 0 ? '−' : '+'} ${Math.abs(b)}`,
      enc: (arr) => arr.map((x) => a * x + b),
    };
  },
  shift() {
    const k = rnd(2, 9) * pick([1, -1]);
    return {
      title: 'Geser Angka',
      desc: `Setiap angka ${k < 0 ? 'dikurangi' : 'ditambah'} ${Math.abs(k)}.`,
      formula: `g(x) = x ${k < 0 ? '−' : '+'} ${Math.abs(k)}`,
      enc: (arr) => arr.map((x) => x + k),
    };
  },
  negate() {
    return {
      title: 'Balik Tanda',
      desc: 'Setiap angka dikalikan negatif satu (positif jadi negatif dan sebaliknya; nol tetap nol).',
      formula: 'h(x) = −x',
      enc: (arr) => arr.map((x) => (x === 0 ? 0 : -x)),
    };
  },
  reverse() {
    return {
      title: 'Balik Urutan',
      desc: 'Urutan seluruh angka dibalik, dari belakang ke depan.',
      formula: '',
      enc: (arr) => arr.slice().reverse(),
    };
  },
  swap() {
    return {
      title: 'Tukar Pasangan',
      desc: 'Dua angka yang berdampingan saling bertukar posisi (1↔2, 3↔4, dst). Jika jumlah angka ganjil, angka terakhir tetap.',
      formula: '',
      enc: swapPairs,
    };
  },
};

/* Fungsi linear berkunci: kunci dihitung dari angka sebelum method ini
   dan target flag, sehingga a*x_i + k_i === target_i (mod 53). */
function makeLinearKey(before, target) {
  const a = pick([2, 3, 4, 5]);
  const k = before.map((x, i) => wrapNum(target[i] - a * x));
  return {
    title: 'Fungsi Linear Berkunci',
    desc: `Setiap angka dikali ${a}, lalu ditambah angka kunci pada urutan yang sama (kunci ke-1 untuk angka ke-1, kunci ke-2 untuk angka ke-2, dan seterusnya).`,
    formula: `f(x) = ${a}x + k`,
    keyList: k,
    enc: (arr) => arr.map((x, i) => a * x + k[i]),
  };
}

/* ---------- Data level ---------- */
const LEVELS = [
  {
    place: 'Gudang',
    lives: 10,
    glitchAt: 3,
    methods: ['linearKey'],
    helpers: { apply: true, toNum: true, toText: true },
    text: 'rongsokan',
    flag: 'tersimpan',
    story: 'Gudang barang bekas di pinggir kota. Panel pintunya hanya menerima flag berupa kata yang bermakna dan berkaitan dengan gudang. Satu method saja yang dipakai.',
  },
  {
    place: 'Rumah',
    lives: 8,
    glitchAt: 3,
    methods: ['reverse', 'linearKey'],
    helpers: { apply: true, toNum: true, toText: true },
    text: 'perabot antik',
    flag: 'pemilik rumah',
    story: 'Rumah seorang kolektor. Alarm pintarnya dikunci dengan dua method berlapis. Urutan method sangat menentukan, dan flag-nya menyebut siapa yang tinggal di sini.',
  },
  {
    place: 'Hotel',
    lives: 6,
    glitchAt: 3,
    methods: ['linear', 'swap', 'linearKey'],
    helpers: { apply: false, toNum: true, toText: true, calc: true },
    text: 'Kunci Kamar Tamu',
    flag: 'Lantai Penthouse',
    story: 'Hotel bintang lima. Panel lift menuju lantai atas dikunci dengan tiga method berlapis. Perhatikan huruf kapital, nilainya positif.',
  },
  {
    place: 'Laboratorium',
    lives: 4,
    glitchAt: 2,
    methods: ['linear', 'reverse', 'negate', 'linearKey'],
    helpers: { apply: false, toNum: false, toText: true, calc: true },
    text: 'Sampel Virus Disimpan Dalam Lemari Pendingin',
    flag: 'Formula Vaksin Berada Pada Ruang Bawah Tanah',
    story: 'Laboratorium riset rahasia. Pesannya jauh lebih panjang dan dikunci empat method. Satu karakter salah berarti alarm berbunyi.',
  },
  {
    place: 'Gedung Pemerintah',
    lives: 2,
    glitchAt: 1,
    methods: ['linear', 'shift', 'negate', 'reverse', 'linearKey'],
    helpers: { apply: false, toNum: false, toText: false, calc: true },
    text: 'Dokumen Rahasia Negara Disimpan Di Brankas Utama',
    flag: 'Kode Peluncuran Ada Di Ruang Kendali Lantai Tiga',
    story: 'Target terakhir. Penjagaan paling ketat: lima method sekaligus dan hanya dua kesempatan. Salah dua kali, kamu masuk penjara.',
  },
];

const BACKGROUNDS = [
  { id: 'peretas', name: 'Mantan Peretas Etis', text: 'Dulu bekerja sebagai penguji penetrasi, lalu dipecat karena melaporkan celah perusahaan sendiri.' },
  { id: 'mahasiswa', name: 'Mahasiswa Cyber Security', text: 'Terlilit utang kuliah dan pinjaman online, lalu memanfaatkan ilmunya untuk jalan pintas.' },
  { id: 'teknisi', name: 'Mantan Teknisi Alarm', text: 'Hafal cara kerja sistem keamanan karena pernah memasangnya di ratusan gedung.' },
  { id: 'yatim', name: 'Anak Jalanan Jenius', text: 'Belajar kriptografi sendiri dari warnet dan buku bekas, tumbuh tanpa keluarga.' },
];

/* ---------- State ---------- */
const state = {
  player: null,
  levelIdx: 0,
  lives: 0,
  plain: '',
  methods: [],
  expectedNums: [],
  expectedText: '',
  bgId: null,
};

/* ---------- Tampilan ---------- */
function show(id) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.add('hidden'));
  $(id).classList.remove('hidden');
  window.scrollTo(0, 0);
}

function renderHud() {
  const lvl = LEVELS[state.levelIdx];
  $('hud').classList.remove('hidden');
  $('hud-char').textContent = state.player.name;
  $('hud-level').textContent = `Level ${state.levelIdx + 1}/5 • ${lvl.place}`;
  /* Hati yang baru saja hilang (dibanding render sebelumnya) diberi efek ledakan glitch. */
  const prev = state.hudLives == null ? state.lives : state.hudLives;
  let hearts = '';
  for (let i = 0; i < lvl.lives; i++) {
    if (i < state.lives) {
      hearts += '❤';
    } else {
      const isNew = i >= state.lives && i < prev;
      hearts += `<span class="heart-lost${isNew ? ' heart-new' : ''}">❤</span>`;
    }
  }
  state.hudLives = state.lives;
  $('hud-lives').innerHTML = hearts;
  applyGlitch();
}

/* Glitch layar: mulai saat sisa nyawa <= glitchAt level (level 1-3: 3, level 4: 2, level 5: 1).
   Makin sedikit sisa nyawa, makin parah (tahap 1 sampai 3). */
const GLITCH_CLASSES = ['glitch', 'glitch-1', 'glitch-2', 'glitch-3'];

function clearGlitch() {
  GLITCH_CLASSES.forEach((c) => document.body.classList.remove(c));
}

function applyGlitch() {
  clearGlitch();
  if (!state.player || state.lives <= 0) return;
  const lvl = LEVELS[state.levelIdx];
  if (state.lives > lvl.glitchAt) return;
  const stage = Math.min(3, lvl.glitchAt - state.lives + 1);
  document.body.classList.add('glitch', 'glitch-' + stage);
}

/* Tabel: pairs = [[atas, bawah], ...], dipecah per 14 kolom */
function makeTable(title, pairs) {
  let html = `<div class="qt-title">${title}</div><div class="qt-scroll">`;
  for (let i = 0; i < pairs.length; i += 14) {
    const chunk = pairs.slice(i, i + 14);
    html += '<table class="qt"><tr class="top">' +
      chunk.map((p) => `<td>${p[0]}</td>`).join('') +
      '</tr><tr class="bot">' +
      chunk.map((p) => `<td>${p[1]}</td>`).join('') +
      '</tr></table>';
  }
  return html + '</div>';
}

function renderTables() {
  const capsQ = [], lowQ = [], capsD = [], lowD = [];
  for (let i = 1; i <= 26; i++) {
    capsQ.push([String.fromCharCode(64 + i), i]);
    lowQ.push([String.fromCharCode(96 + i), -i]);
    capsD.push([i, String.fromCharCode(64 + i)]);
    lowD.push([-i, String.fromCharCode(96 + i)]);
  }
  capsQ.push(['spasi', 0]);
  capsD.push([0, 'spasi']);

  $('qtable').innerHTML =
    makeTable('Kuantifikasi huruf kapital', capsQ) +
    makeTable('Kuantifikasi huruf kecil', lowQ);

  $('dtable').innerHTML =
    makeTable('Dekuantifikasi: angka positif menjadi huruf kapital', capsD) +
    makeTable('Dekuantifikasi: angka negatif menjadi huruf kecil', lowD) +
    '<div class="rule">Jika angka hasil method di luar <code>-26</code> sampai <code>26</code>, ' +
    'tambah atau kurangi <code>53</code> berulang kali sampai masuk rentang itu. ' +
    'Contoh: 30 − 53 = -23 menjadi <code>w</code>, dan -30 + 53 = 23 menjadi <code>W</code>.</div>';
}

/* ---------- Karakter ---------- */
function renderBackgrounds() {
  const box = $('bg-list');
  box.innerHTML = '';
  BACKGROUNDS.forEach((bg) => {
    const div = document.createElement('div');
    div.className = 'bg-card' + (state.bgId === bg.id ? ' selected' : '');
    div.innerHTML = `<b>${bg.name}</b><span>${bg.text}</span>`;
    div.addEventListener('click', () => {
      state.bgId = bg.id;
      renderBackgrounds();
    });
    box.appendChild(div);
  });
}

function startGame() {
  const name = $('char-name').value.trim();
  if (!name) {
    $('create-error').textContent = 'Isi nama samaranmu dulu.';
    return;
  }
  if (!state.bgId) {
    $('create-error').textContent = 'Pilih latar belakang pencuri.';
    return;
  }
  $('create-error').textContent = '';
  const bg = BACKGROUNDS.find((b) => b.id === state.bgId);
  state.player = { name, bg, note: $('char-note').value.trim() };
  state.levelIdx = 0;
  openBrief();
}

/* ---------- Level ---------- */
function openBrief() {
  const lvl = LEVELS[state.levelIdx];
  state.lives = lvl.lives;
  state.hudLives = null;
  renderHud();
  $('brief-title').textContent = `Level ${state.levelIdx + 1}: ${lvl.place}`;
  const intro = state.levelIdx === 0
    ? `${state.player.name}, ${state.player.bg.name.toLowerCase()}. ${state.player.bg.text}${state.player.note ? ' "' + state.player.note + '"' : ''} Malam ini kamu memulai aksi pertamamu. `
    : '';
  $('brief-story').textContent = intro + lvl.story;
  $('brief-stats').innerHTML =
    `Nyawa: <b>${lvl.lives}</b> &nbsp;|&nbsp; Method: <b>${lvl.methods.length}</b><br>` +
    'Ubah plaintext ke angka, terapkan method, lalu ubah angkanya kembali ke teks. Hasil yang benar adalah kata bermakna. Kirim dalam format CYMT{teks}. Flag salah mengurangi satu nyawa. Jika nyawa habis, polisi menangkapmu dan kamu harus membuat karakter baru.' +
    `<div class="rule">${helperNote(lvl)}</div>`;
  show('screen-brief');
}

/* Tombol bantu di meja kerja dimatikan bertahap: level 3 tanpa tombol terapkan method,
   level 4 juga tanpa konversi plaintext ke angka, level 5 tanpa bantuan sama sekali. */
function helperNote(lvl) {
  const h = lvl.helpers;
  const off = [];
  if (!h.apply) off.push('tombol "Terapkan ke meja kerja"');
  if (!h.toNum) off.push('tombol konversi plaintext ke angka');
  if (!h.toText) off.push('tombol konversi angka ke teks');
  if (!off.length) return 'Bantuan meja kerja: lengkap. Semua tombol bantu aktif.';
  return 'Mode manual: ' + off.join(', ') + ' dimatikan. Tentukan sendiri angka dan urutan methodnya, lalu gunakan tabel kuantifikasi dan dekuantifikasi.' +
    (h.calc ? ' Sebagai gantinya tersedia kalkulator untuk membantu aritmetikanya.' : ' Hitung sendiri, meja kerja hanya jadi catatan.');
}

function generatePuzzle() {
  const lvl = LEVELS[state.levelIdx];
  if (lvl.text.length !== lvl.flag.length) {
    throw new Error('Panjang plaintext dan flag harus sama pada level ' + (state.levelIdx + 1));
  }
  state.plain = lvl.text;
  const target = textToNums(lvl.flag);
  let arr = textToNums(state.plain);
  state.methods = lvl.methods.map((t) => {
    const m = t === 'linearKey' ? makeLinearKey(arr, target) : FACTORY[t]();
    arr = m.enc(arr);
    return m;
  });
  state.expectedNums = arr;
  state.expectedText = numsToText(arr);
}

function openPlay() {
  generatePuzzle();
  renderHud();
  const lvl = LEVELS[state.levelIdx];
  const h = lvl.helpers;
  $('btn-convert').classList.toggle('hidden', !h.toNum);
  $('btn-back').classList.toggle('hidden', !h.toText);
  $('work-preview-label').classList.toggle('hidden', !h.toText);
  $('work-preview').classList.toggle('hidden', !h.toText);
  $('work-label').textContent = (h.apply || h.toNum || h.toText)
    ? 'Meja kerja (opsional, untuk membantu hitungan)'
    : 'Meja kerja (hanya catatan, semua tombol bantu dimatikan)';
  $('work').placeholder = (h.apply || h.toNum || h.toText) ? 'angka dipisah spasi' : 'tulis hitunganmu di sini';
  $('calc-panel').classList.toggle('hidden', !h.calc);
  calcReset();
  $('play-title').textContent = `${lvl.place}: enkripsi pesannya`;
  $('plain').textContent = state.plain;
  $('feedback').textContent = '';
  $('feedback').className = 'feedback';
  $('answer').value = '';
  $('work').value = '';
  clearPreview();
  $('work-error').textContent = '';
  renderTables();
  renderMethods();
  show('screen-play');
  $('answer').focus();
}

function renderMethods() {
  const box = $('methods');
  box.innerHTML = '';
  state.methods.forEach((m, i) => {
    const el = document.createElement('div');
    el.className = 'method';
    el.innerHTML =
      `<div class="num">#${i + 1}</div>` +
      `<div><div class="title">${m.title}</div>` +
      `<div class="desc">${m.desc}</div>` +
      (m.formula ? `<div class="formula">${m.formula}</div>` : '') +
      (m.keyList
        ? makeTable('Daftar kunci k (kolom pertama untuk angka pertama):', m.keyList.map((v, j) => [j + 1, v]))
        : '') +
      '</div>';
    if (LEVELS[state.levelIdx].helpers.apply) {
      const btn = document.createElement('button');
      btn.className = 'btn small';
      btn.textContent = 'Terapkan ke meja kerja';
      btn.addEventListener('click', () => applyMethod(i));
      el.appendChild(btn);
    }
    box.appendChild(el);
  });
}

/* ---------- Meja kerja ---------- */
function parseNums(raw) {
  const s = raw.trim();
  if (!s) return [];
  const nums = s.split(/[\s,]+/).filter(Boolean).map(Number);
  return nums.some((n) => Number.isNaN(n)) ? null : nums;
}

/* Hasil konversi hanya muncul saat tombol 3 ditekan.
   Kalau angka di meja kerja berubah, hasil lama dihapus supaya tidak basi. */
function clearPreview() {
  $('work-preview').innerHTML = '';
}

function renderBreakdown(nums) {
  const text = numsToText(nums).replace(/ /g, '_');
  let html = '<div class="plain" style="font-size:20px;margin-bottom:8px"></div>';
  const rows = [];
  for (let i = 0; i < nums.length; i += 10) {
    const chunk = nums.slice(i, i + 10);
    rows.push(
      '<table class="qt">' +
      '<tr class="top">' + chunk.map((n) => `<td>${n}</td>`).join('') + '</tr>' +
      '<tr>' + chunk.map((n) => `<td>${wrapNum(n)}</td>`).join('') + '</tr>' +
      '<tr class="bot">' + chunk.map((n) => `<td>${numToChar(n) === ' ' ? '_' : numToChar(n)}</td>`).join('') + '</tr>' +
      '</table>'
    );
  }
  html += '<div class="qt-title">Baris 1: angka asli. Baris 2: setelah ditambah/dikurangi 53 (jika perlu). Baris 3: huruf.</div>' +
    '<div class="qt-scroll">' + rows.join('') + '</div>';
  $('work-preview').innerHTML = html;
  $('work-preview').querySelector('.plain').textContent = text;
}

function convertPlain() {
  if (!LEVELS[state.levelIdx].helpers.toNum) return;
  $('work').value = textToNums(state.plain).join(' ');
  $('work-error').textContent = '';
  clearPreview();
}

function applyMethod(i) {
  if (!LEVELS[state.levelIdx].helpers.apply) return;
  const nums = parseNums($('work').value);
  if (nums === null || nums.length === 0) {
    $('work-error').textContent = 'Meja kerja kosong atau berisi karakter selain angka. Konversi plaintext ke angka dulu.';
    return;
  }
  const m = state.methods[i];
  if (m.keyList && nums.length !== m.keyList.length) {
    $('work-error').textContent = `Method ini butuh tepat ${m.keyList.length} angka (sesuai jumlah kunci), sedangkan meja kerja berisi ${nums.length}.`;
    return;
  }
  $('work-error').textContent = '';
  $('work').value = m.enc(nums).join(' ');
  clearPreview();
}

function convertBack() {
  if (!LEVELS[state.levelIdx].helpers.toText) return;
  const nums = parseNums($('work').value);
  if (nums === null || nums.length === 0) {
    $('work-error').textContent = 'Meja kerja kosong atau berisi karakter selain angka.';
    return;
  }
  $('work-error').textContent = '';
  renderBreakdown(nums);
}

/* ---------- Kalkulator (level 3-5) ---------- */
/* Hanya aritmetika: angka, + - * / dan kurung. "ans" = hasil sebelumnya.
   Ekspresi dicek dengan whitelist karakter sebelum dihitung. */
const calc = { ans: null, history: [] };

function calcReset() {
  calc.ans = null;
  calc.history = [];
  $('calc-input').value = '';
  $('calc-out').textContent = '';
}

function evalExpr(src) {
  let s = src.trim().toLowerCase()
    .replace(/×/g, '*').replace(/÷/g, '/').replace(/[−–]/g, '-').replace(/,/g, '.');
  if (!s) return { error: 'Tulis ekspresinya dulu.' };
  if (s.includes('ans')) {
    if (calc.ans === null) return { error: 'Belum ada hasil sebelumnya untuk ans.' };
    s = s.replace(/ans/g, '(' + calc.ans + ')');
  }
  if (!/^[0-9+\-*/().\s]+$/.test(s) || s.includes('**')) {
    return { error: 'Hanya angka, + - * / dan kurung yang boleh dipakai.' };
  }
  let v;
  try {
    v = Function('"use strict"; return (' + s + ');')();
  } catch (e) {
    return { error: 'Ekspresi tidak valid. Cek kurung dan operatornya.' };
  }
  if (typeof v !== 'number' || !Number.isFinite(v)) return { error: 'Hasil tidak bisa dihitung (bagi nol?).' };
  return { value: Math.round(v * 1e6) / 1e6 };
}

function runCalc() {
  const src = $('calc-input').value;
  const r = evalExpr(src);
  let line;
  if (r.error) {
    line = r.error;
  } else {
    calc.ans = r.value;
    line = `${src.trim()} = ${r.value}`;
    if (Number.isInteger(r.value)) line += `\n   setelah ±53 (rentang -26 sampai 26): ${wrapNum(r.value)}`;
    $('calc-input').value = '';
  }
  calc.history.unshift(line);
  calc.history = calc.history.slice(0, 6);
  $('calc-out').textContent = calc.history.join('\n');
  $('calc-input').focus();
}

/* ---------- Animasi cyber error ---------- */
let cyberBusy = false;

const WARN_ICON =
  '<svg viewBox="0 0 64 64" aria-hidden="true">' +
  '<path d="M32 6 L61 56 H3 Z" fill="none" stroke="#ff4545" stroke-width="4" stroke-linejoin="round"/>' +
  '<rect x="29.5" y="22" width="5" height="19" rx="2" fill="#ff4545"/>' +
  '<circle cx="32" cy="48" r="3" fill="#ff4545"/></svg>';

function randomHexLines(count, width) {
  const chars = '0123456789ABCDEF';
  let out = '';
  for (let i = 0; i < count; i++) {
    let line = '';
    for (let j = 0; j < width; j++) {
      line += Math.random() < 0.18 ? ' ' : chars[Math.floor(Math.random() * 16)];
    }
    out += line + '\n';
  }
  return out;
}

/* Empat variasi animasi untuk jawaban salah (nyawa masih sisa):
   popup (CRITICAL ERROR), bsod (layar biru), trace (terminal pelacakan), lockdown (alarm).
   Dipilih acak, tidak pernah sama dua kali berturut-turut. */
const CYBER_VARIANTS = ['popup', 'bsod', 'trace', 'lockdown'];
let lastCyber = -1;

function pickCyberVariant() {
  let i;
  do { i = rnd(0, CYBER_VARIANTS.length - 1); } while (i === lastCyber);
  lastCyber = i;
  return CYBER_VARIANTS[i];
}

function hexStr(n) {
  let s = '';
  for (let i = 0; i < n; i++) s += '0123456789ABCDEF'[rnd(0, 15)];
  return s;
}

/* Setiap builder mengisi kontennya dan mengembalikan fungsi pembersih. */
function buildPopup(livesLeft) {
  $('cyber-rain').textContent = randomHexLines(60, 120);
  $('cyber-banner').innerHTML =
    'AKSES DITOLAK<small>NYAWA − 1 &nbsp;|&nbsp; SISA ' + livesLeft + '</small>';
  const pops = $('cyber-pops');
  pops.innerHTML = '';
  for (let i = 0; i < 6; i++) {
    const p = document.createElement('div');
    p.className = 'cyber-pop';
    p.style.left = (4 + Math.random() * 56) + '%';
    p.style.top = (4 + Math.random() * 56) + '%';
    p.style.animationDelay = (i * 0.14) + 's, 0s';
    p.innerHTML = WARN_ICON + '<b>CRITICAL ERROR</b><small>SYSTEM NOT RESPONDING</small>';
    pops.appendChild(p);
  }
  return () => { pops.innerHTML = ''; };
}

function buildBsod(livesLeft) {
  const box = $('cyber-bsod');
  box.innerHTML =
    '<div class="bsod-face">:(</div>' +
    '<div class="bsod-main">Sistem mengalami masalah karena flag tidak valid dan harus ditutup.</div>' +
    '<div class="bsod-pct"><span id="bsod-n">0</span>% selesai</div>' +
    '<div class="bsod-small">Kode berhenti: FLAG_INVALID_CHECKSUM (0x' + hexStr(8) + ')<br>' +
    'NYAWA − 1 &nbsp;|&nbsp; SISA ' + livesLeft + '</div>';
  let n = 0;
  const iv = setInterval(() => {
    n = Math.min(100, n + rnd(4, 11));
    const el = $('bsod-n');
    if (el) el.textContent = n;
  }, 120);
  return () => { clearInterval(iv); box.innerHTML = ''; };
}

function buildTrace(livesLeft) {
  const box = $('cyber-term');
  box.innerHTML = '';
  const lines = [
    ['root@c1ph3rth3ft:~$ verifikasi_flag --kirim', ''],
    ['mencocokkan checksum ........ GAGAL', 'err'],
    ['ACCESS DENIED (0x' + hexStr(4) + ')', 'err'],
    ['mencatat upaya intrusi ke log keamanan ...', ''],
    ['melacak lokasi penyusup ..... ' + rnd(62, 97) + '%', ''],
    ['NYAWA − 1  |  SISA ' + livesLeft, 'err'],
  ];
  const ids = lines.map((l, i) => setTimeout(() => {
    box.querySelectorAll('.tm-cursor').forEach((c) => c.remove());
    const d = document.createElement('div');
    d.className = 'tm-line' + (l[1] ? ' ' + l[1] : '');
    d.textContent = l[0];
    const cur = document.createElement('span');
    cur.className = 'tm-cursor';
    d.appendChild(cur);
    box.appendChild(d);
  }, i * 300));
  return () => { ids.forEach(clearTimeout); box.innerHTML = ''; };
}

function buildLockdown(livesLeft) {
  const box = $('cyber-lock');
  box.innerHTML =
    '<div class="lk-beam"></div><div class="lk-stripe lk-top"></div>' +
    '<div class="lk-center"><div class="lk-big">LOCKDOWN</div>' +
    '<div class="lk-sub">ALARM KEAMANAN AKTIF</div>' +
    '<div class="lk-sub2">NYAWA − 1 &nbsp;|&nbsp; SISA ' + livesLeft + '</div></div>' +
    '<div class="lk-stripe lk-bot"></div>';
  return () => { box.innerHTML = ''; };
}

const CYBER_BUILDERS = { popup: buildPopup, bsod: buildBsod, trace: buildTrace, lockdown: buildLockdown };

/* Menampilkan animasi salah (variasi acak, atau `forced` untuk pengujian),
   lalu memanggil done() setelah selesai. */
function cyberError(livesLeft, done, forced) {
  const variant = forced || pickCyberVariant();
  const overlay = $('cyber');
  cyberBusy = true;
  CYBER_VARIANTS.forEach((v) => overlay.classList.remove('mode-' + v));
  overlay.classList.add('mode-' + variant);
  const cleanup = CYBER_BUILDERS[variant](livesLeft);

  /* Mulai ulang animasi CSS dengan melepas lalu memasang kelas. */
  overlay.classList.remove('on');
  void overlay.offsetWidth;
  overlay.classList.add('on');
  overlay.setAttribute('aria-hidden', 'false');

  let closed = false;
  const startedAt = Date.now();
  function close() {
    if (closed) return;
    closed = true;
    overlay.classList.remove('on');
    overlay.setAttribute('aria-hidden', 'true');
    cleanup();
    cyberBusy = false;
    done();
  }
  overlay.onclick = () => { if (Date.now() - startedAt > 800) close(); };
  setTimeout(close, 2200);
}

/* Adegan nyawa habis: pencuri ditangkap polisi (menggantikan animasi error biasa).
   Memanggil done() setelah selesai atau saat diklik (setelah 1,5 detik). */
function arrestScene(name, done) {
  const overlay = $('arrest');
  const txt = $('arrest-text');
  cyberBusy = true;
  txt.textContent = '';
  txt.className = 'arrest-text';

  /* Mulai ulang animasi CSS dengan melepas lalu memasang kelas. */
  overlay.classList.remove('on');
  void overlay.offsetWidth;
  overlay.classList.add('on');
  overlay.setAttribute('aria-hidden', 'false');

  const timers = [];
  const at = (ms, fn) => timers.push(setTimeout(fn, ms));
  at(1600, () => { txt.textContent = 'POLISI! JANGAN BERGERAK!'; });
  at(2600, () => { txt.textContent = 'ANGKAT TANGANMU, ' + name.toUpperCase() + '!'; });
  at(3500, () => { txt.textContent = 'TERTANGKAP.'; txt.className = 'arrest-text final'; });

  let closed = false;
  const startedAt = Date.now();
  function close() {
    if (closed) return;
    closed = true;
    timers.forEach(clearTimeout);
    overlay.classList.remove('on');
    overlay.setAttribute('aria-hidden', 'true');
    cyberBusy = false;
    done();
  }
  overlay.onclick = () => { if (Date.now() - startedAt > 1500) close(); };
  at(5200, close);
}

/* ---------- Jawaban ---------- */
/* Flag wajib berformat CYMT{teks}. Mengembalikan teks di dalam kurung,
   atau null jika formatnya salah. */
function extractFlagText(raw) {
  const m = raw.trim().match(/^CYMT\{([\s\S]*)\}$/);
  if (!m) return null;
  return m[1].replace(/_/g, ' ').trim();
}

function checkAnswer() {
  const raw = $('answer').value;
  if (!raw.trim()) return;
  if (cyberBusy) return;
  const fb = $('feedback');

  const given = extractFlagText(raw);
  const formatOk = given !== null;
  const ok = formatOk && given === state.expectedText.trim();
  const flag = `CYMT{${state.expectedText.trim().replace(/ /g, '_')}}`;

  if (ok) {
    clearGlitch();
    const isLast = state.levelIdx === LEVELS.length - 1;
    if (isLast) {
      $('end-text').textContent =
        `${state.player.name} berhasil mengenkripsi pesan terakhir dan lolos dari gedung pemerintah tanpa tertangkap. Semua method diterapkan dengan benar. Flag terakhir:`;
      $('end-flag').textContent = flag;
      show('screen-end');
    } else {
      $('win-text').textContent =
        `Plaintext "${state.plain}" berhasil kamu enkripsi. Nyawa tersisa: ${state.lives}. Lokasi berikutnya: ${LEVELS[state.levelIdx + 1].place}. Flag level ini:`;
      $('win-flag').textContent = flag;
      show('screen-win');
    }
    return;
  }

  /* Setiap jawaban salah (termasuk format salah) mengurangi satu nyawa. */
  state.lives--;
  renderHud();
  const msg = formatOk
    ? `Flag salah. Sisa nyawa: ${state.lives}. Periksa lagi konversi huruf ke angka, urutan method, hitunganmu, dan konversi angka ke teks.`
    : `Format flag salah. Tulis lengkap dengan CYMT{ dan }, contoh: CYMT{hei}. Nyawa berkurang 1, sisa: ${state.lives}.`;

  /* Nyawa habis: bukan animasi error biasa, tapi adegan maling ditangkap polisi. */
  if (state.lives <= 0) {
    arrestScene(state.player.name, () => {
      $('jail-text').textContent =
        `Flag salah dan alarm berbunyi. ${state.player.name} tertangkap polisi di ${LEVELS[state.levelIdx].place} dan dijebloskan ke penjara. Karakter ini selesai. Buat karakter baru dan mulai dari awal.`;
      show('screen-jail');
    });
    return;
  }

  cyberError(state.lives, () => {
    fb.textContent = msg;
    fb.className = 'feedback bad shake';
    setTimeout(() => fb.classList.remove('shake'), 400);
  });
}

function newCharacter() {
  state.player = null;
  state.hudLives = null;
  clearGlitch();
  state.bgId = null;
  state.levelIdx = 0;
  $('char-name').value = '';
  $('char-note').value = '';
  $('hud').classList.add('hidden');
  renderBackgrounds();
  show('screen-create');
}

/* ---------- Event ---------- */
$('btn-start').addEventListener('click', startGame);
$('btn-go').addEventListener('click', openPlay);
$('btn-answer').addEventListener('click', checkAnswer);
$('answer').addEventListener('keydown', (e) => { if (e.key === 'Enter') checkAnswer(); });
$('btn-convert').addEventListener('click', convertPlain);
$('btn-back').addEventListener('click', convertBack);
$('btn-clear').addEventListener('click', () => {
  $('work').value = '';
  clearPreview();
  $('work-error').textContent = '';
});
$('work').addEventListener('input', clearPreview);
$('btn-calc').addEventListener('click', runCalc);
$('calc-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') runCalc(); });
$('btn-calc-clear').addEventListener('click', calcReset);
$('btn-next').addEventListener('click', () => { state.levelIdx++; openBrief(); });
$('btn-newchar').addEventListener('click', newCharacter);
$('btn-again').addEventListener('click', newCharacter);

renderBackgrounds();