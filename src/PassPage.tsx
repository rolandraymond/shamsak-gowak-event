import { useEffect, useState } from 'react'
import { CalendarDays, Check, LoaderCircle, MapPin } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

type PassGuest = {
  fullName: string
  invitationCode: string | null
  rsvpStatus: string
  isVip: boolean
}

export default function PassPage() {
  const [guest, setGuest] = useState<PassGuest | null>(null)
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const qrToken = params.get('token')

    if (!qrToken) {
      setError('Invalid event pass.')
      setLoading(false)
      return
    }

    setToken(qrToken)

    const loadPass = async () => {
      try {
        const response = await fetch(
          `/api/check-in?token=${encodeURIComponent(qrToken)}`
        )

        const data = await response.json()

        if (!response.ok) {
          setError(data.error || 'Invalid event pass.')
          return
        }

        setGuest(data.guest)
      } catch (error) {
        console.error(error)
        setError('Unable to load your event pass.')
      } finally {
        setLoading(false)
      }
    }

    loadPass()
  }, [])

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0b0a08] text-white">
        <LoaderCircle className="animate-spin" size={38} />
      </main>
    )
  }

  if (error || !guest) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0b0a08] px-5">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center">
          <h1 className="text-2xl font-semibold text-neutral-900">
            Invalid Event Pass
          </h1>

          <p className="mt-3 text-sm text-neutral-500">
            {error}
          </p>
        </div>
      </main>
    )
  }

  const checkInUrl =
    `${window.location.origin}/check-in?token=${encodeURIComponent(token)}`

  return (
    <main className="min-h-screen bg-[#0b0a08] px-5 py-10">

      <div className="mx-auto max-w-md rounded-[32px] bg-[#fffaf3] p-7 text-center shadow-2xl">

        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
          <Check size={28} />
        </div>

        <p className="mt-5 text-xs font-semibold tracking-[0.28em] text-orange-500">
          EVENT PASS
        </p>

        <h1 className="mt-3 text-3xl font-semibold text-neutral-900">
          {guest.fullName}
        </h1>

        {guest.isVip && (
          <span className="mt-3 inline-block rounded-full bg-amber-100 px-4 py-1.5 text-xs font-semibold text-amber-700">
            VIP GUEST
          </span>
        )}

        <div className="my-7 border-t border-neutral-200" />

        <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5">

          <div className="flex items-center justify-center gap-2 text-sm text-neutral-700">
            <CalendarDays size={17} />
            02 OCT 2026
          </div>

          <strong className="mt-3 block text-xl text-neutral-900">
            THE NILE RITZ-CARLTON
          </strong>

          <div className="mt-2 flex items-center justify-center gap-2 text-sm text-neutral-600">
            <MapPin size={16} />
            Cairo
          </div>

        </div>

        <div className="mt-7">

          <p className="text-xs font-semibold tracking-[0.2em] text-neutral-400">
            INVITATION ID
          </p>

          <strong className="mt-2 block text-2xl text-neutral-900">
            {guest.invitationCode}
          </strong>

        </div>

        <div className="mt-7 flex justify-center">

          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <QRCodeSVG
              value={checkInUrl}
              size={210}
              level="H"
              includeMargin
            />
          </div>

        </div>

        <p className="mt-5 text-sm font-semibold text-neutral-800">
          YOUR EVENT QR CODE
        </p>

        <p className="mt-2 text-xs leading-relaxed text-neutral-500">
          Present this QR code at the event entrance.
        </p>

      </div>

    </main>
  )
}