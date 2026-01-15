import { useState, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Layers,
  ArrowUpDown,
  Check,
  LayoutGrid,
  LayoutList,
  AlertCircle,
  CalendarClock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GroupBy, SortBy, Density, QuickFilters } from '@/types/inboxTypes';

interface InboxControlsProps {
  search: string;
  groupBy: GroupBy;
  sortBy: SortBy;
  density: Density;
  quickFilters: QuickFilters;
  totalCount: number;
  displayedCount: number;
  overdueCount?: number;
  todayCount?: number;
  onSearchChange: (value: string) => void;
  onGroupByChange: (value: GroupBy) => void;
  onSortByChange: (value: SortBy) => void;
  onToggleDensity: () => void;
  onToggleQuickFilter: (filter: keyof QuickFilters) => void;
}

const GROUP_BY_OPTIONS: { value: GroupBy; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'region', label: 'Region' },
];

const SORT_BY_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'dueDate', label: 'Due Date' },
  { value: 'priority', label: 'Priority' },
];

export function InboxControls({
  search,
  groupBy,
  sortBy,
  density,
  quickFilters,
  totalCount,
  displayedCount,
  overdueCount = 0,
  todayCount = 0,
  onSearchChange,
  onGroupByChange,
  onSortByChange,
  onToggleDensity,
  onToggleQuickFilter,
}: InboxControlsProps) {
  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(searchInput);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchInput, onSearchChange]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  }, []);

  return (
    <div className="space-y-3">
      {/* Main controls row */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search quests..."
            value={searchInput}
            onChange={handleSearchChange}
            className="pl-9"
          />
        </div>

        {/* Group By */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Layers className="h-4 w-4" />
              <span className="hidden sm:inline">Group:</span>
              {GROUP_BY_OPTIONS.find((o) => o.value === groupBy)?.label}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {GROUP_BY_OPTIONS.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => onGroupByChange(option.value)}
                className={cn('gap-2', groupBy === option.value && 'bg-accent')}
              >
                <Check
                  className={cn('h-4 w-4', groupBy === option.value ? 'opacity-100' : 'opacity-0')}
                />
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Sort By */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowUpDown className="h-4 w-4" />
              <span className="hidden sm:inline">Sort:</span>
              {SORT_BY_OPTIONS.find((o) => o.value === sortBy)?.label}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {SORT_BY_OPTIONS.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => onSortByChange(option.value)}
                className={cn('gap-2', sortBy === option.value && 'bg-accent')}
              >
                <Check
                  className={cn('h-4 w-4', sortBy === option.value ? 'opacity-100' : 'opacity-0')}
                />
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Density Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleDensity}
          className="gap-2"
          title={density === 'compact' ? 'Switch to Comfort' : 'Switch to Compact'}
        >
          {density === 'compact' ? (
            <LayoutList className="h-4 w-4" />
          ) : (
            <LayoutGrid className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">{density === 'compact' ? 'Compact' : 'Comfort'}</span>
        </Button>
      </div>

      {/* Quick filters row - premium pill chips */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Overdue chip */}
        <button
          onClick={() => onToggleQuickFilter('overdue')}
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium',
            'border transition-all duration-150',
            quickFilters.overdue
              ? 'bg-destructive/15 border-destructive/40 text-destructive'
              : 'bg-transparent border-border/60 text-muted-foreground hover:border-border hover:bg-muted/30'
          )}
        >
          <AlertCircle className="h-3.5 w-3.5" />
          Overdue
          {overdueCount > 0 && (
            <span
              className={cn(
                'ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold',
                quickFilters.overdue ? 'bg-destructive/20' : 'bg-muted'
              )}
            >
              {overdueCount}
            </span>
          )}
          {quickFilters.overdue && <Check className="h-3 w-3 ml-0.5" />}
        </button>

        {/* Today chip */}
        <button
          onClick={() => onToggleQuickFilter('today')}
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium',
            'border transition-all duration-150',
            quickFilters.today
              ? 'bg-primary/15 border-primary/40 text-primary'
              : 'bg-transparent border-border/60 text-muted-foreground hover:border-border hover:bg-muted/30'
          )}
        >
          <CalendarClock className="h-3.5 w-3.5" />
          Today
          {todayCount > 0 && (
            <span
              className={cn(
                'ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold',
                quickFilters.today ? 'bg-primary/20' : 'bg-muted'
              )}
            >
              {todayCount}
            </span>
          )}
          {quickFilters.today && <Check className="h-3 w-3 ml-0.5" />}
        </button>

        {/* Counter */}
        <div className="ml-auto text-xs text-muted-foreground">
          {displayedCount} of {totalCount}
        </div>
      </div>
    </div>
  );
}
