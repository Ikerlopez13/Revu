import type { DestinationType, TagStatus } from "@/lib/db/schema";

/** Lo mínimo para resolver un escaneo. Es lo que se guarda en Redis. */
export type ResolvedTag = {
  tagId: string;
  code: string;
  businessId: string | null;
  status: TagStatus;
  destinationType: DestinationType;
  placeId: string | null;
  destinationUrl: string | null;
};

export type LookupKey = { kind: "code"; value: string } | { kind: "alias"; value: string };
