// Inbox density modes — Questify, LIGHT theme (matches the real app screenshot).
// Normal (current) vs Compact vs Ultra-compact, full-screen with sidebar for context.

var useState = React.useState;

// ============ THEME (light, from screenshot) ===============================
var T = {
  bg: '#fafaf9',
  bgElev: '#ffffff',
  bgSubtle: '#f4f4f5',
  sidebar: '#fafaf9',
  border: '#ececec',
  borderStrong: '#e0dedd',
  text: '#1c1c1f',
  textDim: '#71717a',
  textFaint: '#a1a1aa',
  accent: 'oklch(0.55 0.20 277)',
  accentFg: '#ffffff',
  accentSubtle: 'oklch(0.96 0.025 277)',
  accentText: 'oklch(0.52 0.20 277)',
  accentBorder: 'oklch(0.90 0.05 277)',
};

var DIFF = {
  Easy:   { bg: 'oklch(0.95 0.05 150)', fg: 'oklch(0.48 0.12 150)', dot: 'oklch(0.62 0.14 150)' },
  Medium: { bg: 'oklch(0.95 0.04 230)', fg: 'oklch(0.50 0.13 240)', dot: 'oklch(0.62 0.13 235)' },
  Hard:   { bg: 'oklch(0.95 0.045 45)', fg: 'oklch(0.52 0.15 40)',  dot: 'oklch(0.65 0.16 42)' },
  Epic:   { bg: 'oklch(0.95 0.04 295)', fg: 'oklch(0.50 0.17 295)', dot: 'oklch(0.58 0.18 295)' },
};

// ============ DATA (from the screenshot) ===================================
var QUESTS = [
  { t: 'DAT Meowsik', d: 'Epic', xp: 150, r: 'Work' },
  { t: 'Ajout collaboration dans un projet (backend + frontend)', d: 'Epic', xp: 150, r: 'Projects' },
  { t: 'Cours Linux Fundation (LFS158)', d: 'Epic', xp: 150, r: 'Projects' },
  { t: 'Fix backups Questify', d: 'Hard', xp: 100, r: 'Projects' },
  { t: 'Migrations DB avec Flyway', d: 'Hard', xp: 100, r: 'Projects' },
  { t: 'Add backups (PVC)', d: 'Hard', xp: 100, r: 'Projects' },
  { t: 'Dashboard stats artist', d: 'Medium', xp: 75, r: 'Work' },
  { t: "Ajouter la possibilité d'assigner une personne à une quest", d: 'Medium', xp: 75, r: 'Projects' },
  { t: 'Home Dashboard Grafana sur chaque env.', d: 'Medium', xp: 75, r: 'Work' },
  { t: 'Fix affichage collaboration par projet', d: 'Easy', xp: 50, r: 'Projects' },
  { t: 'Mise en place VIP', d: 'Easy', xp: 50, r: 'Work' },
  { t: 'Réponse mail propriétaire', d: 'Easy', xp: 40, r: 'Life' },
];

// ============ atoms ========================================================
var Check = ({ size = 18 }) => (
  <span style={{ width: size, height: size, flexShrink: 0, borderRadius: size > 16 ? 6 : 5,
    border: `1.5px solid ${T.borderStrong}`, background: T.bgElev, display: 'inline-block' }} />
);

var DiffPill = ({ d }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 500,
    padding: '3px 9px', borderRadius: 6, background: DIFF[d].bg, color: DIFF[d].fg }}>
    <span style={{ width: 6, height: 6, borderRadius: 2, background: DIFF[d].dot }} /> {d}
  </span>
);

var DiffDot = ({ d, size = 7 }) => (
  <span title={d} style={{ width: size, height: size, borderRadius: 2, background: DIFF[d].dot, flexShrink: 0, display: 'inline-block' }} />
);

var XP = ({ xp, mini }) => (
  <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 2, fontFamily: 'Geist Mono, monospace',
    fontSize: mini ? 11 : 12, fontWeight: 500, padding: mini ? '2px 7px' : '3px 9px', borderRadius: 999,
    background: T.accentSubtle, color: T.accentText, border: `1px solid ${T.accentBorder}` }}>
    +{xp}<span style={{ fontSize: mini ? 8 : 9, opacity: 0.7 }}>XP</span></span>
);

// ============ shell (sidebar + topbar + hero + search) =====================
var Shell = ({ children, segmented }) => (
  <div style={{ width: '100%', height: '100%', display: 'flex', background: T.bg, color: T.text,
    fontFamily: 'Geist, sans-serif', overflow: 'hidden' }}>
    <SidebarMini />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 22px', height: 48,
        borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
        <span style={{ color: T.textDim, display: 'flex' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
        </span>
        <span style={{ fontSize: 13.5, fontWeight: 500 }}>Inbox</span>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 11px',
          background: T.bgElev, borderRadius: 999, border: `1px solid ${T.border}` }}>
          <span style={{ color: T.accent, fontSize: 11 }}>⚡</span>
          <span style={{ fontFamily: 'Geist Mono', fontSize: 12, fontWeight: 500 }}>5 800 XP</span>
          <span style={{ width: 1, height: 10, background: T.border }} />
          <span style={{ fontSize: 11, color: T.textDim }}>Lvl 11</span>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '22px 28px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em' }}>Inbox</h1>
            <div style={{ fontSize: 13.5, color: T.textDim, marginTop: 4 }}>All quests, unassigned &amp; pending</div>
          </div>
          <button style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 13px', fontSize: 13,
            fontWeight: 500, background: T.accent, color: T.accentFg, border: 'none', borderRadius: 8, cursor: 'pointer' }}>
            + New quest</button>
        </div>
        {/* Search + density control */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 13px',
            background: T.bgElev, borderRadius: 9, border: `1px solid ${T.border}` }}>
            <span style={{ color: T.textFaint }}>⌕</span>
            <span style={{ flex: 1, fontSize: 13, color: T.textFaint }}>Search quests…</span>
            <span style={{ fontFamily: 'Geist Mono', fontSize: 10, padding: '2px 6px', background: T.bgSubtle,
              color: T.textFaint, border: `1px solid ${T.border}`, borderRadius: 4 }}>⌘K</span>
          </div>
          {segmented}
          <Ctl icon="▽" label="All" />
          <Ctl icon="↕" label="Due date" />
        </div>
        {/* Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {[['All', 12, true], ['Today', 0, false], ['Overdue', 0, false]].map(([l, n, a]) => (
              <span key={l} style={{ padding: '5px 11px', fontSize: 12.5, fontWeight: a ? 500 : 400,
                color: a ? T.text : T.textDim, background: a ? T.bgSubtle : 'transparent', borderRadius: 7 }}>
                {l} <span style={{ fontFamily: 'Geist Mono', color: T.textFaint, marginLeft: 3 }}>{n}</span></span>
            ))}
          </div>
          <span style={{ fontSize: 12, color: T.textFaint, fontFamily: 'Geist Mono' }}>12 of 12</span>
        </div>
        {children}
      </div>
    </div>
  </div>
);

var Ctl = ({ icon, label }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 11px', fontSize: 12.5,
    color: T.textDim, background: T.bgElev, border: `1px solid ${T.border}`, borderRadius: 9 }}>
    <span style={{ fontSize: 11 }}>{icon}</span>{label}</span>
);

var SidebarMini = () => {
  const nav = [['Inbox', '◰', true], ['Today', '◎', false], ['Upcoming', '↻', false], ['Habits', '⇄', false], ['Regions', '◍', false]];
  const proj = [['Polytech', 'oklch(0.6 0.14 270)'], ['Firelink', 'oklch(0.65 0.17 35)'], ['CKA', 'oklch(0.62 0.12 200)'], ['Questify', 'oklch(0.6 0.16 290)']];
  return (
    <div style={{ width: 210, flexShrink: 0, background: T.sidebar, borderRight: `1px solid ${T.border}`,
      padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 4, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '4px 6px 12px' }}>
        <span style={{ width: 30, height: 30, borderRadius: '50%', background: 'oklch(0.6 0.16 290)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 600, fontSize: 13 }}>A</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Axel</div>
          <div style={{ fontSize: 10.5, color: T.textFaint }}>Lvl 11 · Explorer</div>
        </div>
      </div>
      <SbLabel>Navigation</SbLabel>
      {nav.map(([l, ic, a]) => (
        <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 9px', borderRadius: 7,
          background: a ? '#ecebe9' : 'transparent', fontSize: 13, fontWeight: a ? 500 : 400, color: a ? T.text : T.textDim }}>
          <span style={{ fontSize: 13, width: 15, color: a ? T.accent : T.textFaint }}>{ic}</span>{l}</div>
      ))}
      <SbLabel>Projects</SbLabel>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 9px', fontSize: 13, color: T.textDim }}>
        <span style={{ width: 15, color: T.textFaint }}>▤</span>View all</div>
      {proj.map(([l, c]) => (
        <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 9px', fontSize: 13, color: T.textDim }}>
          <span style={{ width: 15, display: 'flex', justifyContent: 'center' }}>
            <span style={{ width: 9, height: 9, borderRadius: 3, background: c }} /></span>{l}</div>
      ))}
      <SbLabel>Insights</SbLabel>
      {[['Progress','↗'],['Stats','▦'],['History','◷']].map(([l, ic]) => (
        <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 9px', fontSize: 13, color: T.textDim }}>
          <span style={{ width: 15, color: T.textFaint }}>{ic}</span>{l}</div>
      ))}
    </div>
  );
};

var SbLabel = ({ children }) => (
  <div style={{ fontSize: 10.5, color: T.textFaint, fontWeight: 500, textTransform: 'uppercase',
    letterSpacing: '0.06em', padding: '12px 9px 4px' }}>{children}</div>
);

var DensityToggle = ({ active }) => (
  <div style={{ display: 'flex', padding: 3, background: T.bgElev, border: `1px solid ${T.border}`, borderRadius: 9 }}>
    {[['Normal','≣'], ['Compact','☰'], ['Ultra','▤']].map(([l, ic]) => (
      <span key={l} title={l} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px',
        fontSize: 12, borderRadius: 6, fontWeight: 500,
        background: l === active ? T.accentSubtle : 'transparent',
        color: l === active ? T.accentText : T.textDim,
        border: `1px solid ${l === active ? T.accentBorder : 'transparent'}` }}>
        <span style={{ fontSize: 11 }}>{ic}</span>{l}</span>
    ))}
  </div>
);

// ===========================================================================
// NORMAL — current (faithful to screenshot)
// ===========================================================================
var Normal = () => (
  <Shell segmented={<DensityToggle active="Normal" />}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {QUESTS.map((q, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', gap: 16,
          padding: '16px 18px', background: T.bgElev, border: `1px solid ${T.border}`, borderRadius: 10 }}>
          <Check size={20} />
          <div>
            <div style={{ fontSize: 14.5, fontWeight: 600 }}>{q.t}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 9 }}>
              <DiffPill d={q.d} />
              <span style={{ fontSize: 12, color: T.textFaint }}>· {q.r}</span>
            </div>
          </div>
          <XP xp={q.xp} />
        </div>
      ))}
    </div>
  </Shell>
);

// ===========================================================================
// COMPACT — single line, table-like, ~3x denser
// ===========================================================================
var Compact = () => (
  <Shell segmented={<DensityToggle active="Compact" />}>
    <div style={{ background: T.bgElev, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
      {QUESTS.map((q, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto auto auto', alignItems: 'center',
          gap: 14, padding: '10px 16px', borderTop: i === 0 ? 'none' : `1px solid ${T.border}`, minHeight: 42 }}>
          <Check size={16} />
          <span style={{ fontSize: 13.5, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{q.t}</span>
          <DiffPill d={q.d} />
          <span style={{ fontSize: 12, color: T.textFaint, minWidth: 64, textAlign: 'right' }}>{q.r}</span>
          <span style={{ minWidth: 58, display: 'flex', justifyContent: 'flex-end' }}><XP xp={q.xp} mini /></span>
        </div>
      ))}
    </div>
  </Shell>
);

// ===========================================================================
// ULTRA — maximum density, diff as dot only, the whole inbox on one screen
// ===========================================================================
var Ultra = () => (
  <Shell segmented={<DensityToggle active="Ultra" />}>
    <div style={{ background: T.bgElev, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
      {QUESTS.map((q, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: 'auto auto 1fr auto auto', alignItems: 'center',
          gap: 11, padding: '5px 14px', borderTop: i === 0 ? 'none' : `1px solid ${T.border}`, minHeight: 30 }}>
          <Check size={14} />
          <DiffDot d={q.d} />
          <span style={{ fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{q.t}</span>
          <span style={{ fontSize: 11.5, color: T.textFaint, minWidth: 60, textAlign: 'right' }}>{q.r}</span>
          <span style={{ fontFamily: 'Geist Mono', fontSize: 11.5, color: T.accentText, minWidth: 40, textAlign: 'right' }}>+{q.xp}</span>
        </div>
      ))}
    </div>
  </Shell>
);

window.DensityVariants = { Normal, Compact, Ultra };
