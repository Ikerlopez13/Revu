/* eslint-disable @next/next/no-img-element */
/** Logo con variante para modo oscuro (texto blanco, estrella amarilla). */
export function Logo({ className }: { className?: string }) {
  return (
    <picture>
      <source srcSet="/assets/logo-dark.svg" media="(prefers-color-scheme: dark)" />
      <img src="/assets/logo.svg" alt="RevuTags" className={className} />
    </picture>
  );
}
