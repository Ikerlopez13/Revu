import { describe, expect, it } from "vitest";
import { MemoryFailures } from "@/lib/auth/login-limit";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

describe("contraseñas", () => {
  it("verifica la correcta y rechaza las demás", async () => {
    const h = await hashPassword("correct horse battery");
    expect(h).toMatch(/^scrypt\$32768\$8\$1\$/);
    expect(await verifyPassword("correct horse battery", h)).toBe(true);
    expect(await verifyPassword("correct horse batterY", h)).toBe(false);
    expect(await verifyPassword("", h)).toBe(false);
  });

  it("el mismo password genera hashes distintos (salt)", async () => {
    expect(await hashPassword("abcdefghij")).not.toBe(await hashPassword("abcdefghij"));
  });

  it("un hash mal formado nunca valida", async () => {
    for (const bad of ["", "plain", "scrypt$1$2", "bcrypt$a$b$c$d$e"]) expect(await verifyPassword("x", bad)).toBe(false);
  });
});

describe("límite de intentos de login", () => {
  it("bloquea tras 5 fallos en 15 minutos, por clave", () => {
    const m = new MemoryFailures();
    const t0 = 1_000_000;
    for (let i = 0; i < 4; i++) m.fail("e:x", t0 + i);
    expect(m.blocked("e:x", t0 + 10)).toBe(false);
    m.fail("e:x", t0 + 11);
    expect(m.blocked("e:x", t0 + 12)).toBe(true);
    expect(m.blocked("e:otro", t0 + 12)).toBe(false);
    expect(m.blocked("e:x", t0 + 15 * 60 * 1000 + 20)).toBe(false);
  });

  it("consultar si está bloqueado no gasta intentos", () => {
    const m = new MemoryFailures();
    for (let i = 0; i < 20; i++) expect(m.blocked("e:y", 1000 + i)).toBe(false);
  });
});
