const TZ = "Europe/Madrid";

export function formatDateTime(d: Date | string): string {
  return new Intl.DateTimeFormat("es-ES", { timeZone: TZ, day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(d));
}

export function formatDate(d: Date | string): string {
  return new Intl.DateTimeFormat("es-ES", { timeZone: TZ, day: "numeric", month: "short", year: "numeric" }).format(new Date(d));
}

export const STATUS_LABEL = { unassigned: "Sin asignar", active: "Activo", disabled: "Desactivado" } as const;
export const OS_LABEL = { ios: "iOS", android: "Android", other: "Otro" } as const;
export const ACTION_LABEL = {
  create: "Creado",
  assign: "Asignado",
  reassign: "Reasignado",
  change_destination: "Destino cambiado",
  relabel: "Etiqueta cambiada",
  disable: "Desactivado",
  enable: "Activado",
  unassign: "Devuelto al stock",
} as const;
