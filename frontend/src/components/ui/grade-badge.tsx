import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { gradeKey, gradeStyle } from '@/lib/grade-config';

interface GradeGemProps {
  grade: string;
  size?: number;
  className?: string;
}

export function GradeGem({ grade, size, className }: GradeGemProps) {
  const style = gradeStyle(grade);
  const gemStyle = {
    '--grade-gem-color': style.color,
    width: size,
    height: size,
  } as CSSProperties;

  return (
    <svg
      aria-hidden
      viewBox="0 0 96 96"
      className={cn('inline-block h-3 w-3 shrink-0 overflow-visible', className)}
      style={gemStyle}
    >
      <path d="M48 10 L86 48 L48 86 L10 48 Z" fill="var(--grade-gem-color)" />
      <path d="M48 10 L48 30 L10 48 Z" fill="#fff" fillOpacity="0.28" />
      <path d="M48 10 L86 48 L48 30 Z" fill="#fff" fillOpacity="0.14" />
      <path d="M48 30 L86 48 L48 86 Z" fill="#000" fillOpacity="0.1" />
      <path d="M48 30 L10 48 L48 86 Z" fill="#000" fillOpacity="0.04" />
    </svg>
  );
}

interface GradeBadgeProps {
  grade: string;
  label?: string;
  level?: number;
  className?: string;
}

export function GradeBadge({ grade, label, level, className }: GradeBadgeProps) {
  const { t } = useTranslation();
  const key = gradeKey(grade);
  const style = gradeStyle(grade);
  const gradeLabel = label ?? t('progress.grades.' + key, { defaultValue: grade });

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-xs',
        style.bg,
        style.border,
        className
      )}
    >
      <GradeGem grade={grade} />
      <span className={cn('font-semibold', style.text)}>{gradeLabel}</span>
      {level !== undefined && (
        <>
          <span className={cn('h-3 w-px opacity-30', style.solid)} />
          <span className="font-mono text-muted-foreground">
            {t('common.level_short', { level })}
          </span>
        </>
      )}
    </span>
  );
}
