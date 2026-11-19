// Colour grades for CoverCraft: one click re-lights the whole poster. A grade is
// a canvas filter applied to the photos as they are drawn, two translucent
// gradient washes (top and bottom) laid over them, a vignette strength, the
// keyline colour the panel seams are stroked in, and an accent for the caption
// rule. All four are original CoverCraft recipes — Vice Sunset, Neon Night,
// Golden Coast and Noir.

export const GRADES = [
  {
    id: 'vice',
    name: 'Vice Sunset',
    filter: 'saturate(1.28) contrast(1.06) brightness(1.02)',
    washTop: 'rgba(38, 16, 84, 0.20)',
    washBottom: 'rgba(255, 84, 60, 0.30)',
    washMid: 'rgba(214, 38, 120, 0.16)',
    vignette: 0.34,
    keyline: '#ffffff',
    accent: '#ff5e3a',
    swatch: 'linear-gradient(160deg, #2a1454 0%, #b92a63 48%, #ff8a3d 100%)',
  },
  {
    id: 'neon',
    name: 'Neon Night',
    filter: 'saturate(1.35) contrast(1.16) brightness(0.96)',
    washTop: 'rgba(10, 20, 80, 0.28)',
    washBottom: 'rgba(120, 20, 140, 0.30)',
    washMid: 'rgba(20, 200, 255, 0.13)',
    vignette: 0.46,
    keyline: '#0b0b14',
    accent: '#22d8ff',
    swatch: 'linear-gradient(160deg, #060a2e 0%, #3d1470 52%, #c2189e 100%)',
  },
  {
    id: 'golden',
    name: 'Golden Coast',
    filter: 'saturate(1.12) contrast(1.03) brightness(1.05) sepia(0.22)',
    washTop: 'rgba(120, 70, 10, 0.14)',
    washBottom: 'rgba(255, 150, 40, 0.26)',
    washMid: 'rgba(255, 205, 110, 0.12)',
    vignette: 0.26,
    keyline: '#fff6e6',
    accent: '#ffb02e',
    swatch: 'linear-gradient(160deg, #7a4a12 0%, #e08a2e 55%, #ffd97a 100%)',
  },
  {
    id: 'noir',
    name: 'Noir',
    filter: 'grayscale(0.88) contrast(1.28) brightness(0.98)',
    washTop: 'rgba(0, 0, 0, 0.22)',
    washBottom: 'rgba(0, 0, 0, 0.34)',
    washMid: 'rgba(160, 170, 190, 0.08)',
    vignette: 0.58,
    keyline: '#e8e8ee',
    accent: '#c8ccd8',
    swatch: 'linear-gradient(160deg, #101014 0%, #4a4a55 60%, #9a9aa5 100%)',
  },
];

/** Looks up a grade by id, falling back to Vice Sunset. */
export function gradeById(id) {
  return GRADES.find((grade) => grade.id === id) ?? GRADES[0];
}
