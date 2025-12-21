export function ProgressPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Progress</h1>
        <p className="text-muted-foreground">Your journey so far.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border p-6 text-center">
          <div className="text-3xl font-bold">1250</div>
          <p className="text-sm text-muted-foreground">Total XP</p>
        </div>
        <div className="rounded-lg border p-6 text-center">
          <div className="text-3xl font-bold">5</div>
          <p className="text-sm text-muted-foreground">Level</p>
        </div>
        <div className="rounded-lg border p-6 text-center">
          <div className="text-3xl font-bold">Explorer</div>
          <p className="text-sm text-muted-foreground">Grade</p>
        </div>
      </div>
    </div>
  );
}
