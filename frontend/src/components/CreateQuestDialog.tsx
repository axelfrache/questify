import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { type CreateQuestRequest } from '@/lib/api';
import { useCategories, useCreateQuest, useUpdateQuest } from '@/hooks/use-api';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon, Loader2, Sparkles } from 'lucide-react';
import { DIFFICULTY_CONFIG } from '@/lib/quest-config';
import { WeekdayPicker } from '@/components/ui/weekday-picker';

interface CreateQuestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onQuestCreated?: () => void;
  questToEdit?: CreateQuestRequest & { id: string };
  parentId?: string;
  parentTitle?: string;
  parentRecurrence?: 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';
  projectId?: string;
}

export function CreateQuestDialog({
  open,
  onOpenChange,
  onQuestCreated,
  questToEdit,
  parentId,
  parentTitle,
  parentRecurrence,
  projectId,
}: CreateQuestDialogProps) {
  const { data: categories } = useCategories();
  const createQuestMutation = useCreateQuest();
  const updateQuestMutation = useUpdateQuest();
  const [date, setDate] = useState<Date>();
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<CreateQuestRequest>({
    defaultValues: {
      difficulty: 'EASY',
      recurrenceInterval: 'NONE',
    },
  });

  const title = watch('title');
  const recurrence = watch('recurrenceInterval');
  const difficulty = watch('difficulty') ?? 'EASY';
  const categoryId = watch('categoryId') ?? '';

  useEffect(() => {
    if (open) {
      if (questToEdit) {
        setValue('title', questToEdit.title);
        setValue('description', questToEdit.description);
        setValue('difficulty', questToEdit.difficulty);
        setValue(
          'categoryId',
          questToEdit.categoryId || (questToEdit as { category?: { id: string } }).category?.id
        );
        setValue('projectId', questToEdit.projectId);
        setValue('recurrenceInterval', questToEdit.recurrenceInterval);
        setValue('baseXpReward', questToEdit.baseXpReward);
        if (questToEdit.dueDate) {
          // Parse in local timezone to avoid UTC offset shifting the day
          const datePart = questToEdit.dueDate.split('T')[0];
          const [y, m, d] = datePart.split('-').map(Number);
          setDate(new Date(y, m - 1, d));
        } else {
          setDate(undefined);
        }
        setSelectedDays(questToEdit.recurrenceDays || []);
      } else {
        reset({
          difficulty: 'EASY',
          recurrenceInterval: 'NONE',
          projectId,
        });
        setDate(undefined);
        setSelectedDays([]);
      }
    }
  }, [open, projectId, questToEdit, reset, setValue]);

  const onSubmit = (data: CreateQuestRequest) => {
    let dueDateISO: string | undefined;
    if (date && recurrence === 'NONE') {
      const dateAtNoon = new Date(date);
      dateAtNoon.setHours(12, 0, 0, 0);
      dueDateISO = dateAtNoon.toISOString();
    }

    const payload = {
      ...data,
      dueDate: dueDateISO,
      recurrenceDays: recurrence === 'WEEKLY' ? selectedDays : undefined,
      parentId: parentId,
      projectId: projectId ?? data.projectId,
    };

    if (questToEdit) {
      updateQuestMutation.mutate(
        { id: questToEdit.id, data: payload },
        {
          onSuccess: () => {
            onOpenChange(false);
            if (onQuestCreated) onQuestCreated();
          },
        }
      );
    } else {
      createQuestMutation.mutate(payload, {
        onSuccess: () => {
          onOpenChange(false);
          if (onQuestCreated) onQuestCreated();
        },
      });
    }
  };

  const getSubmitLabel = () => {
    if (questToEdit) return 'Update quest';
    if (parentId) return 'Create subquest';
    if (recurrence === 'DAILY') return 'Create daily quest';
    if (recurrence === 'WEEKLY') return 'Create weekly quest';
    if (recurrence === 'MONTHLY') return 'Create monthly quest';
    return 'Create quest';
  };

  const getDialogTitle = () => {
    if (questToEdit) return 'Edit quest';
    if (parentId) return `Add subquest`;
    return 'New quest';
  };

  const getDialogDescription = () => {
    if (questToEdit) return 'Update your quest details';
    if (parentId) return `Subquest of "${parentTitle}"`;
    return 'Add a new quest to your board';
  };

  const xpReward = DIFFICULTY_CONFIG[difficulty as keyof typeof DIFFICULTY_CONFIG]?.xp ?? 50;
  const isPending = createQuestMutation.isPending || updateQuestMutation.isPending;
  const isWeeklyWithNoDays = recurrence === 'WEEKLY' && selectedDays.length === 0;
  const isDisabled = !title?.trim() || isPending || isWeeklyWithNoDays;
  const showDueDate = recurrence === 'NONE' || !!parentId;
  const showRecurrence = !parentId || parentRecurrence === 'NONE';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="text-xl font-semibold tracking-tight">
            {getDialogTitle()}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-0.5">
            {getDialogDescription()}
          </DialogDescription>
        </DialogHeader>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="px-6 py-5 space-y-5">
            {/* Quest title */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Quest title</Label>
              <Input
                autoFocus
                placeholder="e.g., Finish React hooks tutorial"
                className={cn(
                  'h-11 text-sm',
                  errors.title && 'border-destructive focus-visible:ring-destructive'
                )}
                {...register('title', { required: true })}
              />
              {errors.title && <span className="text-xs text-destructive">Title is required</span>}
            </div>

            {/* Difficulty + Region */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Difficulty</Label>
                <Select
                  onValueChange={(v) =>
                    setValue('difficulty', v as CreateQuestRequest['difficulty'])
                  }
                  value={difficulty}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(DIFFICULTY_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <span className="flex items-center gap-2">
                          <span
                            className={cn('h-2 w-2 rounded-[2px] flex-shrink-0', config.bgColor)}
                            style={{ background: 'currentColor' }}
                          />
                          <span className={config.textColor}>{config.label}</span>
                          <span className="ml-auto text-xs text-muted-foreground">
                            +{config.xp} XP
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Region</Label>
                <Select onValueChange={(v) => setValue('categoryId', v)} value={categoryId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select region..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <span className="flex items-center gap-2">
                          <span>{cat.icon}</span>
                          {cat.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Recurrence + Due date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {showRecurrence ? (
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Recurrence</Label>
                  <Select
                    onValueChange={(v) =>
                      setValue('recurrenceInterval', v as CreateQuestRequest['recurrenceInterval'])
                    }
                    value={recurrence || 'NONE'}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">One-time</SelectItem>
                      <SelectItem value="DAILY">Daily</SelectItem>
                      <SelectItem value="WEEKLY">Weekly</SelectItem>
                      <SelectItem value="MONTHLY">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-muted-foreground">Recurrence</Label>
                  <div className="h-10 flex items-center px-3 rounded-md border border-border bg-muted/50">
                    <span className="text-sm text-muted-foreground">Inherited from parent</span>
                  </div>
                </div>
              )}

              {showDueDate && (
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Due date</Label>
                  <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className={cn(
                          'border-input dark:bg-input/30 dark:hover:bg-input/50 focus-visible:border-ring focus-visible:ring-ring/50',
                          'flex h-9 w-full items-center gap-2 rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs',
                          'transition-[color,box-shadow] outline-none focus-visible:ring-[3px]',
                          !date && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="h-4 w-4 shrink-0 opacity-50" />
                        {date ? format(date, 'dd/MM/yyyy') : 'Pick a date'}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(d) => {
                          setDate(d);
                          setDatePickerOpen(false);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>

            {/* Weekly day picker */}
            {recurrence === 'WEEKLY' && showRecurrence && (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Repeat on</Label>
                <WeekdayPicker selectedDays={selectedDays} onDaysChange={setSelectedDays} />
                {selectedDays.length === 0 && (
                  <p className="text-xs text-muted-foreground">Select at least one day</p>
                )}
              </div>
            )}

            {/* Description */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Description</Label>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <RichTextEditor
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    placeholder="Add notes or details..."
                  />
                )}
              />
            </div>

            {/* XP reward banner */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg px-4 py-3 bg-xp-bg border border-xp-border">
              <div className="flex items-center gap-2.5 text-sm text-xp-fg min-w-0 flex-1">
                <Sparkles className="h-4 w-4 flex-shrink-0" />
                <span>Reward for completing this quest</span>
              </div>
              <span className="font-mono font-semibold text-xp-fg flex-shrink-0">
                +{xpReward} <span className="text-xs opacity-70">XP</span>
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-border bg-muted/30">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isDisabled} className="min-w-[120px]">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {getSubmitLabel()}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
