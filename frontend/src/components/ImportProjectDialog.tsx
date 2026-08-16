import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useImportProject } from '@/hooks/use-api';
import { BundleParseError, parseBundle } from '@/lib/project-export';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ImportProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportProjectDialog({ open, onOpenChange }: ImportProjectDialogProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const importProject = useImportProject();
  const [text, setText] = useState('');
  const [dragging, setDragging] = useState(false);

  const preview = useMemo(() => {
    if (!text.trim()) return null;
    try {
      return parseBundle(text);
    } catch {
      return null;
    }
  }, [text]);

  const readFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setText(String(reader.result ?? ''));
    reader.readAsText(file);
  };

  const handleConfirm = () => {
    let bundle;
    try {
      bundle = parseBundle(text);
    } catch (error) {
      const code = error instanceof BundleParseError ? error.code : 'invalid-format';
      toast.error(t(`projects.import.error_${code === 'invalid-json' ? 'json' : 'format'}`));
      return;
    }
    importProject.mutate(bundle, {
      onSuccess: ({ project, result }) => {
        toast.success(
          t('projects.import.success', { name: project.name, count: result.questsCreated })
        );
        handleClose(false);
        navigate(`/projects/${project.id}`);
      },
      onError: () => toast.error(t('projects.import.failed')),
    });
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      setText('');
      setDragging(false);
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('projects.import.title')}</DialogTitle>
          <DialogDescription>{t('projects.import.description')}</DialogDescription>
        </DialogHeader>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file) readFile(file);
          }}
          className={cn(
            'rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground transition-colors',
            dragging && 'border-primary bg-primary/5'
          )}
        >
          {t('projects.import.drop_hint')}
        </div>

        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder='{ "format": "questify.project.v1", "project": { "name": "…" }, "quests": [ … ] }'
          rows={5}
          className="max-h-[40vh] resize-none overflow-auto font-mono text-xs [field-sizing:fixed]"
        />

        {preview && (
          <p className="rounded-md bg-primary/5 px-3 py-2 text-xs text-primary">
            {t('projects.import.ready', { name: preview.project.name })}
          </p>
        )}

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => handleClose(false)}
            disabled={importProject.isPending}
          >
            {t('common.cancel')}
          </Button>
          <Button onClick={handleConfirm} disabled={!preview || importProject.isPending}>
            {importProject.isPending
              ? t('projects.import.importing')
              : t('projects.import.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
