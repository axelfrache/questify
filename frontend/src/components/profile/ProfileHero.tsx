import { Link } from 'react-router-dom';
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
  const initials = username.charAt(0).toUpperCase() || '?';
  const trimmedBio = bio?.trim();
  const xpToNextLevel = Math.max(nextLevelXp - currentLevelXp, 0);

  return (
    <section className="relative overflow-hidden rounded-[calc(var(--radius)+8px)] border border-border/70 bg-card/92 px-5 py-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:px-7 sm:py-7 dark:shadow-[0_22px_44px_rgba(0,0,0,0.34)]">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,transparent_55%,theme(colors.background/72))]" />
      <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_top_right,theme(colors.primary/10),transparent_55%)] lg:block" />
      <div className="relative space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4 sm:gap-5">
            <Avatar className="h-20 w-20 shrink-0 border border-primary/20 text-3xl sm:h-24 sm:w-24 sm:text-4xl">
              <AvatarImage src={profilePictureUrl || undefined} alt={username} />
              <AvatarFallback className="bg-primary/90 text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 space-y-3">
              <div className="space-y-3">
                <h1 className="truncate text-3xl font-semibold tracking-tight sm:text-4xl">
                  {username}
                </h1>
                <div className="inline-flex min-h-8 items-stretch overflow-hidden rounded-xl border border-border/70 bg-background/80 shadow-sm">
                  <span className="inline-flex items-center bg-primary/[0.12] px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                    Level {level}
                  </span>
                  <span className="w-px bg-border/70" />
                  <span className="inline-flex items-center px-3 text-sm font-medium text-foreground">
                    {gradeLabel}
                  </span>
                </div>
              </div>

              {trimmedBio ? (
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-[15px]">
                  {trimmedBio}
                </p>
              ) : null}
            </div>
          </div>

          <Button asChild variant="ghost" size="sm" className="shrink-0">
            <Link to="/settings">
              <Pencil className="h-4 w-4" />
              Edit profile
            </Link>
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
          <div className="inline-flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="font-medium text-foreground">{totalXp.toLocaleString()}</span>
            <span className="text-muted-foreground">total XP</span>
          </div>
          <div className="inline-flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-medium text-foreground">{currentStreak}</span>
            <span className="text-muted-foreground">day streak</span>
          </div>
          <div className="inline-flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <span className="font-medium text-foreground">{totalCompleted}</span>
            <span className="text-muted-foreground">quests done</span>
          </div>
        </div>

        <div className="space-y-3 border-t border-border/60 pt-4">
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-muted-foreground">XP progression</span>
            <span className="font-medium text-foreground">
              {currentLevelXp.toLocaleString()} / {nextLevelXp.toLocaleString()} XP
            </span>
          </div>
          <Progress value={progressPercent} className="h-3.5 rounded-full bg-primary/10" />
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <span className={progressPercent >= 100 ? 'font-medium text-primary' : 'text-muted-foreground'}>
              {Math.round(progressPercent)}% completed
            </span>
            <span className="inline-flex items-center gap-1 font-medium text-foreground">
              <ArrowUpRight className="h-4 w-4 text-primary" />
              {xpToNextLevel.toLocaleString()} XP to next level
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
