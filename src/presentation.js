/* Factory 3D Map — autonomous presentation. No layout or storage writes.
   Motion reference: smart-web tour-adapter.js (quintic easing, shortest yaw,
   perspective fitting and 2400/2000ms flights). UI and scene planning are native. */
(() => {
  const app = document.querySelector('.app');
  const launch = document.getElementById('presentationStart');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const controls = document.createElement('nav');
  controls.className = 'presentation-controls';
  controls.setAttribute('aria-label', 'Controles da apresentação');
  controls.innerHTML = '<button id="presentationPrev" aria-label="Cena anterior" title="Cena anterior">‹</button><button id="presentationPause">Pausar</button><span id="presentationCount"></span><button id="presentationNext" aria-label="Próxima cena" title="Próxima cena">›</button><button id="presentationExit">Sair · Esc</button>';
  const caption = document.createElement('div');
  caption.className = 'presentation-caption';
  caption.setAttribute('role', 'status');
  caption.setAttribute('aria-live', 'polite');
  caption.innerHTML = '<small id="presentationKind"></small><strong id="presentationName"></strong>';
  app.append(controls, caption);
  const pauseButton = document.getElementById('presentationPause');
  const highlight = new THREE.Group();
  highlight.name = 'presentation-highlight';
  let active = false, paused = false, restoring = false, finished = false;
  let scenes = [], index = 0, phase = 'hold', elapsed = 0, lastTime = 0;
  let from = null, saved = null, safeHeight = 0, worldBounds = null;
  let enteredFullscreen = false, backgroundPaused = false, generation = 0, fullscreenFlight = null;
  const ease = p => p * p * p * (p * (p * 6 - 15) + 10);
  const shortest = (a, b) => a + Math.atan2(Math.sin(b - a), Math.cos(b - a));
  const snapshot = () => ({t: cam.t.clone(), d: cam.d, th: cam.th, ph: cam.ph});
  const corners = box => {
    const out = [];
    for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y])
      for (const z of [box.min.z, box.max.z]) out.push(new THREE.Vector3(x, y, z));
    return out;
  };
  function machineBounds(m) {
    m.mesh.updateWorldMatrix(true, true);
    const bounds = new THREE.Box3().setFromObject(m.mesh);
    // Include the full fixture travel and status tower even if currently closed.
    bounds.expandByPoint(new THREE.Vector3(m.pos.x, m.pos.y + m.h + 1.1, m.pos.z));
    return bounds;
  }
  function makeScene(kind, name, bounds, object = null, area = null) {
    return {kind, name, bounds: bounds.clone(), corners: corners(bounds), object, area,
      center: bounds.getCenter(new THREE.Vector3()),
      th: kind === 'equipment' ? .4 + (object.rot || 0) * Math.PI / 2 : kind === 'area' ? .25 : .3,
      ph: kind === 'equipment' ? 1.02 : kind === 'area' ? .90 : .72,
      transition: kind === 'equipment' ? 2000 : 2400,
      hold: kind === 'process' ? 4400 : kind === 'area' ? 3600 : 3200};
  }
  function plan() {
    const areas = AL.filter(a => a.floor?.visible);
    const machines = MS.filter(m => m.mesh?.visible && areas.some(a => a.id === m.a));
    const boxes = new Map(machines.map(m => [m.id, machineBounds(m)]));
    const factory = new THREE.Box3().setFromObject(plinth);
    for (const a of areas) factory.union(new THREE.Box3().setFromObject(a.floor));
    for (const box of boxes.values()) factory.union(box);
    for (const l of E.links) if (!l.blocked && l.group) factory.union(new THREE.Box3().setFromObject(l.group));
    for (const belt of demoBelts) if (belt.parent && belt.visible) factory.union(new THREE.Box3().setFromObject(belt));
    worldBounds = factory.clone();
    safeHeight = factory.max.y + Math.max(2, factory.getSize(new THREE.Vector3()).y * .1);
    const sequence = [makeScene('process', E.processName || 'Processo completo', factory)];
    // AL and each area's ms preserve registration order, including saved projects.
    for (const a of areas) {
      const box = new THREE.Box3().setFromObject(a.floor);
      const items = a.ms.filter(m => boxes.has(m.id));
      for (const m of items) box.union(boxes.get(m.id));
      for (const l of E.links) if (!l.blocked && M[l.from]?.a === a.id && M[l.to]?.a === a.id)
        box.union(new THREE.Box3().setFromObject(l.group));
      sequence.push(makeScene('area', a.n, box, a, a));
      for (const m of items) sequence.push(makeScene('equipment', m.id + ' · ' + m.n, boxes.get(m.id), m, a));
    }
    if (sequence.length > 1) sequence.push({...makeScene('process', E.processName || 'Processo completo', factory), closing: true});
    return sequence;
  }
  function fittedDistance(scene, th, ph) {
    const forward = new THREE.Vector3(Math.sin(ph) * Math.sin(th), Math.cos(ph), Math.sin(ph) * Math.cos(th));
    const right = new THREE.Vector3(Math.cos(th), 0, -Math.sin(th));
    const up = new THREE.Vector3(-Math.cos(ph) * Math.sin(th), Math.sin(ph), -Math.cos(ph) * Math.cos(th));
    const vertical = Math.tan(THREE.MathUtils.degToRad(cam3.fov / 2));
    const horizontal = vertical * cam3.aspect;
    let distance = 0;
    for (const point of scene.corners) {
      const corner = point.clone().sub(scene.center);
      distance = Math.max(distance, corner.dot(forward) + Math.max(
        Math.abs(corner.dot(right)) / (horizontal * .84),
        Math.abs(corner.dot(up)) / (vertical * .75)));
    }
    return Math.max(distance + cam3.near * 1.5,
      (safeHeight - scene.center.y) / Math.cos(ph));
  }
  function destination(scene, progress = 0) {
    const drift = reduced.matches ? 0 : .12 * ease(clamp(progress, 0, 1));
    // Fit the complete orbit in advance, avoiding breathing zoom and cut corners.
    const d = Math.max(...[0, .06, .12].map(a => fittedDistance(scene, scene.th + (reduced.matches ? 0 : a), scene.ph)));
    return {t: scene.center.clone(), d, th: scene.th + drift, ph: scene.ph};
  }
  function apply(frame) {
    cam.t.copy(frame.t); goal.t.copy(frame.t);
    cam.ph = frame.ph; cam.th = frame.th;
    cam.d = goal.d = Math.max(frame.d, (safeHeight - frame.t.y) / Math.max(.01, Math.cos(frame.ph)));
    const far = Math.max(saved.far, cam.d + worldBounds.getSize(new THREE.Vector3()).length() * 2 + 30);
    if (cam3.far !== far) {cam3.far = far; cam3.updateProjectionMatrix();}
    const s = Math.sin(cam.ph);
    cam3.position.set(cam.t.x + cam.d * s * Math.sin(cam.th), cam.t.y + cam.d * Math.cos(cam.ph), cam.t.z + cam.d * s * Math.cos(cam.th));
    cam3.lookAt(cam.t); cam3.updateMatrixWorld();
  }
  function clearHighlight() {
    for (const child of [...highlight.children]) {
      highlight.remove(child); child.geometry.dispose(); child.material.dispose();
    }
  }
  function identifyScene() {
    const scene = scenes[index];
    document.getElementById('presentationKind').textContent = finished ? 'APRESENTAÇÃO CONCLUÍDA' :
      scene.kind === 'process' ? 'PROCESSO COMPLETO' : scene.kind === 'area' ? 'ÁREA DE MANUFATURA' : 'EQUIPAMENTO / ' + scene.area.n;
    document.getElementById('presentationName').textContent = scene.name;
    document.getElementById('presentationCount').textContent = (index + 1) + ' / ' + scenes.length;
    document.getElementById('presentationPrev').disabled = index === 0;
    document.getElementById('presentationNext').disabled = index === scenes.length - 1;
    pauseButton.textContent = finished ? 'Repetir' : paused ? 'Continuar' : 'Pausar';
    pauseButton.setAttribute('aria-pressed', String(paused));
    clearHighlight();
    if (scene.kind === 'process') return;
    const box = new THREE.Box3().setFromObject(scene.kind === 'area' ? scene.object.floor : scene.object.mesh).expandByScalar(.12);
    const outline = new THREE.Box3Helper(box, scene.kind === 'equipment' ? 0xc48b65 : 0x58a685);
    outline.material.depthTest = false; outline.material.depthWrite = false; outline.renderOrder = 20;
    highlight.add(outline);
  }
  function navigate(next) {
    if (!active || !Number.isInteger(next) || next < 0 || next >= scenes.length) return;
    from = snapshot(); index = next; finished = false; elapsed = 0;
    phase = paused || reduced.matches ? 'hold' : 'transition';
    lastTime = performance.now();
    if (phase === 'hold') apply(destination(scenes[index]));
    identifyScene();
  }
  function update(time) {
    if (!active) return false;
    const dt = Math.max(0, time - lastTime); lastTime = Math.max(time, lastTime);
    if (!paused) elapsed += dt;
    // Advance on elapsed time, never frame count; no background timers.
    for (let n = 0; n < scenes.length * 2 + 2 && !paused; n++) {
      const scene = scenes[index], duration = phase === 'transition' ? (reduced.matches ? 0 : scene.transition) : scene.hold;
      if (elapsed < duration) break;
      elapsed -= duration;
      if (phase === 'transition') {phase = 'hold'; continue;}
      apply(destination(scene, 1));
      if (index === scenes.length - 1) {
        finished = true; paused = true; elapsed = scene.hold; identifyScene(); break;
      }
      from = snapshot(); index++; phase = 'transition'; identifyScene();
    }
    const scene = scenes[index];
    if (phase === 'transition') {
      const end = destination(scene), t = ease(clamp(elapsed / Math.max(1, scene.transition), 0, 1));
      apply({t: from.t.clone().lerp(end.t, t), d: THREE.MathUtils.lerp(from.d, end.d, t),
        ph: THREE.MathUtils.lerp(from.ph, end.ph, t), th: THREE.MathUtils.lerp(from.th, shortest(from.th, end.th), t)});
    } else apply(destination(scene, elapsed / scene.hold));
    return true;
  }
  function togglePause() {
    if (!active) return;
    if (finished) {paused = false; navigate(0); return;}
    paused = !paused; lastTime = performance.now(); identifyScene();
  }
  function start() {
    if (active || restoring) return;
    const token = ++generation;
    cancelMachineRotation(); stopCameraKeys(); stopCatalogueDrag();
    if (installPending) closeInstallDialog();
    saved = {camera: snapshot(), goal: {t: goal.t.clone(), d: goal.d}, far: cam3.far,
      focus: document.activeElement, so: so.visible, sp: sp.visible,
      grids: AL.map(a => [a.grid, a.grid?.visible]), helper: helperGrid.visible,
      emissive: MS.map(m => [m.bm, m.bm.emissive.getHex()])};
    clearMachineOutline(); so.visible = sp.visible = helperGrid.visible = ghost.visible = false;
    clearGhostModel(); clearAlignment();
    AL.forEach(a => {if (a.grid) a.grid.visible = false;});
    MS.forEach(m => m.bm.emissive.setHex(0));
    active = true; paused = finished = backgroundPaused = false; enteredFullscreen = false; fullscreenFlight = null;
    app.classList.add('presentation-mode'); resize();
    scenes = plan(); index = 0; phase = 'hold'; elapsed = 0; lastTime = performance.now();
    sc.add(highlight); apply(destination(scenes[0])); identifyScene(); pauseButton.focus({preventScroll: true});
    // Called in the click activation. Failure falls back to the full application viewport.
    if (!document.fullscreenElement && app.requestFullscreen) {
      try {fullscreenFlight = Promise.resolve(app.requestFullscreen()).then(async () => {
        if (active && token === generation) enteredFullscreen = document.fullscreenElement === app;
        else if (!active && document.fullscreenElement === app) await document.exitFullscreen()?.catch(() => {});
      }).catch(() => {});} catch {}
    }
  }
  function stop() {
    if (!active) return;
    const previous = saved, token = ++generation;
    active = false; paused = false; restoring = true; stopCameraKeys();
    app.classList.remove('presentation-mode'); clearHighlight(); sc.remove(highlight);
    so.visible = previous.so; sp.visible = previous.sp; helperGrid.visible = previous.helper;
    previous.grids.forEach(([grid, visible]) => {if (grid) grid.visible = visible;});
    previous.emissive.forEach(([mat, hex]) => mat.emissive.setHex(hex));
    function restore() {
      if (token !== generation) return;
      resize(); cam.t.copy(previous.camera.t); cam.d = previous.camera.d;
      cam.th = previous.camera.th; cam.ph = previous.camera.ph;
      goal.t.copy(previous.goal.t); goal.d = previous.goal.d;
      cam3.far = previous.far; cam3.updateProjectionMatrix();
      if (E.on) syncMachineOutline();
    }
    restore();
    let exit = fullscreenFlight || Promise.resolve();
    if (enteredFullscreen && document.fullscreenElement === app) {
      try {exit = Promise.resolve(document.exitFullscreen()).catch(() => {});} catch {}
    }
    enteredFullscreen = false;
    exit.finally(() => requestAnimationFrame(() => {restore(); requestAnimationFrame(() => {
      restore(); restoring = false;
      if (previous.focus?.isConnected) previous.focus.focus({preventScroll: true}); else launch.focus({preventScroll: true});
    });}));
  }
  launch.disabled = false; launch.onclick = start;
  document.getElementById('presentationPause').onclick = togglePause;
  document.getElementById('presentationPrev').onclick = () => navigate(index - 1);
  document.getElementById('presentationNext').onclick = () => navigate(index + 1);
  document.getElementById('presentationExit').onclick = stop;
  document.addEventListener('keydown', e => {
    if (!active) return;
    if (e.key === 'Escape') {e.preventDefault(); e.stopImmediatePropagation(); stop(); return;}
    if (e.key === 'Tab') {
      const buttons = [...controls.querySelectorAll('button:not(:disabled)')];
      const current = buttons.indexOf(document.activeElement);
      e.preventDefault(); e.stopImmediatePropagation();
      buttons[(current + (e.shiftKey ? -1 : 1) + buttons.length) % buttons.length].focus(); return;
    }
    if (e.key === ' ' && !e.target.closest?.('button')) togglePause();
    else if (e.key === 'ArrowRight') navigate(index + 1);
    else if (e.key === 'ArrowLeft') navigate(index - 1);
    else if (e.target.closest?.('.presentation-controls') && [' ', 'Enter'].includes(e.key)) return;
    e.preventDefault(); e.stopImmediatePropagation();
  }, true);
  document.addEventListener('visibilitychange', () => {
    if (!active) return;
    if (document.hidden && !paused) {backgroundPaused = true; togglePause();}
    else if (!document.hidden && backgroundPaused) {backgroundPaused = false; if (paused && !finished) togglePause();}
  });
  document.addEventListener('fullscreenchange', () => {
    if (active && enteredFullscreen && document.fullscreenElement !== app) stop();
  });
  window.factoryPresentation = Object.freeze({start, stop, update, navigate, togglePause,
    get active() {return active;}, get paused() {return paused;}, get restoring() {return restoring;},
    get finished() {return finished;}, get index() {return index;}, get scenes() {return scenes;},
    get safeHeight() {return safeHeight;}, get phase() {return phase;}});
})();
