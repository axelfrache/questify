import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Inbox, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeleteRegionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  regionName: string;
  questCount: number;
  onConfirm: (questAction: 'MOVE_TO_INBOX' | 'DELETE_ALL') => void;
  isPending?: boolean;
}

export function DeleteRegionDialog({
  open,
  onOpenChange,
  regionName,
  questCount,
  onConfirm,
  isPending = false,
}: DeleteRegionDialogProps) {
  const [questAction, setQuestAction] = useState<'MOVE_TO_INBOX' | 'DELETE_ALL'>('MOVE_TO_INBOX');

  const handleConfirm = () => {
    onConfirm(questAction);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete region "{regionName}"?</DialogTitle>
          <DialogDescription>
            {questCount === 0 ? (
              'This region has no active quests. Completed quests will remain in your history.'
            ) : (
              <>
                This region has <strong>{questCount}</strong> active{' '}
                {questCount === 1 ? 'quest' : 'quests'}. What would you like to do with them?
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {questCount > 0 && (
          <RadioGroup
            value={questAction}
            onValueChange={(v: string) => setQuestAction(v as typeof questAction)}
            className="space-y-3 py-2"
          >
            <div
              className={cn(
                'flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors',
                questAction === 'MOVE_TO_INBOX' && 'border-primary bg-primary/5'
              )}
              onClick={() => setQuestAction('MOVE_TO_INBOX')}
            >
              <RadioGroupItem value="MOVE_TO_INBOX" id="move" className="mt-0.5" />
              <div className="flex-1">
                <Label htmlFor="move" className="flex items-center gap-2 cursor-pointer">
                  <Inbox className="h-4 w-4" />
                  Move active quests to Inbox
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Active quests move to Inbox. Completed history is preserved.
                </p>
              </div>
            </div>

            <div
              className={cn(
                'flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors',
                questAction === 'DELETE_ALL' && 'border-destructive bg-destructive/5'
              )}
              onClick={() => setQuestAction('DELETE_ALL')}
            >
              <RadioGroupItem value="DELETE_ALL" id="delete" className="mt-0.5" />
              <div className="flex-1">
                <Label htmlFor="delete" className="flex items-center gap-2 cursor-pointer">
                  <Trash2 className="h-4 w-4" />
                  Delete active quests
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Only active quests are deleted. Completed history is preserved.
                </p>
              </div>
            </div>
          </RadioGroup>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant={questAction === 'DELETE_ALL' ? 'destructive' : 'default'}
            onClick={handleConfirm}
            disabled={isPending}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete region
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
