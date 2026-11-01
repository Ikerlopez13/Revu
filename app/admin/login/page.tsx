import { Logo } from "@/components/admin/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { signInWithPassword } from "./actions";

export const metadata = { title: "Entrar · RevuTags" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-6 px-4 py-10">
      <div className="flex flex-col items-center gap-3 text-center">
        <Logo className="h-8" />
        <h1 className="text-xl font-bold">Panel de RevuTags</h1>
      </div>
      <Card>
        <CardContent>
          <form action={signInWithPassword} className="flex flex-col gap-4">
            <input type="hidden" name="next" value={sp.next ?? "/admin"} />
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" autoComplete="username" inputMode="email" required autoFocus />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" name="password" type="password" autoComplete="current-password" required />
            </div>
            <Button type="submit" size="lg">
              Entrar
            </Button>
            {sp.error && (
              <p role="alert" className="text-sm font-medium text-destructive">
                Email o contraseña incorrectos. Tras 5 fallos seguidos hay que esperar 15 minutos.
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
