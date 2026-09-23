// Back-button variants — each renders a slice of the project header so the
// button can be evaluated in context. Static, no interactivity beyond hover.

var useState = React.useState;

// ---------- shared bits ----------------------------------------------------
var Chevron = ({ size = 12, sw = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
var ChevronRight = ({ size = 12, sw = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <polyline points="9 18 15 12 9 6" />
  </svg>
);
var ChevronDown = ({ size = 12, sw = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
var ArrowLeft = ({ size = 14, sw = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);
var Sidebar = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <line x1="9" y1="3" x2="9" y2="21"/>
  </svg>
);
var Bell = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);
var Zap = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10" />
  </svg>
);
var PlusIcon = ({ size = 14, sw = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
var GridIcon = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/>
    <rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/>
  </svg>
);

// ---------- topbar (reused) ------------------------------------------------
var Topbar = ({ children, hideLabel }) => (
  <div style={{
    display: 'flex', alignItems: 'center', padding: '10px 20px',
    background: 'var(--bg-elev)', borderBottom: '1px solid var(--border)',
    gap: 14, height: 48,
  }}>
    <button style={{
      background: 'transparent', border: 'none', color: 'var(--text-dim)',
      cursor: 'pointer', padding: 6, borderRadius: 4, display: 'flex',
    }}><Sidebar size={15} /></button>
    {!hideLabel && <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>Project</span>}
    {children}
    <div style={{ flex: 1 }} />
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: '4px 10px', background: 'var(--bg-subtle)',
      borderRadius: 999, border: '1px solid var(--border)',
    }}>
      <span style={{ color: 'var(--accent)', display: 'flex' }}><Zap /></span>
      <span style={{ fontFamily: 'Geist Mono', fontSize: 12, fontWeight: 500 }}>1 600 XP</span>
      <span style={{ width: 1, height: 10, background: 'var(--border)' }} />
      <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Lvl 6</span>
    </div>
    <button style={{
      background: 'transparent', border: 'none', color: 'var(--text-dim)',
      cursor: 'pointer', padding: 6, borderRadius: 4, display: 'flex',
    }}><Bell /></button>
  </div>
);

// ---------- title block (used by most variants) ----------------------------
var TitleBlock = ({ pre, leftOfEmoji }) => (
  <div style={{ padding: '20px 28px 0' }}>
    {pre}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 20, marginTop: pre ? 12 : 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {leftOfEmoji}
        <div style={{
          width: 44, height: 44, borderRadius: 10,
          background: 'var(--bg-subtle)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, color: 'var(--accent)',
        }}>⊛</div>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>Questify</h1>
          <div style={{ fontSize: 12.5, color: 'var(--text-dim)', marginTop: 2 }}>
            Gamified task manager focused on progression.
          </div>
        </div>
      </div>
      <button style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '7px 12px', fontSize: 13, fontWeight: 500,
        background: 'var(--accent)', color: 'var(--accent-fg)',
        border: 'none', borderRadius: 8, cursor: 'pointer',
      }}><PlusIcon size={13} /> Add quest</button>
    </div>
  </div>
);

// ===========================================================================
// CURRENT — exactly what's in the screenshot
// ===========================================================================
var Current = () => (
  <div style={{ background: 'var(--bg)', height: '100%', overflow: 'hidden' }}>
    <Topbar />
    <div style={{ padding: '18px 28px 0' }}>
      <button style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        background: 'transparent', border: 'none', color: 'var(--text-dim)',
        fontSize: 12, cursor: 'pointer', padding: 0, marginBottom: 14,
      }}>
        <Chevron /> Back to projects
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 10,
          background: 'var(--bg-subtle)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, color: 'var(--accent)',
        }}>⊛</div>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>Questify</h1>
          <div style={{ fontSize: 12.5, color: 'var(--text-dim)', marginTop: 2 }}>
            Gamified task manager focused on progression.
          </div>
        </div>
      </div>
      <Annotation>
        Thin chevron + grey text. No background, no border, no hover affordance — easy to miss,
        easy to mis-click, and the “Project” label in the topbar is redundant.
      </Annotation>
    </div>
  </div>
);

// ===========================================================================
// ① Subtle pill — minimum-viable improvement
// ===========================================================================
var PillButton = () => {
  const [hover, setHover] = useState(false);
  return (
    <div style={{ background: 'var(--bg)', height: '100%' }}>
      <Topbar />
      <TitleBlock
        pre={
          <button
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '5px 10px 5px 8px', fontSize: 12, fontWeight: 500,
              background: hover ? 'var(--bg-subtle)' : 'transparent',
              color: hover ? 'var(--text)' : 'var(--text-dim)',
              border: `1px solid ${hover ? 'var(--border-strong)' : 'var(--border)'}`,
              borderRadius: 999, cursor: 'pointer',
              transition: 'all 120ms ease',
            }}
          >
            <Chevron size={11} /> Projects
          </button>
        }
      />
      <Annotation tone="good">
        Real button: faint border, hover lift. Reads as nav, not as label. Cheapest fix.
      </Annotation>
    </div>
  );
};

// ===========================================================================
// ② Icon-only, placed BESIDE the title — integrates with the header
// ===========================================================================
var IconBeside = () => {
  const [hover, setHover] = useState(false);
  return (
    <div style={{ background: 'var(--bg)', height: '100%' }}>
      <Topbar />
      <TitleBlock
        leftOfEmoji={
          <button
            title="Back to projects"
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{
              width: 32, height: 32, borderRadius: 8,
              background: hover ? 'var(--bg-subtle)' : 'transparent',
              border: `1px solid ${hover ? 'var(--border)' : 'transparent'}`,
              color: hover ? 'var(--text)' : 'var(--text-dim)',
              cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              transition: 'all 120ms ease',
            }}
          >
            <ArrowLeft size={15} />
          </button>
        }
      />
      <Annotation tone="good">
        Eats no vertical space, sits naturally to the left of the project mark.
        Tooltip on hover; ⌘[ shortcut would pair well.
      </Annotation>
    </div>
  );
};

// ===========================================================================
// ③ Topbar breadcrumb — replaces the redundant "Project" label
// ===========================================================================
var TopbarBreadcrumb = () => {
  const [hover, setHover] = useState(false);
  return (
    <div style={{ background: 'var(--bg)', height: '100%' }}>
      <div style={{
        display: 'flex', alignItems: 'center', padding: '10px 20px',
        background: 'var(--bg-elev)', borderBottom: '1px solid var(--border)',
        gap: 14, height: 48,
      }}>
        <button style={{
          background: 'transparent', border: 'none', color: 'var(--text-dim)',
          cursor: 'pointer', padding: 6, borderRadius: 4, display: 'flex',
        }}><Sidebar size={15} /></button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
          <button
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{
              background: 'transparent', border: 'none',
              color: hover ? 'var(--text)' : 'var(--text-dim)',
              fontSize: 13, cursor: 'pointer', padding: '2px 6px',
              borderRadius: 4, fontWeight: 400,
              transition: 'all 100ms',
              background: hover ? 'var(--bg-subtle)' : 'transparent',
            }}
          >Projects</button>
          <span style={{ color: 'var(--text-faint)', display: 'flex' }}><ChevronRight size={11} sw={1.8} /></span>
          <span style={{ color: 'var(--text)', fontWeight: 500, padding: '2px 6px' }}>Questify</span>
        </div>

        <div style={{ flex: 1 }} />
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '4px 10px', background: 'var(--bg-subtle)',
          borderRadius: 999, border: '1px solid var(--border)',
        }}>
          <span style={{ color: 'var(--accent)', display: 'flex' }}><Zap /></span>
          <span style={{ fontFamily: 'Geist Mono', fontSize: 12, fontWeight: 500 }}>1 600 XP</span>
          <span style={{ width: 1, height: 10, background: 'var(--border)' }} />
          <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Lvl 6</span>
        </div>
        <button style={{
          background: 'transparent', border: 'none', color: 'var(--text-dim)',
          cursor: 'pointer', padding: 6, borderRadius: 4, display: 'flex',
        }}><Bell /></button>
      </div>

      {/* No back row in the body — title sits at the top */}
      <TitleBlock />
      <Annotation tone="best">
        Removes one row entirely. Topbar tells you where you are AND lets you go up.
        Scales to deeper nesting (Projects / Questify / Quest #4).
      </Annotation>
    </div>
  );
};

// ===========================================================================
// ④ Inline breadcrumb above the title (same idea, kept in the body)
// ===========================================================================
var InlineBreadcrumb = () => {
  const [hover, setHover] = useState(false);
  return (
    <div style={{ background: 'var(--bg)', height: '100%' }}>
      <Topbar />
      <TitleBlock
        pre={
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
            <button
              onMouseEnter={() => setHover(true)}
              onMouseLeave={() => setHover(false)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                background: 'transparent', border: 'none',
                color: hover ? 'var(--text)' : 'var(--text-dim)',
                fontSize: 12, cursor: 'pointer', padding: '3px 6px 3px 4px',
                borderRadius: 4, fontFamily: 'inherit',
                transition: 'color 120ms ease',
              }}
            >
              <GridIcon size={11} /> All projects
            </button>
            <span style={{ color: 'var(--text-faint)', display: 'flex' }}><ChevronRight size={10} sw={1.8} /></span>
            <span style={{ color: 'var(--text-faint)', padding: '3px 6px' }}>Questify</span>
          </div>
        }
      />
      <Annotation>
        Keeps the topbar clean if you want the “Project” label to stay.
        Slightly louder than a chevron link; the “All projects” phrasing also reads better than “Back”.
      </Annotation>
    </div>
  );
};

// ===========================================================================
// ⑤ Project switcher chip — back + switch in one control
// ===========================================================================
var SwitcherChip = () => {
  const [open, setOpen] = useState(false);
  const projects = [
    { name: 'Questify', emoji: '⊛', current: true },
    { name: 'Redesign', emoji: '◒' },
    { name: 'Appartement', emoji: '◈' },
    { name: 'Learning Rust', emoji: '◇' },
  ];
  return (
    <div style={{ background: 'var(--bg)', height: '100%', overflow: 'hidden' }}>
      <Topbar hideLabel />
      <div style={{ padding: '18px 28px 0' }}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <button
            onClick={() => setOpen(o => !o)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 10px 6px 8px',
              background: open ? 'var(--bg-subtle)' : 'var(--bg-elev)',
              border: '1px solid var(--border)',
              borderRadius: 999, cursor: 'pointer',
              fontSize: 13, fontWeight: 500, color: 'var(--text)',
              transition: 'all 120ms',
            }}
          >
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 18, height: 18, borderRadius: 4,
              background: 'var(--bg-subtle)', color: 'var(--accent)', fontSize: 12,
              border: '1px solid var(--border)',
            }}>⊛</span>
            Questify
            <span style={{ color: 'var(--text-faint)' }}><ChevronDown size={11} /></span>
          </button>
          {open && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 6px)', left: 0,
              minWidth: 220, padding: 4,
              background: 'var(--bg-elev)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              boxShadow: '0 8px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.02)',
              zIndex: 5,
            }}>
              <button style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                padding: '7px 9px', background: 'transparent', border: 'none',
                color: 'var(--text-dim)', fontSize: 12, cursor: 'pointer',
                borderRadius: 6, borderBottom: '1px solid var(--border)',
                marginBottom: 2, paddingBottom: 8,
              }}>
                <Chevron size={11} /> All projects
              </button>
              {projects.map(p => (
                <div key={p.name} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '6px 9px', borderRadius: 6,
                  background: p.current ? 'var(--bg-subtle)' : 'transparent',
                  fontSize: 13, color: p.current ? 'var(--text)' : 'var(--text-dim)',
                  fontWeight: p.current ? 500 : 400, cursor: 'pointer',
                }}>
                  <span style={{ width: 16, color: 'var(--accent)', fontSize: 13 }}>{p.emoji}</span>
                  {p.name}
                  {p.current && <span style={{ marginLeft: 'auto', fontFamily: 'Geist Mono', fontSize: 10, color: 'var(--text-faint)' }}>·</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 20, marginTop: 14 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>Questify</h1>
            <div style={{ fontSize: 12.5, color: 'var(--text-dim)', marginTop: 2 }}>
              Gamified task manager focused on progression.
            </div>
          </div>
          <button style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '7px 12px', fontSize: 13, fontWeight: 500,
            background: 'var(--accent)', color: 'var(--accent-fg)',
            border: 'none', borderRadius: 8, cursor: 'pointer',
          }}><PlusIcon size={13} /> Add quest</button>
        </div>
      </div>
      <Annotation tone="best">
        One control does two jobs: go back (“All projects”) or jump sideways to another project
        without a round trip. Replaces the emoji thumbnail next to the title too. Click toggled here for preview.
      </Annotation>
    </div>
  );
};

// ===========================================================================
// ⑥ Side rail — back is permanently visible, even on scroll
// ===========================================================================
var SideRail = () => {
  const [hover, setHover] = useState(false);
  return (
    <div style={{ background: 'var(--bg)', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <Topbar />
      <div style={{ display: 'flex' }}>
        <div style={{
          width: 44, paddingTop: 18, display: 'flex', justifyContent: 'center',
          borderRight: '1px solid var(--border)', alignSelf: 'stretch',
          background: 'var(--bg)',
        }}>
          <button
            title="Back to projects"
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{
              width: 28, height: 28, borderRadius: 8,
              background: hover ? 'var(--bg-elev)' : 'transparent',
              border: `1px solid ${hover ? 'var(--border)' : 'transparent'}`,
              color: hover ? 'var(--text)' : 'var(--text-faint)',
              cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              transition: 'all 120ms',
            }}
          >
            <ArrowLeft size={14} />
          </button>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ padding: '20px 28px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10,
                background: 'var(--bg-subtle)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, color: 'var(--accent)',
              }}>⊛</div>
              <div>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>Questify</h1>
                <div style={{ fontSize: 12.5, color: 'var(--text-dim)', marginTop: 2 }}>
                  Gamified task manager focused on progression.
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 18 }}>
              {['Total', 'Completed', 'XP'].map((l, i) => (
                <div key={l} style={{ padding: 10, background: 'var(--bg-elev)', border: '1px solid var(--border)', borderRadius: 8, height: 50 }}>
                  <div style={{ fontSize: 9, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{l}</div>
                  <div style={{ fontFamily: 'Geist Mono', fontSize: 16, marginTop: 2 }}>{[4,0,'+0'][i]}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Annotation>
        Permanent left rail, only one control for now (Back). Survives long scrolls; could grow more nav.
        Trade-off: takes 44px from content width.
      </Annotation>
    </div>
  );
};

// ---------- annotation block ------------------------------------------------
var Annotation = ({ children, tone = 'neutral' }) => {
  const palette = {
    neutral: { bg: 'var(--bg-subtle)', bd: 'var(--border)', fg: 'var(--text-dim)' },
    good:    { bg: 'oklch(0.97 0.025 145)', bd: 'oklch(0.88 0.06 145)', fg: 'oklch(0.42 0.10 145)' },
    best:    { bg: 'var(--accent-subtle)', bd: 'var(--accent-border)', fg: 'var(--accent)' },
  }[tone];
  return (
    <div style={{
      margin: '14px 28px 0', padding: '8px 12px',
      background: palette.bg, border: `1px solid ${palette.bd}`,
      borderRadius: 6, fontSize: 11.5, color: palette.fg, lineHeight: 1.45,
      fontFamily: 'Geist Mono',
    }}>{children}</div>
  );
};

window.BackVariants = {
  Current, PillButton, IconBeside, TopbarBreadcrumb,
  InlineBreadcrumb, SwitcherChip, SideRail,
};
