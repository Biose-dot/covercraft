// CoverCraft entry point: builds the editor, fills the demo state from the
// bundled sample scenes so the first paint is already a finished poster, and —
// when the URL carries ?shot= — hands over to the fixed screenshot scenes in
// ./shots.js instead.

import { defaultState } from './state.js';
import { createEditor } from './editor.js';
import { setupShot } from './shots.js';

const state = defaultState();
const editor = createEditor(state);
editor.redraw();

/** Demo content: the spread photo plus a panel set, all sample scenes. */
async function fillDemo() {
  await editor.loadSample('sunset', state.spread);
  await editor.loadSample('boulevard', state.panels[0]);
  await editor.loadSample('sunset', state.panels[1]);
  await editor.loadSample('pier', state.panels[2]);
  await editor.loadSample('sunset', state.panels[3]);
  await editor.loadSample('boulevard', state.panels[4]);
  editor.redraw();
}

const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  setupShot(shot, editor);
} else {
  fillDemo();
}

// The caption face is a bundled font file; repaint once it arrives so the
// first poster a visitor sees is already set in it.
if (document.fonts?.load) {
  document.fonts.load('80px "Anton"').then(() => editor.redraw()).catch(() => {});
}
