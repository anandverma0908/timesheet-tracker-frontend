import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthUser, UserRole, LoginPayload } from './types'
import { ROUTE_PERMISSIONS } from './types'

/* ── Dummy users for mock mode ── */
export const MOCK_USERS: (AuthUser & { password: string })[] = [
  { id: '1', name: 'Anand Verma',       email: 'anand@3sc.com',   password: 'admin123',   role: 'admin',               pod: null,      avatarUrl: null },
  { id: '2', name: 'Rahul Sharma',      email: 'rahul@3sc.com',   password: 'manager123', role: 'engineering_manager', pod: 'DPAI',    avatarUrl: null },
  { id: '3', name: 'Vishnuvardhan G.',  email: 'vishnu@3sc.com',  password: 'lead123',    role: 'tech_lead',           pod: 'DevOps',  avatarUrl: null },
  { id: '4', name: 'Aastha Rai',        email: 'aastha@3sc.com',  password: 'member123',  role: 'team_member',         pod: 'DPAI',    avatarUrl: null },
  { id: '5', name: 'Finance Team',      email: 'finance@3sc.com', password: 'finance123', role: 'finance_viewer',      pod: null,      avatarUrl: null },
]

interface AuthStore {
  user:       AuthUser | null
  token:      string | null
  isLoggedIn: boolean

  login:  (payload: LoginPayload) => Promise<void>
  logout: () => void

  /* Permission helpers */
  can:          (action: string) => boolean
  canAccessRoute:(path: string)  => boolean
  getScopedPod: ()               => string | null
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user:       null,
      token:      null,
      isLoggedIn: false,

      /* ── Login ── */
      login: async ({ email, password }: LoginPayload) => {
        const isMock = import.meta.env.VITE_USE_MOCK === 'true'

        if (isMock) {
          await new Promise(r => setTimeout(r, 800)) // simulate API delay
          const found = MOCK_USERS.find(
            u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
          )
          if (!found) throw new Error('Invalid email or password')
          const { password: _, ...user } = found
          set({ user, token: `mock-token-${user.id}`, isLoggedIn: true })
          return
        }

        /* Real API call */
        const res = await fetch('/api/auth/login', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ email, password }),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.detail ?? 'Login failed')
        }
        const { user, token } = await res.json()
        set({ user, token, isLoggedIn: true })
      },

      /* ── Logout ── */
      logout: () => set({ user: null, token: null, isLoggedIn: false }),

      /* ── Can access route? ── */
      canAccessRoute: (path: string) => {
        const { user } = get()
        if (!user) return false
        const perm = ROUTE_PERMISSIONS.find(p => path.startsWith(p.path))
        if (!perm) return true // no restriction defined → allow
        return perm.roles.includes(user.role)
      },

      /* ── Generic permission check ── */
      can: (action: string) => {
        const { user } = get()
        if (!user) return false
        const role = user.role

        const permissions: Record<string, UserRole[]> = {
          'view:all_engineers':     ['admin', 'engineering_manager'],
          'view:all_tickets':       ['admin', 'engineering_manager'],
          'view:own_pod_tickets':   ['admin', 'engineering_manager', 'tech_lead'],
          'view:export':            ['admin', 'engineering_manager', 'finance_viewer'],
          'view:finance_export':    ['admin', 'engineering_manager', 'finance_viewer'],
          'use:ai_time_entry':      ['admin', 'engineering_manager', 'tech_lead'],
          'manage:settings':        ['admin'],
          'manage:jira_config':     ['admin'],
          'manage:users':           ['admin'],
          'view:team_grid':         ['admin', 'engineering_manager', 'tech_lead'],
        }

        return permissions[action]?.includes(role) ?? false
      },

      /* ── Returns the POD filter to scope data for scoped roles ── */
      getScopedPod: () => {
        const { user } = get()
        if (!user) return null
        if (['admin', 'engineering_manager', 'finance_viewer'].includes(user.role)) return null
        return user.pod // tech_lead / team_member see only their POD
      },
    }),
    { name: 'eap-auth' }
  )
)
