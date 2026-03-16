import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  useCompleteQuest,
  useDeleteQuest,
  useProjectDetail,
  useProjectQuests,
  useSkipQuest,
} from '@/hooks/use-api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { QuestCard } from '@/components/QuestCard';
import { CreateQuestDialog } from '@/components/CreateQuestDialog';
import { type QuestResponse } from '@/lib/api';
import { ArrowLeft, Plus } from 'lucide-react';

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

  const handleDelete = (questId: string) => {
    if (confirm('Are you sure you want to delete this quest?')) {
      deleteQuestMutation.mutate(questId);
    }
  };

  if (isLoadingProject) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-56" />
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <Link
            to="/projects"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Projects
          </Link>
          <h1 className="text-2xl font-bold">
            <span className="mr-2">{project.icon}</span>
            {project.name}
          </h1>
          {project.description && <p className="text-muted-foreground">{project.description}</p>}
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add quest to project
        </Button>
      </div>

      {questsError && (
        <Alert variant="destructive">
          <AlertDescription>Failed to load project quests.</AlertDescription>
        </Alert>
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
      ) : (
        <div className="space-y-3">
          {quests.map((quest) => (
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
                projectId: editingQuest.project?.id,
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
