import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { Layout } from './components/Layout'
import { CofProvider } from './context/CofContext'

const HomePage = lazy(() => import('./pages/HomePage').then((module) => ({ default: module.HomePage })))
const AboutPage = lazy(() => import('./pages/AboutPage').then((module) => ({ default: module.AboutPage })))
const EventsPage = lazy(() => import('./pages/EventsPage').then((module) => ({ default: module.EventsPage })))
const ContactPage = lazy(() => import('./pages/ContactPage').then((module) => ({ default: module.ContactPage })))
const PortalPage = lazy(() => import('./pages/PortalPage').then((module) => ({ default: module.PortalPage })))
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((module) => ({ default: module.DashboardPage })))

const routeMeta: Record<string, { title: string; description: string }> = {
  '/': {
    title: 'Circle of Friends | Friends for Life',
    description:
      'A professional welfare association supporting members through weddings, funerals, outreach, and community life.',
  },
  '/about': {
    title: 'About Circle of Friends',
    description:
      'Meet the national executive, branch coordinators, and the welfare-focused mission of Circle of Friends.',
  },
  '/events': {
    title: 'Events | Circle of Friends',
    description:
      'Track upcoming weddings, funeral support, charity drives, and community outreach activities.',
  },
  '/contact': {
    title: 'Contact | Circle of Friends',
    description:
      'Contact Circle of Friends for branch coordination, member support inquiries, events, and executive communication.',
  },
  '/portal': {
    title: 'Members Portal | Circle of Friends',
    description:
      'Secure member portal with profile management, contribution tracking, account updates, and announcements.',
  },
  '/dashboard': {
    title: 'Dashboard | Circle of Friends',
    description:
      'Role-based dashboard for reports, branch administration, member records, announcements, and PDF exports.',
  },
}

function MetadataUpdater() {
  const location = useLocation()

  useEffect(() => {
    const meta = routeMeta[location.pathname] ?? routeMeta['/']
    document.title = meta.title

    const description = document.querySelector('meta[name="description"]')
    const ogTitle = document.querySelector('meta[property="og:title"]')
    const ogDescription = document.querySelector('meta[property="og:description"]')
    const ogUrl = document.querySelector('meta[property="og:url"]')

    description?.setAttribute('content', meta.description)
    ogTitle?.setAttribute('content', meta.title)
    ogDescription?.setAttribute('content', meta.description)
    ogUrl?.setAttribute('content', window.location.href)
  }, [location.pathname])

  return null
}

function App() {
  return (
    <CofProvider>
      <BrowserRouter>
        <MetadataUpdater />
        <Suspense
          fallback={
            <div className="section-shell py-20">
              <div className="panel p-10 text-center text-cof-slate">Loading Circle of Friends...</div>
            </div>
          }
        >
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/portal" element={<PortalPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </CofProvider>
  )
}

export default App
