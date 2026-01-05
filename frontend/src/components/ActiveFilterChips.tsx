import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface ActiveFilterChipsProps {
  filters: { type: string; label: string; value: string }[];
  onRemove: (type: string, value: string) => void;
  onClearAll: () => void;
}

export function ActiveFilterChips({ filters, onRemove, onClearAll }: ActiveFilterChipsProps) {
  if (filters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {filters.map((filter, idx) => (
        <Badge
          key={`${filter.type}-${filter.value}-${idx}`}
          variant="secondary"
          className="gap-1 pr-1"
        >
          {filter.label}
          <button
            onClick={() => onRemove(filter.type, filter.value)}
            className="ml-1 rounded-full p-0.5 hover:bg-muted transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      <Button
        variant="ghost"
        size="sm"
        onClick={onClearAll}
        className="text-xs text-muted-foreground h-7"
      >
        Clear all
      </Button>
    </div>
  );
}
