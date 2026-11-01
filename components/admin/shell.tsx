"use client";

import { Boxes, CircleUser, Home, LogOut, Store, Tags } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { signOutAction } from "@/app/admin/login/actions";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";

const NAV = [
  { href: "/admin", label: "Inicio", icon: Home },
  { href: "/admin/tags", label: "Tags", icon: Tags },
  { href: "/admin/batches", label: "Lotes", icon: Boxes },
  { href: "/admin/businesses", label: "Negocios", icon: Store },
];

export function AdminShell({ email, children }: { email: string; children: ReactNode }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/admin" ? pathname === href : pathname.startsWith(href));

  return (
    <div className="min-h-dvh pb-[calc(4.5rem+env(safe-area-inset-bottom))]">
      <header className="sticky top-0 z-10 border-b bg-background/85 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <Link href="/admin" className="flex items-center gap-2 font-bold">
            <Logo className="h-6" />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/admin/cuenta" className="flex items-center gap-1.5 text-sm text-muted-foreground" title={email}>
              <CircleUser className="size-4" /> Cuenta
            </Link>
            <form action={signOutAction}>
              <button type="submit" className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <LogOut className="size-4" /> Salir
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-4">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-10 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <ul className="mx-auto grid max-w-2xl grid-cols-4">
          {NAV.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className={cn("flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium", isActive(href) ? "text-brand" : "text-muted-foreground")}
              >
                <Icon className="size-5" />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

export function PageTitle({ title, subtitle, action }: { title: string; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="truncate text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <div className="text-sm text-muted-foreground">{subtitle}</div>}
      </div>
      {action}
    </div>
  );
}
