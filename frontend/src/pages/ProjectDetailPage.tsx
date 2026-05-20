import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  useCompleteQuest,
  useDeleteQuest,
  useProjectDetail,
  useProjectQuests,
  useSkipQuest,
} from '@/hooks/use-api';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { QuestCard } from '@/components/QuestCard';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { CreateQuestDialog } from '@/components/CreateQuestDialog';
import { QuestViewDialog } from '@/components/QuestViewDialog';
import { type QuestResponse } from '@/lib/api';
import { Plus } from 'lucide-react';
import confetti from 'canvas-confetti';

const fireConfettiFromElement = (element: HTMLElement) => {
  const rect = element.getBoundingClientRect();
  confetti({
    particleCount: 50,
    spread: 60,
    origin: {
      x: (rect.left + rect.width / 2) / window.innerWidth,
      y: (rect.top + rect.height / 2) / window.innerHeight,
    },
    colors: ['#4f46e5', '#818cf8', '#c7d2fe', '#a855f7', '#6366f1', '#e0e7ff'],
    startVelocity: 25,
    gravity: 0.8,
    scalar: 0.9,
    ticks: 100,
  });
};

export function ProjectDetailPage() {
  const { id = '' } = useParams();
  const { data: project, isLoading: isLoadingProject } = useProjectDetail(id);
  const { data: quests, isLoading: isLoadingQuests, error: questsError } = useProjectQuests(id);
  const completeQuestMutation = useCompleteQuest();
  const deleteQuestMutation = useDeleteQuest();
  const skipQuestMutation = useSkipQuest();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [viewingQuest, setViewingQuest] = useState<QuestResponse | null>(null);
  const [editingQuest, setEditingQuest] = useState<QuestResponse | null>(null);
  const [parentQuest, setParentQuest] = useState<QuestResponse | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const stats = useMemo(() => {
    if (!quests) return null;
    const total = quests.length;
    const completed = quests.filter((q) => q.status === 'COMPLETED').length;
    const xpEarned = quests
      .filter((q) => q.status === 'COMPLETED')
      .reduce((sum, q) => sum + (q.totalXpReward ?? 0), 0);
    return { total, completed, xpEarned };
  }, [quests]);

  const pendingQuests = useMemo(
    () => quests?.filter((q) => q.status === 'PENDING') ?? [],
    [quests]
  );
  const completedQuests = useMemo(
    () => quests?.filter((q) => q.status === 'COMPLETED').reverse() ?? [],
    [quests]
  );

  const handleComplete = (questId: string, checkboxElement?: HTMLElement) => {
    if (checkboxElement) fireConfettiFromElement(checkboxElement);
    completeQuestMutation.mutate(questId);
  };

  const handleDelete = (questId: string) => setPendingDeleteId(questId);

  if (isLoadingProject) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-16 w-80" />
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Project not found.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/40 text-3xl">
            {project.icon || '📁'}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
            {project.description && (
              <p className="mt-0.5 text-sm text-muted-foreground">{project.description}</p>
            )}
          </div>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} size="sm" className="gap-1.5 shrink-0">
          <Plus className="h-3.5 w-3.5" />
          Add quest
        </Button>
      </div>

      {/* Stat tiles */}
      {stats && (
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { label: 'Total quests', value: stats.total },
            { label: 'Completed', value: stats.completed },
            { label: 'XP earned', value: `+${stats.xpEarned}`, mono: true },
          ].map(({ label, value, mono }) => (
            <div key={label} className="rounded-lg border bg-card px-4 py-3">
              <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                {label}
              </p>
              <p
                className={`mt-1.5 text-3xl font-medium tracking-tight ${mono ? 'font-mono' : ''}`}
              >
                {value}
              </p>
            </div>
          ))}
        </div>
      )}

      {questsError && (
        <Alert variant="destructive">
          <AlertDescription>Failed to load project quests.</AlertDescription>
        </Alert>
      )}

      {/* Quest list */}
      {isLoadingQuests ? (
        <div className="space-y-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : !quests || quests.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          No quests in this project yet.
        </div>
      ) : (
        <div className="space-y-6">
          {pendingQuests.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Quests</h2>
                <span className="font-mono text-xs text-muted-foreground">
                  {pendingQuests.length} items
                </span>
              </div>
              <div className="space-y-1.5">
                {pendingQuests.map((quest) => (
                  <QuestCard
                    key={quest.id}
                    quest={quest}
                    onComplete={handleComplete}
                    onView={setViewingQuest}
                    onEdit={setEditingQuest}
                    onDelete={handleDelete}
                    onSkip={(questId) => skipQuestMutation.mutate(questId)}
                    onAddSubquest={setParentQuest}
                    isPending={completeQuestMutation.isPending}
                    showInlineSubquests
                    showRegionMarker
                  />
                ))}
              </div>
            </div>
          )}

          {completedQuests.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground">Completed</h2>
              <div className="space-y-1.5">
                {completedQuests.map((quest) => (
                  <QuestCard
                    key={quest.id}
                    quest={quest}
                    onComplete={handleComplete}
                    onView={setViewingQuest}
                    onEdit={setEditingQuest}
                    onDelete={handleDelete}
                    isPending={completeQuestMutation.isPending}
                    showRegionMarker
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <QuestViewDialog
        quest={viewingQuest}
        open={!!viewingQuest}
        onOpenChange={(open) => !open && setViewingQuest(null)}
        onEdit={setEditingQuest}
        onComplete={handleComplete}
      />

      <CreateQuestDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        projectId={id}
      />

      <CreateQuestDialog
        open={!!editingQuest}
        onOpenChange={(open) => !open && setEditingQuest(null)}
        questToEdit={
          editingQuest
            ? {
                id: editingQuest.id,
                title: editingQuest.title,
                description: editingQuest.description,
                difficulty: editingQuest.difficulty,
                categoryId: editingQuest.category?.id,
                projectId: editingQuest.projectId,
                dueDate: editingQuest.dueDate,
                recurrenceInterval: editingQuest.recurrenceInterval,
                recurrenceDays: editingQuest.recurrenceDays,
                baseXpReward: editingQuest.baseXpReward,
              }
            : undefined
        }
      />

      <CreateQuestDialog
        open={!!parentQuest}
        onOpenChange={(open) => !open && setParentQuest(null)}
        parentId={parentQuest?.templateId}
        parentTitle={parentQuest?.title}
        parentRecurrence={parentQuest?.recurrenceInterval}
        projectId={id}
      />

      <ConfirmDialog
        open={!!pendingDeleteId}
        onOpenChange={(open) => !open && setPendingDeleteId(null)}
        title="Delete quest?"
        description="This action cannot be undone."
        onConfirm={() => deleteQuestMutation.mutate(pendingDeleteId!)}
      />
    </div>
  );
}
