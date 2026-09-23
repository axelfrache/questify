// Inbox view variants — Questify, dark linear theme.
// All variants share data and a slim topbar; only the body content differs.

var useState = React.useState;
var useEffect = React.useEffect;
var useMemo = React.useMemo;

// ============ THEME ========================================================
var T = {
  bg: '#0a0a0a',
  bgElev: '#141414',
  bgSubtle: '#1c1c1c',
  bgHover: '#242424',
  border: '#262626',
  borderStrong: '#353535',
  text: '#fafafa',
  textDim: '#a1a1aa',
  textFaint: '#71717a',
  accent: 'oklch(0.70 0.16 275)',
  accentFg: '#0a0a0a',
  accentSubtle: 'oklch(0.22 0.05 275)',
  accentBorder: 'oklch(0.35 0.10 275)',
  danger: 'oklch(0.65 0.18 25)',
  dangerSubtle: 'oklch(0.30 0.10 25)',
  warn: 'oklch(0.75 0.14 75)',
};

var DIFF_TINT = {
  Trivial: 'oklch(0.78 0.02 270)',
  Easy:    'oklch(0.78 0.10 150)',
  Medium:  'oklch(0.75 0.12 230)',
  Hard:    'oklch(0.72 0.14 45)',
  Epic:    'oklch(0.65 0.18 290)',
};

var PROJECT_TINT = {
  Polytech:   'oklch(0.62 0.14 270)',
  Firelink:   'oklch(0.70 0.16 30)',
  Questify:   'oklch(0.65 0.14 220)',
  CKA:        'oklch(0.65 0.12 150)',
  Appartement:'oklch(0.70 0.10 75)',
};

// ============ DATA — realistic inbox items =================================
// Mix of: dated/undated, project/no project, fresh/stale, easy/epic
var INBOX = [
  { id: 'i1', title: 'Préparer talk OTel', diff: 'Epic', xp: 150, project: 'Polytech', due: null, age: 2, region: null },
  { id: 'i2', title: 'Cours Linux Foundation (LFS158)', diff: 'Epic', xp: 150, project: 'Polytech', due: null, age: 12, region: null },
  { id: 'i3', title: 'Update Upcoming view with calendar', diff: 'Hard', xp: 100, project: 'Questify', due: '2026-05-22', age: 4, region: 'Work' },
  { id: 'i4', title: 'Add nodes (custom or VPS)', diff: 'Hard', xp: 100, project: 'Firelink', due: null, age: 8, region: 'Work' },
  { id: 'i5', title: 'Enhance dark mode (colors → background)', diff: 'Easy', xp: 50, project: 'Questify', due: null, age: 1, region: null },
  { id: 'i6', title: 'Réserver bar Polycloud', diff: 'Medium', xp: 75, project: null, due: '2026-05-18', age: 6, region: 'Work', overdue: true },
  { id: 'i7', title: 'Renouveler passeport', diff: 'Medium', xp: 60, project: null, due: null, age: 21, region: null },
  { id: 'i8', title: 'Réponse mail propriétaire', diff: 'Trivial', xp: 15, project: null, due: '2026-05-20', age: 0, region: null },
  { id: 'i9', title: 'Lire papier "Designing Data-Intensive Apps" ch.5', diff: 'Easy', xp: 40, project: null, due: null, age: 14, region: 'Learn' },
  { id: 'i10', title: 'Demander devis salle de bain', diff: 'Medium', xp: 50, project: 'Appartement', due: null, age: 3, region: null },
  { id: 'i11', title: 'Pull requests à reviewer cette semaine', diff: 'Medium', xp: 60, project: null, due: '2026-05-23', age: 1, region: 'Work' },
  { id: 'i12', title: 'Setup monitoring Grafana stack', diff: 'Hard', xp: 100, project: 'Firelink', due: null, age: 9, region: null },
];

// ============ SHARED CHROME ===============================================
var Page = ({ children, hideNewQuest }) => (
  <div style={{
    width: '100%', height: '100%',
    background: T.bg, color: T.text,
    fontFamily: 'Geist, sans-serif',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
  }}>
    <Topbar />
    <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
      {children}
    </div>
  </div>
);

var Topbar = () => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 14,
    padding: '10px 20px', height: 46,
    borderBottom: `1px solid ${T.border}`, background: T.bgElev,
    flexShrink: 0,
  }}>
    <span style={{ color: T.textDim, display: 'flex' }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/>
      </svg>
    </span>
    <span style={{ fontSize: 13, color: T.text, fontWeight: 500 }}>Inbox</span>
    <div style={{ flex: 1 }} />
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: '4px 10px', background: T.bgSubtle, borderRadius: 999,
      border: `1px solid ${T.border}`,
    }}>
      <span style={{ color: T.accent, fontSize: 11 }}>⚡</span>
      <span style={{ fontFamily: 'Geist Mono', fontSize: 12, fontWeight: 500 }}>1 775 XP</span>
    </div>
  </div>
);

// ============ atoms ========================================================
var DiffDot = ({ diff, size = 6 }) => (
  <span style={{ display: 'inline-block', width: size, height: size, borderRadius: 1,
    background: DIFF_TINT[diff], flexShrink: 0 }} />
);

var DiffPill = ({ diff, mini }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 4,
    fontSize: mini ? 10 : 11, fontWeight: 500,
    padding: mini ? '1px 5px' : '2px 7px', borderRadius: 4,
    background: `color-mix(in oklch, ${DIFF_TINT[diff]} 14%, transparent)`,
    color: DIFF_TINT[diff],
    border: `1px solid color-mix(in oklch, ${DIFF_TINT[diff]} 24%, transparent)`,
  }}>
    <DiffDot diff={diff} size={4} /> {diff}
  </span>
);

var XPBadge = ({ xp, mini }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 2,
    fontFamily: 'Geist Mono', fontSize: mini ? 10 : 11, fontWeight: 500,
    padding: mini ? '1px 5px' : '2px 7px', borderRadius: 999,
    background: T.accentSubtle, color: T.accent,
    border: `1px solid ${T.accentBorder}`,
  }}>+{xp}<span style={{ fontSize: mini ? 8 : 9, opacity: 0.7 }}>XP</span></span>
);

var Checkbox = ({ size = 16 }) => (
  <span style={{
    width: size, height: size, flexShrink: 0,
    borderRadius: 4, border: `1.5px solid ${T.borderStrong}`,
    display: 'inline-block',
  }} />
);

var ProjectTag = ({ name, mini }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 4,
    fontSize: mini ? 10 : 11, color: T.textFaint,
  }}>
    <span style={{ width: 6, height: 6, borderRadius: 1.5,
      background: PROJECT_TINT[name] || T.textFaint }} />
    {name}
  </span>
);

var MetaTag = ({ children, tone = 'neutral', icon }) => {
  const palettes = {
    neutral: { fg: T.textFaint },
    warn: { fg: T.warn },
    danger: { fg: T.danger },
    accent: { fg: T.accent },
  };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      fontSize: 10.5, color: palettes[tone].fg,
    }}>
      {icon && <span style={{ display: 'flex' }}>{icon}</span>}
      {children}
    </span>
  );
};

// ============ Hero ========================================================
var Hero = ({ title, sub, right }) => (
  <div style={{ padding: '20px 28px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16 }}>
    <div>
      <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em' }}>{title}</h1>
      <div style={{ fontSize: 13, color: T.textDim, marginTop: 4 }}>{sub}</div>
    </div>
    {right}
  </div>
);

var NewQuestBtn = () => (
  <button style={{
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '7px 12px', fontSize: 13, fontWeight: 500,
    background: T.accent, color: T.accentFg,
    border: 'none', borderRadius: 8, cursor: 'pointer',
  }}>+ New quest</button>
);

// ===========================================================================
// CURRENT — flat list grouped by region (matches the screenshot)
// ===========================================================================
var Current = () => (
  <Page>
    <Hero title="Inbox" sub="All quests, unassigned & pending." right={<NewQuestBtn />} />
    <div style={{ overflowY: 'auto', height: '100%', padding: '0 28px 28px' }}>
      <SearchAndTabs />
      <GroupHeader name="Projects" count={5} icon="◎" tone="danger" />
      {INBOX.slice(0, 5).map(q => <BigRow key={q.id} q={q} />)}
      <div style={{ height: 18 }} />
      <GroupHeader name="Work" count={3} icon="⚒" overdue tone="warn" />
      {INBOX.slice(5, 8).map(q => <BigRow key={q.id} q={q} />)}
    </div>
  </Page>
);

var SearchAndTabs = () => (
  <>
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14,
      padding: '6px 12px', background: T.bgElev, borderRadius: 8,
      border: `1px solid ${T.border}`,
    }}>
      <span style={{ color: T.textFaint, fontSize: 13 }}>⌕</span>
      <span style={{ flex: 1, fontSize: 13, color: T.textFaint }}>Search quests…</span>
      <span style={{ fontFamily: 'Geist Mono', fontSize: 10, padding: '2px 5px',
        background: T.bgSubtle, color: T.textFaint, border: `1px solid ${T.border}`, borderRadius: 3 }}>⌘K</span>
      {['Region', 'Due date', 'Comfort'].map(f => (
        <span key={f} style={{ fontSize: 11, color: T.textDim, padding: '2px 8px' }}>{f}</span>
      ))}
    </div>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
      <div style={{ display: 'flex', gap: 6 }}>
        {[['All', 9, true], ['Today', 0, false], ['Overdue', 1, false]].map(([l, n, a]) => (
          <span key={l} style={{
            padding: '4px 10px', fontSize: 12, fontWeight: a ? 500 : 400,
            color: a ? T.text : T.textDim,
            background: a ? T.bgSubtle : 'transparent',
            border: `1px solid ${a ? T.borderStrong : 'transparent'}`,
            borderRadius: 6,
          }}>{l} <span style={{ fontFamily: 'Geist Mono', opacity: 0.6, marginLeft: 4 }}>{n}</span></span>
        ))}
      </div>
      <span style={{ fontSize: 11, color: T.textFaint, fontFamily: 'Geist Mono' }}>9 of 9</span>
    </div>
  </>
);

var GroupHeader = ({ name, count, icon, overdue, tone }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, padding: '0 4px' }}>
    <span style={{ width: 7, height: 7, borderRadius: '50%',
      background: tone === 'danger' ? T.danger : tone === 'warn' ? T.warn : T.textFaint }} />
    <span style={{ color: T.textDim, fontSize: 13 }}>{icon}</span>
    <span style={{ fontSize: 15, fontWeight: 600 }}>{name}</span>
    <div style={{ flex: 1 }} />
    <span style={{ fontSize: 11, color: T.textFaint, fontFamily: 'Geist Mono' }}>{count}</span>
    {overdue && (
      <span style={{
        padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 500,
        background: T.dangerSubtle, color: T.danger,
      }}>1 overdue</span>
    )}
    <span style={{ color: T.textFaint }}>☆</span>
  </div>
);

var BigRow = ({ q }) => (
  <div style={{
    display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center',
    gap: 14, padding: '14px 16px', marginBottom: 6,
    background: T.bgElev, border: `1px solid ${T.border}`, borderRadius: 8,
  }}>
    <Checkbox size={18} />
    <div>
      <div style={{ fontSize: 14, fontWeight: 500 }}>{q.title}</div>
      <div style={{ marginTop: 8 }}><DiffPill diff={q.diff} /></div>
    </div>
    <XPBadge xp={q.xp} />
  </div>
);

// ===========================================================================
// ① COMPACT — same idea, 3x denser, ditch the giant rows
// ===========================================================================
var Compact = () => (
  <Page>
    <Hero title="Inbox" sub="12 quests waiting." right={<NewQuestBtn />} />
    <div style={{ overflowY: 'auto', height: '100%', padding: '0 28px 28px' }}>
      <CompactSearch />
      <div style={{ background: T.bgElev, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
        {INBOX.map((q, i) => <CompactRow key={q.id} q={q} first={i === 0} />)}
      </div>
    </div>
  </Page>
);

var CompactSearch = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, fontSize: 12, color: T.textDim }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px',
      background: T.bgElev, borderRadius: 999, border: `1px solid ${T.border}`, flex: 1, maxWidth: 320 }}>
      <span style={{ color: T.textFaint }}>⌕</span>
      <span style={{ color: T.textFaint }}>Search…</span>
    </div>
    <span>Sort: <span style={{ color: T.text }}>Added · newest</span></span>
    <div style={{ flex: 1 }} />
    <span style={{ fontFamily: 'Geist Mono', fontSize: 11, color: T.textFaint }}>12 items · 950 XP</span>
  </div>
);

var CompactRow = ({ q, first }) => (
  <div style={{
    display: 'grid', gridTemplateColumns: 'auto 1fr auto auto auto auto', alignItems: 'center',
    gap: 12, padding: '8px 14px',
    borderTop: first ? 'none' : `1px solid ${T.border}`,
    minHeight: 36,
  }}>
    <Checkbox size={14} />
    <span style={{ fontSize: 13, color: T.text,
      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{q.title}</span>
    {q.project ? <ProjectTag name={q.project} mini /> : <span />}
    <DiffPill diff={q.diff} mini />
    <span style={{ fontSize: 10.5, color: q.overdue ? T.danger : T.textFaint, fontFamily: 'Geist Mono', minWidth: 60, textAlign: 'right' }}>
      {q.overdue ? 'overdue' : q.due ? q.due.slice(5) : '—'}
    </span>
    <span style={{ fontFamily: 'Geist Mono', fontSize: 10.5, color: T.accent, minWidth: 36, textAlign: 'right' }}>+{q.xp}</span>
  </div>
);

// ===========================================================================
// ② SMART SECTIONS — auto-grouped by what needs triaging
// ===========================================================================
var SmartSections = () => {
  const sections = [
    {
      id: 'overdue',
      title: 'Overdue',
      sub: 'These slipped past their due date.',
      tone: 'danger',
      pred: q => q.overdue,
      hint: 'Reschedule or archive',
    },
    {
      id: 'stale',
      title: 'Sitting here for a while',
      sub: 'Added more than a week ago, still no plan.',
      tone: 'warn',
      pred: q => !q.overdue && q.age >= 7,
      hint: 'Decide today: schedule, project, or delete',
    },
    {
      id: 'quickwins',
      title: 'Quick wins',
      sub: 'Easy or trivial — knock them out.',
      tone: 'accent',
      pred: q => !q.overdue && q.age < 7 && (q.diff === 'Easy' || q.diff === 'Trivial'),
      hint: 'Do now or batch later today',
    },
    {
      id: 'unscheduled',
      title: 'Needs a date',
      sub: 'No due date set.',
      tone: 'neutral',
      pred: q => !q.overdue && q.age < 7 && !q.due && q.diff !== 'Easy' && q.diff !== 'Trivial',
      hint: 'Drop into Today, Tomorrow, or pick a date',
    },
  ];
  const assigned = new Set();
  const built = sections.map(s => {
    const items = INBOX.filter(q => !assigned.has(q.id) && s.pred(q));
    items.forEach(q => assigned.add(q.id));
    return { ...s, items };
  }).filter(s => s.items.length > 0);
  const rest = INBOX.filter(q => !assigned.has(q.id));

  return (
    <Page>
      <Hero
        title="Inbox"
        sub="12 quests · grouped by what they need next."
        right={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: T.textDim }}>View:</span>
            <Segmented options={['Smart', 'Flat', 'By region']} active="Smart" />
            <NewQuestBtn />
          </div>
        }
      />
      <div style={{ overflowY: 'auto', height: '100%', padding: '0 28px 28px' }}>
        {built.map(s => <SmartSection key={s.id} section={s} />)}
        {rest.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: T.textFaint, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>
                Everything else
              </span>
              <div style={{ flex: 1, height: 1, background: T.border }} />
            </div>
            <div style={{ background: T.bgElev, border: `1px solid ${T.border}`, borderRadius: 8 }}>
              {rest.map((q, i) => <CompactRow key={q.id} q={q} first={i === 0} />)}
            </div>
          </div>
        )}
      </div>
    </Page>
  );
};

var Segmented = ({ options, active }) => (
  <div style={{ display: 'flex', padding: 3, background: T.bgElev, border: `1px solid ${T.border}`, borderRadius: 7 }}>
    {options.map(o => (
      <span key={o} style={{
        padding: '4px 10px', fontSize: 12, borderRadius: 5,
        background: o === active ? T.bgSubtle : 'transparent',
        color: o === active ? T.text : T.textDim,
        border: `1px solid ${o === active ? T.borderStrong : 'transparent'}`,
        fontWeight: 500,
      }}>{o}</span>
    ))}
  </div>
);

var SmartSection = ({ section }) => {
  const tones = {
    danger: { dot: T.danger, bd: T.dangerSubtle, bg: 'oklch(0.18 0.04 25)' },
    warn:   { dot: T.warn,   bd: `color-mix(in oklch, ${T.warn} 30%, transparent)`, bg: 'oklch(0.18 0.03 75)' },
    accent: { dot: T.accent, bd: T.accentBorder, bg: T.accentSubtle },
    neutral:{ dot: T.textFaint, bd: T.border, bg: T.bgElev },
  };
  const t = tones[section.tone];
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10,
        padding: '10px 14px', background: t.bg, border: `1px solid ${t.bd}`, borderRadius: 8,
      }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: t.dot, marginTop: 6, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{section.title}</span>
            <span style={{ fontFamily: 'Geist Mono', fontSize: 11, color: T.textFaint }}>{section.items.length}</span>
          </div>
          <div style={{ fontSize: 12, color: T.textDim, marginTop: 2 }}>{section.sub}</div>
        </div>
        <span style={{ fontSize: 11, color: T.textFaint, fontFamily: 'Geist Mono', fontStyle: 'italic' }}>
          {section.hint}
        </span>
      </div>
      <div style={{ background: T.bgElev, border: `1px solid ${T.border}`, borderRadius: 8 }}>
        {section.items.map((q, i) => <CompactRow key={q.id} q={q} first={i === 0} />)}
      </div>
    </div>
  );
};

// ===========================================================================
// ③ TRIAGE COLUMN — quick actions inline on each row
// ===========================================================================
var TriageColumn = () => {
  const [active, setActive] = useState('i2');
  return (
    <Page>
      <Hero
        title="Inbox"
        sub="Hover any row to schedule, snooze, or archive in one click."
        right={<NewQuestBtn />}
      />
      <div style={{ overflowY: 'auto', height: '100%', padding: '0 28px 28px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 820, margin: '0 auto' }}>
          {INBOX.map(q => (
            <TriageRow key={q.id} q={q} active={q.id === active} onHover={() => setActive(q.id)} />
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 18, fontSize: 11, color: T.textFaint, fontFamily: 'Geist Mono' }}>
          Tip: T = Today · M = Tomorrow · W = Next week · S = Schedule · E = Archive
        </div>
      </div>
    </Page>
  );
};

var TriageRow = ({ q, active, onHover }) => (
  <div
    onMouseEnter={onHover}
    style={{
      display: 'grid',
      gridTemplateColumns: active ? 'auto 1fr auto' : 'auto 1fr auto',
      alignItems: 'center', gap: 14,
      padding: '10px 14px',
      background: active ? T.bgHover : T.bgElev,
      border: `1px solid ${active ? T.borderStrong : T.border}`,
      borderRadius: 8,
      transition: 'background 100ms ease',
      position: 'relative',
    }}
  >
    <Checkbox />
    <div style={{ minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 14, fontWeight: 500,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{q.title}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11 }}>
        <DiffPill diff={q.diff} mini />
        {q.project && <ProjectTag name={q.project} mini />}
        {q.overdue ? (
          <MetaTag tone="danger">overdue</MetaTag>
        ) : q.age > 7 ? (
          <MetaTag tone="warn">{q.age}d old</MetaTag>
        ) : !q.due && !q.project ? (
          <MetaTag>no plan</MetaTag>
        ) : null}
        <XPBadge xp={q.xp} mini />
      </div>
    </div>
    {active ? (
      <div style={{ display: 'flex', gap: 4 }}>
        <ActBtn label="Today" hint="T" />
        <ActBtn label="Tomorrow" hint="M" />
        <ActBtn label="Next week" hint="W" />
        <ActBtn label="Schedule…" hint="S" />
        <div style={{ width: 1, background: T.border, margin: '0 2px' }} />
        <ActBtn label="Archive" hint="E" tone="danger" iconOnly icon="✕" />
      </div>
    ) : (
      <span style={{ fontSize: 10.5, color: T.textFaint, fontFamily: 'Geist Mono' }}>hover</span>
    )}
  </div>
);

var ActBtn = ({ label, hint, tone, iconOnly, icon }) => (
  <button style={{
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: iconOnly ? '5px 7px' : '5px 9px',
    fontSize: 11, fontWeight: 500,
    background: T.bgElev,
    color: tone === 'danger' ? T.danger : T.text,
    border: `1px solid ${T.border}`, borderRadius: 6, cursor: 'pointer',
  }}>
    {iconOnly ? icon : label}
    {!iconOnly && <kbd style={{
      fontFamily: 'Geist Mono', fontSize: 9.5,
      padding: '1px 4px', borderRadius: 3,
      background: T.bgSubtle, color: T.textFaint, border: `1px solid ${T.border}`,
    }}>{hint}</kbd>}
  </button>
);

// ===========================================================================
// ④ SPOTLIGHT — one quest at a time, Superhuman-style inbox zero
// ===========================================================================
var Spotlight = () => {
  const q = INBOX[1]; // pick a stale Epic for drama
  return (
    <Page>
      <Hero
        title="Inbox · Triage mode"
        sub="One quest at a time. Press a key to act and move on."
        right={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontFamily: 'Geist Mono', fontSize: 11, color: T.textFaint }}>2 of 12</span>
            <NewQuestBtn />
          </div>
        }
      />
      <div style={{ height: '100%', padding: '0 28px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        {/* Progress dots */}
        <div style={{ display: 'flex', gap: 4 }}>
          {INBOX.map((_, i) => (
            <span key={i} style={{
              width: i === 1 ? 18 : 6, height: 6, borderRadius: 999,
              background: i < 1 ? T.accent : (i === 1 ? T.accent : T.bgSubtle),
              transition: 'all 200ms ease',
            }} />
          ))}
        </div>

        {/* The card */}
        <div style={{
          width: 560,
          padding: '28px 32px',
          background: T.bgElev,
          border: `1px solid ${T.border}`,
          borderRadius: 14,
          boxShadow: `0 12px 40px rgba(0,0,0,0.4), 0 0 0 1px ${T.border}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <DiffPill diff={q.diff} />
            <ProjectTag name={q.project} />
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: 11, color: T.warn, fontFamily: 'Geist Mono' }}>
              · sitting here {q.age} days
            </span>
          </div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600, lineHeight: 1.2, letterSpacing: '-0.01em' }}>
            {q.title}
          </h2>
          <div style={{ marginTop: 10, fontSize: 13, color: T.textDim, lineHeight: 1.5 }}>
            No due date, no scheduled time. This Epic has been waiting in your inbox for {q.age} days —
            it probably needs to be broken down or scheduled into a real slot.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 18 }}>
            <XPBadge xp={q.xp} />
            <span style={{ fontSize: 11, color: T.textFaint }}>· estimated ~ 3 h</span>
          </div>
        </div>

        {/* Key actions */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 560 }}>
          <KeyBtn k="T" label="Today" />
          <KeyBtn k="M" label="Tomorrow" />
          <KeyBtn k="W" label="Next week" />
          <KeyBtn k="S" label="Schedule…" />
          <KeyBtn k="P" label="Add to project" />
          <KeyBtn k="B" label="Break down" primary />
          <KeyBtn k="Z" label="Snooze" />
          <KeyBtn k="E" label="Archive" tone="danger" />
        </div>
        <div style={{ fontSize: 11, color: T.textFaint, fontFamily: 'Geist Mono' }}>
          ← previous · → skip · esc to exit
        </div>
      </div>
    </Page>
  );
};

var KeyBtn = ({ k, label, primary, tone }) => (
  <button style={{
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '8px 12px 8px 8px', fontSize: 13, fontWeight: 500,
    background: primary ? T.accent : T.bgElev,
    color: primary ? T.accentFg : (tone === 'danger' ? T.danger : T.text),
    border: `1px solid ${primary ? T.accent : T.border}`,
    borderRadius: 8, cursor: 'pointer',
  }}>
    <kbd style={{
      fontFamily: 'Geist Mono', fontSize: 11, fontWeight: 500,
      padding: '2px 7px', borderRadius: 4,
      background: primary ? 'rgba(0,0,0,0.15)' : T.bgSubtle,
      color: primary ? T.accentFg : T.textFaint,
      border: `1px solid ${primary ? 'rgba(0,0,0,0.1)' : T.border}`,
    }}>{k}</kbd>
    {label}
  </button>
);

// ===========================================================================
// ⑤ SORT LANES — kanban by triage intent
// ===========================================================================
var SortLanes = () => {
  const lanes = [
    { id: 'unsorted', title: 'Unsorted', sub: 'Just landed.',
      items: INBOX.filter(q => q.age < 3 && !q.overdue) },
    { id: 'schedule', title: 'Needs scheduling', sub: 'No due date.',
      items: INBOX.filter(q => !q.due && q.age >= 3 && q.diff !== 'Easy' && q.diff !== 'Trivial' && !q.overdue) },
    { id: 'quick', title: 'Quick wins', sub: '< 15 min.',
      items: INBOX.filter(q => (q.diff === 'Easy' || q.diff === 'Trivial') && q.age >= 3) },
    { id: 'flag', title: 'Needs attention', sub: 'Overdue or stuck.',
      items: INBOX.filter(q => q.overdue || q.age > 14) },
  ];
  return (
    <Page>
      <Hero
        title="Inbox · Sort lanes"
        sub="Drag quests between lanes to triage them. Each lane has its own batch action."
        right={<NewQuestBtn />}
      />
      <div style={{ height: '100%', padding: '0 28px 28px', display: 'flex', gap: 12, overflow: 'hidden' }}>
        {lanes.map(l => <Lane key={l.id} lane={l} />)}
      </div>
    </Page>
  );
};

var Lane = ({ lane }) => (
  <div style={{
    flex: 1, minWidth: 240,
    background: T.bgElev, border: `1px solid ${T.border}`, borderRadius: 10,
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
  }}>
    <div style={{ padding: '12px 14px 10px', borderBottom: `1px solid ${T.border}` }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>{lane.title}</span>
        <span style={{ fontSize: 10.5, color: T.textFaint, fontFamily: 'Geist Mono' }}>{lane.items.length}</span>
      </div>
      <div style={{ fontSize: 11, color: T.textFaint, marginTop: 2 }}>{lane.sub}</div>
    </div>
    <div style={{ flex: 1, overflowY: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
      {lane.items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 28, fontSize: 11, color: T.textFaint,
          border: `1px dashed ${T.border}`, borderRadius: 6, fontFamily: 'Geist Mono' }}>
          empty · drop here
        </div>
      ) : lane.items.map(q => <LaneCard key={q.id} q={q} />)}
    </div>
    {lane.items.length > 0 && lane.id !== 'unsorted' && (
      <div style={{ padding: 8, borderTop: `1px solid ${T.border}` }}>
        <button style={{
          width: '100%', padding: '6px 8px', fontSize: 11, fontWeight: 500,
          background: 'transparent', color: T.textDim,
          border: `1px dashed ${T.border}`, borderRadius: 6, cursor: 'pointer',
        }}>
          {lane.id === 'schedule' ? 'Schedule all →' : lane.id === 'quick' ? 'Do all today →' : 'Address all →'}
        </button>
      </div>
    )}
  </div>
);

var LaneCard = ({ q }) => (
  <div style={{
    padding: '8px 10px',
    background: T.bgSubtle,
    border: `1px solid ${T.border}`,
    borderLeft: `2px solid ${DIFF_TINT[q.diff]}`,
    borderRadius: 6,
    cursor: 'grab',
  }}>
    <div style={{ fontSize: 12, fontWeight: 500, color: T.text, lineHeight: 1.35,
      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{q.title}</div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
      {q.project ? <ProjectTag name={q.project} mini /> : <span style={{ fontSize: 10, color: T.textFaint }}>no project</span>}
      <div style={{ flex: 1 }} />
      <span style={{ fontFamily: 'Geist Mono', fontSize: 9.5, color: T.accent }}>+{q.xp}</span>
    </div>
    {(q.overdue || q.age > 14) && (
      <div style={{ marginTop: 6, fontSize: 10, color: q.overdue ? T.danger : T.warn, fontFamily: 'Geist Mono' }}>
        {q.overdue ? '· overdue' : `· ${q.age} days old`}
      </div>
    )}
  </div>
);

window.InboxVariants = { Current, Compact, SmartSections, TriageColumn, Spotlight, SortLanes };
