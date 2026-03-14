import { cn } from "@/lib/utils"

const variants: Record<string, string> = {
  healthy: "bg-success/10 text-success",
  active: "bg-success/10 text-success",
  open: "bg-info/10 text-info",
  pending: "bg-warning/10 text-warning",
  long: "bg-success/10 text-success",
  short: "bg-danger/10 text-danger",
  closed: "bg-text-muted/10 text-text-muted",
  expired: "bg-text-muted/10 text-text-muted",
  cancelled: "bg-danger/10 text-danger",
  unhealthy: "bg-danger/10 text-danger",
  degraded: "bg-warning/10 text-warning",
  not_configured: "bg-warning/10 text-warning",
  connected: "bg-success/10 text-success",
  disconnected: "bg-danger/10 text-danger",
  error: "bg-danger/10 text-danger",
  failed: "bg-danger/10 text-danger",
}

export function StatusBadge({ status }: { status: string }) {
  const key = status.toLowerCase()
  const variant = variants[key] || "bg-text-muted/10 text-text-muted"

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize",
        variant
      )}
    >
      {status}
    </span>
  )
}
