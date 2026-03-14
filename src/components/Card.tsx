import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

export function Card({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "bg-surface border border-border rounded-lg p-4",
        className
      )}
    >
      {children}
    </div>
  )
}

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
}: {
  label: string
  value: string | number
  icon?: React.ComponentType<{ size?: number; className?: string }>
  trend?: "up" | "down" | "neutral"
}) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wide">
            {label}
          </p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        {Icon && (
          <div
            className={cn(
              "p-2 rounded-md",
              trend === "up"
                ? "bg-success/10 text-success"
                : trend === "down"
                  ? "bg-danger/10 text-danger"
                  : "bg-accent/10 text-accent"
            )}
          >
            <Icon size={18} />
          </div>
        )}
      </div>
    </Card>
  )
}
