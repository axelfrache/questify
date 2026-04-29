import * as React from 'react';
import { EmojiPicker as FrimousseEmojiPicker, type EmojiPickerListComponents } from 'frimousse';
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
            'px-2 py-1.5 text-xs font-medium text-muted-foreground sticky top-0 bg-card border-b',
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
              'transition-[background-color,border-color] duration-100',
              'hover:bg-accent hover:border-border/60',
              'focus-visible:outline-none focus-visible:border-primary/70',
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
    <div className="space-y-1.5">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 text-sm',
          'hover:bg-muted/40 transition-colors',
          open && 'border-ring ring-[2px] ring-ring/25'
        )}
      >
        <span className="flex items-center gap-2">
          {value ? (
            <span className="text-lg leading-none">{value}</span>
          ) : (
            <span className="text-muted-foreground">Pick an emoji...</span>
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
              className="h-5 w-5 rounded-sm hover:bg-muted flex items-center justify-center"
            >
              <X className="h-3 w-3" />
            </span>
          )}
          <ChevronDown
            className={cn(
              'h-4 w-4 shrink-0 opacity-50 transition-transform duration-200',
              open && 'rotate-180'
            )}
          />
        </div>
      </button>

      {/* Inline picker panel */}
      {open && (
        <div className="rounded-md border bg-card shadow-sm p-2.5 space-y-2">
          <FrimousseEmojiPicker.Root
            className="flex flex-col"
            columns={8}
            locale="en"
            emojibaseUrl="/emojibase-data"
            onEmojiSelect={({ emoji }) => handleSelect(emoji)}
          >
            {/* Search + skin tone */}
            <div className="flex items-center gap-2 mb-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <FrimousseEmojiPicker.Search
                  placeholder="Search emojis..."
                  className="flex h-8 w-full rounded-md border border-input bg-transparent pl-7 pr-3 py-1 text-sm outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus:border-ring focus:ring-[2px] focus:ring-ring/25"
                />
              </div>
              <FrimousseEmojiPicker.SkinToneSelector
                className="h-8 w-8 shrink-0 rounded-md border bg-background text-sm hover:bg-accent"
                aria-label="Change skin tone"
              />
            </div>

            {/* Emoji grid */}
            <FrimousseEmojiPicker.Viewport className="h-44 rounded-md border overflow-y-auto">
              <FrimousseEmojiPicker.Loading>
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                  Loading...
                </div>
              </FrimousseEmojiPicker.Loading>
              <FrimousseEmojiPicker.Empty>
                {({ search }) => (
                  <div className="h-full flex items-center justify-center text-sm text-muted-foreground px-3 text-center">
                    {search ? `No emoji for "${search}"` : 'No emoji available.'}
                  </div>
                )}
              </FrimousseEmojiPicker.Empty>
              <FrimousseEmojiPicker.List components={listComponents} />
            </FrimousseEmojiPicker.Viewport>
          </FrimousseEmojiPicker.Root>
        </div>
      )}
    </div>
  );
}
