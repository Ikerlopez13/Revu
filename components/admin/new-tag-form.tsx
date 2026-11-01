import { createTagAction } from "@/app/admin/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { nextSequentialSlug } from "@/lib/admin/slugs";
import { listNumericAliases } from "@/lib/db/queries/admin";
import { ActionForm } from "./action-form";

/** Crear un tag con URL corta propia. Propone el siguiente número libre. */
export async function NewTagForm() {
  const suggested = nextSequentialSlug(await listNumericAliases());
  const host = (process.env.PUBLIC_BASE_URL || "https://revutags.com").replace(/^https?:\/\//, "").replace(/\/+$/, "");
  return (
    <Card>
      <CardHeader>
        <CardTitle>Nuevo tag</CardTitle>
        <CardDescription>Elige su URL corta. Por defecto, el siguiente número libre.</CardDescription>
      </CardHeader>
      <CardContent>
        <ActionForm action={createTagAction} submitLabel="Crear tag" variant="brand">
          <label className="flex h-11 items-center overflow-hidden rounded-lg border border-input bg-card focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30">
            <span className="pl-3 text-muted-foreground">{host}/</span>
            <input
              name="slug"
              defaultValue={suggested}
              required
              maxLength={40}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              aria-label="Slug"
              className="h-full min-w-0 flex-1 bg-transparent pr-3 font-mono outline-none"
            />
          </label>
        </ActionForm>
      </CardContent>
    </Card>
  );
}
