import * as React from 'react';
import { EmojiPicker as FrimousseEmojiPicker, type EmojiPickerListComponents } from 'frimousse';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronDown, X, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmojiPickerProps {
  value?: string;
  onChange: (emoji: string) => void;
}

export function EmojiPicker({ value, onChange }: EmojiPickerProps) {
  const [open, setOpen] = React.useState(false);

  const listComponents = React.useMemo<Partial<EmojiPickerListComponents>>(
    () => ({
      CategoryHeader: ({ category, className, ...props }) => (
        <div
          {...props}
          className={cn(
            'px-2 py-1.5 text-xs font-medium text-muted-foreground bg-background/95 border-b',
            className
          )}
        >
          {category.label}
        </div>
      ),
      Row: ({ className, ...props }) => <div {...props} className={cn('flex px-1', className)} />,
      Emoji: ({ emoji, className, ...props }) => {
        const isSelected = emoji.emoji === value;
        return (
          <button
            type="button"
            {...props}
            className={cn(
              'h-8 w-8 box-border flex items-center justify-center rounded-md text-lg border border-transparent',
              'transition-[background-color,border-color] duration-150',
              'hover:bg-accent hover:border-border/60',
              'focus-visible:outline-none focus-visible:border-primary/70',
              'data-[active]:bg-accent data-[active]:border-primary/60',
              isSelected && 'bg-primary/15 border-primary/70',
              className
            )}
          >
            {emoji.emoji}
          </button>
        );
      },
    }),
    [value]
  );

  const handleSelect = (emoji: string) => {
    onChange(emoji);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

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
                  (e.key === 'Enter' || e.key === ' ') &&
                  handleClear(e as unknown as React.MouseEvent)
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
      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={8}
        collisionPadding={16}
        className={cn(
          'flex w-[min(20rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] flex-col overflow-hidden p-3',
          'max-h-[min(calc(100dvh-2rem),var(--radix-popover-content-available-height))]'
        )}
      >
        <FrimousseEmojiPicker.Root
          className="flex min-h-0 flex-1 flex-col"
          columns={8}
          locale="en"
          emojibaseUrl="/emojibase-data"
          onEmojiSelect={({ emoji }) => handleSelect(emoji)}
        >
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              <FrimousseEmojiPicker.Search
                placeholder="Search emojis..."
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] pl-8 file:inline-flex file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Emoji picker</span>
              <FrimousseEmojiPicker.SkinToneSelector
                className="h-7 w-7 rounded-md border bg-background text-sm hover:bg-accent"
                aria-label="Change skin tone"
              />
            </div>
          </div>
          <FrimousseEmojiPicker.Viewport className="mt-2 min-h-0 flex-1 rounded-md border">
            <FrimousseEmojiPicker.Loading>
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                Loading emojis...
              </div>
            </FrimousseEmojiPicker.Loading>
            <FrimousseEmojiPicker.Empty>
              {({ search }) => (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground px-3 text-center">
                  {search ? `No emoji found for "${search}"` : 'No emoji available.'}
                </div>
              )}
            </FrimousseEmojiPicker.Empty>
            <FrimousseEmojiPicker.List components={listComponents} />
          </FrimousseEmojiPicker.Viewport>
        </FrimousseEmojiPicker.Root>
      </PopoverContent>
    </Popover>
  );
}
