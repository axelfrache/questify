export function UpcomingPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">The Road Ahead</h1>
                <p className="text-muted-foreground">Your upcoming quests.</p>
            </div>
            <div className="rounded-lg border p-8 text-center text-muted-foreground">
                No upcoming quests scheduled.
            </div>
        </div>
    );
}
