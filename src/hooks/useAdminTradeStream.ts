import { useEffect, useRef, useState, useCallback } from "react"
import { useAuthStore } from "@/stores/auth"

export interface LiveTrade {
  id: string
  user_email: string
  symbol: string
  exchange: string
  direction: string
  status: string
  entry_price: number
  current_price: number
  take_profit_price: number | null
  stop_loss_price: number | null
  position_size_usd: number
  leverage: number
  margin_used: number | null
  unrealized_pnl: number
  unrealized_pnl_percent: number
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

type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error"

const HEARTBEAT_INTERVAL = 15_000
const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 16000, 30000]

export function useAdminTradeStream() {
  const [trades, setTrades] = useState<LiveTrade[]>([])
  const [summary, setSummary] = useState<TradeSummary>({
    total_open: 0,
    total_unrealized_pnl: 0,
    total_margin_used: 0,
  })
  const [status, setStatus] = useState<ConnectionStatus>("disconnected")
  const [lastUpdate, setLastUpdate] = useState<number>(0)

  const wsRef = useRef<WebSocket | null>(null)
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const retriesRef = useRef(0)
  const mountedRef = useRef(true)

  const cleanup = useCallback(() => {
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
  }, [])

  const connect = useCallback(() => {
    if (!mountedRef.current) return

    const token = useAuthStore.getState().accessToken
    if (!token) {
      setStatus("error")
      return
    }

    cleanup()
    setStatus("connecting")

    // Build WebSocket URL from API base
    const apiUrl = import.meta.env.VITE_API_URL || window.location.origin + "/api"
    const wsBase = apiUrl
      .replace(/^http/, "ws")
      .replace(/\/api\/?$/, "")
    const wsUrl = `${wsBase}/api/v1/ws/admin/trades?token=${token}`

    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      if (!mountedRef.current) return
      setStatus("connected")
      retriesRef.current = 0

      // Start heartbeat
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
        if (msg.type === "admin_trades_update" && msg.data) {
          setTrades(msg.data.trades)
          setSummary(msg.data.summary)
          setLastUpdate(msg.timestamp)
        }
      } catch {
        // ignore parse errors
      }
    }

    ws.onclose = (event) => {
      if (!mountedRef.current) return
      setStatus("disconnected")

      // Don't reconnect on intentional close (4001=auth, 4003=not admin)
      if (event.code === 4001 || event.code === 4003) {
        setStatus("error")
        return
      }

      // Exponential backoff reconnect
      const delay = RECONNECT_DELAYS[Math.min(retriesRef.current, RECONNECT_DELAYS.length - 1)]
      retriesRef.current += 1
      reconnectRef.current = setTimeout(connect, delay)
    }

    ws.onerror = () => {
      if (!mountedRef.current) return
      // onclose will fire after this, which handles reconnect
    }
  }, [cleanup])

  useEffect(() => {
    mountedRef.current = true
    connect()

    return () => {
      mountedRef.current = false
      cleanup()
    }
  }, [connect, cleanup])

  return { trades, summary, status, lastUpdate }
}
