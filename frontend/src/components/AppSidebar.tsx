import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  Inbox,
  LogOut,
  Map,
  Settings,
  Sun,
  User,
  Repeat,
  TrendingUp,
  BarChart3,
  History,
  Shield,
  FolderKanban,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useProjectsSidebar } from '@/hooks/use-api';

const navItems = [
  { title: 'Inbox', url: '/inbox', icon: Inbox },
  { title: 'Today', url: '/today', icon: Sun },
  { title: 'Upcoming', url: '/upcoming', icon: Calendar },
  { title: 'Habits', url: '/habits', icon: Repeat },
  { title: 'Regions', url: '/regions', icon: Map },
];

const insightItems = [
  { title: 'Progress', url: '/progress', icon: TrendingUp },
  { title: 'Stats', url: '/stats', icon: BarChart3 },
  { title: 'History', url: '/history', icon: History },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { data: projectSidebar } = useProjectsSidebar();
  const [isProjectsOpen, setIsProjectsOpen] = useState(true);

  const isActive = (url: string) => location.pathname === url;
  const sidebarProjects = [...(projectSidebar?.pinned ?? []), ...(projectSidebar?.recent ?? [])];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Sidebar>
      <SidebarContent>
        <div className="px-4 py-4">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-3 outline-none">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.profilePictureUrl || undefined} alt={user?.username} />
                <AvatarFallback>{user?.username ? getInitials(user.username) : 'U'}</AvatarFallback>
              </Avatar>
              <span className="font-medium">{user?.username || 'User'}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem asChild>
                <Link to="/profile" className="cursor-pointer w-full flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings" className="cursor-pointer w-full flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer text-red-600 focus:text-red-600"
              >
                <LogOut className="h-4 w-4 mr-2" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <div className="flex items-center justify-between px-2">
            <SidebarGroupLabel className="p-0">Projects</SidebarGroupLabel>
            <button
              type="button"
              onClick={() => setIsProjectsOpen((open) => !open)}
              className="rounded p-1 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              aria-label={isProjectsOpen ? 'Collapse projects' : 'Expand projects'}
            >
              {isProjectsOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          </div>
          {isProjectsOpen && (
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location.pathname === '/projects'} size="sm">
                    <Link to="/projects" className="flex items-center gap-2">
                      <FolderKanban className="h-4 w-4" />
                      <span>View all</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {sidebarProjects.length === 0 ? (
                  <SidebarMenuItem>
                    <div className="px-2 py-1 text-xs text-sidebar-foreground/60">
                      Pin projects to access them here
                    </div>
                  </SidebarMenuItem>
                ) : (
                  sidebarProjects.map((project) => (
                    <SidebarMenuItem key={project.id}>
                      <SidebarMenuButton
                        asChild
                        isActive={location.pathname === `/projects/${project.id}`}
                        size="sm"
                      >
                        <Link to={`/projects/${project.id}`} className="flex items-center gap-2">
                          <span className="text-sm">{project.icon || '📁'}</span>
                          <span>{project.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          )}
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Insights</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {insightItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      {user?.role === 'ADMIN' && (
        <>
          <SidebarSeparator className="mx-0" />
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem key="Admin">
                <SidebarMenuButton asChild isActive={isActive('/admin')}>
                  <Link to="/admin" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>Admin</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </>
      )}
    </Sidebar>
  );
}
