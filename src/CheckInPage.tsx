import { useEffect, useState } from 'react'
import { Check, CircleAlert, LoaderCircle, MapPin } from 'lucide-react'

type CheckInGuest = {
  id: number
  fullName: string
  invitationCode: string | null
  rsvpStatus: string
  isVip: boolean
  tableNumber: number | null
  seatNumber: number | null
  checkedIn: boolean
  checkedInAt: string | null
}

export default function CheckInPage() {
  const [guest, setGuest] = useState<CheckInGuest | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')

    if (!token) {
      setError('QR token is missing.')
      setLoading(false)
      return
    }

    const loadGuest = async () => {
      try {
        const response = await fetch(
          `/api/check-in?token=${encodeURIComponent(token)}`
        )

        const data = await response.json()

        if (!response.ok) {
          setError(data.error || 'Invalid event QR code.')
          return
        }

        setGuest(data.guest)
      } catch (error) {
        console.error(error)
        setError('Unable to verify this QR code.')
      } finally {
        setLoading(false)
      }
    }

    loadGuest()
  }, [])

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-950 text-white">
        <div className="text-center">
          <LoaderCircle
            className="mx-auto animate-spin"
            size={38}
          />

          <p className="mt-4 text-sm text-neutral-400">
            Verifying event pass...
          </p>
        </div>
      </main>
    )
  }

  if (error || !guest) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-6">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center">
          <CircleAlert
            className="mx-auto text-red-500"
            size={48}
          />

          <h1 className="mt-5 text-2xl font-semibold text-neutral-900">
            Invalid QR Code
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-neutral-500">
            {error || 'This event pass could not be verified.'}
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#0b0a08] px-5 py-12">

      <div className="mx-auto max-w-md">

        <div className="rounded-3xl bg-white p-7 shadow-2xl">

          <div className="text-center">

            <div
              className={`
                mx-auto flex h-14 w-14
                items-center justify-center
                rounded-full
                ${
                  guest.checkedIn
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-green-100 text-green-600'
                }
              `}
            >
              <Check size={28} />
            </div>

            <p className="mt-5 text-xs font-semibold tracking-[0.25em] text-orange-500">
              {guest.checkedIn
                ? 'ALREADY CHECKED IN'
                : 'VALID EVENT PASS'}
            </p>

            <h1 className="mt-3 text-3xl font-semibold text-neutral-900">
              {guest.fullName}
            </h1>

            <p className="mt-2 text-sm text-neutral-500">
              {guest.invitationCode}
            </p>

          </div>

          <div className="my-7 h-px bg-neutral-200" />

          <div className="space-y-4">

            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-500">
                RSVP
              </span>

              <strong className="text-sm uppercase text-green-600">
                {guest.rsvpStatus}
              </strong>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-500">
                Guest type
              </span>

              <strong className="text-sm text-neutral-900">
                {guest.isVip ? 'VIP' : 'Guest'}
              </strong>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-500">
                Table
              </span>

              <strong className="text-sm text-neutral-900">
                {guest.tableNumber ?? 'Not assigned'}
              </strong>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-500">
                Seat
              </span>

              <strong className="text-sm text-neutral-900">
                {guest.seatNumber ?? 'Not assigned'}
              </strong>
            </div>

          </div>

          <div className="my-7 h-px bg-neutral-200" />

          {guest.checkedIn ? (
            <div className="rounded-2xl bg-blue-50 p-5 text-center">

              <p className="font-semibold text-blue-700">
                Guest already checked in
              </p>

              {guest.checkedInAt && (
                <p className="mt-1 text-xs text-blue-500">
                  {guest.checkedInAt}
                </p>
              )}

            </div>
          ) : (
            <div className="rounded-2xl bg-green-50 p-5 text-center">

              <p className="font-semibold text-green-700">
                Ready for check-in
              </p>

              <p className="mt-1 text-xs text-green-600">
                Valid confirmed registration
              </p>

            </div>
          )}

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-neutral-400">
            <MapPin size={14} />
            The Nile Ritz-Carlton, Cairo
          </div>

        </div>

      </div>

    </main>
  )
}