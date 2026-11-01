-- Ejecutar UNA vez justo después de pasar producción a la versión nueva.
-- Copia a revu.scans los clicks que la función antigua siguió guardando en
-- public.revu_clicks entre la importación (2026-10-31) y el despliegue.
INSERT INTO revu.scans (tag_id, business_id, scanned_at, os, referer, via, outcome)
SELECT t.id, t.business_id, c.created_at,
  (CASE WHEN c.user_agent ~* 'iphone|ipad|ipod' THEN 'ios'
        WHEN c.user_agent ~* 'android' THEN 'android' ELSE 'other' END)::revu.scan_os,
  NULLIF(substring(c.referer from '^https?://([^/:?#]+)'), ''),
  'legacy', 'redirect'
FROM public.revu_clicks c
JOIN revu.tag_aliases a ON a.alias = lower(c.slug)
JOIN revu.tags t ON t.id = a.tag_id
WHERE c.created_at > '2026-10-28 22:06:44.823946+00'; -- último click ya importado
