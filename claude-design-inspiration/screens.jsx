// All screens + shell — use var so each babel scope can redeclare safely
var useState = React.useState;
var useEffect = React.useEffect;
var useRef = React.useRef;
var useMemo = React.useMemo;
var useCallback = React.useCallback;
var Icons = window.Icons;
var Data = window.Data;
var useTheme = window.useTheme;
var Button = window.Button;
var XPBadge = window.XPBadge;
var DiffPill = window.DiffPill;
var QuestCheckbox = window.QuestCheckbox;
var QuestRow = window.QuestRow;
var Modal = window.Modal;
var Field = window.Field;
var Input = window.Input;
var Select = window.Select;
var Progress = window.Progress;
var Empty = window.Empty;
var LogoMark = window.LogoMark;

// ============ SHELL / SIDEBAR ==============================================
var NAV_ITEMS = [
  { id: 'inbox', label: 'Inbox', icon: Icons.Inbox },
  { id: 'today', label: 'Today', icon: Icons.Sun },
  { id: 'upcoming', label: 'Upcoming', icon: Icons.Calendar },
  { id: 'habits', label: 'Habits', icon: Icons.Repeat },
  { id: 'regions', label: 'Regions', icon: Icons.Map },
];
var INSIGHT_ITEMS = [
  { id: 'progress', label: 'Progress', icon: Icons.Trend },
  { id: 'stats', label: 'Stats', icon: Icons.Bar },
  { id: 'history', label: 'History', icon: Icons.History },
];

var Sidebar = ({ theme, variant, active, onNav, projects, activeProject, onProject, collapsed }) => {
  const [projectsOpen, setProjectsOpen] = useState(true);

  const NavItem = ({ item, isActive, onClick, indent }) => {
    const [hover, setHover] = useState(false);
    const Icon = item.icon;
    return (
      <button
        onClick={onClick}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          width: '100%', padding: `7px 10px 7px ${indent ? 24 : 10}px`,
          fontSize: 13, fontWeight: isActive ? 500 : 400,
          color: isActive ? theme.text : theme.textDim,
          background: isActive ? theme.sidebarItem : (hover ? theme.sidebarItem : 'transparent'),
          border: 'none', borderRadius: theme.radius - 2,
          cursor: 'pointer', transition: 'all 100ms ease',
          letterSpacing: '-0.005em',
          textAlign: 'left',
          position: 'relative',
        }}
      >
        {isActive && (
          <span style={{
            position: 'absolute', left: 0, top: 8, bottom: 8, width: 2,
            background: theme.accent, borderRadius: 999,
          }} />
        )}
        <Icon size={15} sw={1.5} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.75 }} />
        <span style={{ flex: 1 }}>{item.label}</span>
        {item.count !== undefined && (
          <span style={{ fontSize: 11, color: theme.textFaint, fontFamily: 'Geist Mono' }}>{item.count}</span>
        )}
      </button>
    );
  };

  const Section = ({ label, children, action }) => (
    <div style={{ marginTop: 18 }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0 10px 4px', fontSize: 11, fontWeight: 500,
        color: theme.textFaint, textTransform: 'uppercase', letterSpacing: '0.04em',
      }}>
        <span>{label}</span>
        {action}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>{children}</div>
    </div>
  );

  return (
    <aside style={{
      width: collapsed ? 0 : 240,
      flexShrink: 0,
      background: theme.sidebar,
      borderRight: `1px solid ${theme.border}`,
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
      transition: 'width 200ms cubic-bezier(.2,.8,.2,1)',
    }}>
      <div style={{ padding: '14px 12px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${theme.border}` }}>
        <div style={{
          width: 28, height: 28, borderRadius: theme.radius - 2,
          background: theme.accent, color: theme.accentFg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 600, fontSize: 13,
        }}>
          A
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: theme.text, letterSpacing: '-0.01em' }}>Axel</div>
          <div style={{ fontSize: 11, color: theme.textFaint, fontFamily: 'Geist Mono' }}>Lvl 2 · Initiate</div>
        </div>
        <Icons.ChevronDown size={13} style={{ color: theme.textFaint }} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 8px' }}>
        <Section label="Navigation">
          {NAV_ITEMS.map(item => (
            <NavItem key={item.id} item={item} isActive={active === item.id} onClick={() => onNav(item.id)} />
          ))}
        </Section>

        <Section label="Projects" action={
          <button onClick={() => setProjectsOpen(!projectsOpen)}
            style={{ background: 'transparent', border: 'none', color: theme.textFaint, cursor: 'pointer', padding: 0 }}>
            <Icons.Plus size={12} />
          </button>
        }>
          <NavItem
            item={{ id: 'projects-all', label: 'All projects', icon: Icons.Folder }}
            isActive={active === 'projects'}
            onClick={() => onNav('projects')}
          />
          {projectsOpen && projects.slice(0, 3).map(p => (
            <NavItem
              key={p.id}
              item={{ id: p.id, label: p.name, icon: () => <span style={{fontSize: 13}}>{p.emoji}</span> }}
              isActive={activeProject === p.id}
              onClick={() => onProject(p.id)}
              indent
            />
          ))}
        </Section>

        <Section label="Insights">
          {INSIGHT_ITEMS.map(item => (
            <NavItem key={item.id} item={item} isActive={active === item.id} onClick={() => onNav(item.id)} />
          ))}
        </Section>
      </div>

      <div style={{ padding: '10px 12px', borderTop: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icons.Shield size={14} style={{ color: theme.textFaint }} />
        <span style={{ fontSize: 12, color: theme.textDim }}>Admin</span>
        <div style={{ flex: 1 }} />
        <Icons.Settings size={14} style={{ color: theme.textFaint, cursor: 'pointer' }} />
      </div>
    </aside>
  );
};

// ============ TOPBAR ========================================================
var Topbar = ({ theme, title, subtitle, onToggleSidebar, right, xp, level }) => (
  <div style={{
    padding: '12px 20px',
    borderBottom: `1px solid ${theme.border}`,
    display: 'flex', alignItems: 'center', gap: 14,
    background: theme.bgElev,
    position: 'sticky', top: 0, zIndex: 10,
  }}>
    <button onClick={onToggleSidebar} style={{
      background: 'transparent', border: 'none', color: theme.textDim,
      cursor: 'pointer', padding: 6, borderRadius: 4, display: 'flex',
    }}>
      <Icons.SidebarLeft size={16} />
    </button>
    <div style={{ flex: 1, minWidth: 0 }}>
      {title && <div style={{ fontSize: 13, fontWeight: 500, color: theme.text, letterSpacing: '-0.01em' }}>{title}</div>}
      {subtitle && <div style={{ fontSize: 11, color: theme.textFaint }}>{subtitle}</div>}
    </div>
    {xp !== undefined && (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '5px 10px',
        background: theme.bgSubtle,
        borderRadius: 999,
        border: `1px solid ${theme.border}`,
      }}>
        <Icons.Zap size={12} style={{ color: theme.accent }} />
        <span style={{ fontFamily: 'Geist Mono', fontSize: 12, fontWeight: 500, color: theme.text }}>{xp} XP</span>
        <span style={{ width: 1, height: 10, background: theme.border }} />
        <span style={{ fontSize: 11, color: theme.textDim }}>Lvl {level}</span>
      </div>
    )}
    {right}
  </div>
);

// ============ PAGE HEADER ===================================================
var PageHeader = ({ title, subtitle, right, theme, variant }) => (
  <div style={{
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
    marginBottom: 24, gap: 20,
  }}>
    <div>
      <h1 style={{
        margin: 0, fontSize: variant === 'arc' ? 28 : 24,
        fontWeight: variant === 'arc' ? 500 : 600,
        color: theme.text,
        letterSpacing: variant === 'arc' ? '-0.025em' : '-0.02em',
        fontFamily: variant === 'arc' ? 'Instrument Serif, serif' : 'Geist, sans-serif',
      }}>{title}</h1>
      {subtitle && <div style={{ fontSize: 13, color: theme.textDim, marginTop: 4 }}>{subtitle}</div>}
    </div>
    {right}
  </div>
);

// ============ INBOX SCREEN ==================================================
var InboxScreen = ({ theme, variant, quests, onQuestComplete, onQuestEdit, onNewQuest }) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const filtered = useMemo(() => {
    let q = quests;
    if (search) q = q.filter(x => x.title.toLowerCase().includes(search.toLowerCase()));
    if (filter === 'today') q = q.filter(x => x.due === '2026-04-19');
    if (filter === 'overdue') q = q.filter(x => x.due < '2026-04-19');
    return q;
  }, [quests, search, filter]);

  return (
    <div style={{ padding: '24px 28px', maxWidth: 920, margin: '0 auto' }}>
      <PageHeader
        title="Inbox"
        subtitle="All quests, unassigned & pending"
        theme={theme}
        variant={variant}
        right={
          <Button theme={theme} icon={Icons.Plus} onClick={onNewQuest}>New quest</Button>
        }
      />

      {/* Toolbar */}
      <div style={{
        display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center',
        background: theme.bgElev, padding: 6, borderRadius: theme.radius,
        border: `1px solid ${theme.border}`,
      }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '0 8px' }}>
          <Icons.Search size={14} style={{ color: theme.textFaint }} />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search quests..."
            style={{
              flex: 1, border: 'none', outline: 'none', background: 'transparent',
              color: theme.text, fontSize: 13, padding: '6px 0',
              fontFamily: 'inherit',
            }}
          />
          <kbd style={{
            fontFamily: 'Geist Mono', fontSize: 10,
            padding: '2px 5px', borderRadius: 3,
            background: theme.bgSubtle, color: theme.textFaint,
            border: `1px solid ${theme.border}`,
          }}>⌘K</kbd>
        </div>
        <Button theme={theme} variant="ghost" size="sm" icon={Icons.Filter}>None</Button>
        <Button theme={theme} variant="ghost" size="sm" icon={Icons.Sort}>Due</Button>
        <Button theme={theme} variant="ghost" size="sm" icon={Icons.Grid}>Comfort</Button>
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, alignItems: 'center' }}>
        {[
          { id: 'all', label: 'All', count: quests.length },
          { id: 'today', label: 'Today', count: quests.filter(q => q.due === '2026-04-19').length },
          { id: 'overdue', label: 'Overdue', count: 0 },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 10px', fontSize: 12, fontWeight: 500,
              background: filter === f.id ? theme.bgSubtle : 'transparent',
              color: filter === f.id ? theme.text : theme.textDim,
              border: `1px solid ${filter === f.id ? theme.borderStrong : 'transparent'}`,
              borderRadius: 999, cursor: 'pointer',
              fontFamily: 'inherit',
            }}>
            {f.label}
            <span style={{ fontFamily: 'Geist Mono', fontSize: 10, color: theme.textFaint }}>{f.count}</span>
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: theme.textFaint, fontFamily: 'Geist Mono' }}>
          {filtered.length} of {quests.length}
        </span>
      </div>

      {/* Quest list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {filtered.length === 0 ? (
          <Empty icon={Icons.Inbox} title="No quests yet"
            subtitle="Add your first quest and begin the journey." theme={theme}>
            <Button theme={theme} icon={Icons.Plus} onClick={onNewQuest}>New quest</Button>
          </Empty>
        ) : filtered.map(q => (
          <QuestRow key={q.id} quest={q} theme={theme} variant={variant}
            onComplete={onQuestComplete} onEdit={onQuestEdit} />
        ))}
      </div>
    </div>
  );
};

// ============ TODAY SCREEN ==================================================
var TodayScreen = ({ theme, variant, quests, onQuestComplete, onQuestEdit, xp }) => {
  const today = quests.filter(q => q.due === '2026-04-19');
  const done = 1; // mock: simulating 1 quest already done today
  const total = today.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  return (
    <div style={{ padding: '24px 28px', maxWidth: 920, margin: '0 auto' }}>
      <PageHeader
        title="Today"
        subtitle={`${greeting}, Axel — ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`}
        theme={theme}
        variant={variant}
      />

      {/* Focus card — the hero */}
      <div style={{
        padding: variant === 'arc' ? 24 : 20,
        background: theme.bgElev,
        border: `1px solid ${theme.border}`,
        borderRadius: theme.radiusLg,
        marginBottom: 20,
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Background flourish */}
        <div style={{
          position: 'absolute', top: -40, right: -40, width: 200, height: 200,
          background: `radial-gradient(circle, ${theme.accentSubtle} 0%, transparent 65%)`,
          pointerEvents: 'none',
        }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, color: theme.textDim, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Daily progress
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 6 }}>
              <span style={{ fontFamily: 'Geist Mono', fontSize: 36, fontWeight: 500, color: theme.text, letterSpacing: '-0.03em' }}>
                {done}
              </span>
              <span style={{ fontSize: 16, color: theme.textDim }}>/ {total} quests</span>
            </div>
            <div style={{ fontSize: 13, color: theme.textDim, marginTop: 2 }}>
              {pct}% complete · +{today.filter(q => q.status === 'done').reduce((s, q) => s + q.xp, 0) + 50} XP earned
            </div>
          </div>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <StreakChip theme={theme} count={7} />
          </div>
        </div>
        <div style={{ marginTop: 16, position: 'relative' }}>
          <Progress value={pct} theme={theme} thick />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: theme.text, letterSpacing: '-0.01em' }}>
          Today's quests
        </h2>
        <span style={{ fontSize: 11, color: theme.textFaint, fontFamily: 'Geist Mono' }}>{today.length} items</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {today.map(q => (
          <QuestRow key={q.id} quest={q} theme={theme} variant={variant}
            onComplete={onQuestComplete} onEdit={onQuestEdit} />
        ))}
      </div>
    </div>
  );
};

var StreakChip = ({ theme, count }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '6px 10px',
    background: 'oklch(0.96 0.04 50)',
    color: 'oklch(0.55 0.15 40)',
    border: `1px solid oklch(0.88 0.08 50)`,
    borderRadius: 999,
    fontSize: 12, fontWeight: 500,
  }}>
    <Icons.Flame size={12} sw={1.8} />
    <span style={{ fontFamily: 'Geist Mono' }}>{count} day streak</span>
  </div>
);

// ============ UPCOMING ======================================================
var UpcomingScreen = ({ theme, variant, quests, onQuestComplete, onQuestEdit }) => {
  const grouped = useMemo(() => {
    const byDate = {};
    quests.filter(q => q.due > '2026-04-19').forEach(q => {
      byDate[q.due] = byDate[q.due] || [];
      byDate[q.due].push(q);
    });
    return Object.keys(byDate).sort().map(d => ({ date: d, quests: byDate[d] }));
  }, [quests]);

  return (
    <div style={{ padding: '24px 28px', maxWidth: 920, margin: '0 auto' }}>
      <PageHeader
        title="The road ahead"
        subtitle="Your upcoming quests, grouped by day"
        theme={theme}
        variant={variant}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {grouped.map(({ date, quests: qs }) => {
          const d = new Date(date);
          const label = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
          return (
            <div key={date}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10,
                paddingBottom: 8, borderBottom: `1px solid ${theme.border}`,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: theme.radius,
                  background: theme.bgSubtle, border: `1px solid ${theme.border}`,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{ fontSize: 9, color: theme.textFaint, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {d.toLocaleDateString('en-US', { month: 'short' })}
                  </div>
                  <div style={{ fontFamily: 'Geist Mono', fontSize: 14, fontWeight: 600, color: theme.text, lineHeight: 1 }}>
                    {d.getDate()}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: theme.text, letterSpacing: '-0.01em' }}>{label}</div>
                  <div style={{ fontSize: 11, color: theme.textFaint }}>
                    {qs.length} quest{qs.length > 1 ? 's' : ''} · {qs.reduce((s, q) => s + q.xp, 0)} XP available
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {qs.map(q => (
                  <QuestRow key={q.id} quest={q} theme={theme} variant={variant}
                    onComplete={onQuestComplete} onEdit={onQuestEdit} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============ HABITS ========================================================
var HabitsScreen = ({ theme, variant, habits, onQuestComplete, onQuestEdit, onNewQuest }) => {
  return (
    <div style={{ padding: '24px 28px', maxWidth: 920, margin: '0 auto' }}>
      <PageHeader
        title="Habits"
        subtitle="Recurring quests that build consistency"
        theme={theme}
        variant={variant}
        right={<Button theme={theme} icon={Icons.Plus} onClick={onNewQuest}>New habit</Button>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
        {habits.map(h => <HabitCard key={h.id} habit={h} theme={theme} variant={variant} />)}
      </div>
    </div>
  );
};

var HabitCard = ({ habit, theme, variant }) => {
  const [hover, setHover] = useState(false);
  // streak dots — last 14 days
  const dots = Array.from({ length: 14 }, (_, i) => ({
    done: Math.random() > 0.25,
    today: i === 13,
  }));
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: 14,
        background: theme.bgElev,
        border: `1px solid ${hover ? theme.borderStrong : theme.border}`,
        borderRadius: theme.radiusLg,
        cursor: 'pointer',
        transition: 'all 140ms ease',
      }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: theme.text, letterSpacing: '-0.01em' }}>
            {habit.title}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 4, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: theme.textFaint }}>{habit.cadence}</span>
            <span style={{ color: theme.textFaint }}>·</span>
            <DiffPill level={habit.difficulty} theme={theme} />
          </div>
        </div>
        <XPBadge xp={habit.xp} theme={theme} size="sm" />
      </div>

      <div style={{ display: 'flex', gap: 3, marginTop: 14 }}>
        {dots.map((d, i) => (
          <div key={i} style={{
            flex: 1, height: 4, borderRadius: 1,
            background: d.done ? theme.accent : theme.bgSubtle,
            opacity: d.today ? 1 : (d.done ? 0.8 : 1),
            border: d.today && !d.done ? `1px dashed ${theme.borderStrong}` : 'none',
          }} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        <span style={{ fontSize: 11, color: theme.textFaint, display: 'inline-flex', gap: 4, alignItems: 'center' }}>
          <Icons.Flame size={11} sw={1.8} style={{ color: 'oklch(0.65 0.18 40)' }} />
          <span style={{ fontFamily: 'Geist Mono', fontWeight: 500 }}>{habit.streak}</span>
          <span>day streak</span>
        </span>
        <span style={{ fontSize: 11, color: theme.textFaint, fontFamily: 'Geist Mono' }}>
          last 14d
        </span>
      </div>
    </div>
  );
};

// ============ REGIONS =======================================================
var RegionsScreen = ({ theme, variant, regions }) => {
  return (
    <div style={{ padding: '24px 28px', maxWidth: 920, margin: '0 auto' }}>
      <PageHeader
        title="Regions"
        subtitle="Your quest categories and their current activity"
        theme={theme}
        variant={variant}
        right={<Button theme={theme} icon={Icons.Plus}>Add region</Button>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
        {regions.map(r => <RegionCard key={r.id} region={r} theme={theme} variant={variant} />)}
      </div>
    </div>
  );
};

var RegionCard = ({ region, theme, variant }) => {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: 14,
        background: theme.bgElev,
        border: `1px solid ${hover ? theme.borderStrong : theme.border}`,
        borderRadius: theme.radiusLg,
        cursor: 'pointer',
        position: 'relative', overflow: 'hidden',
        transition: 'all 140ms ease',
      }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: region.tint,
      }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: theme.radius,
          background: `color-mix(in oklch, ${region.tint} 16%, transparent)`,
          color: region.tint, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, fontWeight: 500,
        }}>
          {region.emoji}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: theme.text, letterSpacing: '-0.01em' }}>
            {region.name}
          </div>
          <div style={{ fontSize: 11, color: theme.textFaint, fontFamily: 'Geist Mono' }}>
            {region.count} quests
          </div>
        </div>
      </div>
    </div>
  );
};

// ============ PROGRESS ======================================================
var ProgressScreen = ({ theme, variant }) => {
  return (
    <div style={{ padding: '24px 28px', maxWidth: 920, margin: '0 auto' }}>
      <PageHeader
        title="Progress"
        subtitle="Your long-term journey, one step at a time"
        theme={theme}
        variant={variant}
      />

      {/* Grade journey */}
      <div style={{
        padding: 20, background: theme.bgElev,
        border: `1px solid ${theme.border}`, borderRadius: theme.radiusLg,
        marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
          <Icons.Star size={14} style={{ color: theme.accent }} />
          <span style={{ fontSize: 13, fontWeight: 500, color: theme.text, letterSpacing: '-0.005em' }}>Grade journey</span>
        </div>
        <GradeJourney theme={theme} currentLevel={2} />
      </div>

      {/* Two stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <StatCard theme={theme} variant={variant}
          icon={Icons.Star} label="Current grade" value="Initiate"
          sub="Level 2" progress={40} progressLabel="40% to next level" />
        <StatCard theme={theme} variant={variant}
          icon={Icons.Zap} label="Total experience" value="150"
          valueUnit="XP" sub="50 / 200 to next level" progress={25} />
      </div>

      {/* Requirements */}
      <div style={{
        padding: 20, background: theme.bgElev,
        border: `1px solid ${theme.border}`, borderRadius: theme.radiusLg,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: theme.text, letterSpacing: '-0.005em' }}>
              Requirements for Traveler
            </div>
            <div style={{ fontSize: 11, color: theme.textFaint, marginTop: 2 }}>Complete both to advance</div>
          </div>
          <span style={{
            fontSize: 11, fontFamily: 'Geist Mono',
            padding: '3px 8px', borderRadius: 999,
            background: theme.bgSubtle, color: theme.textDim,
          }}>2 remaining</span>
        </div>
        <Requirement theme={theme} label="Reach Level 6" current={2} target={6} unit="levels" />
        <div style={{ height: 10 }} />
        <Requirement theme={theme} label="Complete 10 quests" current={3} target={10} unit="quests" />
      </div>
    </div>
  );
};

var GradeJourney = ({ theme, currentLevel }) => {
  const stops = [
    { name: 'Initiate', level: 1, current: true, done: false },
    { name: 'Traveler', level: 6 },
    { name: 'Explorer', level: 11 },
    { name: 'Adventurer', level: 21 },
    { name: 'Hero', level: 36 },
    { name: 'Legend', level: 51 },
  ];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap' }}>
      {stops.map((s, i) => (
        <React.Fragment key={s.name}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: '0 0 auto' }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: s.current ? theme.accent : theme.bgSubtle,
              border: `2px solid ${s.current ? theme.accent : theme.border}`,
              color: s.current ? theme.accentFg : theme.textDim,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Geist Mono', fontSize: 13, fontWeight: 500,
              boxShadow: s.current ? `0 0 0 4px ${theme.accentSubtle}` : 'none',
              transition: 'all 200ms ease',
            }}>
              {s.current ? <Icons.Check size={16} sw={2.5} /> : s.level}
            </div>
            <div style={{ fontSize: 11, color: s.current ? theme.text : theme.textFaint, fontWeight: s.current ? 500 : 400 }}>
              {s.name}
            </div>
          </div>
          {i < stops.length - 1 && (
            <div style={{
              flex: 1, height: 2,
              background: s.current
                ? `linear-gradient(90deg, ${theme.accent} 40%, ${theme.border} 40%)`
                : theme.border,
              margin: '0 4px', marginBottom: 20, minWidth: 20,
            }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

var StatCard = ({ theme, variant, icon: Icon, label, value, valueUnit, sub, progress, progressLabel }) => (
  <div style={{
    padding: 18, background: theme.bgElev,
    border: `1px solid ${theme.border}`, borderRadius: theme.radiusLg,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
      <Icon size={13} style={{ color: theme.textDim }} />
      <span style={{ fontSize: 12, color: theme.textDim, letterSpacing: '-0.005em' }}>{label}</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
      <span style={{
        fontFamily: variant === 'arc' ? 'Instrument Serif, serif' : 'Geist Mono, monospace',
        fontSize: variant === 'arc' ? 38 : 32,
        fontWeight: variant === 'arc' ? 400 : 500,
        color: theme.text, letterSpacing: '-0.03em',
      }}>{value}</span>
      {valueUnit && <span style={{ fontSize: 14, color: theme.textDim, fontFamily: 'Geist Mono' }}>{valueUnit}</span>}
      <span style={{ flex: 1 }} />
      <span style={{ fontSize: 12, color: theme.textFaint }}>{sub}</span>
    </div>
    <div style={{ marginTop: 12 }}>
      <Progress value={progress} theme={theme} />
    </div>
    {progressLabel && <div style={{ fontSize: 11, color: theme.textFaint, marginTop: 6 }}>{progressLabel}</div>}
  </div>
);

var Requirement = ({ theme, label, current, target, unit }) => (
  <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
      <span style={{ fontSize: 13, color: theme.text }}>{label}</span>
      <span style={{ fontSize: 11, color: theme.textFaint, fontFamily: 'Geist Mono' }}>
        {current} / {target} {unit}
      </span>
    </div>
    <Progress value={(current / target) * 100} theme={theme} />
  </div>
);

// ============ STATS =========================================================
var StatsScreen = ({ theme, variant }) => {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const data = [0.8, 1, 0.5, 0.9, 0.7, 0, 1];

  // Monthly heatmap (5 weeks x 7 days)
  const heat = Array.from({ length: 35 }, () => Math.random());

  return (
    <div style={{ padding: '24px 28px', maxWidth: 920, margin: '0 auto' }}>
      <PageHeader
        title="Stats"
        subtitle="Your activity and consistency over time"
        theme={theme}
        variant={variant}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Weekly consistency */}
        <div style={{
          padding: 20, background: theme.bgElev,
          border: `1px solid ${theme.border}`, borderRadius: theme.radiusLg,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icons.Calendar size={13} style={{ color: theme.textDim }} />
                <span style={{ fontSize: 13, fontWeight: 500, color: theme.text, letterSpacing: '-0.005em' }}>Weekly consistency</span>
              </div>
              <div style={{ fontSize: 11, color: theme.textFaint, marginTop: 4 }}>Apr 13 – Apr 19, 2026</div>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <Metric theme={theme} value="6" label="active days" />
              <Metric theme={theme} value="+420" label="XP" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 100 }}>
            {days.map((d, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end' }}>
                  <div style={{
                    width: '100%',
                    height: `${data[i] * 100}%`,
                    background: data[i] === 1 ? theme.accent : (data[i] > 0.5 ? `color-mix(in oklch, ${theme.accent} 60%, ${theme.bgSubtle})` : theme.bgSubtle),
                    borderRadius: 4,
                    minHeight: 4,
                    transition: 'all 200ms ease',
                  }} />
                </div>
                <span style={{ fontSize: 10, color: theme.textFaint, fontFamily: 'Geist Mono' }}>{d}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 14, marginTop: 14, justifyContent: 'flex-end', fontSize: 10 }}>
            {[
              { label: '100%', tint: theme.accent },
              { label: 'Partial', tint: `color-mix(in oklch, ${theme.accent} 60%, ${theme.bgSubtle})` },
              { label: 'None', tint: theme.bgSubtle },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4, color: theme.textFaint }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: l.tint }} />
                {l.label}
              </div>
            ))}
          </div>
        </div>

        {/* Monthly + regions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 12 }}>
          <div style={{
            padding: 20, background: theme.bgElev,
            border: `1px solid ${theme.border}`, borderRadius: theme.radiusLg,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icons.Grid size={13} style={{ color: theme.textDim }} />
                <span style={{ fontSize: 13, fontWeight: 500, color: theme.text, letterSpacing: '-0.005em' }}>Monthly activity</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: theme.textFaint, fontSize: 12 }}>
                <Icons.ChevronLeft size={13} style={{ cursor: 'pointer' }} />
                <span style={{ fontFamily: 'Geist Mono' }}>April 2026</span>
                <Icons.ChevronRight size={13} style={{ cursor: 'pointer' }} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
              {heat.map((v, i) => (
                <div key={i} style={{
                  aspectRatio: '1',
                  background: v > 0.7 ? theme.accent
                    : v > 0.4 ? `color-mix(in oklch, ${theme.accent} 45%, ${theme.bgSubtle})`
                    : v > 0.15 ? `color-mix(in oklch, ${theme.accent} 20%, ${theme.bgSubtle})`
                    : theme.bgSubtle,
                  borderRadius: 3,
                }} />
              ))}
            </div>
            <div style={{ display: 'flex', gap: 18, marginTop: 16 }}>
              <Metric theme={theme} value="22" label="quests" inline />
              <Metric theme={theme} value="18" label="active days" inline />
              <Metric theme={theme} value="+1,240" label="XP" inline />
            </div>
          </div>

          <div style={{
            padding: 20, background: theme.bgElev,
            border: `1px solid ${theme.border}`, borderRadius: theme.radiusLg,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
              <Icons.Map size={13} style={{ color: theme.textDim }} />
              <span style={{ fontSize: 13, fontWeight: 500, color: theme.text, letterSpacing: '-0.005em' }}>By region</span>
            </div>
            {Data.SEED_REGIONS.map((r, i) => {
              const pct = [40, 25, 20, 15][i];
              return (
                <div key={r.id} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: theme.text }}>
                      <span style={{ marginRight: 6 }}>{r.emoji}</span>{r.name}
                    </span>
                    <span style={{ fontFamily: 'Geist Mono', color: theme.textFaint }}>{pct}%</span>
                  </div>
                  <div style={{ height: 4, background: theme.bgSubtle, borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: r.tint, borderRadius: 999 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

var Metric = ({ theme, value, label, inline }) => (
  <div style={inline ? { display: 'flex', gap: 5, alignItems: 'baseline' } : {}}>
    <div style={{
      fontFamily: 'Geist Mono', fontSize: inline ? 18 : 20, fontWeight: 500,
      color: theme.text, letterSpacing: '-0.02em', lineHeight: 1,
    }}>{value}</div>
    <div style={{ fontSize: 11, color: theme.textFaint, marginTop: inline ? 0 : 2 }}>{label}</div>
  </div>
);

// ============ HISTORY =======================================================
var HistoryScreen = ({ theme, variant, completed }) => {
  const grouped = useMemo(() => {
    const g = {};
    completed.forEach(c => {
      const d = c.completedAt.slice(0, 10);
      g[d] = g[d] || [];
      g[d].push(c);
    });
    return Object.keys(g).sort().reverse().map(d => ({ date: d, items: g[d] }));
  }, [completed]);

  const dateLabel = (d) => {
    const today = '2026-04-19';
    if (d === today) return 'Today';
    const yesterday = '2026-04-18';
    if (d === yesterday) return 'Yesterday';
    return new Date(d).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  return (
    <div style={{ padding: '24px 28px', maxWidth: 920, margin: '0 auto' }}>
      <PageHeader
        title="History"
        subtitle="Your completed quests over time"
        theme={theme}
        variant={variant}
        right={<Button theme={theme} variant="secondary" icon={Icons.Filter}>All regions</Button>}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        {grouped.map(({ date, items }) => (
          <div key={date}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              paddingBottom: 8, marginBottom: 10,
              borderBottom: `1px solid ${theme.border}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icons.Calendar size={13} style={{ color: theme.textFaint }} />
                <span style={{ fontSize: 13, fontWeight: 500, color: theme.text }}>{dateLabel(date)}</span>
              </div>
              <div style={{ display: 'flex', gap: 12, fontSize: 11, color: theme.textFaint, fontFamily: 'Geist Mono' }}>
                <span>{items.length} quests</span>
                <span style={{ color: theme.accent }}>+{items.reduce((s, i) => s + i.xp, 0)} XP</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {items.map(c => (
                <div key={c.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                  background: theme.bgElev, border: `1px solid ${theme.border}`,
                  borderRadius: theme.radius,
                }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: 5,
                    background: theme.accent, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icons.Check size={11} sw={3} style={{ color: theme.accentFg }} />
                  </div>
                  <div style={{ flex: 1, fontSize: 13, color: theme.text, textDecoration: 'line-through', opacity: 0.8 }}>
                    {c.title}
                  </div>
                  <span style={{ fontSize: 11, color: theme.textFaint, fontFamily: 'Geist Mono' }}>
                    {c.completedAt.slice(11, 16)}
                  </span>
                  <XPBadge xp={c.xp} theme={theme} size="sm" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============ PROJECTS ======================================================
var ProjectsScreen = ({ theme, variant, projects, onOpenProject }) => {
  return (
    <div style={{ padding: '24px 28px', maxWidth: 920, margin: '0 auto' }}>
      <PageHeader
        title="Projects"
        subtitle="Long-running initiatives"
        theme={theme}
        variant={variant}
        right={<Button theme={theme} icon={Icons.Plus}>New project</Button>}
      />

      <div style={{
        display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center',
        background: theme.bgElev, padding: 6, borderRadius: theme.radius,
        border: `1px solid ${theme.border}`,
      }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '0 8px' }}>
          <Icons.Search size={14} style={{ color: theme.textFaint }} />
          <input placeholder="Search projects..." style={{
            flex: 1, border: 'none', outline: 'none', background: 'transparent',
            color: theme.text, fontSize: 13, padding: '6px 0', fontFamily: 'inherit',
          }} />
        </div>
        <Button theme={theme} variant="ghost" size="sm" icon={Icons.Sort}>Recently updated</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 10 }}>
        {projects.map(p => <ProjectCard key={p.id} project={p} theme={theme} variant={variant} onOpen={() => onOpenProject(p.id)} />)}
      </div>
    </div>
  );
};

var ProjectCard = ({ project, theme, variant, onOpen }) => {
  const [hover, setHover] = useState(false);
  return (
    <div
      onClick={onOpen}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: 16, background: theme.bgElev,
        border: `1px solid ${hover ? theme.borderStrong : theme.border}`,
        borderRadius: theme.radiusLg, cursor: 'pointer',
        transition: 'all 140ms ease',
        transform: hover ? 'translateY(-1px)' : 'none',
      }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: theme.radius,
          background: theme.bgSubtle, border: `1px solid ${theme.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16,
        }}>{project.emoji}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: theme.text, letterSpacing: '-0.01em' }}>{project.name}</div>
          <div style={{ fontSize: 11, color: theme.textFaint }}>{project.updated}</div>
        </div>
      </div>
      <div style={{ fontSize: 12, color: theme.textDim, lineHeight: 1.4, marginBottom: 12 }}>
        {project.desc}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: `1px solid ${theme.border}` }}>
        <span style={{ fontSize: 11, color: theme.textFaint, fontFamily: 'Geist Mono' }}>{project.questCount} quests</span>
        <Icons.Arrow size={13} style={{ color: theme.textFaint }} />
      </div>
    </div>
  );
};

// ============ LOGIN =========================================================
var LoginScreen = ({ theme, variant, onLogin }) => {
  const [email, setEmail] = useState('axel@questify.dev');
  const [pw, setPw] = useState('••••••••');
  const [show, setShow] = useState(false);
  return (
    <div style={{
      minHeight: '100vh', background: theme.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        width: 380, padding: '36px 32px',
        background: theme.bgElev, border: `1px solid ${theme.border}`,
        borderRadius: theme.radiusLg, boxShadow: theme.shadowLift,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
          <div style={{
            width: 44, height: 44, borderRadius: theme.radiusLg,
            background: theme.accent, color: theme.accentFg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 14,
          }}>
            <LogoMark size={24} color={theme.accentFg} variant={variant} />
          </div>
          <h1 style={{
            margin: 0, fontSize: variant === 'arc' ? 26 : 22,
            fontWeight: variant === 'arc' ? 500 : 600,
            color: theme.text, letterSpacing: '-0.02em',
            fontFamily: variant === 'arc' ? 'Instrument Serif, serif' : 'Geist, sans-serif',
          }}>Questify</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: theme.textDim, textAlign: 'center' }}>
            Welcome back. Your path awaits.
          </p>
        </div>

        <Field label="Email" theme={theme}>
          <Input theme={theme} value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Password" theme={theme}>
          <div style={{ position: 'relative' }}>
            <Input theme={theme} type={show ? 'text' : 'password'} value={pw} onChange={(e) => setPw(e.target.value)} />
            <button onClick={() => setShow(!show)} style={{
              position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
              background: 'transparent', border: 'none', color: theme.textFaint,
              cursor: 'pointer', padding: 4, display: 'flex',
            }}>
              <Icons.Eye size={14} />
            </button>
          </div>
        </Field>

        <button onClick={onLogin} style={{
          width: '100%', padding: 10, marginTop: 6, marginBottom: 16,
          background: theme.accent, color: theme.accentFg,
          border: 'none', borderRadius: theme.radius,
          fontSize: 14, fontWeight: 500, cursor: 'pointer',
          fontFamily: 'inherit', letterSpacing: '-0.005em',
        }}>
          Continue journey →
        </button>

        <div style={{ textAlign: 'center', fontSize: 12, color: theme.textDim }}>
          New explorer? <a href="#" style={{ color: theme.accent, textDecoration: 'none', fontWeight: 500 }}>Start your journey</a>
        </div>
      </div>
    </div>
  );
};

// ============ QUEST MODAL ===================================================
var QuestModal = ({ open, onClose, theme, variant, quest, onSave }) => {
  const [title, setTitle] = useState(quest?.title || '');
  const [diff, setDiff] = useState(quest?.difficulty || 'Medium');
  const [region, setRegion] = useState(quest?.region || 'Work');
  const [rec, setRec] = useState(quest?.recurrence || 'One-time');
  const [due, setDue] = useState(quest?.due || '2026-04-19');
  const [desc, setDesc] = useState('');

  useEffect(() => {
    if (quest) {
      setTitle(quest.title);
      setDiff(quest.difficulty);
      setRegion(quest.region);
      setRec(quest.recurrence);
      setDue(quest.due);
    } else {
      setTitle(''); setDiff('Medium'); setRegion('Work'); setRec('One-time'); setDue('2026-04-19');
    }
  }, [quest, open]);

  const xp = Data.DIFFICULTIES[diff]?.xp || 80;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={quest ? 'Edit quest' : 'New quest'}
      subtitle={quest ? 'Update your quest details' : 'Add a new quest to your board'}
      theme={theme}
      variant={variant}
    >
      <Field label="Quest title" theme={theme}>
        <Input theme={theme} value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field label="Difficulty" theme={theme}>
          <div style={{ display: 'flex', gap: 4 }}>
            {Object.keys(Data.DIFFICULTIES).map(d => (
              <button key={d} onClick={() => setDiff(d)} style={{
                flex: 1, padding: '7px 4px', fontSize: 11, fontWeight: 500,
                background: diff === d ? `color-mix(in oklch, ${Data.DIFFICULTIES[d].tint} 14%, transparent)` : theme.bg,
                color: diff === d ? Data.DIFFICULTIES[d].tint : theme.textDim,
                border: `1px solid ${diff === d ? `color-mix(in oklch, ${Data.DIFFICULTIES[d].tint} 30%, transparent)` : theme.border}`,
                borderRadius: theme.radius - 2, cursor: 'pointer',
                fontFamily: 'inherit',
              }}>{d}</button>
            ))}
          </div>
        </Field>
        <Field label="Region" theme={theme}>
          <Select theme={theme} value={region} onChange={setRegion} options={['Work', 'Life', 'Sport', 'Learn']} />
        </Field>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field label="Recurrence" theme={theme}>
          <Select theme={theme} value={rec} onChange={setRec} options={['One-time', 'Daily', 'Weekly', 'Monthly']} />
        </Field>
        <Field label="Due date" theme={theme}>
          <Input theme={theme} type="date" value={due} onChange={(e) => setDue(e.target.value)} />
        </Field>
      </div>

      <Field label="Description" theme={theme}>
        <textarea
          value={desc} onChange={(e) => setDesc(e.target.value)}
          placeholder="Add notes or details..."
          style={{
            width: '100%', padding: '9px 12px', fontSize: 14,
            background: theme.bg, color: theme.text,
            border: `1px solid ${theme.border}`, borderRadius: theme.radius,
            outline: 'none', fontFamily: 'inherit', minHeight: 72, resize: 'vertical',
          }}
        />
      </Field>

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 14px', background: theme.accentSubtle,
        borderRadius: theme.radius, marginBottom: 16,
        border: `1px solid ${theme.accentBorder}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icons.Sparkle size={14} style={{ color: theme.accent }} />
          <span style={{ fontSize: 12, color: theme.text }}>
            Reward for completing this quest
          </span>
        </div>
        <span style={{
          fontFamily: 'Geist Mono', fontSize: 14, fontWeight: 500, color: theme.accent,
        }}>+{xp} XP</span>
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Button theme={theme} variant="ghost" onClick={onClose}>Cancel</Button>
        <Button theme={theme} onClick={() => { onSave({ ...quest, title, difficulty: diff, region, recurrence: rec, due, xp }); onClose(); }}>
          {quest ? 'Update quest' : 'Create quest'}
        </Button>
      </div>
    </Modal>
  );
};

Object.assign(window, {
  Sidebar, Topbar, InboxScreen, TodayScreen, UpcomingScreen, HabitsScreen,
  RegionsScreen, ProgressScreen, StatsScreen, HistoryScreen, ProjectsScreen,
  LoginScreen, QuestModal,
});
