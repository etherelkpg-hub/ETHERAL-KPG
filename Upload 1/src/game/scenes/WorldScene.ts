import { saveProgress, setStage } from '../story';
import { flightForBoarding, pendingTicketFlights } from '../config';
import Phaser from 'phaser';
import { audio, type Ambience } from '../audio';
import { playerAppearance, type Dir } from '../art/characters';
import { bus, isBlocked, live, store, type MapId } from '../store';
import { revealMap } from '../exploration';

export interface Rect { x: number; y: number; w: number; h: number }
export interface Interactable { id: string; x: number; y: number; r: number; label: () => string | null; action: () => void }
export interface OutlineItem {
  x: number; y: number; w: number; h: number; label?: string;
  kind: 'room' | 'road' | 'building' | 'site' | 'zone' | 'water' | 'path' | 'park' | 'parking';
  shape?: 'ellipse' | 'polygon' | 'trail';
  points?: readonly { x: number; y: number }[];
  strokeWidth?: number;
}
export interface MapBuild {
  w: number; h: number; name: string; zoom: number; bg: number; mood: Ambience;
  spawn: { x: number; y: number; dir: Dir };
  outline: OutlineItem[];
}
export const outlines: Partial<Record<MapId, { w: number; h: number; items: OutlineItem[]; name: string }>> = {};
type Builder = (s: WorldScene) => MapBuild;
export const BUILDERS: Partial<Record<MapId, Builder>> = {};

interface Room { id: string; name: string; rect: Rect; shade: Phaser.GameObjects.Rectangle; adj: string[] }
interface PropOpts { foot?: number; footW?: number; solid?: boolean; depth?: number; flipX?: boolean; topY?: number; scale?: number }

// Keep map axes aligned with the screen while matching the house's framing.
const MAP_Y_SCALE = 0.84;
const SHADOW_DEPTH = -720;

export class WorldScene extends Phaser.Scene {
  mapId: MapId = 'home';
  spawnAt: { x: number; y: number } | null = null;
  solids: Rect[] = [];
  dynamic: { rect: () => Rect }[] = [];
  interacts: Interactable[] = [];
  rooms: Room[] = [];
  currentRoom = '';
  updaters: ((dt: number, t: number) => void)[] = [];
  player!: Phaser.GameObjects.Sprite;
  facing: Dir = 'down';
  keys!: Record<string, Phaser.Input.Keyboard.Key>;
  locked = false;
  lockedInteraction: (() => void) | null = null;
  build!: MapBuild;
  lastPrompt: string | null = null;
  lastFrame = '';
  private lastSurveyX = Infinity;
  private lastSurveyY = Infinity;
  private contactShadows?: Phaser.GameObjects.Graphics;
  bounds = { w: 0, h: 0 };

  constructor() { super('world'); }

  private get playerTexture() {
    return playerAppearance(this.mapId);
  }

  init(data: { map: MapId; x?: number; y?: number }) {
    this.mapId = data.map;
    this.spawnAt = data.x !== undefined && data.y !== undefined ? { x: data.x, y: data.y } : null;
    this.solids = []; this.dynamic = []; this.interacts = []; this.rooms = []; this.updaters = [];
    this.currentRoom = ''; this.locked = false; this.lockedInteraction = null; this.lastPrompt = null;
    this.lastSurveyX = this.lastSurveyY = Infinity;
    this.contactShadows = undefined;
  }

  create() {
    const builder = BUILDERS[this.mapId]!;
    this.player = this.add.sprite(0, 0, this.playerTexture, 8).setOrigin(0.5, 1).setScale(3);
    const b = (this.build = builder(this));
    this.upright(this.player);
    this.bounds = { w: b.w, h: b.h };
    outlines[this.mapId] = { w: b.w, h: b.h, items: b.outline, name: b.name };
    let sp = this.spawnAt ?? b.spawn;
    if (this.mapId === 'home' && store.get().game.stage === 'sleep') {
      sp = { x: this.player.x, y: this.player.y };
    } else if (this.hits(sp.x, sp.y)) {
      // A save may predate the current room or street layout.
      const anchor = {
        x: Phaser.Math.Clamp(sp.x, 18, b.w - 18),
        y: Phaser.Math.Clamp(sp.y, 18, b.h - 10),
      };
      const offsets = [0, -24, 24, -48, 48, -72, 72, -96, 96, -144, 144];
      sp = offsets.flatMap((dy) => offsets.map((dx) => ({ x: anchor.x + dx, y: anchor.y + dy })))
        .find((point) => !this.hits(point.x, point.y)) ?? b.spawn;
    }
    this.player.setPosition(sp.x, sp.y);
    this.followShadow(this.player, 44, 18);
    this.facing = this.spawnAt ? 'down' : b.spawn.dir;
    this.player.play(`${this.playerTexture}-idle-${this.facing}`);
    const cam = this.cameras.main;
    cam.setBackgroundColor(b.bg);
    const zoom = Math.max(b.zoom * cam.width / 1920, cam.height / (b.h * MAP_Y_SCALE));
    cam.setZoom(zoom, zoom * MAP_Y_SCALE);
    cam.setBounds(0, 0, b.w, b.h);
    cam.startFollow(this.player, true, 0.12, 0.12);
    const { game: g, ui } = store.get();
    const arrival = ui.panel === 'flight' ? flightForBoarding(g, ui.flightDestination) : undefined;
    const landing = arrival?.id === this.mapId;
    if (!landing) cam.fadeIn(600, 10, 12, 18);
    this.keys = this.input.keyboard!.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,SHIFT', false) as Record<string, Phaser.Input.Keyboard.Key>;
    live.map = this.mapId; live.x = sp.x; live.y = sp.y;
    if (landing && arrival) {
      const pendingFlights = pendingTicketFlights(g).filter((flight) => flight !== arrival.flight);
      store.game({ map: this.mapId, minutes: g.minutes + arrival.minutes, pendingFlights, flags: { ...g.flags, ticket: pendingFlights.length > 0 }, visited: [...new Set([...g.visited, arrival.country])] });
      setStage('wadi');
    } else store.game({ map: this.mapId });
    this.updateExploration(sp.x, sp.y);
    if (landing) {
      // Keep the flight map up until the new scene has drawn its first frame.
      store.ui({ area: b.name });
      this.events.once(Phaser.Scenes.Events.RENDER, () => store.ui({ panel: null, fade: false, flightDestination: undefined }));
    } else {
      store.ui({ area: b.name, fade: false });
    }
    saveProgress();
    audio.setMood(b.mood);
    const offs = [
      bus.on('warp', (p) => { const d = p as { map: MapId; x: number; y: number; fadeOut?: boolean }; this.goto(d.map, d.x, d.y, d.fadeOut); }),
      bus.on('lock', (v) => { this.locked = !!v; }),
      bus.on('interact', () => this.tryInteract()),
    ];
    this.events.once('shutdown', () => {
      offs.forEach((o) => o());
      this.lockedInteraction = null;
    });
    this.events.emit('built');
  }

  goto(map: MapId, x: number, y: number, fadeOut = true) {
    if (store.get().ui.fade) return;
    const restart = () => this.scene.restart({ map, x, y });
    store.ui({ fade: true, prompt: null });
    if (fadeOut) {
      const duration = 450;
      // Complete the move even if the camera effect is interrupted.
      this.time.delayedCall(duration, restart);
      this.cameras.main.fadeOut(duration, 10, 12, 18);
    } else {
      restart();
    }
    audio.play('close');
  }

  // ---------- builder helpers ----------
  floor(tex: string, x: number, y: number, w: number, h: number, scale = 3, depth = -1000) {
    return this.add.tileSprite(x, y, w, h, tex).setOrigin(0).setTileScale(scale).setDepth(depth);
  }
  wallFace(tex: string, x: number, y: number, w: number, h: number) {
    this.floor(tex, x, y, w, h, 3, -600);
    this.add.tileSprite(x, y, w, 12, 'crown').setOrigin(0).setTileScale(3, 3).setDepth(-590);
    this.add.tileSprite(x, y + h - 24, w, 24, 'trim').setOrigin(0).setTileScale(3).setDepth(-590);
    this.add.rectangle(x, y + h, w, 10, 0x000000, 0.18).setOrigin(0).setDepth(-595);
    this.add.rectangle(x, y + h - 7, w, 7, 0x211d28, 0.25).setOrigin(0).setDepth(-588);
    this.groundShadow(x + w / 2, y + h - 3, w, 24, 0.13);
  }
  wallTop(x: number, y: number, w: number, h: number, solid = true) {
    const depth = y + h;
    this.add.tileSprite(x, y, w, h, 'walltop').setOrigin(0).setTileScale(2).setDepth(depth);
    const trim = this.add.graphics().setDepth(depth);
    trim.fillStyle(0xc1a28b, 0.45).fillRect(x, y, w, 4);
    trim.fillStyle(0x181521, 0.48).fillRect(x + w - 7, y + 4, 7, h - 4);
    trim.fillStyle(0x181521, 0.67).fillRect(x, y + h - 6, w, 6);
    if (solid) this.solid(x, y, w, h);
  }
  solid(x: number, y: number, w: number, h: number) { this.solids.push({ x, y, w, h }); }

  groundShadow(x: number, y: number, width: number, depth: number, opacity = 0.23) {
    const art = this.contactShadows ??= this.add.graphics().setDepth(SHADOW_DEPTH);
    art.fillStyle(0x241d2c, opacity * 0.5).fillEllipse(x + 9, y + 6, width + 10, depth + 8);
    art.fillStyle(0x1e1825, opacity).fillEllipse(x + 2, y, width, depth);
  }

  followShadow(object: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite, width: number, depth: number, lift = 0) {
    const shadow = this.add.ellipse(object.x + 3, object.y + lift + 2, width, depth, 0x231e2a, 0.34)
      .setDepth(SHADOW_DEPTH).setVisible(object.visible).setAlpha(object.alpha);
    this.updaters.push(() => {
      shadow.setPosition(object.x + 3, object.y + lift + 2);
      shadow.setVisible(object.visible).setAlpha(object.alpha);
    });
    return shadow;
  }

  prop(key: string, cx: number, by: number, w: number, o: PropOpts = {}) {
    const img = this.add.image(cx, by, key).setOrigin(0.5, 1);
    img.setScale(o.scale ?? w / img.width);
    if (o.topY !== undefined) img.y = o.topY + img.displayHeight;
    if (o.flipX) img.setFlipX(true);
    img.setDepth(o.depth ?? img.y);
    if (o.solid !== false) {
      const fh = o.foot ?? img.displayHeight * 0.4;
      const fw = (o.footW ?? 0.9) * img.displayWidth;
      this.solid(cx - fw / 2, img.y - fh, fw, fh);
      this.groundShadow(cx, img.y - Math.min(fh * 0.35, 12), Math.max(18, fw), Math.max(10, Math.min(fh, 36)));
    }
    return img;
  }
  pix(key: string, cx: number, by: number, o: PropOpts = {}) {
    const tex = this.textures.get(key).getSourceImage() as HTMLCanvasElement;
    return this.prop(key, cx, by, tex.width * (o.scale ?? 3), { ...o, scale: o.scale ?? 3 });
  }
  deco(key: string, cx: number, by: number, scale = 3, depth = -400) {
    return this.add.image(cx, by, key).setOrigin(0.5, 1).setScale(scale).setDepth(depth);
  }
  flat(key: string, cx: number, by: number, scale = 3) { return this.deco(key, cx, by, scale, -900); }

  room(id: string, name: string, x: number, y: number, w: number, h: number, adj: string[]) {
    const shade = this.add.rectangle(x, y, w, h, 0x0a0912, 0.78).setOrigin(0).setDepth(9500);
    this.rooms.push({ id, name, rect: { x, y, w, h }, shade, adj });
  }
  glow(x: number, y: number, radius: number, color: number, alpha = 0.35, flicker = 0) {
    const g = this.add.image(x, y, 'glow').setScale(radius / 64).setTint(color).setAlpha(alpha).setBlendMode(Phaser.BlendModes.ADD).setDepth(9400);
    if (flicker) this.updaters.push((_dt, t) => g.setAlpha(alpha + Math.sin(t / 130) * flicker * 0.5 + Math.sin(t / 47) * flicker * 0.5));
    return g;
  }
  interact(id: string, x: number, y: number, r: number, label: string | (() => string | null), action: () => void) {
    this.interacts.push({ id, x, y, r, label: typeof label === 'string' ? () => label : label, action });
  }
  upright(sprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image, scaleX = 3, scaleY = scaleX) {
    return sprite.setScale(scaleX, scaleY / MAP_Y_SCALE);
  }
  npc(key: string, x: number, y: number, anim: string, depth?: number) {
    const s = this.add.sprite(x, y, key).setOrigin(0.5, 1);
    this.upright(s);
    s.play(anim);
    s.setDepth(depth ?? y);
    this.followShadow(s, 35, 14);
    return s;
  }
  label(text: string, x: number, y: number, size = 16, color = '#f3e6cf', depth = -380) {
    return this.add.text(x, y, text, { fontFamily: 'Inter, sans-serif', fontSize: `${size}px`, color }).setOrigin(0.5).setDepth(depth).setResolution(2);
  }

  // ---------- play ----------
  hits(x: number, y: number): boolean {
    const r = { x: x - 13, y: y - 12, w: 26, h: 12 };
    if (r.x < 4 || r.y < 4 || r.x + r.w > this.bounds.w - 4 || r.y + r.h > this.bounds.h - 2) return true;
    const ov = (s: Rect) => r.x < s.x + s.w && r.x + r.w > s.x && r.y < s.y + s.h && r.y + r.h > s.y;
    for (const s of this.solids) if (ov(s)) return true;
    for (const d of this.dynamic) if (ov(d.rect())) return true;
    return false;
  }

  tryInteract() {
    if (isBlocked()) return;
    if (this.locked) { this.lockedInteraction?.(); return; }
    const n = this.nearest();
    if (n) { audio.play('blip'); n.action(); }
  }

  nearest(): Interactable | null {
    let best: Interactable | null = null, bd = Infinity;
    const px = this.player.x, py = this.player.y;
    for (const it of this.interacts) {
      if (!it.label()) continue;
      const d = Math.hypot(it.x - px, it.y - py);
      if (d < it.r && d < bd) { bd = d; best = it; }
    }
    return best;
  }

  update(t: number, dtMs: number) {
    const dt = Math.min(dtMs, 50) / 1000;
    for (const u of this.updaters) u(dt, t);
    const k = this.keys;
    const blocked = isBlocked() || this.locked;
    let vx = 0, vy = 0;
    if (!blocked) {
      if (k.A.isDown || k.LEFT.isDown) vx -= 1;
      if (k.D.isDown || k.RIGHT.isDown) vx += 1;
      if (k.W.isDown || k.UP.isDown) vy -= 1;
      if (k.S.isDown || k.DOWN.isDown) vy += 1;
    }
    const p = this.player;
    if (vx || vy) {
      const run = k.SHIFT.isDown;
      const sp = run ? 310 : 165;
      const len = Math.hypot(vx, vy);
      const dx = (vx / len) * sp * dt, dy = (vy / len) * sp * dt;
      if (!this.hits(p.x + dx, p.y)) p.x += dx;
      if (!this.hits(p.x, p.y + dy)) p.y += dy;
      if (vx && !vy) this.facing = vx < 0 ? 'left' : 'right';
      else if (vy && !vx) this.facing = vy < 0 ? 'up' : 'down';
      else {
        const h: Dir = vx < 0 ? 'left' : 'right', v: Dir = vy < 0 ? 'up' : 'down';
        if (this.facing !== h && this.facing !== v) this.facing = h;
      }
      p.play(`${this.playerTexture}-${run ? 'run' : 'walk'}-${this.facing}`, true);
      const fr = String(p.anims.currentFrame?.index ?? '');
      if (fr !== this.lastFrame) { this.lastFrame = fr; if (fr === '1' || fr === '3') audio.play('step'); }
    } else if (p.visible) {
      p.play(`${this.playerTexture}-idle-${this.facing}`, true);
    }
    if (p.depth !== p.y) p.setDepth(p.y);
    live.x = p.x; live.y = p.y;
    this.updateExploration(p.x, p.y);

    const n = blocked ? null : this.nearest();
    const label = n ? n.label() : null;
    if (label !== this.lastPrompt) { this.lastPrompt = label; store.ui({ prompt: label }); }

    if (this.rooms.length) {
      const r = this.rooms.find((rm) => p.x >= rm.rect.x && p.x < rm.rect.x + rm.rect.w && p.y - 4 >= rm.rect.y && p.y - 4 < rm.rect.y + rm.rect.h);
      if (r && r.id !== this.currentRoom) {
        const first = this.currentRoom === '';
        this.currentRoom = r.id;
        store.ui({ area: `${this.build.name} · ${r.name}` });
        for (const rm of this.rooms) {
          const target = rm.id === r.id ? 0 : r.adj.includes(rm.id) ? 0.45 : 0.8;
          this.tweens.killTweensOf(rm.shade);
          if (first) rm.shade.setFillStyle(0x0a0912, target);
          else this.tweens.add({ targets: rm.shade, fillAlpha: target, duration: 700, ease: 'Sine.easeInOut' });
        }
      }
    }
  }

  private updateExploration(x: number, y: number) {
    if (Math.abs(x - this.lastSurveyX) < 32 && Math.abs(y - this.lastSurveyY) < 32) return;
    this.lastSurveyX = x;
    this.lastSurveyY = y;
    revealMap(this.mapId, this.bounds, x, y);
  }
}
