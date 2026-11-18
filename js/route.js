// Roadmap route in the page background.
// A winding road runs from the hero down through every section. Each section
// title is a numbered stop on the road, and the coloured line is drawn up to
// the current scroll position, so the route grows as you scroll down.

const NS = 'http://www.w3.org/2000/svg';
const main = document.getElementById('main');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const pad = (n) => String(n).padStart(2, '0');

const mk = (tag, attrs = {}, parent) => {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(n);
  return n;
};

if (main) {
  const svg = mk('svg', { class: 'route', 'aria-hidden': 'true', focusable: 'false' });
  const defs = mk('defs', {}, svg);
  const grad = mk('linearGradient', { id: 'route-grad', gradientUnits: 'userSpaceOnUse', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
  const road = mk('path', { class: 'route-road' }, svg);
  const lane = mk('path', { class: 'route-lane' }, svg);
  const glow = mk('path', { class: 'route-glow' }, svg);
  const ink = mk('path', { class: 'route-ink' }, svg);
  const stopsG = mk('g', { class: 'route-stops' }, svg);
  const head = mk('g', { class: 'route-head' }, svg);
  mk('circle', { class: 'route-halo', r: 13 }, head);
  mk('circle', { class: 'route-core', r: 6 }, head);
  main.prepend(svg);

  // position of an element inside <main>, ignoring css transforms
  const pos = (node) => {
    let x = 0, y = 0;
    for (let n = node; n && n !== main; n = n.offsetParent) { x += n.offsetLeft; y += n.offsetTop; }
    return { x, y };
  };

  let total = 0, mainY = 0, ys = [], xs = [], stops = [], step = 6, compact = false;

  // y -> length along the route (the route only ever moves downwards)
  const lengthAtY = (y) => {
    if (!ys.length || y <= ys[0]) return 0;
    if (y >= ys[ys.length - 1]) return total;
    let lo = 0, hi = ys.length - 1;
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (ys[mid] <= y) lo = mid; else hi = mid; }
    const t = (y - ys[lo]) / Math.max(1e-6, ys[hi] - ys[lo]);
    return Math.min(total, (lo + t) * step);
  };
  const pointAt = (len) => {
    const f = Math.min(xs.length - 1, len / step), i = Math.floor(f), j = Math.min(xs.length - 1, i + 1), t = f - i;
    return [xs[i] + (xs[j] - xs[i]) * t, ys[i] + (ys[j] - ys[i]) * t];
  };

  const build = () => {
    const W = main.clientWidth, H = main.offsetHeight;
    mainY = main.getBoundingClientRect().top + scrollY;
    svg.setAttribute('width', W); svg.setAttribute('height', H);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    grad.setAttribute('y2', H);

    const secs = [...main.querySelectorAll(':scope > .sec')];
    if (!secs.length) return;
    const wrap0 = secs[0].querySelector('.wrap');
    const cs = getComputedStyle(wrap0);
    const left = pos(wrap0).x + parseFloat(cs.paddingLeft);
    const right = pos(wrap0).x + wrap0.clientWidth - parseFloat(cs.paddingRight);
    compact = left < 72;
    const lx = compact ? Math.max(7, left / 2) : left - 46; // lane beside the titles
    const rx = compact ? Math.min(W - 7, right + (W - right) / 2) : right + 46; // lane on the far side

    stops = secs.map((sec) => {
      const icon = sec.querySelector('.sec-head .g-icon') || sec.querySelector('.sec-head h2');
      const headEl = sec.querySelector('.sec-head');
      const ip = pos(icon), sp = pos(sec);
      return {
        x: lx,
        y: ip.y + icon.offsetHeight / 2,
        // the road runs straight down beside the heading before it swings across
        below: headEl ? pos(headEl).y + headEl.offsetHeight + 30 : ip.y + 200,
        bottom: sp.y + sec.offsetHeight,
        color: getComputedStyle(sec).getPropertyValue('--c').trim() || '#6b5ce7',
        id: sec.id,
      };
    });

    // waypoints: start under the hero, then stop -> swing to the far lane -> next stop ...
    const hero = main.querySelector('.hero');
    const heroBottom = hero ? pos(hero).y + hero.offsetHeight : stops[0].y - 200;
    const pts = [[rx, Math.min(heroBottom - 24, stops[0].y - 160)]];
    stops.forEach((s, i) => {
      pts.push([s.x, s.y], [s.x, s.below]);
      const next = stops[i + 1];
      if (next) pts.push([rx, (s.below + next.y) / 2]);
    });
    const last = stops[stops.length - 1];
    const end = [rx, Math.max(last.below + 220, last.bottom - 70)];
    pts.push(end);

    let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) {
      const [ax, ay] = pts[i - 1], [bx, by] = pts[i], k = (by - ay) * 0.5;
      d += `C${ax.toFixed(1)} ${(ay + k).toFixed(1)} ${bx.toFixed(1)} ${(by - k).toFixed(1)} ${bx.toFixed(1)} ${by.toFixed(1)}`;
    }
    for (const p of [road, lane, glow, ink]) p.setAttribute('d', d);

    total = ink.getTotalLength();
    const n = Math.ceil(total / 6);
    step = total / n;
    xs = []; ys = [];
    for (let i = 0; i <= n; i++) { const p = ink.getPointAtLength(i * step); xs.push(p.x); ys.push(p.y); }
    for (const p of [glow, ink]) { p.style.strokeDasharray = `${total} ${total + 10}`; }

    // colour changes along the road, one colour per section
    grad.replaceChildren();
    const addStop = (y, c) => mk('stop', { offset: clamp01(y / H).toFixed(4), 'stop-color': c }, grad);
    addStop(pts[0][1], stops[0].color);
    stops.forEach((s) => addStop(s.y, s.color));

    // numbered stops beside each section title, plus the destination
    stopsG.replaceChildren();
    stops.forEach((s, i) => {
      s.len = lengthAtY(s.y);
      const g = mk('g', { class: 'route-stop', transform: `translate(${s.x.toFixed(1)} ${s.y.toFixed(1)})`, style: `--sc:${s.color}` }, stopsG);
      mk('circle', { class: 'route-stop-ring', r: compact ? 9 : 22 }, g);
      mk('circle', { class: 'route-stop-dot', r: compact ? 5.5 : 15 }, g);
      if (!compact) mk('text', { class: 'route-stop-no', 'text-anchor': 'middle', dy: '0.35em' }, g).textContent = pad(i + 1);
      s.node = g;
    });
    const fin = mk('g', { class: 'route-stop route-end', transform: `translate(${end[0].toFixed(1)} ${end[1].toFixed(1)})`, style: `--sc:${last.color}` }, stopsG);
    mk('circle', { class: 'route-stop-ring', r: compact ? 9 : 16 }, fin);
    mk('circle', { class: 'route-stop-dot', r: compact ? 5 : 9 }, fin);
    mk('circle', { class: 'route-end-core', r: compact ? 2 : 3.5 }, fin);
    stops.push({ len: total, node: fin, color: last.color, end: true });

    svg.classList.toggle('compact', compact);
  };

  let raf = 0, dirty = true;
  const update = () => {
    raf = 0;
    if (dirty) { dirty = false; build(); }
    if (!total) return;
    const vh = innerHeight;
    const maxScroll = document.documentElement.scrollHeight - vh;
    // the pen sits a little below the middle of the screen, and catches up to the
    // very end of the road during the last screen of scrolling
    const tip = scrollY + vh * 0.62 + vh * 0.38 * clamp01((scrollY - (maxScroll - vh)) / vh);
    const len = reduce ? total : lengthAtY(tip - mainY);
    ink.style.strokeDashoffset = glow.style.strokeDashoffset = (total - len).toFixed(1);

    let color = stops[0].color;
    for (const s of stops) {
      const on = len >= s.len - 1;
      s.node.classList.toggle('on', on);
      if (on && !s.end) color = s.color;
    }
    const [hx, hy] = pointAt(len);
    head.setAttribute('transform', `translate(${hx.toFixed(1)} ${hy.toFixed(1)})`);
    head.style.setProperty('--hc', color);
    head.classList.toggle('hide', reduce || len < 2 || len >= total - 1);
  };
  const queue = () => { if (!raf) raf = requestAnimationFrame(update); };
  const rebuild = () => { dirty = true; queue(); };

  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', rebuild);
  addEventListener('load', rebuild);
  if (document.fonts) document.fonts.ready.then(rebuild);
  if ('ResizeObserver' in window) new ResizeObserver(rebuild).observe(main);
  update();
}
