import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { BootScene } from '@/game/scenes/BootScene';
import { WorldScene } from '@/game/scenes/WorldScene';
import '@/game/maps/home';
import '@/game/maps/city';
import '@/game/maps/airport';
import '@/game/maps/wadi';
import '@/game/maps/fieldRegions';

export function GameCanvas() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: ref.current!,
      width: 960,
      height: 540,
      pixelArt: true,
      backgroundColor: '#0e0d14',
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      scene: [BootScene, WorldScene],
      banner: false,
    });
    return () => game.destroy(true);
  }, []);
  return <div ref={ref} className="absolute inset-0" data-testid="game-canvas" />;
}
