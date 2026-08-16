import type { ProjectContentExport, ProjectDetailResponse, ProjectExportBundle } from './api';

export const EXPORT_FORMAT = 'questify.project.v1' as const;
export const EXPORT_FILE_EXTENSION = '.questify.json';

export function buildExportBundle(
  project: Pick<ProjectDetailResponse, 'name' | 'icon' | 'description'>,
  content: ProjectContentExport
): ProjectExportBundle {
  return {
    format: EXPORT_FORMAT,
    exportedAt: new Date().toISOString(),
    project: {
      name: project.name,
      icon: project.icon,
      description: project.description,
    },
    categories: content.categories ?? [],
    quests: content.quests ?? [],
  };
}

export function serializeBundle(bundle: ProjectExportBundle): string {
  return JSON.stringify(bundle, null, 2);
}

export function bundleFileName(name: string): string {
  const slug =
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'project';
  return `${slug}${EXPORT_FILE_EXTENSION}`;
}

export function downloadBundle(bundle: ProjectExportBundle): void {
  const blob = new Blob([serializeBundle(bundle)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = bundleFileName(bundle.project.name);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export class BundleParseError extends Error {
  code: 'invalid-json' | 'invalid-format';

  constructor(code: 'invalid-json' | 'invalid-format') {
    super(code);
    this.name = 'BundleParseError';
    this.code = code;
  }
}

export function parseBundle(raw: string): ProjectExportBundle {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new BundleParseError('invalid-json');
  }
  if (!isBundle(parsed)) throw new BundleParseError('invalid-format');
  return parsed;
}

function isBundle(value: unknown): value is ProjectExportBundle {
  if (typeof value !== 'object' || value === null) return false;
  const bundle = value as Record<string, unknown>;
  if (bundle.format !== EXPORT_FORMAT) return false;
  const project = bundle.project as Record<string, unknown> | undefined;
  if (!project || typeof project.name !== 'string' || project.name.trim() === '') return false;
  if (bundle.quests !== undefined && !Array.isArray(bundle.quests)) return false;
  if (bundle.categories !== undefined && !Array.isArray(bundle.categories)) return false;
  return true;
}
