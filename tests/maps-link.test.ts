import { describe, expect, it, vi } from "vitest";
import { looksLikeMapsLink, parseMapsUrls, placeIdFromFtid, resolveMapsLink } from "@/lib/maps-link";

const KOLCHONIA = "ChIJP2v4Jda8pBIRURcvA44Gw1Q";
const FTID = "0x12a4bcd625f86b3f:0x54c3068e032f1751";

describe("enlaces de Google Maps → place_id (sin API key)", () => {
  it("convierte el feature id al place_id de Google", () => {
    expect(placeIdFromFtid(FTID)).toBe(KOLCHONIA);
  });

  it("lee enlaces largos de /maps/place con su nombre", () => {
    const url = `https://www.google.com/maps/place/Kolchonia+Meridiana/@41.4,2.18,17z/data=!3m1!4b1!4m6!3m5!1s${FTID}!8m2!3d41.4!4d2.18`;
    expect(parseMapsUrls([url])).toEqual({ placeId: KOLCHONIA, name: "Kolchonia Meridiana" });
  });

  it("lee el formato ?q=…&ftid= que da Compartir en el móvil", () => {
    const url = `https://www.google.com/maps?q=Kolchonia+Meridiana,+Av.+Meridiana,+Barcelona&ftid=${FTID}&entry=gps`;
    expect(parseMapsUrls([url])).toEqual({ placeId: KOLCHONIA, name: "Kolchonia Meridiana" });
  });

  it("acepta un enlace que ya trae el place_id", () => {
    expect(parseMapsUrls([`https://search.google.com/local/writereview?placeid=${KOLCHONIA}`])?.placeId).toBe(KOLCHONIA);
  });

  it("expande maps.app.goo.gl siguiendo la redirección", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(null, { status: 302, headers: { location: `https://www.google.com/maps?q=Kolchonia&ftid=${FTID}` } }),
    );
    expect(await resolveMapsLink("https://maps.app.goo.gl/abc123", fetchImpl)).toEqual({ placeId: KOLCHONIA, name: "Kolchonia" });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("no descarga nada que no sea un acortador de Google", async () => {
    const fetchImpl = vi.fn();
    expect(await resolveMapsLink("https://evil.example.com/0x1:0x2", fetchImpl)).toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(await resolveMapsLink("https://example.com/nada", fetchImpl)).toBeNull();
  });

  it("distingue enlaces de nombres", () => {
    expect(looksLikeMapsLink("https://maps.app.goo.gl/x")).toBe(true);
    expect(looksLikeMapsLink("maps.app.goo.gl/x")).toBe(true);
    expect(looksLikeMapsLink("Kolchonia")).toBe(false);
  });
});
