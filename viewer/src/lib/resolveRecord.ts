import type { ReleaseRecord } from '../types';
import { hfResolve } from './assets';
import type { VideoLookupMap } from './videoLookup';
import { resolveVideoUrl } from './videoLookup';

export interface FileRef {
  path: string;
  url: string;
  kind: 'pdf' | 'image' | 'thumb' | 'other';
}

export interface ResolvedRecord {
  record: ReleaseRecord;
  index: number;
  thumbnailUrl: string | null;
  videoUrl: string | null;
  files: FileRef[];
}

function classifyKind(path: string): FileRef['kind'] {
  const lower = path.toLowerCase();
  if (lower.startsWith('thumbnails/')) return 'thumb';
  if (lower.endsWith('.pdf')) return 'pdf';
  if (/\.(png|jpe?g|gif|webp)$/i.test(lower)) return 'image';
  return 'other';
}

export function resolveRecord(
  record: ReleaseRecord,
  index: number,
  lookup: VideoLookupMap,
): ResolvedRecord {
  const paths = record.files ?? [];
  const files: FileRef[] = paths.map((path) => ({
    path,
    url: hfResolve(path),
    kind: classifyKind(path),
  }));

  const thumbPath = paths.find((p) => p.startsWith('thumbnails/'));
  const thumbnailUrl = thumbPath ? hfResolve(thumbPath) : null;

  return {
    record,
    index,
    thumbnailUrl,
    videoUrl: resolveVideoUrl(record, lookup),
    files,
  };
}
