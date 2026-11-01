import { Mail } from "lucide-react";
import { Logo } from "@/components/admin/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { signInWithEmail, signInWithGoogle } from "./actions";

export const metadata = { title: "Entrar · RevuTags" };

const ERRORS: Record<string, string> = {
  AccessDenied: "Este email no tiene acceso al panel.",
  Verification: "El enlace ha caducado o ya se usó. Pide otro.",
  email: "Escribe un email válido.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const next = sp.next ?? "/admin";
  const error = sp.error ? (ERRORS[sp.error] ?? "No se pudo iniciar sesión.") : null;
  const hasGoogle = !!process.env.AUTH_GOOGLE_ID;
  const hasEmail = !!process.env.AUTH_RESEND_KEY;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-6 px-4 py-10">
      <div className="flex flex-col items-center gap-3 text-center">
        <Logo className="h-8" />
        <h1 className="text-xl font-bold">Panel de RevuTags</h1>
      </div>

      {sp.sent ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 text-center">
            <Mail className="size-8 text-brand" />
            <p className="font-semibold">Revisa tu correo</p>
            <p className="text-sm text-muted-foreground">Te hemos enviado un enlace para entrar.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col gap-4">
            {hasGoogle && (
              <form action={signInWithGoogle}>
                <input type="hidden" name="next" value={next} />
                <Button type="submit" variant="outline" className="w-full">
                  Entrar con Google
                </Button>
              </form>
            )}
            {hasGoogle && hasEmail && <div className="text-center text-xs text-muted-foreground">o</div>}
            {hasEmail && (
              <form action={signInWithEmail} className="flex flex-col gap-3">
                <input type="hidden" name="next" value={next} />
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" autoComplete="email" inputMode="email" required placeholder="tu@email.com" />
                <Button type="submit">Enviarme un enlace</Button>
              </form>
            )}
            {!hasGoogle && !hasEmail && (
              <p className="text-sm text-muted-foreground">
                No hay ningún método de login configurado. Añade AUTH_GOOGLE_ID/AUTH_GOOGLE_SECRET o AUTH_RESEND_KEY.
              </p>
            )}
            {error && (
              <p role="alert" className="text-sm font-medium text-destructive">
                {error}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </main>
  );
}
