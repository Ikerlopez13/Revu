const ALIAS_REGEX = /^[a-z0-9&_-]{1,40}$/;

/** Alias legacy canónico (minúsculas) o null si no puede ser un alias. */
export function normalizeAlias(raw: string): string | null {
  let value: string;
  try {
    value = decodeURIComponent(raw);
  } catch {
    return null;
  }
  value = value.trim().toLowerCase();
  return ALIAS_REGEX.test(value) ? value : null;
}
