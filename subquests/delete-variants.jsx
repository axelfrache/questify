// Delete-dialog variants — each shows a quest row + the deletion treatment
// in context so we can compare the actual experience, not just the modal.

var useState = React.useState;
var useEffect = React.useEffect;
var useRef = React.useRef;

// ---------- icons ----------------------------------------------------------
var IcTrash = ({ size = 16, sw = 1.7 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);
var IcX = ({ size = 14, sw = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
var IcUndo = ({ size = 13, sw = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7v6h6"/>
    <path d="M3 13a9 9 0 1 0 3-7.7L3 8"/>
  </svg>
);
var IcCheck = ({ size = 12, sw = 2.5 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

// ---------- shared quest row -----------------------------------------------
var QUEST = { title: 'Write release notes for v0.4', difficulty: 'Medium', xp: 30, recurrence: null };

var QuestRow = ({ state = 'idle', children, dim }) => (
  <div style={{
    display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center',
    gap: 12, padding: '11px 14px',
    background: 'var(--bg-elev)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    opacity: dim ? 0.4 : 1,
    transition: 'all 200ms ease',
    position: 'relative',
    overflow: 'hidden',
  }}>
    <div style={{
      width: 18, height: 18, borderRadius: 5,
      border: '1.5px solid var(--border-strong)',
      flexShrink: 0,
    }} />
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 14, fontWeight: 500, letterSpacing: '-0.01em',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {QUEST.title}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          fontSize: 11, fontWeight: 500, padding: '2px 7px', borderRadius: 4,
          background: 'oklch(0.96 0.04 50)', color: 'oklch(0.55 0.15 40)',
          border: '1px solid oklch(0.88 0.08 50)',
        }}>
          <span style={{ width: 5, height: 5, borderRadius: 1, background: 'oklch(0.55 0.15 40)' }} />
          {QUEST.difficulty}
        </span>
      </div>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 3,
        fontFamily: 'Geist Mono', fontSize: 11, fontWeight: 500,
        padding: '3px 8px', borderRadius: 999,
        background: 'var(--accent-subtle)', color: 'var(--accent)',
        border: '1px solid var(--accent-border)',
      }}>
        +{QUEST.xp}<span style={{ fontSize: 9, opacity: 0.7 }}>XP</span>
      </span>
    </div>
    {children}
  </div>
);

// ---------- frame ----------------------------------------------------------
var Frame = ({ children, note, noteTone }) => (
  <div style={{ background: 'var(--bg-subtle)', height: '100%', display: 'flex', flexDirection: 'column' }}>
    <div style={{ flex: 1, padding: '20px 24px', position: 'relative', overflow: 'hidden' }}>
      {children}
    </div>
    {note && <Annotation tone={noteTone}>{note}</Annotation>}
  </div>
);

var Annotation = ({ children, tone = 'neutral' }) => {
  const palette = {
    neutral: { bg: 'var(--bg-elev)', bd: 'var(--border)', fg: 'var(--text-dim)' },
    good:    { bg: 'oklch(0.97 0.025 145)', bd: 'oklch(0.88 0.06 145)', fg: 'oklch(0.42 0.10 145)' },
    best:    { bg: 'var(--accent-subtle)', bd: 'var(--accent-border)', fg: 'var(--accent)' },
    bad:     { bg: 'oklch(0.97 0.03 25)', bd: 'oklch(0.86 0.08 25)', fg: 'oklch(0.50 0.15 25)' },
  }[tone];
  return (
    <div style={{
      margin: '0 24px 16px', padding: '8px 12px',
      background: palette.bg, border: `1px solid ${palette.bd}`,
      borderRadius: 6, fontSize: 11.5, color: palette.fg, lineHeight: 1.45,
      fontFamily: 'Geist Mono',
    }}>{children}</div>
  );
};

// ===========================================================================
// CURRENT — what the screenshot shows
// ===========================================================================
var Current = () => (
  <Frame
    note="Generic title — which quest? Big red circle reads like “delete account”, not “delete a todo”. Modal interrupts a frequent low-stakes action. No undo."
    noteTone="bad"
  >
    <QuestRow dim />
    <div style={{
      position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: 320, padding: '28px 24px 20px',
        background: 'var(--bg-elev)', borderRadius: 14,
        textAlign: 'center', boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%', margin: '0 auto 14px',
          background: 'oklch(0.95 0.04 25)', color: 'oklch(0.55 0.20 25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <IcTrash size={20} sw={2} />
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Delete quest?</div>
        <div style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 18 }}>This action cannot be undone.</div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <button style={{
            padding: '8px 18px', fontSize: 13, fontWeight: 500,
            background: 'var(--bg-elev)', border: '1px solid var(--border)',
            borderRadius: 8, cursor: 'pointer',
          }}>Cancel</button>
          <button style={{
            padding: '8px 18px', fontSize: 13, fontWeight: 500,
            background: 'oklch(0.55 0.20 25)', color: '#fff',
            border: 'none', borderRadius: 8, cursor: 'pointer',
          }}>Delete</button>
        </div>
      </div>
    </div>
  </Frame>
);

// ===========================================================================
// ① Tone-down — same modal, on-brand
// ===========================================================================
var ToneDown = () => (
  <Frame
    note="Modal kept for parity, but: shows the quest title (real context), uses the brand accent — not blood red — and reframes the copy. Same friction, less drama."
    noteTone="good"
  >
    <QuestRow dim />
    <div style={{
      position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.18)', backdropFilter: 'blur(2px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: 360, padding: '20px 22px',
        background: 'var(--bg-elev)',
        border: '1px solid var(--border)',
        borderRadius: 12, boxShadow: '0 12px 32px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.02)',
      }}>
        <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Delete this quest?</div>
        <div style={{ marginTop: 10, padding: '9px 11px', background: 'var(--bg-subtle)',
                      border: '1px solid var(--border)', borderRadius: 6,
                      fontSize: 13, color: 'var(--text)' }}>
          {QUEST.title}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 10, marginBottom: 16 }}>
          You'll lose <span style={{ fontFamily: 'Geist Mono', color: 'var(--text)' }}>+30 XP</span> if you complete it later from scratch.
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button style={{
            padding: '6px 12px', fontSize: 13, fontWeight: 500,
            background: 'transparent', color: 'var(--text-dim)',
            border: 'none', borderRadius: 6, cursor: 'pointer',
          }}>Cancel</button>
          <button style={{
            padding: '6px 12px', fontSize: 13, fontWeight: 500,
            background: 'var(--bg-elev)', color: 'oklch(0.50 0.15 25)',
            border: '1px solid oklch(0.86 0.08 25)', borderRadius: 6, cursor: 'pointer',
          }}>Delete</button>
        </div>
      </div>
    </div>
  </Frame>
);

// ===========================================================================
// ② Inline row confirmation — no modal at all
// ===========================================================================
var InlineConfirm = () => {
  const [armed, setArmed] = useState(true); // pre-armed for the preview
  return (
    <Frame
      note="The row itself transforms into a confirm strip. Zero context switch, the user can see exactly which quest. Click outside to cancel."
      noteTone="good"
    >
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center',
        gap: 12, padding: '11px 14px',
        background: 'oklch(0.97 0.03 25)',
        border: '1px solid oklch(0.86 0.10 25)',
        borderRadius: 8,
        transition: 'all 200ms ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <IcTrash size={15} sw={1.8} style={{ color: 'oklch(0.50 0.15 25)' }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 500, color: 'oklch(0.35 0.10 25)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Delete “{QUEST.title}”?
            </div>
            <div style={{ fontSize: 11.5, color: 'oklch(0.45 0.08 25)', marginTop: 2 }}>
              You can undo for a few seconds after.
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button style={{
            padding: '5px 10px', fontSize: 12, fontWeight: 500,
            background: 'transparent', color: 'oklch(0.40 0.08 25)',
            border: 'none', borderRadius: 5, cursor: 'pointer',
          }}>Cancel</button>
          <button style={{
            padding: '5px 12px', fontSize: 12, fontWeight: 500,
            background: 'oklch(0.55 0.20 25)', color: '#fff',
            border: 'none', borderRadius: 5, cursor: 'pointer',
          }}>Delete</button>
        </div>
      </div>
    </Frame>
  );
};

// ===========================================================================
// ③ Undo toast — best for low-stakes, high-frequency
// ===========================================================================
var UndoToast = () => {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setProgress(p => (p >= 100 ? 0 : p + 2)), 100);
    return () => clearInterval(id);
  }, []);
  return (
    <Frame
      note="★ Recommended. No modal, no confirm — delete immediately, show a toast with a 5-second undo window. What Gmail, Linear, Things, Apple Mail all do for routine destructive actions."
      noteTone="best"
    >
      <div style={{ opacity: 0.35, transform: 'translateY(-4px)', transition: 'all 300ms ease' }}>
        <QuestRow />
      </div>
      <div style={{
        position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
        background: '#18181b', color: '#fafafa',
        borderRadius: 999,
        boxShadow: '0 12px 32px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', overflow: 'hidden',
        padding: '0 4px 0 14px', minHeight: 36,
        fontSize: 13,
      }}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: 'oklch(0.70 0.16 30)', marginRight: 10,
        }} />
        <span style={{ marginRight: 14, whiteSpace: 'nowrap' }}>
          Quest deleted
        </span>
        <button style={{
          position: 'relative', overflow: 'hidden',
          padding: '6px 14px', fontSize: 12, fontWeight: 500,
          background: 'rgba(255,255,255,0.08)', color: '#fafafa',
          border: '1px solid rgba(255,255,255,0.10)', borderRadius: 999,
          cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5,
        }}>
          <span style={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            width: `${progress}%`, background: 'rgba(255,255,255,0.06)',
            transition: 'width 100ms linear',
          }} />
          <IcUndo size={11} /> Undo
        </button>
      </div>
    </Frame>
  );
};

// ===========================================================================
// ④ Hold to delete — for users who hate confirms
// ===========================================================================
var HoldToDelete = () => {
  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (!holding) { setProgress(0); return; }
    const id = setInterval(() => setProgress(p => Math.min(100, p + 4)), 30);
    return () => clearInterval(id);
  }, [holding]);
  return (
    <Frame
      note="No dialog, no toast — hold the button. Self-correcting (release to cancel), accessible, satisfying. Good fit for power users; harder to discover than ③."
      noteTone="good"
    >
      <QuestRow>
        <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)' }} />
      </QuestRow>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 30 }}>
        <button
          onMouseDown={() => setHolding(true)}
          onMouseUp={() => setHolding(false)}
          onMouseLeave={() => setHolding(false)}
          style={{
            position: 'relative', overflow: 'hidden',
            padding: '9px 22px', fontSize: 13, fontWeight: 500,
            background: 'var(--bg-elev)', color: 'oklch(0.50 0.15 25)',
            border: '1px solid oklch(0.86 0.10 25)', borderRadius: 8,
            cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8,
            userSelect: 'none',
          }}
        >
          <span style={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            width: `${progress}%`,
            background: 'oklch(0.55 0.20 25)',
            transition: 'width 30ms linear',
          }} />
          <span style={{ position: 'relative', color: progress > 50 ? '#fff' : 'inherit', transition: 'color 100ms' }}>
            <IcTrash size={13} sw={1.8} />
          </span>
          <span style={{ position: 'relative', color: progress > 50 ? '#fff' : 'inherit', transition: 'color 100ms' }}>
            Hold to delete
          </span>
        </button>
      </div>
      <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-faint)', marginTop: 8,
        fontFamily: 'Geist Mono' }}>
        Press &amp; hold the button above
      </div>
    </Frame>
  );
};

// ===========================================================================
// ⑤ Swipe-to-delete (mobile + desktop) with undo
// ===========================================================================
var SwipeDelete = () => (
  <Frame
    note="Touch-native: swipe the row left to reveal Delete. Pairs naturally with ③'s undo toast. Less ideal for desktop-first, but Questify has a mobile case."
    noteTone="neutral"
  >
    <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', justifyContent: 'flex-end',
        background: 'oklch(0.55 0.20 25)', color: '#fff',
        alignItems: 'center', padding: '0 22px', gap: 8,
        fontSize: 13, fontWeight: 500,
      }}>
        <IcTrash size={15} sw={2} /> Delete
      </div>
      <div style={{ transform: 'translateX(-90px)', transition: 'transform 200ms ease' }}>
        <QuestRow />
      </div>
    </div>
    <div style={{ marginTop: 12, padding: '8px 12px',
      background: 'var(--bg-elev)', border: '1px dashed var(--border)',
      borderRadius: 6, fontSize: 11.5, color: 'var(--text-faint)',
      fontFamily: 'Geist Mono', textAlign: 'center' }}>
      ← Swipe left on the row to reveal Delete
    </div>
  </Frame>
);

// ===========================================================================
// ⑥ Contextual modal — keep modal, but make it carry weight
// ===========================================================================
var ContextualModal = () => (
  <Frame
    note="If you must keep a modal: show what's actually being lost (XP forfeited, streak impact, recurrence). Modal is justified when the action is non-trivial — e.g. recurring quests."
    noteTone="neutral"
  >
    <QuestRow dim />
    <div style={{
      position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.18)', backdropFilter: 'blur(2px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: 380, padding: '18px 20px 16px',
        background: 'var(--bg-elev)',
        border: '1px solid var(--border)',
        borderRadius: 12, boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Delete recurring quest?</div>
          <button style={{ background: 'transparent', border: 'none', color: 'var(--text-faint)', cursor: 'pointer', padding: 2 }}>
            <IcX size={14} sw={1.8} />
          </button>
        </div>
        <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--bg-subtle)',
                      border: '1px solid var(--border)', borderRadius: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>{QUEST.title}</div>
          <div style={{ display: 'flex', gap: 10, marginTop: 6, fontSize: 11, color: 'var(--text-dim)',
            fontFamily: 'Geist Mono' }}>
            <span>Daily · 12-day streak</span>
            <span>·</span>
            <span>+30 XP / day</span>
          </div>
        </div>

        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <RadioOpt label="Just skip today" sub="Keep the recurrence, don't break the streak." />
          <RadioOpt label="Delete this quest" sub="Removes future occurrences. Streak resets." selected />
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
          <button style={{
            padding: '6px 12px', fontSize: 13, fontWeight: 500,
            background: 'transparent', color: 'var(--text-dim)',
            border: 'none', borderRadius: 6, cursor: 'pointer',
          }}>Cancel</button>
          <button style={{
            padding: '6px 14px', fontSize: 13, fontWeight: 500,
            background: 'oklch(0.50 0.18 25)', color: '#fff',
            border: 'none', borderRadius: 6, cursor: 'pointer',
          }}>Delete</button>
        </div>
      </div>
    </div>
  </Frame>
);

var RadioOpt = ({ label, sub, selected }) => (
  <div style={{
    display: 'flex', gap: 10, padding: '9px 11px',
    background: selected ? 'var(--accent-subtle)' : 'transparent',
    border: `1px solid ${selected ? 'var(--accent-border)' : 'var(--border)'}`,
    borderRadius: 8, cursor: 'pointer',
  }}>
    <div style={{
      width: 16, height: 16, borderRadius: '50%', flexShrink: 0, marginTop: 1,
      border: `1.5px solid ${selected ? 'var(--accent)' : 'var(--border-strong)'}`,
      background: 'var(--bg-elev)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {selected && <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)' }} />}
    </div>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 13, fontWeight: 500, color: selected ? 'var(--text)' : 'var(--text)' }}>{label}</div>
      <div style={{ fontSize: 11.5, color: 'var(--text-dim)', marginTop: 2 }}>{sub}</div>
    </div>
  </div>
);

window.DeleteVariants = {
  Current, ToneDown, InlineConfirm, UndoToast, HoldToDelete, SwipeDelete, ContextualModal,
};
