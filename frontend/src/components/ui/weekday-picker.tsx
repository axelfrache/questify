import { cn } from '@/lib/utils';

const WEEKDAYS = [
  { value: 1, label: 'M', full: 'Monday' },
  { value: 2, label: 'T', full: 'Tuesday' },
  { value: 3, label: 'W', full: 'Wednesday' },
  { value: 4, label: 'T', full: 'Thursday' },
  { value: 5, label: 'F', full: 'Friday' },
  { value: 6, label: 'S', full: 'Saturday' },
  { value: 7, label: 'S', full: 'Sunday' },
];

interface WeekdayPickerProps {
  selectedDays: number[];
  onDaysChange: (days: number[]) => void;
  disabled?: boolean;
}

export function WeekdayPicker({ selectedDays, onDaysChange, disabled }: WeekdayPickerProps) {
  const toggleDay = (day: number) => {
    if (disabled) return;
    if (selectedDays.includes(day)) {
      onDaysChange(selectedDays.filter((d) => d !== day));
    } else {
      onDaysChange([...selectedDays, day].sort((a, b) => a - b));
    }
  };

  return (
    <div className="flex gap-1 overflow-visible py-1">
      {WEEKDAYS.map((day) => {
        const isSelected = selectedDays.includes(day.value);
        return (
          <button
            key={day.value}
            type="button"
            onClick={() => toggleDay(day.value)}
            disabled={disabled}
            title={day.full}
            className={cn(
              'h-8 w-8 rounded-full text-xs font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
              isSelected
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80',
              disabled && 'cursor-not-allowed opacity-50'
            )}
          >
            {day.label}
          </button>
        );
      })}
    </div>
  );
}
