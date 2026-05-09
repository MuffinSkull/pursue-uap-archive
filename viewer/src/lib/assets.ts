/** Public mirror of the Department of War release (same content as war.gov; see dataset README). */
const HF_DATASET_RESOLVE =
  'https://huggingface.co/datasets/Blessespain/dow-ufo-release-01/resolve/main';

export function hfResolve(relativePath: string): string {
  const trimmed = relativePath.replace(/^\/+/, '');
  const parts = trimmed.split('/').map((p) => encodeURIComponent(p));
  return `${HF_DATASET_RESOLVE}/${parts.join('/')}`;
}
