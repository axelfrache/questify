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
import { useProjectsSidebar, useUserProgression } from '@/hooks/use-api';
import { useTranslation } from 'react-i18next';

const navItems = [
  { key: 'nav.inbox', url: '/inbox', icon: Inbox },
  { key: 'nav.today', url: '/today', icon: Sun },
  { key: 'nav.upcoming', url: '/upcoming', icon: Calendar },
  { key: 'nav.habits', url: '/habits', icon: Repeat },
  { key: 'nav.regions', url: '/regions', icon: Map },
];

const insightItems = [
  { key: 'nav.progress', url: '/progress', icon: TrendingUp },
  { key: 'nav.stats', url: '/stats', icon: BarChart3 },
  { key: 'nav.history', url: '/history', icon: History },
];

export function AppSidebar() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { data: projectSidebar } = useProjectsSidebar();
  const { data: progression } = useUserProgression(user?.id);
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
        {/* Header — user only */}
        <div className="px-3 py-3 border-b border-sidebar-border">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex w-full items-center gap-2.5 rounded-md px-1.5 py-1 outline-none hover:bg-sidebar-accent transition-colors">
              <Avatar className="h-6 w-6 flex-shrink-0">
                <AvatarImage src={user?.profilePictureUrl || undefined} alt={user?.username} />
                <AvatarFallback className="text-[10px]">
                  {user?.username ? getInitials(user.username) : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 text-left">
                <div className="text-[13px] font-medium leading-tight text-sidebar-foreground truncate">
                  {user?.username || 'User'}
                </div>
                {progression && (
                  <div className="font-mono text-[10px] text-sidebar-foreground/50 leading-tight">
                    {t('nav.level', { level: progression.level, grade: progression.gradeLabel })}
                  </div>
                )}
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-sidebar-foreground/40 flex-shrink-0" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem asChild>
                <Link to="/profile" className="cursor-pointer w-full flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>{t('nav.profile')}</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings" className="cursor-pointer w-full flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <span>{t('nav.settings')}</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="h-4 w-4 mr-2" />
                <span>{t('nav.logout')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{t(item.key)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <div className="flex items-center justify-between px-2">
            <SidebarGroupLabel className="p-0">{t('nav.projects')}</SidebarGroupLabel>
            <button
              type="button"
              onClick={() => setIsProjectsOpen((open) => !open)}
              className="rounded p-1 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              aria-label={isProjectsOpen ? t('nav.collapse_projects') : t('nav.expand_projects')}
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
                      <span>{t('nav.view_all')}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {sidebarProjects.length === 0 ? (
                  <SidebarMenuItem>
                    <div className="px-2 py-1 text-xs text-sidebar-foreground/60">
                      {t('nav.pin_projects')}
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
          <SidebarGroupLabel>{t('nav.insights')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {insightItems.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{t(item.key)}</span>
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
                    <span>{t('admin.title')}</span>
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
