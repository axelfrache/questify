export function TodayPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Today's Path</h1>
        <p className="text-muted-foreground">Take one step at a time.</p>
      </div>
      <div className="h-2 w-full rounded-full bg-muted">
        <div className="h-2 w-1/3 rounded-full bg-primary" />
      </div>
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Planned</h2>
          <div className="rounded-lg border p-4 text-muted-foreground">
            No quests planned for today.
          </div>
        </div>
        <div>
          <h2 className="text-lg font-semibold">Completed</h2>
          <div className="rounded-lg border p-4 text-muted-foreground">Nothing completed yet.</div>
        </div>
      </div>
    </div>
  );
}
