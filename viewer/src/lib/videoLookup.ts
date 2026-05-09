import type { DvidsEntry, ReleaseRecord } from '../types';

export function buildVideoLookup(entries: DvidsEntry[]) {
  const byId = new Map<string, string>();
  const byTitle = new Map<string, string>();
  for (const e of entries) {
    byId.set(e.dvids.id, e.dvids.video);
    byTitle.set(e.row_title, e.dvids.video);
  }
  return { byId, byTitle };
}

export type VideoLookupMap = ReturnType<typeof buildVideoLookup>;

export function resolveVideoUrl(
  record: ReleaseRecord,
  lookup: VideoLookupMap,
): string | null {
  if (record.type !== 'VID') return null;
  const byTitle = lookup.byTitle.get(record.title);
  if (byTitle) return byTitle;
  if (record.dvids_video_id) {
    return lookup.byId.get(record.dvids_video_id) ?? null;
  }
  return null;
}
