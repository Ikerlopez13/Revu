import "server-only";
import { env } from "@/lib/env";

export type PlaceResult = { placeId: string; name: string; address: string | null };

/** Google Places (New) Text Search, sesgado a España. */
export async function searchPlaces(query: string): Promise<PlaceResult[]> {
  const key = env().GOOGLE_PLACES_KEY;
  if (!key) throw new Error("Falta GOOGLE_PLACES_KEY");
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress",
    },
    body: JSON.stringify({ textQuery: query, languageCode: "es", regionCode: "ES", pageSize: 6 }),
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`Places API ${res.status}`);
  const data = (await res.json()) as {
    places?: { id: string; displayName?: { text?: string }; formattedAddress?: string }[];
  };
  return (data.places ?? []).map((p) => ({
    placeId: p.id,
    name: p.displayName?.text ?? p.id,
    address: p.formattedAddress ?? null,
  }));
}
