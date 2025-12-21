export function MilestonesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Milestones</h1>
        <p className="text-muted-foreground">Your achievements.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border p-6 text-center">
          <div className="text-4xl">🎯</div>
          <h3 className="mt-2 font-semibold">The First Step</h3>
          <p className="text-sm text-muted-foreground">Complete your first quest</p>
          <p className="mt-2 text-xs text-primary">Unlocked!</p>
        </div>
        <div className="rounded-lg border p-6 text-center opacity-50">
          <div className="text-4xl">🔥</div>
          <h3 className="mt-2 font-semibold">Week Streak</h3>
          <p className="text-sm text-muted-foreground">Complete quests 7 days in a row</p>
          <p className="mt-2 text-xs text-muted-foreground">3/7 days</p>
        </div>
        <div className="rounded-lg border p-6 text-center opacity-50">
          <div className="text-4xl">🏆</div>
          <h3 className="mt-2 font-semibold">Monthly Master</h3>
          <p className="text-sm text-muted-foreground">Complete 30 quests in a month</p>
          <p className="mt-2 text-xs text-muted-foreground">15/30 quests</p>
        </div>
      </div>
    </div>
  );
}
