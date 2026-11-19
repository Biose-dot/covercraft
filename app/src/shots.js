// Fixed scenes for screenshots: ?shot=cover shows a finished poster full-screen,
// ?shot=cover2 a second finished poster in another layout, grade and size, and
// ?shot=editor the editor mid-work with its panels filled. Everything is built
// from the bundled sample scenes, so a shot needs no photo of anyone's.
// window.__shotReady is set once the scene is painted, fonts included.

/** Applies one named scene to the editor's state, then flags it ready. */
export async function setupShot(shot, editor) {
  const { state, loadSample, redraw } = editor;

  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    state.sizeId = 'wide';
    state.layoutId = 'classic';
    state.mode = 'spread';
    state.gradeId = 'vice';
    state.title1 = 'VICE';
    state.title2 = 'HEAT';
    state.subtitle = 'One city · No brakes';
    await loadSample('sunset', state.spread);
  } else if (shot === 'cover2') {
    document.body.classList.add('shot-cover');
    state.sizeId = 'portrait';
    state.layoutId = 'trio';
    state.mode = 'panels';
    state.gradeId = 'neon';
    state.title1 = 'NEON';
    state.title2 = 'HARBOR';
    state.subtitle = 'Midnight runners club';
    await loadSample('boulevard', state.panels[0]);
    await loadSample('sunset', state.panels[1]);
    await loadSample('pier', state.panels[2]);
    state.selected = 0;
  } else if (shot === 'editor') {
    state.sizeId = 'portrait';
    state.layoutId = 'classic';
    state.mode = 'panels';
    state.gradeId = 'golden';
    state.title1 = 'PALM';
    state.title2 = 'CITY';
    state.subtitle = 'Est. 1986 · Pop. trouble';
    await loadSample('boulevard', state.panels[0]);
    await loadSample('sunset', state.panels[1]);
    await loadSample('pier', state.panels[2]);
    await loadSample('sunset', state.panels[3]);
    await loadSample('boulevard', state.panels[4]);
    state.panels[2].zoom = 1.15;
    state.selected = 2;
    document.getElementById('title1').value = state.title1;
    document.getElementById('title2').value = state.title2;
    document.getElementById('subtitle').value = state.subtitle;
  }

  redraw();
  await document.fonts.ready;
  redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
  }));
}
