// CoverCraft's state: one plain object the editor edits and the renderer draws.
// A photo slot holds the loaded image plus its framing — zoom (1 = exact cover
// fit), ox/oy offset (-1..1 of the panel's half-size) and rotation in degrees.

/** The three post sizes the app exports, as [width, height] pixel pairs. */
export const SIZES = [
  { id: 'square', name: 'Square', w: 1080, h: 1080 },
  { id: 'portrait', name: 'Portrait', w: 1080, h: 1350 },
  { id: 'wide', name: 'Wide', w: 1920, h: 1080 },
];

/** Looks up an export size by id, falling back to Portrait. */
export function sizeById(id) {
  return SIZES.find((size) => size.id === id) ?? SIZES[1];
}

/** A fresh, empty photo slot with centred framing. */
export function makeSlot() {
  return { img: null, label: '', zoom: 1, ox: 0, oy: 0, rot: 0 };
}

/** The state a first-time visitor starts from (samples fill it in main.js). */
export function defaultState() {
  return {
    layoutId: 'classic',
    gradeId: 'vice',
    sizeId: 'portrait',
    mode: 'spread',
    panels: [makeSlot(), makeSlot(), makeSlot(), makeSlot(), makeSlot(), makeSlot()],
    spread: makeSlot(),
    selected: 2,
    title1: 'VICE',
    title2: 'HEAT',
    subtitle: 'One city · No brakes',
    showTag: true,
  };
}

/** Caption suggestions for the preset chips: [title line 1, line 2, subtitle]. */
export const CAPTION_PRESETS = [
  ['VICE', 'HEAT', 'One city · No brakes'],
  ['NEON', 'HARBOR', 'Midnight runners club'],
  ['PALM', 'CITY', 'Est. 1986 · Pop. trouble'],
  ['MIDNIGHT', 'RUN', 'Five stars · Zero regrets'],
  ['GOLDEN', 'COAST', 'Last ride before dawn'],
];
