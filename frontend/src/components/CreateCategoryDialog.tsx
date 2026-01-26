import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { type CreateCategoryRequest, type CategoryStats } from '@/lib/api';
import { useCreateCategory, useUpdateCategory } from '@/hooks/use-api';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { EmojiPicker } from '@/components/EmojiPicker';
import { ColorPicker } from '@/components/ColorPicker';

const DEFAULT_COLOR = '#10b981';

interface CreateCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryToEdit?: CategoryStats;
}

export function CreateCategoryDialog({
  open,
  onOpenChange,
  categoryToEdit,
}: CreateCategoryDialogProps) {
  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();
  const [selectedIcon, setSelectedIcon] = useState('');
  const [selectedColor, setSelectedColor] = useState(DEFAULT_COLOR);
  const [isColorValid, setIsColorValid] = useState(true);

  const isEditMode = !!categoryToEdit;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateCategoryRequest>();

  const regionName = watch('name');

  useEffect(() => {
    if (open && categoryToEdit) {
      setValue('name', categoryToEdit.name);
      setValue('icon', categoryToEdit.icon);
      setValue('color', categoryToEdit.color);
      setSelectedIcon(categoryToEdit.icon);
      setSelectedColor(categoryToEdit.color);
    } else if (open && !categoryToEdit) {
      reset();
      setSelectedIcon('');
      setSelectedColor(DEFAULT_COLOR);
    }
  }, [open, categoryToEdit, setValue, reset]);

  useEffect(() => {
    setValue('icon', selectedIcon);
  }, [selectedIcon, setValue]);

  useEffect(() => {
    setValue('color', selectedColor);
  }, [selectedColor, setValue]);

  const onSubmit = (data: CreateCategoryRequest) => {
    if (isEditMode) {
      updateCategoryMutation.mutate(
        { id: categoryToEdit.categoryId, data },
        {
          onSuccess: () => {
            onOpenChange(false);
            reset();
            setSelectedIcon('');
          },
        }
      );
    } else {
      createCategoryMutation.mutate(data, {
        onSuccess: () => {
          onOpenChange(false);
          reset();
          setSelectedIcon('');
        },
      });
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      reset();
      setSelectedIcon('');
    }
    onOpenChange(isOpen);
  };

  const isPending = createCategoryMutation.isPending || updateCategoryMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Region' : 'Create New Region'}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update your region details.'
              : 'Add a new region to organize your quests.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="e.g., Work, Health"
              {...register('name', { required: true })}
            />
            {errors.name && <span className="text-xs text-destructive">Name is required</span>}
          </div>
          <div className="grid gap-2 min-w-0">
            <Label>Icon</Label>
            <EmojiPicker value={selectedIcon} onChange={setSelectedIcon} regionName={regionName} />
            <input type="hidden" {...register('icon', { required: true })} />
            {errors.icon && <span className="text-xs text-destructive">Icon is required</span>}
          </div>
          <div className="grid gap-2">
            <Label>Color</Label>
            <ColorPicker
              value={selectedColor}
              onChange={setSelectedColor}
              onValidityChange={setIsColorValid}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending || !isColorValid}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? 'Save Changes' : 'Create Region'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
