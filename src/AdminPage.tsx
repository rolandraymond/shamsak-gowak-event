import { FormEvent, useEffect, useState } from 'react'
import {
  CheckCircle2,
  Clock3,
  Crown,
  LoaderCircle,
  LogOut,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
  X,
Armchair,
} from 'lucide-react'

type TableGuest = {
  id: number
  invitationCode: string | null
  fullName: string
  phone: string
  email: string | null
  isVip: boolean
  seatNumber: number
  checkedIn: boolean
}

type TableDetails = {
  tableNumber: number
  capacity: number
  tableType: 'regular' | 'vip'
  isActive: boolean
  assigned: number
  available: number
  guests: TableGuest[]
}

type EventTable = {
  tableNumber: number
  capacity: number
  tableType: 'regular' | 'vip'
  isActive: boolean
  assigned: number
  available: number
  checkedIn: number
}
type DashboardStats = {
  totalRegistered: number
  confirmed: number
  checkedIn: number
  vip: number
  notCheckedIn: number
}

type AdminGuest = {
  id: number
  invitationCode: string | null
  fullName: string
  phone: string
  email: string | null
  specialty: string | null
  rsvpStatus: string
  isVip: boolean
  vipLevel: string | null
  tableNumber: number | null
  seatNumber: number | null
  checkedIn: boolean
  checkedInAt: string | null
  createdAt: string
}

export default function AdminPage() {
  const [authLoading, setAuthLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')

  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [guests, setGuests] = useState<AdminGuest[]>([])
  const [dashboardLoading, setDashboardLoading] = useState(false)

  const [search, setSearch] = useState('')
  const [specialtyFilter, setSpecialtyFilter] = useState('')
  const [checkingInId, setCheckingInId] = useState<number | null>(null)
  const [updatingSeatId, setUpdatingSeatId] =
  useState<number | null>(null)

  const [editingSeatGuest, setEditingSeatGuest] =
  useState<AdminGuest | null>(null)

const [editTableNumber, setEditTableNumber] =
  useState('')

const [editSeatNumber, setEditSeatNumber] =
  useState('')

const [seatEditError, setSeatEditError] =
  useState('')
  const [actionError, setActionError] = useState('')
    const [updatingGuestId, setUpdatingGuestId] =
    useState<number | null>(null)

    const [deletingGuestId, setDeletingGuestId] =
    useState<number | null>(null)
  useEffect(() => {
    checkSession()
  }, [])

const [tables, setTables] = useState<EventTable[]>([])
const [tablesLoading, setTablesLoading] = useState(false)

const [updatingTableNumber, setUpdatingTableNumber] =
  useState<number | null>(null)

const [autoAssigning, setAutoAssigning] =
  useState(false)
const [selectedTable, setSelectedTable] =
  useState<TableDetails | null>(null)

const [tableDetailsLoading, setTableDetailsLoading] =
  useState(false)
  const checkSession = async () => {
    try {
      const response = await fetch('/api/admin/me', {
        credentials: 'include',
      })

      if (response.ok) {
        setAuthenticated(true)
        await loadDashboard()
        await loadTables()

      } else {
        setAuthenticated(false)
      }
    } catch (error) {
      console.error(error)
      setAuthenticated(false)
    } finally {
      setAuthLoading(false)
    }
  }

  const login = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    setLoginLoading(true)
    setLoginError('')

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          username,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setLoginError(
          data.error || 'Unable to sign in.'
        )
        return
      }

      setAuthenticated(true)
      setPassword('')

      await loadDashboard()
      await loadTables()

    } catch (error) {
      console.error(error)

      setLoginError(
        'Unable to connect to the server.'
      )
    } finally {
      setLoginLoading(false)
    }
  }

  const loadDashboard = async (
    query = '',
    selectedSpecialty = specialtyFilter
  ) => {
    setDashboardLoading(true)
    setActionError('')

    try {
      const params = new URLSearchParams()

      if (query.trim()) {
        params.set('q', query.trim())
      }

      if (selectedSpecialty) {
        params.set('specialty', selectedSpecialty)
      }

      const url =
        params.toString()
          ? `/api/admin/dashboard?${params.toString()}`
          : '/api/admin/dashboard'

      const response = await fetch(url, {
        credentials: 'include',
      })

      if (response.status === 401) {
        setAuthenticated(false)
        return
      }

      const data = await response.json()

      if (!response.ok) {
        setActionError(
          data.error || 'Unable to load dashboard.'
        )
        return
      }

      setStats(data.stats)
      setGuests(data.guests)
    } catch (error) {
      console.error(error)

      setActionError(
        'Unable to load dashboard.'
      )
    } finally {
      setDashboardLoading(false)
    }
  }

  const loadTables = async () => {
  setTablesLoading(true)

  try {
    const response = await fetch(
      '/api/admin/tables',
      {
        credentials: 'include',
      }
    )

    if (response.status === 401) {
      setAuthenticated(false)
      return
    }

    const data = await response.json()

    if (!response.ok) {
      setActionError(
        data.error ||
          'Unable to load tables.'
      )
      return
    }

    setTables(data.tables)

  } catch (error) {
    console.error(error)

    setActionError(
      'Unable to load tables.'
    )
  } finally {
    setTablesLoading(false)
  }
}
    const openTable = async (
    tableNumber: number
    ) => {
    setTableDetailsLoading(true)
    setActionError('')

    try {
        const response = await fetch(
        `/api/admin/table/${tableNumber}`,
        {
            credentials: 'include',
        }
        )

        if (response.status === 401) {
        setAuthenticated(false)
        return
        }

        const data =
        await response.json()

        if (!response.ok) {
        setActionError(
            data.error ||
            'Unable to load table.'
        )

        return
        }

        setSelectedTable(
        data.table
        )

    } catch (error) {
        console.error(error)

        setActionError(
        'Unable to load table.'
        )
    } finally {
        setTableDetailsLoading(false)
    }
    }

const toggleTableType = async (
  table: EventTable
) => {
  setUpdatingTableNumber(
    table.tableNumber
  )

  setActionError('')

  try {
    const newType =
      table.tableType === 'vip'
        ? 'regular'
        : 'vip'

    const response = await fetch(
      '/api/admin/table/type',
      {
        method: 'POST',

        headers: {
          'Content-Type':
            'application/json',
        },

        credentials: 'include',

        body: JSON.stringify({
          tableNumber:
            table.tableNumber,

          tableType:
            newType,
        }),
      }
    )

    const data =
      await response.json()

    if (!response.ok) {
      setActionError(
        data.error ||
          'Unable to update table.'
      )
      return
    }

    await loadTables()

  } catch (error) {
    console.error(error)

    setActionError(
      'Unable to update table.'
    )
  } finally {
    setUpdatingTableNumber(null)
  }
}


const autoAssignTables = async () => {
  const confirmed =
    window.confirm(
      'Auto assign all unlocked confirmed guests to tables?'
    )

  if (!confirmed) {
    return
  }

  setAutoAssigning(true)
  setActionError('')

  try {
    const response = await fetch(
      '/api/admin/tables/auto-assign',
      {
        method: 'POST',
        credentials: 'include',
      }
    )

    const data =
      await response.json()

    if (!response.ok) {
      setActionError(
        data.error ||
          'Unable to auto assign tables.'
      )
      return
    }

    await Promise.all([
      loadDashboard(search),
      loadTables(),
    ])

  } catch (error) {
    console.error(error)

    setActionError(
      'Unable to auto assign tables.'
    )
  } finally {
    setAutoAssigning(false)
  }
}

  const searchGuests = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault()
    await loadDashboard(search)
  }

  const clearSearch = async () => {
    setSearch('')
    await loadDashboard('')
  }

  const changeSpecialtyFilter = async (value: string) => {
    setSpecialtyFilter(value)
    await loadDashboard(search, value)
  }

  const checkInGuest = async (guest: AdminGuest) => {
    if (guest.checkedIn) {
      return
    }

    const confirmed = window.confirm(
      `Check in ${guest.fullName}?`
    )

    if (!confirmed) {
      return
    }

    setCheckingInId(guest.id)
    setActionError('')

    try {
      const response = await fetch(
        '/api/admin/check-in',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            guestId: guest.id,
          }),
        }
      )

      const data = await response.json()

      if (response.status === 401) {
        setAuthenticated(false)
        return
      }

      if (!response.ok) {
        if (data.code === 'ALREADY_CHECKED_IN') {
await Promise.all([
  loadDashboard(search),
  loadTables(),
])

          return
        }

        setActionError(
          data.error || 'Unable to check in guest.'
        )
        return
      }

await Promise.all([
  loadDashboard(search),
  loadTables(),
])
    } catch (error) {
      console.error(error)

      setActionError(
        'Unable to check in guest.'
      )
    } finally {
      setCheckingInId(null)
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
        credentials: 'include',
      })
    } finally {
      setAuthenticated(false)
      setStats(null)
      setGuests([])
      setUsername('')
      setPassword('')
    }
  }

  const formatCheckInTime = (value: string | null) => {
    if (!value) {
      return '—'
    }

    return new Intl.DateTimeFormat('en-EG', {
      timeZone: 'Africa/Cairo',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value))
  }

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0b0a08] text-white">
        <div className="text-center">
          <LoaderCircle
            size={38}
            className="mx-auto animate-spin"
          />

          <p className="mt-4 text-sm text-neutral-400">
            Loading admin...
          </p>
        </div>
      </main>
    )
  }

  if (!authenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0b0a08] px-5">

        <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">

          <div className="text-center">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 text-orange-600">
              <ShieldCheck size={28} />
            </div>

            <p className="mt-5 text-xs font-semibold tracking-[0.22em] text-orange-500">
              EVENT ADMIN
            </p>

            <h1 className="mt-2 text-3xl font-semibold text-neutral-900">
              Admin Login
            </h1>

            <p className="mt-2 text-sm text-neutral-500">
              شمسك جواك • Event Management
            </p>

          </div>

          <form
            onSubmit={login}
            className="mt-8 space-y-5"
          >

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-neutral-700">
                Username
              </span>

              <input
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value)
                }
                autoComplete="username"
                className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                placeholder="Admin username"
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-neutral-700">
                Password
              </span>

              <input
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                autoComplete="current-password"
                className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                placeholder="Password"
                required
              />
            </label>

            {loginError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full rounded-xl bg-neutral-950 px-5 py-3.5 font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50"
            >
              {loginLoading
                ? 'SIGNING IN...'
                : 'SIGN IN'}
            </button>

          </form>

        </div>

      </main>
    )
  }
 const openSeatEditor = (guest: AdminGuest) => {
  setEditingSeatGuest(guest)

  setEditTableNumber(
    guest.tableNumber?.toString() || ''
  )

  setEditSeatNumber(
    guest.seatNumber?.toString() || ''
  )

  setSeatEditError('')
}

const saveGuestSeat = async (
  e: FormEvent<HTMLFormElement>
) => {
  e.preventDefault()

  if (!editingSeatGuest) {
    return
  }

  const tableNumber = Number(editTableNumber)
  const seatNumber = Number(editSeatNumber)

  if (!editTableNumber) {
    setSeatEditError('Please select a table.')
    return
  }

  if (!editSeatNumber) {
    setSeatEditError('Please select a seat.')
    return
  }

  setUpdatingSeatId(editingSeatGuest.id)
  setSeatEditError('')

  try {
    const response = await fetch(
      '/api/admin/guest/seat',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          guestId: editingSeatGuest.id,
          tableNumber,
          seatNumber,
        }),
      }
    )

    const data = await response.json()

    if (response.status === 401) {
      setAuthenticated(false)
      return
    }

    if (!response.ok) {
      setSeatEditError(
        data.error || 'Unable to update guest seat.'
      )
      return
    }

    setEditingSeatGuest(null)

    await Promise.all([
      loadDashboard(search, specialtyFilter),
      loadTables(),
    ])

  } catch (error) {
    console.error(error)

    setSeatEditError(
      'Unable to update guest seat.'
    )
  } finally {
    setUpdatingSeatId(null)
  }
}
const toggleVip = async (guest: AdminGuest) => {
  setUpdatingGuestId(guest.id)
  setActionError('')

  try {
    const response = await fetch(
      '/api/admin/guest/vip',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          guestId: guest.id,
          isVip: !guest.isVip,
        }),
      }
    )

    const data = await response.json()

    if (response.status === 401) {
      setAuthenticated(false)
      return
    }

    if (!response.ok) {
      setActionError(
        data.error ||
          'Unable to update VIP status.'
      )
      return
    }

    await loadDashboard(
      search,
      specialtyFilter
    )

  } catch (error) {
    console.error(error)

    setActionError(
      'Unable to update VIP status.'
    )
  } finally {
    setUpdatingGuestId(null)
  }
}
const deleteGuest = async (guest: AdminGuest) => {
  const confirmed = window.confirm(
    `Delete ${guest.fullName} (${guest.invitationCode}) permanently?`
  )

  if (!confirmed) {
    return
  }

  setDeletingGuestId(guest.id)
  setActionError('')

  try {
    const response = await fetch(
      `/api/admin/guest/${guest.id}`,
      {
        method: 'DELETE',
        credentials: 'include',
      }
    )

    const data = await response.json()

    if (!response.ok) {
      setActionError(
        data.error || 'Unable to delete guest.'
      )
      return
    }

await Promise.all([
  loadDashboard(search),
  loadTables(),
])
  } catch (error) {
    console.error(error)

    setActionError(
      'Unable to delete guest.'
    )
  } finally {
    setDeletingGuestId(null)
  }
}

  return (
    <main className="min-h-screen bg-[#f5f5f3]">

      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-5 py-5 lg:px-8">

          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-orange-500">
              شمسك جواك
            </p>

            <h1 className="mt-1 text-2xl font-semibold text-neutral-900">
              Event Dashboard
            </h1>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-2 rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
          >
            <LogOut size={17} />
            Logout
          </button>

        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-5 py-8 lg:px-8">

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">

          <StatCard
            title="Total Registered"
            value={stats?.totalRegistered ?? 0}
            icon={<Users size={22} />}
          />

          <StatCard
            title="Confirmed"
            value={stats?.confirmed ?? 0}
            icon={<CheckCircle2 size={22} />}
          />

          <StatCard
            title="Checked In"
            value={stats?.checkedIn ?? 0}
            icon={<UserCheck size={22} />}
          />

          <StatCard
            title="VIP"
            value={stats?.vip ?? 0}
            icon={<Crown size={22} />}
          />

          <StatCard
            title="Not Checked In"
            value={stats?.notCheckedIn ?? 0}
            icon={<Clock3 size={22} />}
          />

        </div>

        <div className="mt-8 rounded-3xl border border-neutral-200 bg-white shadow-sm">

          <div className="border-b border-neutral-200 p-5 lg:p-6">

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

              <div>
                <h2 className="text-xl font-semibold text-neutral-900">
                  Guests
                </h2>

                <p className="mt-1 text-sm text-neutral-500">
                  Search and manage event attendance.
                </p>
              </div>

              <form
                onSubmit={searchGuests}
                className="flex w-full flex-col gap-2 sm:flex-row lg:max-w-3xl"
              >

                <div className="relative flex-1">

                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                  />

                  <input
                    value={search}
                    onChange={(e) =>
                      setSearch(e.target.value)
                    }
                    placeholder="Name, phone, email, specialty or invitation ID"
                    className="w-full rounded-xl border border-neutral-300 py-3 pl-10 pr-4 text-sm outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                  />

                </div>

                <select
                  value={specialtyFilter}
                  onChange={(e) =>
                    changeSpecialtyFilter(e.target.value)
                  }
                  className="rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                >
                  <option value="">All specialties</option>
                  <option value="Influencer">Influencer</option>
                  <option value="Nutritionist">Nutritionist</option>
                  <option value="Orthopedics">Orthopedics</option>
                  <option value="Internist">Internist</option>                  
                  <option value="Gynecologist">Gynecologist</option>
                  <option value="Dermatologist">Dermatologist</option>
                  <option value="Pharmacist">Pharmacist</option>
                </select>

                <button
                  type="submit"
                  className="rounded-xl bg-neutral-950 px-5 text-sm font-semibold text-white"
                >
                  Search
                </button>

                {search && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="rounded-xl border border-neutral-300 px-4 text-sm"
                  >
                    Clear
                  </button>
                )}

              </form>

            </div>

            {actionError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {actionError}
              </div>
            )}

          </div>

          <div className="overflow-hidden">

              <table className="w-full table-fixed">

                <colgroup>
                  <col className="w-[9%]" />
                  <col className="w-[8%]" />
                  <col className="w-[15%]" />
                  <col className="w-[10%]" />
                  <col className="w-[6%]" />
                  <col className="w-[8%]" />
                  <col className="w-[11%]" />
                  <col className="w-[10%]" />
                  <col className="w-[23%]" />
                </colgroup>

              <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wider text-neutral-500">

            <tr>
            <th className="px-3 py-4">Guest</th>
            <th className="px-3 py-4">Invitation</th>
            <th className="px-3 py-4">Contact</th>
            <th className="px-3 py-4">Specialty</th>
            <th className="px-3 py-4">Type</th>
            <th className="px-3 py-4">RSVP</th>
            <th className="px-3 py-4">Table / Seat</th>
            <th className="px-3 py-4">Check-in</th>
            <th className="px-2 py-4">Action</th>
            </tr>

              </thead>

              <tbody className="divide-y divide-neutral-100">

                {dashboardLoading ? (

                  <tr>
                    <td
                      colSpan={9}
                      className="px-6 py-16 text-center"
                    >
                      <LoaderCircle
                        className="mx-auto animate-spin text-neutral-400"
                        size={28}
                      />

                      <p className="mt-3 text-sm text-neutral-500">
                        Loading guests...
                      </p>
                    </td>
                  </tr>

                ) : guests.length === 0 ? (

                  <tr>
                    <td
                      colSpan={9}
                      className="px-6 py-16 text-center text-neutral-500"
                    >
                      No guests found.
                    </td>
                  </tr>

                ) : (
guests.map((guest) => (

  <tr
    key={guest.id}
    className="hover:bg-neutral-50/70"
  >

    {/* GUEST */}
    <td className="px-6 py-4">
      <strong className="block text-sm text-neutral-900">
        {guest.fullName}
      </strong>

      <span className="mt-1 block text-xs text-neutral-400">
        ID #{guest.id}
      </span>
    </td>


    {/* INVITATION */}
    <td className="px-6 py-4 text-sm font-semibold text-neutral-800">
      {guest.invitationCode || '—'}
    </td>


    {/* CONTACT */}
    <td className="px-6 py-4">

      <span className="block text-sm text-neutral-700">
        {guest.phone}
      </span>

      <span className="mt-1 block text-xs text-neutral-400">
        {guest.email || '—'}
      </span>

    </td>


    {/* SPECIALTY */}
    <td className="px-6 py-4 text-sm text-neutral-700">
      {guest.specialty || '—'}
    </td>


    {/* TYPE */}
    <td className="px-6 py-4">

      {guest.isVip ? (
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
          VIP
        </span>
      ) : (
        <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">
          Guest
        </span>
      )}

    </td>


    {/* RSVP */}
    <td className="px-6 py-4">

      <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold uppercase text-green-700">
        {guest.rsvpStatus}
      </span>

    </td>


{/* TABLE / SEAT */}
<td className="px-6 py-4">
  {guest.tableNumber !== null &&
  guest.seatNumber !== null ? (
    <div>
      <span className="block text-sm font-semibold text-neutral-900">
        Table{' '}
        {String(guest.tableNumber).padStart(2, '0')}
      </span>

      <span className="mt-1 block text-xs text-neutral-500">
        Seat {guest.seatNumber}
      </span>
    </div>
  ) : (
    <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-500">
      Not assigned
    </span>
  )}

  <button
    type="button"
    disabled={updatingSeatId === guest.id}
    onClick={() => openSeatEditor(guest)}
    className="
      mt-3
      block
      whitespace-nowrap
      rounded-lg
      bg-blue-50
      px-3 py-1.5
      text-xs
      font-semibold
      text-blue-600
      transition
      hover:bg-blue-600
      hover:text-white
      disabled:cursor-not-allowed
      disabled:opacity-50
    "
  >
    {updatingSeatId === guest.id
      ? 'UPDATING...'
      : guest.tableNumber !== null &&
          guest.seatNumber !== null
        ? 'CHANGE SEAT'
        : 'ASSIGN SEAT'}
  </button>
</td>



 {/* CHECK-IN STATUS */}
<td className="px-6 py-4">
  {guest.checkedIn ? (
    <div>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
        <CheckCircle2 size={14} />
        Checked in
      </span>

      <span className="mt-2 block text-[11px] text-neutral-400">
        {formatCheckInTime(guest.checkedInAt)}
      </span>
    </div>
  ) : (
    <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-600">
      Waiting
    </span>
  )}
</td>




  {/* ACTION */}
<td className="min-w-[280px] px-4 py-4">
  <div className="flex flex-wrap items-center gap-2">

    {/* VIP */}
    <button
      type="button"
      disabled={updatingGuestId === guest.id}
      onClick={() => toggleVip(guest)}
      className={`
        min-w-[105px]
        whitespace-nowrap
        rounded-xl
        px-3 py-2
        text-xs font-semibold
        transition
        disabled:cursor-not-allowed
        disabled:opacity-50
        ${
          guest.isVip
            ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
            : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
        }
      `}
    >
      {updatingGuestId === guest.id
        ? 'UPDATING...'
        : guest.isVip
          ? 'REMOVE VIP'
          : 'MAKE VIP'}
    </button>

    {/* CHECK IN */}
    {!guest.checkedIn ? (
      <button
        type="button"
        disabled={
          checkingInId === guest.id ||
          guest.rsvpStatus !== 'confirmed'
        }
        onClick={() => checkInGuest(guest)}
        className="
          min-w-[90px]
          whitespace-nowrap
          rounded-xl
          bg-neutral-950
          px-3 py-2
          text-xs
          font-semibold
          text-white
          transition
          hover:bg-green-600
          disabled:cursor-not-allowed
          disabled:opacity-40
        "
      >
        {checkingInId === guest.id
          ? 'CHECKING...'
          : 'CHECK IN'}
      </button>
    ) : (
      <span
        className="
          inline-flex
          min-w-[105px]
          items-center
          justify-center
          whitespace-nowrap
          rounded-xl
          bg-green-50
          px-3 py-2
          text-xs
          font-semibold
          text-green-600
        "
      >
        ✓ CHECKED IN
      </span>
    )}

    {/* DELETE */}
    <button
      type="button"
      disabled={deletingGuestId === guest.id}
      onClick={() => deleteGuest(guest)}
      className="
        min-w-[70px]
        whitespace-nowrap
        rounded-xl
        bg-red-50
        px-3 py-2
        text-xs
        font-semibold
        text-red-600
        transition
        hover:bg-red-600
        hover:text-white
        disabled:cursor-not-allowed
        disabled:opacity-50
      "
    >
      {deletingGuestId === guest.id
        ? '...'
        : 'DELETE'}
    </button>

  </div>
</td>

  </tr>

))

)}

              </tbody>

            </table>

          </div>

        </div>

        {/* =====================================================
    TABLES
===================================================== */}

<div className="mt-8 rounded-3xl border border-neutral-200 bg-white shadow-sm">

  <div className="flex flex-col gap-4 border-b border-neutral-200 p-5 lg:flex-row lg:items-center lg:justify-between lg:p-6">

    <div>
      <p className="text-xs font-semibold tracking-[0.2em] text-orange-500">
        EVENT SEATING
      </p>

      <h2 className="mt-1 text-xl font-semibold text-neutral-900">
        Tables
      </h2>

      <p className="mt-1 text-sm text-neutral-500">
        95 tables • 7 seats per table
      </p>
    </div>

    <button
      type="button"
      disabled={autoAssigning}
      onClick={autoAssignTables}
      className="
        rounded-xl
        bg-neutral-950
        px-5 py-3
        text-sm
        font-semibold
        text-white
        transition
        hover:bg-orange-500
        disabled:cursor-not-allowed
        disabled:opacity-50
      "
    >
      {autoAssigning
        ? 'ASSIGNING...'
        : 'AUTO ASSIGN TABLES'}
    </button>

  </div>


  <div className="p-5 lg:p-6">

    {tablesLoading ? (

      <div className="py-16 text-center">

        <LoaderCircle
          size={30}
          className="mx-auto animate-spin text-neutral-400"
        />

        <p className="mt-3 text-sm text-neutral-500">
          Loading tables...
        </p>

      </div>

    ) : (

      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">

        {tables.map((table) => {

          const full =
            table.available === 0

          return (
            <div
            key={table.tableNumber}

            role="button"
            tabIndex={0}

            onClick={() =>
                openTable(table.tableNumber)
            }

            onKeyDown={(e) => {
                if (
                e.key === 'Enter' ||
                e.key === ' '
                ) {
                openTable(
                    table.tableNumber
                )
                }
            }}

            className={`
                cursor-pointer
                rounded-2xl
                border
                p-4
                transition
                hover:-translate-y-0.5
                hover:shadow-md

                ${
                table.tableType === 'vip'
                    ? 'border-amber-200 bg-amber-50'
                    : 'border-neutral-200 bg-white'
                }
            `}
            >



              <div className="flex items-start justify-between">

                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                    Table
                  </span>

                  <strong className="mt-1 block text-2xl text-neutral-900">
                    {String(
                      table.tableNumber
                    ).padStart(2, '0')}
                  </strong>
                </div>


                <span
                  className={`
                    rounded-full
                    px-2.5 py-1
                    text-[10px]
                    font-semibold
                    uppercase
                    ${
                      table.tableType === 'vip'
                        ? 'bg-amber-200 text-amber-800'
                        : 'bg-neutral-100 text-neutral-600'
                    }
                  `}
                >
                  {table.tableType}
                </span>

              </div>


              <div className="mt-5">

                <div className="flex items-end justify-between">
                  <span className="text-sm text-neutral-500">
                    Occupancy
                  </span>

                  <strong className="text-lg text-neutral-900">
                    {table.assigned}/{table.capacity}
                  </strong>
                </div>


                <div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-200">

                  <div
                    className={`
                      h-full rounded-full
                      ${
                        full
                          ? 'bg-red-500'
                          : table.tableType === 'vip'
                            ? 'bg-amber-500'
                            : 'bg-green-500'
                      }
                    `}
                    style={{
                      width: `${Math.min(
                        100,
                        (
                          table.assigned /
                          table.capacity
                        ) * 100
                      )}%`,
                    }}
                  />

                </div>


                <div className="mt-3 flex justify-between text-xs text-neutral-500">
                  <span>
                    {table.available} available
                  </span>

                  <span>
                    {table.checkedIn} checked in
                  </span>
                </div>

              </div>


              <button
                type="button"
                disabled={
                  updatingTableNumber ===
                  table.tableNumber
                }
              onClick={(e) => {
                e.stopPropagation()
                toggleTableType(table)
                }}
                className={`
                  mt-4 w-full
                  rounded-xl
                  px-3 py-2
                  text-xs
                  font-semibold
                  transition
                  disabled:opacity-50
                  ${
                    table.tableType === 'vip'
                      ? 'bg-white text-neutral-700 hover:bg-neutral-100'
                      : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                  }
                `}
              >
                {updatingTableNumber ===
                table.tableNumber
                  ? 'UPDATING...'
                  : table.tableType === 'vip'
                    ? 'MAKE REGULAR'
                    : 'MAKE VIP'}
              </button>

            </div>
          )
        })}

      </div>

    )}

  </div>

</div>


{(selectedTable || tableDetailsLoading) && (
  <div
    className="
      fixed inset-0 z-50
      flex items-center justify-center
      bg-black/50
      px-4 py-8
      backdrop-blur-sm
    "
    onClick={() => setSelectedTable(null)}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      className="
        max-h-[90vh]
        w-full
        max-w-2xl
        overflow-y-auto
        rounded-3xl
        bg-white
        shadow-2xl
      "
    >
      {tableDetailsLoading ? (
        <div className="py-24 text-center">
          <LoaderCircle
            size={34}
            className="mx-auto animate-spin text-neutral-400"
          />

          <p className="mt-3 text-sm text-neutral-500">
            Loading table...
          </p>
        </div>
      ) : selectedTable ? (
        <>
          <div className="flex items-start justify-between border-b border-neutral-200 p-6">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-orange-500">
                EVENT SEATING
              </p>

              <div className="mt-2 flex items-center gap-3">
                <h2 className="text-3xl font-semibold text-neutral-900">
                  Table {String(selectedTable.tableNumber).padStart(2, '0')}
                </h2>

                <span
                  className={`
                    rounded-full px-3 py-1
                    text-xs font-semibold uppercase
                    ${
                      selectedTable.tableType === 'vip'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-neutral-100 text-neutral-600'
                    }
                  `}
                >
                  {selectedTable.tableType}
                </span>
              </div>

              <p className="mt-2 text-sm text-neutral-500">
                {selectedTable.assigned}/{selectedTable.capacity} seats occupied
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSelectedTable(null)}
              className="rounded-xl p-2 text-neutral-500 hover:bg-neutral-100"
            >
              <X size={22} />
            </button>
          </div>

          <div className="space-y-3 p-6">
            {Array.from(
              { length: selectedTable.capacity },
              (_, index) => {
                const seatNumber = index + 1

                const seatGuest =
                  selectedTable.guests.find(
                    (item) =>
                      item.seatNumber === seatNumber
                  )

                return (
                  <div
                    key={seatNumber}
                    className={`
                      flex items-center justify-between
                      rounded-2xl border p-4
                      ${
                        seatGuest
                          ? 'border-neutral-200 bg-white'
                          : 'border-dashed border-neutral-200 bg-neutral-50'
                      }
                    `}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`
                          flex h-11 w-11
                          items-center justify-center
                          rounded-xl
                          ${
                            seatGuest
                              ? 'bg-neutral-950 text-white'
                              : 'bg-neutral-200 text-neutral-500'
                          }
                        `}
                      >
                        <Armchair size={20} />
                      </div>

                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                          Seat {seatNumber}
                        </span>

                        {seatGuest ? (
                          <>
                            <strong className="mt-1 block text-sm text-neutral-900">
                              {seatGuest.fullName}
                            </strong>

                            <span className="mt-1 block text-xs text-neutral-500">
                              {seatGuest.invitationCode}
                            </span>
                          </>
                        ) : (
                          <span className="mt-1 block text-sm text-neutral-400">
                            Empty seat
                          </span>
                        )}
                      </div>
                    </div>

                    {seatGuest && (
                      <div className="flex items-center gap-2">
                        {seatGuest.isVip && (
                          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-semibold text-amber-700">
                            VIP
                          </span>
                        )}

                        {seatGuest.checkedIn && (
                          <span className="rounded-full bg-green-100 px-2.5 py-1 text-[10px] font-semibold text-green-700">
                            CHECKED IN
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )
              }
            )}
          </div>
        </>
      ) : null}
    </div>
  </div>
)}

      </div>


      {editingSeatGuest && (
  <div
    className="
      fixed inset-0 z-[60]
      flex items-center justify-center
      bg-black/50
      px-4
      backdrop-blur-sm
    "
    onClick={() => {
      if (!updatingSeatId) {
        setEditingSeatGuest(null)
      }
    }}
  >
    <form
      onSubmit={saveGuestSeat}
      onClick={(e) => e.stopPropagation()}
      className="
        w-full max-w-md
        rounded-3xl
        bg-white
        p-6
        shadow-2xl
      "
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-orange-500">
            SEAT MANAGEMENT
          </p>

          <h2 className="mt-2 text-2xl font-semibold text-neutral-900">
            Assign Table & Seat
          </h2>

          <p className="mt-1 text-sm text-neutral-500">
            {editingSeatGuest.fullName}
          </p>
        </div>

        <button
          type="button"
          disabled={Boolean(updatingSeatId)}
          onClick={() => setEditingSeatGuest(null)}
          className="
            rounded-xl p-2
            text-neutral-400
            transition
            hover:bg-neutral-100
            hover:text-neutral-900
          "
        >
          <X size={21} />
        </button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-neutral-700">
            Table
          </span>

          <select
            value={editTableNumber}
            onChange={(e) => {
              setEditTableNumber(e.target.value)
              setSeatEditError('')
            }}
            className="
              w-full rounded-xl
              border border-neutral-300
              bg-white px-4 py-3
              text-sm text-neutral-900
              outline-none
              focus:border-orange-500
              focus:ring-4
              focus:ring-orange-500/10
            "
          >
            <option value="">Select table</option>

            {Array.from(
              { length: 95 },
              (_, index) => index + 1
            ).map((tableNumber) => (
              <option
                key={tableNumber}
                value={tableNumber}
              >
                Table {String(tableNumber).padStart(2, '0')}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-neutral-700">
            Seat
          </span>

          <select
            value={editSeatNumber}
            onChange={(e) => {
              setEditSeatNumber(e.target.value)
              setSeatEditError('')
            }}
            className="
              w-full rounded-xl
              border border-neutral-300
              bg-white px-4 py-3
              text-sm text-neutral-900
              outline-none
              focus:border-orange-500
              focus:ring-4
              focus:ring-orange-500/10
            "
          >
            <option value="">Select seat</option>

            {Array.from(
              { length: 7 },
              (_, index) => index + 1
            ).map((seatNumber) => (
              <option
                key={seatNumber}
                value={seatNumber}
              >
                Seat {seatNumber}
              </option>
            ))}
          </select>
        </label>
      </div>

      {seatEditError && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {seatEditError}
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          disabled={Boolean(updatingSeatId)}
          onClick={() => setEditingSeatGuest(null)}
          className="
            flex-1 rounded-xl
            border border-neutral-300
            px-4 py-3
            text-sm font-semibold
            text-neutral-700
            transition
            hover:bg-neutral-100
            disabled:opacity-50
          "
        >
          CANCEL
        </button>

        <button
          type="submit"
          disabled={
            Boolean(updatingSeatId) ||
            !editTableNumber ||
            !editSeatNumber
          }
          className="
            flex-1 rounded-xl
            bg-neutral-950
            px-4 py-3
            text-sm font-semibold
            text-white
            transition
            hover:bg-orange-500
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >
          {updatingSeatId
            ? 'SAVING...'
            : 'SAVE SEAT'}
        </button>
      </div>
    </form>
  </div>
)}

    </main>
  )
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string
  value: number
  icon: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">

      <div className="flex items-center justify-between">

        <span className="text-sm font-medium text-neutral-500">
          {title}
        </span>

        <div className="text-orange-500">
          {icon}
        </div>

      </div>

      <strong className="mt-4 block text-4xl font-semibold tracking-tight text-neutral-900">
        {value}
      </strong>

    </div>
  )
}
