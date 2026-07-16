import confetti from 'canvas-confetti';

function themeConfettiColors(): string[] {
  const styles = getComputedStyle(document.documentElement);
  return ['--primary', '--chart-5', '--xp-fg', '--accent-foreground', '--xp-border']
    .map((name) => styles.getPropertyValue(name).trim())
    .filter(Boolean);
}

export function fireConfettiFromElement(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;

  confetti({
    particleCount: 50,
    spread: 60,
    origin: {
      x: x / window.innerWidth,
      y: y / window.innerHeight,
    },
    colors: themeConfettiColors(),
    startVelocity: 25,
    gravity: 0.8,
    scalar: 0.9,
    ticks: 100,
  });
}

export function fireLevelUpConfetti() {
  const colors = themeConfettiColors();
  const defaults = { colors, ticks: 160, gravity: 0.9, zIndex: 120 };

  confetti({
    ...defaults,
    particleCount: 80,
    spread: 100,
    startVelocity: 35,
    origin: { x: 0.5, y: 0.4 },
  });
  confetti({
    ...defaults,
    particleCount: 40,
    angle: 60,
    spread: 60,
    startVelocity: 45,
    origin: { x: 0, y: 0.7 },
  });
  confetti({
    ...defaults,
    particleCount: 40,
    angle: 120,
    spread: 60,
    startVelocity: 45,
    origin: { x: 1, y: 0.7 },
  });
}
