// Questify Mascot Exploration
// Mascots are personified geometric shapes that match the cut-gem logo language.
// All animation is CSS — drop-in ready for the app.

const { useState, useEffect, useRef } = React;

// ════════════════════════════════════════════════════════════════════
// SHARED PALETTE — pulled from the app design tokens
// ════════════════════════════════════════════════════════════════════
const C = {
  bg:        '#fafaf9',
  bgElev:    '#ffffff',
  bgSubtle:  '#f4f4f5',
  border:    '#e7e5e4',
  text:      '#18181b',
  textDim:   '#52525b',
  textFaint: '#a1a1aa',
  accent:    'oklch(0.56 0.18 275)',
  accentHi:  'oklch(0.68 0.17 275)',
  accentLo:  'oklch(0.42 0.16 275)',
  accentSft: 'oklch(0.92 0.05 275)',
  accentBd:  'oklch(0.88 0.06 275)',
};

// ════════════════════════════════════════════════════════════════════
// ★★★ CUTE DIRECTIONS — pushed toward kawaii / Duolingo-energy ★★★
// Chibi proportions: big head, tiny limbs, HUGE eyes, permanent blush.
// All keep the violet gem as signature element.
// ════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════
// ★★★ TORTU — the gem-shell turtle ★★★
// The shell IS the logo gem. Head tucks in for sleep. Slow + steady —
// the embodiment of "your to-do list reframed as a journey".
// ════════════════════════════════════════════════════════════════════
function Tortu({ size = 140, mood = 'idle', label }) {
  return (
    <div className={`mascot tortu mood-${mood}`} style={{ width: size, height: size }}>
      <div className="float">
        <svg viewBox="0 0 120 140" width={size} height={size} overflow="visible">
          <ellipse cx="60" cy="132" rx="36" ry="4" className="shadow-blob" />

          {/* back legs peeking from behind */}
          <g className="legs-back">
            <ellipse cx="34" cy="116" rx="6" ry="5" className="leg leg-bl" />
            <ellipse cx="86" cy="116" rx="6" ry="5" className="leg leg-br" />
          </g>

          {/* tail */}
          <g className="tail-wrap">
            <polygon points="56,118 64,118 60,128" className="tail" />
          </g>

          {/* SHELL — the faceted gem from the Questify logo, domed */}
          <g className="shell">
            <path d="M 16 84 Q 12 38 60 28 Q 108 38 104 84 Z" className="shell-base" />
            <polygon points="60,30 84,52 36,52" className="shell-facet f-top" />
            <polygon points="84,52 96,78 60,78 60,52" className="shell-facet f-tr" />
            <polygon points="36,52 24,78 60,78 60,52" className="shell-facet f-tl" />
            <polygon points="96,78 90,84 60,84 60,78" className="shell-facet f-br" />
            <polygon points="24,78 30,84 60,84 60,78" className="shell-facet f-bl" />
            <ellipse cx="46" cy="52" rx="8" ry="14" className="shell-shimmer" />
            <path d="M 16 84 Q 60 80 104 84" className="shell-rim" />
          </g>

          {/* HEAD — bulb hanging out front */}
          <g className="head">
            <ellipse cx="60" cy="96" rx="23" ry="19" className="head-bulb" />
            <circle cx="50" cy="92" r="7" className="eye-white" />
            <circle cx="70" cy="92" r="7" className="eye-white" />
            <circle cx="50" cy="94" r="4.8" className="eye-pupil" />
            <circle cx="70" cy="94" r="4.8" className="eye-pupil" />
            <circle cx="52" cy="91" r="2" className="glint-big" />
            <circle cx="72" cy="91" r="2" className="glint-big" />
            <ellipse cx="40" cy="100" rx="4.2" ry="2.6" className="blush" />
            <ellipse cx="80" cy="100" rx="4.2" ry="2.6" className="blush" />
            <path d="M 54 104 Q 60 108 66 104" className="mouth" />
          </g>

          {/* front legs / flippers */}
          <g className="legs-front">
            <ellipse cx="22" cy="108" rx="7" ry="9" className="leg leg-fl" />
            <ellipse cx="98" cy="108" rx="7" ry="9" className="leg leg-fr" />
          </g>

          {/* shell sparkles */}
          <g className="sparkles">
            <polygon points="78,38 80,42 78,46 76,42" className="spk spk-1" />
            <polygon points="32,70 34,74 32,78 30,74" className="spk spk-2" />
          </g>

          {/* level-up rays — only on celebrate */}
          <g className="rays">
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
              <line key={i} x1="60" y1="56" x2="60" y2="14"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                transform={`rotate(${deg} 60 56)`}
                style={{ animationDelay: `${i * 30}ms` }} />
            ))}
          </g>
        </svg>
      </div>
      {label && <div className="mascot-label">{label}</div>}
    </div>
  );
}

// MASCOT E — "Gemmi" the chibi gem (Quill, but huggable)
function Gemmi({ size = 140, mood = 'idle', label }) {
  return (
    <div className={`mascot gemmi mood-${mood}`} style={{ width: size, height: size }}>
      <div className="float">
        <svg viewBox="0 0 120 140" width={size} height={size} overflow="visible">
          <ellipse cx="60" cy="130" rx="30" ry="4" className="shadow-blob" />

          {/* tiny waving arms — behind body */}
          <g className="arms">
            <ellipse cx="22" cy="82" rx="7" ry="11" className="arm arm-l" />
            <ellipse cx="98" cy="82" rx="7" ry="11" className="arm arm-r" />
          </g>

          {/* chunky gem body — shorter & wider than Quill, friendlier */}
          <g className="body">
            <polygon points="60,22 94,52 60,52 26,52" className="facet-top" />
            <polygon points="60,22 60,52 26,52" className="facet-tl" />
            <polygon points="60,22 60,52 94,52" className="facet-tr" />
            <polygon points="26,52 94,52 60,108" className="facet-bot" />
            <polygon points="26,52 60,52 60,108" className="facet-bl" />
            <polygon points="60,52 94,52 60,108" className="facet-br" />
            <polygon points="60,28 86,50 60,50 34,50" className="highlight" />
          </g>

          {/* CHIBI FACE — huge eyes, low on the face */}
          <g className="face">
            <circle cx="48" cy="74" r="9" className="eye-white" />
            <circle cx="72" cy="74" r="9" className="eye-white" />
            <circle cx="48" cy="76" r="6.2" className="eye-pupil" />
            <circle cx="72" cy="76" r="6.2" className="eye-pupil" />
            <circle cx="50.5" cy="73" r="2.6" className="glint-big" />
            <circle cx="74.5" cy="73" r="2.6" className="glint-big" />
            <circle cx="45.5" cy="78.5" r="1.2" className="glint-sm" />
            <circle cx="69.5" cy="78.5" r="1.2" className="glint-sm" />
            <ellipse cx="37" cy="85" rx="5" ry="3" className="blush" />
            <ellipse cx="83" cy="85" rx="5" ry="3" className="blush" />
            <path d="M 53 90 Q 60 95 67 90" className="mouth" />
          </g>
        </svg>
      </div>
      {label && <div className="mascot-label">{label}</div>}
    </div>
  );
}

// MASCOT F — "Sprig" the gem-sapling
// Egg body with a violet gem sprouting from the top. Levels up = grows.
function Sprig({ size = 140, mood = 'idle', label }) {
  return (
    <div className={`mascot sprig mood-${mood}`} style={{ width: size, height: size }}>
      <div className="float">
        <svg viewBox="0 0 120 140" width={size} height={size} overflow="visible">
          <ellipse cx="60" cy="130" rx="28" ry="4" className="shadow-blob" />

          {/* tiny feet */}
          <g className="feet">
            <ellipse cx="48" cy="120" rx="7" ry="3.5" className="foot" />
            <ellipse cx="72" cy="120" rx="7" ry="3.5" className="foot" />
          </g>

          {/* EGG body */}
          <g className="body">
            <ellipse cx="60" cy="84" rx="32" ry="36" className="bean" />
            <ellipse cx="60" cy="96" rx="22" ry="20" className="belly" />
          </g>

          {/* stem + GEM-LEAF on head */}
          <g className="sprout">
            <path d="M 60 48 Q 58 38 56 30" className="stem" />
            <polygon points="60,18 72,32 60,42 48,32" className="gem-leaf" />
            <polygon points="60,22 68,32 60,40 52,32" className="gem-leaf-hi" />
          </g>

          {/* tiny side leaves */}
          <g className="leaves">
            <ellipse cx="28" cy="78" rx="6" ry="9" className="leaf leaf-l" transform="rotate(-30 28 78)" />
            <ellipse cx="92" cy="78" rx="6" ry="9" className="leaf leaf-r" transform="rotate(30 92 78)" />
          </g>

          <g className="face">
            <circle cx="48" cy="78" r="7.5" className="eye-white" />
            <circle cx="72" cy="78" r="7.5" className="eye-white" />
            <circle cx="48" cy="80" r="5" className="eye-pupil" />
            <circle cx="72" cy="80" r="5" className="eye-pupil" />
            <circle cx="50" cy="77" r="2.2" className="glint-big" />
            <circle cx="74" cy="77" r="2.2" className="glint-big" />
            <ellipse cx="38" cy="90" rx="4.5" ry="2.8" className="blush" />
            <ellipse cx="82" cy="90" rx="4.5" ry="2.8" className="blush" />
            <ellipse cx="60" cy="95" rx="3" ry="2.5" className="mouth-o" />
          </g>
        </svg>
      </div>
      {label && <div className="mascot-label">{label}</div>}
    </div>
  );
}

// MASCOT G — "Quibbi" the Questling — tiny adventurer in a wizard hat
function Quibbi({ size = 140, mood = 'idle', label }) {
  return (
    <div className={`mascot quibbi mood-${mood}`} style={{ width: size, height: size }}>
      <div className="float">
        <svg viewBox="0 0 120 140" width={size} height={size} overflow="visible">
          <ellipse cx="60" cy="130" rx="28" ry="4" className="shadow-blob" />

          {/* feet */}
          <g className="feet">
            <ellipse cx="50" cy="118" rx="6.5" ry="3.5" className="foot" />
            <ellipse cx="70" cy="118" rx="6.5" ry="3.5" className="foot" />
          </g>

          {/* arms */}
          <g className="arms">
            <ellipse cx="24" cy="92" rx="6" ry="9" className="arm arm-l" />
            <ellipse cx="96" cy="92" rx="6" ry="9" className="arm arm-r" />
          </g>

          {/* body — soft cream */}
          <g className="body">
            <ellipse cx="60" cy="88" rx="32" ry="30" className="bean" />
          </g>

          {/* wizard hat */}
          <g className="hat">
            <ellipse cx="60" cy="58" rx="30" ry="4" className="hat-brim" />
            <path d="M 60 14 Q 70 38 78 58 L 42 58 Q 50 38 60 14 Z" className="hat-cone" />
            {/* hat tip flop */}
            <ellipse cx="62" cy="16" rx="3.5" ry="3" className="hat-tip" />
            {/* gem on hat band */}
            <polygon points="60,46 66,54 60,62 54,54" className="hat-gem" />
            <polygon points="60,48 64,54 60,60 56,54" className="hat-gem-hi" />
          </g>

          <g className="face">
            <circle cx="50" cy="86" r="7" className="eye-white" />
            <circle cx="70" cy="86" r="7" className="eye-white" />
            <circle cx="50" cy="88" r="4.6" className="eye-pupil" />
            <circle cx="70" cy="88" r="4.6" className="eye-pupil" />
            <circle cx="52" cy="85" r="1.9" className="glint-big" />
            <circle cx="72" cy="85" r="1.9" className="glint-big" />
            <ellipse cx="40" cy="96" rx="4" ry="2.5" className="blush" />
            <ellipse cx="80" cy="96" rx="4" ry="2.5" className="blush" />
            <path d="M 54 100 Q 60 104 66 100" className="mouth" />
          </g>
        </svg>
      </div>
      {label && <div className="mascot-label">{label}</div>}
    </div>
  );
}

// MASCOT H — "Pomu" the fluffy companion
// Big round puff with ear-tufts, holding the gem in its paws.
function Pomu({ size = 140, mood = 'idle', label }) {
  return (
    <div className={`mascot pomu mood-${mood}`} style={{ width: size, height: size }}>
      <div className="float">
        <svg viewBox="0 0 120 140" width={size} height={size} overflow="visible">
          <ellipse cx="60" cy="130" rx="28" ry="4" className="shadow-blob" />

          {/* ear tufts */}
          <g className="ears">
            <ellipse cx="36" cy="38" rx="8" ry="14" className="ear ear-l" />
            <ellipse cx="84" cy="38" rx="8" ry="14" className="ear ear-r" />
            <ellipse cx="36" cy="42" rx="3.5" ry="7" className="ear-inner" />
            <ellipse cx="84" cy="42" rx="3.5" ry="7" className="ear-inner" />
          </g>

          {/* fluffy body */}
          <g className="body">
            <circle cx="60" cy="74" r="36" className="puff" />
            <ellipse cx="60" cy="88" rx="24" ry="22" className="belly" />
          </g>

          <g className="face">
            <circle cx="48" cy="68" r="8" className="eye-white" />
            <circle cx="72" cy="68" r="8" className="eye-white" />
            <circle cx="48" cy="70" r="5.4" className="eye-pupil" />
            <circle cx="72" cy="70" r="5.4" className="eye-pupil" />
            <circle cx="50" cy="67" r="2.2" className="glint-big" />
            <circle cx="74" cy="67" r="2.2" className="glint-big" />
            <ellipse cx="38" cy="80" rx="4.5" ry="3" className="blush" />
            <ellipse cx="82" cy="80" rx="4.5" ry="3" className="blush" />
            {/* tiny triangle nose */}
            <polygon points="60,78 56,82 64,82" className="nose" />
            <path d="M 55 88 Q 60 92 65 88" className="mouth" />
          </g>

          {/* paws holding the gem */}
          <g className="hands">
            <ellipse cx="42" cy="106" rx="6" ry="5" className="paw" />
            <ellipse cx="78" cy="106" rx="6" ry="5" className="paw" />
            <g className="held-gem">
              <polygon points="60,94 70,106 60,118 50,106" className="gem-body" />
              <polygon points="60,98 67,106 60,114 53,106" className="gem-hi" />
            </g>
          </g>
        </svg>
      </div>
      {label && <div className="mascot-label">{label}</div>}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// MASCOT A — "Quill" the Cut Gem
// The logo, alive. Faceted diamond body with eyes inside the front facet.
// Idle = gentle hover + slow blink. THIS IS THE STRONGEST CONCEPT —
// the mascot literally IS the brand mark.
// ════════════════════════════════════════════════════════════════════
function Quill({ size = 140, mood = 'idle', label }) {
  return (
    <div className={`mascot quill mood-${mood}`} style={{ width: size, height: size }}>
      <div className="float">
        <svg viewBox="0 0 120 140" width={size} height={size} overflow="visible">
          {/* shadow ellipse */}
          <ellipse cx="60" cy="128" rx="28" ry="4" className="shadow-blob" />

          {/* GEM BODY — built from primitive polygons (allowed: diamond facets) */}
          <g className="body">
            {/* top crown */}
            <polygon points="60,8 96,42 60,42 24,42" className="facet-top" />
            {/* top side facets */}
            <polygon points="60,8 60,42 24,42" className="facet-tl" />
            <polygon points="60,8 60,42 96,42" className="facet-tr" />
            {/* pavilion (bottom point) */}
            <polygon points="24,42 96,42 60,108" className="facet-bot" />
            <polygon points="24,42 60,42 60,108" className="facet-bl" />
            <polygon points="60,42 96,42 60,108" className="facet-br" />
            {/* table highlight */}
            <polygon points="60,14 88,40 60,40 32,40" className="highlight" />
          </g>

          {/* FACE — sits on the front pavilion */}
          <g className="face">
            <circle cx="48" cy="62" r="4.5" className="eye eye-l" />
            <circle cx="72" cy="62" r="4.5" className="eye eye-r" />
            <circle cx="49.5" cy="60.5" r="1.4" className="glint" />
            <circle cx="73.5" cy="60.5" r="1.4" className="glint" />
            {/* mouth — small line, becomes smile on happy */}
            <path d="M 54 76 Q 60 76 66 76" className="mouth" />
            {/* blush — only visible on happy */}
            <circle cx="42" cy="72" r="3" className="blush" />
            <circle cx="78" cy="72" r="3" className="blush" />
          </g>

          {/* SPARKLES */}
          <g className="sparkles">
            <polygon points="14,30 17,36 14,42 11,36" className="spk spk-1" />
            <polygon points="104,22 107,28 104,34 101,28" className="spk spk-2" />
            <polygon points="100,90 102,94 100,98 98,94" className="spk spk-3" />
          </g>

          {/* LEVEL UP RAYS — only on celebrate */}
          <g className="rays">
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
              <line key={i} x1="60" y1="60" x2="60" y2="20"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                transform={`rotate(${deg} 60 60)`}
                style={{ animationDelay: `${i * 30}ms` }} />
            ))}
          </g>
        </svg>
      </div>
      {label && <div className="mascot-label">{label}</div>}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// MASCOT B — "Pip" the Hooded Traveler
// Tiny RPG explorer — round body, pointed hood, glowing eyes
// ════════════════════════════════════════════════════════════════════
function Pip({ size = 140, mood = 'idle', label }) {
  return (
    <div className={`mascot pip mood-${mood}`} style={{ width: size, height: size }}>
      <div className="float">
        <svg viewBox="0 0 120 140" width={size} height={size} overflow="visible">
          <ellipse cx="60" cy="128" rx="26" ry="3.5" className="shadow-blob" />

          <g className="body">
            {/* cloak body — rounded blob */}
            <path d="M 28 78 Q 28 110 60 110 Q 92 110 92 78 L 92 60 Q 92 40 60 32 Q 28 40 28 60 Z"
              className="cloak" />
            {/* hood point */}
            <path d="M 60 22 L 80 56 Q 60 50 40 56 Z" className="hood-point" />
            {/* hood opening — dark interior */}
            <ellipse cx="60" cy="62" rx="22" ry="20" className="hood-shade" />
            {/* feet */}
            <ellipse cx="46" cy="112" rx="7" ry="4" className="foot" />
            <ellipse cx="74" cy="112" rx="7" ry="4" className="foot" />
          </g>

          <g className="face">
            {/* glowing eyes from the shadow */}
            <circle cx="51" cy="62" r="3.2" className="eye-glow" />
            <circle cx="69" cy="62" r="3.2" className="eye-glow" />
          </g>

          {/* tiny scroll in hand */}
          <g className="scroll">
            <rect x="84" y="78" width="4" height="14" rx="2" className="scroll-body" />
            <circle cx="86" cy="78" r="2.4" className="scroll-cap" />
            <circle cx="86" cy="92" r="2.4" className="scroll-cap" />
          </g>

          <g className="sparkles">
            <polygon points="22,46 24,50 22,54 20,50" className="spk spk-1" />
            <polygon points="100,40 102,44 100,48 98,44" className="spk spk-2" />
          </g>
        </svg>
      </div>
      {label && <div className="mascot-label">{label}</div>}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// ★★★ CARTO — the Traveler's Map ★★★  (map / cartography, not card)
// A parchment scroll between two wooden rolls. Face up top, hand-drawn
// terrain below. Signature move: a new X-mark + gem fades in when you
// unlock a region. Unfurls on onboarding, rolls back up to sleep.
// ════════════════════════════════════════════════════════════════════
function Carto({ size = 140, mood = 'idle', label }) {
  return (
    <div className={`mascot carto-map mood-${mood}`} style={{ width: size, height: size }}>
      <div className="float">
        <svg viewBox="0 0 120 140" width={size} height={size} overflow="visible">
          <ellipse cx="60" cy="134" rx="46" ry="3.5" className="shadow-blob" />

          {/* PARCHMENT */}
          <g className="parchment">
            <path d="M 18 26 Q 60 20 102 26 L 102 114 Q 60 120 18 114 Z" className="paper-bg" />
            {/* deckle shadows near rolls */}
            <path d="M 18 26 Q 22 70 18 114" className="paper-fold paper-fold-l" />
            <path d="M 102 26 Q 98 70 102 114" className="paper-fold paper-fold-r" />
          </g>

          {/* WOODEN ROLLS */}
          <g className="rolls">
            <rect x="8" y="26" width="12" height="88" rx="6" className="roll" />
            <ellipse cx="14" cy="26" rx="6" ry="3" className="roll-cap" />
            <ellipse cx="14" cy="114" rx="6" ry="3" className="roll-cap" />
            <line x1="14" y1="32" x2="14" y2="108" className="roll-line" />

            <rect x="100" y="26" width="12" height="88" rx="6" className="roll" />
            <ellipse cx="106" cy="26" rx="6" ry="3" className="roll-cap" />
            <ellipse cx="106" cy="114" rx="6" ry="3" className="roll-cap" />
            <line x1="106" y1="32" x2="106" y2="108" className="roll-line" />
          </g>

          {/* FACE — friendly traveler */}
          <g className="face">
            <circle cx="46" cy="46" r="5.5" className="eye-white" />
            <circle cx="68" cy="46" r="5.5" className="eye-white" />
            <circle cx="46" cy="48" r="3.6" className="eye-pupil" />
            <circle cx="68" cy="48" r="3.6" className="eye-pupil" />
            <circle cx="48" cy="45" r="1.6" className="glint" />
            <circle cx="70" cy="45" r="1.6" className="glint" />
            <ellipse cx="36" cy="54" rx="3.6" ry="2.2" className="blush" />
            <ellipse cx="78" cy="54" rx="3.6" ry="2.2" className="blush" />
            <path d="M 50 58 Q 57 62 64 58" className="mouth" />
          </g>

          {/* DIVIDER — title rule, like a real map */}
          <g className="title-rule">
            <path d="M 30 70 L 88 70" className="rule-line" />
            <text x="60" y="76" className="rule-text" textAnchor="middle">· TERRA INCOGNITA ·</text>
          </g>

          {/* MAP ART — hills, path, X marks */}
          <g className="map-art">
            {/* hills */}
            <polygon points="28,96 38,82 48,96" className="hill" />
            <polygon points="46,98 60,80 74,98" className="hill hill-tall" />
            <polygon points="72,96 82,86 92,96" className="hill" />
            {/* river/path */}
            <path d="M 26 104 Q 48 99 60 96 Q 78 92 96 102" className="path-line" />
            {/* compass rose — bottom-left corner */}
            <g className="compass">
              <circle cx="28" cy="108" r="4" className="compass-ring" />
              <polygon points="28,105 29.5,108 28,111 26.5,108" className="compass-needle" />
            </g>
            {/* X marks — done, current, locked */}
            <g className="x-mark x-done">
              <line x1="30" y1="88" x2="36" y2="94" />
              <line x1="36" y1="88" x2="30" y2="94" />
            </g>
            <g className="x-mark x-current">
              <line x1="56" y1="84" x2="62" y2="90" />
              <line x1="62" y1="84" x2="56" y2="90" />
              <polygon points="59,76 63,80 59,84 55,80" className="map-gem" />
            </g>
            <g className="x-mark x-locked">
              <line x1="84" y1="92" x2="90" y2="98" />
              <line x1="90" y1="92" x2="84" y2="98" />
            </g>
            {/* dotted route */}
            <path d="M 33 91 Q 46 88 59 80" className="route" />
            <path d="M 59 80 Q 72 84 87 95" className="route route-future" />
          </g>

          {/* sparkles */}
          <g className="sparkles">
            <polygon points="92,42 94,46 92,50 90,46" className="spk spk-1" />
            <polygon points="22,66 24,70 22,74 20,70" className="spk spk-2" />
          </g>

          {/* level-up rays */}
          <g className="rays">
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
              <line key={i} x1="60" y1="70" x2="60" y2="14"
                strokeWidth="2.5" strokeLinecap="round"
                transform={`rotate(${deg} 60 70)`}
                style={{ animationDelay: `${i * 30}ms` }} />
            ))}
          </g>
        </svg>
      </div>
      {label && <div className="mascot-label">{label}</div>}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// CARTO SCENES — traveler's-map contexts
// ════════════════════════════════════════════════════════════════════
function CartoScene({ kind }) {
  if (kind === 'regions') {
    // Full screen — your world map, with all regions and their progress
    return (
      <div className="cm-scene cm-regions">
        <div className="cm-chrome">
          <span>Regions</span><span className="cm-meta">4 of 12 discovered</span>
        </div>
        <div className="cm-world">
          {/* terrain backdrop */}
          <div className="cm-terrain"></div>
          {/* regions */}
          <div className="cm-region cm-r1 done"><span className="cm-dot"></span>Life<small>9 / 9</small></div>
          <div className="cm-region cm-r2 active"><span className="cm-dot"></span>Firelink<small>3 quests</small></div>
          <div className="cm-region cm-r3 done"><span className="cm-dot"></span>Polytech<small>14 / 18</small></div>
          <div className="cm-region cm-r4 locked"><span className="cm-dot"></span>CKA<small>locked</small></div>
          <div className="cm-region cm-r5 locked"><span className="cm-dot"></span>?????<small>—</small></div>
          {/* dashed routes between */}
          <svg className="cm-routes" viewBox="0 0 400 280" preserveAspectRatio="none">
            <path d="M 80 70 Q 160 60 220 100" />
            <path d="M 220 100 Q 280 120 320 80" />
            <path d="M 80 70 Q 100 140 140 200" />
            <path d="M 220 100 Q 240 180 280 220" />
          </svg>
          {/* central mascot */}
          <div className="cm-center">
            <Carto size={92} mood="pinpoint" />
          </div>
        </div>
      </div>
    );
  }

  if (kind === 'unlock') {
    // A new region just unlocked — fanfare
    return (
      <div className="cm-scene cm-unlock">
        <div className="cm-unlock-inner">
          <div className="cm-pre">A new region appears…</div>
          <Carto size={170} mood="discover" />
          <div className="cm-unlock-title">CKA <em>discovered</em></div>
          <div className="cm-unlock-sub">Carto added it to your map · 6 quests await</div>
          <div className="cm-unlock-cta">Explore CKA →</div>
        </div>
      </div>
    );
  }

  if (kind === 'detail') {
    // Quest detail with route — Mappi shows where to go
    return (
      <div className="cm-scene cm-detail">
        <div className="cm-detail-mascot"><Carto size={150} mood="pinpoint" /></div>
        <div className="cm-detail-info">
          <div className="cm-detail-step">Quest 4 of 11 · Firelink region</div>
          <div className="cm-detail-title">Add nodes <em>(VPS)</em></div>
          <div className="cm-detail-desc">Provision two more nodes and join them to the cluster. Carto traced the route — start here.</div>
          <div className="cm-detail-meta">
            <span className="cm-pill hard">HARD</span>
            <span className="cm-pill xp">+100 XP</span>
            <span className="cm-pill">📍 Firelink</span>
          </div>
          <div className="cm-detail-actions">
            <button className="cm-btn primary">Begin journey</button>
            <button className="cm-btn">Save for later</button>
          </div>
        </div>
      </div>
    );
  }

  if (kind === 'onboarding') {
    // First map unfurling
    return (
      <div className="cm-scene cm-onboarding">
        <div className="cm-step">Step 1 of 4</div>
        <Carto size={180} mood="unfurl" />
        <div className="cm-ob-title">Welcome, <em>traveler</em></div>
        <div className="cm-ob-sub">Carto will keep your map. Every quest leaves a mark — every region you finish stays drawn forever.</div>
        <div className="cm-ob-cta">Unroll your map →</div>
      </div>
    );
  }

  if (kind === 'streak') {
    // Profile / streak — your history rendered as completed terrain
    return (
      <div className="cm-scene cm-streak">
        <div className="cm-streak-header">
          <div>
            <div className="cm-streak-title">Your <em>journey</em> so far</div>
            <div className="cm-streak-sub">23 quests done · 4-day streak · 1,650 XP</div>
          </div>
          <Carto size={64} mood="happy" />
        </div>
        <div className="cm-streak-grid">
          {Array.from({ length: 35 }).map((_, i) => {
            const filled = [2,3,4,5,7,9,10,12,14,17,18,19,21,23,24,28,30,31,32].includes(i);
            const today = i === 33;
            return <div key={i} className={`cm-day ${filled ? 'filled' : ''} ${today ? 'today' : ''}`}></div>;
          })}
        </div>
        <div className="cm-streak-foot">Tap a day to revisit the quests of that region.</div>
      </div>
    );
  }

  return null;
}

// ════════════════════════════════════════════════════════════════════
// ★★★ TAROT — the Quest Card ★★★ (alt interpretation, kept for ref)
// ════════════════════════════════════════════════════════════════════
function Tarot({ size = 140, mood = 'idle', label, title = 'THE TRAVELER' }) {
  return (
    <div className={`mascot carto mood-${mood}`} style={{ width: size, height: size }}>
      <div className="float">
        <div className="carto-flipper">
          {/* FRONT */}
          <div className="carto-face carto-front">
            <svg viewBox="0 0 100 140" width="100%" height="100%" overflow="visible" preserveAspectRatio="xMidYMid meet">
              {/* shadow */}
              <ellipse cx="50" cy="138" rx="32" ry="3" className="shadow-blob" />

              {/* card body */}
              <rect x="6" y="6" width="88" height="128" rx="8" className="card-body" />
              <rect x="11" y="11" width="78" height="118" rx="5" className="card-inner" />

              {/* corner ornaments — tiny diamonds */}
              <polygon points="18,18 22,22 18,26 14,22" className="corner corner-tl" />
              <polygon points="82,18 86,22 82,26 78,22" className="corner corner-tr" />
              <polygon points="18,118 22,122 18,126 14,122" className="corner corner-bl" />
              <polygon points="82,118 86,122 82,126 78,122" className="corner corner-br" />

              {/* central gem (the logo) */}
              <g className="card-gem">
                <polygon points="50,50 70,70 50,90 30,70" className="cg-body" />
                <polygon points="50,54 66,70 50,86 34,70" className="cg-hi" />
                <line x1="50" y1="50" x2="50" y2="90" className="cg-line" />
                <line x1="30" y1="70" x2="70" y2="70" className="cg-line" />
              </g>

              {/* face — peeking over the top of the card */}
              <g className="card-face">
                <circle cx="40" cy="34" r="5.5" className="eye-white" />
                <circle cx="60" cy="34" r="5.5" className="eye-white" />
                <circle cx="40" cy="35.5" r="3.6" className="eye-pupil" />
                <circle cx="60" cy="35.5" r="3.6" className="eye-pupil" />
                <circle cx="41.5" cy="33" r="1.4" className="glint" />
                <circle cx="61.5" cy="33" r="1.4" className="glint" />
                <ellipse cx="30" cy="40" rx="3.5" ry="2.2" className="blush" />
                <ellipse cx="70" cy="40" rx="3.5" ry="2.2" className="blush" />
                <path d="M 44 44 Q 50 47 56 44" className="mouth" />
              </g>

              {/* title plate */}
              <rect x="18" y="100" width="64" height="14" rx="2" className="plate" />
              <text x="50" y="110" className="plate-text" textAnchor="middle">{title}</text>

              {/* tiny stub arms */}
              <ellipse cx="6" cy="78" rx="4" ry="6" className="card-arm arm-l" />
              <ellipse cx="94" cy="78" rx="4" ry="6" className="card-arm arm-r" />

              {/* sparkles */}
              <g className="sparkles">
                <polygon points="92,30 94,34 92,38 90,34" className="spk spk-1" />
                <polygon points="8,100 10,104 8,108 6,104" className="spk spk-2" />
              </g>

              {/* celebrate rays */}
              <g className="rays">
                {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
                  <line key={i} x1="50" y1="70" x2="50" y2="14"
                    strokeWidth="2.5" strokeLinecap="round"
                    transform={`rotate(${deg} 50 70)`}
                    style={{ animationDelay: `${i * 30}ms` }} />
                ))}
              </g>
            </svg>
          </div>

          {/* BACK — pattern with gem */}
          <div className="carto-face carto-back">
            <svg viewBox="0 0 100 140" width="100%" height="100%" overflow="visible" preserveAspectRatio="xMidYMid meet">
              <rect x="6" y="6" width="88" height="128" rx="8" className="card-body" />
              <rect x="11" y="11" width="78" height="118" rx="5" className="card-back-inner" />
              {/* pattern of small diamonds */}
              {[0,1,2,3].map(row => [0,1,2].map(col => (
                <polygon key={`${row}-${col}`}
                  points={`${22+col*28},${28+row*28} ${28+col*28},${34+row*28} ${22+col*28},${40+row*28} ${16+col*28},${34+row*28}`}
                  className="back-diamond" />
              )))}
              {/* central larger gem */}
              <polygon points="50,62 64,76 50,90 36,76" className="back-center" />
            </svg>
          </div>
        </div>
      </div>
      {label && <div className="mascot-label">{label}</div>}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// TAROT SCENES — leverage the playing-card metaphor (alt)
// ════════════════════════════════════════════════════════════════════
function TarotScene({ kind }) {
  if (kind === 'stack') {
    // Today's quests as a fanned stack of Cartos
    return (
      <div className="carto-scene carto-stack">
        <div className="cs-header">
          <div>
            <div className="cs-title">Today's <em>hand</em></div>
            <div className="cs-sub">4 quests · pick one to start</div>
          </div>
          <div className="cs-xp">1,650 <small>XP</small></div>
        </div>
        <div className="cs-fan">
          <div className="cs-card cs-card-4"><Tarot size={120} mood="idle" title="LIFT WEIGHTS" /></div>
          <div className="cs-card cs-card-3"><Tarot size={120} mood="idle" title="WRITE CV" /></div>
          <div className="cs-card cs-card-2"><Tarot size={130} mood="seeking" title="ADD VPS NODES" /></div>
          <div className="cs-card cs-card-1 active"><Tarot size={150} mood="happy" title="THE TRAVELER" /></div>
        </div>
        <div className="cs-foot">Tap a card to begin · drag to reorder</div>
      </div>
    );
  }

  if (kind === 'flip') {
    // Quest complete — card flips to reveal next quest
    return (
      <div className="carto-scene carto-flip">
        <div className="cf-step">Quest 3 of 11 · just completed</div>
        <div className="cf-flipping">
          <Tarot size={170} mood="flip" title="NEXT UP" />
        </div>
        <div className="cf-meta">
          <div className="cf-just">
            <span className="cf-check">✓</span>
            <span className="cf-just-text">Push K3s update <em>+50 XP</em></span>
          </div>
          <div className="cf-next">
            <span className="cf-arrow">→</span>
            <span className="cf-next-text">Carto is dealing your next quest…</span>
          </div>
        </div>
      </div>
    );
  }

  if (kind === 'detail') {
    // A single Carto becomes the quest-detail surface
    return (
      <div className="carto-scene carto-detail">
        <div className="cd-frame">
          <Tarot size={200} mood="idle" title="ADD VPS NODES" />
        </div>
        <div className="cd-info">
          <div className="cd-difficulty"><span className="cd-diff-dot"></span>HARD · +100 XP</div>
          <div className="cd-desc">Provision two more nodes and join them to the Firelink cluster. Use Tailscale subnet routing.</div>
          <div className="cd-meta">
            <span>📅 Due Tuesday</span>
            <span>🔥 Firelink</span>
          </div>
          <div className="cd-actions">
            <button className="cd-btn primary">Start quest</button>
            <button className="cd-btn">Defer</button>
          </div>
        </div>
      </div>
    );
  }

  if (kind === 'deck') {
    // Onboarding — pull a card from the deck
    return (
      <div className="carto-scene carto-deck">
        <div className="cd-step">Step 1 of 4</div>
        <div className="cd-title">Draw your <em>first quest</em></div>
        <div className="cd-sub">Tap the deck — Carto picks one for you.</div>
        <div className="cd-stage">
          <div className="cd-deck-stack">
            <div className="cd-deck-card cd-bk-3"></div>
            <div className="cd-deck-card cd-bk-2"></div>
            <div className="cd-deck-card cd-bk-1"></div>
            <div className="cd-deck-card cd-bk-pulled">
              <Tarot size={140} mood="seeking" title="THE BEGINNING" />
            </div>
          </div>
        </div>
        <div className="cd-cta">Tap to draw →</div>
      </div>
    );
  }

  if (kind === 'inbox') {
    // Empty inbox — Carto folded asleep
    return (
      <div className="carto-scene carto-inbox">
        <div className="ci-chrome">
          <span>Inbox</span><span className="ci-empty">empty</span>
        </div>
        <div className="ci-body">
          <Tarot size={140} mood="sleep" title="—" />
          <div className="ci-title">The deck is empty.</div>
          <div className="ci-sub">Add a quest to deal Carto a new card.</div>
          <div className="ci-cta">+ New quest</div>
        </div>
      </div>
    );
  }

  return null;
}

// ════════════════════════════════════════════════════════════════════
// MASCOT C — "Lume" the Compass Spirit — v2 (chibier + state-rich)
// The needle is the signature: it can seek, lock onto a target, or
// drift while sleeping. Two tiny wisps orbit when celebrating.
// ════════════════════════════════════════════════════════════════════
function Lume({ size = 140, mood = 'idle', label, target }) {
  // `target` (deg) used when mood === 'direct' — sets the locked needle angle
  const style = { width: size, height: size };
  if (target != null) style['--lume-target'] = `${target}deg`;
  return (
    <div className={`mascot lume mood-${mood}`} style={style}>
      <div className="float">
        <svg viewBox="0 0 120 140" width={size} height={size} overflow="visible">
          <ellipse cx="60" cy="130" rx="32" ry="4" className="shadow-blob" />

          {/* orbiting wisp companions — appear on celebrate */}
          <g className="wisps">
            <circle r="2.6" className="wisp wisp-1" cx="60" cy="70" />
            <circle r="2.0" className="wisp wisp-2" cx="60" cy="70" />
          </g>

          {/* compass body */}
          <g className="body">
            <circle cx="60" cy="70" r="44" className="disc-outer" />
            <circle cx="60" cy="70" r="38" className="disc-ring" />
            <circle cx="60" cy="70" r="32" className="disc-inner" />

            {/* cardinal ticks N/E/S/W */}
            {[0, 90, 180, 270].map((d, i) => (
              <line key={i} x1="60" y1="30" x2="60" y2="38"
                strokeWidth="1.8" strokeLinecap="round"
                transform={`rotate(${d} 60 70)`}
                className={`tick tick-${['n','e','s','w'][i]}`} />
            ))}
            {/* minor ticks */}
            {[45, 135, 225, 315].map((d, i) => (
              <line key={i} x1="60" y1="32" x2="60" y2="36"
                strokeWidth="1" strokeLinecap="round"
                transform={`rotate(${d} 60 70)`} className="tick tick-minor" />
            ))}
            {/* N label */}
            <text x="60" y="46" className="cardinal" textAnchor="middle">N</text>

            {/* needle */}
            <g className="needle">
              <polygon points="60,40 64,70 60,72 56,70" className="needle-n" />
              <polygon points="60,100 64,70 60,68 56,70" className="needle-s" />
              <circle cx="60" cy="70" r="3.5" className="needle-pivot" />
            </g>
          </g>

          {/* chibi face */}
          <g className="face">
            <circle cx="46" cy="80" r="5.5" className="eye-white" />
            <circle cx="74" cy="80" r="5.5" className="eye-white" />
            <circle cx="46" cy="82" r="3.6" className="eye-pupil" />
            <circle cx="74" cy="82" r="3.6" className="eye-pupil" />
            <circle cx="47.5" cy="79" r="1.4" className="glint" />
            <circle cx="75.5" cy="79" r="1.4" className="glint" />
            <ellipse cx="36" cy="88" rx="3.6" ry="2.2" className="blush" />
            <ellipse cx="84" cy="88" rx="3.6" ry="2.2" className="blush" />
            <path d="M 53 93 Q 60 97 67 93" className="mouth" />
          </g>

          {/* sparkles */}
          <g className="sparkles">
            <polygon points="14,60 16,64 14,68 12,64" className="spk spk-1" />
            <polygon points="106,52 108,56 106,60 104,56" className="spk spk-2" />
          </g>

          {/* level-up rays — celebrate only */}
          <g className="rays">
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
              <line key={i} x1="60" y1="70" x2="60" y2="14"
                strokeWidth="2.5" strokeLinecap="round"
                transform={`rotate(${deg} 60 70)`}
                style={{ animationDelay: `${i * 30}ms` }} />
            ))}
          </g>
        </svg>
      </div>
      {label && <div className="mascot-label">{label}</div>}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// LUME-SPECIFIC SCENES — leverage the compass / direction metaphor
// ════════════════════════════════════════════════════════════════════
function LumeScene({ kind }) {
  if (kind === 'finder') {
    // Lume locks her needle onto your next quest. Projects radial around her.
    return (
      <div className="lume-scene lume-finder">
        <div className="lf-chrome"><span>Today</span><span className="lf-clock">11:42</span></div>
        <div className="lf-body">
          <div className="lf-title">Where to next?</div>
          <div className="lf-sub">Lume is pointing toward your next quest.</div>
          <div className="lf-stage">
            <div className="lf-card lf-card-n">Polytech<small>·5 quests</small></div>
            <div className="lf-card lf-card-e">CKA<small>·1 quest</small></div>
            <div className="lf-card lf-card-w">Work<small>·2 quests</small></div>
            <div className="lf-card lf-card-s lf-target">Firelink<small>·3 quests overdue</small></div>
            <div className="lf-center"><Lume size={130} mood="direct" target={180} /></div>
          </div>
          <div className="lf-action">Start with Firelink →</div>
        </div>
      </div>
    );
  }

  if (kind === 'header') {
    return (
      <div className="lume-scene lume-header-scene">
        <div className="lh-bar">
          <div className="lh-lume"><Lume size={48} mood="seeking" /></div>
          <div className="lh-text">
            <div className="lh-title">Tuesday <em>compass</em></div>
            <div className="lh-sub">3 of 11 quests · Firelink is calling</div>
          </div>
          <div className="lh-streak"><span className="lh-dot"></span>4-day streak</div>
        </div>
        <div className="lh-quests">
          <div className="lh-q done"><span className="lh-check">✓</span>Mettre à jour CV<span className="lh-xp">+100</span></div>
          <div className="lh-q done"><span className="lh-check">✓</span>Push K3s update<span className="lh-xp">+50</span></div>
          <div className="lh-q"><span className="lh-bullet"></span>Cours Linux Fundation<span className="lh-xp">+150</span></div>
          <div className="lh-q overdue"><span className="lh-bullet od"></span>Add nodes (VPS)<span className="lh-xp">+100</span></div>
        </div>
      </div>
    );
  }

  if (kind === 'calibrate') {
    return (
      <div className="lume-scene lume-calibrate">
        <div className="lc-step">Step 2 of 4</div>
        <Lume size={170} mood="calibrate" />
        <div className="lc-title">Calibrating your <em>journey</em></div>
        <div className="lc-sub">Tell us what matters this season. Lume will point you back to it when you drift.</div>
        <div className="lc-chips">
          <span className="lc-chip active">Career</span>
          <span className="lc-chip">Health</span>
          <span className="lc-chip active">Learning</span>
          <span className="lc-chip">Side projects</span>
          <span className="lc-chip">Relationships</span>
        </div>
        <div className="lc-next">Continue →</div>
      </div>
    );
  }

  if (kind === 'levelup') {
    return (
      <div className="lume-scene lume-levelup">
        <div className="ll-inner">
          <Lume size={180} mood="celebrate" />
          <div className="ll-title">Level <em>7</em></div>
          <div className="ll-sub">Lume's compass unlocked a new region · Sage tier</div>
          <div className="ll-stats">
            <div><b>1,650</b><small>XP earned</small></div>
            <div><b>4</b><small>day streak</small></div>
            <div><b>23</b><small>quests done</small></div>
          </div>
          <div className="ll-cta">Continue your journey</div>
        </div>
      </div>
    );
  }

  if (kind === 'sidebar') {
    return (
      <div className="lume-scene lume-sidebar">
        <div className="ls-user">
          <div className="ls-avatar"><Lume size={36} mood="idle" /></div>
          <div className="ls-who">
            <b>Axel</b>
            <small>Lvl 6 · Traveler</small>
          </div>
        </div>
        <div className="ls-pointer">
          <Lume size={56} mood="direct" target={120} />
          <div className="ls-pointer-text">
            <div className="ls-pt-title">Next: <em>Firelink</em></div>
            <div className="ls-pt-sub">3 quests waiting</div>
          </div>
        </div>
        <div className="ls-list">
          <div className="ls-item active">Inbox</div>
          <div className="ls-item">Today</div>
          <div className="ls-item">Regions <span className="ls-badge">4/12</span></div>
        </div>
      </div>
    );
  }

  return null;
}

// ════════════════════════════════════════════════════════════════════
// MASCOT D — "Spark" the Wisp
// More abstract — a trail of small diamonds flowing behind a leader gem.
// Pure motion, less anthropomorphic, suited for celebrations & micro-moments.
// ════════════════════════════════════════════════════════════════════
function Spark({ size = 140, mood = 'idle', label }) {
  return (
    <div className={`mascot spark mood-${mood}`} style={{ width: size, height: size }}>
      <div className="float">
        <svg viewBox="0 0 120 140" width={size} height={size} overflow="visible">
          <ellipse cx="60" cy="128" rx="22" ry="3" className="shadow-blob" />

          <g className="trail">
            {/* trailing diamonds — smaller & more transparent further back */}
            <polygon points="28,90 36,80 44,90 36,100" className="t t-3" />
            <polygon points="38,82 46,72 54,82 46,92" className="t t-2" />
            <polygon points="50,72 60,62 70,72 60,82" className="t t-1" />
          </g>

          {/* LEAD GEM */}
          <g className="lead">
            <polygon points="78,38 94,58 78,78 62,58" className="lead-body" />
            <polygon points="78,42 90,58 78,74 66,58" className="lead-highlight" />
            {/* tiny eyes */}
            <circle cx="73" cy="56" r="2" className="eye" />
            <circle cx="83" cy="56" r="2" className="eye" />
            <path d="M 74 64 Q 78 66 82 64" className="mouth" />
          </g>

          <g className="sparkles">
            <polygon points="100,30 102,34 100,38 98,34" className="spk spk-1" />
            <polygon points="20,40 22,44 20,48 18,44" className="spk spk-2" />
            <polygon points="105,80 107,84 105,88 103,84" className="spk spk-3" />
          </g>
        </svg>
      </div>
      {label && <div className="mascot-label">{label}</div>}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// Caption — small italic blurb under each mascot
// ════════════════════════════════════════════════════════════════════
function Caption({ name, idea, traits }) {
  return (
    <div className="caption">
      <div className="cap-name">{name}</div>
      <div className="cap-idea">{idea}</div>
      <div className="cap-traits">
        {traits.map(t => <span key={t} className="trait">{t}</span>)}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// State swatch — small card showing a mascot in a single mood
// ════════════════════════════════════════════════════════════════════
function StateSwatch({ mascot: M, mood, label, sub }) {
  return (
    <div className="state-cell">
      <div className="state-mascot"><M size={110} mood={mood} /></div>
      <div className="state-meta">
        <div className="state-label">{label}</div>
        <div className="state-sub">{sub}</div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// In-app context preview — shows the mascot inside the actual UI
// ════════════════════════════════════════════════════════════════════
function ContextPreview({ mascot: M, scene }) {
  if (scene === 'inbox-empty') {
    return (
      <div className="ctx ctx-inbox">
        <div className="ctx-bar">
          <div className="ctx-dot"></div>
          <div className="ctx-dot"></div>
          <div className="ctx-dot"></div>
          <div className="ctx-title">Inbox</div>
        </div>
        <div className="ctx-body">
          <div className="ctx-h1">Inbox</div>
          <div className="ctx-sub">All quests, unassigned &amp; pending</div>
          <div className="ctx-empty">
            <M size={120} mood="sleep" />
            <div className="ctx-empty-title">No quests, traveler.</div>
            <div className="ctx-empty-sub">Your companion is resting. Add a quest to begin.</div>
          </div>
        </div>
      </div>
    );
  }

  if (scene === 'levelup') {
    return (
      <div className="ctx ctx-modal">
        <div className="ctx-modal-inner">
          <M size={140} mood="celebrate" />
          <div className="ctx-modal-title">Level <em>7</em></div>
          <div className="ctx-modal-sub">+50 XP · new region unlocked</div>
          <div className="ctx-modal-btn">Continue your journey</div>
        </div>
      </div>
    );
  }

  if (scene === 'toast') {
    return (
      <div className="ctx ctx-toast-wrap">
        <div className="ctx-page-fade">Quests / Today</div>
        <div className="ctx-toast">
          <M size={56} mood="happy" />
          <div className="ctx-toast-text">
            <div className="ctx-toast-title">Nice — quest complete</div>
            <div className="ctx-toast-sub">+100 XP · 3-day streak</div>
          </div>
        </div>
      </div>
    );
  }

  if (scene === 'sidebar') {
    return (
      <div className="ctx ctx-sidebar">
        <div className="ctx-sb-user">
          <div className="ctx-sb-avatar"><M size={32} mood="idle" /></div>
          <div className="ctx-sb-who">
            <b>Axel</b>
            <small>Lvl 6 · Traveler</small>
          </div>
        </div>
        <div className="ctx-sb-list">
          <div className="ctx-sb-item active">Inbox</div>
          <div className="ctx-sb-item">Today</div>
          <div className="ctx-sb-item">Upcoming</div>
          <div className="ctx-sb-item">Habits</div>
          <div className="ctx-sb-item">Regions</div>
        </div>
      </div>
    );
  }
  return null;
}

// ════════════════════════════════════════════════════════════════════
// MAIN — Design canvas with all explorations
// ════════════════════════════════════════════════════════════════════
function App() {
  return (
    <>
      <window.DesignCanvas defaultZoom={0.85}>

        {/* ── SECTION CARTO — Traveler's Map (REQUESTED) ────────────── */}
        <window.DCSection
          id="carto-map"
          title="Carto — the traveler's map"
          subtitle="Parchment between two wooden rolls. A friendly face up top, hand-drawn terrain below. Signature: a new X-mark + gem appears whenever you discover a region. The mascot literally IS your map of the journey.">

          <window.DCArtboard id="carto-map-hero" label="Hero — meet Carto" width={420} height={520}>
            <div className="artboard-pad carto-map-hero-pad">
              <Carto size={220} />
              <div className="caption">
                <div className="cap-name">Carto</div>
                <div className="cap-idea">A living parchment that draws your journey. Every region you finish is added to its terrain — your map literally grows with you.</div>
                <div className="cap-traits">
                  <span className="trait">Exploration metaphor</span>
                  <span className="trait">Doubles as UI</span>
                  <span className="trait">Persistent memory</span>
                </div>
              </div>
            </div>
          </window.DCArtboard>

          <window.DCArtboard id="carto-map-states" label="Six animation states" width={1080} height={380}>
            <div className="state-grid">
              <StateSwatch mascot={Carto} mood="idle"     label="Idle"      sub="Parchment ripples softly. Blinks." />
              <StateSwatch mascot={Carto} mood="pinpoint" label="Pinpoint"  sub="Zooms in on a marker. Pulse + sparkle." />
              <StateSwatch mascot={Carto} mood="discover" label="Discover"  sub="A new X-mark fades in with a flash." />
              <StateSwatch mascot={Carto} mood="unfurl"   label="Unfurl"    sub="Onboarding. Parchment unrolls open." />
              <StateSwatch mascot={Carto} mood="happy"    label="Happy"     sub="Quest done. Whole map bounces, X-marks shine." />
              <StateSwatch mascot={Carto} mood="sleep"    label="Rolled up" sub="Empty. Parchment rolls back into a tube." />
            </div>
          </window.DCArtboard>

          <window.DCArtboard id="carto-map-regions" label="Regions — your world map" width={500} height={520}>
            <CartoScene kind="regions" />
          </window.DCArtboard>

          <window.DCArtboard id="carto-map-unlock" label="Region unlocked" width={420} height={520}>
            <CartoScene kind="unlock" />
          </window.DCArtboard>

          <window.DCArtboard id="carto-map-detail" label="Quest detail — Carto traces the route" width={520} height={420}>
            <CartoScene kind="detail" />
          </window.DCArtboard>

          <window.DCArtboard id="carto-map-onboarding" label="Onboarding — unfurl your map" width={420} height={560}>
            <CartoScene kind="onboarding" />
          </window.DCArtboard>

          <window.DCArtboard id="carto-map-streak" label="Profile — your journey so far" width={460} height={440}>
            <CartoScene kind="streak" />
          </window.DCArtboard>
        </window.DCSection>

        {/* ── TAROT — playing-card alt take ─────────────────────────── */}
        <window.DCSection
          id="tarot"
          title="Tarot card (alt take)"
          subtitle="The earlier 'carte' interpretation, kept here as an alternative direction. Mascot is a flippable quest card — strong if you ever want a deck/draw mechanic.">

          <window.DCArtboard id="tarot-hero" label="Hero — Tarot card" width={420} height={520}>
            <div className="artboard-pad carto-hero">
              <Tarot size={200} title="THE TRAVELER" />
              <div className="caption">
                <div className="cap-name">Tarot</div>
                <div className="cap-idea">A living quest card. Flips to reveal what's next. Stacks into a 'hand' for today's quests.</div>
                <div className="cap-traits">
                  <span className="trait">Doubles as UI</span>
                  <span className="trait">Tarot energy</span>
                  <span className="trait">Stackable</span>
                </div>
              </div>
            </div>
          </window.DCArtboard>

          <window.DCArtboard id="tarot-states" label="Six animation states" width={1080} height={380}>
            <div className="state-grid">
              <StateSwatch mascot={Tarot} mood="idle"      label="Idle"      sub="Card sways. Eyes blink slowly." />
              <StateSwatch mascot={Tarot} mood="seeking"   label="Drawing"   sub="Card lifts toward you, eyes wide." />
              <StateSwatch mascot={Tarot} mood="flip"      label="Flip"      sub="Signature. Card rotates to reveal back." />
              <StateSwatch mascot={Tarot} mood="happy"     label="Happy"     sub="Quest complete. Bounces, blush, squint." />
              <StateSwatch mascot={Tarot} mood="celebrate" label="Celebrate" sub="Level up. Wobble + rays around the gem." />
              <StateSwatch mascot={Tarot} mood="sleep"     label="Folded"    sub="Empty inbox. Card folds in half." />
            </div>
          </window.DCArtboard>

          <window.DCArtboard id="tarot-stack" label="Today — fanned hand of cards" width={460} height={520}>
            <TarotScene kind="stack" />
          </window.DCArtboard>

          <window.DCArtboard id="tarot-flip" label="Quest complete — flip to next" width={420} height={520}>
            <TarotScene kind="flip" />
          </window.DCArtboard>

          <window.DCArtboard id="tarot-detail" label="Quest detail" width={460} height={520}>
            <TarotScene kind="detail" />
          </window.DCArtboard>

          <window.DCArtboard id="tarot-deck" label="Onboarding — draw a card" width={420} height={560}>
            <TarotScene kind="deck" />
          </window.DCArtboard>

          <window.DCArtboard id="tarot-inbox" label="Empty inbox — folded" width={380} height={460}>
            <TarotScene kind="inbox" />
          </window.DCArtboard>
        </window.DCSection>

        {/* ── SECTION 0.5 — LUME — fully developed ──────────────────── */}
        <window.DCSection
          id="lume-dev"
          title="Lume — compass spirit, developed"
          subtitle="Pushing the direction metaphor. Lume's signature move: she locks her needle onto your next quest. Eight animated states + five contexts that lean into the compass.">

          <window.DCArtboard id="lume-hero" label="Hero — meet Lume" width={420} height={520}>
            <div className="artboard-pad lume-hero">
              <Lume size={240} mood="seeking" />
              <div className="caption">
                <div className="cap-name">Lume</div>
                <div className="cap-idea">A floating compass-spirit whose needle locks onto what matters now. Useful, not just decorative — she actively points the way.</div>
                <div className="cap-traits">
                  <span className="trait">Direction = utility</span>
                  <span className="trait">Calm</span>
                  <span className="trait">Diegetic UI</span>
                </div>
              </div>
            </div>
          </window.DCArtboard>

          <window.DCArtboard id="lume-states" label="Eight animation states" width={1280} height={380}>
            <div className="state-grid state-grid-8">
              <StateSwatch mascot={Lume} mood="idle"      label="Idle"       sub="Gentle bob. Needle wobbles seeking." />
              <StateSwatch mascot={Lume} mood="seeking"   label="Seeking"    sub="Active. Needle scans 360°, eyes wide." />
              <StateSwatch mascot={Lume} mood="direct"    label="Locked"     sub="Needle locks on a target. Subtle pulse." />
              <StateSwatch mascot={Lume} mood="calibrate" label="Calibrate"  sub="Onboarding. Needle wobbles, settles." />
              <StateSwatch mascot={Lume} mood="happy"     label="Happy"      sub="Quest done. Bounce + quick spin." />
              <StateSwatch mascot={Lume} mood="celebrate" label="Celebrate"  sub="Level up. Wisps orbit, rays burst." />
              <StateSwatch mascot={Lume} mood="sleep"     label="Sleep"      sub="Empty inbox. Eyes shut, needle drifts." />
              <StateSwatch mascot={Lume} mood="sad"       label="Lost"       sub="Overdue. Needle droops downward." />
            </div>
          </window.DCArtboard>

          <window.DCArtboard id="lume-finder" label="“Where to next?” — quest finder" width={460} height={520}>
            <LumeScene kind="finder" />
          </window.DCArtboard>

          <window.DCArtboard id="lume-header" label="Today header — compass of the day" width={460} height={420}>
            <LumeScene kind="header" />
          </window.DCArtboard>

          <window.DCArtboard id="lume-calibrate" label="Onboarding — calibration step" width={420} height={560}>
            <LumeScene kind="calibrate" />
          </window.DCArtboard>

          <window.DCArtboard id="lume-levelup" label="Level-up moment" width={460} height={520}>
            <LumeScene kind="levelup" />
          </window.DCArtboard>

          <window.DCArtboard id="lume-sidebar" label="Sidebar — Lume points home" width={300} height={460}>
            <LumeScene kind="sidebar" />
          </window.DCArtboard>
        </window.DCSection>

        {/* ── SECTION 00 — TORTU (turtle, requested) ────────────────── */}
        <window.DCSection
          id="tortu"
          title="Tortu — the gem-back turtle"
          subtitle="The shell IS the Questify logo, domed. Slow but steady — the literal embodiment of 'your to-do list, reframed as a journey'. Six animated states + four in-app moments.">

          <window.DCArtboard id="tortu-hero" label="Hero — meet Tortu" width={420} height={520}>
            <div className="artboard-pad tortu-hero">
              <Tortu size={260} />
              <div className="caption">
                <div className="cap-name">Tortu</div>
                <div className="cap-idea">A chibi turtle whose faceted shell is the cut-gem logo. Tucks its head in when you go inactive. Grows shell sparkles with your level.</div>
                <div className="cap-traits">
                  <span className="trait">On-brand: 10/10</span>
                  <span className="trait">Slow-and-steady</span>
                  <span className="trait">Iconic silhouette</span>
                </div>
              </div>
            </div>
          </window.DCArtboard>

          <window.DCArtboard id="tortu-states" label="Animation states" width={1080} height={380}>
            <div className="state-grid">
              <StateSwatch mascot={Tortu} mood="idle"      label="Idle"      sub="Slow breathing + blink. Shell shimmers." />
              <StateSwatch mascot={Tortu} mood="walk"      label="Walking"   sub="Legs alternate, body sways. Active state." />
              <StateSwatch mascot={Tortu} mood="happy"     label="Happy"     sub="Quest complete. Bounces, eyes squint." />
              <StateSwatch mascot={Tortu} mood="celebrate" label="Celebrate" sub="Level up. Rays burst around shell." />
              <StateSwatch mascot={Tortu} mood="sleep"     label="Tucked in" sub="Empty inbox. Head retreats into shell." />
              <StateSwatch mascot={Tortu} mood="sad"       label="Sad"       sub="Overdue quest. Droop, smaller smile." />
            </div>
          </window.DCArtboard>

          <window.DCArtboard id="tortu-toast" label="Quest complete toast" width={380} height={420}>
            <ContextPreview mascot={Tortu} scene="toast" />
          </window.DCArtboard>

          <window.DCArtboard id="tortu-empty" label="Empty inbox" width={380} height={420}>
            <ContextPreview mascot={Tortu} scene="inbox-empty" />
          </window.DCArtboard>

          <window.DCArtboard id="tortu-levelup" label="Level-up moment" width={380} height={420}>
            <ContextPreview mascot={Tortu} scene="levelup" />
          </window.DCArtboard>

          <window.DCArtboard id="tortu-sidebar" label="As avatar" width={300} height={420}>
            <ContextPreview mascot={Tortu} scene="sidebar" />
          </window.DCArtboard>
        </window.DCSection>

        {/* ── SECTION 0 — Cuter directions ──────────────────────────── */}
        <window.DCSection
          id="cute"
          title="Cuter directions"
          subtitle="Chibi proportions, huge eyes, permanent blush. Built to make you smile when you tap a quest — and feel a tiny pang when you skip one.">

          <window.DCArtboard id="gemmi" label="E · Gemmi — chibi gem" width={320} height={420}>
            <div className="artboard-pad">
              <Gemmi size={170} />
              <Caption
                name="Gemmi"
                idea="The logo, but huggable. Same cut-gem silhouette with a wide chibi face and waving stub arms."
                traits={['Most on-brand', 'Genderless', 'Squishy']} />
            </div>
          </window.DCArtboard>

          <window.DCArtboard id="sprig" label="F · Sprig — the gem-sapling" width={320} height={420}>
            <div className="artboard-pad">
              <Sprig size={170} />
              <Caption
                name="Sprig"
                idea="A little sprout with a violet gem for a leaf. Grows new leaves as you level — the journey, made visible."
                traits={['Grows over time', 'Soft', 'Story-rich']} />
            </div>
          </window.DCArtboard>

          <window.DCArtboard id="quibbi" label="G · Quibbi — the questling" width={320} height={420}>
            <div className="artboard-pad">
              <Quibbi size={170} />
              <Caption
                name="Quibbi"
                idea="A tiny adventurer in a floppy wizard hat with a gem badge. Wholesome RPG cousin."
                traits={['Story-forward', 'Personable', 'Hat = customizable']} />
            </div>
          </window.DCArtboard>

          <window.DCArtboard id="pomu" label="H · Pomu — fluffy companion" width={320} height={420}>
            <div className="artboard-pad">
              <Pomu size={170} />
              <Caption
                name="Pomu"
                idea="A round puff with ear-tufts cradling the gem. The pet you didn't know you needed."
                traits={['Maximum cute', 'Pet-energy', 'Holds the gem']} />
            </div>
          </window.DCArtboard>
        </window.DCSection>

        {/* ── SECTION 1 — Original concepts ─────────────────────────── */}
        <window.DCSection
          id="concepts"
          title="Original concepts (geometric)"
          subtitle="More restrained, more 'design system'. Less personality but ages better. Kept for comparison.">

          <window.DCArtboard id="quill" label="A · Quill — the living gem" width={320} height={420}>
            <div className="artboard-pad">
              <Quill size={170} />
              <Caption
                name="Quill"
                idea="The logo, alive. A faceted gem with a face on its front facet."
                traits={['On-brand: 10/10', 'Genderless', 'Geometric']} />
            </div>
          </window.DCArtboard>

          <window.DCArtboard id="pip" label="B · Pip — hooded traveler" width={320} height={420}>
            <div className="artboard-pad">
              <Pip size={170} />
              <Caption
                name="Pip"
                idea="A tiny RPG explorer with a glowing-eyed hood and a quest scroll."
                traits={['Story-forward', 'Warm', 'Anthropomorphic']} />
            </div>
          </window.DCArtboard>

          <window.DCArtboard id="lume" label="C · Lume — compass spirit" width={320} height={420}>
            <div className="artboard-pad">
              <Lume size={170} />
              <Caption
                name="Lume"
                idea="A floating compass — its needle spins toward your next quest."
                traits={['Direction metaphor', 'Useful', 'Calm']} />
            </div>
          </window.DCArtboard>

          <window.DCArtboard id="spark" label="D · Spark — the wisp" width={320} height={420}>
            <div className="artboard-pad">
              <Spark size={170} />
              <Caption
                name="Spark"
                idea="A leader gem trailing smaller diamonds — pure motion, abstract energy."
                traits={['Subtle', 'Celebration-first', 'Less character']} />
            </div>
          </window.DCArtboard>
        </window.DCSection>

        {/* ── SECTION 2 — Quill's emotional states ──────────────────── */}
        <window.DCSection
          id="states"
          title="Quill — full animation set"
          subtitle="My pick. Six animated states cover every key moment in the app. Built from the gem primitive — no illustration debt.">

          <window.DCArtboard id="states-grid" label="Animation states" width={1080} height={380}>
            <div className="state-grid">
              <StateSwatch mascot={Quill} mood="idle"      label="Idle"      sub="Gentle hover + slow blink. Default." />
              <StateSwatch mascot={Quill} mood="happy"     label="Happy"     sub="Quest complete. Bounce, blush, squint." />
              <StateSwatch mascot={Quill} mood="celebrate" label="Celebrate" sub="Level up. Rays burst, body spins." />
              <StateSwatch mascot={Quill} mood="think"     label="Thinking"  sub="Loading state. Sway + dots above." />
              <StateSwatch mascot={Quill} mood="sleep"     label="Sleep"     sub="Empty inbox. Eyes shut, Zzz drift." />
              <StateSwatch mascot={Quill} mood="sad"       label="Disappointed" sub="Overdue quest. Slight droop, no bounce." />
            </div>
          </window.DCArtboard>
        </window.DCSection>

        {/* ── SECTION 3 — In context ────────────────────────────────── */}
        <window.DCSection
          id="context"
          title="In context"
          subtitle="How Quill shows up across the app — small in the chrome, big at moments that matter.">

          <window.DCArtboard id="ctx-toast" label="Quest complete toast" width={380} height={420}>
            <ContextPreview mascot={Quill} scene="toast" />
          </window.DCArtboard>

          <window.DCArtboard id="ctx-empty" label="Empty inbox" width={380} height={420}>
            <ContextPreview mascot={Quill} scene="inbox-empty" />
          </window.DCArtboard>

          <window.DCArtboard id="ctx-levelup" label="Level-up moment" width={380} height={420}>
            <ContextPreview mascot={Quill} scene="levelup" />
          </window.DCArtboard>

          <window.DCArtboard id="ctx-sidebar" label="As avatar" width={300} height={420}>
            <ContextPreview mascot={Quill} scene="sidebar" />
          </window.DCArtboard>
        </window.DCSection>

      </window.DesignCanvas>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
