// Páginas de estado de /t/{code}. HTML plano (sin React) para que respondan rápido.

export type StatusKind = "inactive" | "not_found" | "rate_limited" | "error";

const COPY: Record<StatusKind, { title: string; text: string }> = {
  inactive: {
    title: "Este tag aún no está activado",
    text: "Si eres el responsable del local, escríbenos y lo dejamos funcionando en un momento.",
  },
  not_found: {
    title: "Este enlace no existe",
    text: "Comprueba que has escaneado un tag de RevuTags o contacta con nosotros.",
  },
  error: {
    title: "Algo ha fallado",
    text: "Vuelve a acercar el móvil al tag en unos segundos.",
  },
  rate_limited: {
    title: "Demasiados intentos",
    text: "Espera un minuto y vuelve a acercar el móvil al tag.",
  },
};

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

export function whatsappLink(number: string, code?: string): string {
  const text = code
    ? `Hola, tengo un tag de RevuTags (${code}) que aún no está activado.`
    : "Hola, tengo una duda sobre un tag de RevuTags.";
  return `https://wa.me/${number.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}

export type StatusPageOptions = {
  /** Enlace discreto "Soy un admin" (solo en "no existe"). */
  adminHref?: string;
};

export function renderStatusPage(
  kind: StatusKind,
  whatsappNumber: string,
  code?: string,
  options: StatusPageOptions = {},
): string {
  const { title, text } = COPY[kind];
  const wa = escapeHtml(whatsappLink(whatsappNumber, code));
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${escapeHtml(title)} · RevuTags</title>
<style>
  :root { --bg:#f6f6f7; --card:#fff; --ink:#14161a; --muted:#5f6368; --brand:#ef2b2d; --wa:#1fa855; }
  @media (prefers-color-scheme: dark) { :root { --bg:#0f1012; --card:#1a1c20; --ink:#f1f1f2; --muted:#a3a7ad; } }
  * { box-sizing: border-box; }
  body { margin:0; min-height:100dvh; display:grid; place-items:center; padding:24px 16px;
    background:var(--bg); color:var(--ink); font:16px/1.5 -apple-system, BlinkMacSystemFont, "Inter", system-ui, sans-serif; }
  main { width:100%; max-width:400px; background:var(--card); border-radius:20px; padding:32px 24px; text-align:center;
    box-shadow:0 1px 2px rgba(0,0,0,.06), 0 8px 24px rgba(0,0,0,.06); }
  .logo { height:28px; margin-bottom:24px; }
  .dot { width:56px; height:56px; border-radius:50%; margin:0 auto 20px; display:grid; place-items:center;
    background:color-mix(in srgb, var(--brand) 12%, transparent); color:var(--brand); font-size:28px; font-weight:700; }
  h1 { font-size:22px; line-height:1.25; margin:0 0 8px; }
  p { margin:0 0 24px; color:var(--muted); }
  a.btn { display:block; padding:14px 18px; border-radius:12px; background:var(--wa); color:#fff; text-decoration:none; font-weight:600; }
  small { display:block; margin-top:20px; color:var(--muted); font-size:13px; }
  a.admin { display:inline-block; margin-top:20px; padding:6px 8px; color:var(--muted); font-size:12px; text-decoration:underline; opacity:.75; }
</style>
</head>
<body>
<main>
  <picture><source srcset="/assets/logo-dark.svg" media="(prefers-color-scheme: dark)"><img class="logo" src="/assets/logo.svg" alt="RevuTags"></picture>
  <div class="dot" aria-hidden="true">!</div>
  <h1>${escapeHtml(title)}</h1>
  <p>${escapeHtml(text)}</p>
  <a class="btn" href="${wa}">Escríbenos por WhatsApp</a>
  ${code ? `<small>Código del tag: ${escapeHtml(code)}</small>` : ""}
  ${options.adminHref ? `<a class="admin" href="${escapeHtml(options.adminHref)}">Soy un admin</a>` : ""}
</main>
</body>
</html>`;
}
