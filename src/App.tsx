import PassPage from './PassPage'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { CalendarDays, Check, ChevronDown, Clock3, MapPin, SunMedium } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import CheckInPage from './CheckInPage'
import AdminPage from './AdminPage'
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
type InviteGuest = {
  fullName: string
  phone: string
  email?: string | null
  invitationCode: string | null
  rsvpStatus: string
  qrToken: string | null
}

function App() {
  const countdown = useCountdown()
const [submitted, setSubmitted] = useState(false)

const [phone, setPhone] = useState('')
const [guest, setGuest] = useState<InviteGuest | null>(null)

const [loading, setLoading] = useState(false)
const [serverError, setServerError] = useState('')
const [phoneError, setPhoneError] = useState('')

const [isNewGuest, setIsNewGuest] = useState(false)

const [name, setName] = useState('')
const [email, setEmail] = useState('')

const [registrationErrors, setRegistrationErrors] = useState({
  name: '',
  email: '',
})

const lookupInvitation = async (
  e: FormEvent<HTMLFormElement>
) => {
  e.preventDefault()

  const cleanPhone = phone.replace(/[\s-]/g, '')
  const phoneRegex = /^(?:\+20|0)1[0125]\d{8}$/

  setPhoneError('')
  setServerError('')

  if (!cleanPhone) {
    setPhoneError('Mobile number is required.')
    return
  }

  if (!phoneRegex.test(cleanPhone)) {
    setPhoneError(
      'Please enter a valid Egyptian mobile number.'
    )
    return
  }

  setLoading(true)

  try {
    const response = await fetch('/api/invite/lookup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: cleanPhone,
      }),
    })

    const data = await response.json()

if (!response.ok) {
  setGuest(null)

  if (data.code === 'GUEST_NOT_FOUND') {
    setIsNewGuest(true)
    setServerError('')
    return
  }

  setServerError(
    data.error ||
      'Unable to search for your registration.'
  )
  

  return
}
    setIsNewGuest(false)

    setGuest(data.guest)
  } catch (error) {
    console.error(error)

    setServerError(
      'Unable to connect. Please try again.'
    )
  } finally {
    setLoading(false)
  }
}
const registerNewGuest = async (
  e: FormEvent<HTMLFormElement>
) => {
  e.preventDefault()

  const cleanName = name.trim()
  const cleanEmail = email.trim().toLowerCase()
  const cleanPhone = phone.replace(/[\s-]/g, '')

  const nameRegex = /^[\p{L}\s.'’\-]+$/u
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

  const newErrors = {
    name: '',
    email: '',
  }

  if (!cleanName) {
    newErrors.name = 'Full name is required.'
  } else if (
    cleanName.length < 3 ||
    !nameRegex.test(cleanName)
  ) {
    newErrors.name = 'Please enter a valid full name.'
  }

  if (!cleanEmail) {
    newErrors.email = 'Email address is required.'
  } else if (!emailRegex.test(cleanEmail)) {
    newErrors.email = 'Please enter a valid email address.'
  }

  setRegistrationErrors(newErrors)

  if (newErrors.name || newErrors.email) {
    return
  }

  setLoading(true)
  setServerError('')

  try {
    const response = await fetch('/api/rsvp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: cleanName,
        phone: cleanPhone,
        email: cleanEmail,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      setServerError(
        data.error ||
          'Unable to complete registration.'
      )
      return
    }

    setGuest({
      fullName: data.guest.fullName,
      phone: data.guest.phone,
      email: data.guest.email,
      invitationCode: data.guest.invitationCode,
      rsvpStatus: data.guest.rsvpStatus,
      qrToken: data.guest.qrToken,
    })

    setIsNewGuest(false)
    setSubmitted(true)

    window.setTimeout(() => {
      document
        .querySelector('#rsvp')
        ?.scrollIntoView({
          behavior: 'smooth',
        })
    }, 50)

  } catch (error) {
    console.error(error)

    setServerError(
      'Unable to connect. Please try again.'
    )
  } finally {
    setLoading(false)
  }
}

const confirmAttendance = async (
  e: FormEvent<HTMLFormElement>
) => {
  e.preventDefault()

  if (!guest) {
    return
  }

  setLoading(true)
  setServerError('')

  try {
    const response = await fetch('/api/rsvp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: guest.phone,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      if (data.code === 'ALREADY_CONFIRMED') {
      setGuest({
        ...guest,
        fullName: data.guest.fullName,
        invitationCode: data.guest.invitationCode,
        rsvpStatus: 'confirmed',
        qrToken: data.guest.qrToken,
      })

        return
      }

      setServerError(
        data.error ||
          'Unable to confirm attendance.'
      )

      return
    }

setGuest({
  ...guest,
  fullName: data.guest.fullName,
  phone: data.guest.phone,
  email: data.guest.email,
  invitationCode: data.guest.invitationCode,
  rsvpStatus: 'confirmed',
  qrToken: data.guest.qrToken,
})

    setSubmitted(true)

    window.setTimeout(() => {
      document
        .querySelector('#rsvp')
        ?.scrollIntoView({
          behavior: 'smooth',
        })
    }, 50)

  } catch (error) {
    console.error(error)

    setServerError(
      'Unable to connect. Please try again.'
    )
  } finally {
    setLoading(false)
  }
}


const resetInvitation = () => {
  setGuest(null)
  setSubmitted(false)

  setPhone('')
  setName('')
  setEmail('')

  setIsNewGuest(false)

  setPhoneError('')
  setServerError('')

  setRegistrationErrors({
    name: '',
    email: '',
  })
}

const getCheckInUrl = (qrToken: string) => {
  return `${window.location.origin}/check-in?token=${encodeURIComponent(qrToken)}`
}




  if (window.location.pathname === '/pass') {
  return <PassPage />
}

  if (window.location.pathname === '/admin') {
  return <AdminPage />
}

if (window.location.pathname === '/check-in') {
  return <CheckInPage />
}



  return (
    <main>
      <section className="hero" id="home">
        <div className="sun sun-one" />
        <div className="sun sun-two" />
        <div className="grain" />

        <nav className="nav shell">
          <img src="/assets/limitless_black.png" alt="Limitless Naturals" className="brand" />
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
        <h2>
          Join us for
          <br />

        <span
          className="
            font-shamsak
            inline-block
            origin-center
            scale-x-110
            text-6xl
            leading-none
          "
        >
          شمسك جواك
        </span>
        </h2>        
            <p>Confirm your attendance and we’ll keep your invitation details ready for the event.</p>
            <div className="mini-meta"><CalendarDays /> 02 OCT 2026</div>
            <div className="mini-meta"><MapPin /> THE NILE RITZ-CARLTON, CAIRO</div>
          </div>

          <div className="rsvp-card">

    {!submitted ? (

      isNewGuest ? (

        <form
          onSubmit={registerNewGuest}
          noValidate
          className="space-y-5"
        >

          <div className="form-head">
            <p>NEW REGISTRATION</p>
            <h3>Complete your registration</h3>
          </div>

          <p className="text-sm leading-relaxed text-neutral-600">
            We couldn't find an existing registration for this number.
            Complete your details below to join the event.
          </p>

          {/* Full Name */}
          <label className="block">

            <span className="mb-2 block text-sm font-medium">
              Full name
            </span>

            <input
              type="text"
              value={name}
              autoComplete="name"
              maxLength={80}
              placeholder="Dr. Full Name"
              onChange={(e) => {
                setName(e.target.value)

                if (registrationErrors.name) {
                  setRegistrationErrors(prev => ({
                    ...prev,
                    name: '',
                  }))
                }
              }}
              className={`
                w-full rounded-xl border bg-white px-4 py-3
                text-neutral-900 outline-none transition
                placeholder:text-neutral-400
                ${
                  registrationErrors.name
                    ? 'border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
                    : 'border-neutral-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10'
                }
              `}
            />

            {registrationErrors.name && (
              <p className="mt-1.5 text-sm font-medium text-red-500">
                {registrationErrors.name}
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
              value={phone}
              readOnly
              className="
                w-full rounded-xl border
                border-neutral-200
                bg-neutral-100
                px-4 py-3
                text-neutral-600
              "
            />

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

                if (registrationErrors.email) {
                  setRegistrationErrors(prev => ({
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
                  registrationErrors.email
                    ? 'border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
                    : 'border-neutral-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10'
                }
              `}
            />

            {registrationErrors.email && (
              <p className="mt-1.5 text-sm font-medium text-red-500">
                {registrationErrors.email}
              </p>
            )}

          </label>

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
              I agree to receive event confirmation and
              event-related communication.
            </span>

          </label>

          {serverError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {serverError}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="
              button button-primary full
              w-full transition
              active:scale-[0.98]
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >
            {loading
              ? 'REGISTERING...'
              : 'COMPLETE REGISTRATION'}
          </button>

          <button
            type="button"
            onClick={resetInvitation}
            disabled={loading}
            className="button button-ghost full w-full"
          >
            USE ANOTHER NUMBER
          </button>

        </form>

      ) : !guest ? (

                /* =========================
                  STEP 1 — FIND INVITATION
                  ========================= */

                <form
                  onSubmit={lookupInvitation}
                  noValidate
                  className="space-y-5"
                >

                  <div className="form-head">
                    <p>YOUR INVITATION</p>
                    <h3>Find your invitation</h3>
                  </div>

                  <p className="text-sm leading-relaxed text-neutral-600">
                    Enter the mobile number associated with your invitation.
                  </p>

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
                      placeholder="010 XXX XXXX"
                      onChange={(e) => {
                        const value = e.target.value

                        if (/^\+?[0-9\s-]*$/.test(value)) {
                          setPhone(value)

                          if (phoneError) {
                            setPhoneError('')
                          }

                          if (serverError) {
                            setServerError('')
                          }
                        }
                      }}
                      className={`
                        w-full rounded-xl border
                        bg-white px-4 py-3
                        text-neutral-900
                        outline-none transition
                        placeholder:text-neutral-400
                        ${
                          phoneError
                            ? 'border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
                            : 'border-neutral-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10'
                        }
                      `}
                    />

                    {phoneError && (
                      <p className="mt-1.5 text-sm font-medium text-red-500">
                        {phoneError}
                      </p>
                    )}

                  </label>

                  {serverError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                      {serverError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="
                      button button-primary full
                      w-full transition
                      active:scale-[0.98]
                      disabled:cursor-not-allowed
                      disabled:opacity-60
                    "
                  >
                    {loading
                      ? 'SEARCHING...'
                      : 'FIND MY INVITATION'}
                  </button>

                </form>

              ) : guest.rsvpStatus === 'confirmed' ? (

                /* =========================
                  ALREADY CONFIRMED
                  ========================= */

                <div className="success-state">

                  <div className="success-icon">
                    <Check />
                  </div>

                  <p className="success-kicker">
                    ALREADY CONFIRMED
                  </p>

                  <h3>
                    Welcome, {guest.fullName}.
                  </h3>

                  <p>
                    Your attendance has already been confirmed.
                  </p>

                  <div className="ticket">
                    <span>02 OCT 2026</span>
                    <strong>THE NILE RITZ-CARLTON</strong>
                    <small>CAIRO</small>
                  </div>

                  {guest.invitationCode && (
                    <div className="mt-6">

                      <span className="block text-xs tracking-[0.2em] text-neutral-500">
                        INVITATION ID
                      </span>

                      <strong className="mt-1 block text-2xl">
                        {guest.invitationCode}
                      </strong>

                    </div>
                  )}
                  
                  {guest.qrToken && (

                <div className="mt-8 flex flex-col items-center">

                  <div className="rounded-2xl bg-white p-4 shadow-md">
                    <QRCodeSVG
                      value={getCheckInUrl(guest.qrToken)}
                      size={190}
                      level="H"
                      includeMargin
                    />
                  </div>

                  <p className="mt-4 text-sm font-semibold text-neutral-800">
                    YOUR EVENT QR CODE
                  </p>

                  <p className="mt-1 text-xs text-neutral-500">
                    Keep this QR code ready for event check-in.
                  </p>

                </div>
              )}
                  <button
                    type="button"
                    onClick={resetInvitation}
                    className="button button-ghost full mt-6 w-full"
                  >
                    USE ANOTHER NUMBER
                  </button>

                </div>

              ) : (

                /* =========================
                  STEP 2 — CONFIRM
                  ========================= */

                <form
                  onSubmit={confirmAttendance}
                  className="space-y-5"
                >

                  <div className="form-head">
                    <p>INVITATION FOUND</p>
                    <h3>
                      Welcome, {guest.fullName}
                    </h3>
                  </div>

                  <div className="
                    rounded-2xl
                    border border-neutral-200
                    bg-neutral-50
                    p-5
                  ">

                    <span className="block text-xs font-semibold tracking-[0.18em] text-neutral-500">
                      INVITATION ID
                    </span>

                    <strong className="mt-2 block text-2xl text-neutral-900">
                      {guest.invitationCode}
                    </strong>

                    <span className="mt-4 block text-sm text-neutral-500">
                      02 OCT 2026
                    </span>

                    <span className="mt-1 block text-sm font-medium text-neutral-700">
                      THE NILE RITZ-CARLTON, CAIRO
                    </span>

                  </div>

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
                      I agree to receive event confirmation
                      and event-related communication.
                    </span>

                  </label>

                  {serverError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                      {serverError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="
                      button button-primary full
                      w-full transition
                      active:scale-[0.98]
                      disabled:cursor-not-allowed
                      disabled:opacity-60
                    "
                  >
                    {loading
                      ? 'CONFIRMING...'
                      : 'CONFIRM MY ATTENDANCE'}
                  </button>

                  <button
                    type="button"
                    onClick={resetInvitation}
                    disabled={loading}
                    className="button button-ghost full w-full"
                  >
                    USE ANOTHER NUMBER
                  </button>

                </form>

              )

            ) : (

              /* =========================
                CONFIRMATION SUCCESS
                ========================= */

              <div className="success-state">

                <div className="success-icon">
                  <Check />
                </div>

                <p className="success-kicker">
                  YOU’RE IN
                </p>

                <h3>
                  Thank you{guest ? `, ${guest.fullName}` : ''}.
                </h3>

                <p>
                  Your attendance at شمسك جواك has been confirmed.
                </p>

                <div className="ticket">
                  <span>02 OCT 2026</span>
                  <strong>THE NILE RITZ-CARLTON</strong>
                  <small>CAIRO</small>
                </div>

                {guest?.invitationCode && (
                  <div className="mt-6">

                    <span className="block text-xs tracking-[0.2em] text-neutral-500">
                      INVITATION ID
                    </span>

                    <strong className="mt-1 block text-2xl">
                      {guest.invitationCode}
                    </strong>

                  </div>
                )}

                {guest?.qrToken && (
  <div className="mt-8 flex flex-col items-center">

                  <div className="rounded-2xl bg-white p-4 shadow-md">
                    <QRCodeSVG
                      value={getCheckInUrl(guest.qrToken)}
                      size={190}
                      level="H"
                      includeMargin
                    />
                  </div>

                  <p className="mt-4 text-sm font-semibold text-neutral-800">
                    YOUR EVENT QR CODE
                  </p>

                  <p className="mt-1 max-w-xs text-center text-xs leading-relaxed text-neutral-500">
                    Keep this QR code ready for check-in at the event.
                  </p>

                </div>
              )}

              </div>

            )}

          </div>
        </div>
      </section>

      <footer>
        <div className="shell footer-inner">
          <img src="/assets/limitless_black.png" alt="Limitless Naturals" />
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
