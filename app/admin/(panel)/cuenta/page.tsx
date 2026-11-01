import { changePasswordAction } from "@/app/admin/actions";
import { ActionForm } from "@/components/admin/action-form";
import { PageTitle } from "@/components/admin/shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { getAdminEmail } from "@/lib/auth/session";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/password";

export default async function AccountPage() {
  const email = await getAdminEmail();
  return (
    <>
      <PageTitle title="Cuenta" subtitle={email} />
      <Card>
        <CardHeader>
          <CardTitle>Cambiar contraseña</CardTitle>
        </CardHeader>
        <CardContent>
          <ActionForm action={changePasswordAction} submitLabel="Cambiar contraseña" successMessage="Contraseña cambiada">
            <input type="email" name="username" autoComplete="username" defaultValue={email ?? ""} hidden readOnly />
            <div className="flex flex-col gap-2">
              <Label htmlFor="current">Contraseña actual</Label>
              <Input id="current" name="current" type="password" autoComplete="current-password" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="next">Nueva contraseña</Label>
              <Input id="next" name="next" type="password" autoComplete="new-password" minLength={MIN_PASSWORD_LENGTH} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="confirm">Repite la nueva</Label>
              <Input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={MIN_PASSWORD_LENGTH} required />
            </div>
          </ActionForm>
        </CardContent>
      </Card>
    </>
  );
}
