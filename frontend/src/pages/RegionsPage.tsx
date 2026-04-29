import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCategories, useDeleteCategory, useQuests } from '@/hooks/use-api';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { CreateCategoryDialog } from '@/components/CreateCategoryDialog';
import { DeleteRegionDialog } from '@/components/DeleteRegionDialog';
import { RegionCard } from '@/components/RegionCard';
import type { CategoryResponse } from '@/lib/api';

export function RegionsPage() {
  const navigate = useNavigate();
  const { data: categories, isLoading } = useCategories();
  const { data: quests } = useQuests(undefined, 'inbox');
  const deleteCategory = useDeleteCategory();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryResponse | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<CategoryResponse | null>(null);

  const questCountByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const q of quests ?? []) {
      if (q.category?.id) {
        counts[q.category.id] = (counts[q.category.id] ?? 0) + 1;
      }
    }
    return counts;
  }, [quests]);

  const handleDelete = (questAction: 'MOVE_TO_INBOX' | 'DELETE_ALL') => {
    if (!deletingCategory) return;
    deleteCategory.mutate(
      { id: deletingCategory.id, questAction },
      { onSuccess: () => setDeletingCategory(null) }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-64" />
        <div
          className="grid gap-2.5"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}
        >
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Regions</h1>
          <p className="text-sm text-muted-foreground">
            Your quest categories and their current activity
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} size="sm" className="gap-1.5 shrink-0">
          <Plus className="h-3.5 w-3.5" />
          Add region
        </Button>
      </div>

      {!categories || categories.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          No regions yet. Create a category to start exploring!
        </div>
      ) : (
        <div
          className="grid gap-2.5"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}
        >
          {categories.map((cat) => (
            <RegionCard
              key={cat.id}
              stats={cat}
              questCount={questCountByCategory[cat.id] ?? 0}
              onClick={() => navigate(`/inbox?category=${cat.id}`)}
              onEdit={() => setEditingCategory(cat)}
              onDelete={() => setDeletingCategory(cat)}
            />
          ))}
        </div>
      )}

      <CreateCategoryDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />

      <CreateCategoryDialog
        open={!!editingCategory}
        onOpenChange={(open) => !open && setEditingCategory(null)}
        categoryToEdit={editingCategory ?? undefined}
      />

      {deletingCategory && (
        <DeleteRegionDialog
          open={!!deletingCategory}
          onOpenChange={(open) => !open && setDeletingCategory(null)}
          regionName={deletingCategory.name}
          questCount={questCountByCategory[deletingCategory.id] ?? 0}
          onConfirm={handleDelete}
          isPending={deleteCategory.isPending}
        />
      )}
    </div>
  );
}
