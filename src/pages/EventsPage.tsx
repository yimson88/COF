import { motion } from 'framer-motion'
import {
  CalendarRange,
  ChevronDown,
  HeartPulse,
  Images,
  MapPin,
  Search,
  Sparkles,
  UserRound,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useCof } from '../context/CofContext'
import { formatDate } from '../data/config'
import type { AssociationEvent, Branch, EventImage, MemberProfile } from '../types/cof'

const revealLeft = {
  hidden: { opacity: 0, x: -36, filter: 'blur(10px)' },
  show: { opacity: 1, x: 0, filter: 'blur(0px)', transition: { duration: 0.7 } },
}

const revealRight = {
  hidden: { opacity: 0, x: 36, filter: 'blur(10px)' },
  show: { opacity: 1, x: 0, filter: 'blur(0px)', transition: { duration: 0.7 } },
}

const zoomReveal = {
  hidden: { opacity: 0, scale: 0.94, filter: 'blur(8px)' },
  show: { opacity: 1, scale: 1, filter: 'blur(0px)', transition: { duration: 0.7 } },
}

const stagger = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12,
    },
  },
}

const lineReveal = {
  hidden: { scaleX: 0, opacity: 0 },
  show: { scaleX: 1, opacity: 1, transition: { duration: 0.8 } },
}

type LiveStatusFilter = 'all' | 'current' | 'upcoming'

interface EventPresentation {
  hostName: string
  branchId: string
  branchLabel?: string
  hostImage?: string
  gallery: string[]
}

const eventPresentationMap: Record<string, Omit<EventPresentation, 'gallery'>> = {
  'event-1': {
    hostName: 'Judith & Emmanuel',
    branchId: 'douala',
    hostImage: '/home/celebrating-together.jpg',
  },
  'event-2': {
    hostName: 'Late Mr. Nfor Family',
    branchId: 'bamenda',
    hostImage: '/home/standing-together.jpg',
  },
  'event-3': {
    hostName: 'Family of a Kumbo Member',
    branchId: 'kumbo',
    hostImage: '/home/unity-in-support.jpg',
  },
  'event-4': {
    hostName: 'School Outreach Beneficiaries',
    branchId: 'ndop',
    hostImage: '/home/community.png',
  },
  'event-5': {
    hostName: 'Bafoussam Community Team',
    branchId: 'bafoussam',
    hostImage: '/home/e74dc5c7-8405-4e42-9f20-80aa073608b5.jpg',
  },
  'event-6': {
    hostName: 'National Medical Caravan Team',
    branchId: 'yaounde',
    hostImage: '/home/FB_IMG_1749649752439.jpg',
  },
  'event-7': {
    hostName: 'Mr. & Mrs. Ndzi',
    branchId: 'yaounde',
    hostImage: '/home/celebrating-together.jpg',
  },
}

function normalizeText(value: string) {
  return value.trim().toLowerCase()
}

function getEventPresentation(
  event: AssociationEvent,
  branches: Branch[],
  members: MemberProfile[],
  eventImages: EventImage[],
): EventPresentation {
  const mapped = eventPresentationMap[event.id]
  const matchingMember =
    members.find((member) => normalizeText(event.title).includes(normalizeText(member.name))) ?? null
  const branchId = mapped?.branchId ?? matchingMember?.branchId ?? (event.branchScope === 'national' ? 'national' : event.branchScope)
  const branch = branches.find((item) => item.id === branchId)
  const gallery = eventImages
    .filter((image) => image.eventId === event.id)
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((image) => image.imageUrl)
  const fallbackImage = mapped?.hostImage ?? matchingMember?.avatar ?? event.hero

  return {
    hostName: mapped?.hostName ?? matchingMember?.name ?? 'Circle of Friends Member',
    branchId,
    branchLabel: branch?.name ?? (branchId === 'national' ? 'National' : branchId),
    hostImage: fallbackImage,
    gallery: gallery.length ? gallery : [fallbackImage],
  }
}

function buildPastEventSearchText(event: AssociationEvent, presentation: EventPresentation) {
  return `${event.title} ${presentation.hostName} ${presentation.branchLabel ?? ''} ${event.venue}`.toLowerCase()
}

function EventPhotoStack({
  images,
  onClick,
}: {
  images: string[]
  onClick: () => void
}) {
  const visible = images.slice(0, 4)

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex h-[15.5rem] w-full items-center justify-center overflow-hidden rounded-[30px] bg-[linear-gradient(135deg,rgba(15,65,114,0.12),rgba(79,148,221,0.08))] px-4 py-6"
      aria-label="Open event gallery"
    >
      {visible.map((image, index) => {
        const transforms = [
          'rotate-[-12deg] -translate-x-10 -translate-y-2',
          'rotate-[-5deg] -translate-x-3 translate-y-4',
          'rotate-[6deg] translate-x-5 -translate-y-3',
          'rotate-[12deg] translate-x-10 translate-y-3',
        ]

        return (
          <motion.div
            key={`${image}-${index}`}
            initial={{ opacity: 0, y: 16, rotate: 0 }}
            whileInView={{ opacity: 1, y: 0, rotate: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.45, delay: index * 0.06 }}
            className={`absolute top-1/2 h-[10.5rem] w-[8.2rem] -translate-y-1/2 overflow-hidden rounded-[10px] border-[10px] border-white bg-white shadow-[0_18px_40px_rgba(15,65,114,0.18)] transition duration-500 group-hover:scale-[1.03] ${transforms[index] ?? ''}`}
          >
            <img src={image} alt="" className="h-full w-full object-cover" />
          </motion.div>
        )
      })}

      <div className="absolute inset-x-4 bottom-4 flex items-center justify-between rounded-full border border-white/70 bg-white/90 px-4 py-3 text-sm font-semibold text-cof-deep shadow-[0_14px_30px_rgba(15,65,114,0.12)] backdrop-blur">
        <span className="inline-flex items-center gap-2">
          <Images size={16} />
          Open gallery
        </span>
        <span>{images.length} photos</span>
      </div>
    </button>
  )
}

export function EventsPage() {
  const { branches, events, eventImages, members } = useCof()

  const [liveStatusFilter, setLiveStatusFilter] = useState<LiveStatusFilter>('all')
  const [liveBranchFilter, setLiveBranchFilter] = useState('all')
  const [liveSearch, setLiveSearch] = useState('')
  const [pastBranchFilter, setPastBranchFilter] = useState('all')
  const [pastSearch, setPastSearch] = useState('')
  const [galleryEventId, setGalleryEventId] = useState<string | null>(null)

  const liveBaseEvents = useMemo(
    () => events.filter((event) => event.status === 'ongoing' || event.status === 'upcoming'),
    [events],
  )

  const liveStatusScopedEvents = useMemo(() => {
    const scoped =
      liveStatusFilter === 'all'
        ? liveBaseEvents
        : liveBaseEvents.filter((event) =>
            liveStatusFilter === 'current' ? event.status === 'ongoing' : event.status === 'upcoming',
          )

    return [...scoped].sort((left, right) => {
      const leftOrder = left.status === 'ongoing' ? 0 : 1
      const rightOrder = right.status === 'ongoing' ? 0 : 1
      const statusDelta = leftOrder - rightOrder
      if (statusDelta !== 0) {
        return statusDelta
      }
      return new Date(left.date).getTime() - new Date(right.date).getTime()
    })
  }, [liveBaseEvents, liveStatusFilter])

  const liveBranchOptions = useMemo(() => {
    const entries: [string, string][] = []

    liveStatusScopedEvents.forEach((event) => {
      const presentation = getEventPresentation(event, branches, members, eventImages)
      const branchId =
        presentation.branchId !== 'national'
          ? presentation.branchId
          : event.branchScope !== 'national'
            ? event.branchScope
            : ''

      if (!branchId) {
        return
      }

      const branch = branches.find((item) => item.id === branchId)
      entries.push([branchId, branch?.name ?? presentation.branchLabel ?? branchId])
    })

    return Array.from(new Map(entries)).sort((left, right) => left[1].localeCompare(right[1]))
  }, [branches, eventImages, liveStatusScopedEvents, members])

  const pastBaseEvents = useMemo(
    () =>
      [...events]
        .filter((event) => event.status === 'past')
        .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime()),
    [events],
  )

  const pastBranchOptions = useMemo(() => {
    const entries: [string, string][] = []

    pastBaseEvents.forEach((event) => {
      const presentation = getEventPresentation(event, branches, members, eventImages)
      const branchId =
        presentation.branchId !== 'national'
          ? presentation.branchId
          : event.branchScope !== 'national'
            ? event.branchScope
            : ''

      if (!branchId) {
        return
      }

      const branch = branches.find((item) => item.id === branchId)
      entries.push([branchId, branch?.name ?? presentation.branchLabel ?? branchId])
    })

    return Array.from(new Map(entries)).sort((left, right) => left[1].localeCompare(right[1]))
  }, [branches, eventImages, members, pastBaseEvents])

  useEffect(() => {
    if (liveBranchFilter !== 'all' && !liveBranchOptions.some(([branchId]) => branchId === liveBranchFilter)) {
      setLiveBranchFilter('all')
    }
  }, [liveBranchFilter, liveBranchOptions])

  useEffect(() => {
    if (pastBranchFilter !== 'all' && !pastBranchOptions.some(([branchId]) => branchId === pastBranchFilter)) {
      setPastBranchFilter('all')
    }
  }, [pastBranchFilter, pastBranchOptions])

  const liveEvents = useMemo(() => {
    return liveStatusScopedEvents.filter((event) => {
      const presentation = getEventPresentation(event, branches, members, eventImages)
      const branchMatches =
        liveBranchFilter === 'all' ||
        presentation.branchId === liveBranchFilter ||
        event.branchScope === liveBranchFilter

      const searchValue = normalizeText(liveSearch)
      const searchMatches =
        !searchValue ||
        normalizeText(event.title).includes(searchValue) ||
        normalizeText(presentation.hostName).includes(searchValue)

      return branchMatches && searchMatches
    })
  }, [branches, eventImages, liveBranchFilter, liveSearch, liveStatusScopedEvents, members])

  const pastEvents = useMemo(() => {
    return pastBaseEvents.filter((event) => {
        const presentation = getEventPresentation(event, branches, members, eventImages)
        const branchMatches =
          pastBranchFilter === 'all' ||
          presentation.branchId === pastBranchFilter ||
          event.branchScope === pastBranchFilter

        const searchValue = normalizeText(pastSearch)
        const searchMatches = !searchValue || buildPastEventSearchText(event, presentation).includes(searchValue)

        return branchMatches && searchMatches
      })
  }, [branches, eventImages, members, pastBaseEvents, pastBranchFilter, pastSearch])

  const galleryEvent = galleryEventId ? events.find((event) => event.id === galleryEventId) ?? null : null
  const galleryPresentation =
    galleryEvent ? getEventPresentation(galleryEvent, branches, members, eventImages) : null

  return (
    <div className="relative overflow-hidden space-y-18 pb-12">
      <div className="home-orb home-orb-two" />
      <div className="home-orb home-orb-three" />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/home/celebrating-together.jpg"
            alt="Circle of Friends events"
            className="h-[26rem] w-full object-cover md:h-[30rem]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,22,39,0.82),rgba(7,22,39,0.46),rgba(7,22,39,0.84))]" />
        </div>

        <div className="section-shell relative z-10 flex h-[26rem] items-center md:h-[30rem]">
          <div className="max-w-3xl text-white">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/18 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.26em] text-white/88 backdrop-blur">
              <CalendarRange size={14} />
              Event Calendar
            </span>
            <h1 className="mt-6 font-display text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Events arranged around people, branches, and support moments.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/80 sm:text-lg">
              Follow current events, upcoming support drives, and past event memories through a more
              visual and member-focused event experience.
            </p>
          </div>
        </div>
      </section>

      <section className="overflow-hidden border-y border-cof-deep/10 bg-white/75 py-5 backdrop-blur">
        <div className="home-ticker">
          <motion.div
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: 24, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
            className="home-ticker-track"
          >
            {[
              'Current Events',
              'Upcoming Support Drives',
              'Past Event Memories',
              'Branch Filters',
              'Member Search',
              'Responsive Galleries',
              'Current Events',
              'Upcoming Support Drives',
              'Past Event Memories',
              'Branch Filters',
              'Member Search',
              'Responsive Galleries',
            ].map((item, index) => (
              <span key={`${item}-${index}`} className="home-ticker-item">
                <Sparkles size={14} />
                {item}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="section-shell py-10">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={stagger}
          className="space-y-8"
        >
          <motion.div variants={revealLeft}>
            <motion.div variants={lineReveal} className="mb-6 h-px w-28 origin-left bg-cof-blue/45" />
            <span className="eyebrow">
              <HeartPulse size={14} />
              Current & Upcoming
            </span>
            <h2 className="mt-4 font-display text-3xl font-semibold leading-tight text-cof-deep sm:text-4xl lg:text-5xl">
              Filter live events by status, branch, and names.
            </h2>
          </motion.div>

          <motion.div variants={zoomReveal} className="panel p-5 sm:p-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:gap-4">
              <label className="space-y-2 text-sm font-semibold text-cof-slate xl:min-w-0 xl:flex-[0.72]">
                <span>Status</span>
                <div className="relative">
                  <select
                    value={liveStatusFilter}
                    onChange={(event) => {
                      setLiveStatusFilter(event.target.value as LiveStatusFilter)
                      setLiveBranchFilter('all')
                      setLiveSearch('')
                    }}
                    className="field appearance-none pr-12"
                  >
                    <option value="all">All live events</option>
                    <option value="current">Current events</option>
                    <option value="upcoming">Upcoming events</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-cof-slate" size={18} />
                </div>
              </label>

              <label className="space-y-2 text-sm font-semibold text-cof-slate xl:min-w-0 xl:flex-[0.82]">
                <span>Branch</span>
                <div className="relative">
                  <select
                    value={liveBranchFilter}
                    onChange={(event) => setLiveBranchFilter(event.target.value)}
                    className="field appearance-none pr-12"
                  >
                    <option value="all">All branches</option>
                    {liveBranchOptions.map(([branchId, branchName]) => (
                      <option key={branchId} value={branchId}>
                        {branchName}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-cof-slate" size={18} />
                </div>
              </label>

              <label className="space-y-2 text-sm font-semibold text-cof-slate xl:min-w-0 xl:flex-[1.3]">
                <span>Event name or member name</span>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-cof-slate" size={18} />
                  <input
                    value={liveSearch}
                    onChange={(event) => setLiveSearch(event.target.value)}
                    placeholder="Search current or upcoming events"
                    className="field pl-12"
                  />
                </div>
              </label>

              <button
                type="button"
                onClick={() => {
                  setLiveStatusFilter('all')
                  setLiveBranchFilter('all')
                  setLiveSearch('')
                }}
                className="btn-secondary xl:mb-[1px] xl:shrink-0"
              >
                Reset live filters
              </button>
            </div>
            <p className="mt-3 text-sm text-cof-slate">
              Refine by status, then branch, then search. Changing status will reset invalid branch selections.
            </p>
          </motion.div>

          <div className="grid gap-5 xl:grid-cols-3">
            {liveEvents.map((event) => {
              const presentation = getEventPresentation(event, branches, members, eventImages)
              const eventBranch = branches.find((item) => item.id === presentation.branchId)

              return (
                <article
                  key={event.id}
                  className="overflow-hidden rounded-[28px] border border-cof-blue/10 bg-white shadow-[0_20px_60px_rgba(15,65,114,0.08)] transition duration-300 hover:-translate-y-2"
                >
                  <div className="flex h-full flex-col">
                    <div className="relative min-h-[15rem] overflow-hidden bg-cof-pale">
                      <img
                        src={presentation.hostImage ?? event.hero}
                        alt={presentation.hostName}
                        className="h-full w-full object-cover transition duration-700 hover:scale-[1.04]"
                      />
                      <div className="absolute left-4 top-4 inline-flex rounded-full bg-white/90 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-cof-blue shadow-lg">
                        {event.status === 'ongoing' ? 'Current event' : 'Upcoming event'}
                      </div>
                    </div>

                    <div className="space-y-4 p-5">
                      <div className="flex flex-wrap gap-2">
                        <span className="chip capitalize">{event.type.replace('-', ' ')}</span>
                        <span className="chip">{formatDate(event.date)}</span>
                        <span className="chip">{presentation.branchLabel}</span>
                      </div>

                      <h3 className="font-display text-xl font-semibold text-cof-deep">{event.title}</h3>
                      <p className="text-sm leading-7 text-cof-slate">{event.summary}</p>

                      <div className="grid gap-3">
                        <div className="rounded-[22px] bg-cof-mist/75 p-4">
                          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-cof-blue">
                            <UserRound size={14} />
                            Member Hosting
                          </p>
                          <p className="mt-3 font-semibold text-cof-deep">{presentation.hostName}</p>
                        </div>
                        <div className="rounded-[22px] bg-cof-mist/75 p-4">
                          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-cof-blue">
                            <MapPin size={14} />
                            Venue
                          </p>
                          <p className="mt-3 font-semibold text-cof-deep">{event.venue}</p>
                        </div>
                      </div>

                      <div className="rounded-[22px] border border-cof-blue/10 p-4 text-sm leading-7 text-cof-slate">
                        <p>
                          <span className="font-semibold text-cof-deep">Host branch:</span>{' '}
                          {eventBranch?.name ?? presentation.branchLabel}
                        </p>
                        <p className="mt-2">
                          <span className="font-semibold text-cof-deep">Event date:</span>{' '}
                          {formatDate(event.date)}
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>

          {liveEvents.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-cof-blue/20 bg-white/85 px-6 py-10 text-center shadow-[0_18px_50px_rgba(15,65,114,0.05)]">
              <p className="font-display text-2xl font-semibold text-cof-deep">No live events match this filter.</p>
              <p className="mt-3 text-sm leading-7 text-cof-slate">
                Clear the current live filters and try another status, branch, or member name.
              </p>
              <div className="mt-5 flex justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setLiveStatusFilter('all')
                    setLiveBranchFilter('all')
                    setLiveSearch('')
                  }}
                  className="btn-secondary"
                >
                  Reset live filters
                </button>
              </div>
            </div>
          ) : null}
        </motion.div>
      </section>

      <section className="section-shell py-8">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={stagger}
          className="overflow-hidden rounded-[38px] bg-cof-deep px-6 py-10 text-white sm:px-10"
        >
          <motion.div variants={lineReveal} className="mb-6 h-px w-full origin-left bg-white/18" />
          <div className="grid gap-8 lg:grid-cols-[0.9fr,1.1fr] lg:items-center">
            <motion.div variants={revealLeft}>
              <p className="text-xs font-bold uppercase tracking-[0.26em] text-white/68">Past Events</p>
              <h2 className="mt-4 font-display text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
                Past events become
                <br />
                stories, galleries,
                <br />
                and memories.
              </h2>
            </motion.div>
            <motion.div variants={revealRight} className="grid gap-4 sm:grid-cols-3">
              {[
                'Filter past events by branch before browsing.',
                'Search by event name or member name quickly.',
                'Open a full mobile-friendly gallery from each photo stack.',
              ].map((item) => (
                <motion.div
                  key={item}
                  whileHover={{ y: -8 }}
                  className="rounded-[24px] border border-white/10 bg-white/6 p-5 text-sm leading-7 text-white/82 backdrop-blur"
                >
                  {item}
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </section>

      <section className="section-shell py-4">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={stagger}
          className="space-y-8"
        >
          <motion.div variants={revealLeft}>
            <span className="eyebrow">
              <Images size={14} />
              Past Events
            </span>
            <h2 className="mt-4 font-display text-3xl font-semibold leading-tight text-cof-deep sm:text-4xl lg:text-5xl">
              Browse past events through image stacks and event details.
            </h2>
          </motion.div>

          <motion.div variants={zoomReveal} className="panel p-5 sm:p-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:gap-4">
              <label className="space-y-2 text-sm font-semibold text-cof-slate xl:min-w-0 xl:flex-[0.9]">
                <span>Branch</span>
                <div className="relative">
                  <select
                    value={pastBranchFilter}
                    onChange={(event) => setPastBranchFilter(event.target.value)}
                    className="field appearance-none pr-12"
                  >
                    <option value="all">All branches</option>
                    {pastBranchOptions.map(([branchId, branchName]) => (
                      <option key={branchId} value={branchId}>
                        {branchName}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-cof-slate" size={18} />
                </div>
              </label>

              <label className="space-y-2 text-sm font-semibold text-cof-slate xl:min-w-0 xl:flex-[1.45]">
                <span>Event name or member name</span>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-cof-slate" size={18} />
                  <input
                    value={pastSearch}
                    onChange={(event) => setPastSearch(event.target.value)}
                    placeholder="Search past events or members"
                    className="field pl-12"
                  />
                </div>
              </label>

              <button
                type="button"
                onClick={() => {
                  setPastBranchFilter('all')
                  setPastSearch('')
                }}
                className="btn-secondary xl:mb-[1px] xl:shrink-0"
              >
                Reset past filters
              </button>
            </div>
            <p className="mt-3 text-sm text-cof-slate">
              Filter past events by branch and search terms, or reset to browse the full archive again.
            </p>
          </motion.div>

          <div className="grid gap-6 xl:grid-cols-3">
            {pastEvents.map((event) => {
              const presentation = getEventPresentation(event, branches, members, eventImages)
              const branch = branches.find((item) => item.id === presentation.branchId)

              return (
                <article
                  key={event.id}
                  className="flex flex-col gap-5 rounded-[30px] border border-cof-blue/10 bg-white p-5 shadow-[0_20px_60px_rgba(15,65,114,0.08)] transition duration-300 hover:-translate-y-2"
                >
                  <EventPhotoStack
                    images={presentation.gallery}
                    onClick={() => setGalleryEventId(event.id)}
                  />

                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <span className="chip">{formatDate(event.date)}</span>
                      <span className="chip capitalize">{event.type.replace('-', ' ')}</span>
                      <span className="chip">{presentation.branchLabel}</span>
                    </div>

                    <div>
                      <h3 className="font-display text-xl font-semibold text-cof-deep">{event.title}</h3>
                      <p className="mt-3 text-sm leading-7 text-cof-slate">{event.summary}</p>
                    </div>

                    <div className="grid gap-3">
                      <div className="rounded-[22px] bg-cof-mist/75 p-4">
                        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-cof-blue">
                          <UserRound size={14} />
                          Member Hosting
                        </p>
                        <p className="mt-3 font-semibold text-cof-deep">{presentation.hostName}</p>
                      </div>
                      <div className="rounded-[22px] bg-cof-mist/75 p-4">
                        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-cof-blue">
                          <MapPin size={14} />
                          Venue
                        </p>
                        <p className="mt-3 font-semibold text-cof-deep">{event.venue}</p>
                      </div>
                    </div>

                    <div className="rounded-[22px] border border-cof-blue/10 p-4 text-sm leading-7 text-cof-slate">
                      <p>
                        <span className="font-semibold text-cof-deep">Member branch:</span>{' '}
                        {branch?.name ?? presentation.branchLabel}
                      </p>
                      <p className="mt-2">
                        <span className="font-semibold text-cof-deep">Event date:</span>{' '}
                        {formatDate(event.date)}
                      </p>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>

          {pastEvents.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-cof-blue/20 bg-white/85 px-6 py-10 text-center shadow-[0_18px_50px_rgba(15,65,114,0.05)]">
              <p className="font-display text-2xl font-semibold text-cof-deep">No past events match this filter.</p>
              <p className="mt-3 text-sm leading-7 text-cof-slate">
                Clear the branch or search filter to browse the full past event gallery again.
              </p>
              <div className="mt-5 flex justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setPastBranchFilter('all')
                    setPastSearch('')
                  }}
                  className="btn-secondary"
                >
                  Reset past filters
                </button>
              </div>
            </div>
          ) : null}
        </motion.div>
      </section>

      {galleryEvent && galleryPresentation ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[rgba(7,22,39,0.8)] p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="mx-auto max-w-6xl rounded-[34px] bg-white p-5 shadow-2xl sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-cof-blue">Event Gallery</p>
                <h3 className="mt-2 font-display text-2xl font-semibold text-cof-deep sm:text-3xl">
                  {galleryEvent.title}
                </h3>
                <p className="mt-2 text-sm leading-7 text-cof-slate">
                  {galleryPresentation.hostName} · {galleryPresentation.branchLabel}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setGalleryEventId(null)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-cof-blue/10 bg-cof-pale text-cof-deep"
                aria-label="Close gallery"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 grid auto-rows-[13rem] gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {galleryPresentation.gallery.map((image, index) => (
                <motion.div
                  key={`${image}-${index}`}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06, duration: 0.4 }}
                  className={`overflow-hidden rounded-[24px] ${
                    index % 5 === 0 ? 'sm:col-span-2 lg:col-span-2 lg:row-span-2 lg:auto-rows-[14rem]' : ''
                  }`}
                >
                  <img
                    src={image}
                    alt={`${galleryEvent.title} gallery ${index + 1}`}
                    className="h-full w-full object-cover transition duration-700 hover:scale-[1.04]"
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      ) : null}
    </div>
  )
}
