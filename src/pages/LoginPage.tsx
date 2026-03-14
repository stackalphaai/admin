import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "@/stores/auth"
import { authApi } from "@/services/api"

export function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await authApi.login(email, password)
      login(res.data.access_token, res.data.refresh_token)
      navigate("/")
    } catch {
      setError("Invalid credentials or insufficient permissions")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm bg-surface border border-border rounded-lg p-6">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-accent">StackAlpha</h1>
          <p className="text-sm text-text-muted mt-1">Admin Panel</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-danger/10 text-danger text-sm px-3 py-2 rounded">
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs text-text-muted mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent hover:bg-accent-hover text-white py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  )
}
