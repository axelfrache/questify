import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { type CreateQuestRequest } from '@/lib/api';
import { useCategories, useCreateQuest, useUpdateQuest } from '@/hooks/use-api';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { DIFFICULTY_CONFIG } from '@/lib/quest-config';

interface CreateQuestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onQuestCreated?: () => void;
  questToEdit?: CreateQuestRequest & { id: string };
}

export function CreateQuestDialog({
  open,
  onOpenChange,
  onQuestCreated,
  questToEdit,
}: CreateQuestDialogProps) {
  const { data: categories } = useCategories();
  const createQuestMutation = useCreateQuest();
  const updateQuestMutation = useUpdateQuest();
  const [date, setDate] = useState<Date>();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateQuestRequest>({
    defaultValues: {
      difficulty: 'EASY',
      recurrenceInterval: 'NONE',
    },
  });

  const title = watch('title');
  const recurrence = watch('recurrenceInterval');
  const difficulty = watch('difficulty');

  useEffect(() => {
    if (open) {
      if (questToEdit) {
        setValue('title', questToEdit.title);
        setValue('description', questToEdit.description);
        setValue('difficulty', questToEdit.difficulty);
        setValue('categoryId', questToEdit.categoryId);
        setValue('recurrenceInterval', questToEdit.recurrenceInterval);
        setValue('baseXpReward', questToEdit.baseXpReward);
        if (questToEdit.dueDate) {
          setDate(new Date(questToEdit.dueDate));
        } else {
          setDate(undefined);
        }
      } else {
        reset({
          difficulty: 'EASY',
          recurrenceInterval: 'NONE',
        });
        setDate(undefined);
      }
    }
  }, [open, questToEdit, reset, setValue]);

  const onSubmit = (data: CreateQuestRequest) => {
    const payload = {
      ...data,
      dueDate: date && recurrence === 'NONE' ? date.toISOString() : undefined,
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

  const getButtonText = () => {
    if (questToEdit) return 'Update Quest';
    if (recurrence === 'DAILY') return 'Create Daily Quest';
    if (recurrence === 'WEEKLY') return 'Create Weekly Quest';
    if (recurrence === 'MONTHLY') return 'Create Monthly Quest';
    return 'Create Quest';
  };

  const isPending = createQuestMutation.isPending || updateQuestMutation.isPending;
  const isDisabled = !title?.trim() || isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{questToEdit ? 'Edit Quest' : 'New Quest'}</DialogTitle>
          <DialogDescription>
            {questToEdit ? 'Update your quest details.' : 'What do you want to accomplish?'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Input
              id="title"
              autoFocus
              placeholder="e.g., Finish React hooks tutorial"
              className="text-base"
              {...register('title', { required: true })}
            />
            {errors.title && <span className="text-xs text-destructive">Title is required</span>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Difficulty</Label>
              <Select
                onValueChange={(value) =>
                  setValue('difficulty', value as CreateQuestRequest['difficulty'])
                }
                value={difficulty || 'EASY'}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DIFFICULTY_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <span className="flex items-center justify-between w-full gap-2">
                        <span>{config.label}</span>
                        <span className={cn('text-xs', config.textColor)}>+{config.xp} XP</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Category</Label>
              <Select
                onValueChange={(value) => setValue('categoryId', value)}
                defaultValue={questToEdit?.categoryId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <span className="flex items-center gap-2">
                        <span>{category.icon}</span>
                        {category.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="more-options" className="border-none">
              <AccordionTrigger className="py-2 text-sm text-muted-foreground hover:text-foreground hover:no-underline">
                <span className="flex items-center gap-1">More options</span>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Description</Label>
                  <Textarea
                    placeholder="Add notes or details..."
                    className="resize-none"
                    rows={2}
                    {...register('description')}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Recurrence</Label>
                  <Select
                    onValueChange={(value) =>
                      setValue(
                        'recurrenceInterval',
                        value as CreateQuestRequest['recurrenceInterval']
                      )
                    }
                    value={recurrence || 'NONE'}
                  >
                    <SelectTrigger>
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

                {recurrence === 'NONE' && (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Due Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left font-normal',
                            !date && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? format(date, 'PPP') : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Button type="submit" disabled={isDisabled} className="w-full">
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {getButtonText()}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
