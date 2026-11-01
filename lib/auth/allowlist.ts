/** ADMIN_EMAILS="a@x.com, b@y.com" → conjunto normalizado. */
export function parseAllowlist(raw: string | undefined | null): Set<string> {
  return new Set(
    (raw ?? "")
      .split(/[,\s]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.includes("@")),
  );
}

export function isAllowedEmail(email: string | null | undefined, allowlist: ReadonlySet<string>): boolean {
  return !!email && allowlist.has(email.trim().toLowerCase());
}

export const adminAllowlist = () => parseAllowlist(process.env.ADMIN_EMAILS);
