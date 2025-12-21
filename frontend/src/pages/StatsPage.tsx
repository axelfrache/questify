export function StatsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Stats</h1>
        <p className="text-muted-foreground">Your activity breakdown.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border p-6">
          <h3 className="font-semibold">Today</h3>
          <div className="mt-2 text-2xl font-bold">3</div>
          <p className="text-sm text-muted-foreground">Quests completed</p>
          <p className="text-sm text-muted-foreground">+75 XP</p>
        </div>
        <div className="rounded-lg border p-6">
          <h3 className="font-semibold">This Week</h3>
          <div className="mt-2 text-2xl font-bold">12</div>
          <p className="text-sm text-muted-foreground">Quests completed</p>
          <p className="text-sm text-muted-foreground">+320 XP</p>
        </div>
        <div className="rounded-lg border p-6">
          <h3 className="font-semibold">This Month</h3>
          <div className="mt-2 text-2xl font-bold">45</div>
          <p className="text-sm text-muted-foreground">Quests completed</p>
          <p className="text-sm text-muted-foreground">+1150 XP</p>
        </div>
      </div>
    </div>
  );
}
