import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { gradeStyle } from '@/lib/grade-config';

interface GradeGemProps {
  grade: string;
  className?: string;
}

export function GradeGem({ grade, className }: GradeGemProps) {
  const style = gradeStyle(grade);
  return (
    <span
      aria-hidden
      className={cn('inline-block h-2 w-2 rotate-45 rounded-[2px] border', style.solid, className)}
    />
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
  const style = gradeStyle(grade);
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
      <span className={cn('font-semibold', style.text)}>{label ?? grade}</span>
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
