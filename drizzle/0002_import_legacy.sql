-- Importa los enlaces legacy (revutags.com/{slug} y /m/{slug}) y el historial de clicks.
-- Generado por scripts/legacy/build-import-sql.ts
INSERT INTO "revu"."businesses" ("slug","name","google_place_id","notes") VALUES ('birres','1982 Birres & Burgers','ChIzEbxIjbykEjjDI5QKJ3q6','REVISAR: el place_id empieza por ChIz (los válidos empiezan por ChIJ).');--> statement-breakpoint
INSERT INTO "revu"."tags" ("code","business_id","status","destination_type","destination_url","label") SELECT 'GCQY94', id, 'active', 'google_review', NULL, 'Legacy /birres' FROM "revu"."businesses" WHERE slug = 'birres';--> statement-breakpoint
INSERT INTO "revu"."tag_aliases" ("alias","tag_id") SELECT 'birres', id FROM "revu"."tags" WHERE code = 'GCQY94';--> statement-breakpoint
INSERT INTO "revu"."tags" ("code","business_id","status","destination_type","destination_url","label") SELECT 'HNBCE4', id, 'active', 'google_review', NULL, 'Legacy /b' FROM "revu"."businesses" WHERE slug = 'birres';--> statement-breakpoint
INSERT INTO "revu"."tag_aliases" ("alias","tag_id") SELECT 'b', id FROM "revu"."tags" WHERE code = 'HNBCE4';--> statement-breakpoint
INSERT INTO "revu"."tags" ("code","business_id","status","destination_type","destination_url","label") SELECT 'FSY9CN', id, 'active', 'google_review', NULL, 'Legacy /b1' FROM "revu"."businesses" WHERE slug = 'birres';--> statement-breakpoint
INSERT INTO "revu"."tag_aliases" ("alias","tag_id") SELECT 'b1', id FROM "revu"."tags" WHERE code = 'FSY9CN';--> statement-breakpoint
INSERT INTO "revu"."tags" ("code","business_id","status","destination_type","destination_url","label") SELECT 'PGVLKC', id, 'active', 'google_review', NULL, 'Legacy /rev' FROM "revu"."businesses" WHERE slug = 'birres';--> statement-breakpoint
INSERT INTO "revu"."tag_aliases" ("alias","tag_id") SELECT 'rev', id FROM "revu"."tags" WHERE code = 'PGVLKC';--> statement-breakpoint
INSERT INTO "revu"."businesses" ("slug","name","google_place_id","notes") VALUES ('b&b','1982 Birres & Burgers (verificado)','ChIJMxG8Sl28pBIROMMjlAonero',NULL);--> statement-breakpoint
INSERT INTO "revu"."tags" ("code","business_id","status","destination_type","destination_url","label") SELECT 'XUQN78', id, 'active', 'google_review', NULL, 'Legacy /b&b' FROM "revu"."businesses" WHERE slug = 'b&b';--> statement-breakpoint
INSERT INTO "revu"."tag_aliases" ("alias","tag_id") SELECT 'b&b', id FROM "revu"."tags" WHERE code = 'XUQN78';--> statement-breakpoint
INSERT INTO "revu"."businesses" ("slug","name","google_place_id","notes") VALUES ('samalica','Restaurant Sa Malica-Can Ton','ChIJT8YYYzwWuxIRk-0qz6QTl2g',NULL);--> statement-breakpoint
INSERT INTO "revu"."tags" ("code","business_id","status","destination_type","destination_url","label") SELECT 'AQPVR5', id, 'active', 'google_review', NULL, 'Legacy /samalica' FROM "revu"."businesses" WHERE slug = 'samalica';--> statement-breakpoint
INSERT INTO "revu"."tag_aliases" ("alias","tag_id") SELECT 'samalica', id FROM "revu"."tags" WHERE code = 'AQPVR5';--> statement-breakpoint
INSERT INTO "revu"."tags" ("code","business_id","status","destination_type","destination_url","label") SELECT 'ZDBDJ7', id, 'active', 'google_review', NULL, 'Legacy /s' FROM "revu"."businesses" WHERE slug = 'samalica';--> statement-breakpoint
INSERT INTO "revu"."tag_aliases" ("alias","tag_id") SELECT 's', id FROM "revu"."tags" WHERE code = 'ZDBDJ7';--> statement-breakpoint
INSERT INTO "revu"."tags" ("code","business_id","status","destination_type","destination_url","label") SELECT '8SLGMW', id, 'active', 'google_review', NULL, 'Legacy /s1' FROM "revu"."businesses" WHERE slug = 'samalica';--> statement-breakpoint
INSERT INTO "revu"."tag_aliases" ("alias","tag_id") SELECT 's1', id FROM "revu"."tags" WHERE code = '8SLGMW';--> statement-breakpoint
INSERT INTO "revu"."tags" ("code","business_id","status","destination_type","destination_url","label") SELECT 'FVJ9Z8', id, 'active', 'google_review', NULL, 'Legacy /belleza' FROM "revu"."businesses" WHERE slug = 'samalica';--> statement-breakpoint
INSERT INTO "revu"."tag_aliases" ("alias","tag_id") SELECT 'belleza', id FROM "revu"."tags" WHERE code = 'FVJ9Z8';--> statement-breakpoint
INSERT INTO "revu"."businesses" ("slug","name","google_place_id","notes") VALUES ('palomera','Racó Sa Palomera','ChIJrad7jzwWuxIR_0fyOwq4auE',NULL);--> statement-breakpoint
INSERT INTO "revu"."tags" ("code","business_id","status","destination_type","destination_url","label") SELECT 'R9PQC3', id, 'active', 'google_review', NULL, 'Legacy /palomera' FROM "revu"."businesses" WHERE slug = 'palomera';--> statement-breakpoint
INSERT INTO "revu"."tag_aliases" ("alias","tag_id") SELECT 'palomera', id FROM "revu"."tags" WHERE code = 'R9PQC3';--> statement-breakpoint
INSERT INTO "revu"."tags" ("code","business_id","status","destination_type","destination_url","label") SELECT 'C2X47J', id, 'active', 'google_review', NULL, 'Legacy /p' FROM "revu"."businesses" WHERE slug = 'palomera';--> statement-breakpoint
INSERT INTO "revu"."tag_aliases" ("alias","tag_id") SELECT 'p', id FROM "revu"."tags" WHERE code = 'C2X47J';--> statement-breakpoint
INSERT INTO "revu"."tags" ("code","business_id","status","destination_type","destination_url","label") SELECT '94YY8N', id, 'active', 'google_review', NULL, 'Legacy /p1' FROM "revu"."businesses" WHERE slug = 'palomera';--> statement-breakpoint
INSERT INTO "revu"."tag_aliases" ("alias","tag_id") SELECT 'p1', id FROM "revu"."tags" WHERE code = '94YY8N';--> statement-breakpoint
INSERT INTO "revu"."businesses" ("slug","name","google_place_id","notes") VALUES ('caseta','La Caseta Blanes','ChIJ_1fV3zUXuxIRd9BPxXWAH08',NULL);--> statement-breakpoint
INSERT INTO "revu"."tags" ("code","business_id","status","destination_type","destination_url","label") SELECT 'HHKH4T', id, 'active', 'google_review', NULL, 'Legacy /caseta' FROM "revu"."businesses" WHERE slug = 'caseta';--> statement-breakpoint
INSERT INTO "revu"."tag_aliases" ("alias","tag_id") SELECT 'caseta', id FROM "revu"."tags" WHERE code = 'HHKH4T';--> statement-breakpoint
INSERT INTO "revu"."tags" ("code","business_id","status","destination_type","destination_url","label") SELECT 'PSZJ9E', id, 'active', 'google_review', NULL, 'Legacy /c' FROM "revu"."businesses" WHERE slug = 'caseta';--> statement-breakpoint
INSERT INTO "revu"."tag_aliases" ("alias","tag_id") SELECT 'c', id FROM "revu"."tags" WHERE code = 'PSZJ9E';--> statement-breakpoint
INSERT INTO "revu"."tags" ("code","business_id","status","destination_type","destination_url","label") SELECT 'MPC3R7', id, 'active', 'google_review', NULL, 'Legacy /c1' FROM "revu"."businesses" WHERE slug = 'caseta';--> statement-breakpoint
INSERT INTO "revu"."tag_aliases" ("alias","tag_id") SELECT 'c1', id FROM "revu"."tags" WHERE code = 'MPC3R7';--> statement-breakpoint
INSERT INTO "revu"."businesses" ("slug","name","google_place_id","notes") VALUES ('amura','Amura Blanes','ChIJe-lG9RwWuxIRLsMaxN_IH00',NULL);--> statement-breakpoint
INSERT INTO "revu"."tags" ("code","business_id","status","destination_type","destination_url","label") SELECT 'YABCR6', id, 'active', 'google_review', NULL, 'Legacy /amura' FROM "revu"."businesses" WHERE slug = 'amura';--> statement-breakpoint
INSERT INTO "revu"."tag_aliases" ("alias","tag_id") SELECT 'amura', id FROM "revu"."tags" WHERE code = 'YABCR6';--> statement-breakpoint
INSERT INTO "revu"."tags" ("code","business_id","status","destination_type","destination_url","label") SELECT 'F28YCX', id, 'active', 'google_review', NULL, 'Legacy /a1' FROM "revu"."businesses" WHERE slug = 'amura';--> statement-breakpoint
INSERT INTO "revu"."tag_aliases" ("alias","tag_id") SELECT 'a1', id FROM "revu"."tags" WHERE code = 'F28YCX';--> statement-breakpoint
INSERT INTO "revu"."tags" ("code","business_id","status","destination_type","destination_url","label") SELECT 'MT5LVM', id, 'active', 'google_review', NULL, 'Legacy /ab' FROM "revu"."businesses" WHERE slug = 'amura';--> statement-breakpoint
INSERT INTO "revu"."tag_aliases" ("alias","tag_id") SELECT 'ab', id FROM "revu"."tags" WHERE code = 'MT5LVM';--> statement-breakpoint
INSERT INTO "revu"."businesses" ("slug","name","google_place_id","notes") VALUES ('amat','Àmat bellesa i wellness','ChIJr-yi2sGvpBIR6Drh1ZzpjDg','REVISAR: el tag /a apunta a un place_id distinto (GVpBIR vs GvpBIR).');--> statement-breakpoint
INSERT INTO "revu"."tags" ("code","business_id","status","destination_type","destination_url","label") SELECT 'SFK2GN', id, 'active', 'google_review', NULL, 'Legacy /amat' FROM "revu"."businesses" WHERE slug = 'amat';--> statement-breakpoint
INSERT INTO "revu"."tag_aliases" ("alias","tag_id") SELECT 'amat', id FROM "revu"."tags" WHERE code = 'SFK2GN';--> statement-breakpoint
INSERT INTO "revu"."tags" ("code","business_id","status","destination_type","destination_url","label") SELECT 'YCCWWV', id, 'active', 'google_review', NULL, 'Legacy /bellesa' FROM "revu"."businesses" WHERE slug = 'amat';--> statement-breakpoint
INSERT INTO "revu"."tag_aliases" ("alias","tag_id") SELECT 'bellesa', id FROM "revu"."tags" WHERE code = 'YCCWWV';--> statement-breakpoint
INSERT INTO "revu"."tags" ("code","business_id","status","destination_type","destination_url","label") SELECT 'PV5Y8P', id, 'active', 'google_review', NULL, 'Legacy /m' FROM "revu"."businesses" WHERE slug = 'amat';--> statement-breakpoint
INSERT INTO "revu"."tag_aliases" ("alias","tag_id") SELECT 'm', id FROM "revu"."tags" WHERE code = 'PV5Y8P';--> statement-breakpoint
INSERT INTO "revu"."tags" ("code","business_id","status","destination_type","destination_url","label") SELECT 'J4PDBJ', id, 'active', 'custom_url', 'https://search.google.com/local/writereview?placeid=ChIJr-yi2sGVpBIR6Drh1ZzpjDg', 'Legacy /a' FROM "revu"."businesses" WHERE slug = 'amat';--> statement-breakpoint
INSERT INTO "revu"."tag_aliases" ("alias","tag_id") SELECT 'a', id FROM "revu"."tags" WHERE code = 'J4PDBJ';--> statement-breakpoint
INSERT INTO "revu"."businesses" ("slug","name","google_place_id","notes") VALUES ('escora','L''Escora - Restaurant','ChIJ3UQ5zBcXuxIRuVC_GuAKJjk',NULL);--> statement-breakpoint
INSERT INTO "revu"."tags" ("code","business_id","status","destination_type","destination_url","label") SELECT '8EEM9U', id, 'active', 'google_review', NULL, 'Legacy /escora' FROM "revu"."businesses" WHERE slug = 'escora';--> statement-breakpoint
INSERT INTO "revu"."tag_aliases" ("alias","tag_id") SELECT 'escora', id FROM "revu"."tags" WHERE code = '8EEM9U';--> statement-breakpoint
INSERT INTO "revu"."tags" ("code","business_id","status","destination_type","destination_url","label") SELECT 'QAUD9R', id, 'active', 'google_review', NULL, 'Legacy /e' FROM "revu"."businesses" WHERE slug = 'escora';--> statement-breakpoint
INSERT INTO "revu"."tag_aliases" ("alias","tag_id") SELECT 'e', id FROM "revu"."tags" WHERE code = 'QAUD9R';--> statement-breakpoint
INSERT INTO "revu"."tags" ("code","business_id","status","destination_type","destination_url","label") SELECT '7H9WPA', id, 'active', 'google_review', NULL, 'Legacy /e1' FROM "revu"."businesses" WHERE slug = 'escora';--> statement-breakpoint
INSERT INTO "revu"."tag_aliases" ("alias","tag_id") SELECT 'e1', id FROM "revu"."tags" WHERE code = '7H9WPA';--> statement-breakpoint
INSERT INTO "revu"."businesses" ("slug","name","google_place_id","notes") VALUES ('hivernacle','l''hivernacle Restaurant i Copes','ChIJZ_TOw0cWuxIRvvmVBoZH8QA',NULL);--> statement-breakpoint
INSERT INTO "revu"."tags" ("code","business_id","status","destination_type","destination_url","label") SELECT 'GLU9EX', id, 'active', 'google_review', NULL, 'Legacy /hivernacle' FROM "revu"."businesses" WHERE slug = 'hivernacle';--> statement-breakpoint
INSERT INTO "revu"."tag_aliases" ("alias","tag_id") SELECT 'hivernacle', id FROM "revu"."tags" WHERE code = 'GLU9EX';--> statement-breakpoint
INSERT INTO "revu"."tags" ("code","business_id","status","destination_type","destination_url","label") SELECT 'VWFTND', id, 'active', 'google_review', NULL, 'Legacy /h' FROM "revu"."businesses" WHERE slug = 'hivernacle';--> statement-breakpoint
INSERT INTO "revu"."tag_aliases" ("alias","tag_id") SELECT 'h', id FROM "revu"."tags" WHERE code = 'VWFTND';--> statement-breakpoint
INSERT INTO "revu"."tags" ("code","business_id","status","destination_type","destination_url","label") SELECT 'DFG9FS', id, 'active', 'google_review', NULL, 'Legacy /h1' FROM "revu"."businesses" WHERE slug = 'hivernacle';--> statement-breakpoint
INSERT INTO "revu"."tag_aliases" ("alias","tag_id") SELECT 'h1', id FROM "revu"."tags" WHERE code = 'DFG9FS';--> statement-breakpoint
INSERT INTO "revu"."tags" ("code","business_id","status","destination_type","destination_url","label") SELECT 'D4FDYV', id, 'active', 'google_review', NULL, 'Legacy /wellness' FROM "revu"."businesses" WHERE slug = 'hivernacle';--> statement-breakpoint
INSERT INTO "revu"."tag_aliases" ("alias","tag_id") SELECT 'wellness', id FROM "revu"."tags" WHERE code = 'D4FDYV';--> statement-breakpoint
INSERT INTO "revu"."businesses" ("slug","name","google_place_id","notes") VALUES ('taranna','Taranna','ChIJ5dteDAYXuxIRbt4EJDKWgKg',NULL);--> statement-breakpoint
INSERT INTO "revu"."tags" ("code","business_id","status","destination_type","destination_url","label") SELECT 'UG498P', id, 'active', 'google_review', NULL, 'Legacy /taranna' FROM "revu"."businesses" WHERE slug = 'taranna';--> statement-breakpoint
INSERT INTO "revu"."tag_aliases" ("alias","tag_id") SELECT 'taranna', id FROM "revu"."tags" WHERE code = 'UG498P';--> statement-breakpoint
INSERT INTO "revu"."tags" ("code","business_id","status","destination_type","destination_url","label") SELECT '94AJFE', id, 'active', 'google_review', NULL, 'Legacy /t' FROM "revu"."businesses" WHERE slug = 'taranna';--> statement-breakpoint
INSERT INTO "revu"."tag_aliases" ("alias","tag_id") SELECT 't', id FROM "revu"."tags" WHERE code = '94AJFE';--> statement-breakpoint
INSERT INTO "revu"."tags" ("code","business_id","status","destination_type","destination_url","label") SELECT 'HJRFQY', id, 'active', 'google_review', NULL, 'Legacy /tb1' FROM "revu"."businesses" WHERE slug = 'taranna';--> statement-breakpoint
INSERT INTO "revu"."tag_aliases" ("alias","tag_id") SELECT 'tb1', id FROM "revu"."tags" WHERE code = 'HJRFQY';--> statement-breakpoint
INSERT INTO "revu"."businesses" ("slug","name","google_place_id","notes") VALUES ('clandestin','Clandestin','ChIJ0ZMC3oS9pBIRU74WtUdNr0E',NULL);--> statement-breakpoint
INSERT INTO "revu"."tags" ("code","business_id","status","destination_type","destination_url","label") SELECT 'JGMC9S', id, 'active', 'google_review', NULL, 'Legacy /clandestin' FROM "revu"."businesses" WHERE slug = 'clandestin';--> statement-breakpoint
INSERT INTO "revu"."tag_aliases" ("alias","tag_id") SELECT 'clandestin', id FROM "revu"."tags" WHERE code = 'JGMC9S';--> statement-breakpoint
INSERT INTO "revu"."tags" ("code","business_id","status","destination_type","destination_url","label") SELECT 'NHF3ZN', id, 'active', 'google_review', NULL, 'Legacy /cl' FROM "revu"."businesses" WHERE slug = 'clandestin';--> statement-breakpoint
INSERT INTO "revu"."tag_aliases" ("alias","tag_id") SELECT 'cl', id FROM "revu"."tags" WHERE code = 'NHF3ZN';--> statement-breakpoint
INSERT INTO "revu"."businesses" ("slug","name","google_place_id","notes") VALUES ('nvareformes','NVA Reformes','ChIJZ6s2A9a-pBIRfkVZfhD4Yso',NULL);--> statement-breakpoint
INSERT INTO "revu"."tags" ("code","business_id","status","destination_type","destination_url","label") SELECT 'DXBG3F', id, 'active', 'google_review', NULL, 'Legacy /nvareformes' FROM "revu"."businesses" WHERE slug = 'nvareformes';--> statement-breakpoint
INSERT INTO "revu"."tag_aliases" ("alias","tag_id") SELECT 'nvareformes', id FROM "revu"."tags" WHERE code = 'DXBG3F';--> statement-breakpoint
INSERT INTO "revu"."tags" ("code","business_id","status","destination_type","destination_url","label") SELECT '856JEJ', id, 'active', 'google_review', NULL, 'Legacy /nva' FROM "revu"."businesses" WHERE slug = 'nvareformes';--> statement-breakpoint
INSERT INTO "revu"."tag_aliases" ("alias","tag_id") SELECT 'nva', id FROM "revu"."tags" WHERE code = '856JEJ';--> statement-breakpoint
INSERT INTO "revu"."tags" ("code","business_id","status","destination_type","destination_url","label") SELECT 'DREHEU', id, 'active', 'google_review', NULL, 'Legacy /n' FROM "revu"."businesses" WHERE slug = 'nvareformes';--> statement-breakpoint
INSERT INTO "revu"."tag_aliases" ("alias","tag_id") SELECT 'n', id FROM "revu"."tags" WHERE code = 'DREHEU';--> statement-breakpoint
INSERT INTO "revu"."tags" ("code","business_id","status","destination_type","destination_url","label") SELECT 'F8SXSZ', id, 'active', 'google_review', NULL, 'Legacy /n1' FROM "revu"."businesses" WHERE slug = 'nvareformes';--> statement-breakpoint
INSERT INTO "revu"."tag_aliases" ("alias","tag_id") SELECT 'n1', id FROM "revu"."tags" WHERE code = 'F8SXSZ';--> statement-breakpoint
INSERT INTO "revu"."businesses" ("slug","name","google_place_id","notes") VALUES ('latropa','La Tropa','ChIJNSGl2du8pBIRL1_f559PmX4',NULL);--> statement-breakpoint
INSERT INTO "revu"."tags" ("code","business_id","status","destination_type","destination_url","label") SELECT 'V2NTYR', id, 'active', 'google_review', NULL, 'Legacy /latropa' FROM "revu"."businesses" WHERE slug = 'latropa';--> statement-breakpoint
INSERT INTO "revu"."tag_aliases" ("alias","tag_id") SELECT 'latropa', id FROM "revu"."tags" WHERE code = 'V2NTYR';--> statement-breakpoint
INSERT INTO "revu"."tags" ("code","business_id","status","destination_type","destination_url","label") SELECT 'ZEAKXQ', id, 'active', 'google_review', NULL, 'Legacy /tropa' FROM "revu"."businesses" WHERE slug = 'latropa';--> statement-breakpoint
INSERT INTO "revu"."tag_aliases" ("alias","tag_id") SELECT 'tropa', id FROM "revu"."tags" WHERE code = 'ZEAKXQ';--> statement-breakpoint
INSERT INTO "revu"."tags" ("code","business_id","status","destination_type","destination_url","label") SELECT 'W2GWD2', id, 'active', 'google_review', NULL, 'Legacy /lt' FROM "revu"."businesses" WHERE slug = 'latropa';--> statement-breakpoint
INSERT INTO "revu"."tag_aliases" ("alias","tag_id") SELECT 'lt', id FROM "revu"."tags" WHERE code = 'W2GWD2';--> statement-breakpoint
INSERT INTO "revu"."businesses" ("slug","name","google_place_id","notes") VALUES ('kolchonia','Kolchonia Meridiana','ChIJP2v4Jda8pBIRURcvA44Gw1Q',NULL);--> statement-breakpoint
INSERT INTO "revu"."tags" ("code","business_id","status","destination_type","destination_url","label") SELECT '8VPJJW', id, 'active', 'google_review', NULL, 'Legacy /kolchonia' FROM "revu"."businesses" WHERE slug = 'kolchonia';--> statement-breakpoint
INSERT INTO "revu"."tag_aliases" ("alias","tag_id") SELECT 'kolchonia', id FROM "revu"."tags" WHERE code = '8VPJJW';--> statement-breakpoint
INSERT INTO "revu"."tags" ("code","business_id","status","destination_type","destination_url","label") SELECT 'DPSZEZ', id, 'active', 'google_review', NULL, 'Legacy /k' FROM "revu"."businesses" WHERE slug = 'kolchonia';--> statement-breakpoint
INSERT INTO "revu"."tag_aliases" ("alias","tag_id") SELECT 'k', id FROM "revu"."tags" WHERE code = 'DPSZEZ';--> statement-breakpoint
INSERT INTO "revu"."tags" ("code","business_id","status","destination_type","destination_url","label") SELECT 'BCXB7F', id, 'active', 'google_review', NULL, 'Legacy /k1' FROM "revu"."businesses" WHERE slug = 'kolchonia';--> statement-breakpoint
INSERT INTO "revu"."tag_aliases" ("alias","tag_id") SELECT 'k1', id FROM "revu"."tags" WHERE code = 'BCXB7F';--> statement-breakpoint
INSERT INTO "revu"."businesses" ("slug","name","google_place_id","notes") VALUES ('red','Try Red Carpet',NULL,NULL);--> statement-breakpoint
INSERT INTO "revu"."tags" ("code","business_id","status","destination_type","destination_url","label") SELECT 'XP6G3W', id, 'active', 'custom_url', 'https://tryredcarpet.com', 'Legacy /red' FROM "revu"."businesses" WHERE slug = 'red';--> statement-breakpoint
INSERT INTO "revu"."tag_aliases" ("alias","tag_id") SELECT 'red', id FROM "revu"."tags" WHERE code = 'XP6G3W';--> statement-breakpoint
INSERT INTO "revu"."businesses" ("slug","name","google_place_id","notes") VALUES ('im10','im10',NULL,NULL);--> statement-breakpoint
INSERT INTO "revu"."tags" ("code","business_id","status","destination_type","destination_url","label") SELECT 'EY7GAR', id, 'active', 'custom_url', 'https://g.page/r/CajoDPj7oDtwEBE/review', 'Legacy /im10' FROM "revu"."businesses" WHERE slug = 'im10';--> statement-breakpoint
INSERT INTO "revu"."tag_aliases" ("alias","tag_id") SELECT 'im10', id FROM "revu"."tags" WHERE code = 'EY7GAR';--> statement-breakpoint
DO $$
BEGIN
  IF to_regclass('public.revu_clicks') IS NOT NULL THEN
    INSERT INTO "revu"."scans" ("tag_id","business_id","scanned_at","os","referer","via","outcome")
    SELECT t.id, t.business_id, c.created_at,
      (CASE WHEN c.user_agent ~* 'iphone|ipad|ipod' THEN 'ios'
            WHEN c.user_agent ~* 'android' THEN 'android'
            ELSE 'other' END)::"revu"."scan_os",
      NULLIF(substring(c.referer from '^https?://([^/:?#]+)'), ''),
      'legacy', 'redirect'
    FROM public.revu_clicks c
    JOIN "revu"."tag_aliases" a ON a.alias = lower(c.slug)
    JOIN "revu"."tags" t ON t.id = a.tag_id;
  END IF;
END $$;
