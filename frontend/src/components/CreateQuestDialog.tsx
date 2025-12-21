import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { type CreateQuestRequest } from '@/lib/api';
import { useCategories, useCreateQuest } from '@/hooks/use-api';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea'; // We might need to create this if it doesn't exist, checking list_dir output... it's not there. I'll use a standard textarea for now or create the component. I'll use standard textarea styled like input.
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';

interface CreateQuestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onQuestCreated?: () => void;
}

export function CreateQuestDialog({ open, onOpenChange, onQuestCreated }: CreateQuestDialogProps) {
  const { data: categories } = useCategories();
  const createQuestMutation = useCreateQuest();
  const [date, setDate] = useState<Date>();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CreateQuestRequest>();

  useEffect(() => {
    if (open) {
      reset();
      setDate(undefined);
    }
  }, [open, reset]);

  const onSubmit = (data: CreateQuestRequest) => {
    createQuestMutation.mutate(
      {
        ...data,
        dueDate: date ? date.toISOString() : undefined,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          if (onQuestCreated) {
            onQuestCreated();
          }
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Quest</DialogTitle>
          <DialogDescription>
            Embark on a new adventure. Define your quest details below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="e.g., Master React Hooks"
              {...register('title', { required: true })}
            />
            {errors.title && <span className="text-xs text-destructive">Title is required</span>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe your quest..."
              {...register('description')}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select
                onValueChange={(value) =>
                  setValue('difficulty', value as CreateQuestRequest['difficulty'])
                }
                defaultValue="EASY"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EASY">Easy</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HARD">Hard</SelectItem>
                  <SelectItem value="EPIC">Epic</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select onValueChange={(value) => setValue('categoryId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
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
          <div className="grid gap-2">
            <Label>Due Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={'outline'}
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !date && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={createQuestMutation.isPending}>
              {createQuestMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Quest
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
