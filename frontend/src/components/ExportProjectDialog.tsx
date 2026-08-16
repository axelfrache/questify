import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Check, Copy, Download } from 'lucide-react';
import { useExportProject } from '@/hooks/use-api';
import type { ProjectExportBundle, ProjectSummaryResponse } from '@/lib/api';
import { downloadBundle, serializeBundle } from '@/lib/project-export';
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

interface ExportProjectDialogProps {
  project: ProjectSummaryResponse | null;
  onOpenChange: (open: boolean) => void;
}

export function ExportProjectDialog({ project, onOpenChange }: ExportProjectDialogProps) {
  const { t } = useTranslation();
  const exportProject = useExportProject();
  const [bundle, setBundle] = useState<ProjectExportBundle | null>(null);
  const [copied, setCopied] = useState(false);

  const { mutate } = exportProject;
  useEffect(() => {
    if (!project) {
      setBundle(null);
      setCopied(false);
      return;
    }
    mutate(project, {
      onSuccess: setBundle,
      onError: () => toast.error(t('projects.export.failed')),
    });
  }, [project, mutate, t]);

  const json = bundle ? serializeBundle(bundle) : '';

  const handleCopy = async () => {
    if (!json) return;
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t('projects.export.copy_failed'));
    }
  };

  return (
    <Dialog open={!!project} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('projects.export.title', { name: project?.name ?? '' })}</DialogTitle>
          <DialogDescription>{t('projects.export.description')}</DialogDescription>
        </DialogHeader>

        <Textarea
          readOnly
          value={exportProject.isPending ? t('projects.export.loading') : json}
          rows={8}
          className="h-64 max-h-[50vh] resize-none overflow-auto font-mono text-xs [field-sizing:fixed]"
        />

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t('common.close')}
          </Button>
          <Button variant="outline" onClick={handleCopy} disabled={!json} className="gap-1.5">
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? t('projects.export.copied') : t('projects.export.copy')}
          </Button>
          <Button
            onClick={() => bundle && downloadBundle(bundle)}
            disabled={!bundle}
            className="gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            {t('projects.export.download')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
