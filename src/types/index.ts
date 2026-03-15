export interface DashboardStats {
  total_users: number
  active_users: number
  total_subscribers: number
  active_subscribers: number
  total_trades: number
  open_trades: number
  total_signals: number
  active_signals: number
  total_revenue: number
  pending_payouts: number
  total_wallet_balance: number
  total_exchange_balance: number
  total_unrealized_pnl: number
  active_wallets: number
  active_exchanges: number
}

export interface SystemHealth {
  status: string
  database: string
  redis: string
  hyperliquid: string
  binance: string
  openrouter: string
  timestamp: string
}

export interface ConfigSetting {
  value: unknown
  description: string
  category: string
  type: string
  has_override: boolean
}

export interface ConfigMap {
  [key: string]: ConfigSetting
}

export interface UserDetail {
  id: string
  email: string
  full_name: string | null
  is_active: boolean
  is_verified: boolean
  is_subscribed: boolean
  is_admin: boolean
  is_superadmin: boolean
  is_2fa_enabled: boolean
  login_count: number
  last_login: string | null
  created_at: string
  wallet_count: number
  trade_count: number
  exchange_connection_count: number
  has_telegram: boolean
}

export interface UserListItem {
  id: string
  email: string
  full_name: string | null
  is_active: boolean
  is_verified: boolean
  is_subscribed: boolean
  is_admin: boolean
  created_at: string
}

export interface Signal {
  id: string
  symbol: string
  direction: string
  entry_price: number
  take_profit_price: number
  stop_loss_price: number
  confidence_score: number
  status: string
  exchange: string
  created_at: string
}

export interface Trade {
  id: string
  user_id: string
  user_email: string
  signal_id: string | null
  symbol: string
  direction: string
  entry_price: number
  exit_price: number | null
  take_profit_price: number
  stop_loss_price: number
  leverage: number
  position_size_usd: number
  margin_used: number | null
  realized_pnl: number | null
  realized_pnl_percent: number | null
  unrealized_pnl: number | null
  status: string
  close_reason: string | null
  exchange: string
  opened_at: string | null
  closed_at: string | null
  created_at: string
}

export interface Subscription {
  id: string
  user_id: string
  user_email: string
  plan: string
  status: string
  price_usd: number
  starts_at: string
  expires_at: string
  created_at: string
}

export interface CeleryTask {
  name: string
  schedule: string
  description: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}

export interface ExchangeConnection {
  id: string
  user_id: string
  user_email: string
  exchange_type: string
  label: string | null
  is_testnet: boolean
  is_trading_enabled: boolean
  status: string
  balance_usd: number | null
  last_sync_at: string | null
  created_at: string
}

export interface WalletInfo {
  id: string
  user_id: string
  user_email: string
  address: string
  wallet_type: string
  status: string
  is_trading_enabled: boolean
  balance_usd: number | null
  margin_used: number | null
  last_sync_at: string | null
  created_at: string
}
