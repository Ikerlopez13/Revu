"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/admin/action";
import { cn } from "@/lib/utils";

type Props = {
  action: (fd: FormData) => Promise<ActionResult<unknown>>;
  children?: ReactNode;
  submitLabel: string;
  variant?: "default" | "brand" | "outline" | "destructive" | "secondary";
  successMessage?: string;
  confirm?: string;
  className?: string;
  buttonClassName?: string;
};

/** Formulario que llama a una server action y muestra error/éxito en línea. */
export function ActionForm({ action, children, submitLabel, variant = "default", successMessage, confirm, className, buttonClassName }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [state, setState] = useState<{ error?: string; message?: string }>({});

  return (
    <form
      className={cn("flex flex-col gap-3", className)}
      onSubmit={(e) => {
        e.preventDefault();
        if (confirm && !window.confirm(confirm)) return;
        const fd = new FormData(e.currentTarget);
        start(async () => {
          const r = await action(fd);
          if (!r.ok) return setState({ error: r.error });
          const warn = (r.data as { cacheWarning?: boolean } | undefined)?.cacheWarning;
          setState({ message: warn ? "Guardado. La caché no respondió: el cambio puede tardar en verse." : successMessage });
          router.refresh();
        });
      }}
    >
      <fieldset disabled={pending} className="flex flex-col gap-3">
        {children}
        <Button type="submit" variant={variant} className={buttonClassName}>
          {pending ? "Guardando…" : submitLabel}
        </Button>
      </fieldset>
      {state.error && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {state.error}
        </p>
      )}
      {!state.error && state.message && <p className="text-sm text-success">{state.message}</p>}
    </form>
  );
}
