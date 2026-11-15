/* Procedural pixel-art environment textures: floors, walls, small props, vehicles.
 * Drawn at 1x and scaled 3x in the world with nearest-neighbour filtering. */

type Ctx = CanvasRenderingContext2D;
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
function mk(w: number, h: number, fn: (c: Ctx, R: (x: number, y: number, w: number, h: number, col: string) => void) => void) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const c = cv.getContext('2d')!;
  const R = (x: number, y: number, ww: number, hh: number, col: string) => { c.fillStyle = col; c.fillRect(x, y, ww, hh); };
  fn(c, R);
  return cv;
}
function speckle(R: (x: number, y: number, w: number, h: number, col: string) => void, w: number, h: number, cols: string[], n: number) {
  for (let i = 0; i < n; i++) R(Math.floor(rnd() * w), Math.floor(rnd() * h), 1, 1, cols[Math.floor(rnd() * cols.length)]);
}

export function buildTextures(): Record<string, HTMLCanvasElement> {
  seed = 7;
  const T: Record<string, HTMLCanvasElement> = {};

  // ---------- floors ----------
  const plank = (base: string, seam: string, hi: string, knot: string) => mk(32, 32, (_c, R) => {
    R(0, 0, 32, 32, base);
    for (let r = 0; r < 4; r++) {
      const y = r * 8; R(0, y + 7, 32, 1, seam); R(0, y, 32, 1, hi);
      const off = (r * 13) % 32; R(off, y, 1, 7, seam);
      for (let k = 0; k < 3; k++) R(Math.floor(rnd() * 30), y + 2 + Math.floor(rnd() * 4), 2, 1, knot);
    }
  });
  T['floor-wood'] = plank('#b67d4b', '#7f512f', '#c99263', '#9b6a40');
  T['floor-hall'] = plank('#946043', '#5f3b26', '#a7704f', '#7d4f35');
  T['floor-kitchen'] = mk(32, 32, (_c, R) => {
    for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) R(x * 16, y * 16, 16, 16, (x + y) % 2 ? '#93ab98' : '#e9dec6');
    R(0, 15, 32, 1, '#b8ab90'); R(15, 0, 1, 32, '#b8ab90'); R(0, 31, 32, 1, '#b8ab90'); R(31, 0, 1, 32, '#b8ab90');
    speckle(R, 32, 32, ['#d8ccb2', '#7f9884'], 14);
  });
  T['floor-bath'] = mk(16, 16, (_c, R) => {
    R(0, 0, 16, 16, '#d5e5e5'); R(0, 7, 16, 1, '#a5bfc2'); R(7, 0, 1, 16, '#a5bfc2'); R(0, 15, 16, 1, '#a5bfc2'); R(15, 0, 1, 16, '#a5bfc2');
    R(1, 1, 3, 1, '#eaf3f2'); R(9, 9, 3, 1, '#eaf3f2');
  });
  T['terrazzo'] = mk(32, 32, (_c, R) => {
    R(0, 0, 32, 32, '#d8d0c0'); speckle(R, 32, 32, ['#b9ae9a', '#9a8f7c', '#e9e2d4', '#c9895c', '#7f9a90'], 70);
    R(0, 31, 32, 1, '#c3b9a7'); R(31, 0, 1, 32, '#c3b9a7');
  });
  T['asphalt'] = mk(32, 32, (_c, R) => { R(0, 0, 32, 32, '#4a4952'); speckle(R, 32, 32, ['#56555e', '#3e3d45', '#605e66'], 90); });
  T['sidewalk'] = mk(32, 32, (_c, R) => {
    R(0, 0, 32, 32, '#bfb29d'); R(0, 0, 32, 1, '#d2c7b3'); R(0, 31, 32, 1, '#9c907c'); R(31, 0, 1, 32, '#9c907c');
    speckle(R, 32, 32, ['#ad9f89', '#cbbfaa'], 40);
  });
  T['curb'] = mk(32, 4, (_c, R) => { R(0, 0, 32, 4, '#8e8474'); R(0, 0, 32, 1, '#d8cdb8'); });
  T['grass'] = mk(32, 32, (_c, R) => {
    R(0, 0, 32, 32, '#6e8f4f');
    for (let i = 0; i < 70; i++) { const x = Math.floor(rnd() * 32), y = Math.floor(rnd() * 31); R(x, y, 1, 2, rnd() > 0.5 ? '#86a85f' : '#5b7a42'); }
    for (let i = 0; i < 3; i++) R(Math.floor(rnd() * 30), Math.floor(rnd() * 30), 2, 2, rnd() > .5 ? '#e7d7a0' : '#d98a7a');
  });
  T['zebra'] = mk(8, 32, (_c, R) => { R(0, 0, 8, 32, '#4a4952'); R(0, 2, 8, 12, '#e6dfd0'); R(0, 18, 8, 12, '#e6dfd0'); });
  T['zebra-v'] = mk(32, 8, (_c, R) => { R(0, 0, 32, 8, '#4a4952'); R(2, 0, 12, 8, '#e6dfd0'); R(18, 0, 12, 8, '#e6dfd0'); });
  T['lane'] = mk(32, 2, (_c, R) => { R(0, 0, 18, 2, '#e8c35a'); });
  T['lane-v'] = mk(2, 32, (_c, R) => { R(0, 0, 2, 18, '#e8c35a'); });
  T['sand'] = mk(64, 64, (_c, R) => {
    R(0, 0, 64, 64, '#d98b56');
    for (let y = 4; y < 64; y += 9) for (let x = 0; x < 64; x++) { const yy = y + Math.round(Math.sin((x + y * 3) / 7) * 1.5); R(x, yy, 1, 1, '#c97a47'); R(x, yy - 1, 1, 1, '#e59f6c'); }
    speckle(R, 64, 64, ['#b56a3d', '#f0b07c', '#a85e34'], 80);
  });
  T['sand-path'] = mk(32, 32, (_c, R) => { R(0, 0, 32, 32, '#c4733f'); speckle(R, 32, 32, ['#b0643a', '#d6875a', '#e3a173', '#8f5333'], 120); });

  // ---------- walls ----------
  const paper = (base: string, a: string, b: string, kind: 'stripe' | 'dot' | 'tile' | 'damask') => mk(32, 32, (_c, R) => {
    R(0, 0, 32, 32, base);
    if (kind === 'stripe') for (let x = 0; x < 32; x += 8) { R(x, 0, 2, 32, a); R(x + 5, 0, 1, 32, b); }
    if (kind === 'dot') for (let y = 2; y < 32; y += 8) for (let x = (y % 16 ? 2 : 6); x < 32; x += 8) { R(x, y, 2, 2, a); R(x, y, 1, 1, b); }
    if (kind === 'tile') { for (let y = 0; y < 32; y += 6) { R(0, y, 32, 1, a); const off = (y / 6) % 2 ? 0 : 6; for (let x = off; x < 32; x += 12) R(x, y, 1, 6, a); } speckle(R, 32, 32, [b], 10); }
    if (kind === 'damask') for (let y = 4; y < 32; y += 16) for (let x = 4; x < 32; x += 16) { R(x + 3, y, 2, 8, a); R(x, y + 3, 8, 2, a); R(x + 3, y + 3, 2, 2, b); }
  });
  T['wp-bed'] = paper('#3e6b6f', '#4a7a7e', '#2f5558', 'stripe');
  T['wp-living'] = paper('#c39a63', '#b38953', '#d9b27c', 'damask');
  T['wp-hall'] = paper('#78886a', '#869777', '#66755a', 'dot');
  T['wp-kitchen'] = paper('#eee4d0', '#cdbfa5', '#d9cdb8', 'tile');
  T['wp-bath'] = paper('#b9d4d4', '#9dbcbd', '#d4e6e6', 'tile');
  T['wp-air'] = paper('#cfc6b6', '#bdb3a2', '#ddd5c7', 'tile');
  T['trim'] = mk(32, 8, (_c, R) => { R(0, 0, 32, 8, '#5a3a27'); R(0, 0, 32, 1, '#8a5d3f'); R(0, 7, 32, 1, '#3a2418'); R(0, 3, 32, 1, '#4a2f20'); });
  T['crown'] = mk(32, 4, (_c, R) => { R(0, 0, 32, 4, '#e9dcc0'); R(0, 3, 32, 1, '#b9a98a'); });
  T['walltop'] = mk(16, 16, (_c, R) => { R(0, 0, 16, 16, '#2c2430'); R(0, 0, 16, 1, '#4a3f4f'); speckle(R, 16, 16, ['#342b38', '#26202a'], 18); });

  // ---------- home small props ----------
  T['nightstand'] = mk(18, 26, (_c, R) => {
    R(2, 14, 14, 11, '#7a4c2c'); R(2, 12, 14, 3, '#a26a40'); R(2, 12, 14, 1, '#c08556'); R(3, 17, 12, 1, '#5a361f'); R(8, 19, 2, 1, '#e0c070');
    R(3, 21, 12, 1, '#5a361f'); R(2, 24, 2, 2, '#4a2c19'); R(14, 24, 2, 2, '#4a2c19');
    R(7, 9, 4, 3, '#4b3b33'); R(8, 6, 2, 3, '#4b3b33'); R(4, 1, 10, 6, '#f3dfa8'); R(4, 6, 10, 1, '#d4b06f'); R(5, 2, 2, 3, '#fff1c9');
  });
  T['rug-bed'] = mk(56, 30, (_c, R) => {
    R(0, 0, 56, 30, '#9a4a3c'); R(2, 2, 52, 26, '#d8b67a'); R(4, 4, 48, 22, '#3f6466'); R(6, 6, 44, 18, '#c56a4c');
    for (let x = 10; x < 48; x += 8) { R(x, 12, 4, 6, '#e8c98f'); R(x + 1, 13, 2, 4, '#3f6466'); }
    for (let x = 0; x < 56; x += 3) { R(x, 0, 1, 1, '#e8c98f'); R(x, 29, 1, 1, '#e8c98f'); }
  });
  T['rug-living'] = mk(80, 40, (_c, R) => {
    R(0, 0, 80, 40, '#6d3b3b'); R(2, 2, 76, 36, '#e3c58c'); R(5, 5, 70, 30, '#2f5a5f'); R(8, 8, 64, 24, '#b9644a');
    for (let i = 0; i < 6; i++) { R(14 + i * 9, 14, 6, 12, '#e3c58c'); R(15 + i * 9, 16, 4, 8, '#2f5a5f'); R(16 + i * 9, 18, 2, 4, '#e3c58c'); }
  });
  const poster = (bg: string, planet: string, dark: string, label: string) => mk(16, 22, (_c, R) => {
    R(0, 0, 16, 22, '#2a2124'); R(1, 1, 14, 20, bg); R(4, 4, 8, 8, planet); R(3, 6, 10, 4, planet); R(5, 5, 3, 2, dark); R(9, 8, 2, 2, dark);
    R(2, 15, 12, 1, label); R(3, 17, 10, 1, label); R(5, 19, 6, 1, label); R(2, 2, 1, 1, '#fff7e0'); R(12, 3, 1, 1, '#fff7e0');
  });
  T['poster-mars'] = poster('#1e2b44', '#c8613b', '#8e3d22', '#e8b46a');
  T['poster-moon'] = poster('#22243a', '#c9c5bb', '#8f8b84', '#9fc3d6');
  T['window'] = mk(48, 32, (_c, R) => {
    R(0, 0, 48, 32, '#5b3a26'); R(2, 2, 44, 26, '#f2b98a');
    for (let y = 2; y < 28; y++) { const t = (y - 2) / 26; R(2, y, 44, 1, t < .4 ? '#86b7c9' : t < .7 ? '#c9d7c8' : '#f2c79a'); }
    const sky = [[4, 18, 5, 10], [10, 14, 4, 14], [15, 20, 6, 8], [22, 11, 5, 17], [28, 16, 7, 12], [36, 19, 4, 9], [41, 13, 4, 15]];
    sky.forEach(([x, y, w, h]) => { R(x, y, w, h, '#5d6f80'); for (let yy = y + 2; yy < 27; yy += 3) R(x + 1, yy, 1, 1, '#f5d58a'); });
    R(2, 26, 44, 2, '#4f5f6c'); R(23, 2, 2, 26, '#5b3a26'); R(2, 14, 44, 1, '#5b3a26');
    R(0, 28, 48, 4, '#7d5236'); R(0, 28, 48, 1, '#a0714f');
    R(0, 0, 6, 30, '#c46a52'); R(42, 0, 6, 30, '#c46a52'); R(1, 0, 1, 30, '#a8513d'); R(45, 0, 1, 30, '#a8513d');
  });
  T['painting'] = mk(22, 16, (_c, R) => {
    R(0, 0, 22, 16, '#c9a050'); R(1, 1, 20, 14, '#8f6c2c'); R(2, 2, 18, 12, '#9dc0c4'); R(2, 8, 18, 6, '#d48b56'); R(6, 5, 8, 5, '#b86a3e'); R(13, 4, 3, 3, '#f4e3a8');
  });
  T['painting2'] = mk(18, 22, (_c, R) => {
    R(0, 0, 18, 22, '#3b2a20'); R(1, 1, 16, 20, '#e7dcc3'); R(3, 3, 12, 16, '#2f5a5f'); R(5, 10, 8, 9, '#c56a4c'); R(7, 5, 4, 4, '#e8c35a');
  });
  T['photos'] = mk(30, 12, (_c, R) => {
    [[0, 1, 9, 10], [11, 0, 8, 12], [21, 2, 9, 8]].forEach(([x, y, w, h], i) => {
      R(x, y, w, h, '#3b2a20'); R(x + 1, y + 1, w - 2, h - 2, ['#c9b48d', '#9db0a8', '#d6a98a'][i]);
      R(x + 2, y + h - 5, 2, 3, '#5a3a2a'); R(x + 4, y + h - 6, 2, 4, '#7a4c3a'); R(x + 2, y + h - 7, 2, 2, '#c48a63'); R(x + 4, y + h - 8, 2, 2, '#c48a63');
    });
  });
  T['floorlamp'] = mk(10, 34, (_c, R) => {
    R(1, 0, 8, 8, '#f3dfa8'); R(1, 7, 8, 1, '#c99a5a'); R(2, 1, 2, 5, '#fff3cf'); R(4, 8, 2, 23, '#3b3330'); R(2, 31, 6, 3, '#2b2420');
  });
  T['coatstand'] = mk(14, 34, (_c, R) => {
    R(6, 2, 2, 30, '#5a3a27'); R(3, 31, 8, 3, '#3b2418'); R(2, 4, 10, 1, '#5a3a27');
    R(1, 5, 5, 12, '#7b2f2f'); R(8, 5, 5, 10, '#3d566e'); R(1, 5, 1, 12, '#5a2020'); R(4, 0, 6, 3, '#b58a4c');
  });
  T['shoerack'] = mk(26, 12, (_c, R) => {
    R(0, 2, 26, 10, '#7a4c2c'); R(0, 2, 26, 1, '#a26a40'); R(1, 6, 24, 1, '#5a361f');
    R(2, 3, 5, 2, '#efe8dc'); R(9, 3, 5, 2, '#2f2a2c'); R(16, 3, 6, 2, '#b5533a'); R(3, 8, 6, 2, '#3b2a20'); R(13, 8, 6, 2, '#c9a050');
  });
  T['mat'] = mk(28, 12, (_c, R) => { R(0, 0, 28, 12, '#7d5a3c'); R(2, 2, 24, 8, '#a57a50'); for (let x = 3; x < 25; x += 2) R(x, 3, 1, 6, '#8f6844'); });
  T['coffee'] = mk(28, 24, (c, R) => {
    c.fillStyle = '#594038';
    c.beginPath(); c.ellipse(14, 20, 10, 3, 0, 0, Math.PI * 2); c.fill();
    R(12, 11, 4, 10, '#66432e'); R(13, 12, 1, 8, '#a37149'); R(8, 20, 12, 2, '#47332c');
    c.fillStyle = '#634534';
    c.beginPath(); c.ellipse(14, 10, 13, 6, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#bc8b5d';
    c.beginPath(); c.ellipse(14, 8, 12, 5, 0, 0, Math.PI * 2); c.fill();
    R(7, 6, 5, 4, '#d5bf95'); R(16, 4, 4, 5, '#f3e8d1'); R(20, 5, 2, 2, '#f3e8d1'); R(17, 4, 2, 1, '#67412d');
  });
  T['fridge'] = mk(18, 36, (_c, R) => {
    R(1, 0, 16, 36, '#dfe4df'); R(1, 0, 16, 1, '#f4f6f2'); R(15, 0, 2, 36, '#b8c0bb'); R(1, 13, 16, 1, '#9aa39e');
    R(3, 4, 1, 6, '#7f8a85'); R(3, 16, 1, 8, '#7f8a85'); R(6, 18, 3, 3, '#e8c35a'); R(10, 20, 3, 3, '#c56a4c'); R(7, 23, 4, 3, '#9db0a8');
  });
  T['pendant'] = mk(14, 10, (_c, R) => { R(6, 0, 2, 4, '#3b3330'); R(2, 4, 10, 5, '#2f5a5f'); R(3, 9, 8, 1, '#f3dfa8'); });
  T['tvglow'] = mk(4, 4, (_c, R) => { R(0, 0, 4, 4, '#9fd0ff'); });
  T['frontdoor'] = mk(30, 6, (_c, R) => { R(0, 0, 30, 6, '#6a4024'); R(0, 0, 30, 1, '#8a5a36'); R(13, 2, 4, 2, '#e0c070'); });

  // ---------- city ----------
  T['tree'] = mk(42, 56, (_c, R) => {
    R(18, 34, 6, 20, '#5a3a22'); R(18, 34, 2, 20, '#7a5232'); R(14, 52, 14, 4, '#3f5a33');
    const blob = (x: number, y: number, r: number, col: string) => { for (let yy = -r; yy <= r; yy++) { const w = Math.round(Math.sqrt(r * r - yy * yy)); R(x - w, y + yy, w * 2, 1, col); } };
    blob(21, 22, 16, '#3f6a3a'); blob(14, 18, 10, '#4f7d44'); blob(28, 16, 10, '#4f7d44'); blob(21, 10, 9, '#5f9150'); blob(16, 12, 4, '#78a862'); blob(26, 22, 4, '#2f5530');
    speckle(R, 42, 34, [], 0);
  });
  T['bush'] = mk(24, 14, (_c, R) => {
    R(2, 4, 20, 10, '#4f7d44'); R(4, 2, 16, 4, '#5f9150'); R(6, 1, 6, 2, '#78a862'); R(2, 12, 20, 2, '#3f6a3a'); R(8, 6, 2, 2, '#e88a7a'); R(15, 5, 2, 2, '#f0d27a');
  });
  T['bench'] = mk(30, 16, (_c, R) => {
    R(1, 2, 28, 3, '#8a5a36'); R(1, 6, 28, 3, '#a26a40'); R(1, 6, 28, 1, '#c08556'); R(2, 9, 2, 6, '#3b3330'); R(26, 9, 2, 6, '#3b3330'); R(2, 1, 2, 8, '#3b3330'); R(26, 1, 2, 8, '#3b3330');
  });
  T['streetlight'] = mk(16, 60, (_c, R) => {
    R(7, 6, 2, 52, '#3a4048'); R(7, 6, 1, 52, '#59616b'); R(4, 56, 8, 4, '#2b3036'); R(8, 4, 7, 2, '#3a4048'); R(11, 6, 5, 3, '#f3dfa8'); R(11, 8, 5, 1, '#c9a050');
  });
  T['signal'] = mk(12, 50, (_c, R) => { R(5, 14, 2, 34, '#3a4048'); R(3, 47, 6, 3, '#2b3036'); R(2, 0, 8, 16, '#2b3036'); R(3, 1, 6, 14, '#1f2328'); });
  T['dot'] = mk(4, 4, (_c, R) => { R(1, 0, 2, 4, '#fff'); R(0, 1, 4, 2, '#fff'); });
  T['hydrant'] = mk(8, 12, (_c, R) => { R(2, 2, 4, 9, '#c4553f'); R(1, 4, 6, 2, '#a8432f'); R(3, 0, 2, 2, '#c4553f'); R(2, 11, 4, 1, '#5a2a20'); });
  T['bin'] = mk(10, 14, (_c, R) => { R(1, 2, 8, 12, '#3f5a4a'); R(0, 1, 10, 2, '#2f4438'); R(2, 4, 1, 8, '#557a64'); });
  T['planter'] = mk(26, 18, (_c, R) => {
    R(1, 10, 24, 8, '#9a6a4a'); R(1, 10, 24, 1, '#b8866a'); R(3, 3, 20, 8, '#4f7d44'); R(5, 1, 6, 3, '#5f9150'); R(14, 2, 7, 2, '#5f9150');
    R(6, 5, 2, 2, '#e88a7a'); R(12, 4, 2, 2, '#f0d27a'); R(18, 6, 2, 2, '#e88a7a');
  });
  const carH = (body: string, dark: string, light: string, taxi = false) => mk(48, 24, (_c, R) => {
    R(2, 9, 44, 10, body); R(2, 9, 44, 1, light); R(2, 18, 44, 1, dark); R(10, 3, 24, 7, body); R(10, 3, 24, 1, light);
    R(12, 4, 9, 5, '#9fc3d6'); R(23, 4, 9, 5, '#9fc3d6'); R(12, 4, 3, 2, '#d7ecf4'); R(21, 4, 2, 5, dark);
    R(44, 11, 2, 3, '#f8e7a0'); R(2, 11, 2, 3, '#c4553f'); R(20, 12, 4, 1, dark);
    R(7, 17, 8, 6, '#1f1c22'); R(33, 17, 8, 6, '#1f1c22'); R(9, 19, 4, 2, '#8a8690'); R(35, 19, 4, 2, '#8a8690');
    if (taxi) { R(19, 1, 6, 2, '#2b2420'); R(20, 1, 4, 1, '#f8e7a0'); for (let x = 4; x < 44; x += 4) R(x, 15, 2, 1, '#2b2420'); }
  });
  const carV = (body: string, dark: string, light: string, taxi = false) => mk(24, 40, (_c, R) => {
    R(3, 4, 18, 34, body); R(3, 4, 1, 34, light); R(20, 4, 1, 34, dark); R(5, 8, 14, 8, '#9fc3d6'); R(5, 8, 14, 2, '#d7ecf4');
    R(5, 18, 14, 10, light); R(5, 30, 14, 5, '#9fc3d6'); R(4, 4, 4, 2, '#f8e7a0'); R(16, 4, 4, 2, '#f8e7a0'); R(4, 36, 4, 2, '#c4553f'); R(16, 36, 4, 2, '#c4553f');
    R(1, 9, 2, 7, '#1f1c22'); R(21, 9, 2, 7, '#1f1c22'); R(1, 27, 2, 7, '#1f1c22'); R(21, 27, 2, 7, '#1f1c22');
    if (taxi) { R(8, 20, 8, 3, '#2b2420'); R(9, 21, 6, 1, '#f8e7a0'); }
  });
  const cars: [string, string, string, boolean][] = [
    ['#c4553f', '#8a3527', '#e07b62', false], ['#e8b83a', '#a8822a', '#f4d36a', true], ['#3d6f8e', '#284c63', '#5f93b3', false],
    ['#e6dfd0', '#a8a090', '#fffaf0', false], ['#4f7d5a', '#365742', '#6fa07a', false], ['#6b4a7a', '#4a3156', '#8d6a9c', false],
  ];
  cars.forEach(([a, b, c, t], i) => { T[`car-h-${i}`] = carH(a, b, c, t); T[`car-v-${i}`] = carV(a, b, c, t); });

  // ---------- airport ----------
  T['airport-vase'] = mk(24, 32, (_c, R) => {
    R(7, 15, 10, 4, '#2f584e');
    R(4, 9, 7, 7, '#43734f'); R(6, 7, 4, 5, '#638c57');
    R(13, 9, 7, 7, '#3a6b4e'); R(16, 6, 4, 5, '#56805a');
    R(10, 4, 4, 13, '#54825a'); R(11, 3, 2, 4, '#78a468');
    R(3, 8, 4, 3, '#c9798c'); R(10, 1, 4, 3, '#f1d5a7'); R(17, 5, 4, 3, '#e7a5ad');
    R(5, 9, 1, 1, '#ffe5be'); R(11, 2, 1, 1, '#fff1ca'); R(18, 6, 1, 1, '#fff1ca');
    R(4, 17, 16, 3, '#45576a'); R(5, 18, 14, 2, '#b4bfc6');
    R(6, 20, 12, 9, '#6e879b'); R(7, 21, 2, 7, '#a7b8c5');
    R(15, 21, 2, 7, '#52697e'); R(7, 29, 10, 2, '#43596b');
  });
  T['checkin'] = mk(52, 34, (_c, R) => {
    R(2, 13, 48, 20, '#283c50'); R(4, 14, 44, 16, '#3d566e');
    R(6, 19, 40, 10, '#4a6680'); R(6, 19, 40, 1, '#7793a2'); R(4, 30, 44, 3, '#263546');
    R(1, 9, 50, 8, '#d8cfbd'); R(2, 9, 48, 2, '#f4e9d4'); R(1, 15, 50, 2, '#968c83');
    R(15, 0, 17, 9, '#293240'); R(17, 1, 13, 6, '#7fc4c9'); R(18, 2, 8, 1, '#e7fbff');
    R(22, 8, 3, 3, '#293240'); R(18, 11, 12, 2, '#646b73'); R(36, 10, 7, 4, '#ba966a');
  });
  T['kiosk'] = mk(18, 32, (_c, R) => {
    R(3, 10, 12, 22, '#2b3c4c'); R(3, 10, 12, 1, '#4a6680'); R(1, 0, 16, 12, '#1f2328'); R(2, 1, 14, 9, '#7fc4c9'); R(3, 2, 6, 1, '#e7fbff'); R(3, 4, 10, 1, '#e8c35a'); R(3, 6, 8, 1, '#e7fbff');
    R(5, 16, 8, 3, '#1f2328'); R(6, 17, 6, 1, '#c9895c'); R(2, 30, 14, 2, '#1f2328');
  });
  T['airbench'] = mk(64, 16, (_c, R) => {
    for (let i = 0; i < 5; i++) { R(2 + i * 12, 2, 11, 9, '#3d6f8e'); R(2 + i * 12, 2, 11, 2, '#5f93b3'); R(2 + i * 12, 10, 11, 1, '#284c63'); }
    R(0, 11, 64, 2, '#8a8690'); R(4, 13, 2, 3, '#5a5660'); R(58, 13, 2, 3, '#5a5660');
  });
  T['luggage'] = mk(10, 14, (_c, R) => { R(1, 3, 8, 11, '#c4553f'); R(1, 3, 8, 1, '#e07b62'); R(4, 0, 2, 3, '#3b3330'); R(1, 7, 8, 1, '#8a3527'); });
  T['barrier'] = mk(40, 14, (_c, R) => { R(2, 2, 3, 12, '#8a8690'); R(35, 2, 3, 12, '#8a8690'); R(4, 4, 32, 2, '#c4553f'); R(1, 12, 5, 2, '#5a5660'); R(34, 12, 5, 2, '#5a5660'); });
  T['airwindow'] = mk(64, 40, (_c, R) => {
    for (let y = 0; y < 26; y++) R(0, y, 64, 1, y < 10 ? '#8cc1d4' : y < 18 ? '#b9dbe0' : '#e6d9bb');
    R(0, 26, 64, 14, '#7a7f86'); R(0, 30, 64, 1, '#e8c35a'); R(6, 20, 26, 5, '#eef2f0'); R(26, 15, 6, 6, '#eef2f0'); R(14, 22, 10, 2, '#3d566e'); R(4, 21, 3, 2, '#c4553f');
    R(0, 0, 2, 40, '#3b4048'); R(0, 0, 64, 2, '#3b4048'); R(0, 38, 64, 2, '#3b4048');
  });
  T['board'] = mk(96, 40, (_c, R) => { R(0, 0, 96, 40, '#1a1d22'); R(2, 2, 92, 36, '#101216'); R(0, 0, 96, 2, '#3b4048'); R(40, 38, 2, 2, '#3b4048'); });

  // ---------- desert ----------
  T['shrub'] = mk(20, 12, (_c, R) => {
    R(3, 5, 14, 6, '#7d7a45'); R(5, 3, 10, 3, '#949058'); R(1, 8, 4, 3, '#6a673a'); R(15, 7, 4, 3, '#6a673a'); R(8, 1, 2, 3, '#a8a368'); R(2, 11, 16, 1, '#8f5333');
  });
  T['stone'] = mk(14, 8, (_c, R) => { R(2, 2, 10, 5, '#9a5a3a'); R(3, 1, 7, 2, '#b8714a'); R(1, 7, 12, 1, '#7a4428'); R(4, 2, 2, 1, '#d08a5e'); });
  T['marker'] = mk(20, 34, (_c, R) => {
    R(9, 6, 2, 26, '#e6dfd0'); R(9, 6, 1, 26, '#ffffff'); R(11, 6, 8, 6, '#e8913a'); R(11, 11, 8, 1, '#b5682a'); R(12, 7, 2, 2, '#f6d39a');
    R(3, 20, 2, 12, '#3b3330'); R(15, 20, 2, 12, '#3b3330'); R(6, 18, 8, 4, '#2f5a5f'); R(7, 19, 4, 2, '#9fd0d0'); R(2, 32, 16, 2, '#8f5333');
  });
  T['jeep'] = mk(52, 28, (_c, R) => {
    R(2, 10, 48, 11, '#d9c9a0'); R(2, 10, 48, 1, '#efe2bf'); R(2, 20, 48, 1, '#a8987a'); R(18, 2, 20, 9, '#d9c9a0'); R(20, 3, 7, 6, '#9fc3d6'); R(29, 3, 7, 6, '#9fc3d6');
    R(40, 6, 4, 4, '#3b3330'); R(46, 12, 3, 3, '#f8e7a0'); R(7, 18, 9, 9, '#1f1c22'); R(36, 18, 9, 9, '#1f1c22'); R(10, 21, 3, 3, '#8a8690'); R(39, 21, 3, 3, '#8a8690');
    R(4, 12, 10, 4, '#2f5a5f'); R(5, 13, 8, 1, '#e8913a');
  });

  // ---------- light ----------
  T['glow'] = (() => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 128;
    const c = cv.getContext('2d')!;
    const g = c.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,0.45)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.fillRect(0, 0, 128, 128);
    return cv;
  })();
  return T;
}

/** Textures drawn smoothly (not pixel-art scaled) should skip nearest filtering. */
export const SMOOTH_TEXTURES = ['glow'];
