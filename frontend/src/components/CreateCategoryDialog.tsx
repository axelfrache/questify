import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { type CreateCategoryRequest, type CategoryResponse } from '@/lib/api';
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
  categoryToEdit?: CategoryResponse;
}

export function CreateCategoryDialog({
  open,
  onOpenChange,
  categoryToEdit,
}: CreateCategoryDialogProps) {
  const { t } = useTranslation();
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
        { id: categoryToEdit.id, data },
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
      <DialogContent className="sm:max-w-[425px] max-h-[min(90dvh,44rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? t('category_dialog.edit_title') : t('category_dialog.create_title')}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? t('category_dialog.edit_description')
              : t('category_dialog.create_description')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 py-2">
          <div className="grid gap-1.5">
            <Label htmlFor="name" className="text-xs font-medium text-muted-foreground ml-1">
              {t('category_dialog.name')}
            </Label>
            <Input
              id="name"
              placeholder={t('category_dialog.name_placeholder')}
              {...register('name', { required: true })}
              autoFocus
              className="h-9"
            />
            {errors.name && (
              <span className="text-xs text-destructive">
                {t('category_dialog.name')} is required
              </span>
            )}
          </div>

          {/* Informational Preview */}
          {/* Informational Preview */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-muted-foreground ml-1">
              {t('category_dialog.preview')}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-2xl leading-none">{selectedIcon || '✨'}</span>
              <span
                className="text-xl font-bold transition-colors duration-200"
                style={{ color: isColorValid ? selectedColor : undefined }}
              >
                {regionName || t('category_dialog.new_region')}
              </span>
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label className="text-xs font-medium text-muted-foreground ml-1">
              {t('category_dialog.color')}
            </Label>
            <ColorPicker
              value={selectedColor}
              onChange={setSelectedColor}
              onValidityChange={setIsColorValid}
            />
          </div>

          <div className="grid gap-1.5 min-w-0">
            <Label className="text-xs font-medium text-muted-foreground ml-1">
              {t('category_dialog.icon')}
            </Label>
            <EmojiPicker value={selectedIcon} onChange={setSelectedIcon} />
            <input type="hidden" {...register('icon', { required: true })} />
            {errors.icon && (
              <span className="text-xs text-destructive">
                {t('category_dialog.icon')} is required
              </span>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="submit"
              disabled={isPending || !isColorValid}
              className="w-full sm:w-auto"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? t('category_dialog.save') : t('category_dialog.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
