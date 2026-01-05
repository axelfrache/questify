import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CategoryResponse } from '@/lib/api';
import type {
  DifficultyFilter,
  RecurrenceFilter,
  StructureFilter,
  InboxFilters,
} from '@/hooks/useInboxFilters';

interface InboxFilterPopoverProps {
  filters: InboxFilters;
  categories: CategoryResponse[];
  onToggleDifficulty: (d: DifficultyFilter) => void;
  onToggleRegion: (id: string) => void;
  onToggleRecurrence: (r: RecurrenceFilter) => void;
  onSetStructure: (s: StructureFilter | null) => void;
  activeCount: number;
}

const DIFFICULTIES: { value: DifficultyFilter; label: string }[] = [
  { value: 'EASY', label: 'Easy' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HARD', label: 'Hard' },
  { value: 'EPIC', label: 'Epic' },
];

const RECURRENCES: { value: RecurrenceFilter; label: string }[] = [
  { value: 'one-off', label: 'One-off' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'habit', label: 'Habit' },
];

const STRUCTURES: { value: StructureFilter; label: string }[] = [
  { value: 'has-subquests', label: 'Has subquests' },
  { value: 'is-subquest', label: 'Is subquest' },
  { value: 'parent-only', label: 'Parent quests only' },
];

export function InboxFilterPopover({
  filters,
  categories,
  onToggleDifficulty,
  onToggleRegion,
  onToggleRecurrence,
  onSetStructure,
  activeCount,
}: InboxFilterPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="h-4 w-4" />
          Filters
          {activeCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
              {activeCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <div className="p-3 space-y-4 max-h-[400px] overflow-y-auto">
          <div>
            <h4 className="text-sm font-medium mb-2">Difficulty</h4>
            <div className="space-y-2">
              {DIFFICULTIES.map((d) => (
                <label key={d.value} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={filters.difficulties.includes(d.value)}
                    onCheckedChange={() => onToggleDifficulty(d.value)}
                  />
                  <span className={cn('text-sm', `text-difficulty-${d.value.toLowerCase()}`)}>
                    {d.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="text-sm font-medium mb-2">Region</h4>
            <div className="space-y-2">
              {categories.length === 0 ? (
                <p className="text-xs text-muted-foreground">No regions</p>
              ) : (
                categories.map((cat) => (
                  <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={filters.regions.includes(cat.id)}
                      onCheckedChange={() => onToggleRegion(cat.id)}
                    />
                    <span className="text-sm">
                      {cat.icon} {cat.name}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="text-sm font-medium mb-2">Recurrence</h4>
            <div className="space-y-2">
              {RECURRENCES.map((r) => (
                <label key={r.value} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={filters.recurrence.includes(r.value)}
                    onCheckedChange={() => onToggleRecurrence(r.value)}
                  />
                  <span className="text-sm">{r.label}</span>
                </label>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="text-sm font-medium mb-2">Structure</h4>
            <div className="space-y-2">
              {STRUCTURES.map((s) => (
                <label key={s.value} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={filters.structure === s.value}
                    onCheckedChange={() => onSetStructure(s.value)}
                  />
                  <span className="text-sm">{s.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
