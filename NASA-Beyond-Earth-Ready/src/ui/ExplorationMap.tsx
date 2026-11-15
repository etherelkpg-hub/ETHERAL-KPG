import { createElement as h, memo, useId } from 'react';
import { surveyGrid } from '@/game/exploration';
import type { MapId, SurveyRows } from '@/game/store';
import type { OutlineItem } from '@/game/scenes/WorldScene';

const terrainColors: Record<OutlineItem['kind'], string> = {
  room: '#686c79', road: '#555b69', building: '#927267', site: '#f8ca78', zone: '#577b76',
  water: '#49384e', path: '#bc8168', park: '#527653', parking: '#70636b',
};

const landscapes: Partial<Record<MapId, Partial<Record<OutlineItem["kind"], string>>>> = {
  atacama: { zone: '#cab498', building: '#76697a' },
  mcmurdo: { zone: '#adb5b9', building: '#687583', water: '#8cbbc9' },
  haughton: { zone: '#98989e', building: '#575361' },
  'death-valley': { zone: '#eed9b3', building: '#a67455' },
};

function feature(item: OutlineItem, index: number, map: MapId, labels: boolean) {
  const { x, y, w, h: height, kind, shape, points, label } = item;
  const cx = x + w / 2, cy = y + height / 2;
  const fill = landscapes[map]?.[kind] ?? terrainColors[kind];
  const coordinates = points?.map((p) => `${p.x},${p.y}`).join(' ');
  const marker = kind === 'site';
  const relief = shape === 'polygon' && kind === 'building' ? h('polygon', {
    points: coordinates, transform: 'translate(9 14)', fill: '#251f2d', opacity: 0.46,
  }) : null;
  const ground = shape === 'trail' ? h('polyline', {
    points: coordinates, fill: 'none', stroke: fill, strokeWidth: item.strokeWidth ?? w, strokeLinecap: 'round', strokeLinejoin: 'round',
  }) : shape === 'polygon' ? h('polygon', { points: coordinates, fill, stroke: '#d7a382', strokeWidth: 4, strokeOpacity: 0.48 }) :
    shape === 'ellipse' || marker ? h('ellipse', { cx, cy, rx: w / 2, ry: height / 2, fill, stroke: '#342a36', strokeWidth: marker ? 5 : 3 }) :
      h('rect', { x, y, width: w, height, rx: kind === 'road' ? 0 : 7, fill, stroke: '#ded2b9', strokeOpacity: 0.22, strokeWidth: 3 });
  const roadMarking = map === 'city' && kind === 'road' ? h('line', {
    x1: w > height ? x : cx, y1: w > height ? cy : y, x2: w > height ? x + w : cx, y2: w > height ? cy : y + height,
    stroke: '#d5ad72', strokeWidth: 5, strokeDasharray: '24 24',
  }) : null;
  const words = label?.split(' ') ?? [];
  const lines = words.length > 1 && label!.length * 18 > w * 0.9 && !marker
    ? [words.slice(0, Math.ceil(words.length / 2)).join(' '), words.slice(Math.ceil(words.length / 2)).join(' ')] : [label];
  const size = marker ? 29 : Math.min(33, height * 0.39, w * 0.89 / (Math.max(...lines.map((line) => line?.length ?? 1)) * 0.6));
  const title = labels && label ? h('text', {
    x: cx, y: marker ? y - 13 : cy, textAnchor: 'middle', dominantBaseline: 'central', fill: '#fff0d0',
    fontSize: size, fontWeight: 650, stroke: '#362b34', strokeWidth: size / 7, paintOrder: 'stroke',
  }, lines.map((line, i) => h('tspan', { key: i, x: cx, y: (marker ? y - 13 : cy) + (i - (lines.length - 1) / 2) * size * 1.12 }, line))) : null;
  return h('g', { key: index }, relief, ground, roadMarking, title);
}

interface TerrainProps { map: MapId; area: { w: number; h: number; items: OutlineItem[] }; rows?: SurveyRows; labels?: boolean }

export const MapTerrain = memo(function MapTerrain({ map, area, rows, labels = false }: TerrainProps) {
  const id = useId();
  const clipId = `survey-${id}`;
  const gridId = `uncharted-${id}`;
  const ground = { home: '#534850', airport: '#465465', city: '#4c6545', wadi: '#966d5e', atacama: '#bca680', haughton: '#8d8587', 'death-valley': '#e3bf83', mcmurdo: '#98979a' }[map];
  const revealed = Object.entries(rows ?? {}).flatMap(([row, spans]) => spans.map(([left, right]) =>
    `M${left * surveyGrid} ${Number(row) * surveyGrid}h${(right - left) * surveyGrid}v${surveyGrid}h${(left - right) * surveyGrid}z`)).join('');

  return h('g', null,
    h('defs', null,
      h('clipPath', { id: clipId }, h('path', { d: revealed })),
      h('pattern', { id: gridId, width: 96, height: 96, patternUnits: 'userSpaceOnUse' },
        h('path', { d: 'M0 96V0H96', fill: 'none', stroke: '#9e8e96', strokeWidth: 2, opacity: 0.17 }))),
    h('rect', { width: area.w, height: area.h, fill: '#211f2b' }),
    h('rect', { width: area.w, height: area.h, fill: `url(#${gridId})` }),
    h('g', { clipPath: `url(#${clipId})` },
      h('rect', { width: area.w, height: area.h, fill: ground }),
      h('rect', { width: area.w, height: area.h, fill: `url(#${gridId})`, opacity: 0.55 }),
      area.items.map((item, index) => feature(item, index, map, labels))));
});
