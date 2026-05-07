import { motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BadgeDollarSign,
  CalendarHeart,
  CheckCircle2,
  HeartHandshake,
  Megaphone,
  Sparkles,
  Users,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCof } from '../context/CofContext'
import { contributionPolicy, formatDate, formatMoney } from '../data/config'

const heroSlides = [
  {
    image: '/home/unity-in-support.jpg',
    caption: 'Unity in Support',
    text: 'Circle of Friends stands with members in weddings, funerals, family support, charity, and community outreach.',
  },
  {
    image: '/home/celebrating-together.jpg',
    caption: 'Celebrating Together',
    text: 'Our branches mobilize practical support so life-changing moments are shared with dignity, presence, and joy.',
  },
  {
    image: '/home/standing-together.jpg',
    caption: 'Standing Together in Tough Times',
    text: 'Obligatory contributions and branch solidarity make sure no member faces hardship alone.',
  },
]

const branchVisuals: Record<string, string> = {
  bamenda: '/home/bamenda.jpg',
  douala: '/home/douala.jpg',
  kumbo: '/home/kumbo.jpg',
  yaounde: '/home/yaounde.jpg',
}

const associationFoundedYear = 2011

const reveal = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
}

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

const lineReveal = {
  hidden: { scaleX: 0, opacity: 0 },
  show: { scaleX: 1, opacity: 1, transition: { duration: 0.8 } },
}

const stagger = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12,
    },
  },
}

function getBranchImage(branchId: string, fallback: string) {
  return branchVisuals[branchId] ?? fallback
}

export function HomePage() {
  const { announcements, branches, contributions, events, members } = useCof()
  const [activeSlide, setActiveSlide] = useState(0)

  const totalRaised = contributions.reduce((sum, item) => sum + item.amount, 0)
  const upcomingEvents = events.filter((event) => event.status !== 'past').slice(0, 3)
  const pastEvents = events.filter((event) => event.status === 'past').slice(0, 3)
  const latestNews = announcements.slice(0, 3)
  const featuredBranches = branches.slice(0, 4)

  const yearsActive = Math.max(1, new Date().getFullYear() - associationFoundedYear)

  const homepageServices = [
    {
      title: 'Wedding Support',
      meta: `Minimum ${formatMoney(10000)}`,
      text: 'We organize obligatory member contributions and branch presence for weddings with structure and dignity.',
    },
    {
      title: 'Funeral Solidarity',
      meta: `Minimum ${formatMoney(10000)}`,
      text: 'No member should carry loss alone. The association coordinates welfare response and attendance.',
    },
    {
      title: 'Immediate Family Support',
      meta: `Minimum ${formatMoney(5000)}`,
      text: 'Immediate family bereavement receives structured support through the same culture of accountability.',
    },
    {
      title: 'Charity and Outreach',
      meta: `From ${formatMoney(5000)}`,
      text: 'We extend support beyond ourselves through charity, outreach, and meaningful community action.',
    },
    {
      title: 'Branch Administration',
      meta: `${branches.length} active branches`,
      text: 'Branch coordinators and treasurers keep membership records, local leadership, and contribution flow organized.',
    },
    {
      title: 'National Coordination',
      meta: `${events.length} tracked events`,
      text: 'National leadership oversees reporting, announcements, elections, records, and policy consistency.',
    },
  ]

  const operationalPoints = [
    {
      title: 'Solving together',
      text: 'We treat every event as a shared responsibility across members, branches, and national executives.',
    },
    {
      title: 'Branch workflow',
      text: 'Each branch mobilizes its own members quickly while staying aligned with one common welfare standard.',
    },
    {
      title: 'Reliable and accountable',
      text: 'Support is matched with records, communication, and contribution tracking so follow-through is visible.',
    },
  ]

  const movingStatements = [
    'Friends for Life',
    'Dependable Welfare Culture',
    'Branch Solidarity',
    'Obligatory Contributions',
    'Community Outreach',
    'Accountable Support',
  ]

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroSlides.length)
    }, 5000)

    return () => window.clearInterval(interval)
  }, [])

  return (
    <div className="relative overflow-hidden pb-16">
      <div className="home-orb home-orb-one" />
      <div className="home-orb home-orb-two" />
      <div className="home-orb home-orb-three" />
      <section className="relative min-h-screen overflow-hidden">
        {heroSlides.map((slide, index) => (
          <motion.div
            key={slide.caption}
            animate={{
              opacity: index === activeSlide ? 1 : 0,
              scale: index === activeSlide ? 1 : 1.05,
            }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0"
          >
            <img src={slide.image} alt={slide.caption} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,22,39,0.86),rgba(7,22,39,0.45),rgba(7,22,39,0.8))]" />
          </motion.div>
        ))}

        <div className="section-shell relative z-10 flex min-h-screen items-center py-16">
          <div className="max-w-4xl text-white">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.28em] text-white/90 backdrop-blur">
              <HeartHandshake size={14} />
              Friends for Life
            </span>
            <motion.h1
              key={heroSlides[activeSlide].caption}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="mt-6 max-w-3xl font-display text-4xl font-semibold tracking-tight sm:text-5xl lg:text-7xl"
            >
              {heroSlides[activeSlide].caption}
            </motion.h1>
            <motion.p
              key={heroSlides[activeSlide].text}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.05 }}
              className="mt-6 max-w-2xl text-base leading-8 text-white/82 sm:text-lg"
            >
              {heroSlides[activeSlide].text}
            </motion.p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/about" className="btn-primary bg-white text-cof-deep hover:bg-cof-pale">
                Learn More
              </Link>
              <Link to="/portal" className="btn-secondary border-white/18 bg-white/10 text-white hover:bg-white/14">
                Member Login
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveSlide((current) => (current - 1 + heroSlides.length) % heroSlides.length)}
                className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur transition hover:bg-white/16"
                aria-label="Previous slide"
              >
                <ArrowLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() => setActiveSlide((current) => (current + 1) % heroSlides.length)}
                className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur transition hover:bg-white/16"
                aria-label="Next slide"
              >
                <ArrowRight size={18} />
              </button>
              <div className="ml-1 flex gap-3">
                {heroSlides.map((slide, index) => (
                  <button
                    key={slide.caption}
                    type="button"
                    aria-label={`Show slide ${index + 1}`}
                    onClick={() => setActiveSlide(index)}
                    className={`h-2.5 rounded-full transition ${
                      index === activeSlide ? 'w-10 bg-white' : 'w-2.5 bg-white/45'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-shell py-22">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={stagger}
          className="grid gap-12 lg:grid-cols-[1.2fr,0.8fr]"
        >
          <motion.div variants={revealLeft} className="relative">
            <motion.div
              variants={lineReveal}
              className="mb-6 h-px w-28 origin-left bg-cof-blue/45"
            />
            <span className="text-xs font-bold uppercase tracking-[0.28em] text-cof-blue">Circle of Friends</span>
            <h2 className="mt-5 font-display text-4xl font-semibold leading-[0.95] tracking-tight text-cof-deep sm:text-5xl lg:text-7xl">
              Welfare support
              <br />
              for members.
            </h2>
            <p className="mt-8 max-w-3xl text-base leading-8 text-cof-slate sm:text-lg">
              Circle of Friends is an association built to make major life events easier to face
              together. We organize weddings support, funeral solidarity, immediate family
              assistance, charity, and branch-based fellowship through a culture of obligatory
              contributions and accountable leadership.
            </p>
          </motion.div>

          <motion.div variants={stagger} className="grid grid-cols-2 gap-x-6 gap-y-10 border-t border-cof-deep/10 pt-2 lg:border-t-0">
            {[
              { value: yearsActive, label: 'years of active fellowship' },
              { value: branches.length, label: 'branches organizing support' },
              { value: events.length, label: 'tracked support drives' },
              { value: members.length, label: 'members in the association' },
            ].map((item) => (
              <motion.div
                key={item.label}
                variants={zoomReveal}
                whileHover={{ y: -6 }}
                className="group border-b border-cof-deep/10 pb-5"
              >
                <p className="text-4xl font-semibold text-cof-deep sm:text-5xl">{item.value}</p>
                <p className="mt-3 text-sm uppercase tracking-[0.18em] text-cof-slate transition group-hover:text-cof-blue">{item.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      <section className="overflow-hidden border-y border-cof-deep/10 bg-white/75 py-5 backdrop-blur">
        <div className="home-ticker">
          <motion.div
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: 24, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
            className="home-ticker-track"
          >
            {[...movingStatements, ...movingStatements].map((item, index) => (
              <span key={`${item}-${index}`} className="home-ticker-item">
                <Sparkles size={14} />
                {item}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="section-shell py-8">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={stagger}
          className="space-y-10"
        >
          <motion.div variants={revealLeft} className="space-y-2">
            <p className="font-display text-3xl font-semibold leading-tight text-cof-deep sm:text-4xl lg:text-5xl">
              We apply structured welfare support
            </p>
            <p className="font-display text-3xl font-semibold leading-tight text-cof-deep/70 sm:text-4xl lg:text-5xl">
              and branch solidarity to create dependable care.
            </p>
          </motion.div>

          <div className="grid gap-10 lg:grid-cols-[1fr,0.95fr] lg:items-center">
            <motion.div variants={zoomReveal} className="overflow-hidden rounded-[34px]">
              <img
                src="/home/home2.jpg"
                alt="Circle of Friends group gathering"
                className="h-[26rem] w-full object-cover transition duration-700 hover:scale-[1.04] sm:h-[33rem]"
              />
            </motion.div>

            <motion.div variants={revealRight} className="space-y-6">
              <p className="text-lg leading-8 text-cof-slate">
                Our branches and national executive keep the association organized so support is not
                delayed, forgotten, or uneven. Contributions are not symbolic. They are planned,
                recorded, and activated for the real events that matter in members&apos; lives.
              </p>
              <p className="text-lg leading-8 text-cof-slate">
                This makes the association both personal and disciplined: a social bond with a
                welfare system behind it.
              </p>
              <div className="flex flex-wrap gap-3">
                {['Weddings', 'Funerals', 'Immediate family support', 'Charity', 'Community outreach'].map((item) => (
                  <motion.span
                    key={item}
                    whileHover={{ y: -3 }}
                    className="chip"
                  >
                    {item}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      <section className="section-shell py-18">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden border-y border-cof-deep/10 py-12"
        >
          <motion.div
            animate={{ x: ['0%', '-12%'] }}
            transition={{ duration: 18, repeat: Number.POSITIVE_INFINITY, repeatType: 'reverse', ease: 'easeInOut' }}
            className="pointer-events-none absolute inset-y-0 right-[-10%] hidden w-1/2 bg-[radial-gradient(circle,rgba(79,148,221,0.14),transparent_62%)] lg:block"
          />
          <p className="max-w-5xl font-display text-2xl font-semibold leading-relaxed text-cof-deep sm:text-3xl lg:text-4xl">
            “Practical welfare culture, dependable branch coordination, and a visible commitment to
            showing up for members.”
          </p>
        </motion.div>
      </section>

      <section className="section-shell py-10">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={stagger}
          className="grid gap-10 lg:grid-cols-[0.85fr,1.15fr]"
        >
          <motion.div variants={revealLeft} className="space-y-5">
            <span className="text-xs font-bold uppercase tracking-[0.28em] text-cof-blue">Our Support Areas</span>
            <h2 className="font-display text-3xl font-semibold leading-tight text-cof-deep sm:text-4xl lg:text-5xl">
              Our Services
            </h2>
            <p className="text-base leading-8 text-cof-slate">
              We support the association through organized contributions, accountable reporting,
              branch mobilization, and coordinated event response.
            </p>
            <div className="overflow-hidden rounded-[30px]">
              <img
                src="/home/home3.jpg"
                alt="Members gathered during an association moment"
                className="h-[24rem] w-full object-cover transition duration-700 hover:scale-[1.04]"
              />
            </div>
          </motion.div>

          <motion.div variants={stagger} className="grid gap-6 border-t border-cof-deep/10 pt-6 md:grid-cols-2">
            {homepageServices.map((service, index) => (
              <motion.div
                key={service.title}
                variants={revealRight}
                whileHover={{ y: -8 }}
                className="group rounded-[28px] border border-cof-blue/10 bg-white/88 p-6 shadow-[0_18px_50px_rgba(15,65,114,0.05)] transition duration-300"
              >
                <div className="text-lg font-semibold text-cof-blue/40 transition group-hover:text-cof-blue">
                  {String(index + 1).padStart(2, '0')}
                </div>
                <div className="mt-3">
                  <h3 className="font-display text-2xl font-semibold text-cof-deep transition group-hover:translate-x-1">
                    {service.title}
                  </h3>
                </div>
                <div className="mt-5 text-sm font-semibold uppercase tracking-[0.16em] text-cof-blue">
                  {service.meta}
                </div>
                <p className="mt-5 text-sm leading-7 text-cof-slate sm:text-base">{service.text}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      <section className="section-shell py-20">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={stagger}
          className="grid gap-14 lg:grid-cols-[1fr,1fr]"
        >
          <motion.div variants={revealLeft} className="space-y-6">
            <span className="text-xs font-bold uppercase tracking-[0.28em] text-cof-blue">Association Operations</span>
            <h2 className="font-display text-3xl font-semibold leading-tight text-cof-deep sm:text-4xl lg:text-5xl">
              We translate member commitment into coordinated support.
            </h2>
            <p className="text-base leading-8 text-cof-slate">
              Our experience across branches shows that support works best when fellowship is backed
              by structure. That means records, leadership roles, contribution rules, event
              follow-up, and visibility into what has been raised and where it is needed.
            </p>
            <Link to="/about" className="btn-primary">
              Learn about the association
              <ArrowUpRight size={16} />
            </Link>
          </motion.div>

          <motion.div variants={stagger} className="space-y-6">
            {operationalPoints.map((item) => (
              <motion.div
                key={item.title}
                variants={zoomReveal}
                whileHover={{ x: 8 }}
                className="border-b border-cof-deep/10 pb-6 last:border-b-0 last:pb-0"
              >
                <h3 className="font-display text-2xl font-semibold text-cof-deep">{item.title}</h3>
                <p className="mt-3 text-base leading-8 text-cof-slate">{item.text}</p>
              </motion.div>
            ))}
          </motion.div>
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
              <p className="text-xs font-bold uppercase tracking-[0.26em] text-white/68">How We Work</p>
              <h2 className="mt-4 font-display text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
                Structured welfare,
                <br />
                visible action,
                <br />
                continuous support.
              </h2>
            </motion.div>
            <motion.div variants={revealRight} className="grid gap-4 sm:grid-cols-3">
              {[
                'Members commit through contribution rules.',
                'Branches coordinate response and local follow-up.',
                'National leadership keeps records and visibility.',
              ].map((item, index) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ delay: index * 0.08, duration: 0.55 }}
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

      <section className="section-shell py-10">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={stagger}
          className="grid gap-10 lg:grid-cols-[1.05fr,0.95fr]"
        >
          <motion.div variants={zoomReveal} className="overflow-hidden rounded-[34px]">
            <img
              src="/home/who-we-are-3c.png"
              alt="Circle of Friends stage and gathering"
              className="h-[28rem] w-full object-cover transition duration-700 hover:scale-[1.04] sm:h-[34rem]"
            />
          </motion.div>

          <motion.div variants={stagger} className="space-y-6">
            <motion.div variants={revealRight}>
              <span className="text-xs font-bold uppercase tracking-[0.28em] text-cof-blue">Our Focus</span>
              <h2 className="mt-4 font-display text-3xl font-semibold leading-tight text-cof-deep sm:text-4xl">
                Obligatory contributions with clear support levels.
              </h2>
            </motion.div>

            <motion.div variants={stagger} className="space-y-4">
              {contributionPolicy.map((item) => (
                <motion.div
                  key={item.title}
                  variants={revealRight}
                  whileHover={{ x: 8 }}
                  className="flex gap-4 border-b border-cof-deep/10 pb-4 last:border-b-0"
                >
                  <CheckCircle2 className="mt-1 shrink-0 text-cof-blue" size={18} />
                  <div>
                    <p className="font-semibold text-cof-deep">{item.title}</p>
                    <p className="mt-1 text-sm font-semibold uppercase tracking-[0.14em] text-cof-blue">
                      {item.note}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-cof-slate">Minimum {formatMoney(item.amount)}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      <section className="section-shell py-20">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={stagger}
          className="grid gap-12 lg:grid-cols-[0.85fr,1.15fr]"
        >
          <motion.div variants={revealLeft} className="space-y-5">
            <span className="text-xs font-bold uppercase tracking-[0.28em] text-cof-blue">Branches</span>
            <h2 className="font-display text-3xl font-semibold leading-tight text-cof-deep sm:text-4xl lg:text-5xl">
              One national association.
              <br />
              Multiple active branches.
            </h2>
            <p className="text-base leading-8 text-cof-slate">
              Kumbo, Bamenda, Douala, Yaounde, Bafoussam, Ndop, and Nkambe operate with one shared
              welfare vision while maintaining local branch organization.
            </p>
          </motion.div>

          <motion.div variants={stagger} className="grid gap-6 md:grid-cols-2">
            {featuredBranches.map((branch) => (
              <motion.article
                key={branch.id}
                variants={zoomReveal}
                whileHover={{ y: -10 }}
                className="group overflow-hidden rounded-[28px] bg-white shadow-[0_18px_60px_rgba(15,65,114,0.08)]"
              >
                <img
                  src={getBranchImage(branch.id, branch.photo)}
                  alt={branch.name}
                  className="h-56 w-full object-cover transition duration-700 group-hover:scale-[1.05]"
                />
                <div className="space-y-3 p-5">
                  <h3 className="font-display text-2xl font-semibold text-cof-deep">{branch.name}</h3>
                  <p className="text-sm uppercase tracking-[0.16em] text-cof-blue">{branch.location}</p>
                  <p className="text-sm leading-7 text-cof-slate">{branch.description}</p>
                </div>
              </motion.article>
            ))}
          </motion.div>
        </motion.div>
      </section>

      <section className="section-shell py-18">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={stagger}
          className="grid gap-12 lg:grid-cols-[1fr,1fr]"
        >
          <motion.div variants={revealLeft}>
            <span className="text-xs font-bold uppercase tracking-[0.28em] text-cof-blue">Recent Work</span>
            <h2 className="mt-4 font-display text-3xl font-semibold leading-tight text-cof-deep sm:text-4xl lg:text-5xl">
              Past events and current updates.
            </h2>
          </motion.div>

          <motion.div variants={revealRight} className="space-y-5">
            <div className="flex items-center gap-3 text-cof-blue">
              <Megaphone size={18} />
              <p className="text-sm font-semibold uppercase tracking-[0.18em]">Announcements</p>
            </div>
            {latestNews.map((announcement) => (
              <div key={announcement.id} className="border-b border-cof-deep/10 pb-4 last:border-b-0">
                <p className="text-xs uppercase tracking-[0.16em] text-cof-blue">
                  {formatDate(announcement.createdAt)}
                </p>
                <p className="mt-2 font-display text-xl font-semibold text-cof-deep">{announcement.title}</p>
                <p className="mt-2 text-sm leading-7 text-cof-slate">{announcement.message}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={stagger}
          className="mt-12 grid gap-6 lg:grid-cols-3"
        >
          {pastEvents.map((event) => (
            <motion.article
              key={event.id}
              variants={zoomReveal}
              whileHover={{ y: -10 }}
              className="group overflow-hidden rounded-[28px] bg-white shadow-[0_18px_60px_rgba(15,65,114,0.08)]"
            >
              <img
                src={
                  event.type === 'wedding'
                    ? '/home/celebrating-together.jpg'
                    : event.type.includes('funeral')
                      ? '/home/standing-together.jpg'
                      : '/home/community.png'
                }
                alt={event.title}
                className="h-52 w-full object-cover transition duration-700 group-hover:scale-[1.05]"
              />
              <div className="space-y-3 p-5">
                <p className="text-xs uppercase tracking-[0.16em] text-cof-blue">{formatDate(event.date)}</p>
                <h3 className="font-display text-xl font-semibold text-cof-deep">{event.title}</h3>
                <p className="text-sm leading-7 text-cof-slate">{event.summary}</p>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </section>

      <section className="section-shell py-20">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={stagger}
          className="overflow-hidden rounded-[40px] bg-[linear-gradient(135deg,#0f4172_0%,#165fa6_55%,#4f94dd_100%)] px-6 py-10 text-white sm:px-10 sm:py-14"
        >
          <motion.div variants={lineReveal} className="mb-8 h-px w-full origin-left bg-white/16" />
          <motion.div variants={stagger} className="grid gap-10 lg:grid-cols-[1.2fr,0.8fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-white/80">
                <CalendarHeart size={14} />
                Ready to participate?
              </div>
              <h2 className="mt-5 font-display text-4xl font-semibold leading-[0.95] sm:text-5xl lg:text-6xl">
                Join a branch.
                <br />
                Support the mission.
                <br />
                Stay accountable.
              </h2>
            </div>

            <motion.div variants={revealRight} className="space-y-6">
              <p className="text-base leading-8 text-white/84">
                Follow upcoming events, view obligations, and stay connected to your branch and the
                wider Circle of Friends community.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/portal" className="btn-primary bg-white text-cof-deep hover:bg-cof-pale">
                  Member Login
                </Link>
                <Link to="/events" className="btn-secondary border-white/14 bg-white/10 text-white hover:bg-white/16">
                  Explore Events
                </Link>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            variants={stagger}
            className="mt-10 grid gap-4 border-t border-white/12 pt-8 md:grid-cols-3"
          >
            <motion.div variants={reveal}>
              <div className="flex items-center gap-3 text-white/72">
                <BadgeDollarSign size={18} />
                <p className="text-xs uppercase tracking-[0.18em]">Tracked contributions</p>
              </div>
              <p className="mt-3 text-3xl font-semibold">{formatMoney(totalRaised)}</p>
            </motion.div>
            <motion.div variants={reveal}>
              <div className="flex items-center gap-3 text-white/72">
                <Users size={18} />
                <p className="text-xs uppercase tracking-[0.18em]">Members</p>
              </div>
              <p className="mt-3 text-3xl font-semibold">{members.length}</p>
            </motion.div>
            <motion.div variants={reveal}>
              <div className="flex items-center gap-3 text-white/72">
                <Sparkles size={18} />
                <p className="text-xs uppercase tracking-[0.18em]">Upcoming events</p>
              </div>
              <p className="mt-3 text-3xl font-semibold">{upcomingEvents.length}</p>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>
    </div>
  )
}
