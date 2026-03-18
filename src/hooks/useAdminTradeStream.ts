import { useEffect, useRef, useState, useCallback } from "react"
import { useAuthStore } from "@/stores/auth"
import axios from "axios"

export interface LiveTrade {
  id: string
  user_email: string
  symbol: string
  exchange: string
  direction: string
  status: string
  entry_price: number | null
  current_price: number | null
  take_profit_price: number | null
  stop_loss_price: number | null
  position_size_usd: number
  leverage: number
  margin_used: number | null
  unrealized_pnl: number
  unrealized_pnl_percent: number
  tp_distance_pct: number | null
  sl_distance_pct: number | null
  opened_at: string | null
}

export interface TradeSummary {
  total_open: number
  total_unrealized_pnl: number
  total_margin_used: number
}

interface TradeStreamMessage {
  type: string
  timestamp: number
  data: {
    trades: LiveTrade[]
    summary: TradeSummary
  }
}

type ConnectionStatus = "connecting" | "connected" | "polling" | "disconnected" | "error"

const API_BASE_URL = import.meta.env.VITE_API_URL || ""
const HEARTBEAT_INTERVAL = 15_000
const POLL_INTERVAL = 3_000
const WS_CONNECT_TIMEOUT = 8_000
const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 16000, 30000]

function buildWsUrl(token: string): string {
  // Derive WebSocket base from the HTTP API URL
  let base = API_BASE_URL
  // Strip trailing /api or /api/ suffix (we'll re-add the full path)
  base = base.replace(/\/api\/?$/, "")
  // Convert http(s) → ws(s)
  if (base.startsWith("https://")) {
    base = "wss://" + base.slice("https://".length)
  } else if (base.startsWith("http://")) {
    base = "ws://" + base.slice("http://".length)
  } else {
    // Relative URL — use window.location
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:"
    base = `${proto}//${window.location.host}`
  }
  return `${base}/api/v1/ws/admin/trades?token=${encodeURIComponent(token)}`
}

/**
 * Admin trade stream hook.
 *
 * Tries WebSocket first for real-time updates.
 * Falls back to HTTP polling if WebSocket fails to connect.
 */
export function useAdminTradeStream() {
  const [trades, setTrades] = useState<LiveTrade[]>([])
  const [summary, setSummary] = useState<TradeSummary>({
    total_open: 0,
    total_unrealized_pnl: 0,
    total_margin_used: 0,
  })
  const [status, setStatus] = useState<ConnectionStatus>("disconnected")

  const wsRef = useRef<WebSocket | null>(null)
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const connectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const retriesRef = useRef(0)
  const mountedRef = useRef(true)
  const usingWsRef = useRef(false)
  const fetchingRef = useRef(false)

  const updateData = useCallback((msg: TradeStreamMessage) => {
    if (msg.data) {
      setTrades(msg.data.trades || [])
      setSummary(
        msg.data.summary || { total_open: 0, total_unrealized_pnl: 0, total_margin_used: 0 }
      )
    }
  }, [])

  // --- HTTP Polling fallback ---
  const pollTrades = useCallback(async () => {
    if (fetchingRef.current || usingWsRef.current) return
    fetchingRef.current = true
    try {
      const token = useAuthStore.getState().accessToken
      const res = await axios.get(`${API_BASE_URL}/v1/admin/trades`, {
        params: { page: 1, page_size: 50, status: "open" },
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!mountedRef.current) return
      const items: Record<string, unknown>[] = res.data.items || []
      setTrades(
        items.map((t) => ({
          id: t.id as string,
          user_email: (t.user_email as string) || "—",
          symbol: t.symbol as string,
          exchange: (t.exchange as string) || "hyperliquid",
          direction: t.direction as string,
          status: t.status as string,
          entry_price: (t.entry_price as number) ?? null,
          // REST API doesn't have live current_price; show null so UI can show "—"
          current_price: null,
          take_profit_price: (t.take_profit_price as number) ?? null,
          stop_loss_price: (t.stop_loss_price as number) ?? null,
          position_size_usd: (t.position_size_usd as number) || 0,
          leverage: (t.leverage as number) || 1,
          margin_used: (t.margin_used as number) ?? null,
          unrealized_pnl: (t.unrealized_pnl as number) || 0,
          unrealized_pnl_percent: (t.unrealized_pnl_percent as number) || 0,
          tp_distance_pct: null,
          sl_distance_pct: null,
          opened_at: (t.opened_at as string) ?? null,
        }))
      )
      setSummary({
        total_open: (res.data.total as number) || items.length,
        total_unrealized_pnl: items.reduce(
          (sum, t) => sum + ((t.unrealized_pnl as number) || 0),
          0
        ),
        total_margin_used: items.reduce((sum, t) => sum + ((t.margin_used as number) || 0), 0),
      })
    } catch (e) {
      console.error("[TradeStream] Poll error:", e)
    } finally {
      fetchingRef.current = false
    }
  }, [])

  const startPolling = useCallback(() => {
    if (pollRef.current) return
    setStatus("polling")
    pollTrades() // immediate first fetch
    pollRef.current = setInterval(pollTrades, POLL_INTERVAL)
    console.log("[TradeStream] Polling started")
  }, [pollTrades])

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  // --- WebSocket ---
  const cleanupWs = useCallback(() => {
    if (connectTimeoutRef.current) {
      clearTimeout(connectTimeoutRef.current)
      connectTimeoutRef.current = null
    }
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current)
      heartbeatRef.current = null
    }
    if (reconnectRef.current) {
      clearTimeout(reconnectRef.current)
      reconnectRef.current = null
    }
    if (wsRef.current) {
      wsRef.current.onclose = null
      wsRef.current.onerror = null
      wsRef.current.onmessage = null
      wsRef.current.close()
      wsRef.current = null
    }
    usingWsRef.current = false
  }, [])

  const connectWs = useCallback(() => {
    if (!mountedRef.current) return

    const token = useAuthStore.getState().accessToken
    if (!token) {
      startPolling()
      return
    }

    cleanupWs()
    setStatus("connecting")

    const wsUrl = buildWsUrl(token)
    console.log("[TradeStream] WS connecting to:", wsUrl.replace(/token=.*/, "token=***"))

    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    // If WS doesn't connect within timeout, fall back to polling
    connectTimeoutRef.current = setTimeout(() => {
      if (ws.readyState !== WebSocket.OPEN) {
        console.log("[TradeStream] WS timeout, falling back to polling")
        cleanupWs()
        startPolling()
      }
    }, WS_CONNECT_TIMEOUT)

    ws.onopen = () => {
      if (!mountedRef.current) return
      if (connectTimeoutRef.current) {
        clearTimeout(connectTimeoutRef.current)
        connectTimeoutRef.current = null
      }
      console.log("[TradeStream] WS connected")
      usingWsRef.current = true
      stopPolling() // stop polling if it was running
      setStatus("connected")
      retriesRef.current = 0

      heartbeatRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send("ping")
        }
      }, HEARTBEAT_INTERVAL)
    }

    ws.onmessage = (event) => {
      if (!mountedRef.current) return
      try {
        const msg: TradeStreamMessage = JSON.parse(event.data)
        if (msg.type === "pong") return
        if (msg.type === "admin_trades_update") {
          updateData(msg)
        }
      } catch {
        // ignore parse errors
      }
    }

    ws.onclose = (event) => {
      if (!mountedRef.current) return
      console.log(`[TradeStream] WS closed: code=${event.code} reason=${event.reason}`)
      usingWsRef.current = false

      // Auth failure — don't retry WS, use polling
      if (event.code === 4001 || event.code === 4003) {
        console.error("[TradeStream] Auth failed, falling back to polling")
        setStatus("error")
        startPolling()
        return
      }

      // Reconnect with backoff, poll in the meantime
      startPolling()
      const delay = RECONNECT_DELAYS[Math.min(retriesRef.current, RECONNECT_DELAYS.length - 1)]
      retriesRef.current += 1
      reconnectRef.current = setTimeout(connectWs, delay)
    }

    ws.onerror = () => {
      // onclose will fire after this
    }
  }, [cleanupWs, startPolling, stopPolling, updateData])

  useEffect(() => {
    mountedRef.current = true
    connectWs()

    return () => {
      mountedRef.current = false
      cleanupWs()
      stopPolling()
    }
  }, [connectWs, cleanupWs, stopPolling])

  return { trades, summary, status }
}
