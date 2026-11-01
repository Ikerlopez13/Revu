# RevuTags

Tags NFC para conseguir reseñas en Google. Cada NFC lleva una URL corta e
inmutable (`https://revutags.com/t/{code}`) y el destino se gestiona desde la
base de datos, sin reescribir el tag.

> Estado: fase 2 de 4 (redirección + legacy). El panel `/admin` llega en la fase 3.

## Cómo funciona un escaneo

```
NFC → GET /t/{code}           (o /birres, /m/rev… en tags antiguos)
      ├─ rate limit (Upstash)  ┐ en paralelo
      ├─ Redis → Postgres      ┘
      ├─ active + google_review → 302 a la ficha de reseña de Google
      ├─ active + custom_url    → 302 (solo https, validada)
      ├─ unassigned / disabled  → página "Este tag aún no está activado" + WhatsApp
      └─ registro del escaneo con waitUntil (sin IP ni user-agent)
```

Siempre `302` + `Cache-Control: no-store`, nunca `301`.

## Estructura

| Ruta | Qué hace |
|---|---|
| `app/t/[code]` | Ruta crítica |
| `app/[alias]`, `app/m/[[...code]]` | URLs antiguas grabadas en NFCs (`/birres`, `/b1`, `/m/rev`…) |
| `app/api/public/analytics/[slug]` | Datos de la página pública `/analytics/{slug}` |
| `app/api/cron/snapshot` | Snapshot diario de nota y nº de reseñas |
| `lib/redirect` | Lógica de resolución (pura y testeada) |
| `lib/db` | Esquema Drizzle y consultas |
| `lib/cache` | Caché Redis code → destino |
| `lib/codes` | Generación de códigos (6 chars, sin 0/O/1/I/l) |
| `public/` | Landing, configurador y analytics (HTML estático) |

## Base de datos

Supabase (Postgres), **schema `revu`**: el proyecto es compartido con otra app y
RevuTags no toca `public`. El schema no es accesible desde la API pública de
Supabase (RLS activo sin políticas + permisos revocados a `anon`/`authenticated`);
solo el servidor entra, con la conexión directa.

Tablas: `businesses`, `batches`, `tags`, `tag_aliases` (slugs antiguos),
`scans`, `tag_events`, `review_snapshots`.

```bash
npm run db:generate   # tras cambiar lib/db/schema.ts
npm run db:migrate    # aplica migraciones pendientes (usa DATABASE_URL)
npm run db:seed       # datos de prueba — solo en una BD de desarrollo
```

Las migraciones `0000`–`0002` ya están aplicadas en producción y registradas en
`revu.__drizzle_migrations`.

## Desarrollo

Requiere Node 20+ (recomendado 22).

```bash
cp .env.example .env.local   # rellena DATABASE_URL como mínimo
npm install
npm run dev
npm test
```

## Despliegue en Vercel

Variables de entorno (Production y Preview): las de `.env.example`.
El cron (`vercel.json`) llama a `/api/cron/snapshot` cada día a las 05:00 UTC.
