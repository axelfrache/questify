import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const [questAction, setQuestAction] = useState<'MOVE_TO_INBOX' | 'DELETE_ALL'>('MOVE_TO_INBOX');

  const handleConfirm = () => {
    onConfirm(questAction);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('delete_region.title', { name: regionName })}</DialogTitle>
          <DialogDescription>
            {questCount === 0
              ? t('delete_region.empty_hint')
              : t('delete_region.has_quests', { count: questCount })}
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
                  {t('delete_region.move_to_inbox')}
                </Label>
                <p className="text-xs text-muted-foreground mt-1">{t('delete_region.move_hint')}</p>
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
                  {t('delete_region.delete_quests')}
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('delete_region.delete_hint')}
                </p>
              </div>
            </div>
          </RadioGroup>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            {t('common.cancel')}
          </Button>
          <Button
            variant={questAction === 'DELETE_ALL' ? 'destructive' : 'default'}
            onClick={handleConfirm}
            disabled={isPending}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('delete_region.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
