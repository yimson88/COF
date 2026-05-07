import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  CircleAlert,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useCof } from '../context/CofContext'
import { roleLabels } from '../data/config'

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/events', label: 'Events' },
  { to: '/contact', label: 'Contact' },
  { to: '/portal', label: 'Members' },
  { to: '/dashboard', label: 'Dashboard' },
]

export function Layout() {
  const [open, setOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const { currentUser, branches, logout } = useCof()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
  }, [location.pathname])

  useEffect(() => {
    if (!toastMessage) {
      return undefined
    }

    const timeout = window.setTimeout(() => setToastMessage(null), 3200)

    return () => window.clearTimeout(timeout)
  }, [toastMessage])

  function handleLogout() {
    logout()
    setOpen(false)
    navigate('/')
  }

  function handleDashboardAccess(event: React.MouseEvent<HTMLAnchorElement>) {
    if (!currentUser) {
      event.preventDefault()
      setOpen(false)
      setToastMessage('Dashboard access is restricted to members only. Please log in first.')
      return
    }

    if (currentUser.role === 'member') {
      event.preventDefault()
      setOpen(false)
      setToastMessage('Executive dashboard access is restricted to authorized offices.')
    }
  }

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[38rem] bg-[radial-gradient(circle_at_top,rgba(29,126,216,0.25),transparent_44%)]" />
      <header className="sticky top-0 z-50 border-b border-white/10 bg-cof-deep/95 text-white backdrop-blur-xl">
        <div className="section-shell flex items-center justify-between gap-3 py-4">
          <NavLink to="/" className="flex items-center gap-3">
            <img src="/reference-logo.png" alt="Circle of Friends logo" className="h-12 w-12 rounded-full border border-white/12 bg-white object-cover" />
            <div>
              <p className="font-display text-base font-semibold text-white sm:text-lg">
                Circle of Friends
              </p>
              <p className="text-xs uppercase tracking-[0.22em] text-white/70">
                Friends for Life
              </p>
            </div>
          </NavLink>

          <nav className="hidden items-center gap-2 lg:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={item.to === '/dashboard' ? handleDashboardAccess : undefined}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-sm font-semibold transition ${
                    isActive
                      ? 'bg-white text-cof-deep'
                      : 'text-white/78 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            {currentUser ? (
              <>
                <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/10 px-3 py-2">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="h-9 w-9 rounded-full border border-white/20 object-cover"
                  />
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">{currentUser.name}</p>
                    <p className="text-xs text-white/68">{roleLabels[currentUser.role]}</p>
                  </div>
                </div>
                <button type="button" onClick={handleLogout} className="btn-secondary border-white/10 bg-white/10 text-white hover:bg-white/14">
                  <LogOut size={16} />
                  Logout
                </button>
              </>
            ) : (
              <NavLink to="/portal" className="btn-primary bg-white text-cof-deep hover:bg-cof-pale">
                Member Login
                <ArrowRight size={16} />
              </NavLink>
            )}
          </div>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white lg:hidden"
            aria-label="Toggle navigation"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <AnimatePresence>
          {open ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-white/10 lg:hidden"
            >
              <div className="section-shell space-y-3 py-4">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={item.to === '/dashboard' ? handleDashboardAccess : () => setOpen(false)}
                    className={({ isActive }) =>
                      `block rounded-2xl px-4 py-3 text-sm font-semibold ${
                        isActive ? 'bg-white text-cof-deep' : 'bg-white/10 text-white'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
                {currentUser ? (
                  <button type="button" onClick={handleLogout} className="btn-secondary w-full border-white/10 bg-white/10 text-white hover:bg-white/14">
                    <LogOut size={16} />
                    Logout
                  </button>
                ) : (
                  <NavLink to="/portal" onClick={() => setOpen(false)} className="btn-primary w-full bg-white text-cof-deep hover:bg-cof-pale">
                    Member Login
                    <ArrowRight size={16} />
                  </NavLink>
                )}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </header>

      <main className="pb-20">
        <AnimatePresence>
          {toastMessage ? (
            <motion.div
              initial={{ opacity: 0, y: -14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="pointer-events-none fixed right-4 top-24 z-[80] max-w-sm"
            >
              <div className="flex items-start gap-3 rounded-2xl border border-cof-blue/18 bg-cof-deep px-4 py-3 text-white shadow-[0_16px_45px_rgba(9,23,39,0.28)]">
                <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-cof-pale">
                  <CircleAlert size={16} />
                </span>
                <p className="text-sm leading-6 text-white/88">{toastMessage}</p>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 18, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -12, filter: 'blur(6px)' }}
            transition={{ duration: 0.38, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="border-t border-cof-deep/10 bg-cof-deep text-white">
        <div className="section-shell grid gap-10 py-12 lg:grid-cols-[1.4fr,1fr,1fr]">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img src="/reference-logo.png" alt="Circle of Friends logo" className="h-12 w-12 rounded-full border border-white/12 object-cover" />
              <div>
                <p className="font-display text-xl font-semibold">Circle of Friends</p>
                <p className="text-sm text-white/70">Friends for Life</p>
              </div>
            </div>
            <p className="max-w-xl text-sm leading-7 text-white/72">
              Digital coordination for welfare contributions, branch administration, member
              communication, elections, charity, and community outreach.
            </p>
          </div>

          <div>
            <p className="mb-4 flex items-center gap-2 font-display text-lg font-semibold">
              <ShieldCheck size={18} />
              Quick Access
            </p>
            <div className="space-y-3 text-sm text-white/78">
              <NavLink to="/about" className="block transition hover:text-white">
                About the association
              </NavLink>
              <NavLink to="/events" className="block transition hover:text-white">
                Events and calendar
              </NavLink>
              <NavLink to="/contact" className="block transition hover:text-white">
                Contact us
              </NavLink>
              <NavLink to="/portal" className="block transition hover:text-white">
                Member portal
              </NavLink>
              <NavLink
                to="/dashboard"
                onClick={handleDashboardAccess}
                className="block transition hover:text-white"
              >
                Executive dashboard
              </NavLink>
            </div>
          </div>

          <div>
            <p className="mb-4 flex items-center gap-2 font-display text-lg font-semibold">
              <LayoutDashboard size={18} />
              Active Branches
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm text-white/78 sm:grid-cols-3 lg:grid-cols-2">
              {branches.map((branch) => (
                <span key={branch.id} className="rounded-2xl border border-white/10 px-3 py-2">
                  {branch.name.replace(' Branch', '')}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="section-shell flex items-center justify-start pb-5">
          <p className="text-xs text-white/58">Yimson Dev 2026 - All Rights Reserved</p>
        </div>
      </footer>
    </div>
  )
}
