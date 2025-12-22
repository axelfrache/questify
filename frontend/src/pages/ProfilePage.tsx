import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function ProfilePage() {
  const { user, logout } = useAuth();

  const getInitials = () => {
    if (user?.username) {
      return user.username.charAt(0).toUpperCase();
    }
    return user?.email?.charAt(0).toUpperCase() || '?';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-muted-foreground">Your account settings.</p>
      </div>
      <div className="rounded-lg border p-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 text-2xl">
            <AvatarImage src={user?.profilePictureUrl || undefined} alt={user?.username} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">{user?.username || 'Unknown'}</h3>
            <p className="text-sm text-muted-foreground">{user?.email || 'Unknown'}</p>
          </div>
        </div>
      </div>
      <Button variant="outline" onClick={logout}>
        Logout
      </Button>
    </div>
  );
}
