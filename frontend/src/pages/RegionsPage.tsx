import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCategories, useDeleteCategory } from '@/hooks/use-api';
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
  const deleteCategory = useDeleteCategory();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryResponse | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<CategoryResponse | null>(null);

  const handleDelete = (questAction: 'MOVE_TO_INBOX' | 'DELETE_ALL') => {
    if (!deletingCategory) return;

    deleteCategory.mutate(
      { id: deletingCategory.id, questAction },
      {
        onSuccess: () => setDeletingCategory(null),
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Regions</h1>
          <p className="text-muted-foreground">Your quest categories and their current activity.</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Region
        </Button>
      </div>

      {!categories || categories.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          No regions discovered yet. Create a category to start exploring!
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <RegionCard
              key={cat.id}
              stats={cat}
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
          questCount={0}
          onConfirm={handleDelete}
          isPending={deleteCategory.isPending}
        />
      )}
    </div>
  );
}
