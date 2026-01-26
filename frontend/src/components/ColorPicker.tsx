import * as React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Check, AlertCircle, RotateCcw, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const PRESET_COLORS = [
  { name: 'Emerald', value: '#10b981' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Green', value: '#059669' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Orange', value: '#f97316' },
];

const RECENT_COLORS_KEY = 'questify-recent-colors';
const MAX_RECENT_COLORS = 8;
const DEFAULT_COLOR = PRESET_COLORS[0].value;

function normalizeHex(input: string): string | null {
  let hex = input.trim().toLowerCase();

  if (hex.startsWith('#')) {
    hex = hex.slice(1);
  }

  if (/^[0-9a-f]{3}$/i.test(hex)) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }

  if (/^[0-9a-f]{6}$/i.test(hex)) {
    return '#' + hex.toLowerCase();
  }

  return null;
}

function isValidHexInput(input: string): boolean {
  return normalizeHex(input) !== null;
}

function getContrastColor(hex: string): string {
  const rgb = parseInt(hex.slice(1), 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = rgb & 0xff;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

function getRecentColors(): string[] {
  try {
    const stored = localStorage.getItem(RECENT_COLORS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function addRecentColor(color: string): void {
  const normalized = normalizeHex(color);
  if (!normalized) return;

  if (PRESET_COLORS.some((p) => p.value.toLowerCase() === normalized.toLowerCase())) {
    return;
  }

  const recents = getRecentColors().filter((c) => c.toLowerCase() !== normalized.toLowerCase());
  recents.unshift(normalized);
  const trimmed = recents.slice(0, MAX_RECENT_COLORS);

  try {
    localStorage.setItem(RECENT_COLORS_KEY, JSON.stringify(trimmed));
    // eslint-disable-next-line no-empty
  } catch {}
}

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  onValidityChange?: (isValid: boolean) => void;
}

export function ColorPicker({ value, onChange, onValidityChange }: ColorPickerProps) {
  const [mode, setMode] = React.useState<'presets' | 'custom'>('presets');
  const [customInput, setCustomInput] = React.useState('');
  const [hasError, setHasError] = React.useState(false);
  const [recentColors, setRecentColors] = React.useState<string[]>([]);

  const isPresetColor = PRESET_COLORS.some((p) => p.value.toLowerCase() === value.toLowerCase());

  React.useEffect(() => {
    if (!isPresetColor && value) {
      setMode('custom');
      setCustomInput(value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    setRecentColors(getRecentColors());
  }, []);

  React.useEffect(() => {
    if (mode === 'custom') {
      const isValid = isValidHexInput(customInput) || customInput === '';
      onValidityChange?.(isValid || customInput === '');
      setHasError(customInput !== '' && !isValid);
    } else {
      onValidityChange?.(true);
      setHasError(false);
    }
  }, [mode, customInput, onValidityChange]);

  const handlePresetSelect = (color: string) => {
    onChange(color);
    setCustomInput('');
    setHasError(false);
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setCustomInput(input);

    const normalized = normalizeHex(input);
    if (normalized) {
      onChange(normalized);
      setHasError(false);
    } else if (input !== '') {
      setHasError(true);
    } else {
      setHasError(false);
    }
  };

  const handleCustomInputBlur = () => {
    const normalized = normalizeHex(customInput);
    if (normalized) {
      setCustomInput(normalized);
      onChange(normalized);
      addRecentColor(normalized);
      setRecentColors(getRecentColors());
    }
  };

  const handleRecentSelect = (color: string) => {
    setCustomInput(color);
    onChange(color);
  };

  const handleReset = () => {
    onChange(DEFAULT_COLOR);
    setCustomInput('');
    setHasError(false);
    setMode('presets');
  };

  const handleSwitchToCustom = () => {
    setMode('custom');
    if (isPresetColor) {
      setCustomInput(value);
    }
  };

  const displayColor = normalizeHex(customInput) || value || DEFAULT_COLOR;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className="w-9 h-9 rounded-lg border-2 border-border shadow-sm shrink-0 flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
              style={{ backgroundColor: displayColor }}
            >
              {mode === 'presets' && (
                <Check className="w-4 h-4" style={{ color: getContrastColor(displayColor) }} />
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>{displayColor}</TooltipContent>
        </Tooltip>

        <Tabs
          value={mode}
          onValueChange={(v) => setMode(v as 'presets' | 'custom')}
          className="flex-1"
        >
          <TabsList className="w-full">
            <TabsTrigger value="presets" className="flex-1">
              Presets
            </TabsTrigger>
            <TabsTrigger value="custom" className="flex-1">
              Custom
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {mode === 'presets' ? (
        <div className="space-y-2">
          <div className="grid grid-cols-6 gap-1.5">
            {PRESET_COLORS.map((color) => (
              <Tooltip key={color.value}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => handlePresetSelect(color.value)}
                    className={cn(
                      'w-8 h-8 rounded-lg transition-all hover:scale-110 flex items-center justify-center',
                      value.toLowerCase() === color.value.toLowerCase()
                        ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                        : 'hover:ring-1 hover:ring-muted-foreground/30'
                    )}
                    style={{ backgroundColor: color.value }}
                  >
                    {value.toLowerCase() === color.value.toLowerCase() && (
                      <Check className="w-4 h-4" style={{ color: getContrastColor(color.value) }} />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent>{color.name}</TooltipContent>
              </Tooltip>
            ))}

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handleSwitchToCustom}
                  className="w-8 h-8 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Custom color</TooltipContent>
            </Tooltip>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Input
                value={customInput}
                onChange={handleCustomInputChange}
                onBlur={handleCustomInputBlur}
                placeholder="#ffffff"
                className={cn(
                  'pr-8 font-mono',
                  hasError && 'border-destructive focus-visible:ring-destructive'
                )}
              />
              {hasError && (
                <AlertCircle className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-destructive" />
              )}
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <label
                  className="w-9 h-9 rounded-lg border-2 border-border shrink-0 cursor-pointer transition-transform hover:scale-105 block relative overflow-hidden"
                  style={{
                    backgroundColor: normalizeHex(customInput) || '#ffffff',
                  }}
                >
                  <input
                    type="color"
                    value={normalizeHex(customInput) || '#ffffff'}
                    onChange={(e) => {
                      const color = e.target.value.toLowerCase();
                      setCustomInput(color);
                      onChange(color);
                      setHasError(false);
                    }}
                    onBlur={handleCustomInputBlur}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                </label>
              </TooltipTrigger>
              <TooltipContent>Click to pick color</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleReset}
                  className="shrink-0"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reset to default</TooltipContent>
            </Tooltip>
          </div>

          {hasError && (
            <p className="text-xs text-destructive">Invalid hex format. Use #RRGGBB or #RGB</p>
          )}

          {recentColors.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">Recent</p>
              <div className="flex gap-1.5 flex-wrap">
                {recentColors.map((color) => (
                  <Tooltip key={color}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => handleRecentSelect(color)}
                        className={cn(
                          'w-7 h-7 rounded-md transition-all hover:scale-110',
                          customInput.toLowerCase() === color.toLowerCase()
                            ? 'ring-2 ring-primary ring-offset-1 ring-offset-background'
                            : 'hover:ring-1 hover:ring-muted-foreground/30'
                        )}
                        style={{ backgroundColor: color }}
                      />
                    </TooltipTrigger>
                    <TooltipContent>{color}</TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
