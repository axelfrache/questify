// Primitives — themed by `variant` prop: 'linear' (A) or 'arc' (B)
var useState = React.useState;
var useEffect = React.useEffect;
var useRef = React.useRef;
var useMemo = React.useMemo;
var useCallback = React.useCallback;
var Icons = window.Icons;
var Data = window.Data;

// ============ THEME TOKENS ==================================================
var THEMES = {
  linear: {
    light: {
      bg: '#fafaf9',
      bgElev: '#ffffff',
      bgSubtle: '#f4f4f5',
      border: '#e7e5e4',
      borderStrong: '#d6d3d1',
      text: '#18181b',
      textDim: '#52525b',
      textFaint: '#a1a1aa',
      accent: 'oklch(0.56 0.18 275)',
      accentFg: '#ffffff',
      accentSubtle: 'oklch(0.96 0.02 275)',
      accentBorder: 'oklch(0.88 0.06 275)',
      sidebar: '#f4f4f5',
      sidebarItem: '#ecebe9',
      shadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)',
      shadowLift: '0 4px 16px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
      radius: 8,
      radiusLg: 12,
    },
    dark: {
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
      sidebar: '#0f0f0f',
      sidebarItem: '#1f1f1f',
      shadow: '0 1px 2px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)',
      shadowLift: '0 4px 16px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06)',
      radius: 8,
      radiusLg: 12,
    },
  },
  arc: {
    light: {
      bg: '#f5f1ec',
      bgElev: '#fbf8f4',
      bgSubtle: '#ede7df',
      border: '#e2d9cd',
      borderStrong: '#cfc3b2',
      text: '#1c1917',
      textDim: '#57534e',
      textFaint: '#a8a29e',
      accent: 'oklch(0.58 0.14 25)',
      accentFg: '#ffffff',
      accentSubtle: 'oklch(0.94 0.04 25)',
      accentBorder: 'oklch(0.85 0.08 25)',
      sidebar: '#ede7df',
      sidebarItem: '#e2d9cd',
      shadow: '0 1px 2px rgba(76,60,40,0.06), 0 0 0 1px rgba(76,60,40,0.04)',
      shadowLift: '0 8px 24px rgba(76,60,40,0.10), 0 0 0 1px rgba(76,60,40,0.04)',
      radius: 12,
      radiusLg: 18,
    },
    dark: {
      bg: '#14110e',
      bgElev: '#1e1a16',
      bgSubtle: '#28231d',
      border: '#332c24',
      borderStrong: '#44392e',
      text: '#f5f1ec',
      textDim: '#b0a797',
      textFaint: '#7a7262',
      accent: 'oklch(0.72 0.14 30)',
      accentFg: '#14110e',
      accentSubtle: 'oklch(0.24 0.06 30)',
      accentBorder: 'oklch(0.38 0.09 30)',
      sidebar: '#1a1612',
      sidebarItem: '#28231d',
      shadow: '0 1px 2px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
      shadowLift: '0 8px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)',
      radius: 12,
      radiusLg: 18,
    },
  },
};

var useTheme = (variant, mode) => THEMES[variant][mode];
window.useTheme = useTheme;

// ============ LOGO MARK ====================================================
// Abstract — Q as a cut chevron
var LogoMark = ({ size = 24, color = 'currentColor', variant = 'linear' }) => {
  if (variant === 'arc') {
    // Rounded warmer variant
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="1.5" y="1.5" width="21" height="21" rx="7" stroke={color} strokeWidth="1.5" fill="none"/>
        <path d="M7 12 L11 8 L11 16 L15 12" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <circle cx="17" cy="17" r="1.5" fill={color}/>
      </svg>
    );
  }
  // Linear — sharper, geometric
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="2" width="20" height="20" rx="4" stroke={color} strokeWidth="1.5" fill="none"/>
      <path d="M7 12 L11 8 L11 16 L15 12" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <rect x="15.5" y="15.5" width="2.5" height="2.5" fill={color}/>
    </svg>
  );
};

// ============ BUTTON ========================================================
var Button = ({ children, variant = 'primary', size = 'md', icon: Icon, theme, onClick, style, ...rest }) => {
  const [hover, setHover] = useState(false);
  const [press, setPress] = useState(false);
  const sizes = {
    sm: { pad: '6px 10px', fs: 13, gap: 6, iconSize: 14 },
    md: { pad: '8px 14px', fs: 14, gap: 8, iconSize: 15 },
    lg: { pad: '10px 18px', fs: 15, gap: 10, iconSize: 16 },
  }[size];
  const vars = {
    primary: {
      bg: theme.accent, color: theme.accentFg, border: 'transparent',
      hover: { filter: 'brightness(1.08)' },
    },
    secondary: {
      bg: theme.bgElev, color: theme.text, border: theme.border,
      hover: { background: theme.bgSubtle },
    },
    ghost: {
      bg: 'transparent', color: theme.textDim, border: 'transparent',
      hover: { background: theme.bgSubtle, color: theme.text },
    },
    subtle: {
      bg: theme.bgSubtle, color: theme.text, border: 'transparent',
      hover: { background: theme.border },
    },
  }[variant];

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setPress(false); }}
      onMouseDown={() => setPress(true)}
      onMouseUp={() => setPress(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        gap: sizes.gap, padding: sizes.pad, fontSize: sizes.fs, fontWeight: 500,
        background: vars.bg, color: vars.color,
        border: `1px solid ${vars.border}`, borderRadius: theme.radius,
        cursor: 'pointer', transition: 'all 120ms ease',
        transform: press ? 'scale(0.98)' : 'scale(1)',
        letterSpacing: '-0.005em',
        ...(hover ? vars.hover : {}),
        ...style,
      }}
      {...rest}
    >
      {Icon && <Icon size={sizes.iconSize} />}
      {children}
    </button>
  );
};

// ============ XP BADGE ======================================================
var XPBadge = ({ xp, theme, size = 'md' }) => {
  const sz = size === 'sm' ? { fs: 11, pad: '2px 6px' } : { fs: 12, pad: '3px 8px' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontFamily: 'Geist Mono, monospace', fontSize: sz.fs, fontWeight: 500,
      padding: sz.pad, borderRadius: 999,
      background: theme.accentSubtle, color: theme.accent,
      border: `1px solid ${theme.accentBorder}`,
      letterSpacing: '-0.01em',
    }}>
      +{xp}<span style={{ fontSize: 9, opacity: 0.7 }}>XP</span>
    </span>
  );
};

// ============ DIFFICULTY PILL ===============================================
var DiffPill = ({ level, theme }) => {
  const tint = Data.DIFFICULTIES[level]?.tint || theme.accent;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 11, fontWeight: 500,
      padding: '2px 7px', borderRadius: 4,
      background: `color-mix(in oklch, ${tint} 14%, transparent)`,
      color: tint,
      border: `1px solid color-mix(in oklch, ${tint} 22%, transparent)`,
      letterSpacing: '-0.01em',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: 1, background: tint }} />
      {level}
    </span>
  );
};

// ============ CHECKBOX — animated completion ================================
var QuestCheckbox = ({ checked, onChange, theme, size = 20 }) => {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onChange(!checked); }}
      style={{
        width: size, height: size, flexShrink: 0,
        borderRadius: theme.radius >= 12 ? 8 : 5,
        border: `1.5px solid ${checked ? theme.accent : theme.borderStrong}`,
        background: checked ? theme.accent : 'transparent',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', padding: 0,
        transition: 'all 180ms cubic-bezier(.2,.8,.2,1)',
        transform: checked ? 'scale(1.05)' : 'scale(1)',
      }}
    >
      {checked && (
        <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none"
             stroke={theme.accentFg} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
             style={{ animation: 'checkPop 240ms cubic-bezier(.2,.8,.2,1)' }}>
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </button>
  );
};

// ============ QUEST ROW =====================================================
var QuestRow = ({ quest, theme, variant, onComplete, onEdit, dimmed, showDate }) => {
  const [hover, setHover] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(quest.status === 'done');

  const handleComplete = (val) => {
    if (val && !completed) {
      setCompleting(true);
      setTimeout(() => {
        setCompleted(true);
        setCompleting(false);
        onComplete && onComplete(quest);
      }, 600);
    } else {
      setCompleted(val);
    }
  };

  const dateLabel = useMemo(() => {
    if (!showDate) return null;
    const d = new Date(quest.due);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }, [quest.due, showDate]);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => onEdit && onEdit(quest)}
      style={{
        position: 'relative',
        display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center',
        gap: 12, padding: variant === 'arc' ? '14px 16px' : '11px 14px',
        background: hover ? theme.bgSubtle : theme.bgElev,
        border: `1px solid ${hover ? theme.borderStrong : theme.border}`,
        borderRadius: theme.radius,
        cursor: 'pointer',
        opacity: (dimmed || completed) ? 0.5 : 1,
        transition: 'all 140ms ease, opacity 400ms ease',
        transform: completing ? 'translateX(8px)' : 'translateX(0)',
      }}
    >
      <QuestCheckbox checked={completed} onChange={handleComplete} theme={theme} size={18} />
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontSize: 14, fontWeight: 500, color: theme.text,
          textDecoration: completed ? 'line-through' : 'none',
          letterSpacing: '-0.01em',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {quest.title}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center', flexWrap: 'wrap' }}>
          {quest.difficulty && <DiffPill level={quest.difficulty} theme={theme} />}
          {quest.recurrence && quest.recurrence !== 'One-time' && (
            <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center', fontSize: 11, color: theme.textFaint }}>
              <Icons.Repeat size={11} /> {quest.recurrence}
            </span>
          )}
          {quest.region && (
            <span style={{ fontSize: 11, color: theme.textFaint }}>
              · {quest.region}
            </span>
          )}
          {dateLabel && (
            <span style={{ fontSize: 11, color: theme.textFaint, fontFamily: 'Geist Mono' }}>
              {dateLabel}
            </span>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <XPBadge xp={quest.xp} theme={theme} size="sm" />
      </div>
      {completing && (
        <div style={{
          position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
          pointerEvents: 'none',
          fontFamily: 'Geist Mono', fontSize: 13, fontWeight: 600,
          color: theme.accent,
          animation: 'xpFloat 900ms ease-out forwards',
        }}>
          +{quest.xp} XP
        </div>
      )}
    </div>
  );
};

// ============ MODAL =========================================================
var Modal = ({ open, onClose, title, subtitle, children, theme, variant }) => {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.35)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'fadeIn 180ms ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 440, maxWidth: 'calc(100vw - 32px)',
          background: theme.bgElev,
          border: `1px solid ${theme.border}`,
          borderRadius: theme.radiusLg,
          boxShadow: theme.shadowLift,
          animation: 'modalIn 220ms cubic-bezier(.2,.8,.2,1)',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: theme.text, letterSpacing: '-0.015em' }}>{title}</div>
            {subtitle && <div style={{ fontSize: 13, color: theme.textDim, marginTop: 2 }}>{subtitle}</div>}
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: theme.textDim, cursor: 'pointer', padding: 4 }}>
            <Icons.X size={16} />
          </button>
        </div>
        <div style={{ padding: '20px 24px' }}>{children}</div>
      </div>
    </div>
  );
};

// ============ FIELD =========================================================
var Field = ({ label, children, theme }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ fontSize: 12, fontWeight: 500, color: theme.textDim, marginBottom: 6, letterSpacing: '-0.005em' }}>{label}</div>
    {children}
  </div>
);

var Input = ({ theme, ...rest }) => (
  <input {...rest} style={{
    width: '100%', padding: '9px 12px', fontSize: 14,
    background: theme.bg, color: theme.text,
    border: `1px solid ${theme.border}`, borderRadius: theme.radius,
    outline: 'none', transition: 'border-color 120ms',
    fontFamily: 'inherit',
  }}
    onFocus={(e) => e.target.style.borderColor = theme.accent}
    onBlur={(e) => e.target.style.borderColor = theme.border}
  />
);

var Select = ({ theme, options, value, onChange }) => (
  <select value={value} onChange={(e) => onChange(e.target.value)} style={{
    width: '100%', padding: '9px 12px', fontSize: 14,
    background: theme.bg, color: theme.text,
    border: `1px solid ${theme.border}`, borderRadius: theme.radius,
    outline: 'none', appearance: 'none',
    fontFamily: 'inherit',
    backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', paddingRight: 32,
  }}>
    {options.map(o => <option key={o} value={o}>{o}</option>)}
  </select>
);

// ============ PROGRESS BAR ==================================================
var Progress = ({ value, max = 100, theme, thick }) => (
  <div style={{
    width: '100%', height: thick ? 8 : 5,
    background: theme.bgSubtle, borderRadius: 999, overflow: 'hidden',
  }}>
    <div style={{
      width: `${Math.min(100, (value / max) * 100)}%`,
      height: '100%', background: theme.accent,
      borderRadius: 999,
      transition: 'width 500ms cubic-bezier(.2,.8,.2,1)',
    }} />
  </div>
);

// ============ EMPTY STATE ===================================================
var Empty = ({ icon: Icon, title, subtitle, theme, children }) => (
  <div style={{
    padding: '48px 24px', textAlign: 'center',
    border: `1px dashed ${theme.border}`, borderRadius: theme.radiusLg,
    background: theme.bgElev,
  }}>
    {Icon && (
      <div style={{ display: 'inline-flex', marginBottom: 12, color: theme.textFaint }}>
        <Icon size={28} sw={1.2} />
      </div>
    )}
    <div style={{ fontSize: 15, fontWeight: 500, color: theme.text, letterSpacing: '-0.01em' }}>{title}</div>
    {subtitle && <div style={{ fontSize: 13, color: theme.textDim, marginTop: 4 }}>{subtitle}</div>}
    {children && <div style={{ marginTop: 16 }}>{children}</div>}
  </div>
);

// ============ GLOBAL CSS INJECTION ==========================================
var GlobalCSS = () => (
  <style>{`
    @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
    @keyframes modalIn {
      from { opacity: 0; transform: translateY(8px) scale(0.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes xpFloat {
      0% { opacity: 0; transform: translateY(0); }
      20% { opacity: 1; }
      100% { opacity: 0; transform: translateY(-24px); }
    }
    @keyframes checkPop {
      0% { transform: scale(0); }
      60% { transform: scale(1.3); }
      100% { transform: scale(1); }
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    @keyframes levelRing {
      from { stroke-dashoffset: 283; }
    }
    ::-webkit-scrollbar { width: 10px; height: 10px; }
    ::-webkit-scrollbar-thumb { background: rgba(128,128,128,0.2); border-radius: 999px; border: 2px solid transparent; background-clip: padding-box; }
    ::-webkit-scrollbar-thumb:hover { background: rgba(128,128,128,0.35); border: 2px solid transparent; background-clip: padding-box; }
  `}</style>
);

Object.assign(window, {
  Button, XPBadge, DiffPill, QuestCheckbox, QuestRow, Modal, Field, Input, Select, Progress, Empty, GlobalCSS, LogoMark,
});
