import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { ChevronDown, X, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

const PRESET_EMOJIS = ['💼', '🧠', '🏃', '❤️', '📚', '🏠', '💰', '💻', '🎯', '🍃', '🎵', '✈️'];

const CATEGORY_EMOJIS: Record<string, string[]> = {
  work: ['💼', '📊', '📈', '💡', '🖥️', '📋'],
  health: ['❤️', '🏥', '💊', '🩺', '🧘', '😊'],
  fitness: ['🏃', '💪', '🏋️', '🚴', '⚽', '🎾'],
  learning: ['📚', '🎓', '✏️', '📖', '🔬', '🧪'],
  home: ['🏠', '🛋️', '🧹', '🍳', '🛏️', '🪴'],
  finance: ['💰', '💵', '💳', '📈', '🏦', '🪙'],
  tech: ['💻', '📱', '🖥️', '⌨️', '🔧', '🤖'],
  creative: ['🎨', '🎭', '🎬', '📷', '✍️', '🎤'],
  nature: ['🍃', '🌳', '🌸', '🌊', '⛰️', '🌅'],
  travel: ['✈️', '🚗', '🗺️', '🏖️', '🌍', '🏕️'],
  social: ['👥', '🎉', '💬', '🤝', '❤️', '🎁'],
  food: ['🍽️', '🍕', '🥗', '☕', '🍰', '🍎'],
};

const NAME_TO_EMOJI: Record<string, string> = {
  work: '💼',
  job: '💼',
  career: '💼',
  health: '❤️',
  wellness: '❤️',
  fitness: '🏃',
  exercise: '🏃',
  gym: '💪',
  study: '📚',
  learning: '📚',
  education: '📚',
  school: '🎓',
  home: '🏠',
  house: '🏠',
  family: '👨‍👩‍👧‍👦',
  finance: '💰',
  money: '💰',
  budget: '💵',
  code: '💻',
  coding: '💻',
  dev: '💻',
  programming: '💻',
  goals: '🎯',
  target: '🎯',
  nature: '🍃',
  outdoor: '🌳',
  music: '🎵',
  travel: '✈️',
  trip: '✈️',
  vacation: '🏖️',
  food: '🍽️',
  cooking: '🍳',
  creative: '🎨',
  art: '🎨',
  social: '👥',
  friends: '👥',
};

interface EmojiPickerProps {
  value?: string;
  onChange: (emoji: string) => void;
  regionName?: string;
}

export function EmojiPicker({ value, onChange, regionName }: EmojiPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [showMore, setShowMore] = React.useState(false);
  const [hasManuallySelected, setHasManuallySelected] = React.useState(false);

  React.useEffect(() => {
    if (regionName && !hasManuallySelected && !value) {
      const normalizedName = regionName.toLowerCase().trim();
      for (const [key, emoji] of Object.entries(NAME_TO_EMOJI)) {
        if (normalizedName.includes(key)) {
          onChange(emoji);
          break;
        }
      }
    }
  }, [regionName, hasManuallySelected, value, onChange]);

  const handleSelect = (emoji: string) => {
    onChange(emoji);
    setHasManuallySelected(true);
    setOpen(false);
    setSearch('');
    setShowMore(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setHasManuallySelected(false);
  };

  const allEmojis = React.useMemo(() => {
    const all = new Set<string>(PRESET_EMOJIS);
    Object.values(CATEGORY_EMOJIS).forEach((emojis) => {
      emojis.forEach((emoji) => all.add(emoji));
    });
    return Array.from(all);
  }, []);

  const filteredEmojis = React.useMemo(() => {
    if (!search) return showMore ? allEmojis : PRESET_EMOJIS;
    const searchLower = search.toLowerCase();
    const matching: string[] = [];
    for (const [key, emoji] of Object.entries(NAME_TO_EMOJI)) {
      if (key.includes(searchLower) && !matching.includes(emoji)) {
        matching.push(emoji);
      }
    }
    for (const [category, emojis] of Object.entries(CATEGORY_EMOJIS)) {
      if (category.includes(searchLower)) {
        emojis.forEach((emoji) => {
          if (!matching.includes(emoji)) matching.push(emoji);
        });
      }
    }
    return matching.length > 0 ? matching : allEmojis;
  }, [search, showMore, allEmojis]);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select emoji"
          className={cn('w-full justify-between h-9 px-3', !value && 'text-muted-foreground')}
        >
          <span className="flex items-center gap-2">
            {value ? (
              <span className="text-lg">{value}</span>
            ) : (
              <span className="text-sm">Pick an emoji...</span>
            )}
          </span>
          <div className="flex items-center gap-1">
            {value && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClear}
                onKeyDown={(e) =>
                  e.key === 'Enter' && handleClear(e as unknown as React.MouseEvent)
                }
                className="h-4 w-4 rounded-sm hover:bg-muted flex items-center justify-center"
              >
                <X className="h-3 w-3" />
              </span>
            )}
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search emojis..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
          <div className="grid grid-cols-6 gap-1">
            {filteredEmojis.slice(0, showMore || search ? 24 : 12).map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleSelect(emoji)}
                className={cn(
                  'h-8 w-8 flex items-center justify-center rounded-md text-lg hover:bg-accent transition-colors',
                  value === emoji && 'bg-accent ring-1 ring-primary'
                )}
              >
                {emoji}
              </button>
            ))}
          </div>
          {!search && !showMore && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-muted-foreground"
              onClick={() => setShowMore(true)}
            >
              Show more emojis...
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
