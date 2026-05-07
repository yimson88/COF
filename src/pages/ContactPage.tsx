import { motion } from 'framer-motion'
import {
  Building2,
  Mail,
  MapPin,
  MessageSquareText,
  Phone,
  Send,
  Sparkles,
} from 'lucide-react'
import { useState, type FormEvent } from 'react'

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

type SubmitState = 'idle' | 'sending' | 'success' | 'error'

export function ContactPage() {
  const [submitState, setSubmitState] = useState<SubmitState>('idle')
  const [feedback, setFeedback] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)

    setSubmitState('sending')
    setFeedback('')

    try {
      const response = await fetch('/contact-handler.php', {
        method: 'POST',
        body: formData,
      })

      const contentType = response.headers.get('content-type') ?? ''
      if (!contentType.includes('application/json')) {
        throw new Error('PHP contact handler is not active in this environment.')
      }

      const payload = (await response.json()) as { success?: boolean; message?: string }

      if (!response.ok || !payload.success) {
        throw new Error(payload.message ?? 'Unable to send your message right now.')
      }

      setSubmitState('success')
      setFeedback(payload.message ?? 'Message sent successfully.')
      form.reset()
    } catch (error) {
      setSubmitState('error')
      setFeedback(
        error instanceof Error
          ? error.message
          : 'Message could not be sent. Ensure the site is hosted on a PHP-enabled server.',
      )
    }
  }

  return (
    <div className="relative overflow-hidden pb-16">
      <div className="home-orb home-orb-one" />
      <div className="home-orb home-orb-two" />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/home/e74dc5c7-8405-4e42-9f20-80aa073608b5.jpg"
            alt="Circle of Friends contact"
            className="h-[28rem] w-full object-cover md:h-[32rem]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,22,39,0.84),rgba(7,22,39,0.46),rgba(7,22,39,0.84))]" />
        </div>

        <div className="section-shell relative z-10 flex h-[28rem] items-center md:h-[32rem]">
          <div className="max-w-3xl text-white">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/18 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.26em] text-white/88 backdrop-blur">
              <MessageSquareText size={14} />
              Contact Circle of Friends
            </span>
            <h1 className="mt-6 font-display text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Let us hear from your branch, your question, or your support request.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/80 sm:text-lg">
              Reach out for branch coordination, membership questions, welfare support information,
              announcements, or executive communication.
            </p>
          </div>
        </div>
      </section>

      <section className="section-shell py-20">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={stagger}
          className="grid gap-12 lg:grid-cols-[0.95fr,1.05fr]"
        >
          <motion.div variants={revealLeft} className="space-y-8">
            <div>
              <motion.div variants={lineReveal} className="mb-6 h-px w-28 origin-left bg-cof-blue/45" />
              <span className="text-xs font-bold uppercase tracking-[0.28em] text-cof-blue">Get In Touch</span>
              <h2 className="mt-5 font-display text-4xl font-semibold leading-[0.96] tracking-tight text-cof-deep sm:text-5xl lg:text-6xl">
                Contact the association
                <br />
                with clarity.
              </h2>
            </div>

            <p className="max-w-2xl text-base leading-8 text-cof-slate sm:text-lg">
              Whether you are a member, branch leader, or interested contact, use this page to send
              a direct message to Circle of Friends. The form is prepared for PHP deployment so it
              can be hosted easily on a standard web server.
            </p>

            <div className="space-y-4">
              {[
                {
                  icon: Mail,
                  title: 'Email',
                  text: 'circleoffriends.cm@gmail.com',
                },
                {
                  icon: Phone,
                  title: 'Phone',
                  text: '+237 677 101 001',
                },
                {
                  icon: MapPin,
                  title: 'Branches',
                  text: 'Kumbo, Bamenda, Douala, Yaounde, Bafoussam, Ndop, Nkambe',
                },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <motion.div
                    key={item.title}
                    variants={zoomReveal}
                    whileHover={{ x: 8 }}
                    className="flex gap-4 border-b border-cof-deep/10 pb-4 last:border-b-0"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cof-pale text-cof-blue">
                      <Icon size={18} />
                    </div>
                    <div>
                      <p className="font-display text-xl font-semibold text-cof-deep">{item.title}</p>
                      <p className="mt-2 text-sm leading-7 text-cof-slate">{item.text}</p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>

          <motion.div variants={zoomReveal} className="panel p-6 sm:p-8">
            <div className="flex items-center gap-3 text-cof-blue">
              <Sparkles size={18} />
              <span className="text-xs font-bold uppercase tracking-[0.22em]">Send a message</span>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <input name="full_name" type="text" required placeholder="Full name" className="field" />
                <input name="email" type="email" required placeholder="Email address" className="field" />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <input name="phone" type="text" placeholder="Phone number" className="field" />
                <input name="branch" type="text" placeholder="Branch or location" className="field" />
              </div>

              <input name="subject" type="text" required placeholder="Subject" className="field" />
              <textarea
                name="message"
                required
                rows={7}
                placeholder="Write your message"
                className="field resize-none"
              />

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="submit"
                  disabled={submitState === 'sending'}
                  className="btn-primary disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <Send size={16} />
                  {submitState === 'sending' ? 'Sending...' : 'Send Message'}
                </button>

                <p
                  className={`text-sm ${
                    submitState === 'success'
                      ? 'text-emerald-600'
                      : submitState === 'error'
                        ? 'text-rose-600'
                        : 'text-cof-slate'
                  }`}
                >
                  {feedback || 'Messages are handled by the PHP contact endpoint when deployed on a PHP server.'}
                </p>
              </div>
            </form>
          </motion.div>
        </motion.div>
      </section>

      <section className="section-shell py-8">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
          variants={stagger}
          className="overflow-hidden rounded-[38px] bg-cof-deep px-6 py-10 text-white sm:px-10"
        >
          <motion.div variants={lineReveal} className="mb-6 h-px w-full origin-left bg-white/18" />
          <div className="grid gap-8 lg:grid-cols-[0.9fr,1.1fr] lg:items-center">
            <motion.div variants={revealLeft}>
              <p className="text-xs font-bold uppercase tracking-[0.26em] text-white/68">Contact Flow</p>
              <h2 className="mt-4 font-display text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
                Direct questions.
                <br />
                Branch contact.
                <br />
                National follow-up.
              </h2>
            </motion.div>
            <motion.div variants={revealRight} className="grid gap-4 sm:grid-cols-3">
              {[
                'Use the form for membership and branch inquiries.',
                'Share event support questions and coordination requests.',
                'Forward announcements or executive communication needs.',
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

      <section className="section-shell py-12">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={stagger}
          className="grid gap-6 md:grid-cols-3"
        >
          {[
            {
              icon: Building2,
              title: 'Branch collaboration',
              text: 'Coordinate meetings, support drives, and local branch administration.',
            },
            {
              icon: MessageSquareText,
              title: 'General inquiries',
              text: 'Ask about events, obligations, registrations, and association processes.',
            },
            {
              icon: Mail,
              title: 'Executive communication',
              text: 'Reach the national leadership for reports, records, and official notices.',
            },
          ].map((item) => {
            const Icon = item.icon
            return (
              <motion.div
                key={item.title}
                variants={zoomReveal}
                whileHover={{ y: -10 }}
                className="rounded-[28px] border border-cof-blue/10 bg-white p-6 shadow-[0_18px_60px_rgba(15,65,114,0.08)]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cof-pale text-cof-blue">
                  <Icon size={20} />
                </div>
                <h3 className="mt-5 font-display text-2xl font-semibold text-cof-deep">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-cof-slate">{item.text}</p>
              </motion.div>
            )
          })}
        </motion.div>
      </section>
    </div>
  )
}
