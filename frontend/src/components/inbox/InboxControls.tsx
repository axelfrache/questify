import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Filter, ArrowUpDown, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GroupBy, SortBy, Density, QuickFilters } from '@/types/inboxTypes';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface InboxControlsProps {
  search: string;
  groupBy: GroupBy;
  sortBy: SortBy;
  density: Density;
  quickFilters: QuickFilters;
  allCount: number;
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

export function InboxControls({
  search,
  groupBy,
  sortBy,
  density,
  quickFilters,
  allCount,
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
  const { t } = useTranslation();

  const GROUP_BY_OPTIONS: { value: GroupBy; label: string }[] = [
    { value: 'none', label: t('common.all') },
    { value: 'region', label: t('inbox_controls.region') },
    { value: 'project', label: t('inbox_controls.project') },
  ];

  const SORT_BY_OPTIONS: { value: SortBy; label: string }[] = [
    { value: 'dueDate', label: t('inbox_controls.due_date') },
    { value: 'priority', label: t('inbox_controls.priority') },
  ];

  const DENSITY_LABELS: Record<Density, string> = {
    comfort: t('inbox_controls.comfort'),
    compact: t('inbox_controls.compact'),
  };

  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    const timer = setTimeout(() => onSearchChange(searchInput), 250);
    return () => clearTimeout(timer);
  }, [searchInput, onSearchChange]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  }, []);

  const activeFilter = quickFilters.overdue ? 'overdue' : quickFilters.today ? 'today' : 'all';

  const chips = [
    { id: 'all' as const, label: t('inbox_controls.all'), count: allCount },
    { id: 'today' as const, label: t('inbox_controls.today'), count: todayCount },
    { id: 'overdue' as const, label: t('inbox_controls.overdue'), count: overdueCount },
  ];

  return (
    <div className="space-y-3">
      {/* Unified toolbar */}
      <div className="flex items-center gap-0 rounded-md border border-border bg-card overflow-hidden">
        {/* Search section */}
        <div className="flex flex-1 items-center gap-2 px-3 py-2">
          <Search className="h-[14px] w-[14px] shrink-0 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('inbox_controls.search_placeholder')}
            value={searchInput}
            onChange={handleSearchChange}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none min-w-0"
          />
          <kbd className="hidden sm:inline-flex items-center rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            ⌘K
          </kbd>
        </div>

        {/* Separator */}
        <div className="h-6 w-px bg-border mx-0.5 shrink-0" />

        {/* Filter (Group by) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors whitespace-nowrap h-full">
              <Filter className="h-3.5 w-3.5" />
              <span>
                {GROUP_BY_OPTIONS.find((o) => o.value === groupBy)?.label ?? t('common.all')}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            {GROUP_BY_OPTIONS.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => onGroupByChange(option.value)}
                className={cn(groupBy === option.value && 'bg-accent font-medium')}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Sort */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors whitespace-nowrap h-full">
              <ArrowUpDown className="h-3.5 w-3.5" />
              <span>
                {SORT_BY_OPTIONS.find((o) => o.value === sortBy)?.label ??
                  t('inbox_controls.due_date')}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            {SORT_BY_OPTIONS.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => onSortByChange(option.value)}
                className={cn(sortBy === option.value && 'bg-accent font-medium')}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Density */}
        <button
          onClick={onToggleDensity}
          title={density === 'compact' ? t('inbox_controls.comfort') : t('inbox_controls.compact')}
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors whitespace-nowrap h-full"
        >
          <LayoutGrid className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{DENSITY_LABELS[density]}</span>
        </button>
      </div>

      {/* Filter chips + counter */}
      <div className="flex items-center gap-1.5">
        {chips.map((chip) => {
          const isActive = activeFilter === chip.id;
          return (
            <button
              key={chip.id}
              onClick={() => {
                if (chip.id === 'all') {
                  if (quickFilters.overdue) onToggleQuickFilter('overdue');
                  if (quickFilters.today) onToggleQuickFilter('today');
                } else {
                  const other = chip.id === 'today' ? 'overdue' : 'today';
                  if (quickFilters[other]) onToggleQuickFilter(other);
                  onToggleQuickFilter(chip.id as keyof QuickFilters);
                }
              }}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-sm transition-colors',
                isActive
                  ? 'border-border font-medium text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {chip.label}
              <span className="font-mono text-xs text-muted-foreground">{chip.count}</span>
            </button>
          );
        })}

        <div className="flex-1" />
        <span className="font-mono text-xs text-muted-foreground">
          {t('inbox_controls.count', { displayed: displayedCount, total: totalCount })}
        </span>
      </div>
    </div>
  );
}
