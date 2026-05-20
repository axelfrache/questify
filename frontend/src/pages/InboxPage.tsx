import { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  useQuests,
  useCategories,
  useCompleteQuest,
  useDeleteQuest,
  useProjectsList,
  useProjectsSidebar,
} from '@/hooks/use-api';
import { useInboxState } from '@/hooks/useInboxState';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { InboxControls } from '@/components/inbox/InboxControls';
import { GroupedQuestList } from '@/components/inbox/GroupedQuestList';
import { CreateQuestDialog } from '@/components/CreateQuestDialog';
import { QuestViewDialog } from '@/components/QuestViewDialog';
import { type QuestResponse } from '@/lib/api';
import { ChevronDown, Plus } from 'lucide-react';
import confetti from 'canvas-confetti';

const fireConfettiFromElement = (element: HTMLElement) => {
  const rect = element.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;

  confetti({
    particleCount: 50,
    spread: 60,
    origin: {
      x: x / window.innerWidth,
      y: y / window.innerHeight,
    },
    colors: ['#4f46e5', '#818cf8', '#c7d2fe', '#a855f7', '#6366f1', '#e0e7ff'],
    startVelocity: 25,
    gravity: 0.8,
    scalar: 0.9,
    ticks: 100,
  });
};

export function InboxPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const categoryFilter = searchParams.get('category');

  const clearCategoryFilter = () => {
    navigate('/inbox', { replace: true });
  };

  const {
    data: quests,
    isLoading: isLoadingQuests,
    error: errorQuests,
  } = useQuests(undefined, 'inbox');
  const { data: projectSidebar } = useProjectsSidebar();
  const { data: projects } = useProjectsList('', 'name', true);
  const { data: categories, isLoading: isLoadingCategories } = useCategories();
  const completeQuestMutation = useCompleteQuest();
  const deleteQuestMutation = useDeleteQuest();

  const [viewingQuest, setViewingQuest] = useState<QuestResponse | null>(null);
  const [editingQuest, setEditingQuest] = useState<QuestResponse | null>(null);
  const [parentQuest, setParentQuest] = useState<QuestResponse | null>(null);
  const [newQuestOpen, setNewQuestOpen] = useState(false);

  const pendingQuests = useMemo(() => {
    let result = quests?.filter((q) => q.status === 'PENDING') || [];
    if (categoryFilter) {
      result = result.filter((q) => q.category?.id === categoryFilter);
    }
    return result;
  }, [quests, categoryFilter]);

  const filteredCategoryName = useMemo(() => {
    if (!categoryFilter || !categories) return null;
    const cat = categories.find((c) => c.id === categoryFilter);
    return cat ? `${cat.icon} ${cat.name}` : null;
  }, [categoryFilter, categories]);

  const pinnedProjectIds = useMemo(
    () => (projectSidebar?.pinned ?? []).map((project) => project.id),
    [projectSidebar]
  );

  const allProjects = useMemo(() => {
    const seen = new Set<string>();
    return [
      ...(projects ?? []),
      ...(projectSidebar?.pinned ?? []),
      ...(projectSidebar?.recent ?? []),
    ].filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  }, [projects, projectSidebar]);

  const {
    search,
    groupBy,
    sortBy,
    density,
    quickFilters,
    groupedQuests,
    paginatedQuests,
    allCount,
    totalCount,
    displayedCount,
    overdueCount,
    todayCount,
    hasMore,
    setSearch,
    setGroupBy,
    setSortBy,
    toggleDensity,
    toggleQuickFilter,
    togglePinRegion,
    toggleCollapseRegion,
    loadMore,
  } = useInboxState(pendingQuests, pinnedProjectIds, allProjects);

  const handleComplete = (id: string, checkboxElement?: HTMLElement) => {
    if (checkboxElement) {
      fireConfettiFromElement(checkboxElement);
    }
    completeQuestMutation.mutate(id);
  };

  const handleDelete = deleteQuestMutation;

  const handleAddSubquest = (quest: QuestResponse) => {
    setParentQuest(quest);
  };

  if (isLoadingQuests || isLoadingCategories) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inbox</h1>
          <p className="text-sm text-muted-foreground">All quests, unassigned &amp; pending</p>
        </div>
        <Button onClick={() => setNewQuestOpen(true)} size="sm" className="gap-1.5 shrink-0">
          <Plus className="h-3.5 w-3.5" />
          New quest
        </Button>
      </div>

      <InboxControls
        search={search}
        groupBy={groupBy}
        sortBy={sortBy}
        density={density}
        quickFilters={quickFilters}
        allCount={allCount}
        totalCount={totalCount}
        displayedCount={displayedCount}
        overdueCount={overdueCount}
        todayCount={todayCount}
        onSearchChange={setSearch}
        onGroupByChange={setGroupBy}
        onSortByChange={setSortBy}
        onToggleDensity={toggleDensity}
        onToggleQuickFilter={toggleQuickFilter}
      />

      {filteredCategoryName && (
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-muted-foreground">Region:</span>
          <button
            onClick={clearCategoryFilter}
            className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-primary hover:bg-primary/20 transition-colors"
          >
            {filteredCategoryName}
            <span className="text-primary/60 hover:text-primary">×</span>
          </button>
        </div>
      )}

      {errorQuests && (
        <Alert variant="destructive">
          <AlertDescription>Failed to load quests</AlertDescription>
        </Alert>
      )}

      {totalCount === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          {search || quickFilters.overdue || quickFilters.today
            ? 'No quests match your search or filters.'
            : 'No quests found. Start your journey by adding a new quest!'}
        </div>
      ) : (
        <>
          <GroupedQuestList
            groupBy={groupBy}
            groupedQuests={groupedQuests}
            paginatedQuests={paginatedQuests}
            density={density}
            onToggleCollapse={toggleCollapseRegion}
            onTogglePin={togglePinRegion}
            onComplete={handleComplete}
            onView={setViewingQuest}
            onEdit={setEditingQuest}
            onDelete={handleDelete}
            onAddSubquest={handleAddSubquest}
            isPending={completeQuestMutation.isPending}
          />

          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button variant="outline" onClick={loadMore} className="gap-2">
                <ChevronDown className="h-4 w-4" />
                Load More
              </Button>
            </div>
          )}
        </>
      )}

      <QuestViewDialog
        quest={viewingQuest}
        open={!!viewingQuest}
        onOpenChange={(open) => !open && setViewingQuest(null)}
        onEdit={setEditingQuest}
        onComplete={handleComplete}
      />

      <CreateQuestDialog open={newQuestOpen} onOpenChange={setNewQuestOpen} />

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
      />
    </div>
  );
}
