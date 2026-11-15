import Phaser from 'phaser';
import { buildDabkeSheet, buildSeated, buildSheet, buildSleeper, DIRS, FH, FW, PALS, type Pal } from '../art/characters';
import { buildTextures } from '../art/textures';
import { store } from '../store';

function registerWadiCharacters(scene: Phaser.Scene) {
  const jackets = [
    ['#a75146', '#753832', '#d57d67'], ['#3f737f', '#2d515b', '#67a0a8'],
    ['#917343', '#665033', '#c29b60'], ['#76567e', '#533c5a', '#a481ae'],
    ['#568066', '#3b5a48', '#80a98d'], ['#516c9b', '#37496c', '#809bcb'],
    ['#bc7957', '#85543d', '#e4a580'], ['#69636d', '#4b454f', '#9a8e9d'],
    ['#85425a', '#612d40', '#b47186'], ['#4a827b', '#345e59', '#77afa3'],
    ['#b9a58a', '#887663', '#e2cbb0'], ['#a38347', '#765d34', '#d0ac66'],
    ['#63774d', '#445336', '#97a97c'], ['#4c536f', '#363d52', '#7e87a5'],
  ];
  const trousers = [['#384858', '#293342'], ['#765e53', '#56453e'], ['#494c42', '#35382f'], ['#544254', '#3b303f']];
  const hairColors = [['#282028', '#18151d'], ['#55342c', '#392421'], ['#986345', '#6d4433'], ['#c0b2a1', '#8a7c73']];
  const styles: Pal['style'][] = ['short', 'bun', 'long', 'cap'];
  const people = [PALS.ped1, PALS.ped2, PALS.ped3, PALS.ped4, PALS.player, PALS.staff];
  const addAnimation = (key: string, name: string, frames: number[], frameRate: number) => {
    scene.anims.create({ key: `${key}-${name}`, frames: frames.map((frame) => ({ key, frame })), frameRate, repeat: -1 });
  };

  for (let i = 0; i < 33; i++) {
    const [top, topS, topH] = jackets[i % jackets.length];
    const [pants, pantsS] = trousers[(i + Math.floor(i / 7)) % trousers.length];
    const [hair, hairS] = hairColors[(i * 3 + Math.floor(i / 4)) % hairColors.length];
    const palette: Pal = {
      ...people[i % people.length], top, topS, topH, pants, pantsS, hair, hairS,
      style: styles[(i * 3 + Math.floor(i / 5)) % styles.length], glasses: i % 7 === 2, beard: i % 5 === 0,
    };
    const key = `wadi-guest-${i}`;
    PALS[key] = palette;
    const texture = scene.textures.addCanvas(key, buildSheet(palette))!;
    DIRS.forEach((dir, row) => {
      const first = row * 10 + 8;
      texture.add(first, 0, 8 * FW, row * FH, FW, FH);
      texture.add(first + 1, 0, 9 * FW, row * FH, FW, FH);
      addAnimation(key, `idle-${dir}`, [first, first, first, first + 1], 3);
      if (i < 10) {
        const seatKey = `${key}-seat-${dir}`;
        const seat = scene.textures.addCanvas(seatKey, buildSeated(palette, undefined, dir))!;
        seat.add(0, 0, 0, 0, FW, FH);
        addAnimation(seatKey, 'idle', [0], 1);
      }
    });
  }

  for (const [i, position] of (['first', 'middle', 'middle', 'last'] as const).entries()) {
    const key = `wadi-dabke-${i}`;
    const palette = { ...people[i], style: 'short' as const, glasses: false, beard: i === 2 };
    const texture = scene.textures.addCanvas(key, buildDabkeSheet(palette, position))!;
    for (let frame = 0; frame < 4; frame++) texture.add(frame, 0, frame * FW, 0, FW, FH);
    addAnimation(key, 'dance', [0, 1, 2, 3], 8);
  }
}

export class BootScene extends Phaser.Scene {
  constructor() { super('boot'); }

  create() {
    const tex = buildTextures();
    for (const [k, cv] of Object.entries(tex)) {
      const t = this.textures.addCanvas(k, cv)!;
      if (k === 'glow') t.setFilter(Phaser.Textures.FilterMode.LINEAR);
    }
    const people = ['player', 'player-winter', 'player-protected', 'staff', 'ped1', 'ped2', 'ped3', 'ped4', 'lorelai'];
    for (const key of people) {
      const t = this.textures.addCanvas(key, buildSheet(PALS[key]))!;
      DIRS.forEach((dir, r) => {
        for (let f = 0; f < 10; f++) t.add(r * 10 + f, 0, f * FW, r * FH, FW, FH);
        const fr = (a: number[]) => a.map((i) => ({ key, frame: r * 10 + i }));
        this.anims.create({ key: `${key}-walk-${dir}`, frames: fr([0, 1, 2, 3]), frameRate: 8, repeat: -1 });
        this.anims.create({ key: `${key}-run-${dir}`, frames: fr([4, 5, 6, 7]), frameRate: 13, repeat: -1 });
        this.anims.create({ key: `${key}-idle-${dir}`, frames: fr([8, 8, 8, 9]), frameRate: 3, repeat: -1 });
      });
    }
    registerWadiCharacters(this);
    for (const [key, hands] of [['dad', 'paper'], ['mom', 'knit'], ['lorelai', 'paper'], ['lelas', 'handheld'], ['ped1'], ['ped2'], ['ped3']] as const) {
      const t = this.textures.addCanvas(`${key}-seat`, buildSeated(PALS[key], hands))!;
      t.add(0, 0, 0, 0, FW, FH); t.add(1, 0, FW, 0, FW, FH);
      this.anims.create({ key: `${key}-seat`, frames: [0, 1].map((f) => ({ key: `${key}-seat`, frame: f })), frameRate: key === 'mom' ? 3 : 0.8, repeat: -1 });
    }
    this.textures.addCanvas('sleeper', buildSleeper(PALS.player));
    const g = store.get().game;
    this.scene.start('world', { map: g.map, x: g.x, y: g.y });
  }
}
