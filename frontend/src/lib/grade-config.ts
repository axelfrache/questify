export interface GradeStyle {
  text: string;
  bg: string;
  border: string;
  solid: string;
  ring: string;
}

export const GRADE_STYLES: Record<string, GradeStyle> = {
  Flint: {
    text: 'text-grade-flint',
    bg: 'bg-grade-flint/10',
    border: 'border-grade-flint/30',
    solid: 'bg-grade-flint border-grade-flint',
    ring: 'ring-grade-flint/20',
  },
  Iron: {
    text: 'text-grade-iron',
    bg: 'bg-grade-iron/10',
    border: 'border-grade-iron/30',
    solid: 'bg-grade-iron border-grade-iron',
    ring: 'ring-grade-iron/20',
  },
  Gold: {
    text: 'text-grade-gold',
    bg: 'bg-grade-gold/10',
    border: 'border-grade-gold/30',
    solid: 'bg-grade-gold border-grade-gold',
    ring: 'ring-grade-gold/20',
  },
  Obsidian: {
    text: 'text-grade-obsidian',
    bg: 'bg-grade-obsidian/10',
    border: 'border-grade-obsidian/30',
    solid: 'bg-grade-obsidian border-grade-obsidian',
    ring: 'ring-grade-obsidian/20',
  },
  Sapphire: {
    text: 'text-grade-sapphire',
    bg: 'bg-grade-sapphire/10',
    border: 'border-grade-sapphire/30',
    solid: 'bg-grade-sapphire border-grade-sapphire',
    ring: 'ring-grade-sapphire/20',
  },
  Diamond: {
    text: 'text-grade-diamond',
    bg: 'bg-grade-diamond/10',
    border: 'border-grade-diamond/30',
    solid: 'bg-grade-diamond border-grade-diamond',
    ring: 'ring-grade-diamond/20',
  },
};

export const FALLBACK_GRADE_STYLE: GradeStyle = {
  text: 'text-primary',
  bg: 'bg-primary/10',
  border: 'border-primary/30',
  solid: 'bg-primary border-primary',
  ring: 'ring-primary/20',
};

export function gradeStyle(grade: string): GradeStyle {
  return GRADE_STYLES[grade] ?? FALLBACK_GRADE_STYLE;
}
