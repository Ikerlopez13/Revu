import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";
import { adminAllowlist } from "@/lib/auth/allowlist";
import { adminGate } from "@/lib/auth/gate";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const result = adminGate(req.nextUrl, req.auth?.user?.email, adminAllowlist());
  if (result.action === "redirect") return NextResponse.redirect(new URL(result.to, req.nextUrl));
  if (result.action === "forbidden") return new NextResponse("Forbidden", { status: 403 });
  return NextResponse.next();
});

// Todo /admin, incluidas las server actions (POST a rutas /admin) y la exportación.
// Runtime Node: lee AUTH_SECRET y ADMIN_EMAILS al ejecutarse, no al compilar.
export const config = { matcher: ["/admin/:path*"], runtime: "nodejs" };
