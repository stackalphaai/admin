import { useEffect, useState } from "react"
import {
  Users,
  TrendingUp,
  BarChart3,
  DollarSign,
  CreditCard,
  Activity,
  Signal,
  Wallet,
} from "lucide-react"
import { StatCard, Card } from "@/components/Card"
import { StatusBadge } from "@/components/StatusBadge"
import { dashboardApi } from "@/services/api"
import { formatCurrency, formatNumber } from "@/lib/utils"
import type { DashboardStats, SystemHealth } from "@/types"

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [health, setHealth] = useState<SystemHealth | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([dashboardApi.getStats(), dashboardApi.getHealth()])
      .then(([statsRes, healthRes]) => {
        setStats(statsRes.data)
        setHealth(healthRes.data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <p className="text-text-muted">Loading dashboard...</p>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Users"
            value={formatNumber(stats.total_users)}
            icon={Users}
          />
          <StatCard
            label="Active Subscribers"
            value={formatNumber(stats.active_subscribers)}
            icon={CreditCard}
          />
          <StatCard
            label="Open Trades"
            value={formatNumber(stats.open_trades)}
            icon={BarChart3}
            trend={stats.open_trades > 0 ? "up" : "neutral"}
          />
          <StatCard
            label="Active Signals"
            value={formatNumber(stats.active_signals)}
            icon={Signal}
          />
          <StatCard
            label="Total Trades"
            value={formatNumber(stats.total_trades)}
            icon={TrendingUp}
          />
          <StatCard
            label="Total Revenue"
            value={formatCurrency(stats.total_revenue)}
            icon={DollarSign}
            trend="up"
          />
          <StatCard
            label="Pending Payouts"
            value={formatCurrency(stats.pending_payouts)}
            icon={Wallet}
            trend={stats.pending_payouts > 0 ? "down" : "neutral"}
          />
          <StatCard
            label="Active Users"
            value={formatNumber(stats.active_users)}
            icon={Activity}
          />
        </div>
      )}

      {health && (
        <Card>
          <h2 className="text-lg font-semibold mb-3">System Health</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {(
              [
                ["Overall", health.status],
                ["Database", health.database],
                ["Redis", health.redis],
                ["Hyperliquid", health.hyperliquid],
                ["Binance", health.binance],
                ["OpenRouter", health.openrouter],
              ] as const
            ).map(([label, status]) => (
              <div
                key={label}
                className="flex flex-col items-center gap-1 p-3 bg-background rounded-md"
              >
                <span className="text-xs text-text-muted">{label}</span>
                <StatusBadge status={status} />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
