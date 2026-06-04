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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, AlertTriangle } from 'lucide-react';
import { ApiError } from '@/lib/api';
import { useDeleteAccount } from '@/hooks/use-api';

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onSuccess: () => void;
}

export function DeleteAccountDialog({
  open,
  onOpenChange,
  userId,
  onSuccess,
}: DeleteAccountDialogProps) {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const deleteAccountMutation = useDeleteAccount();

  const handleDelete = async () => {
    if (!password.trim()) {
      setError(t('delete_account.password') + ' is required');
      return;
    }

    setError(null);

    try {
      await deleteAccountMutation.mutateAsync({ id: userId, password });
      onSuccess();
    } catch (err) {
      if (err instanceof ApiError || err instanceof Error) {
        setError(err.message);
      } else {
        setError(t('delete_account.title') + ' failed');
      }
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!deleteAccountMutation.isPending) {
      setPassword('');
      setError(null);
      onOpenChange(isOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            {t('delete_account.title')}
          </DialogTitle>
          <DialogDescription>{t('delete_account.description')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <p className="text-sm text-destructive">{t('delete_account.confirm_hint')}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="delete-password">{t('delete_account.password')}</Label>
            <Input
              id="delete-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('delete_account.password_placeholder')}
              disabled={deleteAccountMutation.isPending}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={deleteAccountMutation.isPending}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteAccountMutation.isPending || !password}
          >
            {deleteAccountMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('delete_account.deleting')}
              </>
            ) : (
              t('delete_account.submit')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
