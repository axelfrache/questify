import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  useCompleteQuest,
  useDeleteQuest,
  useProjectDetail,
  useProjectQuests,
  useSkipQuest,
} from '@/hooks/use-api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { QuestCard } from '@/components/QuestCard';
import { CreateQuestDialog } from '@/components/CreateQuestDialog';
import { type QuestResponse } from '@/lib/api';
import { AlertTriangle, ArrowLeft, CheckCircle2, Clock3, ListTodo, Plus } from 'lucide-react';

type QuestFilter = 'all' | 'pending' | 'completed';

export function ProjectDetailPage() {
  const { id = '' } = useParams();
  const { data: project, isLoading: isLoadingProject } = useProjectDetail(id);
  const { data: quests, isLoading: isLoadingQuests, error: questsError } = useProjectQuests(id);
  const completeQuestMutation = useCompleteQuest();
  const deleteQuestMutation = useDeleteQuest();
  const skipQuestMutation = useSkipQuest();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingQuest, setEditingQuest] = useState<QuestResponse | null>(null);
  const [parentQuest, setParentQuest] = useState<QuestResponse | null>(null);
  const [questFilter, setQuestFilter] = useState<QuestFilter>('all');

  const stats = useMemo(() => {
    if (!quests) return null;
    const total = quests.length;
    const completed = quests.filter((q) => q.status === 'COMPLETED').length;
    const pending = quests.filter((q) => q.status === 'PENDING').length;
    const urgent = quests.filter((q) => {
      if (q.status !== 'PENDING' || !q.dueDate) return false;
      const due = new Date(q.dueDate);
      due.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return due.getTime() <= today.getTime();
    }).length;
    const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, pending, urgent, completionPct };
  }, [quests]);

  const filteredQuests = useMemo(() => {
    if (!quests) return [];
    if (questFilter === 'pending') return quests.filter((q) => q.status === 'PENDING');
    if (questFilter === 'completed') return quests.filter((q) => q.status === 'COMPLETED');
    return quests;
  }, [quests, questFilter]);

  const handleDelete = (questId: string) => {
    if (confirm('Are you sure you want to delete this quest?')) {
      deleteQuestMutation.mutate(questId);
    }
  };

  if (isLoadingProject) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-56" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
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

  const createdLabel = new Date(project.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1.5">
          <Link
            to="/projects"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Projects
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">
              <span className="mr-2">{project.icon}</span>
              {project.name}
            </h1>
            {project.pinned && (
              <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
                Pinned
              </Badge>
            )}
          </div>
          {project.description && (
            <p className="max-w-prose text-sm text-muted-foreground">{project.description}</p>
          )}
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock3 className="h-3.5 w-3.5" />
            Created {createdLabel}
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2 self-start">
          <Plus className="h-4 w-4" />
          Add quest
        </Button>
      </div>

      {/* Stat tiles */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card className="border-border/60 bg-card/70">
            <CardContent className="flex flex-col gap-1 p-4">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ListTodo className="h-3.5 w-3.5" />
                Total
              </span>
              <span className="text-2xl font-bold tabular-nums">{stats.total}</span>
            </CardContent>
          </Card>
          <Card className="border-border/60 bg-card/70">
            <CardContent className="flex flex-col gap-1 p-4">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock3 className="h-3.5 w-3.5" />
                Pending
              </span>
              <span className="text-2xl font-bold tabular-nums">{stats.pending}</span>
            </CardContent>
          </Card>
          <Card className="border-border/60 bg-card/70">
            <CardContent className="flex flex-col gap-1 p-4">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Completed
              </span>
              <span className="text-2xl font-bold tabular-nums">{stats.completed}</span>
            </CardContent>
          </Card>
          <Card
            className={
              stats.urgent > 0
                ? 'border-destructive/40 bg-destructive/5'
                : 'border-border/60 bg-card/70'
            }
          >
            <CardContent className="flex flex-col gap-1 p-4">
              <span
                className={`flex items-center gap-1.5 text-xs ${stats.urgent > 0 ? 'text-destructive' : 'text-muted-foreground'}`}
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                Urgent
              </span>
              <span
                className={`text-2xl font-bold tabular-nums ${stats.urgent > 0 ? 'text-destructive' : ''}`}
              >
                {stats.urgent}
              </span>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Progress bar */}
      {stats && stats.total > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overall progress</span>
            <span className="font-medium tabular-nums">{stats.completionPct}%</span>
          </div>
          <Progress value={stats.completionPct} className="h-2" />
        </div>
      )}

      <Separator />

      {questsError && (
        <Alert variant="destructive">
          <AlertDescription>Failed to load project quests.</AlertDescription>
        </Alert>
      )}

      {/* Quest filter tabs */}
      {!isLoadingQuests && quests && quests.length > 0 && (
        <Tabs value={questFilter} onValueChange={(v) => setQuestFilter(v as QuestFilter)}>
          <TabsList>
            <TabsTrigger value="all">All ({stats?.total ?? 0})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({stats?.pending ?? 0})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({stats?.completed ?? 0})</TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {isLoadingQuests ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : !quests || quests.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          No quests in this project yet.
        </div>
      ) : filteredQuests.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          No {questFilter} quests.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredQuests.map((quest) => (
            <QuestCard
              key={quest.id}
              quest={quest}
              onComplete={(questId) => completeQuestMutation.mutate(questId)}
              onEdit={setEditingQuest}
              onDelete={handleDelete}
              onSkip={(questId) => skipQuestMutation.mutate(questId)}
              onAddSubquest={setParentQuest}
              isPending={completeQuestMutation.isPending}
              showInlineSubquests
              showRegionMarker={false}
            />
          ))}
        </div>
      )}

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
    </div>
  );
}
