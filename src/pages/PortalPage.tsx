import {
  AtSign,
  BadgeCheck,
  Briefcase,
  CalendarDays,
  Camera,
  Heart,
  LayoutDashboard,
  Mail,
  MapPin,
  Phone,
  ShieldAlert,
  UserCog,
  WalletCards,
  X,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useCof } from '../context/CofContext'
import { formatDate, formatMoney, maritalStatusLabels, roleLabels } from '../data/config'
import { getMemberContributionObligations } from '../utils/contributionObligations'

export function PortalPage() {
  const {
    announcements,
    branches,
    contributions,
    currentUser,
    events,
    loading,
    login,
    registerMember,
    updateOwnProfile,
  } = useCof()
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login')
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState('')
  const [authMessage, setAuthMessage] = useState('')
  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  const [registerForm, setRegisterForm] = useState({
    name: '',
    username: '',
    password: '',
    branchId: branches[0]?.id ?? '',
    phone: '',
    email: '',
    dateOfBirth: '',
    placeOfBirth: '',
    maritalStatus: 'single',
    homeAddress: '',
    profession: '',
    photo: null as File | null,
  })
  const [profileForm, setProfileForm] = useState({
    phone: '',
    email: '',
    maritalStatus: 'single',
    homeAddress: '',
    profession: '',
  })
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMessage, setProfileMessage] = useState('')
  const [profileError, setProfileError] = useState('')
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const profilePhotoInputRef = useRef<HTMLInputElement | null>(null)
  const coverPhotoInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!registerForm.branchId && branches[0]?.id) {
      setRegisterForm((current) => ({ ...current, branchId: branches[0].id }))
    }
  }, [branches, registerForm.branchId])

  useEffect(() => {
    if (!currentUser) {
      return
    }

    setProfileForm({
      phone: currentUser.phone,
      email: currentUser.email,
      maritalStatus: currentUser.maritalStatus,
      homeAddress: currentUser.homeAddress,
      profession: currentUser.profession,
    })
  }, [currentUser])

  if (loading) {
    return (
      <div className="section-shell py-20">
        <div className="panel p-10 text-center text-cof-slate">Loading member portal...</div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="min-h-[78vh] bg-[#f0f2f5] pb-10 pt-10 sm:pt-14">
        <section className="section-shell grid min-h-[70vh] gap-10 lg:grid-cols-[1fr,420px] lg:items-center">
          <div className="max-w-2xl px-2">
            <img src="/reference-logo.png" alt="Circle of Friends" className="h-20 w-20 rounded-full bg-white object-cover shadow-lg" />
            <h1 className="mt-5 font-display text-4xl font-semibold tracking-tight text-cof-deep sm:text-6xl">
              Circle of Friends
            </h1>
            <p className="mt-4 text-xl leading-9 text-cof-slate sm:text-3xl sm:leading-[1.35]">
              Access your association profile, contribution records, and member account settings.
            </p>
          </div>

          <div className="mx-auto w-full max-w-[420px]">
            <div className="rounded-2xl bg-white p-4 shadow-[0_8px_30px_rgba(15,65,114,0.12)] sm:p-5">
              {authTab === 'login' ? (
                <form
                  className="grid gap-3"
                  onSubmit={async (event) => {
                    event.preventDefault()
                    setAuthLoading(true)
                    setAuthError('')
                    setAuthMessage('')
                    try {
                      await login(loginForm)
                    } catch (error) {
                      setAuthError(error instanceof Error ? error.message : 'Login failed.')
                    } finally {
                      setAuthLoading(false)
                    }
                  }}
                >
                  <input
                    className="field rounded-xl border-gray-300 text-base"
                    placeholder="Username"
                    value={loginForm.username}
                    onChange={(event) => setLoginForm((current) => ({ ...current, username: event.target.value }))}
                  />
                  <input
                    className="field rounded-xl border-gray-300 text-base"
                    type="password"
                    placeholder="Password"
                    value={loginForm.password}
                    onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
                  />
                  <button type="submit" className="rounded-xl bg-[#1877f2] px-5 py-3 text-lg font-semibold text-white transition hover:bg-[#166fe5]" disabled={authLoading}>
                    {authLoading ? 'Signing in...' : 'Log In'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthTab('register')
                      setAuthError('')
                      setAuthMessage('')
                    }}
                    className="mt-2 rounded-xl bg-[#42b72a] px-5 py-3 text-base font-semibold text-white transition hover:bg-[#36a420]"
                  >
                    Create new account
                  </button>
                </form>
              ) : (
                <form
                  className="grid gap-3"
                  onSubmit={async (event) => {
                    event.preventDefault()
                    setAuthLoading(true)
                    setAuthError('')
                    setAuthMessage('')
                    try {
                      const formData = new FormData()
                      formData.append('name', registerForm.name)
                      formData.append('username', registerForm.username)
                      formData.append('password', registerForm.password)
                      formData.append('branchId', registerForm.branchId)
                      formData.append('phone', registerForm.phone)
                      formData.append('email', registerForm.email)
                      formData.append('dateOfBirth', registerForm.dateOfBirth)
                      formData.append('placeOfBirth', registerForm.placeOfBirth)
                      formData.append('maritalStatus', registerForm.maritalStatus)
                      formData.append('homeAddress', registerForm.homeAddress)
                      formData.append('profession', registerForm.profession)
                      if (registerForm.photo) {
                        formData.append('photo', registerForm.photo)
                      }
                      const message = await registerMember(formData)
                      setRegisterForm({
                        name: '',
                        username: '',
                        password: '',
                        branchId: branches[0]?.id ?? '',
                        phone: '',
                        email: '',
                        dateOfBirth: '',
                        placeOfBirth: '',
                        maritalStatus: 'single',
                        homeAddress: '',
                        profession: '',
                        photo: null,
                      })
                      setAuthMessage(message)
                    } catch (error) {
                      setAuthError(error instanceof Error ? error.message : 'Registration failed.')
                    } finally {
                      setAuthLoading(false)
                    }
                  }}
                >
                  <p className="pb-1 text-center font-display text-2xl font-semibold text-cof-deep">
                    Sign Up
                  </p>
                  <input className="field rounded-xl border-gray-300" placeholder="Full names" value={registerForm.name} onChange={(event) => setRegisterForm((current) => ({ ...current, name: event.target.value }))} />
                  <input className="field rounded-xl border-gray-300" placeholder="Username" value={registerForm.username} onChange={(event) => setRegisterForm((current) => ({ ...current, username: event.target.value }))} />
                  <input className="field rounded-xl border-gray-300" type="password" placeholder="Password" value={registerForm.password} onChange={(event) => setRegisterForm((current) => ({ ...current, password: event.target.value }))} />
                  <select className="field rounded-xl border-gray-300" value={registerForm.branchId} onChange={(event) => setRegisterForm((current) => ({ ...current, branchId: event.target.value }))}>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                  <input className="field rounded-xl border-gray-300" type="date" value={registerForm.dateOfBirth} onChange={(event) => setRegisterForm((current) => ({ ...current, dateOfBirth: event.target.value }))} />
                  <input className="field rounded-xl border-gray-300" placeholder="Place of birth" value={registerForm.placeOfBirth} onChange={(event) => setRegisterForm((current) => ({ ...current, placeOfBirth: event.target.value }))} />
                  <input className="field rounded-xl border-gray-300" placeholder="Phone number" value={registerForm.phone} onChange={(event) => setRegisterForm((current) => ({ ...current, phone: event.target.value }))} />
                  <input className="field rounded-xl border-gray-300" type="email" placeholder="Email address" value={registerForm.email} onChange={(event) => setRegisterForm((current) => ({ ...current, email: event.target.value }))} />
                  <select className="field rounded-xl border-gray-300" value={registerForm.maritalStatus} onChange={(event) => setRegisterForm((current) => ({ ...current, maritalStatus: event.target.value }))}>
                    <option value="single">Single</option>
                    <option value="married">Married</option>
                    <option value="divorced">Divorced</option>
                    <option value="widowed">Widowed</option>
                  </select>
                  <input className="field rounded-xl border-gray-300" placeholder="Profession" value={registerForm.profession} onChange={(event) => setRegisterForm((current) => ({ ...current, profession: event.target.value }))} />
                  <textarea className="field min-h-24 resize-none rounded-xl border-gray-300" placeholder="Home address" value={registerForm.homeAddress} onChange={(event) => setRegisterForm((current) => ({ ...current, homeAddress: event.target.value }))} />
                  <label className="field flex cursor-pointer items-center gap-3 rounded-xl border-gray-300">
                    <Camera size={16} className="text-cof-blue" />
                    <span>{registerForm.photo ? registerForm.photo.name : 'Upload profile photo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) =>
                        setRegisterForm((current) => ({
                          ...current,
                          photo: event.target.files?.[0] ?? null,
                        }))
                      }
                    />
                  </label>
                  <button type="submit" className="rounded-xl bg-[#42b72a] px-5 py-3 text-base font-semibold text-white transition hover:bg-[#36a420]" disabled={authLoading}>
                    {authLoading ? 'Submitting...' : 'Sign Up'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthTab('login')
                      setAuthError('')
                      setAuthMessage('')
                    }}
                    className="text-sm font-semibold text-[#1877f2]"
                  >
                    Already have an account?
                  </button>
                </form>
              )}

              {authError ? (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {authError}
                </div>
              ) : null}
              {authMessage ? (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {authMessage}
                </div>
              ) : null}
            </div>

            <p className="mt-6 text-center text-sm text-cof-slate">
              Accounts are activated after approval by the super admin, admin, general coordinator, or secretary general.
            </p>
          </div>
        </section>
      </div>
    )
  }

  const branch = branches.find((item) => item.id === currentUser.branchId)
  const userContributions = contributions.filter((item) => item.memberId === currentUser.id)
  const obligations = getMemberContributionObligations(currentUser, events, contributions)
  const outstandingObligations = obligations.filter((item) => item.outstandingAmount > 0)
  const upcomingEvents = events.filter((event) => event.status !== 'past').slice(0, 3)
  const yearlyData = Array.from(
    userContributions.reduce((map, item) => {
      const year = new Date(item.date).getFullYear().toString()
      map.set(year, (map.get(year) || 0) + item.amount)
      return map
    }, new Map<string, number>()),
  )
    .map(([year, amount]) => ({ year, amount }))
    .sort((a, b) => Number(a.year) - Number(b.year))

  async function handleProfileSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!currentUser) {
      return
    }
    setProfileSaving(true)
    setProfileError('')
    setProfileMessage('')
    try {
      const formData = new FormData()
      formData.append('phone', profileForm.phone)
      formData.append('email', profileForm.email)
      formData.append('maritalStatus', profileForm.maritalStatus)
      formData.append('homeAddress', profileForm.homeAddress)
      formData.append('profession', profileForm.profession)
      await updateOwnProfile(currentUser.id, formData)
      setProfileMessage('Your account information has been updated.')
      setIsProfileModalOpen(false)
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Unable to update your profile.')
    } finally {
      setProfileSaving(false)
    }
  }

  async function handleMediaUpdate(kind: 'photo' | 'coverPhoto', file: File | null) {
    if (!currentUser || !file) {
      return
    }

    setProfileSaving(true)
    setProfileError('')
    setProfileMessage('')

    try {
      const formData = new FormData()
      formData.append(kind, file)
      await updateOwnProfile(currentUser.id, formData)
      setProfileMessage(kind === 'photo' ? 'Your profile photo has been updated.' : 'Your cover photo has been updated.')
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Unable to update your profile image.')
    } finally {
      setProfileSaving(false)
      if (profilePhotoInputRef.current) {
        profilePhotoInputRef.current.value = ''
      }
      if (coverPhotoInputRef.current) {
        coverPhotoInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="space-y-10 pb-10 pt-8">
      <section className="section-shell">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="overflow-hidden rounded-[34px] border border-white/60 bg-white shadow-[0_26px_90px_rgba(15,65,114,0.1)]"
        >
          <div
            className="relative h-56 overflow-hidden sm:h-72"
            style={{
              backgroundImage: `linear-gradient(120deg, rgba(15,65,114,0.5) 0%, rgba(22,95,166,0.34) 56%, rgba(79,148,221,0.24) 100%), url(${currentUser.coverPhoto})`,
              backgroundPosition: 'center',
              backgroundSize: 'cover',
            }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.16),transparent_32%)]" />
            <img src="/reference-logo.png" alt="Circle of Friends" className="absolute right-6 top-6 z-10 h-16 w-16 rounded-full border border-white/20 bg-white/90 object-cover shadow-lg" />
            <input
              ref={coverPhotoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => handleMediaUpdate('coverPhoto', event.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={() => coverPhotoInputRef.current?.click()}
              className="absolute bottom-5 right-5 z-10 inline-flex items-center gap-2 rounded-2xl border border-white/30 bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/25"
              disabled={profileSaving}
            >
              <Camera size={15} />
              {profileSaving ? 'Updating...' : 'Change cover'}
            </button>
          </div>
          <div className="relative px-5 pb-6 sm:px-8">
            <div className="flex flex-col gap-5 pt-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="relative -mt-16 shrink-0 sm:-mt-20">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="h-32 w-32 rounded-full border-4 border-white bg-white object-cover shadow-[0_18px_34px_rgba(15,65,114,0.2)]"
                  />
                  <input
                    ref={profilePhotoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => handleMediaUpdate('photo', event.target.files?.[0] ?? null)}
                  />
                  <button
                    type="button"
                    onClick={() => profilePhotoInputRef.current?.click()}
                    className="absolute bottom-2 right-2 inline-flex h-11 w-11 items-center justify-center rounded-full border-2 border-white bg-cof-blue text-white shadow-lg transition hover:scale-105 hover:bg-cof-deep"
                    aria-label="Change profile photo"
                    disabled={profileSaving}
                  >
                    <Camera size={16} />
                  </button>
                </div>
                <div className="rounded-[28px] border border-cof-blue/8 bg-white/96 px-5 py-4 shadow-[0_18px_40px_rgba(15,65,114,0.08)] backdrop-blur-sm sm:px-6">
                  <h1 className="font-display text-3xl font-semibold tracking-tight text-cof-deep sm:text-4xl">
                    {currentUser.name}
                  </h1>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full bg-cof-pale px-3 py-1.5 text-xs font-semibold text-cof-deep sm:text-sm">
                      <BadgeCheck size={14} className="text-cof-blue" />
                      {roleLabels[currentUser.role]}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full bg-cof-pale px-3 py-1.5 text-xs font-semibold text-cof-deep sm:text-sm">
                      <WalletCards size={14} className="text-cof-blue" />
                      {currentUser.membershipCode}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full bg-cof-pale px-3 py-1.5 text-xs font-semibold text-cof-deep sm:text-sm">
                      <MapPin size={14} className="text-cof-blue" />
                      {branch?.name}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full border border-cof-blue/10 bg-white px-3 py-1.5 text-xs font-medium text-cof-slate sm:text-sm">
                      <AtSign size={14} className="text-cof-blue" />
                      {currentUser.username}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-cof-blue/10 bg-white px-3 py-1.5 text-xs font-medium text-cof-slate sm:text-sm">
                      <CalendarDays size={14} className="text-cof-blue" />
                      Joined {currentUser.joinedYear}
                    </span>
                  </div>
                </div>
              </div>

              {currentUser.role !== 'member' ? (
                <Link to="/dashboard" className="btn-primary">
                  <LayoutDashboard size={16} />
                  Open Dashboard
                </Link>
              ) : null}
            </div>
            {profileError ? (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {profileError}
              </div>
            ) : null}
            {profileMessage ? (
              <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {profileMessage}
              </div>
            ) : null}
          </div>
        </motion.div>
      </section>

      <section className="section-shell">
        <div className="grid gap-6 xl:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.05 }}
            whileHover={{ y: -6 }}
            className="panel relative overflow-hidden p-6"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[linear-gradient(135deg,rgba(22,95,166,0.12),rgba(79,148,221,0.04))]" />
            <p className="font-display text-xl font-semibold text-cof-deep">Member profile</p>
            <div className="relative mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[24px] border border-cof-blue/8 bg-[linear-gradient(180deg,#f7fbff_0%,#edf5ff_100%)] p-4 shadow-[0_12px_28px_rgba(15,65,114,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_34px_rgba(15,65,114,0.1)]">
                <p className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-cof-slate"><WalletCards size={14} className="text-cof-blue" /> Membership ID</p>
                <p className="mt-2 font-semibold text-cof-deep">{currentUser.membershipCode}</p>
              </div>
              <div className="rounded-[24px] border border-cof-blue/8 bg-[linear-gradient(180deg,#f7fbff_0%,#edf5ff_100%)] p-4 shadow-[0_12px_28px_rgba(15,65,114,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_34px_rgba(15,65,114,0.1)]">
                <p className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-cof-slate"><CalendarDays size={14} className="text-cof-blue" /> Date of birth</p>
                <p className="mt-2 font-semibold text-cof-deep">{formatDate(currentUser.dateOfBirth)}</p>
              </div>
              <div className="rounded-[24px] border border-cof-blue/8 bg-[linear-gradient(180deg,#f7fbff_0%,#edf5ff_100%)] p-4 shadow-[0_12px_28px_rgba(15,65,114,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_34px_rgba(15,65,114,0.1)]">
                <p className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-cof-slate"><MapPin size={14} className="text-cof-blue" /> Place of birth</p>
                <p className="mt-2 font-semibold text-cof-deep">{currentUser.placeOfBirth}</p>
              </div>
              <div className="rounded-[24px] border border-cof-blue/8 bg-[linear-gradient(180deg,#f7fbff_0%,#edf5ff_100%)] p-4 shadow-[0_12px_28px_rgba(15,65,114,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_34px_rgba(15,65,114,0.1)]">
                <p className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-cof-slate"><Heart size={14} className="text-cof-blue" /> Marital status</p>
                <p className="mt-2 font-semibold text-cof-deep">{maritalStatusLabels[currentUser.maritalStatus]}</p>
              </div>
              <div className="rounded-[24px] border border-cof-blue/8 bg-[linear-gradient(180deg,#f7fbff_0%,#edf5ff_100%)] p-4 shadow-[0_12px_28px_rgba(15,65,114,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_34px_rgba(15,65,114,0.1)]">
                <p className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-cof-slate"><Briefcase size={14} className="text-cof-blue" /> Profession</p>
                <p className="mt-2 font-semibold text-cof-deep">{currentUser.profession}</p>
              </div>
              <div className="rounded-[24px] border border-cof-blue/8 bg-[linear-gradient(180deg,#f7fbff_0%,#edf5ff_100%)] p-4 shadow-[0_12px_28px_rgba(15,65,114,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_34px_rgba(15,65,114,0.1)] sm:col-span-2">
                <p className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-cof-slate"><MapPin size={14} className="text-cof-blue" /> Home address</p>
                <p className="mt-2 font-semibold text-cof-deep">{currentUser.homeAddress}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            whileHover={{ y: -6 }}
            className="panel relative overflow-hidden p-6"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[linear-gradient(135deg,rgba(15,65,114,0.1),rgba(79,148,221,0.03))]" />
            <div className="relative flex items-center justify-between gap-4">
              <p className="font-display text-xl font-semibold text-cof-deep">Contact</p>
              <button
                type="button"
                onClick={() => {
                  setProfileError('')
                  setProfileMessage('')
                  setIsProfileModalOpen(true)
                }}
                className="btn-secondary px-4 py-2 text-xs"
              >
                <UserCog size={14} />
                Edit contact
              </button>
            </div>
            <div className="relative mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[24px] border border-cof-blue/8 bg-[linear-gradient(180deg,#f7fbff_0%,#edf5ff_100%)] p-4 text-sm text-cof-slate shadow-[0_12px_28px_rgba(15,65,114,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_34px_rgba(15,65,114,0.1)]">
                <p className="flex items-center gap-2 font-semibold text-cof-deep"><Phone size={15} className="text-cof-blue" /> Phone</p>
                <p className="mt-2">{currentUser.phone}</p>
              </div>
              <div className="rounded-[24px] border border-cof-blue/8 bg-[linear-gradient(180deg,#f7fbff_0%,#edf5ff_100%)] p-4 text-sm text-cof-slate shadow-[0_12px_28px_rgba(15,65,114,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_34px_rgba(15,65,114,0.1)]">
                <p className="flex items-center gap-2 font-semibold text-cof-deep"><Mail size={15} className="text-cof-blue" /> Email</p>
                <p className="mt-2 break-all">{currentUser.email}</p>
              </div>
              <div className="rounded-[24px] border border-cof-blue/8 bg-[linear-gradient(180deg,#f7fbff_0%,#edf5ff_100%)] p-4 text-sm text-cof-slate shadow-[0_12px_28px_rgba(15,65,114,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_34px_rgba(15,65,114,0.1)] sm:col-span-2">
                <p className="flex items-center gap-2 font-semibold text-cof-deep"><MapPin size={15} className="text-cof-blue" /> Branch</p>
                <p className="mt-2">{branch?.name}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="section-shell">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.15 }}
          className="panel p-6"
        >
          <div className="flex items-center gap-3">
            <ShieldAlert size={18} className="text-cof-blue" />
            <p className="font-display text-xl font-semibold text-cof-deep">At a glance</p>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <motion.div whileHover={{ y: -6 }} className="rounded-[24px] border border-cof-blue/8 bg-[linear-gradient(180deg,#f7fbff_0%,#edf5ff_100%)] p-5 shadow-[0_12px_28px_rgba(15,65,114,0.06)]">
              <p className="text-xs uppercase tracking-[0.18em] text-cof-slate">Outstanding events</p>
              <p className="mt-3 text-3xl font-semibold text-cof-deep">{outstandingObligations.length}</p>
            </motion.div>
            <motion.div whileHover={{ y: -6 }} className="rounded-[24px] border border-cof-blue/8 bg-[linear-gradient(180deg,#f7fbff_0%,#edf5ff_100%)] p-5 shadow-[0_12px_28px_rgba(15,65,114,0.06)]">
              <p className="text-xs uppercase tracking-[0.18em] text-cof-slate">Total paid</p>
              <p className="mt-3 text-3xl font-semibold text-cof-deep">
                {formatMoney(obligations.reduce((sum, item) => sum + item.paidAmount, 0))}
              </p>
            </motion.div>
            <motion.div whileHover={{ y: -6 }} className="rounded-[24px] border border-cof-blue/8 bg-[linear-gradient(180deg,#f7fbff_0%,#edf5ff_100%)] p-5 shadow-[0_12px_28px_rgba(15,65,114,0.06)]">
              <p className="text-xs uppercase tracking-[0.18em] text-cof-slate">Outstanding balance</p>
              <p className="mt-3 text-3xl font-semibold text-cof-deep">
                {formatMoney(obligations.reduce((sum, item) => sum + item.outstandingAmount, 0))}
              </p>
            </motion.div>
          </div>
        </motion.div>
      </section>

      <section className="section-shell">
        <div className="grid gap-6">
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.2 }}
            className="panel p-6"
          >
            <p className="font-display text-xl font-semibold text-cof-deep">Fields managed by leadership</p>
            <div className="mt-5 grid gap-4">
              <div className="rounded-2xl bg-cof-pale p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-cof-slate">Full names</p>
                <p className="mt-2 font-semibold text-cof-deep">{currentUser.name}</p>
              </div>
              <div className="rounded-2xl bg-cof-pale p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-cof-slate">Username</p>
                <p className="mt-2 font-semibold text-cof-deep">@{currentUser.username}</p>
              </div>
              <div className="rounded-2xl bg-cof-pale p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-cof-slate">Branch</p>
                <p className="mt-2 font-semibold text-cof-deep">{branch?.name}</p>
              </div>
              <div className="rounded-2xl bg-cof-pale p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-cof-slate">Role</p>
                <p className="mt-2 font-semibold text-cof-deep">{roleLabels[currentUser.role]}</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-cof-slate">
              For changes to your names, branch, date of birth, place of birth, or role, contact the super admin, admin, general coordinator, or branch coordinator.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="section-shell">
        <div className="grid gap-6 xl:grid-cols-[1fr,1fr]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.3 }}
            className="panel p-6"
          >
            <div className="flex items-center gap-3">
              <WalletCards size={18} className="text-cof-blue" />
              <div>
                <p className="font-display text-xl font-semibold text-cof-deep">My yearly contributions</p>
                <p className="text-sm text-cof-slate">Track your payments over time.</p>
              </div>
            </div>
            <div className="mt-6 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yearlyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatMoney(Number(value ?? 0))} />
                  <Bar dataKey="amount" fill="#165fa6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.35 }}
            className="panel p-6"
          >
            <div className="flex items-center gap-3">
              <CalendarDays size={18} className="text-cof-blue" />
              <p className="font-display text-xl font-semibold text-cof-deep">Announcements and next events</p>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {announcements.slice(0, 3).map((announcement) => (
                <div key={announcement.id} className="rounded-2xl bg-cof-pale p-4">
                  <p className="font-semibold text-cof-deep">{announcement.title}</p>
                  <p className="mt-2 text-sm leading-7 text-cof-slate">{announcement.message}</p>
                </div>
              ))}
              {upcomingEvents.map((event) => (
                <div key={event.id} className="rounded-2xl bg-white p-4 ring-1 ring-cof-blue/10">
                  <p className="text-xs uppercase tracking-[0.18em] text-cof-blue">Upcoming Event</p>
                  <p className="mt-2 font-semibold text-cof-deep">{event.title}</p>
                  <p className="mt-2 text-sm text-cof-slate">{formatDate(event.date)}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="section-shell panel p-6">
        <p className="font-display text-xl font-semibold text-cof-deep">Contribution obligations</p>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.4 }}
          className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          {obligations.map((item, index) => (
            <motion.article
              key={item.eventId}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.42 + index * 0.04 }}
              className="rounded-[24px] border border-cof-blue/10 bg-white p-5 shadow-[0_14px_36px_rgba(15,65,114,0.06)] transition hover:-translate-y-1 hover:shadow-[0_20px_44px_rgba(15,65,114,0.1)]"
            >
              <p className="font-display text-lg font-semibold text-cof-deep">{item.eventTitle}</p>
              <p className="mt-2 text-sm text-cof-slate">{formatDate(item.eventDate)}</p>
              <div className="mt-4 grid gap-3">
                <div className="rounded-2xl bg-cof-pale p-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-cof-slate">Expected</p>
                  <p className="mt-2 font-semibold text-cof-deep">{formatMoney(item.expectedAmount)}</p>
                </div>
                <div className="rounded-2xl bg-cof-pale p-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-cof-slate">Paid</p>
                  <p className="mt-2 font-semibold text-cof-deep">{formatMoney(item.paidAmount)}</p>
                </div>
                <div className="rounded-2xl bg-cof-pale p-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-cof-slate">Balance</p>
                  <p className="mt-2 font-semibold text-cof-deep">{formatMoney(item.outstandingAmount)}</p>
                </div>
              </div>
            </motion.article>
          ))}
          {!obligations.length ? (
            <div className="rounded-[24px] bg-cof-pale p-5 text-sm text-cof-slate">
              No contribution obligations found yet.
            </div>
          ) : null}
        </motion.div>
      </section>

      {isProfileModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.25 }}
            className="w-full max-w-3xl overflow-hidden rounded-[30px] border border-white/70 bg-white shadow-[0_30px_100px_rgba(15,65,114,0.22)]"
          >
            <div className="flex items-start justify-between gap-4 border-b border-cof-blue/8 bg-[linear-gradient(135deg,rgba(22,95,166,0.12),rgba(79,148,221,0.04))] px-6 py-5">
              <div className="flex items-start gap-3">
                <UserCog size={18} className="mt-1 text-cof-blue" />
                <div>
                  <p className="font-display text-2xl font-semibold text-cof-deep">Update my account</p>
                  <p className="mt-1 text-sm text-cof-slate">
                    You can change your phone number, email, marital status, home address, and profession here.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-cof-blue/10 bg-white text-cof-deep transition hover:bg-cof-pale"
                aria-label="Close profile update modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6">
              <form className="grid gap-4" onSubmit={handleProfileSubmit}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <input className="field" placeholder="Phone number" value={profileForm.phone} onChange={(event) => setProfileForm((current) => ({ ...current, phone: event.target.value }))} />
                  <input className="field" type="email" placeholder="Email address" value={profileForm.email} onChange={(event) => setProfileForm((current) => ({ ...current, email: event.target.value }))} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <select className="field" value={profileForm.maritalStatus} onChange={(event) => setProfileForm((current) => ({ ...current, maritalStatus: event.target.value }))}>
                    <option value="single">Single</option>
                    <option value="married">Married</option>
                    <option value="divorced">Divorced</option>
                    <option value="widowed">Widowed</option>
                  </select>
                  <input className="field" placeholder="Profession" value={profileForm.profession} onChange={(event) => setProfileForm((current) => ({ ...current, profession: event.target.value }))} />
                </div>
                <textarea className="field min-h-28 resize-none" placeholder="Home address" value={profileForm.homeAddress} onChange={(event) => setProfileForm((current) => ({ ...current, homeAddress: event.target.value }))} />
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button type="button" onClick={() => setIsProfileModalOpen(false)} className="btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={profileSaving}>
                    {profileSaving ? 'Saving...' : 'Save changes'}
                  </button>
                </div>
              </form>
              {profileError ? (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {profileError}
                </div>
              ) : null}
            </div>
          </motion.div>
        </div>
      ) : null}
    </div>
  )
}
