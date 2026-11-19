// Poster layouts for CoverCraft: every layout is a set of panel rectangles in
// relative canvas coordinates (0..1), so the same layout works at 1080 x 1080,
// 1080 x 1350 and 1920 x 1080. The renderer insets each rectangle by half the
// keyline gap, which is what gives the multi-panel poster its white seams.

/** One panel rectangle: x, y, w, h as fractions of the whole canvas. */
function rect(x, y, w, h) {
  return { x, y, w, h };
}

export const LAYOUTS = [
  {
    id: 'classic',
    name: 'Classic Five',
    blurb: 'Two over a hero over two — the poster wall',
    panels: [
      rect(0.0, 0.0, 0.5, 0.3),
      rect(0.5, 0.0, 0.5, 0.3),
      rect(0.0, 0.3, 1.0, 0.4),
      rect(0.0, 0.7, 0.5, 0.3),
      rect(0.5, 0.7, 0.5, 0.3),
    ],
  },
  {
    id: 'duo',
    name: 'Duo Vertical',
    blurb: 'Two tall halves, one seam down the middle',
    panels: [rect(0.0, 0.0, 0.5, 1.0), rect(0.5, 0.0, 0.5, 1.0)],
  },
  {
    id: 'trio',
    name: 'Trio + Hero',
    blurb: 'A tall hero panel with two stacked beside it',
    panels: [
      rect(0.0, 0.0, 0.44, 1.0),
      rect(0.44, 0.0, 0.56, 0.52),
      rect(0.44, 0.52, 0.56, 0.48),
    ],
  },
  {
    id: 'strip',
    name: 'Magazine Strip',
    blurb: 'Four horizontal bands, like a magazine cover run',
    panels: [
      rect(0.0, 0.0, 1.0, 0.25),
      rect(0.0, 0.25, 1.0, 0.25),
      rect(0.0, 0.5, 1.0, 0.25),
      rect(0.0, 0.75, 1.0, 0.25),
    ],
  },
];

/** Looks up a layout by id, falling back to the first (Classic Five). */
export function layoutById(id) {
  return LAYOUTS.find((layout) => layout.id === id) ?? LAYOUTS[0];
}
