// The technology ball. One particle orb sits behind the whole page and takes
// a different technical form in each section (circuit core, geodesic lattice,
// data rings, neural net, strata, wave sphere, helix, dotted globe, signal).
// Moving between sections, the particles spin out into a vortex and rebuild
// into the next form from the top down, while the orb glides across the screen
// and the page colours shift with it.
import * as THREE from 'three';

const canvas = document.getElementById('orb-canvas');
const backdrop = document.getElementById('backdrop');
const main = document.getElementById('main');
const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smooth = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;
const easeOutBack = (x) => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };

// ---------------------------------------------------------------------------
// one state per section, in page order
// bg: page gradient (top, middle, bottom). c1/c2: orb colours. place: x, y, radius
// as fractions of the viewport (radius relative to its height).
const STATES = [
  { id: 'top',         shape: 'core',    bg: ['#fcf3dc', '#f9dcbc', '#f5bd98'], c1: '#ef5a4c', c2: '#f8a982', spark: '#fff6ea', glow: '#ff9878', body: 1.0,  trace: 0.95 },
  { id: 'projects',    shape: 'lattice', bg: ['#fbecd5', '#f8d0b8', '#f4b6a8'], c1: '#e64c4f', c2: '#f59bb0', spark: '#fff2f2', glow: '#ff8f8f', body: 0.56, trace: 0.7,  place: [0.84, 0.36, 0.27] },
  { id: 'experience',  shape: 'rings',   bg: ['#fbe4d1', '#f6c6c2', '#ebb8d6'], c1: '#dc4f7e', c2: '#f6a37f', spark: '#fff4f6', glow: '#f79ab4', body: 0.5,  trace: 0.7,  place: [0.88, 0.58, 0.3] },
  { id: 'skills',      shape: 'neural',  bg: ['#e9e0fa', '#d3cbf6', '#bfcbf3'], c1: '#5a3fdc', c2: '#8fa6f0', spark: '#f4f1ff', glow: '#8c7cf2', body: 0.4,  trace: 0.8,  place: [0.83, 0.66, 0.27] },
  { id: 'education',   shape: 'strata',  bg: ['#dfe7fa', '#cbd8f6', '#dacef6'], c1: '#4364df', c2: '#a7c4f4', spark: '#f2f7ff', glow: '#8fb0f4', body: 0.66, trace: 0.7,  place: [0.86, 0.4, 0.28] },
  { id: 'development', shape: 'wave',    bg: ['#f7e5d7', '#f3cfcc', '#e4caf0'], c1: '#ec6552', c2: '#c4a0f2', spark: '#fff5f0', glow: '#f3a0a0', body: 0.8,  trace: 0.6,  place: [0.9, 0.6, 0.32] },
  { id: 'leadership',  shape: 'helix',   bg: ['#e6ddfa', '#e4cbee', '#f3c7c8'], c1: '#6a4be0', c2: '#f07a8a', spark: '#fbf3ff', glow: '#b08cf0', body: 0.52, trace: 0.8,  place: [0.85, 0.38, 0.28] },
  { id: 'offscreen',   shape: 'globe',   bg: ['#dde9fb', '#d0d9f7', '#e2d4f6'], c1: '#3d63da', c2: '#8db8f2', spark: '#f4f9ff', glow: '#8fb6f6', body: 0.96, trace: 0.35, place: [0.76, 0.84, 0.38] },
  { id: 'contact',     shape: 'signal',  bg: ['#fbe8d0', '#f6c3a8', '#efa29c'], c1: '#e5483a', c2: '#7b5ce6', spark: '#fff3ea', glow: '#ff8c76', body: 0.74, trace: 0.9,  place: [0.84, 0.48, 0.28] },
];

// ---------------------------------------------------------------------------
// shapes: every shape is N points, roughly inside a unit ball (the orb body is r=1)
let seed = 20261118;
const rand = () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const hash2 = (a, b) => { const s = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return s - Math.floor(s); };
const gauss = () => (rand() + rand() + rand() - 1.5) / 1.5;
const randDir = (o = new THREE.Vector3()) => {
  const u = rand() * 2 - 1, a = rand() * Math.PI * 2, s = Math.sqrt(1 - u * u);
  return o.set(s * Math.cos(a), u, s * Math.sin(a));
};
const fromPolar = (th, ph, r, o = new THREE.Vector3()) =>
  o.set(r * Math.sin(th) * Math.cos(ph), r * Math.cos(th), r * Math.sin(th) * Math.sin(ph));

// small 3d value noise for the globe's continents
const vhash = (x, y, z) => { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); };
function noise3(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = smooth(x - xi), yf = smooth(y - yi), zf = smooth(z - zi);
  const c = (a, b, d) => vhash(xi + a, yi + b, zi + d);
  const x00 = lerp(c(0, 0, 0), c(1, 0, 0), xf), x10 = lerp(c(0, 1, 0), c(1, 1, 0), xf);
  const x01 = lerp(c(0, 0, 1), c(1, 0, 1), xf), x11 = lerp(c(0, 1, 1), c(1, 1, 1), xf);
  return lerp(lerp(x00, x10, yf), lerp(x01, x11, yf), zf);
}
const fbm = (v) => noise3(v.x * 1.7 + 3, v.y * 1.7 + 1, v.z * 1.7) * 0.65 + noise3(v.x * 3.6, v.y * 3.6 + 5, v.z * 3.6) * 0.35;

function buildShapes(N) {
  const out = {};
  const v = new THREE.Vector3(), w = new THREE.Vector3();
  const make = (fn) => { const a = new Float32Array(N * 3); for (let i = 0; i < N; i++) { fn(v, i); a[i * 3] = v.x; a[i * 3 + 1] = v.y; a[i * 3 + 2] = v.z; } return a; };

  // loose dust, used for the intro
  out.dust = make((p) => randDir(p).multiplyScalar(2.6 + rand() * 2.4));

  // circuit core: traces along latitude/longitude runs, solder nodes, and flares
  const flares = Array.from({ length: 16 }, () => randDir());
  out.core = make((p) => {
    const r = rand();
    if (r < 0.56) {
      for (let k = 0; k < 30; k++) {
        if (rand() < 0.5) {
          const j = Math.floor(rand() * 16), seg = Math.floor(rand() * 24);
          if (hash2(j, seg) < 0.4) continue;
          fromPolar(((j + 0.5) / 16) * Math.PI, ((seg + rand()) / 24) * Math.PI * 2, 1.016, p); return;
        }
        const j = Math.floor(rand() * 32), seg = Math.floor(rand() * 12);
        if (hash2(j + 100, seg) < 0.45) continue;
        fromPolar(((seg + rand()) / 12) * Math.PI, (j / 32) * Math.PI * 2, 1.016, p); return;
      }
      randDir(p).multiplyScalar(1.016);
    } else if (r < 0.68) {
      const j = Math.floor(rand() * 16), k = Math.floor(rand() * 32);
      fromPolar(((j + 0.5) / 16) * Math.PI, (k / 32) * Math.PI * 2, 1.02, p).add(w.set(gauss(), gauss(), gauss()).multiplyScalar(0.012));
    } else {
      const f = flares[Math.floor(rand() * flares.length)];
      p.copy(f).add(randDir(w).multiplyScalar(0.38)).normalize().multiplyScalar(1.05 + Math.pow(rand(), 2.3) * 0.9);
    }
  });

  // geodesic lattice: points along the edges of a subdivided icosahedron
  {
    const ico = new THREE.IcosahedronGeometry(1, 2).getAttribute('position');
    const tri = ico.count / 3;
    const a = new THREE.Vector3(), b = new THREE.Vector3();
    out.lattice = make((p) => {
      const t = Math.floor(rand() * tri) * 3, e = Math.floor(rand() * 3);
      a.fromBufferAttribute(ico, t + e); b.fromBufferAttribute(ico, t + ((e + 1) % 3));
      if (rand() < 0.14) { p.copy(a).normalize().multiplyScalar(1.28).add(w.set(gauss(), gauss(), gauss()).multiplyScalar(0.018)); return; }
      p.copy(a).lerp(b, rand()).normalize().multiplyScalar(1.28);
    });
  }

  // gyroscope: three tilted data rings, an inner sphere and bright "electrons"
  {
    const rings = [
      { r: 1.42, e: new THREE.Euler(1.25, 0, 0.3) },
      { r: 1.26, e: new THREE.Euler(0.25, 0, 1.15) },
      { r: 1.12, e: new THREE.Euler(-0.65, 0.95, 0) },
    ];
    const electrons = Array.from({ length: 9 }, (_, k) => ({ ring: rings[k % 3], a: rand() * Math.PI * 2 }));
    out.rings = make((p) => {
      const r = rand();
      if (r < 0.62) {
        const ring = rings[Math.floor(rand() * 3)], a = rand() * Math.PI * 2, rr = ring.r + gauss() * 0.014;
        p.set(Math.cos(a) * rr, gauss() * 0.01, Math.sin(a) * rr).applyEuler(ring.e);
      } else if (r < 0.86) {
        randDir(p).multiplyScalar(0.64);
      } else {
        const el = electrons[Math.floor(rand() * electrons.length)];
        p.set(Math.cos(el.a) * el.ring.r, 0, Math.sin(el.a) * el.ring.r).applyEuler(el.ring.e)
          .add(w.set(gauss(), gauss(), gauss()).multiplyScalar(0.035));
      }
    });
  }

  // neural net: nodes on two shells joined by arcs to their nearest neighbours
  {
    const nodes = [];
    for (let k = 0; k < 66; k++) nodes.push(randDir().multiplyScalar(1.28));
    for (let k = 0; k < 14; k++) nodes.push(randDir().multiplyScalar(0.62));
    const edges = [];
    nodes.forEach((n, i) => {
      nodes.map((m, j) => [j, n.distanceToSquared(m)]).filter(([j]) => j !== i)
        .sort((x, y) => x[1] - y[1]).slice(0, 3).forEach(([j]) => edges.push([i, j]));
    });
    out.neural = make((p) => {
      if (rand() < 0.3) { p.copy(nodes[Math.floor(rand() * nodes.length)]).add(w.set(gauss(), gauss(), gauss()).multiplyScalar(0.03)); return; }
      const [i, j] = edges[Math.floor(rand() * edges.length)], t = rand();
      const len = lerp(nodes[i].length(), nodes[j].length(), t) * (1 + 0.06 * Math.sin(Math.PI * t));
      p.copy(nodes[i]).lerp(nodes[j], t).normalize().multiplyScalar(len);
    });
  }

  // strata: a sphere sliced into dashed horizontal layers
  out.strata = make((p) => {
    for (let k = 0; k < 30; k++) {
      const layer = Math.floor(rand() * 22), y = -0.95 + (1.9 * layer) / 21;
      const a = rand() * Math.PI * 2, f = (a / (Math.PI * 2)) * (10 + (layer % 4) * 3) + layer * 0.37;
      if (f - Math.floor(f) > 0.72) continue;
      const rr = Math.sqrt(1 - y * y) * 1.18;
      p.set(Math.cos(a) * rr, y * 1.18, Math.sin(a) * rr).add(w.set(0, gauss() * 0.006, 0)); return;
    }
    randDir(p).multiplyScalar(1.18);
  });

  // wave sphere: flowing bands across the surface
  out.wave = make((p) => {
    for (let k = 0; k < 30; k++) {
      randDir(p);
      const lat = Math.asin(p.y), lon = Math.atan2(p.z, p.x);
      if (Math.sin(lat * 11 + Math.sin(lon * 3) * 1.7) < 0.3) continue;
      p.multiplyScalar(1.14 * (1 + 0.045 * Math.sin(lon * 4 + lat * 3))); return;
    }
    p.multiplyScalar(1.14);
  });

  // helix: three strands spiralling pole to pole, with rungs and faint dust
  {
    const strand = (t, s, o) => fromPolar(0.06 + t * (Math.PI - 0.12), t * Math.PI * 7 + (s * Math.PI * 2) / 3, 1.22, o);
    const a = new THREE.Vector3(), b = new THREE.Vector3();
    out.helix = make((p) => {
      const r = rand();
      if (r < 0.62) strand(rand(), Math.floor(rand() * 3), p).add(w.set(gauss(), gauss(), gauss()).multiplyScalar(0.016));
      else if (r < 0.84) {
        const t = Math.floor(rand() * 44) / 43, s = Math.floor(rand() * 3);
        strand(t, s, a); strand(t, (s + 1) % 3, b); p.copy(a).lerp(b, rand());
      } else randDir(p).multiplyScalar(1.22 + gauss() * 0.05);
    });
  }

  // dotted globe: a lat/long dot grid kept only on "land", plus flight arcs
  {
    const cities = [];
    while (cities.length < 12) { const d = randDir(); if (fbm(d) > 0.52) cities.push(d); }
    out.globe = make((p) => {
      if (rand() < 0.2) {
        const a = cities[Math.floor(rand() * cities.length)], b = cities[Math.floor(rand() * cities.length)], t = rand();
        p.copy(a).lerp(b, t).normalize().multiplyScalar(1.02 + 0.3 * Math.sin(Math.PI * t)); return;
      }
      for (let k = 0; k < 40; k++) {
        const row = Math.floor(rand() * 64), th = ((row + 0.5) / 64) * Math.PI;
        const cols = Math.max(6, Math.round(128 * Math.sin(th))), ph = (Math.floor(rand() * cols) / cols) * Math.PI * 2;
        fromPolar(th, ph, 1.014, p);
        if (fbm(p) > 0.5) return;
      }
    });
  }

  // signal: a beacon with broadcast rings around its equator
  out.signal = make((p) => {
    if (rand() < 0.36) { randDir(p).multiplyScalar(1.012); return; }
    const k = Math.floor(rand() * 5), a = rand() * Math.PI * 2, rr = 1.18 + k * 0.14 + gauss() * 0.012;
    p.set(Math.cos(a) * rr, gauss() * 0.012 + (k % 2 ? 0.02 : -0.02), Math.sin(a) * rr);
  });

  return out;
}

// ---------------------------------------------------------------------------
const col = (hex) => new THREE.Color().setStyle(hex, THREE.LinearSRGBColorSpace); // keep raw sRGB numbers
const mixHex = (a, b, t) => col(a).lerp(col(b), t);
const css = (c) => `rgb(${Math.round(c.r * 255)} ${Math.round(c.g * 255)} ${Math.round(c.b * 255)})`;

function softwareGL(renderer) {
  try {
    const gl = renderer.getContext();
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    return /swiftshader|llvmpipe|software|basic render/i.test(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : '');
  } catch { return false; }
}

// page colours follow the scroll even without WebGL
let paintBackdrop = () => {};

function init() {
  const sections = STATES.map((s) => document.getElementById(s.id));
  if (!canvas || !main || sections.some((s) => !s)) return;

  // ---------- colours on the page ----------
  let lastBg = '';
  paintBackdrop = (a, b, t) => {
    const g = [0, 1, 2].map((k) => mixHex(STATES[a].bg[k], STATES[b].bg[k], t));
    const key = g.map(css).join();
    if (key === lastBg) return;
    lastBg = key;
    backdrop.style.setProperty('--g1', css(g[0]));
    backdrop.style.setProperty('--g2', css(g[1]));
    backdrop.style.setProperty('--g3', css(g[2]));
    root.style.setProperty('--halo', css(g[1].clone().lerp(new THREE.Color(1, 1, 1), 0.25)));
  };

  // ---------- scroll position -> state ----------
  let tops = [], vw = innerWidth, vh = innerHeight;
  const measure = () => {
    vw = innerWidth; vh = innerHeight;
    tops = sections.map((s) => s.getBoundingClientRect().top + scrollY);
  };
  // 0 = hero, 1 = projects ... ; the fraction is how far through a hand-over we are
  const stateAt = () => {
    const c = scrollY + vh * 0.5;
    let s = 0;
    for (let i = 1; i < tops.length; i++) s += clamp01((c - (tops[i] - vh * 0.45)) / (vh * 0.75));
    return s;
  };

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch { return false; }
  if (!new URLSearchParams(location.search).has('force3d') && softwareGL(renderer)) { renderer.dispose(); return false; }
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  let dpr = Math.min(devicePixelRatio || 1, 1.75);
  renderer.setPixelRatio(dpr);

  const scene = new THREE.Scene();
  const FOV = 35;
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
  camera.position.set(0, 0, 10);

  const anchor = new THREE.Group(); // position + size on screen
  const spin = new THREE.Group();   // rotation
  scene.add(anchor); anchor.add(spin);

  // soft glow behind the orb
  const glowMat = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: col('#ff9878') }, uOpacity: { value: 0.55 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform vec3 uColor; uniform float uOpacity; varying vec2 vUv;
      void main(){ float d = length(vUv - 0.5) * 2.0; float a = pow(max(0.0, 1.0 - d), 2.4) * uOpacity; gl_FragColor = vec4(uColor, a); }`,
    transparent: true, depthWrite: false, depthTest: false,
  });
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 4.6), glowMat);
  glow.position.z = -1.4; glow.renderOrder = -1;
  anchor.add(glow);

  // the body: a glossy sphere etched with circuit traces and travelling pulses
  const bodyMat = new THREE.ShaderMaterial({
    uniforms: {
      uC1: { value: col('#ef5a4c') }, uC2: { value: col('#f8a982') }, uLine: { value: col('#fff6ea') },
      uTime: { value: 0 }, uTrace: { value: 0.9 }, uOpacity: { value: 1 },
    },
    vertexShader: `varying vec3 vN; varying vec3 vP; varying vec3 vV;
      void main(){ vP = position; vN = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(position, 1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uC1; uniform vec3 uC2; uniform vec3 uLine; uniform float uTime; uniform float uTrace; uniform float uOpacity;
      varying vec3 vN; varying vec3 vP; varying vec3 vV;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      void main(){
        vec3 n = normalize(vN);
        float facing = max(dot(n, normalize(vV)), 0.0);
        float fres = pow(1.0 - facing, 2.3);
        float light = dot(n, normalize(vec3(-0.45, 0.6, 0.66))) * 0.5 + 0.5;
        vec3 c = mix(uC1, uC2, smoothstep(0.15, 1.0, light) * 0.85);
        // circuit traces in latitude/longitude cells
        vec3 p = normalize(vP);
        float u = atan(p.z, p.x) / 6.28318 + 0.5, v = acos(clamp(p.y, -1.0, 1.0)) / 3.14159;
        vec2 g = vec2(u * 72.0, v * 36.0), cell = floor(g), f = fract(g);
        float runH = step(0.52, h(vec2(floor(cell.x / 5.0), cell.y)));
        float runV = step(0.7, h(vec2(cell.x + 17.0, floor(cell.y / 3.0))));
        float lh = runH * (1.0 - smoothstep(0.07, 0.16, abs(f.y - 0.5)));
        float lv = runV * (1.0 - smoothstep(0.07, 0.16, abs(f.x - 0.5)));
        float pad = step(0.9, h(cell + 3.1)) * (1.0 - smoothstep(0.16, 0.24, length(f - 0.5)));
        float poles = smoothstep(0.04, 0.16, v) * smoothstep(0.96, 0.84, v);
        float line = max(max(lh, lv), pad) * poles;
        float pulse = runH * lh * smoothstep(0.9, 1.0, fract(g.x / 5.0 - uTime * 0.35 + h(vec2(cell.y, 2.0)))) * poles;
        c = mix(c, uLine, line * uTrace * 0.5 * (0.45 + facing * 0.55));
        c += pulse * uTrace * 0.55;
        c = mix(c, vec3(1.0, 0.97, 0.97), fres * 0.7);
        gl_FragColor = vec4(c, uOpacity);
      }`,
    transparent: true,
  });
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 64), bodyMat);
  spin.add(body);

  // the particles
  const N = vw < 760 ? 4200 : 8000;
  const shapes = buildShapes(N);
  const geo = new THREE.BufferGeometry();
  const posArr = new Float32Array(shapes.dust);
  const rnd = new Float32Array(N), spark = new Float32Array(N);
  for (let i = 0; i < N; i++) { rnd[i] = rand(); spark[i] = rand() < 0.16 ? 1 : 0; }
  geo.setAttribute('position', new THREE.BufferAttribute(posArr, 3).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute('aRnd', new THREE.BufferAttribute(rnd, 1));
  geo.setAttribute('aSpark', new THREE.BufferAttribute(spark, 1));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 6);
  const ptsMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 }, uSize: { value: 0.03 }, uPix: { value: 800 }, uAlpha: { value: 1 },
      uC1: { value: col('#ef5a4c') }, uC2: { value: col('#f8a982') }, uSpark: { value: col('#fff6ea') },
    },
    vertexShader: `attribute float aRnd; attribute float aSpark;
      uniform float uTime; uniform float uSize; uniform float uPix; uniform vec3 uC1; uniform vec3 uC2; uniform vec3 uSpark;
      varying vec3 vCol; varying float vA;
      void main(){
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        float tw = 0.62 + 0.38 * sin(uTime * (1.4 + aRnd * 3.2) + aRnd * 47.0);
        float s = uSize * (aSpark > 0.5 ? 1.55 : 1.0) * (0.55 + aRnd * 0.9) * (aSpark > 0.5 ? tw : 0.85 + tw * 0.15);
        gl_PointSize = max(1.0, s * uPix / -mv.z);
        vCol = aSpark > 0.5 ? uSpark : mix(uC1, uC2, aRnd);
        vA = aSpark > 0.5 ? 0.95 : 0.88;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `uniform float uAlpha; varying vec3 vCol; varying float vA;
      void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.12, d); if (a < 0.01) discard; gl_FragColor = vec4(vCol, a * vA * uAlpha); }`,
    transparent: true, depthWrite: false,
  });
  const points = new THREE.Points(geo, ptsMat);
  spin.add(points);

  // ---------- layout ----------
  const heroEl = sections[0];
  let visH = 1, pxPerUnit = 1;
  const resize = () => {
    measure();
    renderer.setSize(vw, vh, false);
    camera.aspect = vw / vh; camera.updateProjectionMatrix();
    visH = 2 * Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * camera.position.z;
    pxPerUnit = vh / visH;
    ptsMat.uniforms.uPix.value = (vh * renderer.getPixelRatio()) / (2 * Math.tan(THREE.MathUtils.degToRad(FOV / 2)));
    dirty = true;
  };
  // where the orb sits for a state, in viewport pixels
  const placeOf = (i) => {
    if (i === 0) {
      const o = window.__heroOrbit, hr = heroEl.getBoundingClientRect();
      if (o) return [hr.left + o.x, hr.top + o.y, o.r * 0.42];
      return [vw * 0.7, hr.top + vh * 0.5, vh * 0.2];
    }
    const [x, y, r] = STATES[i].place;
    if (vw < 760) return [vw * 0.84, vh * 0.2, vw * 0.3];
    return [vw * x, vh * y, vh * r];
  };

  // ---------- composing the particles ----------
  let dirty = true, lastA = -1, lastB = -1, lastP = -1;
  const compose = (A, B, p, swirlDir) => {
    for (let i = 0; i < N; i++) {
      const k = i * 3, ay = A[k + 1];
      const d = clamp01(0.5 - ay * 0.32 + (rnd[i] - 0.5) * 0.3); // rebuild sweeps from the top down
      const q = clamp01(p * 1.6 - d * 0.6);
      const e = smooth(q), s = Math.sin(Math.PI * q);
      let x = A[k] + (B[k] - A[k]) * e, y = ay + (B[k + 1] - ay) * e, z = A[k + 2] + (B[k + 2] - A[k + 2]) * e;
      if (s > 0.0001) {
        const grow = 1 + s * (0.22 + rnd[i] * 0.45);
        const ang = s * (1.4 + rnd[i] * 1.8) * swirlDir;
        const ca = Math.cos(ang), sa = Math.sin(ang);
        const nx = (x * ca - z * sa) * grow, nz = (x * sa + z * ca) * grow;
        x = nx; z = nz; y = y * (1 + s * 0.25) + s * (rnd[i] - 0.5) * 0.6;
      }
      posArr[k] = x; posArr[k + 1] = y; posArr[k + 2] = z;
    }
    geo.attributes.position.needsUpdate = true;
  };

  // ---------- pointer + scroll feel ----------
  let px = 0, py = 0, tx = 0, ty = 0;
  addEventListener('pointermove', (e) => { tx = (e.clientX / vw) * 2 - 1; ty = (e.clientY / vh) * 2 - 1; }, { passive: true });

  let sDisp = stateAt(), lastScroll = scrollY, vel = 0, intro = reduce ? 1 : 0, t = 0, yaw = 0;
  const clock = new THREE.Clock();
  let running = false;

  const frame = () => {
    if (!running) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    t += dt;

    // smoothed scroll state
    const s = stateAt();
    sDisp = reduce ? s : sDisp + (s - sDisp) * Math.min(1, dt * 4.2);
    if (Math.abs(s - sDisp) < 0.0005) sDisp = s;
    const a = Math.min(STATES.length - 1, Math.floor(sDisp + 1e-6));
    const b = Math.min(STATES.length - 1, a + 1);
    const p = b === a ? 0 : sDisp - a;
    const pe = smooth(p);

    // scroll speed spins the orb a little faster
    const sv = (scrollY - lastScroll) / Math.max(dt, 1e-3); lastScroll = scrollY;
    vel += (Math.min(3000, Math.abs(sv)) - vel) * Math.min(1, dt * 3);
    if (!reduce) yaw += dt * (0.13 + vel / 2400);

    // particles
    if (intro < 1) {
      intro = Math.min(1, intro + dt / 1.9);
      compose(shapes.dust, shapes[STATES[a].shape], smooth(intro), 1);
      lastA = -1;
    } else if (dirty || a !== lastA || b !== lastB || Math.abs(p - lastP) > 0.0004) {
      if (p === 0) posArr.set(shapes[STATES[a].shape]), (geo.attributes.position.needsUpdate = true);
      else compose(shapes[STATES[a].shape], shapes[STATES[b].shape], p, a % 2 ? -1 : 1);
      lastA = a; lastB = b; lastP = p; dirty = false;
    }

    // colours
    const A = STATES[a], B = STATES[b];
    ptsMat.uniforms.uC1.value.copy(mixHex(A.c1, B.c1, pe));
    ptsMat.uniforms.uC2.value.copy(mixHex(A.c2, B.c2, pe));
    ptsMat.uniforms.uSpark.value.copy(mixHex(A.spark, B.spark, pe));
    bodyMat.uniforms.uC1.value.copy(ptsMat.uniforms.uC1.value);
    bodyMat.uniforms.uC2.value.copy(ptsMat.uniforms.uC2.value);
    bodyMat.uniforms.uLine.value.copy(ptsMat.uniforms.uSpark.value);
    bodyMat.uniforms.uTrace.value = lerp(A.trace, B.trace, pe);
    glowMat.uniforms.uColor.value.copy(mixHex(A.glow, B.glow, pe));
    paintBackdrop(a, b, pe);

    // body shrinks into the vortex during a hand-over, then grows into the next form
    const dip = Math.sin(Math.PI * p);
    const bodyScale = lerp(A.body, B.body, pe) * (1 - dip * 0.45) * (reduce ? 1 : easeOutBack(clamp01(intro * 1.2)));
    body.scale.setScalar(Math.max(0.001, bodyScale));
    bodyMat.uniforms.uTime.value = t;
    ptsMat.uniforms.uTime.value = reduce ? 0 : t;

    // placement: glide between the two spots on a gentle arc
    const pa = placeOf(a), pb = placeOf(b);
    const sx = lerp(pa[0], pb[0], pe), sy = lerp(pa[1], pb[1], pe) - dip * vh * 0.06, sr = lerp(pa[2], pb[2], pe);
    anchor.position.set((sx - vw / 2) / pxPerUnit, -(sy - vh / 2) / pxPerUnit, 0);
    const scale = sr / pxPerUnit;
    anchor.scale.setScalar(scale);
    ptsMat.uniforms.uSize.value = 0.03 * scale * (vw < 760 ? 1.15 : 1);
    glowMat.uniforms.uOpacity.value = 0.5 + dip * 0.15;

    // rotation: steady spin, scroll kick, pointer tilt, half a turn per hand-over
    px += (tx - px) * Math.min(1, dt * 2.5); py += (ty - py) * Math.min(1, dt * 2.5);
    spin.rotation.set(0.32 + py * 0.22, yaw + px * 0.35 + (reduce ? 0 : pe * Math.PI * (a % 2 ? -1 : 1)), -0.1 + px * 0.05);

    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  };
  const wake = () => { if (running || document.hidden) return; running = true; clock.getDelta(); requestAnimationFrame(frame); };
  document.addEventListener('visibilitychange', () => { if (document.hidden) running = false; else wake(); });
  addEventListener('resize', resize);
  if ('ResizeObserver' in window) new ResizeObserver(() => { measure(); dirty = true; }).observe(main);
  addEventListener('load', () => { measure(); dirty = true; });

  resize();
  root.classList.add('orb-on');
  wake();
  return true;
}

// without WebGL the page colours still follow the scroll
function fallbackColours() {
  const sections = STATES.map((s) => document.getElementById(s.id));
  if (sections.some((s) => !s) || !backdrop) return;
  let raf = 0;
  const run = () => {
    raf = 0;
    const vh = innerHeight, c = scrollY + vh * 0.5;
    let s = 0;
    for (let i = 1; i < sections.length; i++) s += clamp01((c - (sections[i].getBoundingClientRect().top + scrollY - vh * 0.45)) / (vh * 0.75));
    const a = Math.min(STATES.length - 1, Math.floor(s)), b = Math.min(STATES.length - 1, a + 1);
    const t = b === a ? 0 : smooth(s - a);
    const g = [0, 1, 2].map((k) => mixHex(STATES[a].bg[k], STATES[b].bg[k], t));
    backdrop.style.setProperty('--g1', css(g[0])); backdrop.style.setProperty('--g2', css(g[1])); backdrop.style.setProperty('--g3', css(g[2]));
    root.style.setProperty('--halo', css(g[1].clone().lerp(new THREE.Color(1, 1, 1), 0.25)));
  };
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(run); }, { passive: true });
  run();
}

let ok = false;
try { ok = init(); } catch (err) { console.error(err); }
if (!ok) fallbackColours();
