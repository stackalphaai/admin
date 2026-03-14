import axios from "axios"
import type {
  DashboardStats,
  SystemHealth,
  ConfigMap,
  UserDetail,
  UserListItem,
  Signal,
  Trade,
  Subscription,
  CeleryTask,
  PaginatedResponse,
  ExchangeConnection,
  WalletInfo,
} from "@/types"
import { useAuthStore } from "@/stores/auth"

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api"

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = useAuthStore.getState().refreshToken
      if (refreshToken && !error.config._retry) {
        error.config._retry = true
        try {
          const res = await axios.post(`${API_BASE_URL}/v1/auth/refresh`, {
            refresh_token: refreshToken,
          })
          const { access_token, refresh_token } = res.data
          useAuthStore.getState().login(access_token, refresh_token)
          error.config.headers.Authorization = `Bearer ${access_token}`
          return api(error.config)
        } catch {
          useAuthStore.getState().logout()
          window.location.href = "/login"
        }
      } else {
        useAuthStore.getState().logout()
        window.location.href = "/login"
      }
    }
    return Promise.reject(error)
  }
)

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ access_token: string; refresh_token: string }>(
      "/v1/auth/login",
      { email, password }
    ),
}

// Dashboard
export const dashboardApi = {
  getStats: () => api.get<DashboardStats>("/v1/admin/dashboard"),
  getHealth: () => api.get<SystemHealth>("/v1/admin/health"),
}

// Config
export const configApi = {
  getAll: () => api.get<{ configs: ConfigMap }>("/v1/admin/config"),
  update: (configs: { key: string; value: unknown }[]) =>
    api.put("/v1/admin/config", { configs }),
  reset: (key: string) => api.delete(`/v1/admin/config/${key}`),
}

// Users
export const usersApi = {
  list: (page = 1, pageSize = 20, search?: string) =>
    api.get<PaginatedResponse<UserListItem>>("/v1/admin/users", {
      params: { page, page_size: pageSize, search },
    }),
  detail: (id: string) => api.get<UserDetail>(`/v1/admin/users/${id}`),
  toggleActive: (id: string) =>
    api.post(`/v1/admin/users/${id}/toggle-active`),
  toggleAdmin: (id: string) => api.post(`/v1/admin/users/${id}/toggle-admin`),
  grantSubscription: (
    id: string,
    plan: string = "monthly",
    durationDays: number = 30
  ) =>
    api.post(`/v1/admin/users/${id}/grant-subscription`, {
      plan,
      duration_days: durationDays,
    }),
  resetPassword: (id: string) =>
    api.post<{ reset_token: string }>(`/v1/admin/users/${id}/reset-password`),
}

// Signals
export const signalsApi = {
  list: (page = 1, pageSize = 20, exchange?: string, status?: string) =>
    api.get<PaginatedResponse<Signal>>("/v1/admin/signals", {
      params: { page, page_size: pageSize, exchange, status },
    }),
  generate: (symbol: string, exchange = "hyperliquid") =>
    api.post("/v1/admin/signals/generate", null, {
      params: { symbol, exchange },
    }),
  invalidate: (id: string) =>
    api.post(`/v1/admin/signals/${id}/invalidate`),
}

// Trades
export const tradesApi = {
  list: (page = 1, pageSize = 20, status?: string, exchange?: string) =>
    api.get<PaginatedResponse<Trade>>("/v1/admin/trades", {
      params: { page, page_size: pageSize, status, exchange },
    }),
  forceClose: (id: string, closeReason = "system") =>
    api.post(`/v1/admin/trades/${id}/force-close`, {
      close_reason: closeReason,
    }),
}

// Subscriptions
export const subscriptionsApi = {
  list: (page = 1, pageSize = 20, status?: string) =>
    api.get<PaginatedResponse<Subscription>>("/v1/admin/subscriptions", {
      params: { page, page_size: pageSize, status },
    }),
  cancel: (id: string) => api.post(`/v1/admin/subscriptions/${id}/cancel`),
}

// Tasks
export const tasksApi = {
  list: () => api.get<CeleryTask[]>("/v1/admin/tasks"),
  trigger: (taskName: string) =>
    api.post<{ task_id: string }>("/v1/admin/tasks/trigger", {
      task_name: taskName,
    }),
}

// Broadcast
export const broadcastApi = {
  send: (message: string) =>
    api.post("/v1/admin/broadcast", { message, channel: "telegram" }),
}

// Exchange Connections
export const exchangeApi = {
  list: (page = 1, pageSize = 20) =>
    api.get<PaginatedResponse<ExchangeConnection>>(
      "/v1/admin/exchange-connections",
      { params: { page, page_size: pageSize } }
    ),
}

// Wallets
export const walletsApi = {
  list: (page = 1, pageSize = 20) =>
    api.get<PaginatedResponse<WalletInfo>>("/v1/admin/wallets", {
      params: { page, page_size: pageSize },
    }),
}
