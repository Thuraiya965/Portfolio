// The hero constellation: one glyph per section orbiting a small star cluster. Tubes are built from the same stroke data as the
// flat SVG icons, so 2D and 3D always match.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLYPHS } from './glyphs.js';

const root = document.documentElement;
const canvas = document.getElementById('orbit-canvas');
const hero = document.getElementById('top');
const labelsWrap = document.getElementById('orbit-labels');
const tip = document.getElementById('orbit-tip');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

function fallback() {
  root.classList.remove('is-booting');
  root.classList.add('no-webgl');
}

function softwareGL(renderer) {
  try {
    const gl = renderer.getContext();
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const name = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : '';
    return /swiftshader|llvmpipe|software|basic render/i.test(name);
  } catch { return false; }
}

function init() {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch { return fallback(); }
  if (!new URLSearchParams(location.search).has('force3d') && softwareGL(renderer)) { renderer.dispose(); return fallback(); }

  let dpr = Math.min(devicePixelRatio || 1, 2);
  renderer.setPixelRatio(dpr);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 200);
  camera.position.set(0, 0, 13);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

  scene.add(new THREE.HemisphereLight(0xffffff, 0xd8d2c4, 0.9));
  const key = new THREE.DirectionalLight(0xffd6a8, 2.4); key.position.set(5, 7, 9); scene.add(key);
  const fill = new THREE.DirectionalLight(0x7aa8ff, 1.1); fill.position.set(-7, -3, 5); scene.add(fill);
  const rim = new THREE.DirectionalLight(0xff8fc7, 0.9); rim.position.set(0, 4, -8); scene.add(rim);

  // ---- soft round sprite texture ----
  const glowTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d');
    const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, 'rgba(255,255,255,1)');
    grd.addColorStop(0.18, 'rgba(255,255,255,.75)');
    grd.addColorStop(0.45, 'rgba(255,255,255,.18)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();

  // ---- the world: everything orbits around `center` ----
  const world = new THREE.Group();
  scene.add(world);
  const center = new THREE.Group();
  world.add(center);

  // background stars
  {
    const n = 1500, pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
    const tints = [new THREE.Color('#2a2d48'), new THREE.Color('#6b5ce7'), new THREE.Color('#2f80d8'), new THREE.Color('#e5603a')];
    for (let i = 0; i < n; i++) {
      const r = 26 + Math.random() * 40, th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
      pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th) * 0.7;
      pos[i * 3 + 2] = -Math.abs(r * Math.cos(ph)) - 4;
      const c = tints[(Math.random() * tints.length) | 0];
      col.set([c.r, c.g, c.b], i * 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    var stars = new THREE.Points(geo, new THREE.PointsMaterial({
      size: 0.2, map: glowTex, vertexColors: true, transparent: true, opacity: 0.32,
      depthWrite: false, sizeAttenuation: true,
    }));
    scene.add(stars);
  }

  // the Pleiades at the centre (rough real layout of the seven sisters)
  const SISTERS = [
    [0, 0, 1.0], [-0.95, -0.12, 0.8], [-0.88, 0.12, 0.55], [0.72, 0.08, 0.75],
    [0.42, 0.55, 0.7], [0.38, -0.42, 0.6], [0.6, 0.95, 0.5],
  ];
  const sisterSprites = SISTERS.map(([x, y, s], i) => {
    const m = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTex, color: new THREE.Color(GLYPHS[i % GLYPHS.length].color),
      transparent: true, opacity: 0.9, depthWrite: false,
    }));
    m.position.set(x * 0.62, y * 0.62, 0);
    m.userData.s = 0.55 * s;
    m.scale.setScalar(0.001);
    center.add(m);
    return m;
  });
  const nebula = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTex, color: 0x8f84ff, transparent: true, opacity: 0.0, depthWrite: false,
  }));
  nebula.scale.setScalar(4.2);
  center.add(nebula);

  // orbit path line
  const PATH_N = 160;
  const pathGeo = new THREE.BufferGeometry();
  pathGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(PATH_N * 3), 3));
  const pathLine = new THREE.LineLoop(pathGeo, new THREE.LineBasicMaterial({ color: 0x16182b, transparent: true, opacity: 0.0, depthWrite: false }));
  world.add(pathLine);

  // ---- glyphs ----
  const TUBE = 0.078;
  const up = new THREE.Vector3(0, 1, 0);
  const sphereGeo = new THREE.SphereGeometry(TUBE, 18, 14);
  const hitGeo = new THREE.PlaneGeometry(1.6, 1.6);
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });

  const glyphs = GLYPHS.map((g, i) => {
    const color = new THREE.Color(g.color);
    const mat = new THREE.MeshPhysicalMaterial({
      color, roughness: 0.22, metalness: 0.08, clearcoat: 1, clearcoatRoughness: 0.1,
      emissive: color, emissiveIntensity: 0.06, envMapIntensity: 1.2, iridescence: 0.35, iridescenceIOR: 1.3,
    });
    const holder = new THREE.Group(); // positioned on the orbit
    const body = new THREE.Group();   // spins / scales
    holder.add(body);

    for (const s of g.strokes) {
      const pts = s.pts.map(([x, y]) => new THREE.Vector3(x, y, 0));
      if (s.smooth) {
        const curve = new THREE.CatmullRomCurve3(pts, !!s.closed, 'centripetal');
        body.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 120, TUBE, 16, !!s.closed), mat));
        if (!s.closed) [pts[0], pts[pts.length - 1]].forEach((p) => { const m = new THREE.Mesh(sphereGeo, mat); m.position.copy(p); body.add(m); });
      } else {
        for (let k = 0; k < pts.length - 1; k++) {
          const a = pts[k], b = pts[k + 1];
          const cyl = new THREE.Mesh(new THREE.CylinderGeometry(TUBE, TUBE, a.distanceTo(b), 16, 1, true), mat);
          cyl.position.copy(a).add(b).multiplyScalar(0.5);
          cyl.quaternion.setFromUnitVectors(up, b.clone().sub(a).normalize());
          body.add(cyl);
        }
        pts.forEach((p) => { const m = new THREE.Mesh(sphereGeo, mat); m.position.copy(p); body.add(m); });
      }
    }
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, opacity: 0.12, depthWrite: false }));
    glow.scale.setScalar(2.4);
    glow.position.z = -0.3;
    holder.add(glow);
    const hit = new THREE.Mesh(hitGeo, hitMat);
    hit.userData.i = i;
    body.add(hit);

    world.add(holder);
    holder.scale.setScalar(0.001);

    const label = document.createElement('span');
    label.className = 'orbit-label';
    label.style.setProperty('--lc', g.color);
    label.textContent = './' + g.name;
    labelsWrap.appendChild(label);

    return { g, i, holder, body, glow, hit, mat, label, hover: 0, spin: 0, spinV: 0, phase: Math.random() * 6 };
  });
  const hits = glyphs.map((o) => o.hit);

  // ---- params (the orbit.config panel) ----
  const DEFAULTS = { speed: 1, radius: 3.6, depth: 1 };
  const P = { ...DEFAULTS };
  const tweak = document.getElementById('tweak');
  const syncInputs = () => tweak.querySelectorAll('input[data-k]').forEach((inp) => {
    inp.value = P[inp.dataset.k];
    inp.nextElementSibling.textContent = (+P[inp.dataset.k]).toFixed(2);
  });
  tweak.addEventListener('input', (e) => {
    const k = e.target.dataset.k;
    if (!k || !(k in P)) return;
    P[k] = +e.target.value;
    e.target.nextElementSibling.textContent = P[k].toFixed(2);
    wake();
  });
  tweak.querySelector('[data-k="reset"]').addEventListener('click', () => { Object.assign(P, DEFAULTS); syncInputs(); wake(); });

  // ---- layout ----
  let W = 1, H = 1, layout = { cx: 2.5, cy: 0, r: 1, labelScale: 1 };
  const tilt = new THREE.Euler(0.72, 0, -0.12);
  const tiltQ = new THREE.Quaternion().setFromEuler(tilt);

  function resize() {
    const r = hero.getBoundingClientRect();
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    const wide = W >= 900;
    // world units visible at z=0
    const visH = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    const visW = visH * camera.aspect;
    if (wide) layout = { cx: visW * 0.19, cy: 0.15, r: Math.min(0.95, visW / 16.5), labelScale: 1 };
    else {
      // phones/tablets: the hero grows with its text, so pin the orbit to a
      // pixel position near the top instead of a fraction of the hero
      const targetPx = Math.min(innerHeight * 0.27, 260);
      layout = { cx: 0, cy: (H / 2 - targetPx) * (visH / H), r: Math.min(0.72, visW / 10.5), labelScale: 0.9 };
    }
    wake();
  }

  function orbitPoint(a, out) {
    const R = P.radius * layout.r;
    out.set(Math.cos(a) * R, Math.sin(a * 2) * 0.42 * P.depth * layout.r, Math.sin(a) * R * (0.25 + 0.75 * Math.min(P.depth, 1.4)));
    out.applyQuaternion(tiltQ);
    out.x += layout.cx; out.y += layout.cy;
    return out;
  }
  function updatePath() {
    const arr = pathGeo.attributes.position.array, v = new THREE.Vector3();
    for (let k = 0; k < PATH_N; k++) {
      orbitPoint((k / PATH_N) * Math.PI * 2, v);
      arr[k * 3] = v.x; arr[k * 3 + 1] = v.y; arr[k * 3 + 2] = v.z;
    }
    pathGeo.attributes.position.needsUpdate = true;
  }

  // ---- interaction ----
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2(-9, -9);
  let hovered = -1, extHover = -1, pointerIn = false;
  let px = 0, py = 0; // parallax target (-1..1)
  let drag = null, spinVel = 0;

  canvas.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    px = ndc.x; py = ndc.y; pointerIn = true;
    tip.style.left = e.clientX - r.left + 'px';
    tip.style.top = e.clientY - r.top + 'px';
    if (drag) {
      const dx = e.clientX - drag.x;
      if (Math.abs(e.clientX - drag.x0) > 6) drag.moved = true;
      spinVel += dx * 0.0016;
      drag.x = e.clientX;
      if (drag.moved) canvas.classList.add('dragging');
    }
    wake();
  });
  canvas.addEventListener('pointerleave', () => { pointerIn = false; ndc.set(-9, -9); px = py = 0; setHover(-1); });
  canvas.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    drag = { x: e.clientX, x0: e.clientX, moved: false };
  });
  addEventListener('pointercancel', () => { drag = null; canvas.classList.remove('dragging'); });
  addEventListener('pointerup', (e) => {
    if (!drag) return;
    const wasDrag = drag.moved;
    drag = null; canvas.classList.remove('dragging');
    if (!wasDrag && e.target === canvas) {
      // re-pick at the release point (covers taps on touch screens)
      const r = canvas.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      const i = pick();
      if (i >= 0) select(i);
    }
  });

  function pick() {
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(hits, false)[0];
    return hit ? hit.object.userData.i : -1;
  }
  function setHover(i) {
    if (i === hovered) return;
    hovered = i;
    canvas.classList.toggle('pointing', i >= 0);
    glyphs.forEach((o) => o.label.classList.toggle('hot', o.i === i || o.i === extHover));
    if (i >= 0) {
      const g = glyphs[i].g;
      tip.innerHTML = `cd <b style="color:${g.color}">./${g.name}</b> ↵`;
      tip.classList.add('on');
    } else tip.classList.remove('on');
    window.dispatchEvent(new CustomEvent('orbit:hover', { detail: { id: i >= 0 ? glyphs[i].g.id : null } }));
  }
  function select(i) {
    const o = glyphs[i];
    o.spinV = 0.55; // one fast spin, then it eases out
    setTimeout(() => window.dispatchEvent(new CustomEvent('orbit:select', { detail: { id: o.g.id } })), reduce ? 0 : 380);
  }
  window.addEventListener('legend:hover', (e) => {
    extHover = e.detail.id ? glyphs.findIndex((o) => o.g.id === e.detail.id) : -1;
    glyphs.forEach((o) => o.label.classList.toggle('hot', o.i === hovered || o.i === extHover));
    wake();
  });

  // ---- loop (only runs while the hero is visible) ----
  const clock = new THREE.Clock();
  let t = 0, angle = 0, running = false, visible = true, started = performance.now();
  let camX = 0, camY = 0;
  const v = new THREE.Vector3(), proj = new THREE.Vector3();
  let frames = 0, slowSum = 0, tuned = false;

  const easeOutBack = (x) => { const c1 = 1.7, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
  const clamp01 = (x) => Math.max(0, Math.min(1, x));

  function frame() {
    if (!running) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    t += dt;
    const since = (performance.now() - started) / 1000;

    if (pointerIn && !drag) setHover(pick());
    const focus = hovered >= 0 || extHover >= 0;

    const base = (reduce ? 0.03 : 0.16) * P.speed;
    angle += dt * base * (focus ? 0.18 : 1) + spinVel;
    spinVel *= 0.92;

    // camera parallax + slow drift of the star field
    camX += (px * 0.7 - camX) * Math.min(1, dt * 3);
    camY += (py * 0.45 - camY) * Math.min(1, dt * 3);
    camera.position.x = camX; camera.position.y = camY;
    camera.lookAt(camX * 0.4, camY * 0.4, 0);
    camera.updateMatrixWorld();
    stars.rotation.y = t * 0.006 + camX * 0.03;

    updatePath();
    pathLine.material.opacity = 0.16 * clamp01((since - 0.6) / 1.2);

    // centre cluster
    center.position.set(layout.cx, layout.cy, 0);
    const cs = layout.r;
    sisterSprites.forEach((s, k) => {
      const intro = reduce ? 1 : easeOutBack(clamp01((since - 0.1 - k * 0.07) / 0.7));
      const tw = 1 + Math.sin(t * 2.2 + k * 1.7) * 0.12;
      s.scale.setScalar(Math.max(0.001, s.userData.s * intro * tw * cs * 1.4));
      s.position.set(SISTERS[k][0] * 0.62 * cs, SISTERS[k][1] * 0.62 * cs, 0);
    });
    nebula.material.opacity = 0.14 * clamp01(since / 1.5);
    nebula.scale.setScalar(4.2 * cs);

    // glyphs
    glyphs.forEach((o) => {
      const a = angle + (o.i / glyphs.length) * Math.PI * 2;
      orbitPoint(a, v);
      o.holder.position.copy(v);
      o.holder.quaternion.copy(camera.quaternion);

      const target = (o.i === hovered || o.i === extHover) ? 1 : 0;
      o.hover += (target - o.hover) * Math.min(1, dt * 10);
      const intro = reduce ? 1 : easeOutBack(clamp01((since - 0.35 - o.i * 0.09) / 0.8));
      const s = Math.max(0.001, intro * layout.r * (1.05 + o.hover * 0.38));
      o.holder.scale.setScalar(s);

      o.spin += o.spinV; o.spinV *= 0.9;
      o.body.rotation.y = Math.sin(t * 0.7 + o.phase) * 0.5 + o.spin;
      o.body.rotation.x = Math.sin(t * 0.5 + o.phase * 1.3) * 0.18;
      o.body.position.y = Math.sin(t * 1.3 + o.phase) * 0.06;
      o.mat.emissiveIntensity = 0.06 + o.hover * 0.3;
      o.glow.material.opacity = 0.1 + o.hover * 0.22;

      // html label below each glyph
      proj.copy(v); proj.y -= 0.86 * s; proj.project(camera);
      const sx = (proj.x * 0.5 + 0.5) * W, sy = (-proj.y * 0.5 + 0.5) * H;
      const depth = clamp01((v.z + 3) / 6); // back → 0, front → 1
      o.label.style.transform = `translate(-50%, 0) translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px) scale(${(0.82 + depth * 0.2) * layout.labelScale})`;
      o.label.style.opacity = (intro * (0.35 + depth * 0.65)).toFixed(3);
      o.label.style.zIndex = Math.round(depth * 10);
    });

    renderer.render(scene, camera);

    if (frames === 0) { root.classList.remove('is-booting'); root.classList.add('has-3d'); }
    // if the device struggles, drop resolution once
    if (!tuned && frames > 20 && frames < 110) { slowSum += dt; }
    if (!tuned && frames === 110) {
      tuned = true;
      if (slowSum / 90 > 1 / 32 && dpr > 1) { dpr = 1; renderer.setPixelRatio(1); resize(); }
    }
    frames++;
    requestAnimationFrame(frame);
  }
  function wake() {
    if (running || !visible || document.hidden) return;
    running = true; clock.getDelta();
    requestAnimationFrame(frame);
  }
  function sleep() { running = false; }

  new IntersectionObserver(([en]) => {
    visible = en.isIntersecting;
    if (visible) wake(); else sleep();
  }, { threshold: 0.01 }).observe(hero);
  document.addEventListener('visibilitychange', () => (document.hidden ? sleep() : wake()));
  addEventListener('resize', resize);

  resize();
  syncInputs();
  wake();
}

try { init(); } catch (err) { console.error(err); fallback(); }
