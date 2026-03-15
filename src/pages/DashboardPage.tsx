import { useEffect, useState } from "react"
import {
  Users,
  TrendingUp,
  TrendingDown,
  BarChart3,
  DollarSign,
  CreditCard,
  Activity,
  Signal,
  Wallet,
  ArrowRightLeft,
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

  const totalAum = stats
    ? stats.total_wallet_balance + stats.total_exchange_balance
    : 0

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {stats && (
        <>
          {/* User & Platform Stats */}
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

          {/* User Balances */}
          <Card>
            <h2 className="text-lg font-semibold mb-4">User Balances</h2>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-background rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign size={14} className="text-accent" />
                  <span className="text-xs text-text-muted">Total AUM</span>
                </div>
                <p className="text-xl font-bold">{formatCurrency(totalAum)}</p>
              </div>

              <div className="bg-background rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Wallet size={14} className="text-blue-400" />
                  <span className="text-xs text-text-muted">Hyperliquid Wallets</span>
                </div>
                <p className="text-xl font-bold">{formatCurrency(stats.total_wallet_balance)}</p>
                <p className="text-xs text-text-muted mt-1">{stats.active_wallets} active</p>
              </div>

              <div className="bg-background rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <ArrowRightLeft size={14} className="text-yellow-400" />
                  <span className="text-xs text-text-muted">Exchange Connections</span>
                </div>
                <p className="text-xl font-bold">{formatCurrency(stats.total_exchange_balance)}</p>
                <p className="text-xs text-text-muted mt-1">{stats.active_exchanges} active</p>
              </div>

              <div className="bg-background rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  {stats.total_unrealized_pnl >= 0 ? (
                    <TrendingUp size={14} className="text-green-400" />
                  ) : (
                    <TrendingDown size={14} className="text-red-400" />
                  )}
                  <span className="text-xs text-text-muted">Unrealized PnL</span>
                </div>
                <p
                  className={`text-xl font-bold ${
                    stats.total_unrealized_pnl >= 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {stats.total_unrealized_pnl >= 0 ? "+" : ""}
                  {formatCurrency(stats.total_unrealized_pnl)}
                </p>
              </div>

              <div className="bg-background rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <BarChart3 size={14} className="text-purple-400" />
                  <span className="text-xs text-text-muted">Margin in Use</span>
                </div>
                <p className="text-xl font-bold">
                  {totalAum > 0
                    ? `${((stats.total_unrealized_pnl < 0 ? Math.abs(stats.total_unrealized_pnl) : 0) / totalAum * 100).toFixed(1)}%`
                    : "0%"}
                </p>
              </div>
            </div>
          </Card>
        </>
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
