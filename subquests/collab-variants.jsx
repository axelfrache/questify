// Collaboration concepts for Questify — dark linear theme.
// Each variant is a full screen showing one collaboration model in context.

var useState = React.useState;

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
  gold: 'oklch(0.80 0.13 85)',
  green: 'oklch(0.72 0.14 150)',
  danger: 'oklch(0.65 0.18 25)',
};

var DIFF_TINT = {
  Easy: 'oklch(0.78 0.10 150)', Medium: 'oklch(0.75 0.12 230)',
  Hard: 'oklch(0.72 0.14 45)', Epic: 'oklch(0.65 0.18 290)',
};

// ============ PEOPLE =======================================================
var PEOPLE = {
  you:  { name: 'You',    tint: 'oklch(0.70 0.16 275)' },
  alex: { name: 'Alex',   tint: 'oklch(0.70 0.16 30)'  },
  maya: { name: 'Maya',   tint: 'oklch(0.72 0.14 150)' },
  tom:  { name: 'Tom',    tint: 'oklch(0.68 0.14 220)' },
  lea:  { name: 'Léa',    tint: 'oklch(0.74 0.13 340)' },
  sam:  { name: 'Sam',    tint: 'oklch(0.78 0.12 85)'  },
};

var Avatar = ({ who, size = 28, ring }) => {
  const p = PEOPLE[who] || { name: '?', tint: T.textFaint };
  return (
    <span style={{
      width: size, height: size, flexShrink: 0,
      borderRadius: '50%',
      background: `color-mix(in oklch, ${p.tint} 30%, ${T.bgSubtle})`,
      color: p.tint,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.4, fontWeight: 600,
      border: ring ? `2px solid ${p.tint}` : `1px solid color-mix(in oklch, ${p.tint} 40%, transparent)`,
      fontFamily: 'Geist, sans-serif',
    }}>{p.name === 'You' ? '★' : p.name[0]}</span>
  );
};

var AvatarStack = ({ people, size = 24 }) => (
  <span style={{ display: 'inline-flex' }}>
    {people.map((w, i) => (
      <span key={w} style={{ marginLeft: i === 0 ? 0 : -size * 0.32, zIndex: people.length - i,
        borderRadius: '50%', boxShadow: `0 0 0 2px ${T.bgElev}` }}>
        <Avatar who={w} size={size} />
      </span>
    ))}
  </span>
);

// ============ chrome =======================================================
var Page = ({ title, children }) => (
  <div style={{
    width: '100%', height: '100%', background: T.bg, color: T.text,
    fontFamily: 'Geist, sans-serif', display: 'flex', flexDirection: 'column', overflow: 'hidden',
  }}>
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: '10px 20px', height: 46,
      borderBottom: `1px solid ${T.border}`, background: T.bgElev, flexShrink: 0,
    }}>
      <span style={{ color: T.textDim, display: 'flex' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/>
        </svg>
      </span>
      <span style={{ fontSize: 13, color: T.text, fontWeight: 500 }}>{title}</span>
      <div style={{ flex: 1 }} />
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 10px',
        background: T.bgSubtle, borderRadius: 999, border: `1px solid ${T.border}` }}>
        <span style={{ color: T.accent, fontSize: 11 }}>⚡</span>
        <span style={{ fontFamily: 'Geist Mono', fontSize: 12, fontWeight: 500 }}>1 775 XP</span>
      </div>
    </div>
    <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>{children}</div>
  </div>
);

var XPBadge = ({ xp, mini }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontFamily: 'Geist Mono',
    fontSize: mini ? 10 : 11, fontWeight: 500, padding: mini ? '1px 5px' : '2px 7px', borderRadius: 999,
    background: T.accentSubtle, color: T.accent, border: `1px solid ${T.accentBorder}` }}>
    +{xp}<span style={{ fontSize: mini ? 8 : 9, opacity: 0.7 }}>XP</span></span>
);

var DiffDot = ({ diff, size = 5 }) => (
  <span style={{ display: 'inline-block', width: size, height: size, borderRadius: 1,
    background: DIFF_TINT[diff], flexShrink: 0 }} />
);

// ===========================================================================
// ① PARTY EXPEDITION — cooperative, the hero concept
// ===========================================================================
var PartyExpedition = () => {
  const members = [
    { who: 'you',  week: 640, streak: 5 },
    { who: 'alex', week: 580, streak: 8 },
    { who: 'maya', week: 720, streak: 12 },
    { who: 'tom',  week: 410, streak: 3 },
  ];
  const pooled = members.reduce((a, m) => a + m.week, 0);
  const goal = 3000;
  const pct = Math.min(100, (pooled / goal) * 100);
  const feed = [
    { who: 'maya', title: 'Morning run — 5k', xp: 80, ago: '12m' },
    { who: 'you',  title: 'Refactor auth microservice', xp: 150, ago: '1h' },
    { who: 'alex', title: 'Cours Linux Foundation', xp: 150, ago: '3h' },
    { who: 'tom',  title: 'Setup Grafana stack', xp: 100, ago: '5h' },
  ];
  return (
    <Page title="Party">
      <div style={{ height: '100%', overflowY: 'auto', padding: '20px 28px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em' }}>The Polycloud Four</h1>
              <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 500,
                background: T.accentSubtle, color: T.accent, border: `1px solid ${T.accentBorder}`,
                fontFamily: 'Geist Mono' }}>Party Lv.7</span>
            </div>
            <div style={{ fontSize: 13, color: T.textDim, marginTop: 4 }}>
              4 adventurers · everyone's quests feed the same expedition.
            </div>
          </div>
          <div style={{ flex: 1 }} />
          <AvatarStack people={['you','alex','maya','tom']} size={32} />
        </div>

        {/* Expedition goal */}
        <div style={{ padding: 20, background: T.bgElev, border: `1px solid ${T.border}`, borderRadius: 12,
          position: 'relative', overflow: 'hidden', marginBottom: 16 }}>
          <div style={{ position: 'absolute', top: -60, right: -40, width: 240, height: 240,
            background: `radial-gradient(circle, ${T.accentSubtle} 0%, transparent 65%)`, pointerEvents: 'none' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 11, color: T.textFaint, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                This week's expedition
              </div>
              <div style={{ fontSize: 17, fontWeight: 600 }}>Reach the Summit · 3 000 XP together</div>
              <div style={{ fontSize: 12, color: T.textDim, marginTop: 4 }}>
                Unlocks a party badge + everyone gets a 2× XP weekend.
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'Geist Mono', fontSize: 26, fontWeight: 600, color: T.accent, lineHeight: 1 }}>{pooled}</div>
              <div style={{ fontSize: 11, color: T.textFaint, fontFamily: 'Geist Mono' }}>/ {goal} · 3d left</div>
            </div>
          </div>
          {/* Stacked contribution bar */}
          <div style={{ height: 12, borderRadius: 999, overflow: 'hidden', display: 'flex',
            background: T.bgSubtle, border: `1px solid ${T.border}` }}>
            {members.map(m => (
              <div key={m.who} style={{ width: `${(m.week / goal) * 100}%`,
                background: PEOPLE[m.who].tint, opacity: 0.9 }} title={PEOPLE[m.who].name} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 14, marginTop: 10 }}>
            {members.map(m => (
              <span key={m.who} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: T.textDim }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: PEOPLE[m.who].tint }} />
                {PEOPLE[m.who].name} <span style={{ fontFamily: 'Geist Mono', color: T.textFaint }}>{m.week}</span>
              </span>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 16 }}>
          {/* Members + contribution */}
          <div style={{ padding: 16, background: T.bgElev, border: `1px solid ${T.border}`, borderRadius: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 12, color: T.textDim,
              textTransform: 'uppercase', letterSpacing: '0.05em' }}>Members this week</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {members.sort((a,b)=>b.week-a.week).map((m, i) => (
                <div key={m.who} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontFamily: 'Geist Mono', fontSize: 11, color: T.textFaint, width: 14 }}>{i+1}</span>
                  <Avatar who={m.who} size={30} ring={m.who === 'you'} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{PEOPLE[m.who].name}</div>
                    <div style={{ fontSize: 11, color: T.textFaint }}>🔥 {m.streak}-day streak</div>
                  </div>
                  <span style={{ fontFamily: 'Geist Mono', fontSize: 13, color: T.accent }}>{m.week}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Live feed */}
          <div style={{ padding: 16, background: T.bgElev, border: `1px solid ${T.border}`, borderRadius: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 12, color: T.textDim,
              textTransform: 'uppercase', letterSpacing: '0.05em' }}>Live contributions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {feed.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 10px', background: T.bgSubtle, borderRadius: 8, border: `1px solid ${T.border}` }}>
                  <Avatar who={f.who} size={26} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <span style={{ fontWeight: 600 }}>{PEOPLE[f.who].name}</span>
                      <span style={{ color: T.textDim }}> completed </span>{f.title}
                    </div>
                    <div style={{ fontSize: 10.5, color: T.textFaint, fontFamily: 'Geist Mono' }}>{f.ago} ago</div>
                  </div>
                  <XPBadge xp={f.xp} mini />
                  <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 14, padding: 2 }}>👏</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
};

// ===========================================================================
// ② FRIENDS & CHEERS — light social layer
// ===========================================================================
var FriendsFeed = () => {
  const feed = [
    { who: 'maya', type: 'complete', title: 'Morning run — 5k', xp: 80, ago: '12m', cheers: 3, diff: 'Medium' },
    { who: 'alex', type: 'streak', detail: 'hit a 8-day streak 🔥', ago: '1h', cheers: 5 },
    { who: 'tom',  type: 'complete', title: 'Setup Grafana stack', xp: 100, ago: '3h', cheers: 1, diff: 'Hard' },
    { who: 'lea',  type: 'levelup', detail: 'reached Level 9 · Explorer', ago: '5h', cheers: 8 },
    { who: 'sam',  type: 'complete', title: 'Lire DDIA chapitre 5', xp: 40, ago: '6h', cheers: 2, diff: 'Easy' },
  ];
  return (
    <Page title="Friends">
      <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px 28px', maxWidth: 640 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em' }}>Activity</h1>
          <div style={{ fontSize: 13, color: T.textDim, marginTop: 4, marginBottom: 18 }}>What your friends are up to.</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {feed.map((f, i) => <FeedItem key={i} f={f} />)}
          </div>
        </div>
        <div style={{ width: 300, flexShrink: 0, borderLeft: `1px solid ${T.border}`, background: T.bgElev,
          padding: '20px 18px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Friends</span>
            <button style={{ fontSize: 11, color: T.accent, background: 'transparent', border: 'none', cursor: 'pointer' }}>+ Invite</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[['maya',12,true],['alex',8,true],['lea',6,false],['tom',3,true],['sam',0,false]].map(([w, streak, online]) => (
              <div key={w} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 8px', borderRadius: 8 }}>
                <div style={{ position: 'relative' }}>
                  <Avatar who={w} size={30} />
                  {online && <span style={{ position: 'absolute', bottom: 0, right: 0, width: 9, height: 9,
                    borderRadius: '50%', background: T.green, border: `2px solid ${T.bgElev}` }} />}
                </div>
                <span style={{ flex: 1, fontSize: 13 }}>{PEOPLE[w].name}</span>
                <span style={{ fontSize: 11, color: T.textFaint, fontFamily: 'Geist Mono' }}>{streak ? `🔥${streak}` : '—'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Page>
  );
};

var FeedItem = ({ f }) => {
  const [cheered, setCheered] = useState(false);
  return (
    <div style={{ display: 'flex', gap: 12, padding: '12px 14px',
      background: T.bgElev, border: `1px solid ${T.border}`, borderRadius: 10 }}>
      <Avatar who={f.who} size={34} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, lineHeight: 1.4 }}>
          <span style={{ fontWeight: 600 }}>{PEOPLE[f.who].name}</span>
          {f.type === 'complete' && <span style={{ color: T.textDim }}> completed a quest</span>}
          {f.type === 'streak' && <span style={{ color: T.textDim }}> {f.detail}</span>}
          {f.type === 'levelup' && <span style={{ color: T.textDim }}> leveled up — {f.detail}</span>}
        </div>
        {f.type === 'complete' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8,
            padding: '8px 10px', background: T.bgSubtle, borderRadius: 8, border: `1px solid ${T.border}`,
            borderLeft: `2px solid ${DIFF_TINT[f.diff]}` }}>
            <DiffDot diff={f.diff} />
            <span style={{ fontSize: 12.5, flex: 1 }}>{f.title}</span>
            <XPBadge xp={f.xp} mini />
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
          <button onClick={() => setCheered(c => !c)} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px',
            fontSize: 12, fontWeight: 500, cursor: 'pointer', borderRadius: 999,
            background: cheered ? T.accentSubtle : 'transparent',
            color: cheered ? T.accent : T.textDim,
            border: `1px solid ${cheered ? T.accentBorder : T.border}`,
          }}>👏 Cheer <span style={{ fontFamily: 'Geist Mono' }}>{f.cheers + (cheered ? 1 : 0)}</span></button>
          <span style={{ fontSize: 11, color: T.textFaint, fontFamily: 'Geist Mono' }}>{f.ago} ago</span>
        </div>
      </div>
    </div>
  );
};

// ===========================================================================
// ③ LEAGUE — competitive weekly leaderboard
// ===========================================================================
var League = () => {
  const board = [
    { who: 'maya', xp: 1820 }, { who: 'sam', xp: 1640 }, { who: 'alex', xp: 1510 },
    { who: 'you', xp: 1380 },  { who: 'lea', xp: 1250 }, { who: 'tom', xp: 980 },
    { who: 'alex', xp: 870, alt: 'Nina' }, { who: 'maya', xp: 640, alt: 'Hugo' },
  ];
  return (
    <Page title="League">
      <div style={{ height: '100%', overflowY: 'auto', padding: '20px 28px 28px', maxWidth: 640, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            padding: '6px 16px', borderRadius: 999, background: `color-mix(in oklch, ${T.gold} 14%, transparent)`,
            border: `1px solid color-mix(in oklch, ${T.gold} 30%, transparent)`, marginBottom: 12 }}>
            <span style={{ fontSize: 18 }}>◆</span>
            <span style={{ fontSize: 15, fontWeight: 600, color: T.gold }}>Sapphire League</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>Week 23 standings</h1>
          <div style={{ fontSize: 13, color: T.textDim, marginTop: 4 }}>
            Top 3 promote · bottom 2 relegate · <span style={{ color: T.text, fontFamily: 'Geist Mono' }}>2d 4h left</span>
          </div>
        </div>
        <div style={{ background: T.bgElev, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
          {board.map((r, i) => {
            const rank = i + 1;
            const isYou = r.who === 'you';
            const zone = rank <= 3 ? 'promote' : rank >= 7 ? 'relegate' : 'safe';
            return (
              <React.Fragment key={i}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px',
                  borderTop: i === 0 ? 'none' : `1px solid ${T.border}`,
                  background: isYou ? T.accentSubtle : 'transparent' }}>
                  <span style={{ width: 24, textAlign: 'center', fontFamily: 'Geist Mono', fontSize: 14,
                    fontWeight: rank <= 3 ? 700 : 400,
                    color: rank === 1 ? T.gold : rank <= 3 ? T.green : zone === 'relegate' ? T.danger : T.textDim }}>
                    {rank}
                  </span>
                  <Avatar who={r.who} size={32} ring={isYou} />
                  <span style={{ flex: 1, fontSize: 14, fontWeight: isYou ? 600 : 400 }}>
                    {r.alt || PEOPLE[r.who].name}{isYou && <span style={{ color: T.accent, fontSize: 12 }}> · you</span>}
                  </span>
                  {zone === 'promote' && <span style={{ fontSize: 14, color: T.green }}>▲</span>}
                  {zone === 'relegate' && <span style={{ fontSize: 14, color: T.danger }}>▼</span>}
                  <span style={{ fontFamily: 'Geist Mono', fontSize: 14, color: T.text, width: 64, textAlign: 'right' }}>
                    {r.xp.toLocaleString('fr')}
                  </span>
                </div>
                {rank === 3 && <ZoneDivider label="Promotion zone" tone={T.green} />}
                {rank === 6 && <ZoneDivider label="Relegation zone" tone={T.danger} />}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </Page>
  );
};

var ZoneDivider = ({ label, tone }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 16px',
    background: `color-mix(in oklch, ${tone} 8%, transparent)` }}>
    <div style={{ flex: 1, height: 1, background: `color-mix(in oklch, ${tone} 30%, transparent)` }} />
    <span style={{ fontSize: 10, color: tone, textTransform: 'uppercase', letterSpacing: '0.06em',
      fontWeight: 500, fontFamily: 'Geist Mono' }}>{label}</span>
    <div style={{ flex: 1, height: 1, background: `color-mix(in oklch, ${tone} 30%, transparent)` }} />
  </div>
);

// ===========================================================================
// ④ SHARED PROJECT — utility, real teamwork
// ===========================================================================
var SharedProject = () => {
  const quests = [
    { title: 'Obtenir 3 devis plombier', diff: 'Medium', xp: 50, assignee: 'you', done: false },
    { title: 'Trier les cartons du garage', diff: 'Easy', xp: 40, assignee: 'lea', done: true },
    { title: 'Résilier box internet ancienne adresse', diff: 'Easy', xp: 30, assignee: 'lea', done: false },
    { title: 'Choisir peinture salon', diff: 'Medium', xp: 60, assignee: null, done: false },
    { title: 'Réserver camion déménagement', diff: 'Hard', xp: 100, assignee: 'you', done: false },
    { title: 'État des lieux de sortie', diff: 'Medium', xp: 50, assignee: 'lea', done: false },
  ];
  return (
    <Page title="Project · Appartement">
      <div style={{ height: '100%', overflowY: 'auto', padding: '20px 28px 28px', maxWidth: 860, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: T.bgSubtle,
              border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>◈</div>
            <div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em' }}>Appartement</h1>
              <div style={{ fontSize: 13, color: T.textDim, marginTop: 2 }}>Travaux &amp; déménagement · shared with Léa</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AvatarStack people={['you','lea']} size={30} />
            <button style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px',
              fontSize: 13, fontWeight: 500, background: T.bgElev, color: T.text,
              border: `1px solid ${T.border}`, borderRadius: 8, cursor: 'pointer' }}>+ Invite</button>
          </div>
        </div>

        {/* split bar */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          {[['you', 2, 150], ['lea', 1, 30], ['Unassigned', 1, 0]].map(([w, n, xp], i) => (
            <div key={i} style={{ flex: 1, padding: 14, background: T.bgElev, border: `1px solid ${T.border}`, borderRadius: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {w === 'Unassigned'
                  ? <span style={{ width: 24, height: 24, borderRadius: '50%', border: `1.5px dashed ${T.borderStrong}` }} />
                  : <Avatar who={w} size={24} />}
                <span style={{ fontSize: 12, color: T.textDim }}>{w === 'Unassigned' ? 'Unassigned' : PEOPLE[w].name}</span>
              </div>
              <div style={{ fontFamily: 'Geist Mono', fontSize: 20, marginTop: 8 }}>{n} <span style={{ fontSize: 11, color: T.textFaint }}>open</span></div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {quests.map((q, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', alignItems: 'center', gap: 14,
              padding: '11px 14px', background: T.bgElev, border: `1px solid ${T.border}`, borderRadius: 8, opacity: q.done ? 0.5 : 1 }}>
              <span style={{ width: 18, height: 18, borderRadius: 5,
                border: `1.5px solid ${q.done ? T.green : T.borderStrong}`,
                background: q.done ? T.green : 'transparent', display: 'inline-flex',
                alignItems: 'center', justifyContent: 'center', color: T.accentFg, fontSize: 11 }}>{q.done ? '✓' : ''}</span>
              <span style={{ fontSize: 13.5, fontWeight: 500, textDecoration: q.done ? 'line-through' : 'none' }}>{q.title}</span>
              {q.assignee
                ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: T.textDim }}>
                    <Avatar who={q.assignee} size={22} /> {PEOPLE[q.assignee].name}
                  </span>
                : <button style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: T.textFaint,
                    background: 'transparent', border: `1px dashed ${T.border}`, borderRadius: 999, padding: '3px 10px', cursor: 'pointer' }}>
                    + Assign
                  </button>}
              <XPBadge xp={q.xp} mini />
            </div>
          ))}
        </div>
      </div>
    </Page>
  );
};

// ===========================================================================
// ⑤ ACCOUNTABILITY BUDDY — 1:1 pairing
// ===========================================================================
var Buddy = () => {
  const cols = {
    you:  [['Refactor auth microservice','Epic',150,true], ['Morning run — 5k','Medium',80,true], ['Plan Q2 OKRs','Hard',120,false]],
    alex: [['Cours Linux Foundation','Epic',150,true], ['Réviser réseau','Medium',60,false], ['Gym — upper body','Hard',100,false]],
  };
  return (
    <Page title="Buddy">
      <div style={{ height: '100%', overflowY: 'auto', padding: '20px 28px 28px', maxWidth: 760, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>You &amp; Alex</h1>
          <div style={{ fontSize: 13, color: T.textDim, marginTop: 4 }}>
            Accountability buddies · <span style={{ color: T.gold }}>🔥 17-day shared streak</span>
          </div>
        </div>

        {/* shared streak ring of dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 4, margin: '16px 0 22px' }}>
          {Array.from({ length: 21 }).map((_, i) => (
            <span key={i} style={{ width: 10, height: 10, borderRadius: 3,
              background: i < 17 ? T.gold : T.bgSubtle, opacity: i < 17 ? (0.5 + (i/17)*0.5) : 1,
              border: i === 17 ? `1px dashed ${T.borderStrong}` : 'none' }} />
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {['you', 'alex'].map(who => (
            <div key={who} style={{ background: T.bgElev, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderBottom: `1px solid ${T.border}` }}>
                <Avatar who={who} size={30} ring={who === 'you'} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{PEOPLE[who].name === 'You' ? 'You' : PEOPLE[who].name}'s today</div>
                  <div style={{ fontSize: 11, color: T.textFaint, fontFamily: 'Geist Mono' }}>
                    {cols[who].filter(q=>q[3]).length}/{cols[who].length} done
                  </div>
                </div>
                {who !== 'you' && (
                  <button style={{ fontSize: 11, fontWeight: 500, padding: '5px 10px', borderRadius: 999,
                    background: T.accentSubtle, color: T.accent, border: `1px solid ${T.accentBorder}`, cursor: 'pointer' }}>
                    👋 Nudge
                  </button>
                )}
              </div>
              <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {cols[who].map((q, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                    background: T.bgSubtle, borderRadius: 7, border: `1px solid ${T.border}`, opacity: q[3] ? 0.55 : 1 }}>
                    <span style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                      border: `1.5px solid ${q[3] ? T.green : T.borderStrong}`, background: q[3] ? T.green : 'transparent',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: T.accentFg, fontSize: 10 }}>{q[3] ? '✓' : ''}</span>
                    <span style={{ flex: 1, fontSize: 12.5, textDecoration: q[3] ? 'line-through' : 'none',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{q[0]}</span>
                    <DiffDot diff={q[1]} />
                    <span style={{ fontFamily: 'Geist Mono', fontSize: 10, color: T.accent }}>+{q[2]}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Page>
  );
};

window.CollabVariants = { PartyExpedition, FriendsFeed, League, SharedProject, Buddy };
