import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export function DashboardPage() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-4">
      <div className="text-4xl">🧭</div>
      <h1 className="text-2xl font-bold">Welcome, Explorer!</h1>
      <p className="text-muted-foreground">Logged in as {user?.email}</p>
      <Button variant="outline" onClick={handleLogout}>
        Logout
      </Button>
    </div>
  );
}
