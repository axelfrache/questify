import { useEffect, useMemo, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  useCreateProject,
  useDeleteProject,
  usePinProject,
  queryKeys,
  useProjectsList,
  useUnpinProject,
  useUpdateProject,
} from '@/hooks/use-api';
import { api, type ProjectSummaryResponse, type QuestResponse } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmojiPicker } from '@/components/EmojiPicker';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateQuestDialog } from '@/components/CreateQuestDialog';
import {
  Archive,
  ArchiveRestore,
  Clock3,
  FolderOpen,
  ListTodo,
  MoreHorizontal,
  Plus,
  Search,
  Star,
  StarOff,
  AlertTriangle,
  Pencil,
} from 'lucide-react';

type SortMode = 'updated' | 'name' | 'quests';

interface ProjectCardStats {
  questCount: number;
  urgentCount: number;
}

interface ProjectsSectionProps {
  title: string;
  description: string;
  projects: ProjectSummaryResponse[];
  emptyMessage?: string;
  onOpen: (projectId: string) => void;
  onAddQuest: (project: ProjectSummaryResponse) => void;
  onTogglePin: (projectId: string, pinned: boolean) => void;
  onEdit: (project: ProjectSummaryResponse) => void;
  onToggleArchive: (projectId: string, archived: boolean) => void;
  onDelete: (project: ProjectSummaryResponse) => void;
  statsByProjectId: Record<string, ProjectCardStats | undefined>;
}

interface ProjectCardProps {
  project: ProjectSummaryResponse;
  stats?: ProjectCardStats;
  onOpen: () => void;
  onAddQuest: () => void;
  onTogglePin: () => void;
  onEdit: () => void;
  onToggleArchive: () => void;
  onDelete: () => void;
}

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectToEdit?: ProjectSummaryResponse | null;
  initialName?: string;
}

export function ProjectsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortMode>('updated');
  const [includeArchived, setIncludeArchived] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<ProjectSummaryResponse | null>(null);
  const [quickCreateProject, setQuickCreateProject] = useState<ProjectSummaryResponse | null>(null);
  const [createPrefillName, setCreatePrefillName] = useState('');
  const backendSort = sort === 'name' ? 'name' : 'recent';

  const { data: projects, isLoading } = useProjectsList(search, backendSort, includeArchived);
  const pinProject = usePinProject();
  const unpinProject = useUnpinProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  const projectList = useMemo(() => projects ?? [], [projects]);
  const normalizedSearch = search.trim().toLowerCase();

  const statsQueries = useQueries({
    queries: projectList.map((project) => ({
      queryKey: queryKeys.quests.project(project.id),
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        api.getQuests(undefined, undefined, signal, project.id),
      staleTime: 60_000,
    })),
  });

  const statsByProjectId = useMemo<Record<string, ProjectCardStats | undefined>>(() => {
    const entries = projectList.map((project, index) => {
      const query = statsQueries[index];
      const quests = query?.data as QuestResponse[] | undefined;
      if (!quests) {
        return [project.id, undefined] as const;
      }
      const urgentCount = quests.filter((quest) => isUrgentQuest(quest)).length;
      return [
        project.id,
        {
          questCount: quests.length,
          urgentCount,
        },
      ] as const;
    });
    return Object.fromEntries(entries);
  }, [projectList, statsQueries]);

  const sortedProjects = useMemo(() => {
    const result = [...projectList];

    result.sort((a, b) => {
      if (sort === 'name') {
        return a.name.localeCompare(b.name);
      }

      if (sort === 'quests') {
        const questDelta =
          (statsByProjectId[b.id]?.questCount ?? 0) - (statsByProjectId[a.id]?.questCount ?? 0);
        if (questDelta !== 0) return questDelta;
      }

      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    return result;
  }, [projectList, sort, statsByProjectId]);

  const pinnedProjects = useMemo(
    () => sortedProjects.filter((project) => project.pinned),
    [sortedProjects]
  );
  const regularProjects = useMemo(
    () => sortedProjects.filter((project) => !project.pinned),
    [sortedProjects]
  );
  const hasProjects = projectList.length > 0;
  const hasSearch = normalizedSearch.length > 0;
  const canCreateFromSearch =
    hasSearch && !projectList.some((project) => project.name.toLowerCase() === normalizedSearch);

  const handleTogglePin = (id: string, pinned: boolean) => {
    if (pinned) {
      unpinProject.mutate(id);
      return;
    }
    pinProject.mutate(id);
  };

  const handleToggleArchive = (id: string, archived: boolean) => {
    updateProject.mutate({ id, data: { archived: !archived } });
  };

  const handleCreateFromSearch = () => {
    setCreatePrefillName(search.trim());
    setIsCreateOpen(true);
  };

  const handleDeleteProject = (project: ProjectSummaryResponse) => {
    if (
      !confirm(
        `Delete project "${project.name}"? This will also delete all quests associated with it.`
      )
    ) {
      return;
    }

    deleteProject.mutate(project.id);
  };

  return (
    <div className="space-y-8 pb-10">
      <header className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
              {hasProjects && <Badge variant="outline">{projectList.length}</Badge>}
            </div>
            <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
              Organize long-running initiatives, keep important projects pinned, and jump straight
              into the next quest that matters.
            </p>
          </div>

          <Button onClick={() => setIsCreateOpen(true)} className="gap-2 self-start lg:self-auto">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>
      </header>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search projects by name or description..."
            className="pl-9"
            aria-label="Search projects"
          />
        </div>

        <Select value={sort} onValueChange={(value) => setSort(value as SortMode)}>
          <SelectTrigger aria-label="Sort projects" className="w-[190px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="updated">Recently updated</SelectItem>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="quests">Most quests</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Switch
            checked={includeArchived}
            onCheckedChange={setIncludeArchived}
            id="show-archived"
          />
          <Label htmlFor="show-archived" className="cursor-pointer text-sm text-muted-foreground">
            Show archived
          </Label>
        </div>

        <div className="text-sm text-muted-foreground">{sortedProjects.length} visible</div>
      </div>

      <Separator className="mt-6" />

      {isLoading ? (
        <ProjectsGridSkeleton />
      ) : !hasProjects ? (
        <ProjectsEmptyState onCreate={() => setIsCreateOpen(true)} />
      ) : sortedProjects.length === 0 ? (
        <ProjectsNoResultsState
          search={search}
          onCreate={canCreateFromSearch ? handleCreateFromSearch : undefined}
        />
      ) : (
        <div className="space-y-8">
          {pinnedProjects.length > 0 && (
            <ProjectsSection
              title="Pinned Projects"
              description="Your quickest access list for active initiatives."
              projects={pinnedProjects}
              onOpen={(projectId) => navigate(`/projects/${projectId}`)}
              onAddQuest={setQuickCreateProject}
              onTogglePin={handleTogglePin}
              onEdit={setProjectToEdit}
              onToggleArchive={handleToggleArchive}
              onDelete={handleDeleteProject}
              statsByProjectId={statsByProjectId}
            />
          )}

          <ProjectsSection
            title="All Projects"
            description={
              pinnedProjects.length > 0
                ? 'Everything else, ordered for fast scanning.'
                : 'A complete overview of your current initiatives.'
            }
            projects={pinnedProjects.length > 0 ? regularProjects : sortedProjects}
            emptyMessage={
              pinnedProjects.length > 0
                ? 'All visible projects are already pinned.'
                : 'No projects match the current filters.'
            }
            onOpen={(projectId) => navigate(`/projects/${projectId}`)}
            onAddQuest={setQuickCreateProject}
            onTogglePin={handleTogglePin}
            onEdit={setProjectToEdit}
            onToggleArchive={handleToggleArchive}
            onDelete={handleDeleteProject}
            statsByProjectId={statsByProjectId}
          />
        </div>
      )}

      <CreateProjectDialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) {
            setCreatePrefillName('');
          }
        }}
        initialName={createPrefillName}
      />

      <CreateProjectDialog
        open={!!projectToEdit}
        onOpenChange={(open) => !open && setProjectToEdit(null)}
        projectToEdit={projectToEdit}
      />

      <CreateQuestDialog
        open={!!quickCreateProject}
        onOpenChange={(open) => !open && setQuickCreateProject(null)}
        projectId={quickCreateProject?.id}
      />
    </div>
  );
}

function ProjectsSection({
  title,
  description,
  projects,
  emptyMessage,
  onOpen,
  onAddQuest,
  onTogglePin,
  onEdit,
  onToggleArchive,
  onDelete,
  statsByProjectId,
}: ProjectsSectionProps) {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          <Badge variant="outline">{projects.length}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/70 px-5 py-8 text-sm text-muted-foreground">
          {emptyMessage}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              stats={statsByProjectId[project.id]}
              onOpen={() => onOpen(project.id)}
              onAddQuest={() => onAddQuest(project)}
              onTogglePin={() => onTogglePin(project.id, project.pinned)}
              onEdit={() => onEdit(project)}
              onToggleArchive={() => onToggleArchive(project.id, project.archived)}
              onDelete={() => onDelete(project)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function ProjectCard({
  project,
  stats,
  onOpen,
  onAddQuest,
  onTogglePin,
  onEdit,
  onToggleArchive,
  onDelete,
}: ProjectCardProps) {
  const updatedLabel = formatRelativeProjectUpdate(project.updatedAt);
  const trimmedDescription = project.description?.trim();
  const hasDescription = Boolean(trimmedDescription);

  return (
    <Card
      className={cn(
        'group overflow-hidden border-border/70 bg-card/70 shadow-sm transition-all duration-200',
        'hover:border-primary/30 hover:shadow-lg',
        project.pinned && 'border-primary/30 bg-primary/[0.04]'
      )}
    >
      <CardContent className="flex h-full flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted/40 text-2xl">
                {project.icon || '📁'}
              </span>
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-lg font-semibold leading-tight text-foreground">
                    {project.name}
                  </h3>
                  {project.pinned && (
                    <Badge
                      variant="outline"
                      className="border-primary/30 bg-primary/10 text-primary"
                    >
                      <Star className="h-3 w-3 fill-current" />
                      Pinned
                    </Badge>
                  )}
                  {project.archived && <Badge variant="outline">Archived</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">
                  {project.archived ? 'Archived project' : 'Active project'}
                </p>
              </div>
            </div>

            <div className="min-h-[2.75rem]">
              {hasDescription && (
                <p className="line-clamp-2 text-sm leading-5 text-muted-foreground">
                  {trimmedDescription}
                </p>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 opacity-70 transition-opacity hover:opacity-100 focus-visible:opacity-100"
                aria-label={`More actions for ${project.name}`}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onToggleArchive}>
                {project.archived ? (
                  <>
                    <ArchiveRestore className="mr-2 h-4 w-4" />
                    Restore
                  </>
                ) : (
                  <>
                    <Archive className="mr-2 h-4 w-4" />
                    Archive
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onDelete}
                className="text-destructive focus:text-destructive"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground">
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background/50 px-3 py-2.5">
            <span className="flex items-center gap-2">
              <ListTodo className="h-4 w-4 text-muted-foreground/80" />
              <span>Quests</span>
            </span>
            <span className="font-medium text-foreground">
              {stats
                ? `${stats.questCount} ${stats.questCount === 1 ? 'quest' : 'quests'}`
                : 'Loading...'}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background/50 px-3 py-2.5">
            <span className="flex min-w-0 items-center gap-2">
              <Clock3 className="h-4 w-4 text-muted-foreground/80" />
              <span className="truncate">Updated</span>
            </span>
            <span className="shrink-0 whitespace-nowrap text-right text-xs sm:text-sm">
              {updatedLabel}
            </span>
          </div>
        </div>

        <div className="min-h-6">
          {stats ? (
            stats.urgentCount > 0 ? (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                {stats.urgentCount} urgent
              </Badge>
            ) : (
              <span className="text-xs text-muted-foreground">No urgent quests right now</span>
            )
          ) : (
            <span className="text-xs text-muted-foreground">Loading project activity…</span>
          )}
        </div>

        <div className="mt-auto grid grid-cols-2 gap-2 pt-1">
          <Button onClick={onOpen} className="gap-2">
            <FolderOpen className="h-4 w-4" />
            Open
          </Button>
          <Button
            variant="outline"
            onClick={onAddQuest}
            className="gap-2"
            disabled={project.archived}
            aria-label={`Add quest to ${project.name}`}
          >
            <Plus className="h-4 w-4" />
            Add quest
          </Button>
          <Button variant="outline" onClick={onTogglePin} className="col-span-2 gap-2">
            {project.pinned ? (
              <>
                <StarOff className="h-4 w-4" />
                Unpin
              </>
            ) : (
              <>
                <Star className="h-4 w-4" />
                Pin
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ProjectsGridSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className="h-[280px] rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function ProjectsEmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <Card className="border-dashed border-border/70 bg-card/50">
      <CardHeader className="items-center text-center">
        <CardTitle>No projects yet</CardTitle>
        <CardDescription className="max-w-md">
          Projects help you group related quests into longer initiatives so you can plan and review
          bigger goals without losing daily momentum.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center pb-6">
        <Button onClick={onCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Create your first project
        </Button>
      </CardContent>
    </Card>
  );
}

function ProjectsNoResultsState({ search, onCreate }: { search: string; onCreate?: () => void }) {
  return (
    <Card className="border-dashed border-border/70 bg-card/50">
      <CardHeader className="items-center text-center">
        <CardTitle>No projects found</CardTitle>
        <CardDescription className="max-w-md">
          No project matches <span className="font-medium text-foreground">"{search.trim()}"</span>.
          Try another search or create a new project if this looks like a fresh initiative.
        </CardDescription>
      </CardHeader>
      {onCreate && (
        <CardContent className="flex justify-center pb-6">
          <Button onClick={onCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Create "{search.trim()}"
          </Button>
        </CardContent>
      )}
    </Card>
  );
}

function CreateProjectDialog({
  open,
  onOpenChange,
  projectToEdit,
  initialName,
}: CreateProjectDialogProps) {
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📁');
  const [description, setDescription] = useState('');

  const isEditMode = !!projectToEdit;
  const isPending = createProject.isPending || updateProject.isPending;
  const isDisabled = !name.trim() || isPending;

  useEffect(() => {
    if (open) {
      setName(projectToEdit?.name ?? initialName ?? '');
      setIcon(projectToEdit?.icon ?? '📁');
      setDescription(projectToEdit?.description ?? '');
    }
  }, [open, projectToEdit, initialName]);

  const handleSubmit = () => {
    if (!name.trim()) return;

    if (projectToEdit) {
      updateProject.mutate(
        {
          id: projectToEdit.id,
          data: {
            name: name.trim(),
            icon: icon.trim() || '📁',
            description: description.trim(),
          },
        },
        {
          onSuccess: () => {
            onOpenChange(false);
          },
        }
      );
      return;
    }

    createProject.mutate(
      {
        name: name.trim(),
        icon: icon.trim() || '📁',
        description: description.trim() || undefined,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setName('');
      setIcon('📁');
      setDescription('');
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Project' : 'Create Project'}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update the project details shown across the app.'
              : 'Add a project for grouped quests and longer initiatives.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="project-name">Name</Label>
            <Input
              id="project-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Launch new portfolio"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Icon</Label>
            <EmojiPicker value={icon} onChange={setIcon} regionName={name} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="project-description">Description</Label>
            <Input
              id="project-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={2000}
              placeholder="Short summary or focus area"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isDisabled}>
            {isEditMode ? 'Save changes' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function isUrgentQuest(quest: QuestResponse) {
  if (quest.status !== 'PENDING' || !quest.dueDate) return false;
  const dueDate = new Date(quest.dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDay = new Date(dueDate);
  dueDay.setHours(0, 0, 0, 0);

  return dueDay.getTime() <= today.getTime();
}

function formatRelativeProjectUpdate(updatedAt: string) {
  const diffMs = Date.now() - new Date(updatedAt).getTime();
  const diffSeconds = Math.max(0, Math.floor(diffMs / 1000));

  if (diffSeconds < 60) {
    return 'now';
  }

  const units = [
    { label: 'y', seconds: 60 * 60 * 24 * 365 },
    { label: 'mo', seconds: 60 * 60 * 24 * 30 },
    { label: 'd', seconds: 60 * 60 * 24 },
    { label: 'h', seconds: 60 * 60 },
    { label: 'm', seconds: 60 },
  ];

  for (const unit of units) {
    if (diffSeconds >= unit.seconds) {
      return `${Math.floor(diffSeconds / unit.seconds)}${unit.label} ago`;
    }
  }

  return 'now';
}
