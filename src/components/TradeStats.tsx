import { useEffect, useState } from "react"
import {
  TrendingUp,
  TrendingDown,
  Target,
  Activity,
  BarChart3,
  Trophy,
  Skull,
} from "lucide-react"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Card, StatCard } from "@/components/Card"
import { analyticsApi } from "@/services/api"
import { formatCurrency } from "@/lib/utils"

interface TradeAnalytics {
  period: string
  total_trades: number
  winning_trades: number
  losing_trades: number
  win_rate: number
  total_pnl: number
  average_pnl: number
  best_trade: number
  worst_trade: number
}

interface DailyPnL {
  date: string
  pnl: number
  trade_count: number
}

interface SymbolPerf {
  symbol: string
  total_trades: number
  winning_trades: number
  total_pnl: number
  win_rate: number
}

const PIE_COLORS = ["#22c55e", "#ef4444"]

const tooltipStyle = {
  backgroundColor: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: "8px",
  fontSize: "12px",
  color: "var(--color-text-primary)",
}

export function TradeStats() {
  const [period, setPeriod] = useState("30d")
  const [analytics, setAnalytics] = useState<TradeAnalytics | null>(null)
  const [dailyPnL, setDailyPnL] = useState<DailyPnL[]>([])
  const [symbolPerf, setSymbolPerf] = useState<SymbolPerf[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const days = period === "7d" ? 7 : period === "30d" ? 30 : 90
    Promise.all([
      analyticsApi.getTradeAnalytics(period),
      analyticsApi.getDailyPnL(days),
      analyticsApi.getPerformanceBySymbol(),
    ])
      .then(([aRes, pRes, sRes]) => {
        setAnalytics(aRes.data)
        setDailyPnL(pRes.data)
        setSymbolPerf(sRes.data?.slice(0, 10) || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [period])

  if (loading) {
    return <p className="text-text-muted py-4">Loading stats...</p>
  }

  if (!analytics) return null

  // Cumulative equity curve
  const cumPnL = dailyPnL.reduce<{ date: string; cumPnl: number; pnl: number }[]>((acc, d) => {
    const prev = acc.length > 0 ? acc[acc.length - 1].cumPnl : 0
    acc.push({ date: d.date, cumPnl: +(prev + d.pnl).toFixed(2), pnl: d.pnl })
    return acc
  }, [])

  const winLoss = [
    { name: "Wins", value: analytics.winning_trades },
    { name: "Losses", value: analytics.losing_trades },
  ]

  return (
    <div className="space-y-4">
      {/* Period selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Platform Performance</h2>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="bg-surface border border-border rounded-md px-3 py-1.5 text-sm"
        >
          <option value="7d">7 Days</option>
          <option value="30d">30 Days</option>
          <option value="90d">90 Days</option>
        </select>
      </div>

      {/* Stats row */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Trades"
          value={analytics.total_trades}
          icon={Activity}
        />
        <StatCard
          label="Win Rate"
          value={`${analytics.win_rate.toFixed(1)}%`}
          icon={Target}
          trend={analytics.win_rate >= 50 ? "up" : "down"}
        />
        <StatCard
          label="Total P&L"
          value={formatCurrency(analytics.total_pnl)}
          icon={analytics.total_pnl >= 0 ? TrendingUp : TrendingDown}
          trend={analytics.total_pnl >= 0 ? "up" : "down"}
        />
        <StatCard
          label="Avg per Trade"
          value={formatCurrency(analytics.average_pnl)}
          icon={BarChart3}
          trend={analytics.average_pnl >= 0 ? "up" : "down"}
        />
      </div>

      {/* Best/Worst */}
      <div className="grid gap-3 grid-cols-2">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-success/10">
              <Trophy size={16} className="text-success" />
            </div>
            <div>
              <p className="text-xs text-text-muted">Best Trade</p>
              <p className="text-lg font-bold text-success">+{formatCurrency(analytics.best_trade)}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-danger/10">
              <Skull size={16} className="text-danger" />
            </div>
            <div>
              <p className="text-xs text-text-muted">Worst Trade</p>
              <p className="text-lg font-bold text-danger">{formatCurrency(analytics.worst_trade)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts row 1: Equity curve + Win/Loss pie */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <p className="text-sm font-medium mb-3">Equity Curve</p>
          <div className="h-[250px]">
            {cumPnL.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cumPnL}>
                  <defs>
                    <linearGradient id="eqGradAdmin" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d) => new Date(d).toLocaleDateString("en", { month: "short", day: "numeric" })}
                    tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                  />
                  <YAxis
                    tickFormatter={(v) => `$${v}`}
                    tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value) => [`$${Number(value ?? 0).toFixed(2)}`, "Cumulative P&L"]}
                    labelFormatter={(l) => new Date(l).toLocaleDateString()}
                  />
                  <Area type="monotone" dataKey="cumPnl" stroke="#6366f1" fillOpacity={1} fill="url(#eqGradAdmin)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-text-muted text-sm">
                No data
              </div>
            )}
          </div>
        </Card>

        <Card>
          <p className="text-sm font-medium mb-3">Win / Loss</p>
          <div className="h-[190px]">
            {analytics.total_trades > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={winLoss}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {winLoss.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-text-muted text-sm">
                No trades
              </div>
            )}
          </div>
          <div className="flex justify-center gap-4 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500" /> Wins ({analytics.winning_trades})
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500" /> Losses ({analytics.losing_trades})
            </span>
          </div>
        </Card>
      </div>

      {/* Charts row 2: Daily PnL bars + Top symbols */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <p className="text-sm font-medium mb-3">Daily P&L</p>
          <div className="h-[220px]">
            {dailyPnL.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyPnL}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d) => new Date(d).toLocaleDateString("en", { day: "numeric" })}
                    tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                  />
                  <YAxis
                    tickFormatter={(v) => `$${v}`}
                    tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value) => [`$${Number(value ?? 0).toFixed(2)}`, "P&L"]}
                    labelFormatter={(l) => new Date(l).toLocaleDateString()}
                  />
                  <Bar dataKey="pnl" radius={[3, 3, 0, 0]}>
                    {dailyPnL.map((e, i) => (
                      <Cell key={i} fill={e.pnl >= 0 ? "#22c55e" : "#ef4444"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-text-muted text-sm">
                No data
              </div>
            )}
          </div>
        </Card>

        <Card>
          <p className="text-sm font-medium mb-3">Top Symbols</p>
          {symbolPerf.length > 0 ? (
            <div className="space-y-2">
              {symbolPerf.map((s) => (
                <div key={s.symbol} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-medium truncate w-28">{s.symbol}</span>
                    <span className="text-xs text-text-muted">{s.total_trades} trades</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-text-muted">{s.win_rate.toFixed(0)}%</span>
                    <span className={`font-mono text-xs font-medium ${s.total_pnl >= 0 ? "text-success" : "text-danger"}`}>
                      {s.total_pnl >= 0 ? "+" : ""}{formatCurrency(s.total_pnl)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-text-muted text-sm">
              No symbol data
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
