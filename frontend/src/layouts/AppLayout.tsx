import { useState } from 'react';
import { Link, Outlet, useLocation, useMatch } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Plus, Zap } from 'lucide-react';
import { CreateQuestDialog } from '@/components/CreateQuestDialog';
import { LevelUpOverlay } from '@/components/LevelUpOverlay';
import { NotificationInbox } from '@/components/NotificationInbox';
import { GradeGem } from '@/components/ui/grade-badge';
import { useAuth } from '@/contexts/AuthContext';
import { useProjectDetail, useUserProgression } from '@/hooks/use-api';
import { useNotificationStream } from '@/hooks/useNotificationStream';

const PAGE_TITLE_KEYS: Record<string, string> = {
  '/inbox': 'nav.inbox',
  '/today': 'nav.today',
  '/upcoming': 'nav.upcoming',
  '/habits': 'nav.habits',
  '/regions': 'nav.regions',
  '/progress': 'nav.progress',
  '/stats': 'nav.stats',
  '/history': 'nav.history',
  '/projects': 'nav.projects',
  '/profile': 'nav.profile',
  '/settings': 'nav.settings',
};

function ProjectBreadcrumb({ projectId }: { projectId: string }) {
  const { t } = useTranslation();
  const { data: project } = useProjectDetail(projectId);
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/projects">{t('nav.projects')}</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{project?.name ?? '…'}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export function AppLayout() {
  const { t } = useTranslation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { user } = useAuth();
  const { data: progression } = useUserProgression(user?.id);
  const location = useLocation();
  const projectMatch = useMatch('/projects/:id');
  useNotificationStream();

  const titleKey = PAGE_TITLE_KEYS[location.pathname];
  const title = titleKey ? t(titleKey) : null;

  return (
    <SidebarProvider>
      <div className="flex h-svh w-full">
        <AppSidebar />
        <div className="flex flex-1 flex-col min-w-0">
          <header className="flex h-12 items-center gap-3 border-b bg-card px-4 sticky top-0 z-20">
            <SidebarTrigger className="h-8 w-8" />
            {projectMatch ? (
              <ProjectBreadcrumb projectId={projectMatch.params.id!} />
            ) : (
              title && (
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbPage>{title}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              )
            )}
            <div className="flex-1" />
            {progression && (
              <div className="flex items-center gap-2 rounded-full border border-border bg-muted/60 px-3 py-1">
                <Zap className="h-3 w-3 text-primary" />
                <span className="font-mono text-xs font-medium tabular-nums">
                  {progression.totalXp.toLocaleString()} XP
                </span>
                <span className="h-3 w-px bg-border" />
                <GradeGem grade={progression.gradeLabel} className="h-1.5 w-1.5" />
                <span className="text-[11px] text-muted-foreground">
                  {t('common.level_short', { level: progression.level })}
                </span>
              </div>
            )}
            <NotificationInbox />
          </header>
          <main className="flex-1 overflow-auto p-6">
            <Outlet />
          </main>
          <Button
            size="icon"
            className="fixed right-5 h-12 w-12 rounded-full shadow-lg z-50"
            style={{ bottom: 'max(1.5rem, calc(env(safe-area-inset-bottom) + 1rem))' }}
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus className="h-5 w-5" />
          </Button>
          <CreateQuestDialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
            onQuestCreated={() => {}}
          />
          <LevelUpOverlay />
        </div>
      </div>
    </SidebarProvider>
  );
}
