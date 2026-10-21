/** Prefixes a path under public/ with the site's base path. */
export function withBase(path: string) {
  return `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}
