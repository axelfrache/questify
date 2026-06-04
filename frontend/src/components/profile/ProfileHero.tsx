import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowUpRight, Pencil, Sparkles, Target, Zap } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface ProfileHeroProps {
  username: string;
  profilePictureUrl?: string | null;
  bio?: string | null;
  level: number;
  gradeLabel: string;
  totalXp: number;
  currentStreak: number;
  totalCompleted: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progressPercent: number;
}

export function ProfileHero({
  username,
  profilePictureUrl,
  bio,
  level,
  gradeLabel,
  totalXp,
  currentStreak,
  totalCompleted,
  currentLevelXp,
  nextLevelXp,
  progressPercent,
}: ProfileHeroProps) {
  const { t } = useTranslation();
  const initials = username.charAt(0).toUpperCase() || '?';
  const trimmedBio = bio?.trim();
  const xpToNextLevel = Math.max(nextLevelXp - currentLevelXp, 0);

  return (
    <section className="relative overflow-hidden rounded-lg border bg-card px-5 py-5 sm:px-6 sm:py-6">
      {/* Subtle radial accent */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(ellipse_at_top_right,theme(colors.primary/8),transparent_60%)]" />

      <div className="relative space-y-5">
        {/* Top row: avatar + identity + edit */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar className="h-16 w-16 shrink-0 border border-border text-2xl sm:h-20 sm:w-20 sm:text-3xl">
              <AvatarImage src={profilePictureUrl || undefined} alt={username} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 space-y-1.5">
              <h1 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">
                {username}
              </h1>
              <div className="inline-flex items-center gap-2 rounded-md border border-border/70 bg-muted/50 px-2.5 py-1 text-xs">
                <span className="font-semibold text-primary">Lvl {level}</span>
                <span className="h-3 w-px bg-border" />
                <span className="text-muted-foreground">{gradeLabel}</span>
              </div>
              {trimmedBio && (
                <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
                  {trimmedBio}
                </p>
              )}
            </div>
          </div>

          <Button asChild variant="ghost" size="sm" className="shrink-0">
            <Link to="/settings">
              <Pencil className="h-3.5 w-3.5" />
              {t('profile_hero.edit')}
            </Link>
          </Button>
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-md border border-border/50 bg-muted/30 px-4 py-3 text-sm">
          <div className="flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 text-primary" />
            <span className="font-mono font-medium">{totalXp.toLocaleString()}</span>
            <span className="text-muted-foreground">XP</span>
          </div>
          <span className="h-3 w-px bg-border" />
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="font-mono font-medium">{currentStreak}</span>
            <span className="text-muted-foreground">{t('profile_hero.day_streak')}</span>
          </div>
          <span className="h-3 w-px bg-border" />
          <div className="flex items-center gap-2">
            <Target className="h-3.5 w-3.5 text-primary" />
            <span className="font-mono font-medium">{totalCompleted}</span>
            <span className="text-muted-foreground">{t('profile_hero.quests_done')}</span>
          </div>
        </div>

        {/* XP progress */}
        <div className="space-y-2 border-t border-border/50 pt-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{t('profile_hero.xp_to_next')}</span>
            <span className="font-mono font-medium text-foreground">
              {currentLevelXp.toLocaleString()} / {nextLevelXp.toLocaleString()}
            </span>
          </div>
          <Progress value={progressPercent} className="h-2 rounded-full bg-muted/60" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{Math.round(progressPercent)}%</span>
            <span className="inline-flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3 text-primary" />
              {t('profile_hero.remaining', { xp: xpToNextLevel.toLocaleString() })}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
