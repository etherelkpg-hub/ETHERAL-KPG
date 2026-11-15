import { audio } from '../audio';
import { atLeast, openPanel, say, setFlag, setStage, toast } from '../story';
import { store } from '../store';
import { BUILDERS, type WorldScene } from '../scenes/WorldScene';

import { buildHomeFurniture, dressBathroom, dressBedroom, dressHall, dressKitchen, dressLiving, dressSisters, openInteriorDoor, openSideDoor } from './homeFixtures';

const W = 1584, H = 1204;
const livingLeft = 900, livingBottom = 696, entranceBottom = 1124;
const rightWidth = W - livingLeft, entranceHeight = entranceBottom - livingBottom;
const roomCenter = livingLeft + rightWidth / 2;
const passageLeft = roomCenter - 50, passageRight = roomCenter + 50;
const entranceWallY = livingBottom + 24;
const sistersWidth = 430, kitchenLeft = sistersWidth + 24;
const southRoomsY = 760;

export function buildHome(s: WorldScene) {
  buildHomeFurniture(s);

  // ---- floors ----
  s.floor('floor-wood', 0, 0, 600, 520);
  s.floor('floor-bath', 600, 0, 300, 520, 3);
  s.floor('floor-hall', 0, 520, 900, 240);
  s.floor('floor-wood', livingLeft, 0, rightWidth, livingBottom);
  s.floor('floor-wood', 0, southRoomsY, sistersWidth, H - southRoomsY);
  s.floor('floor-kitchen', kitchenLeft, southRoomsY, livingLeft - kitchenLeft, H - southRoomsY);
  s.floor('floor-hall', livingLeft, livingBottom, rightWidth, entranceHeight);

  // ---- back walls ----
  s.wallFace('wp-bed', 0, 0, 588, 150);
  s.wallFace('wp-bath', 612, 0, 276, 150);
  s.wallFace('wp-living', 912, 0, W - 912, 150);
  s.solid(0, 0, W, 150);
  // hall wall (bedroom/bath -> hall) with two doorways
  for (const [a, b] of [[0, 400], [490, 700], [780, 888]]) { s.wallTop(a, 520, b - a, 24); s.wallFace('wp-hall', a, 544, b - a, 70); s.solid(a, 544, b - a, 70); }
  // kitchen / entrance wall with two doorways
  for (const [a, b, texture] of [[0, 60, 'wp-bed'], [150, kitchenLeft, 'wp-bed'], [kitchenLeft, 464, 'wp-kitchen'], [554, 888, 'wp-kitchen']] as const) {
    s.wallTop(a, southRoomsY, b - a, 24);
    s.wallFace(texture, a, southRoomsY + 24, b - a, 70);
    s.solid(a, southRoomsY + 24, b - a, 70);
  }
  s.wallTop(sistersWidth, southRoomsY + 24, 24, H - southRoomsY - 24);
  for (const [a, b] of [[912, passageLeft], [passageRight, W]]) {
    s.wallTop(a, livingBottom, b - a, 24);
    s.wallFace('wp-hall', a, entranceWallY, b - a, 70);
    s.solid(a, entranceWallY, b - a, 70);
  }
  // vertical walls
  s.wallTop(588, 0, 24, 544);
  s.wallTop(888, 0, 24, 614);
  s.wallTop(888, livingBottom, 24, 980 - livingBottom);
  s.wallTop(888, 1080, 24, H - 1080);
  // Open leaves sit alongside the threshold, clear of the walking lane.
  openInteriorDoor(s, 400, 490, 520, 94);
  openInteriorDoor(s, 700, 780, 520, 94);
  openInteriorDoor(s, 60, 150, southRoomsY, 94);
  openInteriorDoor(s, 464, 554, southRoomsY, 94);
  openInteriorDoor(s, passageLeft, passageRight, livingBottom, 94);
  openSideDoor(s, 888, 614, livingBottom);
  openSideDoor(s, 888, 980, 1080);

  // bottom wall with front door
  s.wallTop(0, H - 24, 912, 24);
  s.wallTop(912, entranceBottom - 24, roomCenter - 40 - 912, 24);
  s.wallTop(roomCenter + 40, entranceBottom - 24, W - roomCenter - 40, 24);
  s.solid(roomCenter - 40, entranceBottom - 24, 80, 24);
  s.solid(912, entranceBottom, W - 912, H - entranceBottom);
  s.add.image(roomCenter, entranceBottom, 'frontdoor').setOrigin(0.5, 1).setScale(3, 4).setDepth(entranceBottom + 1);

  // ---- bedroom ----
  const bedX = 461, deskX = 302, wardrobeX = 142, bookcaseX = 48, windowX = 529;
  s.deco('window', windowX, 132);
  dressBedroom(s);
  s.glow(windowX, 90, 130, 0xffd9a0, 0.2);
  s.prop('home-bookcase', bookcaseX, 0, 80, { topY: 90, foot: 58 });
  const wardrobe = s.prop('home-wardrobe', wardrobeX, 0, 91, { topY: 82, foot: 62 });
  const desk = s.prop('home-desk', deskX, 0, 152, { topY: 100, foot: 41 });
  s.glow(deskX, desk.y - desk.displayHeight * 0.65, 130, 0x7fc4ff, 0.24, 0.05);
  const bed = s.prop('home-bed', bedX, 0, 174, { topY: 152, solid: false });
  s.groundShadow(bed.x, bed.y - 8, 155, 34);
  s.solid(bedX - 76, 155, 148, bed.y - 155);
  const ns = s.pix('nightstand', 566, 0, { topY: 145, scale: 2, foot: 20 });
  s.glow(552, ns.y - 49, 94, 0xffc878, 0.32, 0.04);
  s.prop('home-plant', 45, 457, 52, { foot: 23 });
  s.prop('home-plant', 555, 482, 48, { foot: 21 });
  const wakeX = bedX + 98, wakeY = bed.y - 42;
  const sleepY = bed.y - bed.displayHeight + bed.displayHeight * 0.39;
  let sleeper: Phaser.GameObjects.Image | null = null;
  if (store.get().game.stage === 'sleep') {
    sleeper = s.add.image(bedX, sleepY, 'sleeper').setOrigin(0.5).setScale(3).setDepth(bed.depth + 1);
    s.player.setVisible(false).setPosition(wakeX, wakeY);
    s.locked = true;
    s.tweens.add({ targets: sleeper, y: sleepY + 2, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }
  const wake = () => {
    if (!sleeper) return;
    s.lockedInteraction = null;
    const sl = sleeper; sleeper = null;
    store.ui({ prompt: null });
    s.tweens.killTweensOf(sl);
    s.cameras.main.flash(500, 255, 230, 190);
    s.tweens.add({
      targets: sl, y: sleepY - 18, duration: 600, ease: 'Back.easeOut',
      onComplete: () => {
        s.tweens.add({ targets: sl, alpha: 0, x: bedX + 56, duration: 400 });
        s.player.setVisible(true).setAlpha(0).setPosition(wakeX - 9, wakeY);
        s.facing = 'down';
        s.tweens.add({
          targets: s.player, alpha: 1, x: wakeX, duration: 450, ease: 'Quad.easeOut',
          onComplete: () => { s.locked = false; sl.destroy(); setStage('email'); },
        });
      },
    });
  };
  // Always reachable while asleep: global E check via interact with huge radius
  s.interact('wake', wakeX, wakeY, 9999, () => (store.get().game.stage === 'sleep' && sleeper ? 'Wake Up' : null), wake);
  s.updaters.push(() => { if (sleeper && s.locked && store.get().ui.dialogue === null && store.get().ui.panel === null) store.ui({ prompt: store.get().ui.prompt ?? 'Wake Up' }); });
  if (sleeper) s.lockedInteraction = () => { audio.play('blip'); wake(); };

  s.interact('computer', deskX, desk.y + 30, 110, 'Use Computer', () => openPanel('computer'));
  s.interact('bed', bedX, bed.y + 20, 90, 'Bed', () => say([{ speaker: 'player', text: atLeast('family') ? 'Tempting. But there is a desert waiting.' : 'No more snoozing. Something important came in.' }]));
  s.interact('wardrobe', wardrobeX, wardrobe.y + 24, 70, 'Wardrobe', () => say([{ speaker: 'player', text: 'Blue jacket, already on. Field-ready and slightly wrinkled.' }]));
  s.interact('books', bookcaseX, 248, 80, 'Bookshelf', () => say([{ speaker: 'player', text: '"Roadside Geology of Colorado", an atlas of Mars, and a stack of hackathon notebooks.' }]));
  s.interact('window', windowX, bed.y + 14, 80, 'Window', () => say([{ speaker: 'player', text: 'Denver is waking up. You can just see the Front Range behind the rooftops.' }]));

  // ---- bathroom ----
  const bathroom = dressBathroom(s);
  s.prop('home-plant', 860, 512, 40, { foot: 20 });
  s.glow(750, 200, 170, 0xdff4ff, 0.18);
  s.interact('sink', bathroom.sink.x, bathroom.sink.y, 65, 'Bathroom Sink', () => say([{ speaker: 'player', text: 'Splash of cold water. Okay. You qualified. This is real.' }]));

  // ---- hall ----
  dressHall(s, entranceWallY, passageLeft, passageRight, W);
  s.deco('painting', 200, 604);
  s.deco('painting2', 620, 606);
  s.deco('painting', 818, 593, 1.6);
  s.prop('home-plant', 367, 650, 39, { foot: 18 });
  s.prop('home-plant', 32, 756, 50, { foot: 24 });
  s.interact('hallpaint', 620, 660, 70, 'Painting', () => say([{ speaker: 'player', text: 'Mom painted this after the family trip to Arches. Red rock, every time.' }]));

  // ---- living ----
  const tvX = roomCenter, sofaY = 302, tvTableY = 587;
  // Leave the bottom of the U open around the TV table.
  s.flat('rug-living', tvX, 628, 5);
  s.prop('home-sofa-side', tvX - 194, 452, 94, { foot: 175, footW: 0.92 });
  s.prop('home-sofa-side', tvX + 194, 452, 94, { foot: 175, footW: 0.92, flipX: true });
  const sofa = s.prop('home-sofa', tvX, sofaY, 316, { foot: 103, footW: 0.94 });
  const dadX = tvX - 68, momX = tvX + 64;
  s.npc('dad-seat', dadX, sofa.y - 10, 'dad-seat', sofa.depth + 1);
  s.npc('mom-seat', momX, sofa.y - 10, 'mom-seat', sofa.depth + 1);

  const tvTable = s.prop('home-tv-table', tvX, tvTableY, 152, { foot: 41, footW: 0.88 });
  s.prop('home-tv', tvX, tvTable.y - 36, 108, { solid: false, depth: tvTable.depth + 1 });
  s.glow(tvX, tvTable.y - 110, 82, 0x8fc8ff, 0.14, 0.04);
  dressLiving(s, W);
  s.deco('photos', 1092, 107);
  s.prop('home-bookcase', W - 62, 0, 90, { topY: 132, foot: 48 });
  s.pix('floorlamp', 962, 227, { foot: 16, footW: 0.6 });
  s.glow(962, 148, 115, 0xffc878, 0.3, 0.03);

  const familyTalk = () => {
    const st = store.get().game.stage;
    if (st === 'family') {
      say([
        { speaker: 'player', text: 'Mom! Dad! I have some great news!' },
        { speaker: 'dad', text: 'What happened?' },
        { speaker: 'player', text: 'I just got an email from the NASA Hackathon. I qualified for the Beyond Earth competition!' },
        { speaker: 'mom', text: 'Really? Congratulations!' },
        { speaker: 'dad', text: "Isn't that the competition they're talking about on television?" },
        { speaker: 'player', text: 'Yes! I have to find locations on Earth where we can test equipment for Mars.' },
        { speaker: 'mom', text: "That sounds amazing. We're so proud of you!" },
        { speaker: 'dad', text: 'Good luck! Do your best. I hope you win!' },
        { speaker: 'player', text: "Thank you! I'm going to give it everything I've got." },
      ], () => setStage('leave'));
    } else if (!atLeast('family')) {
      say([{ speaker: 'mom', text: "Morning, sweetheart. There's coffee in the kitchen." }, { speaker: 'dad', text: 'Your computer has been chiming for ten minutes, by the way.' }]);
    } else {
      say([{ speaker: 'dad', text: 'Go on, the airport shuttle lines get long by noon.' }, { speaker: 'mom', text: 'Text us when you land. And wear sunscreen out there.' }]);
    }
  };
  s.interact('dad', dadX, sofaY + 18, 106, () => (store.get().game.stage === 'family' ? 'Talk to Family' : 'Talk to Dad'), familyTalk);
  s.interact('mom', momX, sofaY + 18, 106, () => (store.get().game.stage === 'family' ? 'Talk to Family' : 'Talk to Mom'), familyTalk);
  s.interact('tv', tvX, tvTable.y + 21, 95, 'Watch TV', () => say([
    { speaker: 'news', text: 'NASA Hackathon organizers have announced an international scientific research challenge.' },
    { speaker: 'news', text: 'Selected participants will test equipment at field sites on Earth and compare their findings with research data from Mars.' },
    { speaker: 'news', text: 'This broadcast is part of a fictional game world. Back to you in the studio.' },
  ]));
  s.interact('photos', 1092, 190, 67, 'Family Photos', () => say([{ speaker: 'player', text: 'Graduation, the Great Sand Dunes trip, and Dad pretending to understand a telescope.' }]));

  // ---- sisters' bedroom ----
  dressSisters(s);
  s.interact('lorelai', 147, 1086, 61, () => store.get().game.flags.lorelaiAtLukes ? null : 'Talk to Lorelai', () => say([
    { speaker: 'staff', name: 'Lorelai', portrait: 'lorelai', text: 'Hi, Mateo. I am reading. Lelas is playing on her Switch.' },
  ]));

  // ---- kitchen ----
  const kitchen = dressKitchen(s);
  s.glow(700, 885, 152, 0xfff0d0, 0.22);
  s.prop('home-plant', 850, 1176, 50, { foot: 20 });
  s.interact('fridge', kitchen.fridge.x, kitchen.fridge.y, 59, 'Fridge', () => say([{ speaker: 'player', text: 'Leftover green chile. Breakfast of field scientists.' }]));
  s.interact('kitchen-sink', kitchen.sink.x, kitchen.sink.y, 59, 'Kitchen Sink', () => say([{ speaker: 'player', text: 'The dishes can wait until I get back.' }]));
  s.interact('counter', kitchen.counter.x, kitchen.counter.y, 59, 'Kitchen Counter', () => say([{ speaker: 'player', text: 'Mom left a note: "Proud of you already. Eat something."' }]));

  // ---- entrance ----
  s.pix('coatstand', 1060, 0, { topY: entranceWallY + 33, foot: 20, footW: 0.6 });
  s.pix('shoerack', W - 133, 0, { topY: entranceWallY + 78, foot: 30 });
  s.deco('painting2', W - 63, entranceWallY + 46);
  s.prop('home-plant', W - 42, entranceBottom - 30, 56, { foot: 22 });
  s.flat('mat', roomCenter, entranceBottom - 25);
  s.glow(roomCenter, entranceBottom - 132, 158, 0xffd9a0, 0.2);
  s.interact('door', roomCenter, entranceBottom - 45, 90, () => (atLeast('leave') ? 'Leave House' : 'Front Door'), () => {
    if (!atLeast('leave')) {
      say([{ speaker: 'player', text: atLeast('family') ? 'I should finish talking to Mom and Dad in the living room before I leave.' : 'I should check that email and tell Mom and Dad first.' }]);
      return;
    }
    setFlag('lorelaiAtLukes');
    s.goto('city', 380, 812, false);
  });

  // ---- rooms / lighting ----
  s.room('bed', 'Bedroom', 0, 0, 600, 520, ['hall']);
  s.room('bath', 'Bathroom', 600, 0, 300, 520, ['hall']);
  s.room('hall', 'Hallway', 0, 520, 900, 240, ['bed', 'bath', 'living', 'kitchen', 'sisters']);
  s.room('living', 'Living Room', livingLeft, 0, rightWidth, livingBottom, ['hall', 'entrance']);
  s.room('sisters', 'Lorelai & Lelas', 0, southRoomsY, sistersWidth, H - southRoomsY, ['hall']);
  s.room('kitchen', 'Kitchen & Dining', kitchenLeft, southRoomsY, livingLeft - kitchenLeft, H - southRoomsY, ['hall', 'entrance']);
  s.room('entrance', 'Front Entrance', livingLeft, livingBottom, rightWidth, entranceHeight, ['living', 'kitchen']);

  if (store.get().game.stage === 'leave') setTimeout(() => toast('Front door is in the entrance hall, south-east.'), 400);

  return {
    w: W, h: H, name: 'Home, Denver', zoom: 1.55, bg: 0x0e0d14, mood: 'home' as const,
    spawn: { x: 290, y: 430, dir: 'down' as const },
    outline: [
      { x: 0, y: 0, w: 600, h: 520, label: 'Bedroom', kind: 'room' as const },
      { x: 600, y: 0, w: 300, h: 520, label: 'Bath', kind: 'room' as const },
      { x: 0, y: 520, w: 900, h: 240, label: 'Hallway', kind: 'room' as const },
      { x: livingLeft, y: 0, w: rightWidth, h: livingBottom, label: 'Living Room', kind: 'room' as const },
      { x: 0, y: southRoomsY, w: sistersWidth, h: H - southRoomsY, label: 'Lorelai & Lelas', kind: 'room' as const },
      { x: kitchenLeft, y: southRoomsY, w: livingLeft - kitchenLeft, h: H - southRoomsY, label: 'Kitchen', kind: 'room' as const },
      { x: livingLeft, y: livingBottom, w: rightWidth, h: entranceHeight, label: 'Entrance', kind: 'room' as const },
    ],
  };
}
BUILDERS.home = buildHome;
