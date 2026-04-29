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
import { EmojiPicker } from '@/components/EmojiPicker';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateQuestDialog } from '@/components/CreateQuestDialog';
import {
  Archive,
  ArchiveRestore,
  ArrowRight,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Star,
  StarOff,
  ListFilter,
} from 'lucide-react';
import { DropdownMenuContent as SortMenuContent } from '@/components/ui/dropdown-menu';

type SortMode = 'updated' | 'name' | 'quests';

const SORT_LABELS: Record<SortMode, string> = {
  updated: 'Recently updated',
  name: 'Name',
  quests: 'Most quests',
};

interface ProjectCardStats {
  questCount: number;
  completedCount: number;
  urgentCount: number;
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
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<ProjectSummaryResponse | null>(null);
  const [quickCreateProject, setQuickCreateProject] = useState<ProjectSummaryResponse | null>(null);
  const [createPrefillName, setCreatePrefillName] = useState('');

  const { data: projects, isLoading } = useProjectsList(
    search,
    sort === 'name' ? 'name' : 'recent',
    false
  );
  const pinProject = usePinProject();
  const unpinProject = useUnpinProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  const projectList = useMemo(() => projects ?? [], [projects]);

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
      if (!quests) return [project.id, undefined] as const;
      return [
        project.id,
        {
          questCount: quests.length,
          completedCount: quests.filter((q) => q.status === 'COMPLETED').length,
          urgentCount: quests.filter((q) => isUrgentQuest(q)).length,
        },
      ] as const;
    });
    return Object.fromEntries(entries);
  }, [projectList, statsQueries]);

  const sortedProjects = useMemo(() => {
    const result = [...projectList];
    if (sort === 'name') result.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === 'quests') {
      result.sort(
        (a, b) =>
          (statsByProjectId[b.id]?.questCount ?? 0) - (statsByProjectId[a.id]?.questCount ?? 0)
      );
    } else {
      result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }
    return result;
  }, [projectList, sort, statsByProjectId]);

  const normalizedSearch = search.trim().toLowerCase();
  const canCreateFromSearch =
    normalizedSearch.length > 0 &&
    !projectList.some((p) => p.name.toLowerCase() === normalizedSearch);

  const handleTogglePin = (id: string, pinned: boolean) => {
    if (pinned) unpinProject.mutate(id);
    else pinProject.mutate(id);
  };

  const handleToggleArchive = (id: string, archived: boolean) => {
    updateProject.mutate({ id, data: { archived: !archived } });
  };

  const handleDeleteProject = (project: ProjectSummaryResponse) => {
    if (
      !confirm(
        `Delete project "${project.name}"? This will also delete all quests associated with it.`
      )
    )
      return;
    deleteProject.mutate(project.id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">Long-running initiatives</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} size="sm" className="gap-1.5 shrink-0">
          <Plus className="h-3.5 w-3.5" />
          New project
        </Button>
      </div>

      {/* Search + sort toolbar */}
      <div className="flex items-center gap-0 rounded-md border border-border bg-card overflow-hidden">
        <div className="flex flex-1 items-center gap-2 px-3 py-2">
          <Search className="h-[14px] w-[14px] shrink-0 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none min-w-0"
          />
        </div>

        <div className="h-6 w-px bg-border mx-0.5 shrink-0" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors whitespace-nowrap h-full">
              <ListFilter className="h-3.5 w-3.5" />
              <span>{SORT_LABELS[sort]}</span>
            </button>
          </DropdownMenuTrigger>
          <SortMenuContent align="end" className="w-44">
            {(Object.keys(SORT_LABELS) as SortMode[]).map((s) => (
              <DropdownMenuItem
                key={s}
                onClick={() => setSort(s)}
                className={cn(sort === s && 'bg-accent font-medium')}
              >
                {SORT_LABELS[s]}
              </DropdownMenuItem>
            ))}
          </SortMenuContent>
        </DropdownMenu>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div
          className="grid gap-2.5"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      ) : sortedProjects.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="text-sm text-muted-foreground">
            {search
              ? `No project matches "${search.trim()}".`
              : 'No projects yet. Create your first one!'}
          </p>
          {canCreateFromSearch && (
            <Button
              size="sm"
              variant="outline"
              className="mt-3 gap-1.5"
              onClick={() => {
                setCreatePrefillName(search.trim());
                setIsCreateOpen(true);
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              Create "{search.trim()}"
            </Button>
          )}
        </div>
      ) : (
        <div
          className="grid gap-2.5"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}
        >
          {sortedProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              stats={statsByProjectId[project.id]}
              onOpen={() => navigate(`/projects/${project.id}`)}
              onAddQuest={() => setQuickCreateProject(project)}
              onTogglePin={() => handleTogglePin(project.id, project.pinned)}
              onEdit={() => setProjectToEdit(project)}
              onToggleArchive={() => handleToggleArchive(project.id, project.archived)}
              onDelete={() => handleDeleteProject(project)}
            />
          ))}
        </div>
      )}

      <CreateProjectDialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) setCreatePrefillName('');
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

  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-lg border bg-card transition-all duration-150 hover:border-border/80 hover:shadow-sm cursor-pointer"
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
    >
      {/* Top: icon + name + time + menu */}
      <div className="flex items-center gap-2.5 px-4 pt-4 pb-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40 text-base">
          {project.icon || '📁'}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-foreground leading-tight">
            {project.name}
          </div>
          <div className="text-[11px] text-muted-foreground">{updatedLabel}</div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
              <span className="sr-only">Project actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onClick={onTogglePin}>
              {project.pinned ? (
                <>
                  <StarOff className="mr-2 h-4 w-4" />
                  Unpin
                </>
              ) : (
                <>
                  <Star className="mr-2 h-4 w-4" />
                  Pin
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onAddQuest}>
              <Plus className="mr-2 h-4 w-4" />
              Add quest
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

      {/* Description */}
      {trimmedDescription && (
        <p className="px-4 pb-3 text-xs leading-relaxed text-muted-foreground line-clamp-2">
          {trimmedDescription}
        </p>
      )}

      {/* Footer */}
      <div className="mt-auto flex items-center justify-between border-t border-border px-4 py-2.5">
        <span className="font-mono text-[11px] text-muted-foreground">
          {stats != null ? `${stats.questCount} quests` : '—'}
        </span>
        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
    </div>
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
  const [icon, setIcon] = useState('');
  const [description, setDescription] = useState('');

  const isEditMode = !!projectToEdit;
  const isPending = createProject.isPending || updateProject.isPending;
  const isDisabled = !name.trim() || !icon.trim() || isPending;

  useEffect(() => {
    if (open) {
      setName(projectToEdit?.name ?? initialName ?? '');
      setIcon(projectToEdit?.icon ?? '');
      setDescription(projectToEdit?.description ?? '');
    }
  }, [open, projectToEdit, initialName]);

  const handleSubmit = () => {
    if (!name.trim()) return;
    const payload = {
      name: name.trim(),
      icon: icon.trim(),
      description: description.trim() || undefined,
    };
    if (isEditMode) {
      updateProject.mutate(
        { id: projectToEdit!.id, data: payload },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      createProject.mutate(payload, { onSuccess: () => onOpenChange(false) });
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setName('');
      setIcon('');
      setDescription('');
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[420px] max-h-[min(90dvh,44rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit project' : 'New project'}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update project details.'
              : 'Group related quests into a longer initiative.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="project-name">Name</Label>
            <Input
              id="project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Launch new portfolio"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Icon</Label>
            <EmojiPicker value={icon} onChange={setIcon} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="project-description">Description</Label>
            <Input
              id="project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              placeholder="Short summary or focus area"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => handleOpenChange(false)} disabled={isPending}>
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
  const dueDay = new Date(quest.dueDate);
  dueDay.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dueDay.getTime() <= today.getTime();
}

function formatRelativeProjectUpdate(updatedAt: string) {
  const diffSeconds = Math.max(0, Math.floor((Date.now() - new Date(updatedAt).getTime()) / 1000));
  if (diffSeconds < 60) return 'now';
  for (const [label, seconds] of [
    ['y', 60 * 60 * 24 * 365],
    ['mo', 60 * 60 * 24 * 30],
    ['d', 60 * 60 * 24],
    ['h', 60 * 60],
    ['m', 60],
  ] as [string, number][]) {
    if (diffSeconds >= seconds) return `${Math.floor(diffSeconds / seconds)}${label} ago`;
  }
  return 'now';
}
