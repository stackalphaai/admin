import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { useAuthStore } from "@/stores/auth"
import { Layout } from "@/components/Layout"
import { LoginPage } from "@/pages/LoginPage"
import { DashboardPage } from "@/pages/DashboardPage"
import { UsersPage } from "@/pages/UsersPage"
import { SignalsPage } from "@/pages/SignalsPage"
import { TradesPage } from "@/pages/TradesPage"
import { SubscriptionsPage } from "@/pages/SubscriptionsPage"
import { ConfigPage } from "@/pages/ConfigPage"
import { TasksPage } from "@/pages/TasksPage"
import { ExchangeConnectionsPage } from "@/pages/ExchangeConnectionsPage"
import { WalletsPage } from "@/pages/WalletsPage"
import { BroadcastPage } from "@/pages/BroadcastPage"
import { ModelsPage } from "@/pages/ModelsPage"
import { LogsPage } from "@/pages/LogsPage"
import type { ReactNode } from "react"

function ProtectedRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="signals" element={<SignalsPage />} />
          <Route path="trades" element={<TradesPage />} />
          <Route path="subscriptions" element={<SubscriptionsPage />} />
          <Route path="exchange-connections" element={<ExchangeConnectionsPage />} />
          <Route path="wallets" element={<WalletsPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="models" element={<ModelsPage />} />
          <Route path="config" element={<ConfigPage />} />
          <Route path="logs" element={<LogsPage />} />
          <Route path="broadcast" element={<BroadcastPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
