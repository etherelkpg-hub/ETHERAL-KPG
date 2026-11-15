/* Procedural pixel-art character frames. Each frame is hand-placed pixel rects drawn
 * on a canvas, then outlined. Pure canvas so React (portraits) and Phaser share it. */

export interface Pal {
  hair: string; hairS: string; skin: string; skinS: string;
  top: string; topS: string; topH: string; inner: string;
  pants: string; pantsS: string; shoe: string; outline: string;
  style?: 'bun' | 'short' | 'long' | 'cap';
  beard?: boolean; glasses?: boolean;
  gear?: 'winter' | 'visor';
}
export const FW = 18;
export const FH = 26;
export const DIRS = ['down', 'left', 'right', 'up'] as const;
export type Dir = (typeof DIRS)[number];
type Ctx = CanvasRenderingContext2D;

const O = '#1d1820';
const EYE = '#2a1d1a';
export const PALS: Record<string, Pal> = {
  player: { hair: '#3a2418', hairS: '#24150d', skin: '#c98b5e', skinS: '#a56d47', top: '#2f6db5', topS: '#1f4a86', topH: '#5b95d8', inner: '#ece3cf', pants: '#4d4a3e', pantsS: '#37352c', shoe: '#efe8dc', outline: O, glasses: false },
  dad: { hair: '#a39e95', hairS: '#7a756d', skin: '#c48a63', skinS: '#9f6b4a', top: '#7b5a3c', topS: '#5c4229', topH: '#96714f', inner: '#d9cdb5', pants: '#3f4652', pantsS: '#2f343d', shoe: '#3b2a20', outline: O, beard: true, glasses: true },
  mom: { hair: '#4a2a22', hairS: '#33201a', skin: '#d29a72', skinS: '#ad7756', top: '#5f7d58', topS: '#465e41', topH: '#7d9a74', inner: '#e8d9c0', pants: '#6b4a5a', pantsS: '#523845', shoe: '#3b2a20', outline: O, style: 'bun' },
  staff: { hair: '#2b1d17', hairS: '#1a110c', skin: '#b57a52', skinS: '#91603f', top: '#24476a', topS: '#183350', topH: '#3a6690', inner: '#f0e9d8', pants: '#24304a', pantsS: '#1a2236', shoe: '#1f1a1c', outline: O, style: 'cap' },
  ped1: { hair: '#c79a4a', hairS: '#9c7432', skin: '#e2b08c', skinS: '#bf8e6c', top: '#b5533a', topS: '#8a3c29', topH: '#d17257', inner: '#f2e6d0', pants: '#3c4a5c', pantsS: '#2c3644', shoe: '#e9e2d6', outline: O, style: 'long' },
  ped2: { hair: '#1c1412', hairS: '#0f0a09', skin: '#7a4d33', skinS: '#5e3a26', top: '#d7a63e', topS: '#a87e2a', topH: '#ecc463', inner: '#2f2f35', pants: '#2c2b33', pantsS: '#1f1e25', shoe: '#c9452f', outline: O },
  ped3: { hair: '#6b3a24', hairS: '#4c2818', skin: '#d8a27c', skinS: '#b5815f', top: '#5b8a7a', topS: '#436a5d', topH: '#7aa999', inner: '#eee3cf', pants: '#7a6a55', pantsS: '#5c4f3f', shoe: '#3a2c24', outline: O, style: 'bun' },
  ped4: { hair: '#d8d2c6', hairS: '#aaa398', skin: '#c99a7a', skinS: '#a67a5c', top: '#7a4a6a', topS: '#5b3550', topH: '#9a6a8a', inner: '#e9dfcf', pants: '#46424a', pantsS: '#333037', shoe: '#2b2426', outline: O, glasses: true },
  'player-winter': { hair: '#d1793b', hairS: '#87462c', skin: '#c98b5e', skinS: '#a56d47', top: '#bd573d', topS: '#873b38', topH: '#e78253', inner: '#f3d4aa', pants: '#34465c', pantsS: '#263543', shoe: '#463844', outline: O, gear: 'winter' },
  'player-protected': { hair: '#cf9d56', hairS: '#735d51', skin: '#c98b5e', skinS: '#a56d47', top: '#c4bfc2', topS: '#746c7a', topH: '#f2dfc9', inner: '#a85d49', pants: '#8d8691', pantsS: '#5c5364', shoe: '#393440', outline: O, gear: 'visor' },
};

PALS.lorelai = { ...PALS.ped1, hair: '#302025', hairS: '#20171d', top: '#986381', topS: '#694357', topH: '#bd89a3' };
PALS.lelas = { ...PALS.ped3, hair: '#412824', hairS: '#2c1b20', style: 'long' };
PALS.news = { ...PALS.ped1, hair: '#38212b', hairS: '#23161f', top: '#963e49', topS: '#70303c', topH: '#bb5966' };

export function playerAppearance(map: string) {
  return map === 'atacama' || map === 'mcmurdo' ? 'player-winter' : map === 'haughton' ? 'player-protected' : 'player';
}

function outline(c: Ctx, x0: number, y0: number, w: number, h: number, col: string) {
  const img = c.getImageData(x0, y0, w, h);
  const d = img.data;
  const a = (x: number, y: number) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : d[(y * w + x) * 4 + 3]);
  const marks: number[] = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (a(x, y) > 0) continue;
    if (a(x - 1, y) || a(x + 1, y) || a(x, y - 1) || a(x, y + 1)) marks.push(x, y);
  }
  c.putImageData(img, x0, y0);
  c.fillStyle = col;
  for (let i = 0; i < marks.length; i += 2) c.fillRect(x0 + marks[i], y0 + marks[i + 1], 1, 1);
}

type DancePosition = 'first' | 'middle' | 'last';
interface Pose { leg: number; arm: number; bob: number; seat?: boolean; hands?: 'paper' | 'knit' | 'handheld'; hp?: number; sleep?: boolean; dance?: DancePosition }

function drawPerson(c: Ctx, ox: number, oy: number, dir: Dir, ps: Pose, p: Pal) {
  const flip = dir === 'left';
  const resting = ps.seat && !ps.hands;
  const P = (x: number, y: number, w: number, h: number, col: string, b = true) => {
    const xx = flip ? 16 - x - w : x;
    c.fillStyle = col;
    c.fillRect(ox + 1 + xx, oy + 1 + y + (b ? ps.bob + (resting ? 3 : 0) : 0), w, h);
  };
  const { leg, arm } = ps;
  const drawGear = () => {
    if (p.gear === 'winter') {
      P(3, 1, 10, 4, '#874333'); P(4, 0, 8, 3, '#d47544'); P(3, 3, 10, 2, '#edab71');
      P(4, 8, 8, 2, '#d9af76'); P(6, 10, 3, 2, '#e5c898');
    } else if (p.gear === 'visor') {
      P(3, 1, 10, 8, '#8e796e'); P(4, 0, 8, 3, '#e8d6bc'); P(4, 2, 8, 7, '#d8c8bc');
      if (dir === 'up') P(5, 4, 6, 4, '#a08f86');
      else {
        P(dir === 'down' ? 4 : 7, 4, dir === 'down' ? 8 : 6, 4, '#324d5c');
        P(dir === 'down' ? 5 : 8, 4, 4, 1, '#a6cbd0');
      }
    }
  };
  if (dir === 'left' || dir === 'right') {
    const lt = ps.seat ? 3 : 4;
    if (resting) {
      P(6, 19, 7, 3, p.pants, false); P(10, 21, 3, 3, p.pantsS, false);
      P(10, 23, 5, 2, p.shoe, false); P(10, 24, 5, 1, '#8c857a', false);
    } else {
      P(6 - leg, 17, 3, lt, p.pantsS, false); P(6 - leg, 17 + lt, 4, 2, p.shoe, false);
      P(7 + leg, 17, 3, lt, p.pants, false); P(7 + leg, 17 + lt, 4, 2, p.shoe, false);
      P(7 + leg, 17 + lt + 1, 4, 1, '#8c857a', false);
    }
    P(5, 10, 6, 7, p.top); P(5, 10, 1, 7, p.topS); P(10, 10, 1, 6, p.topH); P(10, 10, 1, 3, p.inner); P(5, 16, 6, 1, p.topS);
    if (resting) {
      P(7, 11, 2, 4, p.topS); P(8, 14, 4, 2, p.topS); P(11, 14, 2, 2, p.skin);
    } else {
      P(7, 10, 2, 3, p.topS); P(7 + arm, 13, 2, 3, p.topS); P(7 + arm, 16, 2, 1, p.skin);
    }
    P(5, 1, 7, 3, p.hair); P(4, 3, 4, 5, p.hair); P(8, 4, 4, 5, p.skin); P(8, 4, 3, 1, p.hair);
    P(12, 6, 1, 1, p.skin); P(10, 6, 1, 1, EYE); P(10, 5, 1, 1, p.hairS); P(7, 6, 1, 2, p.skinS);
    P(7, 9, 3, 1, p.skinS); P(10, 8, 1, 1, p.skinS); P(4, 7, 1, 1, p.hairS);
    if (p.style === 'bun') P(3, 1, 2, 3, p.hair);
    if (p.style === 'long') P(4, 7, 3, 3, p.hair);
    if (p.style === 'cap') { P(5, 0, 7, 2, p.top); P(11, 2, 3, 1, p.topS); }
    if (p.beard) P(9, 7, 3, 1, p.hairS);
    if (p.glasses) { P(9, 6, 3, 1, '#2a2a30'); P(10, 6, 1, 1, '#9fc3d6'); }
    drawGear();
    return;
  }
  const lt = ps.seat ? 3 : 4;
  const s = Math.sign(leg);
  const l1 = lt + (dir === 'down' ? s : -s), l2 = lt - (dir === 'down' ? s : -s);
  if (!ps.sleep) {
    if (resting) {
      P(3, 19, 10, 2, p.pantsS, false);
      for (const x of [3, 9]) {
        P(x, 20, 4, 3, p.pants, false);
        P(x, 23, 4, 2, p.shoe, false);
        P(x, 24, 4, 1, '#8c857a', false);
      }
    } else {
      P(4, 17, 4, l1, p.pants, false); P(8, 17, 4, l2, p.pants, false); P(7, 17, 2, Math.min(l1, l2), p.pantsS, false);
      P(4, 17 + l1, 4, 2, p.shoe, false); P(8, 17 + l2, 4, 2, p.shoe, false);
      P(4, 18 + l1, 4, 1, '#8c857a', false); P(8, 18 + l2, 4, 1, '#8c857a', false);
    }
    if (ps.dance) {
      P(3, 10, 10, 8, '#fff8e8');
      P(3, 17, 10, 5, '#f0e9db', false);
      P(2, 20, 12, 2, '#f0e9db', false);
      P(3, 13, 1, 7, '#c8bec0');
      P(11, 13, 1, 8, '#d7ccca');
      P(2, 21, 12, 1, '#c8bec0', false);
      P(7, 10, 2, 1, '#c8bec0'); P(8, 11, 1, 4, '#ddd3cc');
      P(5, 12, 2, 2, '#eee5d9');

      if (ps.dance === 'first') {
        P(1, 11, 2, 5, '#e8ded4'); P(1, 16, 2, 2, p.skin);
      } else {
        P(1, 11, 4, 3, '#fff8e8'); P(0, 12, 4, 2, '#e8ded4');
        P(-1, 12, 2, 2, p.skin); P(-1, 13, 2, 1, p.skinS);
      }
      if (ps.dance === 'last') {
        P(13, 11, 2, 5, '#e8ded4'); P(13, 16, 2, 2, p.skin);
      } else {
        P(11, 11, 4, 3, '#fff8e8'); P(12, 12, 4, 2, '#e8ded4');
        P(15, 12, 2, 2, p.skin); P(15, 13, 2, 1, p.skinS);
      }
    } else {
      P(3, 10, 10, 7, p.top); P(3, 10, 1, 7, p.topS); P(12, 10, 1, 7, p.topS); P(4, 10, 1, 6, p.topH); P(3, 16, 10, 1, p.topS);
      if (dir === 'down') { P(7, 10, 2, 5, p.inner); P(6, 10, 1, 2, p.topH); P(9, 10, 1, 2, p.topH); }
      else P(7, 11, 1, 5, p.topS);
    }
    if (ps.hands) {
      P(1, 10, 2, 4, p.top); P(13, 10, 2, 4, p.top); P(1, 10, 1, 4, p.topS); P(14, 10, 1, 4, p.topS);
      const hp = ps.hp ?? 0;
      if (ps.hands === 'paper') {
        P(2, 11 + hp, 12, 6, '#ece4cf'); P(3, 12 + hp, 10, 1, '#9b9282'); P(3, 14 + hp, 4, 1, '#9b9282'); P(8, 14 + hp, 5, 2, '#b8ab94');
        P(1, 13 + hp, 1, 2, p.skin); P(14, 13 + hp, 1, 2, p.skin);
      } else if (ps.hands === 'handheld') {
        P(2, 11, 12, 7, '#242630');
        P(2, 12, 2, 5, '#ee5156'); P(12, 12, 2, 5, '#38b9e7');
        P(4, 12, 8, 5, '#87c5b9');
        P(5 + hp, 14, 4, 2, '#426f80'); P(10, 13, 1, 1, '#fff1be');
        P(2, 14, 1, 1, '#692f45'); P(13, 14, 1, 1, '#254f74');
        P(1, 15, 2, 2, p.skin); P(13, 15, 2, 2, p.skin);
      } else {
        P(4, 14, 2, 1, p.skin); P(10, 14, 2, 1, p.skin);
        P(6 + hp, 12, 1, 3, '#d9c27a'); P(9 - hp, 12, 1, 3, '#d9c27a');
        P(6, 15, 4, 2, '#c4553f'); P(7, 15, 1, 1, '#e07b62');
      }
    } else if (resting) {
      P(1, 10, 2, 6, p.topS); P(13, 10, 2, 6, p.topS);
      P(2, 15, 4, 2, p.top); P(10, 15, 4, 2, p.top);
      P(5, 16, 2, 2, p.skin); P(9, 16, 2, 2, p.skin);
    } else if (!ps.dance) {
      const a1 = dir === 'down' ? arm : -arm;
      const cl = (n: number) => Math.max(-1, Math.min(1, n));
      P(1, 10, 2, 6 + cl(a1), p.top); P(1, 10, 1, 6 + cl(a1), p.topS); P(1, 16 + cl(a1), 2, 1, p.skin);
      P(13, 10, 2, 6 - cl(a1), p.top); P(14, 10, 1, 6 - cl(a1), p.topS); P(13, 16 - cl(a1), 2, 1, p.skin);
    }
    P(6, 9, 4, 1, p.skinS);
  }
  if (dir === 'down') {
    P(4, 1, 8, 3, p.hair); P(3, 3, 1, 4, p.hair); P(12, 3, 1, 4, p.hair); P(4, 4, 8, 5, p.skin);
    P(4, 4, 3, 1, p.hair); P(9, 4, 3, 1, p.hair); P(5, 2, 3, 1, p.hairS);
    P(3, 6, 1, 2, p.skinS); P(12, 6, 1, 2, p.skinS);
    if (ps.sleep) { P(5, 6, 2, 1, p.skinS); P(9, 6, 2, 1, p.skinS); }
    else { P(6, 6, 1, 1, EYE); P(9, 6, 1, 1, EYE); P(6, 5, 1, 1, p.hairS); P(9, 5, 1, 1, p.hairS); }
    P(7, 8, 2, 1, p.skinS); P(4, 8, 1, 1, p.skinS); P(11, 8, 1, 1, p.skinS);
    if (p.style === 'bun') P(6, 0, 4, 2, p.hair);
    if (p.style === 'long') { P(3, 7, 1, 4, p.hair); P(12, 7, 1, 4, p.hair); }
    if (p.style === 'cap') { P(4, 0, 8, 3, p.top); P(4, 3, 8, 1, p.topS); }
    if (p.beard) P(6, 7, 4, 1, p.hairS);
    if (p.glasses && !ps.sleep) { P(5, 6, 3, 1, '#2a2a30'); P(8, 6, 3, 1, '#2a2a30'); P(6, 6, 1, 1, '#9fc3d6'); P(9, 6, 1, 1, '#9fc3d6'); }
    if (ps.dance) {
      P(4, 0, 8, 4, '#fff0e5'); P(3, 3, 10, 2, '#fff0e5');
      P(2, 4, 3, 6, '#ebd5cb'); P(11, 4, 3, 6, '#ebd5cb');
      for (let y = 2; y < 10; y++) {
        const start = y < 4 ? 4 : 2;
        const end = y < 4 ? 12 : 14;
        for (let x = start; x < end; x++) {
          if ((y < 4 || x < 5 || x >= 11) && (x + y) % 2 === 0) P(x, y, 1, 1, '#b83c45');
        }
      }
      P(4, 1, 8, 1, '#30262c'); P(3, 2, 1, 2, '#30262c'); P(12, 2, 1, 2, '#30262c');
    }
  } else {
    P(4, 1, 8, 8, p.hair); P(3, 3, 1, 5, p.hair); P(12, 3, 1, 5, p.hair); P(4, 8, 8, 1, p.hairS);
    P(6, 3, 4, 1, p.hairS); P(3, 6, 1, 2, p.skin); P(12, 6, 1, 2, p.skin);
    if (p.style === 'bun') P(6, 0, 4, 3, p.hairS);
    if (p.style === 'long') P(4, 8, 8, 3, p.hair);
    if (p.style === 'cap') P(4, 0, 8, 3, p.top);
  }
  drawGear();
}

/** Sheet: 4 rows (down,left,right,up) x 10 cols (walk 0-3, run 4-7, idle 8-9). */
export function buildSheet(p: Pal): HTMLCanvasElement {
  const cv = document.createElement('canvas');
  cv.width = FW * 10; cv.height = FH * 4;
  const c = cv.getContext('2d')!;
  DIRS.forEach((dir, r) => {
    for (let f = 0; f < 10; f++) {
      let pose: Pose;
      if (f < 4) pose = { leg: [1, 0, -1, 0][f], arm: [1, 0, -1, 0][f], bob: [0, -1, 0, -1][f] };
      else if (f < 8) { const i = f - 4; pose = { leg: [2, 1, -2, -1][i], arm: [2, 1, -2, -1][i], bob: [-1, 0, -1, 0][i] }; }
      else pose = { leg: 0, arm: 0, bob: f === 9 ? 1 : 0 };
      if ((dir === 'down' || dir === 'up') && f >= 4 && f < 8) pose.arm = Math.sign(pose.arm);
      drawPerson(c, f * FW, r * FH, dir, pose, p);
      outline(c, f * FW, r * FH, FW, FH, p.outline);
    }
  });
  return cv;
}

export function buildDabkeSheet(p: Pal, dance: DancePosition): HTMLCanvasElement {
  const cv = document.createElement('canvas');
  cv.width = FW * 4; cv.height = FH;
  const c = cv.getContext('2d')!;
  for (const [frame, leg] of [1, 0, -1, 0].entries()) {
    drawPerson(c, frame * FW, 0, 'down', { leg, arm: 0, bob: frame % 2 ? -1 : 0, dance }, p);
    outline(c, frame * FW, 0, FW, FH, p.outline);
  }
  return cv;
}

export function buildSeated(p: Pal, hands?: Pose['hands'], dir: Dir = 'down'): HTMLCanvasElement {
  const cv = document.createElement('canvas');
  cv.width = FW * 2; cv.height = FH;
  const c = cv.getContext('2d')!;
  for (let f = 0; f < 2; f++) {
    drawPerson(c, f * FW, 0, dir, { leg: 0, arm: 0, bob: 0, seat: true, hands, hp: f }, p);
    outline(c, f * FW, 0, FW, FH, p.outline);
  }
  return cv;
}

export function buildSleeper(p: Pal): HTMLCanvasElement {
  const cv = document.createElement('canvas');
  cv.width = FW; cv.height = 12;
  const c = cv.getContext('2d')!;
  drawPerson(c, 0, 0, 'down', { leg: 0, arm: 0, bob: 0, sleep: true }, p);
  outline(c, 0, 0, FW, 12, p.outline);
  return cv;
}

const portraitCache: Record<string, string> = {};
export function portrait(key: string, bg: string): string {
  const id = key + bg;
  if (portraitCache[id]) return portraitCache[id];
  const p = PALS[key] ?? PALS.player;
  const sheet = buildSheet(p);
  const cv = document.createElement('canvas');
  cv.width = 22 * 8; cv.height = 22 * 8;
  const c = cv.getContext('2d')!;
  c.imageSmoothingEnabled = false;
  c.fillStyle = bg; c.fillRect(0, 0, cv.width, cv.height);
  c.fillStyle = 'rgba(255,240,210,0.08)';
  c.fillRect(0, 0, cv.width, cv.height / 2);
  c.drawImage(sheet, 8 * FW, 0, FW, 20, 2 * 8, 4 * 8, FW * 8, 20 * 8);
  return (portraitCache[id] = cv.toDataURL());
}
