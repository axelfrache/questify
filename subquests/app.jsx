// Main app — renders both directions on a design canvas with screen switcher
var useState = React.useState;
var useEffect = React.useEffect;
var useRef = React.useRef;
var useMemo = React.useMemo;
var useCallback = React.useCallback;
var Icons = window.Icons;
var Data = window.Data;
var useTheme = window.useTheme;

var SCREENS = [
  { id: 'login', label: 'Login' },
  { id: 'inbox', label: 'Inbox' },
  { id: 'today', label: 'Today' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'habits', label: 'Habits' },
  { id: 'regions', label: 'Regions' },
  { id: 'progress', label: 'Progress' },
  { id: 'stats', label: 'Stats' },
  { id: 'history', label: 'History' },
  { id: 'projects', label: 'Projects' },
  { id: 'project-detail', label: 'Project detail' },
  { id: 'modal', label: 'Edit modal' },
];

// ============ APP (one full product instance) ==============================
var App = ({ variant, mode, density, screenOverride }) => {
  const theme = useTheme(variant, mode);
  const [active, setActive] = useState('inbox');
  const [activeProject, setActiveProject] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingQuest, setEditingQuest] = useState(null);
  const [quests, setQuests] = useState(Data.SEED_QUESTS);
  const [xp, setXp] = useState(150);
  const [showXpBurst, setShowXpBurst] = useState(null);

  // screenOverride is used by the canvas to force a specific screen
  useEffect(() => {
    if (screenOverride === 'project-detail') { setActive('projects'); setActiveProject('p1'); return; }
    if (screenOverride === 'modal') { setActive('inbox'); setEditingQuest(quests[0]); setModalOpen(true); return; }
    if (screenOverride === 'login') return; // handled at render
    if (screenOverride) { setActive(screenOverride); setActiveProject(null); setModalOpen(false); }
  }, [screenOverride]);

  const handleComplete = (quest) => {
    setQuests(qs => qs.map(q => q.id === quest.id ? { ...q, status: 'done' } : q));
    setXp(x => x + quest.xp);
    setShowXpBurst({ amount: quest.xp, key: Date.now() });
    setTimeout(() => setShowXpBurst(null), 1200);
  };

  const handleEdit = (quest) => { setEditingQuest(quest); setModalOpen(true); };
  const handleNewQuest = () => { setEditingQuest(null); setModalOpen(true); };
  const handleSaveQuest = (q) => {
    if (q.id) setQuests(qs => qs.map(x => x.id === q.id ? q : x));
    else setQuests(qs => [...qs, { ...q, id: 'new-' + Date.now(), status: 'open' }]);
  };

  const handleNav = (id) => { setActive(id); setActiveProject(null); };

  if (screenOverride === 'login') {
    return <window.LoginScreen theme={theme} variant={variant} onLogin={() => {}} />;
  }

  const renderMain = () => {
    if (activeProject) {
      const project = Data.SEED_PROJECTS.find(p => p.id === activeProject);
      const projectQuests = quests.filter(q => q.project === activeProject);
      return <ProjectDetail theme={theme} variant={variant} project={project}
        quests={projectQuests} onBack={() => setActiveProject(null)}
        onQuestComplete={handleComplete} onQuestEdit={handleEdit} onNewQuest={handleNewQuest} />;
    }
    switch (active) {
      case 'inbox': return <window.InboxScreen theme={theme} variant={variant} quests={quests}
        onQuestComplete={handleComplete} onQuestEdit={handleEdit} onNewQuest={handleNewQuest} />;
      case 'today': return <window.TodayScreen theme={theme} variant={variant} quests={quests}
        onQuestComplete={handleComplete} onQuestEdit={handleEdit} xp={xp} />;
      case 'upcoming': return <window.UpcomingScreen theme={theme} variant={variant} quests={quests}
        onQuestComplete={handleComplete} onQuestEdit={handleEdit} />;
      case 'habits': return <window.HabitsScreen theme={theme} variant={variant} habits={Data.SEED_HABITS}
        onQuestComplete={handleComplete} onQuestEdit={handleEdit} onNewQuest={handleNewQuest} />;
      case 'regions': return <window.RegionsScreen theme={theme} variant={variant} regions={Data.SEED_REGIONS} />;
      case 'progress': return <window.ProgressScreen theme={theme} variant={variant} />;
      case 'stats': return <window.StatsScreen theme={theme} variant={variant} />;
      case 'history': return <window.HistoryScreen theme={theme} variant={variant} completed={Data.SEED_COMPLETED} />;
      case 'projects': return <window.ProjectsScreen theme={theme} variant={variant} projects={Data.SEED_PROJECTS}
        onOpenProject={(id) => setActiveProject(id)} />;
      default: return null;
    }
  };

  const pageTitle = useMemo(() => {
    if (activeProject) return Data.SEED_PROJECTS.find(p => p.id === activeProject)?.name;
    return SCREENS.find(s => s.id === active)?.label;
  }, [active, activeProject]);

  return (
    <div style={{
      display: 'flex', height: '100%', width: '100%',
      background: theme.bg, color: theme.text,
      fontFamily: 'Geist, sans-serif',
      overflow: 'hidden',
    }}>
      <window.Sidebar theme={theme} variant={variant} active={active}
        onNav={handleNav}
        projects={Data.SEED_PROJECTS}
        activeProject={activeProject}
        onProject={(id) => setActiveProject(id)}
        collapsed={collapsed} />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
        <window.Topbar theme={theme}
          title={pageTitle}
          subtitle={activeProject ? 'Project' : null}
          onToggleSidebar={() => setCollapsed(!collapsed)}
          xp={xp} level={2} />

        <div style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
          {renderMain()}
        </div>

        {/* Floating add button */}
        <button onClick={handleNewQuest} style={{
          position: 'absolute', bottom: 20, right: 20,
          width: 44, height: 44, borderRadius: '50%',
          background: theme.accent, color: theme.accentFg,
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: theme.shadowLift,
          transition: 'transform 140ms ease',
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.06)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
          <Icons.Plus size={18} sw={2} />
        </button>

        {/* XP burst */}
        {showXpBurst && (
          <div key={showXpBurst.key} style={{
            position: 'absolute', bottom: 80, right: 20,
            pointerEvents: 'none',
            padding: '8px 14px',
            background: theme.accent, color: theme.accentFg,
            borderRadius: 999,
            fontFamily: 'Geist Mono', fontSize: 13, fontWeight: 600,
            boxShadow: theme.shadowLift,
            animation: 'xpBurst 1200ms cubic-bezier(.2,.8,.2,1) forwards',
          }}>
            +{showXpBurst.amount} XP
          </div>
        )}
      </main>

      <window.QuestModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        theme={theme} variant={variant}
        quest={editingQuest}
        onSave={handleSaveQuest}
      />
    </div>
  );
};

// ============ PROJECT DETAIL ===============================================
var ProjectDetail = ({ theme, variant, project, quests, onBack, onQuestComplete, onQuestEdit, onNewQuest }) => (
  <div style={{ padding: '24px 28px', maxWidth: 920, margin: '0 auto' }}>
    <button onClick={onBack} style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: 'transparent', border: 'none', color: theme.textDim,
      fontSize: 12, cursor: 'pointer', padding: 0, marginBottom: 14,
      fontFamily: 'inherit',
    }}>
      <Icons.ChevronLeft size={13} /> Back to projects
    </button>

    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 48, height: 48, borderRadius: theme.radiusLg,
          background: theme.bgSubtle, border: `1px solid ${theme.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22,
        }}>{project.emoji}</div>
        <div>
          <h1 style={{
            margin: 0, fontSize: variant === 'arc' ? 28 : 24,
            fontWeight: variant === 'arc' ? 500 : 600, color: theme.text, letterSpacing: '-0.02em',
            fontFamily: variant === 'arc' ? 'Instrument Serif, serif' : 'Geist, sans-serif',
          }}>{project.name}</h1>
          <div style={{ fontSize: 13, color: theme.textDim, marginTop: 2 }}>{project.desc}</div>
        </div>
      </div>
      <window.Button theme={theme} icon={Icons.Plus} onClick={onNewQuest}>Add quest</window.Button>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
      {[
        { label: 'Total quests', value: project.questCount },
        { label: 'Completed', value: Math.floor(project.questCount * 0.4) },
        { label: 'XP earned', value: '+480' },
      ].map(s => (
        <div key={s.label} style={{
          padding: 14, background: theme.bgElev,
          border: `1px solid ${theme.border}`, borderRadius: theme.radius,
        }}>
          <div style={{ fontSize: 11, color: theme.textFaint, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
          <div style={{ fontFamily: 'Geist Mono', fontSize: 22, fontWeight: 500, color: theme.text, marginTop: 4, letterSpacing: '-0.02em' }}>{s.value}</div>
        </div>
      ))}
    </div>

    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
      <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: theme.text, letterSpacing: '-0.01em' }}>Quests</h2>
      <span style={{ fontSize: 11, color: theme.textFaint, fontFamily: 'Geist Mono' }}>{quests.length} items</span>
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {quests.length === 0 ? (
        <window.Empty icon={Icons.Folder} title="No quests in this project yet"
          subtitle="Add quests to track progress on this initiative" theme={theme}>
          <window.Button theme={theme} icon={Icons.Plus} onClick={onNewQuest}>Add quest</window.Button>
        </window.Empty>
      ) : quests.map(q => (
        <window.QuestRow key={q.id} quest={q} theme={theme} variant={variant}
          onComplete={onQuestComplete} onEdit={onQuestEdit} />
      ))}
    </div>
  </div>
);

// ============ ROOT — design canvas with two variants ========================
var Root = () => {
  const [mode, setMode] = useState(() => localStorage.getItem('questify-mode') || 'light');
  const [screen, setScreen] = useState(() => localStorage.getItem('questify-screen') || 'inbox');
  const [view, setView] = useState(() => localStorage.getItem('questify-view') || 'linear'); // linear | arc | split
  const [tweaksOpen, setTweaksOpen] = useState(false);

  useEffect(() => { localStorage.setItem('questify-mode', mode); }, [mode]);
  useEffect(() => { localStorage.setItem('questify-screen', screen); }, [screen]);
  useEffect(() => { localStorage.setItem('questify-view', view); }, [view]);

  // Chrome theme for the canvas itself
  const chrome = mode === 'dark'
    ? { bg: '#09090b', bgElev: '#141414', border: '#262626', text: '#fafafa', textDim: '#a1a1aa', textFaint: '#71717a' }
    : { bg: '#f5f5f4', bgElev: '#ffffff', border: '#e7e5e4', text: '#18181b', textDim: '#52525b', textFaint: '#a1a1aa' };

  // Hook up host edit-mode toggle for Tweaks
  useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === '__activate_edit_mode') setTweaksOpen(true);
      if (e.data?.type === '__deactivate_edit_mode') setTweaksOpen(false);
    };
    window.addEventListener('message', handler);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', handler);
  }, []);

  const renderApp = (variant) => (
    <div style={{
      height: '100%', width: '100%',
      border: `1px solid ${chrome.border}`,
      borderRadius: 14, overflow: 'hidden',
      boxShadow: mode === 'dark'
        ? '0 12px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)'
        : '0 12px 32px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)',
      background: variant === 'linear' ? APP_THEMES.linear[mode].bg : APP_THEMES.arc[mode].bg,
      display: 'flex', flexDirection: 'column',
    }}>
      <FakeBrowserChrome chrome={chrome} variant={variant} mode={mode} />
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <App variant={variant} mode={mode} screenOverride={screen} />
      </div>
    </div>
  );

  return (
    <React.Fragment>
      <window.GlobalCSS />
      <style>{`
        @keyframes xpBurst {
          0% { opacity: 0; transform: translateY(0) scale(0.8); }
          15% { opacity: 1; transform: translateY(-4px) scale(1.05); }
          85% { opacity: 1; transform: translateY(-14px) scale(1); }
          100% { opacity: 0; transform: translateY(-40px) scale(0.9); }
        }
      `}</style>
      <div style={{
        minHeight: '100vh', background: chrome.bg, color: chrome.text,
        display: 'flex', flexDirection: 'column',
        fontFamily: 'Geist, sans-serif',
      }}>
        <CanvasHeader chrome={chrome} mode={mode} setMode={setMode}
          screen={screen} setScreen={setScreen} view={view} setView={setView} />

        <div style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: view === 'split' ? '1fr 1fr' : '1fr',
          gap: 20, padding: 20, paddingTop: 10,
          minHeight: 780,
        }}>
          {(view === 'split' || view === 'linear') && (
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: 760 }}>
              <DirectionLabel chrome={chrome} letter="A" name="Linear Clarity"
                desc="Ultra-sobre · geometric · cool indigo" />
              <div style={{ flex: 1, minHeight: 720 }}>{renderApp('linear')}</div>
            </div>
          )}
          {(view === 'split' || view === 'arc') && (
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: 760 }}>
              <DirectionLabel chrome={chrome} letter="B" name="Arc Warmth"
                desc="Warm · serif display · amber accent" />
              <div style={{ flex: 1, minHeight: 720 }}>{renderApp('arc')}</div>
            </div>
          )}
        </div>

        <div style={{
          padding: '14px 24px', borderTop: `1px solid ${chrome.border}`,
          display: 'flex', gap: 20, alignItems: 'center', justifyContent: 'space-between',
          fontSize: 11, color: chrome.textFaint, fontFamily: 'Geist Mono',
        }}>
          <span>Questify · Redesign proposal · Apr 2026</span>
          <span>Click any quest to edit · Check a quest to earn XP · Toggle Tweaks in the toolbar</span>
        </div>

        {tweaksOpen && <TweaksPanel chrome={chrome}
          mode={mode} setMode={setMode}
          screen={screen} setScreen={setScreen}
          view={view} setView={setView}
          onClose={() => setTweaksOpen(false)} />}
      </div>
    </React.Fragment>
  );
};

// ============ CANVAS HEADER ================================================
var CanvasHeader = ({ chrome, mode, setMode, screen, setScreen, view, setView }) => (
  <div style={{
    padding: '16px 24px', borderBottom: `1px solid ${chrome.border}`,
    display: 'flex', alignItems: 'center', gap: 20,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <window.LogoMark size={22} color={chrome.text} variant="linear" />
      <div>
        <div style={{ fontSize: 14, fontWeight: 500, color: chrome.text, letterSpacing: '-0.01em' }}>Questify</div>
        <div style={{ fontSize: 10, color: chrome.textFaint, fontFamily: 'Geist Mono', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Redesign · 2 directions</div>
      </div>
    </div>

    <div style={{ flex: 1 }} />

    {/* Screen picker */}
    <div style={{
      display: 'flex', gap: 2, padding: 3, background: chrome.bgElev,
      border: `1px solid ${chrome.border}`, borderRadius: 8,
    }}>
      {SCREENS.map(s => (
        <button key={s.id} onClick={() => setScreen(s.id)} style={{
          padding: '5px 10px', fontSize: 12, fontWeight: 500,
          background: screen === s.id ? chrome.text : 'transparent',
          color: screen === s.id ? chrome.bgElev : chrome.textDim,
          border: 'none', borderRadius: 6, cursor: 'pointer',
          fontFamily: 'inherit', letterSpacing: '-0.005em',
          whiteSpace: 'nowrap',
        }}>{s.label}</button>
      ))}
    </div>

    {/* View toggle */}
    <div style={{
      display: 'flex', gap: 2, padding: 3, background: chrome.bgElev,
      border: `1px solid ${chrome.border}`, borderRadius: 8,
    }}>
      {[
        { id: 'linear', label: 'A · Linear' },
        { id: 'arc', label: 'B · Arc' },
        { id: 'split', label: 'Compare' },
      ].map(v => (
        <button key={v.id} onClick={() => setView(v.id)} style={{
          padding: '5px 10px', fontSize: 12, fontWeight: 500,
          background: view === v.id ? chrome.text : 'transparent',
          color: view === v.id ? chrome.bgElev : chrome.textDim,
          border: 'none', borderRadius: 6, cursor: 'pointer',
          fontFamily: 'inherit',
        }}>{v.label}</button>
      ))}
    </div>

    {/* Mode toggle */}
    <button onClick={() => setMode(mode === 'light' ? 'dark' : 'light')} style={{
      padding: 8, background: chrome.bgElev, border: `1px solid ${chrome.border}`,
      borderRadius: 8, cursor: 'pointer', color: chrome.text, display: 'flex',
    }}>
      {mode === 'light' ? <Icons.Moon size={14} /> : <Icons.Sun size={14} />}
    </button>
  </div>
);

// ============ FAKE CHROME ==================================================
var FakeBrowserChrome = ({ chrome, variant, mode }) => (
  <div style={{
    padding: '10px 14px',
    background: mode === 'dark' ? '#0f0f0f' : '#f5f5f4',
    borderBottom: `1px solid ${chrome.border}`,
    display: 'flex', alignItems: 'center', gap: 10,
  }}>
    <div style={{ display: 'flex', gap: 5 }}>
      {['#ef4444', '#eab308', '#22c55e'].map(c => (
        <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c, opacity: 0.7 }} />
      ))}
    </div>
    <div style={{
      flex: 1, padding: '3px 10px', textAlign: 'center',
      background: mode === 'dark' ? '#1c1c1c' : '#fff',
      border: `1px solid ${chrome.border}`, borderRadius: 5,
      fontSize: 11, color: chrome.textFaint, fontFamily: 'Geist Mono',
    }}>
      questify.app/{variant === 'arc' ? 'dashboard' : 'inbox'}
    </div>
    <div style={{ width: 40 }} />
  </div>
);

var DirectionLabel = ({ chrome, letter, name, desc }) => (
  <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
    <div style={{
      width: 26, height: 26, borderRadius: 6,
      background: chrome.text, color: chrome.bgElev,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 13, fontWeight: 600, fontFamily: 'Geist Mono',
    }}>{letter}</div>
    <div>
      <div style={{ fontSize: 14, fontWeight: 500, color: chrome.text, letterSpacing: '-0.01em' }}>{name}</div>
      <div style={{ fontSize: 11, color: chrome.textFaint }}>{desc}</div>
    </div>
  </div>
);

// ============ TWEAKS PANEL =================================================
var TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "mode": "light",
  "view": "linear",
  "screen": "inbox"
}/*EDITMODE-END*/;

var TweaksPanel = ({ chrome, mode, setMode, screen, setScreen, view, setView, onClose }) => {
  const persist = (key, val) => {
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { [key]: val } }, '*');
  };
  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20, width: 280,
      background: chrome.bgElev, border: `1px solid ${chrome.border}`,
      borderRadius: 12, padding: 16, zIndex: 1000,
      boxShadow: '0 20px 48px rgba(0,0,0,0.25)',
      fontFamily: 'Geist, sans-serif',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: chrome.text, letterSpacing: '-0.01em' }}>Tweaks</div>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: chrome.textDim, cursor: 'pointer', padding: 2, display: 'flex' }}>
          <Icons.X size={14} />
        </button>
      </div>

      <TweakRow chrome={chrome} label="Theme">
        <SegmentedControl chrome={chrome} options={[{ id: 'light', label: 'Light' }, { id: 'dark', label: 'Dark' }]}
          value={mode} onChange={(v) => { setMode(v); persist('mode', v); }} />
      </TweakRow>
      <TweakRow chrome={chrome} label="View">
        <SegmentedControl chrome={chrome} options={[{ id: 'linear', label: 'A' }, { id: 'arc', label: 'B' }, { id: 'split', label: 'Compare' }]}
          value={view} onChange={(v) => { setView(v); persist('view', v); }} />
      </TweakRow>
      <TweakRow chrome={chrome} label="Screen">
        <select value={screen} onChange={(e) => { setScreen(e.target.value); persist('screen', e.target.value); }}
          style={{
            width: '100%', padding: '6px 8px', fontSize: 12,
            background: chrome.bg, color: chrome.text,
            border: `1px solid ${chrome.border}`, borderRadius: 6,
            outline: 'none', fontFamily: 'inherit',
          }}>
          {SCREENS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </TweakRow>
    </div>
  );
};

var TweakRow = ({ chrome, label, children }) => (
  <div style={{ marginBottom: 10 }}>
    <div style={{ fontSize: 11, color: chrome.textDim, marginBottom: 5 }}>{label}</div>
    {children}
  </div>
);

var SegmentedControl = ({ chrome, options, value, onChange }) => (
  <div style={{
    display: 'flex', gap: 2, padding: 2,
    background: chrome.bg, border: `1px solid ${chrome.border}`, borderRadius: 6,
  }}>
    {options.map(o => (
      <button key={o.id} onClick={() => onChange(o.id)} style={{
        flex: 1, padding: '5px 8px', fontSize: 11, fontWeight: 500,
        background: value === o.id ? chrome.text : 'transparent',
        color: value === o.id ? chrome.bgElev : chrome.textDim,
        border: 'none', borderRadius: 4, cursor: 'pointer',
        fontFamily: 'inherit',
      }}>{o.label}</button>
    ))}
  </div>
);

// Reference THEMES from primitives via window
var APP_THEMES = {
  linear: { light: { bg: '#fafaf9' }, dark: { bg: '#0a0a0a' } },
  arc: { light: { bg: '#f5f1ec' }, dark: { bg: '#14110e' } },
};

ReactDOM.createRoot(document.getElementById('root')).render(<Root />);
