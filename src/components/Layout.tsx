import { NavLink, Outlet, useNavigate } from "react-router-dom"
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  BarChart3,
  Settings,
  Zap,
  CreditCard,
  LogOut,
  Wallet,
  Link2,
  Megaphone,
} from "lucide-react"
import { useAuthStore } from "@/stores/auth"
import { cn } from "@/lib/utils"

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/users", icon: Users, label: "Users" },
  { to: "/signals", icon: TrendingUp, label: "Signals" },
  { to: "/trades", icon: BarChart3, label: "Trades" },
  { to: "/subscriptions", icon: CreditCard, label: "Subscriptions" },
  { to: "/exchange-connections", icon: Link2, label: "Exchanges" },
  { to: "/wallets", icon: Wallet, label: "Wallets" },
  { to: "/tasks", icon: Zap, label: "Tasks" },
  { to: "/config", icon: Settings, label: "Config" },
  { to: "/broadcast", icon: Megaphone, label: "Broadcast" },
]

export function Layout() {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-56 bg-surface border-r border-border flex flex-col shrink-0">
        <div className="p-4 border-b border-border">
          <h1 className="text-lg font-bold text-accent">StackAlpha</h1>
          <p className="text-xs text-text-muted">Admin Panel</p>
        </div>
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors",
                  isActive
                    ? "bg-accent/10 text-accent font-medium"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
                )
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-2 border-t border-border">
          <button
            onClick={() => {
              logout()
              navigate("/login")
            }}
            className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-text-secondary hover:text-danger hover:bg-surface-hover w-full transition-colors"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
