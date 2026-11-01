import { Badge } from "@/components/ui/badge";
import type { TagStatus } from "@/lib/db/schema";
import { STATUS_LABEL } from "@/lib/format";

const VARIANT = { active: "success", unassigned: "warning", disabled: "muted" } as const;

export function StatusBadge({ status }: { status: TagStatus }) {
  return <Badge variant={VARIANT[status]}>{STATUS_LABEL[status]}</Badge>;
}
