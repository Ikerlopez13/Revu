"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    // En desarrollo no: cachear /_next/static estorba al recargar en caliente.
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/admin-sw.js", { scope: "/admin" }).catch(() => {});
  }, []);
  return null;
}
