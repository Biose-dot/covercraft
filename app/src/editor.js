// The CoverCraft editor: wires the control panel and the stage canvas to the
// state, and owns every interaction — picking panels, dragging a photo inside
// its panel, wheel zoom, loading photos from disk (they are read locally and
// never uploaded), drag-and-drop, remove-with-undo, and the PNG export, which
// re-runs the renderer at full post size on an offscreen canvas.

import { LAYOUTS, layoutById } from './layouts.js';
import { GRADES } from './grades.js';
import { SIZES, sizeById, makeSlot, CAPTION_PRESETS } from './state.js';
import { drawComposition } from './render.js';

const SAMPLES = [
  { id: 'sunset', name: 'Sunset Bay', src: 'samples/sunset.jpg' },
  { id: 'boulevard', name: 'Neon Boulevard', src: 'samples/boulevard.jpg' },
  { id: 'pier', name: 'Pier at Dusk', src: 'samples/pier.jpg' },
];

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/** Builds the editor around the page's DOM and a fresh state object. */
export function createEditor(state) {
  const $ = (id) => document.getElementById(id);
  const canvas = $('stage');
  const ctx = canvas.getContext('2d');
  const status = $('status');
  const undoStack = [];
  let drag = null;

  const setStatus = (text) => {
    status.textContent = text;
  };

  /** The slot the panel controls act on: the spread slot, or the selected panel's. */
  function activeSlot() {
    return state.mode === 'spread' ? state.spread : state.panels[state.selected];
  }

  /** Panel rectangles in canvas pixels, mirroring the renderer's geometry. */
  function panelPixels() {
    const layout = layoutById(state.layoutId);
    return layout.panels.map((r) => ({
      x: r.x * canvas.width,
      y: r.y * canvas.height,
      w: r.w * canvas.width,
      h: r.h * canvas.height,
    }));
  }

  /** Redraws the preview at a screen-friendly scale of the export size. */
  function redraw() {
    const size = sizeById(state.sizeId);
    const scale = Math.min(1, 1000 / Math.max(size.w, size.h));
    const w = Math.round(size.w * scale);
    const h = Math.round(size.h * scale);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      canvas.style.aspectRatio = `${size.w} / ${size.h}`;
    }
    // Screenshot scenes that show a finished poster render it clean, with no
    // editor decorations (selection outline, empty-panel hints).
    const cleanPoster = document.body.classList.contains('shot-cover');
    drawComposition(ctx, state, w, h, !cleanPoster);
    syncControls();
  }

  /** Keeps every control's face in step with the state (selection, sliders…). */
  function syncControls() {
    document.querySelectorAll('[data-layout]').forEach((b) =>
      b.classList.toggle('active', b.dataset.layout === state.layoutId));
    document.querySelectorAll('[data-size]').forEach((b) =>
      b.classList.toggle('active', b.dataset.size === state.sizeId));
    document.querySelectorAll('[data-grade]').forEach((b) =>
      b.classList.toggle('active', b.dataset.grade === state.gradeId));
    $('modeSpread').checked = state.mode === 'spread';
    $('tagToggle').checked = state.showTag;
    const slot = activeSlot();
    $('zoomRange').value = Math.round(slot.zoom * 100);
    $('zoomVal').textContent = `${Math.round(slot.zoom * 100)}%`;
    $('rotRange').value = Math.round(slot.rot);
    const count = layoutById(state.layoutId).panels.length;
    $('panelTitle').textContent = state.mode === 'spread'
      ? 'All panels · one photo spread across'
      : `Panel ${state.selected + 1} of ${count}`;
    $('undoBtn').disabled = undoStack.length === 0;
    $('removeBtn').disabled = !slot.img;
  }

  /** Assigns a loaded image to a slot and redraws. */
  function setSlotImage(slot, img, label) {
    slot.img = img;
    slot.label = label;
    slot.zoom = 1;
    slot.ox = 0;
    slot.oy = 0;
    slot.rot = 0;
    redraw();
  }

  /** Loads one of the bundled sample scenes into a slot. */
  async function loadSample(id, slot) {
    const sample = SAMPLES.find((s) => s.id === id) ?? SAMPLES[0];
    const img = await loadImage(sample.src);
    setSlotImage(slot, img, sample.name);
    return img;
  }

  /** Reads a photo file from disk into the active slot (local only). */
  async function loadPhotoFile(file) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    try {
      const img = await loadImage(url);
      setSlotImage(activeSlot(), img, file.name);
      setStatus(`Loaded ${file.name} — drag to position, scroll to zoom.`);
    } catch {
      setStatus('That file could not be read as an image.');
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  /** Removes the active slot's photo, keeping it on the undo stack. */
  function removePhoto() {
    const slot = activeSlot();
    if (!slot.img) return;
    undoStack.push({
      mode: state.mode,
      index: state.selected,
      slot: { ...slot },
    });
    Object.assign(slot, makeSlot());
    setStatus('Photo removed — Undo brings it back.');
    redraw();
  }

  /** Restores the most recently removed photo. */
  function undoRemove() {
    const entry = undoStack.pop();
    if (!entry) return;
    const slot = entry.mode === 'spread' ? state.spread : state.panels[entry.index];
    Object.assign(slot, entry.slot);
    setStatus('Photo restored.');
    redraw();
  }

  /** Exports the poster as a PNG at the selected post size. */
  function exportPng() {
    const size = sizeById(state.sizeId);
    const out = document.createElement('canvas');
    out.width = size.w;
    out.height = size.h;
    drawComposition(out.getContext('2d'), state, size.w, size.h, false);
    out.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `covercraft-${size.w}x${size.h}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      setStatus(`Saved covercraft-${size.w}x${size.h}.png — post it anywhere.`);
    }, 'image/png');
  }

  // ---- control bars ------------------------------------------------------
  for (const layout of LAYOUTS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.layout = layout.id;
    b.innerHTML = `<strong>${layout.name}</strong><span>${layout.blurb}</span>`;
    b.addEventListener('click', () => {
      state.layoutId = layout.id;
      state.selected = Math.min(state.selected, layout.panels.length - 1);
      redraw();
    });
    $('layoutBar').appendChild(b);
  }
  for (const size of SIZES) {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.size = size.id;
    b.textContent = `${size.name} ${size.w}×${size.h}`;
    b.addEventListener('click', () => {
      state.sizeId = size.id;
      redraw();
    });
    $('sizeBar').appendChild(b);
  }
  for (const grade of GRADES) {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.grade = grade.id;
    b.innerHTML = `<i style="background:${grade.swatch}"></i>${grade.name}`;
    b.addEventListener('click', () => {
      state.gradeId = grade.id;
      redraw();
    });
    $('gradeBar').appendChild(b);
  }
  for (const sample of SAMPLES) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'sample';
    b.innerHTML = `<img src="${sample.src}" alt="">${sample.name}`;
    b.addEventListener('click', () => loadSample(sample.id, activeSlot()));
    $('sampleBar').appendChild(b);
  }
  CAPTION_PRESETS.forEach(([t1, t2, sub], i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.textContent = `${t1} ${t2}`;
    b.addEventListener('click', () => {
      state.title1 = t1;
      state.title2 = t2;
      state.subtitle = sub;
      $('title1').value = t1;
      $('title2').value = t2;
      $('subtitle').value = sub;
      redraw();
    });
    $('presetBar').appendChild(b);
    void i;
  });

  // ---- panel controls ----------------------------------------------------
  $('modeSpread').addEventListener('change', (e) => {
    state.mode = e.target.checked ? 'spread' : 'panels';
    redraw();
  });
  $('tagToggle').addEventListener('change', (e) => {
    state.showTag = e.target.checked;
    redraw();
  });
  $('loadBtn').addEventListener('click', () => $('photoFile').click());
  $('photoFile').addEventListener('change', (e) => {
    loadPhotoFile(e.target.files[0]);
    e.target.value = '';
  });
  $('zoomRange').addEventListener('input', (e) => {
    activeSlot().zoom = Number(e.target.value) / 100;
    redraw();
  });
  $('rotRange').addEventListener('input', (e) => {
    activeSlot().rot = Number(e.target.value);
    redraw();
  });
  $('removeBtn').addEventListener('click', removePhoto);
  $('undoBtn').addEventListener('click', undoRemove);
  $('exportBtn').addEventListener('click', exportPng);
  for (const [id, key] of [['title1', 'title1'], ['title2', 'title2'], ['subtitle', 'subtitle']]) {
    $(id).addEventListener('input', (e) => {
      state[key] = e.target.value;
      redraw();
    });
  }

  // ---- stage interactions --------------------------------------------------
  function canvasPoint(e) {
    const r = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * canvas.width,
      y: ((e.clientY - r.top) / r.height) * canvas.height,
    };
  }
  canvas.addEventListener('pointerdown', (e) => {
    const p = canvasPoint(e);
    const panels = panelPixels();
    if (state.mode === 'panels') {
      const hit = panels.findIndex((r) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h);
      if (hit >= 0) state.selected = hit;
    }
    const slot = activeSlot();
    const panel = state.mode === 'spread'
      ? { w: canvas.width, h: canvas.height }
      : panels[state.selected];
    drag = { x: p.x, y: p.y, ox: slot.ox, oy: slot.oy, pw: panel.w, ph: panel.h };
    canvas.setPointerCapture(e.pointerId);
    redraw();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const p = canvasPoint(e);
    const slot = activeSlot();
    slot.ox = clamp(drag.ox + (p.x - drag.x) / (drag.pw * 0.5), -1, 1);
    slot.oy = clamp(drag.oy + (p.y - drag.y) / (drag.ph * 0.5), -1, 1);
    redraw();
  });
  canvas.addEventListener('pointerup', () => {
    drag = null;
  });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const slot = activeSlot();
    slot.zoom = clamp(slot.zoom * Math.exp(-e.deltaY * 0.0012), 0.4, 4);
    redraw();
  }, { passive: false });
  canvas.addEventListener('dragover', (e) => e.preventDefault());
  canvas.addEventListener('drop', (e) => {
    e.preventDefault();
    const p = canvasPoint(e);
    if (state.mode === 'panels') {
      const hit = panelPixels().findIndex((r) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h);
      if (hit >= 0) state.selected = hit;
    }
    loadPhotoFile(e.dataTransfer.files[0]);
  });
  document.addEventListener('keydown', (e) => {
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if ((e.key === 'Delete' || e.key === 'Backspace') && state.mode === 'panels') {
      e.preventDefault();
      removePhoto();
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      undoRemove();
    }
  });

  return { state, redraw, setStatus, loadSample, activeSlot, exportPng };
}
