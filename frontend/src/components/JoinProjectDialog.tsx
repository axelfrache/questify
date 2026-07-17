import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useJoinProject } from '@/hooks/use-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface JoinProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JoinProjectDialog({ open, onOpenChange }: JoinProjectDialogProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const joinMutation = useJoinProject();
  const [token, setToken] = useState('');

  const handleJoin = () => {
    const trimmed = token.trim();
    if (!trimmed) return;
    joinMutation.mutate(trimmed, {
      onSuccess: (project) => {
        toast.success(t('projects.join_success', { name: project.name }));
        onOpenChange(false);
        setToken('');
        navigate(`/projects/${project.id}`);
      },
      onError: () => toast.error(t('projects.join_failed')),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('projects.join_title')}</DialogTitle>
          <DialogDescription>{t('projects.join_description')}</DialogDescription>
        </DialogHeader>

        <Input
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder={t('projects.join_placeholder')}
          className="font-mono"
          onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
          autoFocus
        />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleJoin} disabled={!token.trim() || joinMutation.isPending}>
            {joinMutation.isPending ? t('projects.joining') : t('projects.join_button')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
