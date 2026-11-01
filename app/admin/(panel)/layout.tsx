import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/shell";
import { ServiceWorkerRegister } from "@/components/admin/sw-register";
import { getAdminEmail } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

// El middleware ya protege /admin; esto es la segunda comprobación, en el servidor.
export default async function PanelLayout({ children }: { children: ReactNode }) {
  const email = await getAdminEmail();
  if (!email) redirect("/admin/login");
  return (
    <AdminShell email={email}>
      <ServiceWorkerRegister />
      {children}
    </AdminShell>
  );
}
