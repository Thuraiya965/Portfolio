import { GLYPHS, glyphSVG } from './glyphs.js';
import { PROJECTS, EXPERIENCE, SKILLS, CONTACT } from './data.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const pad = (n) => String(n).padStart(2, '0');
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const PALETTE = ['#e5483a', '#d0701c', '#5b3fd8', '#2d6ad6', '#a04ad0', '#d93f78'];
const GH = '<svg width="15" height="15" aria-hidden="true"><use href="#i-gh"/></svg>';

function goSection(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
}

/* ---------------- glyph icons + legend ---------------- */
$$('.g-icon[data-glyph]').forEach((el) => { el.innerHTML = glyphSVG(el.dataset.glyph); });

const legend = $('#legend');
legend.innerHTML = GLYPHS.map((g, i) =>
  `<button type="button" data-go="${g.id}" style="--i:${i}; --lc:${g.color}"><span class="g-icon">${glyphSVG(g.id)}</span>${g.name}</button>`
).join('');
legend.addEventListener('click', (e) => {
  const b = e.target.closest('[data-go]');
  if (b) goSection(b.dataset.go);
});
const legendHover = (id) => window.dispatchEvent(new CustomEvent('legend:hover', { detail: { id } }));
legend.addEventListener('pointerover', (e) => { const b = e.target.closest('[data-go]'); if (b) legendHover(b.dataset.go); });
legend.addEventListener('pointerleave', () => legendHover(null));
legend.addEventListener('focusin', (e) => { const b = e.target.closest('[data-go]'); if (b) legendHover(b.dataset.go); });
legend.addEventListener('focusout', () => legendHover(null));

window.addEventListener('orbit:select', (e) => goSection(e.detail.id));
window.addEventListener('orbit:hover', (e) => {
  $$('button', legend).forEach((b) => b.classList.toggle('hot', b.dataset.go === e.detail.id));
});

/* ---------------- nav ---------------- */
const nav = $('#nav');
const onScroll = () => nav.classList.toggle('scrolled', scrollY > 40);
addEventListener('scroll', onScroll, { passive: true });
onScroll();

const navLinks = $$('.nav-links a');
const secObs = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    if (en.isIntersecting) navLinks.forEach((a) => a.classList.toggle('active', a.dataset.nav === en.target.id));
  });
}, { rootMargin: '-45% 0px -50% 0px' });
$$('main > section[id]').forEach((s) => secObs.observe(s));

/* ---------------- experience (git log) ---------------- */
const evThumbs = (list, group) => list.map((ev) =>
  `<button class="ev" type="button" data-lb="${group}" data-src="${ev.src}" data-cap="${esc(ev.cap)}"><img src="${ev.src}" alt="${esc(ev.cap)}" loading="lazy"></button>`
).join('');
const toolChips = (tools) => `<ul class="tools">${tools.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`;

$('#gitlog').innerHTML = EXPERIENCE.map((e, i) => `
  <li class="commit reveal" id="role-${e.id}">
    <span class="commit-dot" aria-hidden="true"></span>
    <div class="commit-card">
    <div class="commit-head mono">
      <span class="hash">${e.hash}</span>${e.ref ? `<span class="ref">${esc(e.ref)}</span>` : ''}
      <span>${esc(e.when)}</span><span class="loc">${esc(e.loc)}</span>
    </div>
    <div class="commit-body">
      <div class="commit-text">
        <h3>${esc(e.role)} <span>@ ${esc(e.org)}</span></h3>
        <p>${esc(e.text)}</p>
        ${toolChips(e.tools)}
        ${e.project ? `<button type="button" class="commit-link" data-case="${e.project}">View project details →</button>` : ''}
      </div>
      ${e.evidence.length ? `<div class="commit-ev">${evThumbs(e.evidence, 'role-' + e.id)}</div>` : ''}
    </div>
    </div>
  </li>`).join('');

/* ---------------- projects: curved arc carousel ---------------- */
const arc = $('#arc');
const stage = $('.arc-stage', arc);
const track = $('#arc-track');
const N = PROJECTS.length;
const STEP = 360 / N;
let W = 340, R = 500;

track.innerHTML = PROJECTS.map((p, i) => `
  <article class="pcard" data-i="${i}" style="--pc:${PALETTE[i % PALETTE.length]}" aria-label="${esc(p.title)}">
    <div class="pcard-top"><span class="pcard-num">${pad(i + 1)}</span><span>${esc(p.cat)}</span></div>
    <h3>${esc(p.title)}</h3>
    <p class="pcard-hook">${esc(p.hook)}</p>
    ${p.fig ? `<div class="pcard-fig"><b>${esc(p.fig.n)}</b><span>${esc(p.fig.l)}</span></div>` : '<div class="pcard-gap"></div>'}
    <p class="pcard-sum">${esc(p.summary)}</p>
    ${toolChips(p.tools)}
    <div class="pcard-foot">
      <span class="pcard-open">View details <i>→</i></span>
      ${p.repo ? `<a class="pcard-gh" href="${p.repo}" target="_blank" rel="noopener">${GH}GitHub</a>` : '<span class="pcard-private mono">internal project</span>'}
    </div>
  </article>`).join('');
const cards = $$('.pcard', track);

$('#arc-index').innerHTML = PROJECTS.map((p, i) => `<li><button type="button" data-i="${i}">${pad(i + 1)} ${esc(p.title)}</button></li>`).join('');
const idxBtns = $$('#arc-index button');

let pos = 0, target = 0, raf = 0, dragging = false;
const mod = (n) => ((n % N) + N) % N;
const activeIndex = () => mod(Math.round(target));

function measure() {
  W = Math.min(340, innerWidth * 0.78);
  R = (W / 2) / Math.tan(Math.PI / N) + 34;
  track.style.setProperty('--w', W + 'px');
  render();
}
function render() {
  track.style.transform = `translateZ(${-R}px)`;
  cards.forEach((c, i) => {
    let rel = mod(i - pos);
    if (rel > N / 2) rel -= N;
    const a = Math.abs(rel);
    c.style.transform = `rotateY(${rel * STEP}deg) translateZ(${R}px)`;
    c.style.opacity = Math.max(0, Math.min(1, 1 - (a - 1.5) / 1.1));
    c.style.setProperty('--dim', Math.min(a * 0.3, 0.75).toFixed(3));
    c.style.pointerEvents = a < 2.2 ? 'auto' : 'none';
    c.classList.toggle('active', a < 0.5);
  });
}
function tick() {
  if (!dragging) {
    const d = target - pos;
    pos += d * (reduce ? 1 : 0.12);
    if (Math.abs(d) < 0.0008) { pos = target; render(); raf = 0; return; }
  }
  render();
  raf = requestAnimationFrame(tick);
}
const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };
function updateUI() {
  const a = activeIndex();
  $('#arc-count').textContent = `${pad(a + 1)} / ${pad(N)}`;
  idxBtns.forEach((b, i) => b.classList.toggle('on', i === a));
}
function go(t) { target = t; kick(); updateUI(); }
function goNearest(i) {
  let d = mod(i - target);
  if (d > N / 2) d -= N;
  go(Math.round(target + d));
}

$('#arc-prev').addEventListener('click', () => go(Math.round(target) - 1));
$('#arc-next').addEventListener('click', () => go(Math.round(target) + 1));
idxBtns.forEach((b) => b.addEventListener('click', () => goNearest(+b.dataset.i)));
arc.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') { go(Math.round(target) - 1); e.preventDefault(); }
  if (e.key === 'ArrowRight') { go(Math.round(target) + 1); e.preventDefault(); }
  if (e.key === 'Enter' && e.target === arc) openCase(PROJECTS[activeIndex()].id);
});

// drag (pointer capture only after a real drag, so taps still click cards)
let startX = 0, startPos = 0, lastX = 0, lastT = 0, vel = 0, captured = false, suppressClick = false, downId = null;
stage.addEventListener('pointerdown', (e) => {
  if (e.button !== 0) return;
  downId = e.pointerId; startX = lastX = e.clientX; startPos = pos; lastT = performance.now(); vel = 0; captured = false;
});
stage.addEventListener('pointermove', (e) => {
  if (downId !== e.pointerId) return;
  const dx = e.clientX - startX;
  if (!captured && Math.abs(dx) > 6) { captured = true; dragging = true; stage.setPointerCapture(e.pointerId); stage.classList.add('dragging'); }
  if (!captured) return;
  const now = performance.now();
  vel = (e.clientX - lastX) / Math.max(1, now - lastT);
  lastX = e.clientX; lastT = now;
  pos = startPos - dx / (W * 0.9);
  kick();
});
const endDrag = (e) => {
  if (downId !== e.pointerId) return;
  downId = null;
  if (captured) {
    suppressClick = true; setTimeout(() => (suppressClick = false), 50);
    dragging = false; stage.classList.remove('dragging');
    go(Math.round(pos - vel * 2.2));
  }
};
stage.addEventListener('pointerup', endDrag);
stage.addEventListener('pointercancel', endDrag);
stage.addEventListener('wheel', (e) => {
  if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 12) {
    e.preventDefault();
    if (!wheelLock) { go(Math.round(target) + Math.sign(e.deltaX)); wheelLock = true; setTimeout(() => (wheelLock = false), 380); }
  }
}, { passive: false });
let wheelLock = false;
track.addEventListener('click', (e) => {
  if (suppressClick) { e.preventDefault(); return; }
  if (e.target.closest('a')) return;
  const c = e.target.closest('.pcard');
  if (!c) return;
  const i = +c.dataset.i;
  if (i === activeIndex()) openCase(PROJECTS[i].id); else goNearest(i);
});
addEventListener('resize', measure);
measure(); updateUI();

/* ---------------- case file dialog ---------------- */
const caseDlg = $('#case');
const caseInner = $('#case-inner');
function openCase(id) {
  const i = PROJECTS.findIndex((p) => p.id === id);
  if (i < 0) return;
  const p = PROJECTS[i];
  caseInner.style.setProperty('--pc', PALETTE[i % PALETTE.length]);
  caseInner.innerHTML = `
    <button class="case-close" type="button" data-close>close ✕</button>
    <header class="case-hero">
      <p class="case-cat">${pad(i + 1)} · ${esc(p.cat)}</p>
      <h2 id="case-title">${esc(p.title)}</h2>
      <p class="case-hook">${esc(p.hook)}</p>
      ${p.repo ? `<a class="btn btn-gh case-gh" href="${p.repo}" target="_blank" rel="noopener">${GH}View code on GitHub ↗</a>` : ''}
      <dl class="case-meta">
        <div><dt>when / where</dt><dd>${esc(p.when)}</dd></div>
        <div><dt>role</dt><dd>${esc(p.role)}</dd></div>
      </dl>
    </header>
    <div class="case-body">
      <section><h3>Overview</h3><p>${esc(p.summary)}</p></section>
      <section><h3>The challenge</h3><p>${esc(p.problem)}</p></section>
      <section><h3>What I built</h3><ol class="case-built">${p.built.map((b) => `<li>${esc(b)}</li>`).join('')}</ol></section>
      ${p.numbers.length ? `<section><h3>Key figures</h3><div class="case-nums">${p.numbers.map(([n, l]) => `<div><b>${esc(n)}</b><span>${esc(l)}</span></div>`).join('')}</div></section>` : ''}
      ${p.features?.length ? `<section><h3>Key features</h3><div class="case-feats">${p.features.map((f) => `
        <article class="case-feat">
          <button class="ev" type="button" data-lb="feat-${p.id}" data-src="${f.src}" data-cap="${esc(f.title + ' · ' + f.text)}"><img src="${f.src}" alt="${esc(p.title + ': ' + f.title)}" loading="lazy"></button>
          <div><h4>${esc(f.title)}</h4><p>${esc(f.text)}</p></div>
        </article>`).join('')}</div></section>` : ''}
      <section><h3>Tools &amp; technologies</h3>${toolChips(p.tools)}</section>
      ${p.evidence.length ? `<section><h3>Evidence</h3><div class="case-ev">${evThumbs(p.evidence, 'case-' + p.id)}</div></section>` : ''}
    </div>`;
  caseDlg.showModal();
  caseDlg.scrollTop = 0;
}
caseDlg.addEventListener('click', (e) => {
  if (e.target === caseDlg || e.target.closest('[data-close]')) caseDlg.close();
});
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-case]');
  if (b) openCase(b.dataset.case);
});

/* ---------------- skills + proof ---------------- */
const proofIdx = new Map();
const addProof = (tool, item) => {
  const k = tool.toLowerCase();
  if (!proofIdx.has(k)) proofIdx.set(k, []);
  proofIdx.get(k).push(item);
};
PROJECTS.forEach((p) => p.tools.forEach((t) => addProof(t, { kind: 'project', id: p.id, title: p.title })));
EXPERIENCE.forEach((e) => e.tools.forEach((t) => addProof(t, { kind: 'role', id: e.id, title: e.org })));
const proofFor = (s) => {
  const seen = new Set(), out = [];
  [s.n, ...(s.also || [])].forEach((k) => (proofIdx.get(k.toLowerCase()) || []).forEach((it) => {
    const key = it.kind + it.id;
    if (!seen.has(key)) { seen.add(key); out.push(it); }
  }));
  return out;
};

const stack = $('#stack');
const allSkills = [];
stack.innerHTML = SKILLS.map((g, gi) => `
  <div class="fn reveal" style="--i:${gi}">
    <p class="fn-sig"><span class="kw">def</span> <span class="nm">${g.fn}</span>(): <span class="cm"># ${esc(g.sig)}</span></p>
    <div class="chips">${g.items.map((s) => {
      const proof = proofFor(s);
      const id = allSkills.push({ ...s, proof }) - 1;
      return proof.length
        ? `<button type="button" class="chip" data-s="${id}">${esc(s.n)}<sup>${proof.length}</sup></button>`
        : `<span class="chip">${esc(s.n)}</span>`;
    }).join('')}</div>
  </div>`).join('');

const proofBox = $('#proof');
stack.addEventListener('click', (e) => {
  const b = e.target.closest('button.chip');
  if (!b) return;
  const s = allSkills[+b.dataset.s];
  const wasOn = b.classList.contains('on');
  $$('button.chip.on', stack).forEach((x) => x.classList.remove('on'));
  if (wasOn) { proofBox.innerHTML = '<p class="proof-empty">Select a skill with a number to see where it was used.</p>'; return; }
  b.classList.add('on');
  proofBox.innerHTML = `
    <p class="proof-h"><b>${esc(s.n)}</b> · applied in ${s.proof.length} ${s.proof.length > 1 ? 'places' : 'place'}</p>
    <ul>${s.proof.map((it, i) => `<li><button type="button" style="--i:${i}" data-kind="${it.kind}" data-id="${it.id}">${esc(it.title)}<span>${it.kind === 'project' ? 'project' : 'role'}</span></button></li>`).join('')}</ul>`;
});
proofBox.addEventListener('click', (e) => {
  const b = e.target.closest('button[data-kind]');
  if (!b) return;
  if (b.dataset.kind === 'project') openCase(b.dataset.id);
  else {
    const el = document.getElementById('role-' + b.dataset.id);
    el?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    el?.animate([{ background: 'rgba(242,183,102,.14)' }, { background: 'transparent' }], { duration: 1600, easing: 'ease-out' });
  }
});

/* ---------------- lightbox ---------------- */
const lb = $('#lb'), lbImg = $('#lb-img'), lbCap = $('#lb-cap');
const lbPrev = $('.lb-prev', lb), lbNext = $('.lb-next', lb);
let lbItems = [], lbAt = 0;
function lbShow(i) {
  lbAt = (i + lbItems.length) % lbItems.length;
  const it = lbItems[lbAt];
  lbImg.src = it.src; lbImg.alt = it.cap; lbCap.textContent = it.cap + (lbItems.length > 1 ? `  ·  ${lbAt + 1}/${lbItems.length}` : '');
  lbPrev.hidden = lbNext.hidden = lbItems.length < 2;
}
document.addEventListener('click', (e) => {
  const t = e.target.closest('.ev[data-src]');
  if (!t) return;
  const group = t.dataset.lb;
  const els = group ? $$(`.ev[data-lb="${group}"]`) : [t];
  lbItems = [];
  let start = 0;
  els.forEach((el) => {
    if (el === t) start = lbItems.length;
    lbItems.push({ src: el.dataset.src, cap: el.dataset.cap || '' });
    (el.dataset.more || '').split(';').filter(Boolean).forEach((m) => {
      const [src, cap] = m.split('|');
      lbItems.push({ src, cap: cap || '' });
    });
  });
  lbShow(start);
  lb.showModal();
});
lbPrev.addEventListener('click', () => lbShow(lbAt - 1));
lbNext.addEventListener('click', () => lbShow(lbAt + 1));
lb.addEventListener('click', (e) => { if (e.target === lb || e.target.closest('[data-close]')) lb.close(); });
lb.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') lbShow(lbAt - 1);
  if (e.key === 'ArrowRight') lbShow(lbAt + 1);
});

/* ---------------- contact ---------------- */
const toast = $('#toast');
let toastT;
function say(msg) {
  toast.textContent = msg; toast.classList.add('on');
  clearTimeout(toastT); toastT = setTimeout(() => toast.classList.remove('on'), 2200);
}
$('#copy-email').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(CONTACT.email); say('Email address copied'); }
  catch { location.href = 'mailto:' + CONTACT.email; }
});

/* ---------------- reveal + count-up ---------------- */
function countUp(el) {
  const end = parseFloat(el.dataset.count), dec = +(el.dataset.decimals || 0), suf = el.dataset.suffix || '';
  const fmt = (v) => v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suf;
  if (reduce) return (el.textContent = fmt(end));
  const t0 = performance.now(), dur = 1400;
  const step = (now) => {
    const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
    el.textContent = fmt(dec ? end * e : Math.round(end * e));
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    if (!en.isIntersecting) return;
    en.target.classList.add('in');
    $$('[data-count]', en.target).forEach(countUp);
    revealObs.unobserve(en.target);
  });
}, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
$$('.reveal, .gitlog').forEach((el) => revealObs.observe(el));

/* ---------------- gentle pointer tilt on trip cards ---------------- */
if (matchMedia('(hover: hover) and (pointer: fine)').matches && !reduce) {
  $$('.tilt').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(900px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) translateY(-4px)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });
}

/* ---------------- section-to-section flow ----------------
   Drives --in / --out on every section from its scroll position:
   content slides in from the right as a section arrives and drifts
   to the left (fading slightly) as it leaves. CSS does the rest. */
if (!reduce) {
  const flowEls = [$('.hero'), ...$$('.sec')].filter(Boolean);
  const clamp01 = (v) => Math.min(1, Math.max(0, v));
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  let flowRaf = 0;
  const flow = () => {
    flowRaf = 0;
    const vh = innerHeight;
    const maxScroll = document.documentElement.scrollHeight - vh;
    const left = Math.max(0, maxScroll - scrollY); // how far the page can still scroll
    for (const el of flowEls) {
      const r = el.getBoundingClientRect();
      let vin = 1;
      if (!el.classList.contains('hero')) {
        // fully "in" once the top reaches 35% of the viewport, or the highest it can ever get
        const endTop = Math.max(vh * 0.35, r.top - left);
        vin = endTop >= vh - 1 ? 1 : clamp01((vh - r.top) / (vh - endTop));
      }
      const vout = clamp01((vh * 0.45 - r.bottom) / (vh * 0.45));
      el.style.setProperty('--in', easeOut(vin).toFixed(3));
      el.style.setProperty('--out', vout.toFixed(3));
    }
  };
  const queue = () => { if (!flowRaf) flowRaf = requestAnimationFrame(flow); };
  document.documentElement.classList.add('flow');
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue);
  addEventListener('load', queue);
  flow();
}
