// Upcoming view variants — Questify, dark linear theme.
// All variants share the same data and a slim topbar, just the body differs.

var useState = React.useState;
var useEffect = React.useEffect;
var useMemo = React.useMemo;

// ============ THEME ========================================================
var T = {
  bg: '#0a0a0a',
  bgElev: '#141414',
  bgSubtle: '#1c1c1c',
  border: '#262626',
  borderStrong: '#353535',
  text: '#fafafa',
  textDim: '#a1a1aa',
  textFaint: '#71717a',
  accent: 'oklch(0.70 0.16 275)',
  accentFg: '#0a0a0a',
  accentSubtle: 'oklch(0.22 0.05 275)',
  accentBorder: 'oklch(0.35 0.10 275)',
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

// ============ DATA — next 14 days =========================================
// Today = Tue May 19 2026 (matches screenshot). Generated to show realistic
// load — busy clusters, empty days, repeats from "Daily" habits.
var DATA = [
  { day: 'Wed', date: 20, mon: 'May', dow: 3, label: 'Tomorrow', quests: [
    { title: 'Refactor auth microservice', diff: 'Epic', xp: 150, project: 'Polytech', rec: null },
    { title: 'Morning run — 5k', diff: 'Medium', xp: 80, project: null, rec: 'Daily' },
    { title: 'Review PR #482', diff: 'Easy', xp: 40, project: 'Questify', rec: null },
  ]},
  { day: 'Thu', date: 21, mon: 'May', dow: 4, quests: [
    { title: 'Morning run — 5k', diff: 'Medium', xp: 80, project: null, rec: 'Daily' },
    { title: 'Plan Q2 OKRs with team', diff: 'Hard', xp: 120, project: 'Polytech', rec: null },
  ]},
  { day: 'Fri', date: 22, mon: 'May', dow: 5, quests: [
    { title: 'Morning run — 5k', diff: 'Medium', xp: 80, project: null, rec: 'Daily' },
  ]},
  { day: 'Sat', date: 23, mon: 'May', dow: 6, quests: [
    { title: 'Gym — upper body', diff: 'Hard', xp: 100, project: null, rec: 'Weekly' },
    { title: 'Meal prep', diff: 'Medium', xp: 60, project: null, rec: 'Weekly' },
  ]},
  { day: 'Sun', date: 24, mon: 'May', dow: 0, quests: [
    { title: 'Préparer talk OTel', diff: 'Epic', xp: 150, project: 'Polytech', rec: null },
    { title: 'Call mom', diff: 'Easy', xp: 20, project: null, rec: 'Weekly' },
  ]},
  { day: 'Mon', date: 25, mon: 'May', dow: 1, quests: [
    { title: 'Morning run — 5k', diff: 'Medium', xp: 80, project: null, rec: 'Daily' },
    { title: 'Write blog post about microservices', diff: 'Hard', xp: 120, project: 'Questify', rec: null },
  ]},
  { day: 'Tue', date: 26, mon: 'May', dow: 2, quests: [
    { title: 'Morning run — 5k', diff: 'Medium', xp: 80, project: null, rec: 'Daily' },
  ]},
  { day: 'Wed', date: 27, mon: 'May', dow: 3, quests: [
    { title: 'Ship redesign proposal', diff: 'Epic', xp: 200, project: 'Questify', rec: null },
    { title: 'Morning run — 5k', diff: 'Medium', xp: 80, project: null, rec: 'Daily' },
    { title: 'Rénover salle de bain — devis', diff: 'Medium', xp: 50, project: 'Appartement', rec: null },
  ]},
  { day: 'Thu', date: 28, mon: 'May', dow: 4, quests: [] },
  { day: 'Fri', date: 29, mon: 'May', dow: 5, quests: [
    { title: 'Morning run — 5k', diff: 'Medium', xp: 80, project: null, rec: 'Daily' },
    { title: 'Read DDIA chapter 3', diff: 'Easy', xp: 40, project: null, rec: null },
  ]},
  { day: 'Sat', date: 30, mon: 'May', dow: 6, quests: [
    { title: 'Gym — lower body', diff: 'Hard', xp: 100, project: null, rec: 'Weekly' },
  ]},
  { day: 'Sun', date: 31, mon: 'May', dow: 0, quests: [] },
  { day: 'Mon', date: 1, mon: 'Jun', dow: 1, quests: [
    { title: 'Morning run — 5k', diff: 'Medium', xp: 80, project: null, rec: 'Daily' },
    { title: 'Monthly review', diff: 'Medium', xp: 60, project: null, rec: 'Monthly' },
  ]},
  { day: 'Tue', date: 2, mon: 'Jun', dow: 2, quests: [
    { title: 'Morning run — 5k', diff: 'Medium', xp: 80, project: null, rec: 'Daily' },
    { title: 'Q3 planning kickoff', diff: 'Hard', xp: 120, project: 'Polytech', rec: null },
  ]},
];

var totalXP = (d) => d.quests.reduce((a, q) => a + q.xp, 0);
var allQuests = () => DATA.flatMap(d => d.quests.map(q => ({ ...q, day: d })));

// ============ SHARED CHROME ===============================================
var Page = ({ children, title = 'Upcoming', tagline }) => (
  <div style={{
    width: '100%', height: '100%',
    background: T.bg, color: T.text,
    fontFamily: 'Geist, sans-serif',
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
  }}>
    <Topbar title={title} />
    {tagline}
    <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
      {children}
    </div>
  </div>
);

var Topbar = ({ title }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 14,
    padding: '10px 20px', height: 46,
    borderBottom: `1px solid ${T.border}`, background: T.bgElev,
  }}>
    <span style={{ color: T.textDim, display: 'flex' }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/>
      </svg>
    </span>
    <span style={{ fontSize: 13, color: T.text, fontWeight: 500 }}>{title}</span>
    <div style={{ flex: 1 }} />
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: '4px 10px', background: T.bgSubtle, borderRadius: 999,
      border: `1px solid ${T.border}`,
    }}>
      <span style={{ color: T.accent, fontSize: 11 }}>⚡</span>
      <span style={{ fontFamily: 'Geist Mono', fontSize: 12, fontWeight: 500 }}>1 775 XP</span>
      <span style={{ width: 1, height: 10, background: T.border }} />
      <span style={{ fontSize: 11, color: T.textDim }}>Lvl 6</span>
    </div>
  </div>
);

var Hero = ({ title, sub }) => (
  <div style={{ padding: '20px 28px 16px' }}>
    <h1 style={{ margin: 0, fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em' }}>{title}</h1>
    <div style={{ fontSize: 13.5, color: T.textDim, marginTop: 4 }}>{sub}</div>
  </div>
);

// ============ MINI BITS ===================================================
var DiffDot = ({ diff, size = 6 }) => (
  <span style={{
    display: 'inline-block', width: size, height: size, borderRadius: 1,
    background: DIFF_TINT[diff] || T.textFaint,
    flexShrink: 0,
  }} />
);

var DiffPill = ({ diff }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 4,
    fontSize: 10.5, fontWeight: 500, padding: '2px 6px', borderRadius: 4,
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
    fontFamily: 'Geist Mono',
    fontSize: mini ? 10 : 11, fontWeight: 500,
    padding: mini ? '1px 5px' : '2px 7px',
    borderRadius: 999,
    background: T.accentSubtle, color: T.accent,
    border: `1px solid ${T.accentBorder}`,
  }}>
    +{xp}<span style={{ fontSize: mini ? 8 : 9, opacity: 0.7 }}>XP</span>
  </span>
);

var Checkbox = ({ size = 16 }) => (
  <span style={{
    width: size, height: size, flexShrink: 0,
    borderRadius: 4, border: `1.5px solid ${T.borderStrong}`,
    display: 'inline-block',
  }} />
);

var ProjectTag = ({ name }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 4,
    fontSize: 10.5, color: T.textFaint,
  }}>
    <span style={{
      width: 6, height: 6, borderRadius: 1.5,
      background: PROJECT_TINT[name] || T.textFaint,
    }} />
    {name}
  </span>
);

// ===========================================================================
// CURRENT — list (the screenshot, cleaned up)
// ===========================================================================
var Current = () => (
  <Page>
    <Hero title="The Road Ahead" sub="Your upcoming quests." />
    <div style={{ overflowY: 'auto', height: '100%', padding: '0 28px 28px' }}>
      {DATA.slice(0, 8).map(d => (
        <div key={d.date + d.mon} style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
              {d.label || `${d.day === 'Sat' || d.day === 'Sun' ? '' : ''}${dayName(d.day)}, ${d.mon} ${d.date}`}
            </h2>
            <span style={{
              fontSize: 11, color: T.textDim, fontFamily: 'Geist Mono',
              padding: '2px 8px', background: T.bgSubtle, borderRadius: 999,
              border: `1px solid ${T.border}`,
            }}>
              {d.quests.length} {d.quests.length === 1 ? 'Quest' : 'Quests'}
            </span>
          </div>
          {d.quests.length === 0 ? (
            <div style={{ fontSize: 13, color: T.textFaint, padding: '12px 0' }}>—</div>
          ) : d.quests.map((q, i) => <QuestRow key={i} q={q} />)}
        </div>
      ))}
    </div>
  </Page>
);

var dayName = (d) => ({
  Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday',
  Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday',
}[d] || d);

var QuestRow = ({ q }) => (
  <div style={{
    display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center',
    gap: 12, padding: '11px 14px', marginBottom: 6,
    background: T.bgElev, border: `1px solid ${T.border}`, borderRadius: 8,
  }}>
    <Checkbox />
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 13.5, fontWeight: 500,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {q.title}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
        <DiffPill diff={q.diff} />
        {q.rec && <span style={{ fontSize: 11, color: T.textFaint }}>↻ {q.rec}</span>}
        {q.project && <ProjectTag name={q.project} />}
      </div>
    </div>
    <XPBadge xp={q.xp} />
  </div>
);

// ===========================================================================
// ① WEEK GRID — 7-column calendar
// ===========================================================================
var WeekGrid = () => {
  const week1 = DATA.slice(0, 5);     // Wed-Sun (this week tail)
  // pad start with empty Mon-Tue (already passed)
  const today = { day: 'Tue', date: 19, mon: 'May', dow: 2, today: true, quests: [] };
  const monday = { day: 'Mon', date: 18, mon: 'May', dow: 1, past: true, quests: [] };
  const w1 = [monday, today, ...week1];
  const w2 = DATA.slice(5, 12);

  return (
    <Page>
      <div style={{ padding: '16px 24px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>The Road Ahead</h1>
        <div style={{ display: 'flex', gap: 4, background: T.bgElev, padding: 3, border: `1px solid ${T.border}`, borderRadius: 8 }}>
          {['Week', 'Month', 'List'].map(v => (
            <span key={v} style={{
              padding: '4px 10px', fontSize: 12, borderRadius: 5,
              background: v === 'Week' ? T.bgSubtle : 'transparent',
              color: v === 'Week' ? T.text : T.textDim,
              border: `1px solid ${v === 'Week' ? T.borderStrong : 'transparent'}`,
              fontWeight: 500,
            }}>{v}</span>
          ))}
        </div>
      </div>
      <div style={{ overflowY: 'auto', height: '100%', padding: '4px 24px 24px' }}>
        <WeekRow days={w1} label="This week" />
        <WeekRow days={w2} label="Next week" />
      </div>
    </Page>
  );
};

var WeekRow = ({ days, label }) => {
  const totalWeekXP = days.reduce((a, d) => a + totalXP(d), 0);
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '8px 2px 8px' }}>
        <h3 style={{ margin: 0, fontSize: 12, fontWeight: 500, color: T.textDim,
          textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</h3>
        <div style={{ flex: 1, height: 1, background: T.border }} />
        <span style={{ fontFamily: 'Geist Mono', fontSize: 11, color: T.textFaint }}>
          {totalWeekXP} XP planned
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, minHeight: 280 }}>
        {days.map(d => <DayCell key={d.day + d.date} d={d} />)}
      </div>
    </div>
  );
};

var DayCell = ({ d }) => {
  const xp = totalXP(d);
  const load = Math.min(1, xp / 250);
  return (
    <div style={{
      background: d.today ? T.accentSubtle : T.bgElev,
      border: `1px solid ${d.today ? T.accentBorder : T.border}`,
      borderRadius: 8, padding: 8,
      display: 'flex', flexDirection: 'column',
      opacity: d.past ? 0.4 : 1,
      minHeight: 240,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 10, color: d.today ? T.accent : T.textFaint,
            textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>{d.day}</div>
          <div style={{ fontSize: 18, fontWeight: 600, fontFamily: 'Geist Mono',
            color: d.today ? T.accent : T.text, lineHeight: 1 }}>{d.date}</div>
        </div>
        {d.quests.length > 0 && (
          <span style={{ fontSize: 10, fontFamily: 'Geist Mono', color: T.textFaint }}>{xp}xp</span>
        )}
      </div>
      <div style={{
        height: 2, marginBottom: 8, borderRadius: 999,
        background: `linear-gradient(to right, ${T.accent} ${load * 100}%, ${T.bgSubtle} ${load * 100}%)`,
        opacity: d.quests.length > 0 ? 1 : 0.3,
      }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minHeight: 0 }}>
        {d.quests.length === 0 ? (
          <div style={{ fontSize: 11, color: T.textFaint, textAlign: 'center', paddingTop: 30 }}>
            {d.past ? '—' : 'Free'}
          </div>
        ) : d.quests.map((q, i) => <DayQuestCard key={i} q={q} />)}
      </div>
    </div>
  );
};

var DayQuestCard = ({ q }) => (
  <div style={{
    padding: '6px 8px', background: T.bgSubtle,
    border: `1px solid ${T.border}`, borderRadius: 5,
    borderLeft: `2px solid ${DIFF_TINT[q.diff]}`,
  }}>
    <div style={{ fontSize: 11.5, fontWeight: 500, color: T.text, lineHeight: 1.35,
      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
      {q.title}
    </div>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, gap: 4 }}>
      {q.project ? <ProjectTag name={q.project} /> : <span style={{ fontSize: 10, color: T.textFaint }}>{q.rec ? `↻ ${q.rec}` : '—'}</span>}
      <span style={{ fontFamily: 'Geist Mono', fontSize: 9.5, color: T.accent }}>+{q.xp}</span>
    </div>
  </div>
);

// ===========================================================================
// ② MONTH HEATMAP — full month grid with load density
// ===========================================================================
var MonthHeatmap = () => {
  const [selected, setSelected] = useState(20); // tomorrow
  // build a May 2026 month grid (May 1 was a Friday)
  const monthDays = [];
  // pad with previous month
  for (let i = 27; i <= 30; i++) monthDays.push({ date: i, mon: 'Apr', other: true, quests: [] });
  for (let i = 1; i <= 31; i++) {
    const d = DATA.find(x => x.date === i && x.mon === 'May');
    monthDays.push({ date: i, mon: 'May', past: i < 19, today: i === 19, quests: d ? d.quests : [] });
  }
  // pad next
  for (let i = 1; i <= 5; i++) monthDays.push({ date: i, mon: 'Jun', other: true, quests: DATA.find(x=>x.date===i&&x.mon==='Jun')?.quests || [] });

  const selectedDay = monthDays.find(d => d.date === selected && d.mon === 'May');

  return (
    <Page>
      <div style={{ padding: '16px 24px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>May 2026</h1>
          <div style={{ fontSize: 12, color: T.textDim, marginTop: 2 }}>
            <span style={{ fontFamily: 'Geist Mono', color: T.accent }}>14 quests</span> planned · 1 250 XP
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Arrow dir="left" />
          <span style={{ fontSize: 12, color: T.textDim, padding: '0 6px' }}>May 2026</span>
          <Arrow dir="right" />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, padding: '0 24px 24px', height: '100%', overflow: 'hidden' }}>
        {/* Calendar */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 4 }}>
            {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d =>
              <div key={d} style={{ fontSize: 10, color: T.textFaint, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center', padding: 6 }}>{d}</div>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, flex: 1 }}>
            {monthDays.map((d, i) => <MonthCell key={i} d={d} selected={d.date === selected && d.mon === 'May'} onClick={() => setSelected(d.date)} />)}
          </div>
        </div>

        {/* Drawer */}
        <div style={{
          width: 280, flexShrink: 0,
          background: T.bgElev, border: `1px solid ${T.border}`,
          borderRadius: 10, padding: 14, overflowY: 'auto',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: T.textFaint, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {selectedDay && (selectedDay.today ? 'Today' : selectedDay.date === 20 ? 'Tomorrow' : '')}
              </div>
              <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em', marginTop: 2 }}>
                May {selected}
              </div>
            </div>
            <span style={{ fontFamily: 'Geist Mono', fontSize: 11, color: T.accent }}>
              {selectedDay ? `${totalXP(selectedDay)} XP` : '0'}
            </span>
          </div>
          {selectedDay && selectedDay.quests.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {selectedDay.quests.map((q, i) => <SlimQuestRow key={i} q={q} />)}
            </div>
          ) : (
            <div style={{ padding: 28, textAlign: 'center', border: `1px dashed ${T.border}`, borderRadius: 6 }}>
              <div style={{ fontSize: 13, color: T.text }}>No quests</div>
              <div style={{ fontSize: 11, color: T.textFaint, marginTop: 4 }}>Click + to add one</div>
            </div>
          )}
        </div>
      </div>
    </Page>
  );
};

var Arrow = ({ dir }) => (
  <button style={{
    width: 24, height: 24, borderRadius: 6,
    background: T.bgElev, border: `1px solid ${T.border}`,
    color: T.textDim, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  }}>
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {dir === 'left' ? <polyline points="15 18 9 12 15 6"/> : <polyline points="9 18 15 12 9 6"/>}
    </svg>
  </button>
);

var MonthCell = ({ d, selected, onClick }) => {
  const xp = totalXP(d);
  const load = xp === 0 ? 0 : xp < 100 ? 0.2 : xp < 200 ? 0.5 : xp < 300 ? 0.75 : 1;
  return (
    <button onClick={onClick} style={{
      position: 'relative',
      background: load > 0
        ? `color-mix(in oklch, ${T.accent} ${load * 28}%, ${T.bgElev})`
        : T.bgElev,
      border: `1px solid ${selected ? T.accent : (d.today ? T.accentBorder : T.border)}`,
      borderRadius: 6, padding: 6,
      cursor: 'pointer',
      color: T.text, textAlign: 'left',
      display: 'flex', flexDirection: 'column',
      minHeight: 64,
      opacity: d.other ? 0.4 : (d.past ? 0.55 : 1),
      outline: selected ? `2px solid ${T.accent}` : 'none',
      outlineOffset: -2,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontFamily: 'Geist Mono', fontSize: 12,
          color: d.today ? T.accent : T.text, fontWeight: d.today ? 600 : 400 }}>
          {d.date}
        </span>
        {xp > 0 && <span style={{ fontFamily: 'Geist Mono', fontSize: 9, color: T.textFaint }}>{xp}</span>}
      </div>
      <div style={{ display: 'flex', gap: 2, marginTop: 'auto', flexWrap: 'wrap' }}>
        {d.quests.slice(0, 4).map((q, i) =>
          <DiffDot key={i} diff={q.diff} size={5} />
        )}
        {d.quests.length > 4 && (
          <span style={{ fontSize: 8, color: T.textFaint, fontFamily: 'Geist Mono' }}>+{d.quests.length - 4}</span>
        )}
      </div>
    </button>
  );
};

var SlimQuestRow = ({ q }) => (
  <div style={{
    padding: '8px 10px', background: T.bgSubtle,
    border: `1px solid ${T.border}`, borderRadius: 6,
    borderLeft: `2px solid ${DIFF_TINT[q.diff]}`,
    display: 'flex', alignItems: 'center', gap: 8,
  }}>
    <Checkbox size={14} />
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 12, fontWeight: 500, color: T.text,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{q.title}</div>
      <div style={{ display: 'flex', gap: 6, marginTop: 2, alignItems: 'center' }}>
        {q.project ? <ProjectTag name={q.project} /> : null}
        {q.rec && <span style={{ fontSize: 10, color: T.textFaint }}>↻ {q.rec}</span>}
      </div>
    </div>
    <span style={{ fontFamily: 'Geist Mono', fontSize: 10, color: T.accent, flexShrink: 0 }}>+{q.xp}</span>
  </div>
);

// ===========================================================================
// ③ AGENDA + MINI-CAL split (Fantastical / Sunsama)
// ===========================================================================
var AgendaSplit = () => {
  const buckets = useMemo(() => {
    const groups = [
      { id: 'tomorrow', label: 'Tomorrow', days: DATA.slice(0, 1) },
      { id: 'rest', label: 'Rest of this week', days: DATA.slice(1, 5) },
      { id: 'next', label: 'Next week', days: DATA.slice(5, 12) },
      { id: 'later', label: 'Later', days: DATA.slice(12) },
    ];
    return groups.filter(g => g.days.some(d => d.quests.length > 0));
  }, []);

  // mini cal: May 2026 days only
  const mini = [];
  for (let i = 27; i <= 30; i++) mini.push({ date: i, mon: 'Apr', other: true, quests: [] });
  for (let i = 1; i <= 31; i++) {
    const d = DATA.find(x => x.date === i && x.mon === 'May');
    mini.push({ date: i, mon: 'May', past: i < 19, today: i === 19, quests: d ? d.quests : [] });
  }

  return (
    <Page>
      <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
        {/* Left rail: mini cal + summary */}
        <div style={{ width: 280, flexShrink: 0, padding: '20px 18px',
          borderRight: `1px solid ${T.border}`, background: T.bgElev,
          display: 'flex', flexDirection: 'column', gap: 18, overflowY: 'auto' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>May 2026</span>
              <div style={{ display: 'flex', gap: 4 }}><Arrow dir="left" /><Arrow dir="right" /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
              {['M','T','W','T','F','S','S'].map((d, i) => (
                <div key={i} style={{ fontSize: 9, color: T.textFaint, textAlign: 'center', padding: 2 }}>{d}</div>
              ))}
              {mini.map((d, i) => <MiniCalCell key={i} d={d} />)}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, color: T.textFaint, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
              Next 7 days
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <SummaryRow label="Quests" value="14" />
              <SummaryRow label="XP planned" value="1 250" accent />
              <SummaryRow label="Busiest day" value="Wed May 27" />
              <SummaryRow label="Free days" value="2" />
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, color: T.textFaint, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
              By project
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <ProjectBar name="Polytech" count={4} pct={0.55} />
              <ProjectBar name="Questify" count={3} pct={0.30} />
              <ProjectBar name="Appartement" count={1} pct={0.10} />
            </div>
          </div>
        </div>

        {/* Right: smart agenda */}
        <div style={{ flex: 1, padding: '20px 28px', overflowY: 'auto' }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>Upcoming</h1>
          <div style={{ fontSize: 13, color: T.textDim, marginTop: 2, marginBottom: 18 }}>
            14 quests across the next 2 weeks
          </div>
          {buckets.map(b => (
            <div key={b.id} style={{ marginBottom: 22 }}>
              <h3 style={{ margin: '0 0 8px',
                fontSize: 11, fontWeight: 500, color: T.textDim,
                textTransform: 'uppercase', letterSpacing: '0.06em' }}>{b.label}</h3>
              {b.days.map(d => (
                d.quests.length > 0 && (
                  <div key={d.date + d.mon} style={{ display: 'flex', gap: 14, marginBottom: 8 }}>
                    <div style={{ width: 64, flexShrink: 0, paddingTop: 8 }}>
                      <div style={{ fontSize: 10, color: T.textFaint, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{d.day}</div>
                      <div style={{ fontFamily: 'Geist Mono', fontSize: 16, fontWeight: 500 }}>{d.date}</div>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {d.quests.map((q, i) => <SlimQuestRow key={i} q={q} />)}
                    </div>
                  </div>
                )
              ))}
            </div>
          ))}
        </div>
      </div>
    </Page>
  );
};

var MiniCalCell = ({ d }) => {
  const has = d.quests.length > 0;
  return (
    <div style={{
      aspectRatio: '1', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Geist Mono', fontSize: 11,
      color: d.today ? T.accentFg : (d.other ? T.textFaint : T.text),
      background: d.today ? T.accent : 'transparent',
      borderRadius: 5,
      opacity: d.other ? 0.4 : (d.past ? 0.55 : 1),
      position: 'relative',
    }}>
      {d.date}
      {has && !d.today && (
        <span style={{
          position: 'absolute', bottom: 2, width: 3, height: 3,
          borderRadius: '50%', background: T.accent,
        }} />
      )}
    </div>
  );
};

var SummaryRow = ({ label, value, accent }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
    <span style={{ fontSize: 12, color: T.textDim }}>{label}</span>
    <span style={{ fontFamily: 'Geist Mono', fontSize: 13, fontWeight: 500,
      color: accent ? T.accent : T.text }}>{value}</span>
  </div>
);

var ProjectBar = ({ name, count, pct }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <span style={{ width: 6, height: 6, borderRadius: 1, background: PROJECT_TINT[name] }} />
    <span style={{ fontSize: 12, color: T.text, flex: 1 }}>{name}</span>
    <span style={{ fontFamily: 'Geist Mono', fontSize: 10, color: T.textFaint }}>{count}</span>
    <div style={{ width: 40, height: 4, background: T.bgSubtle, borderRadius: 999, overflow: 'hidden' }}>
      <div style={{ width: `${pct * 100}%`, height: '100%', background: PROJECT_TINT[name] }} />
    </div>
  </div>
);

// ===========================================================================
// ④ PROJECT SWIMLANES — projects as rows, days as columns
// ===========================================================================
var Swimlanes = () => {
  const projects = ['Polytech', 'Questify', 'Appartement', 'Personal'];
  const days = DATA.slice(0, 10);

  return (
    <Page>
      <Hero title="The Road Ahead" sub="Quests by project across the next 10 days." />
      <div style={{ padding: '0 24px 24px', overflowY: 'auto', overflowX: 'auto', height: '100%' }}>
        <div style={{ minWidth: 1080 }}>
          {/* Header row */}
          <div style={{ display: 'grid', gridTemplateColumns: `140px repeat(${days.length}, 1fr)`, gap: 4, marginBottom: 8 }}>
            <div />
            {days.map(d => (
              <div key={d.date + d.mon} style={{ padding: '6px 4px', textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: d.label ? T.accent : T.textFaint,
                  textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>
                  {d.label || d.day}
                </div>
                <div style={{ fontFamily: 'Geist Mono', fontSize: 13, fontWeight: 500,
                  color: d.label ? T.accent : T.text, marginTop: 2 }}>{d.date}</div>
              </div>
            ))}
          </div>
          {/* Rows */}
          {projects.map(p => {
            const projQuests = (d) => d.quests.filter(q => p === 'Personal' ? !q.project : q.project === p);
            const total = days.reduce((a, d) => a + projQuests(d).reduce((a2, q) => a2 + q.xp, 0), 0);
            return (
              <div key={p} style={{
                display: 'grid', gridTemplateColumns: `140px repeat(${days.length}, 1fr)`, gap: 4,
                padding: '6px 0', borderTop: `1px solid ${T.border}`, alignItems: 'stretch',
              }}>
                <div style={{ padding: '8px 8px 8px 4px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: PROJECT_TINT[p] || T.textFaint }} />
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{p}</span>
                  </div>
                  <div style={{ fontFamily: 'Geist Mono', fontSize: 10, color: T.textFaint, marginLeft: 14, marginTop: 2 }}>
                    {total} XP planned
                  </div>
                </div>
                {days.map(d => {
                  const qs = projQuests(d);
                  return (
                    <div key={d.date + d.mon} style={{
                      background: qs.length > 0 ? T.bgElev : 'transparent',
                      border: `1px ${qs.length > 0 ? 'solid' : 'dashed'} ${qs.length > 0 ? T.border : T.bgSubtle}`,
                      borderRadius: 6, padding: 4, minHeight: 56,
                      display: 'flex', flexDirection: 'column', gap: 3,
                    }}>
                      {qs.map((q, i) => (
                        <div key={i} style={{
                          background: T.bgSubtle,
                          borderLeft: `2px solid ${DIFF_TINT[q.diff]}`,
                          padding: '3px 5px', borderRadius: 3,
                          fontSize: 10, lineHeight: 1.25,
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        }}>{q.title}</div>
                      ))}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </Page>
  );
};

// ===========================================================================
// ⑤ QUEST ROAD — game-flavored trail metaphor
// ===========================================================================
var QuestRoad = () => {
  // Compose a vertical winding path with day checkpoints + quest stones
  const days = DATA.slice(0, 7);
  return (
    <Page>
      <div style={{ padding: '20px 28px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em',
            fontFamily: 'Instrument Serif, Geist, serif' }}>The Road Ahead</h1>
          <div style={{ fontSize: 13, color: T.textDim, marginTop: 2 }}>14 quests on your path · 1 250 XP to earn</div>
        </div>
        <div style={{ display: 'flex', gap: 12, fontSize: 11, color: T.textFaint, fontFamily: 'Geist Mono' }}>
          <Legend tint={DIFF_TINT.Easy} label="Easy" />
          <Legend tint={DIFF_TINT.Medium} label="Medium" />
          <Legend tint={DIFF_TINT.Hard} label="Hard" />
          <Legend tint={DIFF_TINT.Epic} label="Epic" />
        </div>
      </div>
      <div style={{
        flex: 1, overflowY: 'auto', overflowX: 'hidden',
        background: `radial-gradient(ellipse at top, ${T.accentSubtle} 0%, transparent 50%), ${T.bg}`,
        padding: '8px 0 60px',
      }}>
        <div style={{ position: 'relative', width: '100%', minHeight: 1200 }}>
          {/* The winding road, drawn in SVG */}
          <svg width="100%" height="1200" viewBox="0 0 800 1200" preserveAspectRatio="none"
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <defs>
              <linearGradient id="road" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={T.accent} stopOpacity="0.6" />
                <stop offset="1" stopColor={T.accent} stopOpacity="0.05" />
              </linearGradient>
            </defs>
            <path d="M 400 30 Q 600 180 400 330 T 400 630 T 400 930 T 400 1180"
                  fill="none" stroke="url(#road)" strokeWidth="3" strokeDasharray="6 6" />
          </svg>

          {/* Origin marker — TODAY */}
          <Checkpoint x={400} y={20} label="You are here · Tue May 19" current />

          {days.map((d, i) => {
            const y = 110 + i * 165;
            const side = i % 2 === 0 ? 'right' : 'left';
            return (
              <React.Fragment key={d.date}>
                <Checkpoint
                  x={400 + (i % 2 === 0 ? 60 : -60) * Math.sin(i)}
                  y={y}
                  label={d.label || `${d.day} · ${d.mon} ${d.date}`}
                />
                {d.quests.map((q, j) => (
                  <QuestStone
                    key={j}
                    x={side === 'right' ? 540 - j * 8 : 260 + j * 8}
                    y={y + 30 + j * 52}
                    q={q}
                  />
                ))}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </Page>
  );
};

var Checkpoint = ({ x, y, label, current }) => (
  <div style={{
    position: 'absolute', left: `${(x / 800) * 100}%`, top: y,
    transform: 'translate(-50%, -50%)',
    display: 'flex', alignItems: 'center', gap: 8,
  }}>
    <div style={{
      width: current ? 16 : 12, height: current ? 16 : 12, borderRadius: '50%',
      background: current ? T.accent : T.bgElev,
      border: `2px solid ${current ? T.accent : T.borderStrong}`,
      boxShadow: current ? `0 0 0 6px ${T.accentSubtle}` : 'none',
    }} />
    <div style={{
      fontSize: current ? 12 : 11,
      fontWeight: 500,
      color: current ? T.accent : T.textDim,
      fontFamily: 'Geist Mono',
      letterSpacing: current ? '0.02em' : '0.04em',
      textTransform: current ? 'none' : 'uppercase',
      whiteSpace: 'nowrap',
    }}>{label}</div>
  </div>
);

var QuestStone = ({ x, y, q }) => (
  <div style={{
    position: 'absolute', left: `${(x / 800) * 100}%`, top: y,
    transform: 'translateX(-50%)',
    width: 220,
    padding: '8px 10px',
    background: T.bgElev,
    border: `1px solid ${T.border}`,
    borderLeft: `3px solid ${DIFF_TINT[q.diff]}`,
    borderRadius: 8,
    boxShadow: `0 4px 12px rgba(0,0,0,0.4)`,
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
      <DiffPill diff={q.diff} />
      <XPBadge xp={q.xp} mini />
    </div>
    <div style={{ fontSize: 12, fontWeight: 500, color: T.text, lineHeight: 1.35,
      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
      {q.title}
    </div>
    {q.project && <div style={{ marginTop: 4 }}><ProjectTag name={q.project} /></div>}
  </div>
);

var Legend = ({ tint, label }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
    <span style={{ width: 6, height: 6, borderRadius: 1, background: tint }} />{label}
  </span>
);

window.UpcomingVariants = { Current, WeekGrid, MonthHeatmap, AgendaSplit, Swimlanes, QuestRoad };
