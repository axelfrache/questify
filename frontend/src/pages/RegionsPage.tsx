export function RegionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Regions</h1>
        <p className="text-muted-foreground">Your quest categories.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border p-6">
          <div className="text-2xl">🏃</div>
          <h3 className="mt-2 font-semibold">Fitness</h3>
          <p className="text-sm text-muted-foreground">Grade: Explorer</p>
          <div className="mt-2 h-2 w-full rounded-full bg-muted">
            <div className="h-2 w-2/5 rounded-full bg-primary" />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">12 / 30 Quests</p>
        </div>
        <div className="rounded-lg border p-6">
          <div className="text-2xl">💼</div>
          <h3 className="mt-2 font-semibold">Career</h3>
          <p className="text-sm text-muted-foreground">Grade: Novice</p>
          <div className="mt-2 h-2 w-full rounded-full bg-muted">
            <div className="h-2 w-1/6 rounded-full bg-primary" />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">2 / 30 Quests</p>
        </div>
      </div>
    </div>
  );
}
