import { motion } from 'framer-motion'
import {
  Building2,
  CheckCircle2,
  Crown,
  HeartHandshake,
  Search,
  Sparkles,
  Users,
  X,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCof } from '../context/CofContext'

const executiveImageByPortfolio: Record<string, string> = {
  'General Coordinator': '/about/gencord.jpg',
  'General Treasurer': '/about/finsec.jpg',
}

const galleryImages = [
  '/events/convention2020.jpg',
  '/home/1.jpeg',
  '/home/e74dc5c7-8405-4e42-9f20-80aa073608b5.jpg',
]

const branchVisuals: Record<string, string> = {
  bamenda: '/home/bamenda.jpg',
  douala: '/home/douala.jpg',
  kumbo: '/home/kumbo.jpg',
  yaounde: '/home/yaounde.jpg',
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

function getBranchImage(branchId: string, fallback: string) {
  return branchVisuals[branchId] ?? fallback
}

export function AboutPage() {
  const { branches, events, executives } = useCof()
  const [modalIndex, setModalIndex] = useState<number | null>(null)

  const gallery = useMemo(
    () =>
      events
        .filter((event) => event.status === 'past')
        .slice(0, 3)
        .map((event, index) => ({
          image: galleryImages[index] ?? event.hero,
          title: event.title,
          description: event.summary,
        })),
    [events],
  )

  const modalItem = modalIndex === null ? null : gallery[modalIndex]

  return (
    <div className="relative overflow-hidden space-y-18 pb-12">
      <div className="home-orb home-orb-one" />
      <div className="home-orb home-orb-three" />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/home/FB_IMG_1749649752439.jpg"
            alt="Circle of Friends members"
            className="h-[28rem] w-full object-cover md:h-[32rem]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,22,39,0.82),rgba(7,22,39,0.48),rgba(7,22,39,0.84))]" />
        </div>

        <div className="section-shell relative z-10 flex h-[28rem] items-center md:h-[32rem]">
          <div className="max-w-3xl text-white">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/18 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.26em] text-white/88 backdrop-blur">
              <Crown size={14} />
              About Circle of Friends
            </span>
            <h1 className="mt-6 font-display text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              A community built on solidarity, dignity, and consistent support
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/80 sm:text-lg">
              Circle of Friends exists to make member welfare dependable. We stand together through
              weddings, funerals, outreach, and community service with structure and compassion.
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
              'Solidarity',
              'Branch Fellowship',
              'National Coordination',
              'Practical Support',
              'Compassion and Accountability',
              'Friends for Life',
              'Solidarity',
              'Branch Fellowship',
              'National Coordination',
              'Practical Support',
              'Compassion and Accountability',
              'Friends for Life',
            ].map((item, index) => (
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
          className="space-y-20"
        >
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <motion.div variants={revealLeft}>
              <motion.div variants={lineReveal} className="mb-6 h-px w-28 origin-left bg-cof-blue/45" />
              <span className="text-xs font-bold uppercase tracking-[0.28em] text-cof-blue">Who We Are</span>
              <h2 className="mt-5 font-display text-4xl font-semibold text-cof-deep">A community built on solidarity</h2>
              <p className="mt-4 text-sm leading-8 text-cof-slate sm:text-base">
                Circle of Friends is more than a social group. It is a bond of friendship, shared
                responsibility, and welfare-centered action. We support one another through life
                events such as weddings, funerals, emergencies, and outreach initiatives.
              </p>
              <p className="mt-4 text-sm leading-8 text-cof-slate sm:text-base">
                Our branches and national executive keep the association organized so support is not
                delayed, forgotten, or uneven. The mission is simple: no member should face major
                moments alone.
              </p>
            </motion.div>
            <motion.div variants={zoomReveal} className="overflow-hidden rounded-[30px] shadow-[0_26px_90px_rgba(15,65,114,0.14)]">
              <img
                src="/about/who-we-are-1.jpg"
                alt="Association solidarity"
                className="h-[24rem] w-full object-cover transition duration-700 hover:scale-[1.04] lg:h-[26rem]"
              />
            </motion.div>
          </div>

          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <motion.div variants={zoomReveal} className="overflow-hidden rounded-[30px] shadow-[0_26px_90px_rgba(15,65,114,0.14)]">
              <img
                src="/about/who-we-are-2.jpg"
                alt="Association purpose"
                className="h-[24rem] w-full object-cover transition duration-700 hover:scale-[1.04] lg:h-[26rem]"
              />
            </motion.div>
            <motion.div variants={revealRight}>
              <h3 className="font-display text-2xl font-semibold text-cof-ink">Our Purpose</h3>
              <p className="mt-4 text-sm leading-8 text-cof-slate sm:text-base">
                The association was founded on the principles of empathy, mutual aid, and
                consistency. We believe no one should face life&apos;s high points or low moments
                without a dependable support system.
              </p>
              <h3 className="mt-8 font-display text-2xl font-semibold text-cof-ink">
                Empowering One Another
              </h3>
              <p className="mt-4 text-sm leading-8 text-cof-slate sm:text-base">
                Circle of Friends empowers members by offering time, resources, organization, and
                care when it matters most. Together, we rise by lifting each other.
              </p>
            </motion.div>
          </div>

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
              “Circle of Friends is built to combine compassion with organized support, so care is
              not delayed when real life happens.”
            </p>
          </motion.div>

          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <motion.div variants={revealLeft}>
              <h3 className="font-display text-2xl font-semibold text-cof-ink">Celebrating Life Together</h3>
              <p className="mt-4 text-sm leading-8 text-cof-slate sm:text-base">
                From joyous weddings to solemn farewells, our presence in one another&apos;s lives
                makes every moment more meaningful and memorable.
              </p>
              <h2 className="mt-10 font-display text-2xl font-semibold text-cof-ink">What We Do</h2>
              <div className="mt-5 space-y-4 text-sm leading-7 text-cof-slate sm:text-base">
                <motion.div whileHover={{ x: 6 }} className="flex gap-3 rounded-[20px] px-3 py-2 transition hover:bg-cof-pale/60">
                  <CheckCircle2 className="mt-1 shrink-0 text-emerald-500" size={18} />
                  <span>
                    <strong className="text-cof-deep">Member Support:</strong> We assist during
                    weddings, funerals, and milestones with financial, emotional, and logistical
                    support.
                  </span>
                </motion.div>
                <motion.div whileHover={{ x: 6 }} className="flex gap-3 rounded-[20px] px-3 py-2 transition hover:bg-cof-pale/60">
                  <Users className="mt-1 shrink-0 text-cof-blue" size={18} />
                  <span>
                    <strong className="text-cof-deep">Community Development:</strong> We support
                    clean-up campaigns, youth mentorship, fellowship, and branch-led initiatives.
                  </span>
                </motion.div>
                <motion.div whileHover={{ x: 6 }} className="flex gap-3 rounded-[20px] px-3 py-2 transition hover:bg-cof-pale/60">
                  <HeartHandshake className="mt-1 shrink-0 text-rose-500" size={18} />
                  <span>
                    <strong className="text-cof-deep">Humanitarian Outreach:</strong> We provide
                    help and hope through donations, visits, and practical service.
                  </span>
                </motion.div>
              </div>
            </motion.div>
            <motion.div variants={zoomReveal} className="grid grid-cols-2 gap-4">
              <img
                src="/about/who-we-are-3a.jpg"
                alt="Celebration"
                className="h-56 w-full rounded-[24px] object-cover shadow-lg transition duration-700 hover:-translate-y-1 hover:scale-[1.03] lg:h-64"
              />
              <img
                src="/about/who-we-are-3b.jpg"
                alt="Support"
                className="h-56 w-full rounded-[24px] object-cover shadow-lg transition duration-700 hover:translate-y-1 hover:scale-[1.03] lg:h-64"
              />
            </motion.div>
          </div>
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
              <p className="text-xs font-bold uppercase tracking-[0.26em] text-white/68">Values</p>
              <h2 className="mt-4 font-display text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
                Friendship.
                <br />
                Responsibility.
                <br />
                Organized support.
              </h2>
            </motion.div>
            <motion.div variants={revealRight} className="grid gap-4 sm:grid-cols-3">
              {[
                'Members stand with one another in meaningful life events.',
                'Branches keep support close, visible, and timely.',
                'National leadership keeps the association aligned and accountable.',
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

      <section className="section-shell">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={stagger}
          className="panel overflow-hidden p-6 sm:p-8"
        >
          <div className="grid gap-8 lg:grid-cols-[1fr,0.95fr] lg:items-center">
            <motion.div variants={revealLeft}>
              <h2 className="font-display text-3xl font-semibold text-cof-deep">Our Vision</h2>
              <p className="mt-4 text-base leading-8 text-cof-slate">
                To build a tightly knit community where friendship, respect, compassion, and
                responsibility guide our actions, and where every member has a strong support network
                in both joyful and difficult times.
              </p>
              <h2 className="mt-10 font-display text-3xl font-semibold text-cof-deep">Join Us</h2>
              <p className="mt-4 text-base leading-8 text-cof-slate">
                Circle of Friends is more than an association. It is a family of people who believe
                in showing up, giving back, and making every milestone more meaningful.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/portal" className="btn-primary">
                  Member Login
                </Link>
                <Link to="/events" className="btn-secondary">
                  View Events
                </Link>
              </div>
            </motion.div>

            <motion.div variants={zoomReveal} className="overflow-hidden rounded-[28px] bg-cof-deep">
              <video controls poster="/home/celebrating-together.jpg" className="w-full">
                <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </motion.div>
          </div>
        </motion.div>
      </section>

      <section className="section-shell">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={stagger}
          className="space-y-8"
        >
          <motion.div variants={revealLeft} className="space-y-3">
            <span className="eyebrow">
              <Crown size={14} />
              National Executive
            </span>
            <h2 className="font-display text-3xl font-semibold text-cof-deep sm:text-4xl">
              Leadership at the national level
            </h2>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {executives.map((executive) => (
              <motion.div
                key={executive.id}
                variants={zoomReveal}
                whileHover={{ y: -8 }}
                className="rounded-[28px] border border-cof-blue/10 bg-white p-6 text-center shadow-[0_20px_60px_rgba(15,65,114,0.08)]"
              >
                <img
                  src={executiveImageByPortfolio[executive.portfolio] ?? executive.avatar}
                  alt={executive.name}
                  className="mx-auto h-40 w-40 rounded-full border-4 border-cof-blue/15 object-cover shadow-lg"
                />
                <h3 className="mt-5 font-display text-xl font-semibold text-cof-deep">
                  {executive.name}
                </h3>
                <p className="mt-2 text-sm font-semibold uppercase tracking-[0.16em] text-cof-blue">
                  {executive.portfolio}
                </p>
                <p className="mt-4 text-sm leading-7 text-cof-slate">{executive.bio}</p>
                <p className="mt-4 text-sm text-cof-slate">{executive.phone}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="section-shell">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={stagger}
          className="space-y-8"
        >
          <motion.div variants={revealLeft} className="space-y-3">
            <span className="eyebrow">
              <Building2 size={14} />
              Branch Coordination
            </span>
            <h2 className="font-display text-3xl font-semibold text-cof-deep sm:text-4xl">
              Every branch has local leadership with national alignment
            </h2>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {branches.map((branch) => (
              <motion.div key={branch.id} variants={zoomReveal} whileHover={{ y: -8 }} className="panel overflow-hidden">
                <img
                  src={getBranchImage(branch.id, branch.photo)}
                  alt={branch.name}
                  className="h-52 w-full object-cover transition duration-700 hover:scale-[1.05]"
                />
                <div className="space-y-4 p-6">
                  <div>
                    <h3 className="font-display text-xl font-semibold text-cof-deep">{branch.name}</h3>
                    <p className="text-sm text-cof-slate">{branch.location}</p>
                  </div>
                  <p className="text-sm leading-7 text-cof-slate">{branch.description}</p>
                  <div className="rounded-2xl bg-cof-pale p-4 text-sm text-cof-slate">
                    <p>
                      <span className="font-semibold text-cof-deep">Coordinator:</span>{' '}
                      {branch.coordinatorName}
                    </p>
                    <p className="mt-2">
                      <span className="font-semibold text-cof-deep">Treasurer:</span>{' '}
                      {branch.treasurerName}
                    </p>
                    <p className="mt-2">
                      <span className="font-semibold text-cof-deep">Meeting Day:</span>{' '}
                      {branch.meetingDay}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="section-shell">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={stagger}
          className="space-y-8 rounded-[34px] bg-white p-6 shadow-[0_26px_90px_rgba(15,65,114,0.1)] sm:p-8"
        >
          <motion.div variants={revealLeft} className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="eyebrow">
                <Search size={14} />
                Past Events Gallery
              </span>
              <h2 className="mt-4 font-display text-3xl font-semibold text-cof-deep sm:text-4xl">
                A visual glance at the association in action
              </h2>
            </div>
            <Link to="/events" className="btn-secondary self-start">
              View all events
            </Link>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {gallery.map((item, index) => (
              <motion.button
                key={item.title}
                type="button"
                variants={zoomReveal}
                whileHover={{ y: -8 }}
                onClick={() => setModalIndex(index)}
                className="group relative overflow-hidden rounded-[26px] text-left shadow-[0_16px_44px_rgba(15,65,114,0.08)]"
              >
                <img src={item.image} alt={item.title} className="h-64 w-full object-cover transition duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,65,114,0.05),rgba(15,65,114,0.76))]" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                  <p className="font-display text-xl font-semibold">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-white/82">{item.description}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </section>

      {modalItem ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/78 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="relative w-full max-w-4xl overflow-hidden rounded-[28px] bg-white shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setModalIndex(null)}
              className="absolute right-4 top-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-cof-deep shadow-lg"
              aria-label="Close gallery preview"
            >
              <X size={18} />
            </button>
            <img src={modalItem.image} alt={modalItem.title} className="h-[24rem] w-full object-cover sm:h-[32rem]" />
            <div className="p-6">
              <h3 className="font-display text-2xl font-semibold text-cof-deep">{modalItem.title}</h3>
              <p className="mt-3 text-sm leading-7 text-cof-slate">{modalItem.description}</p>
            </div>
          </motion.div>
        </div>
      ) : null}
    </div>
  )
}
