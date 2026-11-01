import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  index,
  integer,
  jsonb,
  numeric,
  pgSchema,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// El proyecto de Supabase es compartido con otra app: todo RevuTags vive en "revu".
export const revu = pgSchema("revu");

export const tagStatus = revu.enum("tag_status", ["unassigned", "active", "disabled"]);
export const destinationType = revu.enum("destination_type", ["google_review", "custom_url"]);
export const scanOs = revu.enum("scan_os", ["ios", "android", "other"]);
export const scanVia = revu.enum("scan_via", ["code", "legacy"]);
export const scanOutcome = revu.enum("scan_outcome", ["redirect", "inactive"]);
export const tagEventAction = revu.enum("tag_event_action", [
  "create",
  "assign",
  "reassign",
  "change_destination",
  "relabel",
  "disable",
  "enable",
  "unassign",
]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

export const businesses = revu.table("businesses", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Slug público: /analytics/{slug}
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  googlePlaceId: text("google_place_id"),
  notes: text("notes"),
  ...timestamps,
  archivedAt: timestamp("archived_at", { withTimezone: true }),
});

export const batches = revu.table("batches", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  quantity: integer("quantity").notNull(),
  createdAt: timestamps.createdAt,
});

export const tags = revu.table(
  "tags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: varchar("code", { length: 6 }).notNull().unique(),
    batchId: uuid("batch_id").references(() => batches.id, { onDelete: "set null" }),
    businessId: uuid("business_id").references(() => businesses.id, { onDelete: "restrict" }),
    status: tagStatus("status").notNull().default("unassigned"),
    destinationType: destinationType("destination_type").notNull().default("google_review"),
    destinationUrl: text("destination_url"),
    label: text("label"),
    ...timestamps,
  },
  (t) => [
    index("tags_business_idx").on(t.businessId),
    index("tags_batch_idx").on(t.batchId),
    check("tags_active_needs_business", sql`${t.status} <> 'active' OR ${t.businessId} IS NOT NULL`),
    check(
      "tags_destination_consistent",
      sql`(${t.destinationType} = 'custom_url' AND ${t.destinationUrl} IS NOT NULL)
        OR (${t.destinationType} = 'google_review' AND ${t.destinationUrl} IS NULL)`,
    ),
    check("tags_custom_url_https", sql`${t.destinationUrl} IS NULL OR ${t.destinationUrl} LIKE 'https://%'`),
  ],
);

// Slugs antiguos (revutags.com/birres, /m/rev…) que ya están grabados en NFCs.
export const tagAliases = revu.table(
  "tag_aliases",
  {
    alias: text("alias").primaryKey(),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
    createdAt: timestamps.createdAt,
  },
  (t) => [index("tag_aliases_tag_idx").on(t.tagId)],
);

// Sin IP ni user-agent (RGPD). business_id se guarda en el momento del escaneo
// para que las métricas no se muevan si el tag se reasigna.
export const scans = revu.table(
  "scans",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
    businessId: uuid("business_id").references(() => businesses.id, { onDelete: "set null" }),
    scannedAt: timestamp("scanned_at", { withTimezone: true }).notNull().defaultNow(),
    os: scanOs("os").notNull(),
    country: varchar("country", { length: 2 }),
    referer: text("referer"),
    via: scanVia("via").notNull(),
    outcome: scanOutcome("outcome").notNull(),
  },
  (t) => [
    index("scans_business_time_idx").on(t.businessId, t.scannedAt),
    index("scans_tag_time_idx").on(t.tagId, t.scannedAt),
  ],
);

export const tagEvents = revu.table(
  "tag_events",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
    actorEmail: text("actor_email").notNull(),
    action: tagEventAction("action").notNull(),
    before: jsonb("before"),
    after: jsonb("after"),
    createdAt: timestamps.createdAt,
  },
  (t) => [index("tag_events_tag_time_idx").on(t.tagId, t.createdAt)],
);

// Snapshot diario de nota y nº de reseñas (Google Places), para /analytics.
export const reviewSnapshots = revu.table(
  "review_snapshots",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    rating: numeric("rating", { precision: 2, scale: 1, mode: "number" }),
    reviewCount: integer("review_count"),
    capturedAt: timestamp("captured_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("review_snapshots_business_time_idx").on(t.businessId, t.capturedAt)],
);

// Usuarios del panel: email + contraseña (hash scrypt). Además deben estar en ADMIN_EMAILS.
export const adminUsers = revu.table("admin_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  ...timestamps,
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
});

export type Business = typeof businesses.$inferSelect;
export type Tag = typeof tags.$inferSelect;
export type TagStatus = (typeof tagStatus.enumValues)[number];
export type DestinationType = (typeof destinationType.enumValues)[number];
export type ScanOs = (typeof scanOs.enumValues)[number];
export type ScanVia = (typeof scanVia.enumValues)[number];
export type Batch = typeof batches.$inferSelect;
export type TagEvent = typeof tagEvents.$inferSelect;
export type TagEventAction = (typeof tagEventAction.enumValues)[number];
