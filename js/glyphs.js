// The section glyphs. Each section of the site is one glyph in the orbit.
// Every glyph is a list of strokes in a ~1.2-unit box (y points up).
// The same data draws the 3D tubes in orbit.js and the flat SVG icons in app.js.

const arc = (cx, cy, r, a0, a1, n) =>
  Array.from({ length: n + 1 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / n;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  });

const brace = (s) => ({
  smooth: true,
  pts: [[-0.12, 0.58], [-0.28, 0.5], [-0.3, 0.16], [-0.46, 0], [-0.3, -0.16], [-0.28, -0.5], [-0.12, -0.58]]
    .map(([x, y]) => [x * s, y]),
});

export const GLYPHS = [
  {
    id: 'projects', name: 'projects', label: '</>', color: '#e5483a',
    strokes: [
      { pts: [[-0.22, 0.34], [-0.56, 0], [-0.22, -0.34]] },
      { pts: [[0.13, 0.52], [-0.13, -0.52]] },
      { pts: [[0.22, 0.34], [0.56, 0], [0.22, -0.34]] },
    ],
  },
  {
    id: 'experience', name: 'experience', label: '{ }', color: '#d0701c',
    strokes: [brace(1), brace(-1)],
  },
  {
    id: 'skills', name: 'skills', label: 'λ', color: '#5b3fd8',
    strokes: [
      { pts: [[-0.38, 0.58], [-0.16, 0.58], [0.38, -0.58]] },
      { pts: [[0.11, 0.0], [-0.34, -0.58]] },
    ],
  },
  {
    id: 'education', name: 'education', label: '++', color: '#2d6ad6',
    strokes: [
      { pts: [[-0.58, 0], [-0.12, 0]] }, { pts: [[-0.35, 0.23], [-0.35, -0.23]] },
      { pts: [[0.12, 0], [0.58, 0]] }, { pts: [[0.35, 0.23], [0.35, -0.23]] },
    ],
  },
  {
    id: 'offscreen', name: 'events', label: '~/', color: '#a04ad0',
    strokes: [
      { smooth: true, pts: [[-0.62, -0.04], [-0.48, 0.12], [-0.32, 0.06], [-0.18, -0.08], [-0.04, 0.06]] },
      { pts: [[0.12, -0.52], [0.52, 0.52]] },
    ],
  },
  {
    id: 'contact', name: 'contact', label: '@', color: '#d93f78',
    strokes: [
      { smooth: true, closed: true, pts: arc(-0.03, 0, 0.17, 0, Math.PI * 2, 10).slice(0, 10) },
      {
        smooth: true,
        pts: [[0.14, 0.2], [0.14, -0.06], [0.2, -0.18], [0.32, -0.19], [0.42, -0.06],
          ...arc(-0.03, 0, 0.46, 0.12, 5.05, 14)],
      },
    ],
  },
];

// heading-only glyphs (not part of the orbit)
export const EXTRA_GLYPHS = [
  {
    id: 'development', name: 'development', label: '*', color: '#2d6ad6',
    strokes: [
      { pts: [[0, 0.56], [0, -0.56]] },
      { pts: [[-0.48, 0.28], [0.48, -0.28]] },
      { pts: [[-0.48, -0.28], [0.48, 0.28]] },
    ],
  },
  {
    id: 'leadership', name: 'leadership', label: '^', color: '#5b3fd8',
    strokes: [
      { pts: [[-0.5, -0.02], [0, 0.48], [0.5, -0.02]] },
      { pts: [[-0.5, -0.5], [0, 0], [0.5, -0.5]] },
    ],
  },
];

export const byId = Object.fromEntries([...GLYPHS, ...EXTRA_GLYPHS].map((g) => [g.id, g]));

// --- flat SVG version (for nav, headings, fallback) -----------------------
const f = (n) => +n.toFixed(3);

function pathFor(stroke) {
  const p = stroke.pts.map(([x, y]) => [x, -y]); // svg y points down
  if (!stroke.smooth) return 'M' + p.map(([x, y]) => `${f(x)} ${f(y)}`).join('L');
  // Catmull-Rom -> cubic bezier
  const n = p.length, closed = !!stroke.closed;
  const at = (i) => closed ? p[(i + n) % n] : p[Math.max(0, Math.min(n - 1, i))];
  let d = `M${f(p[0][0])} ${f(p[0][1])}`;
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return closed ? d + 'Z' : d;
}

export function glyphSVG(id, { stroke = 0.13 } = {}) {
  const g = byId[id];
  if (!g) return '';
  const paths = g.strokes.map((s) => `<path pathLength="1" d="${pathFor(s)}"/>`).join('');
  return `<svg viewBox="-0.75 -0.75 1.5 1.5" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
}
