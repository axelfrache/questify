import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { InboxFilterPopover } from '@/components/InboxFilterPopover';
import { ActiveFilterChips } from '@/components/ActiveFilterChips';
import { Search, ArrowUpDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CategoryResponse } from '@/lib/api';
import type {
  InboxFilters,
  DifficultyFilter,
  RecurrenceFilter,
  StructureFilter,
} from '@/hooks/useInboxFilters';
import type { SortOption } from '@/hooks/useInboxSort';

interface InboxToolbarProps {
  filters: InboxFilters;
  categories: CategoryResponse[];
  onSearchChange: (search: string) => void;
  onToggleDifficulty: (d: DifficultyFilter) => void;
  onToggleRegion: (id: string) => void;
  onToggleRecurrence: (r: RecurrenceFilter) => void;
  onSetStructure: (s: StructureFilter | null) => void;
  onClearAllFilters: () => void;
  onRemoveFilter: (type: string, value: string) => void;
  activeFilterCount: number;
  activeFilterLabels: { type: string; label: string; value: string }[];
  sortOption: SortOption;
  sortLabels: Record<SortOption, string>;
  onSortChange: (option: SortOption) => void;
}

const SORT_OPTIONS: SortOption[] = ['dueDate', 'createdAt', 'alphabetical', 'xpReward'];

export function InboxToolbar({
  filters,
  categories,
  onSearchChange,
  onToggleDifficulty,
  onToggleRegion,
  onToggleRecurrence,
  onSetStructure,
  onClearAllFilters,
  onRemoveFilter,
  activeFilterCount,
  activeFilterLabels,
  sortOption,
  sortLabels,
  onSortChange,
}: InboxToolbarProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search quests, regions, or subquests…"
            value={filters.search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        <InboxFilterPopover
          filters={filters}
          categories={categories}
          onToggleDifficulty={onToggleDifficulty}
          onToggleRegion={onToggleRegion}
          onToggleRecurrence={onToggleRecurrence}
          onSetStructure={onSetStructure}
          activeCount={activeFilterCount}
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowUpDown className="h-4 w-4" />
              {sortLabels[sortOption]}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {SORT_OPTIONS.map((option) => (
              <DropdownMenuItem
                key={option}
                onClick={() => onSortChange(option)}
                className={cn('gap-2', sortOption === option && 'bg-accent')}
              >
                <Check
                  className={cn('h-4 w-4', sortOption === option ? 'opacity-100' : 'opacity-0')}
                />
                {sortLabels[option]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ActiveFilterChips
        filters={activeFilterLabels}
        onRemove={onRemoveFilter}
        onClearAll={onClearAllFilters}
      />
    </div>
  );
}
