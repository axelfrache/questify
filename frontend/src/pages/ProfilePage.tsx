import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export function ProfilePage() {
    const { user, logout } = useAuth();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Profile</h1>
                <p className="text-muted-foreground">Your account settings.</p>
            </div>
            <div className="rounded-lg border p-6">
                <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl text-primary-foreground">
                        {user?.email?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div>
                        <h3 className="font-semibold">{user?.email || 'Unknown'}</h3>
                        <p className="text-sm text-muted-foreground">Explorer</p>
                    </div>
                </div>
            </div>
            <Button variant="outline" onClick={logout}>
                Logout
            </Button>
        </div>
    );
}
