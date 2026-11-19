// The CoverCraft renderer: draws the whole poster composition onto any 2D
// canvas context at any size. The editor's live preview and the PNG export run
// this exact function — what you see on screen is what the export writes.
//
// Order of paint: panel photos (clipped, graded by the canvas filter), the
// grade's colour washes, the keyline seams, a full-poster grade pass with
// vignette, then the caption block (scrim, accent rule, title, subtitle).

import { layoutById } from './layouts.js';
import { gradeById } from './grades.js';

const DISPLAY_FONT = '"Anton", "Arial Narrow", sans-serif';

/** Draws one photo into a panel box with cover-fit framing from its slot. */
function drawSlottedPhoto(ctx, slot, x, y, w, h, filter) {
  const img = slot.img;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  // Backdrop so a rotated or under-zoomed photo never shows raw canvas.
  const backdrop = ctx.createLinearGradient(0, y, 0, y + h);
  backdrop.addColorStop(0, '#241536');
  backdrop.addColorStop(1, '#0d0819');
  ctx.fillStyle = backdrop;
  ctx.fillRect(x, y, w, h);
  if (img) {
    const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight) * slot.zoom;
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    ctx.filter = filter;
    ctx.translate(x + w / 2 + slot.ox * w * 0.5, y + h / 2 + slot.oy * h * 0.5);
    ctx.rotate((slot.rot * Math.PI) / 180);
    ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
    ctx.filter = 'none';
  }
  ctx.restore();
}

/** Lays a grade's three washes over one rectangle (a panel or the poster). */
function drawWashes(ctx, grade, x, y, w, h) {
  const wash = ctx.createLinearGradient(0, y, 0, y + h);
  wash.addColorStop(0, grade.washTop);
  wash.addColorStop(0.52, grade.washMid);
  wash.addColorStop(1, grade.washBottom);
  ctx.fillStyle = wash;
  ctx.fillRect(x, y, w, h);
}

/** Fits a caption line to a width by shrinking the font, returns the size used. */
function fitFontSize(ctx, text, maxWidth, startSize) {
  let size = startSize;
  ctx.font = `${size}px ${DISPLAY_FONT}`;
  while (ctx.measureText(text).width > maxWidth && size > 10) {
    size *= 0.94;
    ctx.font = `${size}px ${DISPLAY_FONT}`;
  }
  return size;
}

/** Draws the caption block: scrim, accent rule, two title lines, subtitle. */
function drawCaption(ctx, state, grade, W, H) {
  const lines = [state.title1, state.title2]
    .map((line) => (line ?? '').trim().toUpperCase())
    .filter(Boolean);
  const subtitle = (state.subtitle ?? '').trim().toUpperCase();
  if (!lines.length && !subtitle) return;

  const scrimH = H * (lines.length > 1 ? 0.4 : 0.3);
  const scrim = ctx.createLinearGradient(0, H - scrimH, 0, H);
  scrim.addColorStop(0, 'rgba(6, 2, 14, 0)');
  scrim.addColorStop(0.45, 'rgba(6, 2, 14, 0.55)');
  scrim.addColorStop(1, 'rgba(6, 2, 14, 0.88)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, H - scrimH, W, scrimH);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  let cursor = H - H * 0.055;
  if (subtitle) {
    const subSize = Math.max(13, H * 0.026);
    ctx.font = `${subSize}px ${DISPLAY_FONT}`;
    try {
      ctx.letterSpacing = `${Math.round(subSize * 0.34)}px`;
    } catch {
      /* older engines: subtitle simply renders untracked */
    }
    ctx.fillStyle = '#ffe9c4';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
    ctx.shadowBlur = subSize * 0.35;
    ctx.fillText(subtitle, W / 2, cursor);
    ctx.shadowBlur = 0;
    try {
      ctx.letterSpacing = '0px';
    } catch {
      /* no-op */
    }
    cursor -= subSize * 1.55;
  }
  // Title lines paint bottom-up so line 1 sits above line 2.
  for (let i = lines.length - 1; i >= 0; i--) {
    const size = fitFontSize(ctx, lines[i], W * 0.92, H * 0.118);
    const fill = ctx.createLinearGradient(0, cursor - size, 0, cursor);
    fill.addColorStop(0, '#ffffff');
    fill.addColorStop(0.75, '#ffe9c9');
    fill.addColorStop(1, '#ffc98a');
    ctx.font = `${size}px ${DISPLAY_FONT}`;
    ctx.lineWidth = size * 0.14;
    ctx.strokeStyle = 'rgba(10, 4, 20, 0.9)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = size * 0.16;
    ctx.shadowOffsetY = size * 0.05;
    ctx.strokeText(lines[i], W / 2, cursor);
    ctx.fillStyle = fill;
    ctx.fillText(lines[i], W / 2, cursor);
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    cursor -= size * 1.04;
  }
  // Accent rule above the title, in the grade's accent colour.
  ctx.fillStyle = grade.accent;
  ctx.fillRect(W * 0.36, cursor + H * 0.012, W * 0.28, Math.max(3, H * 0.008));
}

/** The small studio tag in the top-left corner of the poster. */
function drawStudioTag(ctx, grade, W, H) {
  const size = Math.max(12, H * 0.02);
  ctx.font = `${size}px ${DISPLAY_FONT}`;
  ctx.textAlign = 'left';
  try {
    ctx.letterSpacing = `${Math.round(size * 0.3)}px`;
  } catch {
    /* untracked is fine */
  }
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = size * 0.4;
  ctx.fillText('★ COVERCRAFT', W * 0.028, H * 0.038);
  ctx.shadowBlur = 0;
  try {
    ctx.letterSpacing = '0px';
  } catch {
    /* no-op */
  }
  ctx.fillStyle = grade.accent;
  ctx.fillRect(W * 0.028, H * 0.05, W * 0.055, Math.max(2, H * 0.005));
}

/**
 * Draws the full composition. `ui` is true only for the editor preview: it adds
 * the selection outline and empty-panel hints, which never reach an export.
 */
export function drawComposition(ctx, state, W, H, ui = false) {
  const layout = layoutById(state.layoutId);
  const grade = gradeById(state.gradeId);
  const gap = Math.max(4, W * 0.007);
  const panels = layout.panels.map((r) => ({
    x: r.x * W + gap / 2,
    y: r.y * H + gap / 2,
    w: r.w * W - gap,
    h: r.h * H - gap,
  }));

  ctx.fillStyle = grade.keyline;
  ctx.fillRect(0, 0, W, H);

  panels.forEach((panel, i) => {
    if (state.mode === 'spread') {
      // One photo across the whole poster: the spread slot is framed against
      // the full canvas, then each panel clips its own window onto it.
      ctx.save();
      ctx.beginPath();
      ctx.rect(panel.x, panel.y, panel.w, panel.h);
      ctx.clip();
      const slot = state.spread;
      const backdrop = ctx.createLinearGradient(0, 0, 0, H);
      backdrop.addColorStop(0, '#241536');
      backdrop.addColorStop(1, '#0d0819');
      ctx.fillStyle = backdrop;
      ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
      if (slot.img) {
        const scale = Math.max(W / slot.img.naturalWidth, H / slot.img.naturalHeight) * slot.zoom;
        const dw = slot.img.naturalWidth * scale;
        const dh = slot.img.naturalHeight * scale;
        ctx.filter = grade.filter;
        ctx.translate(W / 2 + slot.ox * W * 0.5, H / 2 + slot.oy * H * 0.5);
        ctx.rotate((slot.rot * Math.PI) / 180);
        ctx.drawImage(slot.img, -dw / 2, -dh / 2, dw, dh);
        ctx.filter = 'none';
      }
      ctx.restore();
    } else {
      drawSlottedPhoto(ctx, state.panels[i], panel.x, panel.y, panel.w, panel.h, grade.filter);
    }
    drawWashes(ctx, grade, panel.x, panel.y, panel.w, panel.h);
    if (ui && state.mode === 'panels' && !state.panels[i].img) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = `${Math.max(12, panel.h * 0.09)}px ${DISPLAY_FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText('＋ PHOTO', panel.x + panel.w / 2, panel.y + panel.h / 2);
    }
  });

  // Full-poster grade pass and vignette tie the panels into one cover.
  drawWashes(ctx, grade, 0, 0, W, H);
  if (grade.vignette > 0) {
    const rad = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.78);
    rad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    rad.addColorStop(1, `rgba(2, 0, 8, ${grade.vignette})`);
    ctx.fillStyle = rad;
    ctx.fillRect(0, 0, W, H);
  }

  // Outer frame in the keyline colour.
  ctx.strokeStyle = grade.keyline;
  ctx.lineWidth = gap;
  ctx.strokeRect(gap / 2, gap / 2, W - gap, H - gap);

  if (state.showTag) drawStudioTag(ctx, grade, W, H);
  drawCaption(ctx, state, grade, W, H);

  if (ui && state.mode === 'panels') {
    const panel = panels[state.selected];
    if (panel) {
      ctx.strokeStyle = '#ffcf4d';
      ctx.lineWidth = Math.max(2, W * 0.004);
      ctx.setLineDash([W * 0.012, W * 0.008]);
      ctx.strokeRect(panel.x, panel.y, panel.w, panel.h);
      ctx.setLineDash([]);
    }
  }
  return panels;
}
