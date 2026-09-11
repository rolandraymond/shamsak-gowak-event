import { FormEvent, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { CalendarDays, Check, ChevronDown, Clock3, MapPin, SunMedium } from 'lucide-react'

const EVENT_DATE = new Date('2026-10-02T18:00:00+03:00')

function useCountdown() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])

  return useMemo(() => {
    const diff = Math.max(0, EVENT_DATE.getTime() - now.getTime())
    return {
      days: Math.floor(diff / 86_400_000),
      hours: Math.floor((diff / 3_600_000) % 24),
      minutes: Math.floor((diff / 60_000) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    }
  }, [now])
}

function App() {
  const countdown = useCountdown()
const [submitted, setSubmitted] = useState(false)

const [name, setName] = useState('')
const [phone, setPhone] = useState('')
const [email, setEmail] = useState('')

const [errors, setErrors] = useState({
  name: '',
  phone: '',
  email: '',
})

const submit = (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault()

  const newErrors = {
    name: '',
    phone: '',
    email: '',
  }

  const cleanName = name.trim()
  const cleanPhone = phone.replace(/[\s-]/g, '')
  const cleanEmail = email.trim()

  // Letters from any language + spaces only
  const nameRegex = /^[\p{L}\s]+$/u

  // Egyptian mobile:
  // 010 / 011 / 012 / 015
  // +2010 / +2011 / +2012 / +2015
  const phoneRegex = /^(?:\+20|0)1[0125]\d{8}$/

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

  if (!cleanName) {
    newErrors.name = 'Full name is required.'
  } else if (cleanName.length < 3) {
    newErrors.name = 'Please enter your full name.'
  } else if (!nameRegex.test(cleanName)) {
    newErrors.name = 'Name can contain letters and spaces only.'
  }

  if (!cleanPhone) {
    newErrors.phone = 'Mobile number is required.'
  } else if (!phoneRegex.test(cleanPhone)) {
    newErrors.phone = 'Please enter a valid Egyptian mobile number.'
  }

  if (!cleanEmail) {
    newErrors.email = 'Email address is required.'
  } else if (!emailRegex.test(cleanEmail)) {
    newErrors.email = 'Please enter a valid email address.'
  }

  setErrors(newErrors)

  if (newErrors.name || newErrors.phone || newErrors.email) {
    return
  }

  setSubmitted(true)

  window.setTimeout(() => {
    document
      .querySelector('#rsvp')
      ?.scrollIntoView({ behavior: 'smooth' })
  }, 50)
}

  return (
    <main>
      <section className="hero" id="home">
        <div className="sun sun-one" />
        <div className="sun sun-two" />
        <div className="grain" />

        <nav className="nav shell">
          <img src="/assets/limitless-naturals.png" alt="Limitless Naturals" className="brand" />
          <a className="nav-cta" href="#rsvp">RSVP</a>
        </nav>

        <div className="hero-content shell">
          <div className="hero-stage">
            <motion.div
              className="hero-portrait-wrap"
              initial={{ opacity: 0, x: -34, scale: .97 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 1, ease: 'easeOut' }}
            >
              <div className="portrait-sun" />
              <img
                src="/assets/ahmed-el-ghandour.webp"
                alt="Ahmed El Ghandour / El Daheeh"
                className="hero-portrait"
              />
              <span className="portrait-label">SPECIAL GUEST</span>
            </motion.div>

            <div className="hero-copy">
              <motion.div
                className="eyebrow"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: .8 }}
              >
                <span>LIMITLESS OSSOFORTIN</span>
                <i />
                <span>LAUNCH EVENT</span>
              </motion.div>

              <motion.div
                className="guest-heading"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: .85, delay: .15 }}
              >
                <span className="guest-kicker">SPECIAL APPEARANCE</span>
                <h1>Ahmed El Ghandour</h1>
                <p className="guest-alias">EL DAHEEH</p>
              </motion.div>

              <motion.div
                className="launch-lockup"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: .8, delay: .3 }}
              >
                <p>A special appearance at the launch of</p>
                <img src="/assets/campaign-logo.png" alt="شمسك جواك" className="campaign-logo hero-campaign-logo" />
              </motion.div>

              <motion.div
                className="hero-countdown"
                aria-label="Countdown to event"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: .8, delay: .45 }}
              >
                {Object.entries(countdown).map(([label, value]) => (
                  <div key={label}>
                    <strong>{String(value).padStart(2, '0')}</strong>
                    <span>{label}</span>
                  </div>
                ))}
              </motion.div>

              <motion.div
                className="event-meta hero-event-meta"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: .8, delay: .55 }}
              >
                <div><CalendarDays size={18} /> 02 OCT 2026</div>
                <div><MapPin size={18} /> THE NILE RITZ-CARLTON, CAIRO</div>
              </motion.div>

              <motion.div
                className="hero-actions"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: .8, delay: .68 }}
              >
                <a href="#rsvp" className="button button-primary">CONFIRM ATTENDANCE</a>
                <a href="#story" className="button button-ghost">DISCOVER THE STORY</a>
              </motion.div>
            </div>
          </div>
        </div>

        <a href="#story" className="scroll-cue" aria-label="Scroll to story"><ChevronDown /></a>
      </section>

      <section className="question-section" id="story">
        <div className="shell narrow">
          <motion.p
            className="section-kicker"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: .5 }}
          >SEE → WONDER → DISCOVER</motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: .4 }}
          >
            We all see the sun.<br />
            <span>But can we see what it does inside us?</span>
          </motion.h2>
          <p className="lead">Egypt is surrounded by sunshine. But sunshine doesn’t automatically mean enough Vitamin D.</p>
        </div>
      </section>

      <section className="facts-section">
        <div className="shell">
          <div className="facts-grid">
            <article>
              <span className="fact-no">01</span>
              <h3>Look around.</h3>
              <p>We live under the sun — one of the strongest visual symbols of life, energy and movement.</p>
            </article>
            <article>
              <span className="fact-no">02</span>
              <h3>Look within.</h3>
              <p>Your daily routine, time outdoors and other factors can influence your Vitamin D status.</p>
            </article>
            <article>
              <span className="fact-no">03</span>
              <h3>Know your status.</h3>
              <p>Awareness starts with understanding. Medical assessment and testing can help you know where you stand.</p>
            </article>
          </div>
          <p className="disclaimer">Awareness content only. This website does not provide medical diagnosis or individualized treatment advice.</p>
        </div>
      </section>

<section className="relative isolate overflow-hidden bg-[#0b0a08]">
  {/* Background glow */}
  <div
    className="
      pointer-events-none
      absolute
      left-1/2
      bottom-[-220px]
      h-[520px]
      w-[820px]
      -translate-x-1/2
      rounded-full
      bg-[radial-gradient(circle,rgba(235,165,25,0.38)_0%,rgba(173,103,12,0.18)_38%,rgba(0,0,0,0)_72%)]
      blur-2xl
    "
  />

  <div
    className="
      relative z-10
      mx-auto
      flex
      max-w-5xl
      flex-col
      items-center
      px-6
      py-24
      text-center
      md:py-28
      lg:py-32
    "
  >
    {/* Icon */}
    <div
      className="
        mb-7
        flex
        h-11
        w-11
        items-center
        justify-center
        rounded-full
        border
        border-amber-400/20
        bg-amber-400/5
      "
    >
      <SunMedium
        size={22}
        strokeWidth={1.8}
        className="text-amber-400"
      />
    </div>

    {/* Intro */}
    <div className="mb-8 space-y-2">
      <p
        className="
          font-serif
          text-xl
          leading-relaxed
          text-[#cbb9a5]
          md:text-2xl
        "
      >
        The sun gives us light.
      </p>

      <p
        className="
          font-serif
          text-xl
          leading-relaxed
          text-[#cbb9a5]
          md:text-2xl
        "
      >
        But health starts from within.
      </p>
    </div>

    {/* Main headline */}
    <h2
      className="
        max-w-4xl
        font-serif
        text-[clamp(3rem,6vw,5.8rem)]
        font-medium
        leading-[0.98]
        tracking-[-0.04em]
        text-white
      "
    >
      Your sunshine isn’t
      <br className="hidden sm:block" />
      <span className="sm:ml-3">only above you.</span>
    </h2>

    {/* Campaign logo */}
    <div className="relative mt-10 md:mt-12">
      <div
        className="
          absolute
          left-1/2
          top-1/2
          h-[180px]
          w-[380px]
          -translate-x-1/2
          -translate-y-1/2
          rounded-full
          bg-amber-400/15
          blur-3xl
        "
      />

      <img
        src="/assets/ChatGPT Image Sep 11, 2026, 11_49_20 PM.png"
        alt="شمسك جواك"
        className="
          relative
          z-10
          h-auto
          w-[280px]
          md:w-[360px]
          lg:w-[420px]
        "
      />
    </div>

    {/* Tagline */}
    <strong
      className="
        mt-7
        text-[10px]
        font-semibold
        tracking-[0.38em]
        text-amber-300/80
        md:text-xs
      "
    >
      KNOW IT. CHECK IT. ACT ON IT.
    </strong>
  </div>
</section>

      {/* <section className="launch-section" id="launch">
        <div className="shell launch-grid">
          <div>
            <span className="section-kicker dark">THE LAUNCH</span>
            <h2>2 October 2026</h2>
            <div className="launch-details">
              <p><MapPin size={20} /> The Nile Ritz-Carlton, Cairo</p>
              <p><Clock3 size={20} /> Event time to be confirmed</p>
            </div>
            <p className="launch-text">An evening of curiosity, science and conversation — introducing a new way to think about Vitamin D awareness.</p>
          </div>
          <div className="countdown" aria-label="Countdown to event">
            {Object.entries(countdown).map(([label, value]) => (
              <div key={label}>
                <strong>{String(value).padStart(2, '0')}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      <section className="rsvp-section" id="rsvp">
        <div className="shell rsvp-grid">
          <div className="rsvp-copy">
            <span className="section-kicker">YOUR INVITATION</span>
            <h2>Join us for<br />شمسك جواك</h2>
            <p>Confirm your attendance and we’ll keep your invitation details ready for the event.</p>
            <div className="mini-meta"><CalendarDays /> 02 OCT 2026</div>
            <div className="mini-meta"><MapPin /> THE NILE RITZ-CARLTON, CAIRO</div>
          </div>

          <div className="rsvp-card">
            {!submitted ? (
            <form onSubmit={submit} noValidate className="space-y-5">
              <div className="form-head">
                <p>RSVP</p>
                <h3>Confirm your attendance</h3>
              </div>

              {/* Full Name */}
              <label className="block">
                <span className="mb-2 block text-sm font-medium">
                  Full name
                </span>

                <input
                  type="text"
                  value={name}
                  autoComplete="name"
                  maxLength={60}
                  placeholder="Dr. Full Name"
                  onChange={(e) => {
                    const value = e.target.value

                    // Prevent numbers and special characters
                    if (/^[\p{L}\s]*$/u.test(value)) {
                      setName(value)

                      if (errors.name) {
                        setErrors(prev => ({
                          ...prev,
                          name: '',
                        }))
                      }
                    }
                  }}
                  className={`
                    w-full rounded-xl border bg-white px-4 py-3
                    text-neutral-900 outline-none transition
                    placeholder:text-neutral-400
                    ${
                      errors.name
                        ? 'border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
                        : 'border-neutral-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10'
                    }
                  `}
                />

                {errors.name && (
                  <p className="mt-1.5 text-sm font-medium text-red-500">
                    {errors.name}
                  </p>
                )}
              </label>

              {/* Mobile */}
              <label className="block">
                <span className="mb-2 block text-sm font-medium">
                  Mobile number
                </span>

                <input
                  type="tel"
                  inputMode="tel"
                  value={phone}
                  autoComplete="tel"
                  maxLength={18}
                  placeholder="+20 1X XXX XXXX"
                  onChange={(e) => {
                    const value = e.target.value

                    // Only numbers, spaces, hyphen and one +
                    if (/^\+?[0-9\s-]*$/.test(value)) {
                      setPhone(value)

                      if (errors.phone) {
                        setErrors(prev => ({
                          ...prev,
                          phone: '',
                        }))
                      }
                    }
                  }}
                  className={`
                    w-full rounded-xl border bg-white px-4 py-3
                    text-neutral-900 outline-none transition
                    placeholder:text-neutral-400
                    ${
                      errors.phone
                        ? 'border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
                        : 'border-neutral-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10'
                    }
                  `}
                />

                {errors.phone && (
                  <p className="mt-1.5 text-sm font-medium text-red-500">
                    {errors.phone}
                  </p>
                )}
              </label>

              {/* Email */}
              <label className="block">
                <span className="mb-2 block text-sm font-medium">
                  Email address
                </span>

                <input
                  type="email"
                  value={email}
                  autoComplete="email"
                  maxLength={120}
                  placeholder="doctor@example.com"
                  onChange={(e) => {
                    setEmail(e.target.value)

                    if (errors.email) {
                      setErrors(prev => ({
                        ...prev,
                        email: '',
                      }))
                    }
                  }}
                  className={`
                    w-full rounded-xl border bg-white px-4 py-3
                    text-neutral-900 outline-none transition
                    placeholder:text-neutral-400
                    ${
                      errors.email
                        ? 'border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
                        : 'border-neutral-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10'
                    }
                  `}
                />

                {errors.email && (
                  <p className="mt-1.5 text-sm font-medium text-red-500">
                    {errors.email}
                  </p>
                )}
              </label>

              {/* Agreement */}
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  required
                  type="checkbox"
                  className="
                    mt-1 h-4 w-4
                    rounded border-neutral-300
                    accent-orange-500
                  "
                />

                <span className="text-sm leading-relaxed text-neutral-600">
                  I agree to receive event confirmation and event-related communication.
                </span>
              </label>

              <button
                className="
                  button button-primary full
                  w-full transition
                  active:scale-[0.98]
                "
                type="submit"
              >
                CONFIRM MY ATTENDANCE
              </button>
            </form>
            ) : (
              <div className="success-state">
                <div className="success-icon"><Check /></div>
                <p className="success-kicker">YOU’RE IN</p>
                <h3>Thank you{name ? `, ${name}` : ''}.</h3>
                <p>Your attendance at شمسك جواك has been confirmed.</p>
                <div className="ticket">
                  <span>02 OCT 2026</span>
                  <strong>THE NILE RITZ-CARLTON</strong>
                  <small>CAIRO</small>
                </div>
                <p className="success-note">Next step: we’ll connect this screen to the real guest database, unique invitation ID, QR code, email and WhatsApp confirmation.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <footer>
        <div className="shell footer-inner">
          <img src="/assets/limitless-naturals.png" alt="Limitless Naturals" />
          <div>
            <strong>شمسك جواك</strong>
            <span>LIMITLESS OSSOFORTIN LAUNCH EVENT • 2026</span>
          </div>
        </div>
      </footer>
    </main>
  )
}

export default App
