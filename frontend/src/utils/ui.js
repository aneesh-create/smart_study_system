import React from 'react';

/* ── Progress Ring SVG ─────────────────────────────────────── */
export function ProgressRing({ pct = 0, color = '#4f8ef7', size = 64, stroke = 6 }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * (1 - pct / 100);
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1f2d45" strokeWidth={stroke} />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={dash} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
    </svg>
  );
}

/* ── Mini Bar Sparkline ─────────────────────────────────────── */
export function MiniBar({ scores = [], color = '#4f8ef7' }) {
  if (!scores.length) return null;
  const max = Math.max(...scores, 1);
  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 40 }}>
      {scores.map((s, i) => (
        <div key={i} style={{
          width: 10, borderRadius: 3, minHeight: 4,
          height: `${(s / max) * 100}%`,
          background: i === scores.length - 1 ? color : 'rgba(255,255,255,0.14)',
        }} />
      ))}
    </div>
  );
}

/* ── Donut Chart ───────────────────────────────────────────── */
export function DonutChart({ data = [], size = 120 }) {
  if (!data.length) return null;
  const total = data.reduce((a, d) => a + (d.value || 0), 0) || 1;
  let cum = 0;
  const cx = size / 2, cy = size / 2, R = 48, IR = 30;

  function polar(pct, r) {
    const a = pct * 2 * Math.PI - Math.PI / 2;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  }

  return (
    <svg width={size} height={size}>
      {data.map((d, i) => {
        const pct = d.value / total;
        const start = cum; cum += pct;
        const [x1, y1] = polar(start, R);
        const [x2, y2] = polar(start + pct, R);
        const [ix1, iy1] = polar(start, IR);
        const [ix2, iy2] = polar(start + pct, IR);
        const large = pct > 0.5 ? 1 : 0;
        return (
          <path key={i}
            d={`M${x1} ${y1} A${R} ${R} 0 ${large} 1 ${x2} ${y2} L${ix2} ${iy2} A${IR} ${IR} 0 ${large} 0 ${ix1} ${iy1} Z`}
            fill={d.color || '#4f8ef7'} opacity={0.9}
          />
        );
      })}
    </svg>
  );
}

/* ── Spinner ────────────────────────────────────────────────── */
export function Spinner({ size = 16 }) {
  return <span className="spinner" style={{ width: size, height: size }} />;
}

/* ── Toggle Switch ──────────────────────────────────────────── */
export function Toggle({ value, onChange }) {
  return (
    <div
      className="toggle-wrap"
      style={{ background: value ? 'var(--accent)' : 'var(--border)' }}
      onClick={() => onChange(!value)}
    >
      <div className="toggle-thumb" style={{ left: value ? 23 : 3 }} />
    </div>
  );
}

/* ── Empty State ────────────────────────────────────────────── */
export function EmptyState({ icon = '📭', title = 'Nothing here', desc = '' }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text3)' }}>
      <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>{icon}</div>
      <div style={{ fontWeight: 700, color: 'var(--text2)', marginBottom: 4 }}>{title}</div>
      {desc && <div style={{ fontSize: '0.82rem' }}>{desc}</div>}
    </div>
  );
}

/* ── Diff label ─────────────────────────────────────────────── */
export const difficultyLabel = d =>
  ['', 'Very Easy', 'Easy', 'Medium', 'Hard', 'Very Hard'][d] || 'Unknown';

export const difficultyTagClass = d =>
  d >= 4 ? 'tag-red' : d === 3 ? 'tag-yellow' : 'tag-green';

/* ── Days left badge ────────────────────────────────────────── */
export function DaysLeft({ date }) {
  if (!date) return null;
  const days = Math.ceil((new Date(date) - Date.now()) / 86400000);
  const cls = days < 7 ? 'tag-red' : days < 14 ? 'tag-yellow' : 'tag-green';
  return <span className={`tag ${cls}`}>{days <= 0 ? 'Today!' : `${days}d left`}</span>;
}
