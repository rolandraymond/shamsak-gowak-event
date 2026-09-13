import { sendConfirmationEmail } from './email'
import {
  autoAssignTables,
  getTablesOverview,
  setTableType,
} from './tables'

interface Env {
  DB: D1Database

  ADMIN_USERNAME: string
  ADMIN_PASSWORD: string

  RESEND_API_KEY: string
  EMAIL_FROM: string
  PUBLIC_APP_URL: string
}

interface RSVPBody {
  name?: string
  phone?: string
  email?: string
}

function normalizeEgyptianPhone(phone: string) {
  const cleaned = phone.replace(/[\s-]/g, '')

  if (/^01[0125]\d{8}$/.test(cleaned)) {
    return `+20${cleaned.slice(1)}`
  }

  if (/^\+201[0125]\d{8}$/.test(cleaned)) {
    return cleaned
  }

  return null
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)
}

function isValidName(name: string) {
  // Arabic / English letters + spaces + common name punctuation
  return /^[\p{L}\s.'’\-]+$/u.test(name)
}

function getCookie(request: Request, name: string) {
  const cookie = request.headers.get('Cookie') || ''

  const match = cookie.match(
    new RegExp(`(?:^|; )${name}=([^;]*)`)
  )

  return match ? decodeURIComponent(match[1]) : null
}

async function isAdminAuthenticated(
  request: Request,
  env: Env
) {
  const token = getCookie(request, 'admin_session')

  if (!token) {
    return false
  }

  const session = await env.DB.prepare(`
    SELECT token
    FROM admin_sessions
    WHERE token = ?
      AND expires_at > unixepoch()
    LIMIT 1
  `)
    .bind(token)
    .first()

  return Boolean(session)
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    // =========================================================
    // HEALTH
    // =========================================================

    if (
      request.method === 'GET' &&
      url.pathname === '/api/health'
    ) {
      return Response.json({
        success: true,
        message: 'Shamsak Gowak API is running',
      })
    }

    // =========================================================
    // LOOKUP EXISTING GUEST
    // =========================================================

    if (
      request.method === 'POST' &&
      url.pathname === '/api/invite/lookup'
    ) {
      try {
        const body = await request.json<RSVPBody>()

        const phone = body.phone
          ? normalizeEgyptianPhone(body.phone)
          : null

        if (!phone) {
          return Response.json(
            {
              success: false,
              code: 'INVALID_PHONE',
              error: 'Please enter a valid Egyptian mobile number.',
            },
            { status: 400 }
          )
        }

        const guest = await env.DB.prepare(`
          SELECT
            id,
            invitation_code,
            full_name,
            phone,
            email,
            rsvp_status,
            qr_token,
            is_vip,
            table_number,
            seat_number
          FROM guests
          WHERE phone = ?
          LIMIT 1
        `)
          .bind(phone)
          .first<{
            id: number
            invitation_code: string | null
            full_name: string
            phone: string
            email: string | null
            rsvp_status: string
            qr_token: string | null
            is_vip: number
            table_number: number | null
            seat_number: number | null
          }>()

        if (!guest) {
          return Response.json(
            {
              success: false,
              code: 'GUEST_NOT_FOUND',
              error: 'No existing registration was found.',
            },
            { status: 404 }
          )
        }

        return Response.json({
          success: true,
          guest: {
            id: guest.id,
            fullName: guest.full_name,
            phone: guest.phone,
            email: guest.email,
            invitationCode: guest.invitation_code,
            rsvpStatus: guest.rsvp_status,
            qrToken: guest.qr_token,
            isVip: Boolean(guest.is_vip),
            tableNumber: guest.table_number,
            seatNumber: guest.seat_number,
          },
        })
      } catch (error) {
        console.error('LOOKUP ERROR:', error)

        return Response.json(
          {
            success: false,
            error: 'Something went wrong.',
          },
          { status: 500 }
        )
      }
    }

    // =========================================================
    // REGISTER / CONFIRM RSVP
    // =========================================================

    if (
      request.method === 'POST' &&
      url.pathname === '/api/rsvp'
    ) {
      try {
        const body = await request.json<RSVPBody>()

        const phone = body.phone
          ? normalizeEgyptianPhone(body.phone)
          : null

        if (!phone) {
          return Response.json(
            {
              success: false,
              code: 'INVALID_PHONE',
              error: 'Please enter a valid Egyptian mobile number.',
            },
            { status: 400 }
          )
        }

        // -----------------------------------------------------
        // Check if guest already exists
        // -----------------------------------------------------

        const existingGuest = await env.DB.prepare(`
          SELECT
            id,
            invitation_code,
            full_name,
            phone,
            email,
            rsvp_status,
            qr_token,
            is_vip,
            table_number,
            seat_number
          FROM guests
          WHERE phone = ?
          LIMIT 1
        `)
          .bind(phone)
          .first<{
            id: number
            invitation_code: string | null
            full_name: string
            phone: string
            email: string | null
            rsvp_status: string
            qr_token: string | null
            is_vip: number
            table_number: number | null
            seat_number: number | null
          }>()

        // =====================================================
        // EXISTING GUEST
        // =====================================================

        if (existingGuest) {
          if (existingGuest.rsvp_status === 'confirmed') {
            return Response.json(
              {
                success: false,
                code: 'ALREADY_CONFIRMED',
                error: 'Your attendance has already been confirmed.',
                guest: {
                  id: existingGuest.id,
                  fullName: existingGuest.full_name,
                  phone: existingGuest.phone,
                  email: existingGuest.email,
                  invitationCode: existingGuest.invitation_code,
                  qrToken: existingGuest.qr_token,
                  rsvpStatus: existingGuest.rsvp_status,
                },
              },
              { status: 409 }
            )
          }

          const qrToken =
            existingGuest.qr_token || crypto.randomUUID()

          const invitationCode =
            existingGuest.invitation_code ||
            `SG-${String(existingGuest.id).padStart(4, '0')}`

          await env.DB.prepare(`
            UPDATE guests
            SET
              invitation_code = ?,
              rsvp_status = 'confirmed',
              qr_token = ?,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `)
            .bind(
              invitationCode,
              qrToken,
              existingGuest.id
            )
            .run()


            let emailStatus = 'skipped'

            if (existingGuest.email) {
            emailStatus = 'failed'

            try {
                const emailSent = await sendConfirmationEmail(
                env,
                {
                    fullName: existingGuest.full_name,
                    email: existingGuest.email,
                    invitationCode,
                    qrToken,
                }
                )

                emailStatus = emailSent
                ? 'sent'
                : 'failed'
            } catch (error) {
                console.error(
                'CONFIRMATION EMAIL ERROR:',
                error
                )
            }
            }

            await env.DB.prepare(`
            UPDATE guests
            SET
                email_status = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            `)
            .bind(
                emailStatus,
                existingGuest.id
            )
            .run()

          return Response.json({
            success: true,
            registrationType: 'existing',
            emailStatus,
            guest: {
              id: existingGuest.id,
              fullName: existingGuest.full_name,
              phone: existingGuest.phone,
              email: existingGuest.email,
              invitationCode,
              qrToken,
              rsvpStatus: 'confirmed',
              isVip: Boolean(existingGuest.is_vip),
              tableNumber: existingGuest.table_number,
              seatNumber: existingGuest.seat_number,
            },
          })
        }

        // =====================================================
        // NEW GUEST
        // =====================================================

        const name = body.name?.trim()
        const email = body.email?.trim().toLowerCase()

        if (!name) {
          return Response.json(
            {
              success: false,
              code: 'NAME_REQUIRED',
              error: 'Full name is required.',
            },
            { status: 400 }
          )
        }

        if (name.length < 3 || !isValidName(name)) {
          return Response.json(
            {
              success: false,
              code: 'INVALID_NAME',
              error: 'Please enter a valid full name.',
            },
            { status: 400 }
          )
        }

        if (!email) {
          return Response.json(
            {
              success: false,
              code: 'EMAIL_REQUIRED',
              error: 'Email address is required.',
            },
            { status: 400 }
          )
        }

        if (!isValidEmail(email)) {
          return Response.json(
            {
              success: false,
              code: 'INVALID_EMAIL',
              error: 'Please enter a valid email address.',
            },
            { status: 400 }
          )
        }

        const qrToken = crypto.randomUUID()

        const result = await env.DB.prepare(`
          INSERT INTO guests (
            full_name,
            phone,
            email,
            rsvp_status,
            qr_token
          )
          VALUES (?, ?, ?, 'confirmed', ?)
        `)
          .bind(
            name,
            phone,
            email,
            qrToken
          )
          .run()

        const id = Number(result.meta.last_row_id)

        const invitationCode =
          `SG-${String(id).padStart(4, '0')}`

        await env.DB.prepare(`
          UPDATE guests
          SET
            invitation_code = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `)
          .bind(
            invitationCode,
            id
          )
          .run()

          let emailStatus = 'failed'

        try {
        const emailSent = await sendConfirmationEmail(
            env,
            {
            fullName: name,
            email,
            invitationCode,
            qrToken,
            }
        )

        emailStatus = emailSent
            ? 'sent'
            : 'failed'
        } catch (error) {
        console.error(
            'CONFIRMATION EMAIL ERROR:',
            error
        )
        }

        await env.DB.prepare(`
        UPDATE guests
        SET
            email_status = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        `)
        .bind(
            emailStatus,
            id
        )
  .run()

        return Response.json(
        {
            success: true,
            registrationType: 'new',
            emailStatus,

            guest: {
            id,
            fullName: name,
            phone,
            email,
            invitationCode,
            qrToken,
            rsvpStatus: 'confirmed',
            isVip: false,
            tableNumber: null,
            seatNumber: null,
            },
        },
        { status: 201 }
        )
      } catch (error) {
        console.error('RSVP ERROR:', error)

        return Response.json(
          {
            success: false,
            error: 'Something went wrong.',
          },
          { status: 500 }
        )
      }
    }

// =========================================================
// CHECK-IN LOOKUP
// =========================================================

if (
  request.method === 'GET' &&
  url.pathname === '/api/check-in'
) {
  try {
    const token = url.searchParams.get('token')

    if (!token) {
      return Response.json(
        {
          success: false,
          code: 'TOKEN_REQUIRED',
          error: 'QR token is required.',
        },
        { status: 400 }
      )
    }

    const guest = await env.DB.prepare(`
      SELECT
        id,
        invitation_code,
        full_name,
        phone,
        email,
        rsvp_status,
        qr_token,
        is_vip,
        table_number,
        seat_number,
        checked_in,
        checked_in_at
      FROM guests
      WHERE qr_token = ?
      LIMIT 1
    `)
      .bind(token)
      .first<{
        id: number
        invitation_code: string | null
        full_name: string
        phone: string
        email: string | null
        rsvp_status: string
        qr_token: string
        is_vip: number
        table_number: number | null
        seat_number: number | null
        checked_in: number
        checked_in_at: string | null
      }>()

    if (!guest) {
      return Response.json(
        {
          success: false,
          code: 'INVALID_QR',
          error: 'This QR code is not valid.',
        },
        { status: 404 }
      )
    }

    return Response.json({
      success: true,
      guest: {
        id: guest.id,
        fullName: guest.full_name,
        invitationCode: guest.invitation_code,
        rsvpStatus: guest.rsvp_status,
        isVip: Boolean(guest.is_vip),
        tableNumber: guest.table_number,
        seatNumber: guest.seat_number,
        checkedIn: Boolean(guest.checked_in),
        checkedInAt: guest.checked_in_at,
      },
    })
  } catch (error) {
    console.error('CHECK-IN LOOKUP ERROR:', error)

    return Response.json(
      {
        success: false,
        error: 'Something went wrong.',
      },
      { status: 500 }
    )
  }
}   
    // =========================================================
// ADMIN LOGIN
// =========================================================

if (
  request.method === 'POST' &&
  url.pathname === '/api/admin/login'
) {
  try {
    const body = await request.json<{
      username?: string
      password?: string
    }>()

    if (
      body.username !== env.ADMIN_USERNAME ||
      body.password !== env.ADMIN_PASSWORD
    ) {
      return Response.json(
        {
          success: false,
          error: 'Invalid username or password.',
        },
        { status: 401 }
      )
    }

    const token =
      crypto.randomUUID() +
      crypto.randomUUID().replaceAll('-', '')

    const maxAge = 60 * 60 * 12

    const expiresAt =
      Math.floor(Date.now() / 1000) + maxAge

    await env.DB.prepare(`
      INSERT INTO admin_sessions (
        token,
        expires_at
      )
      VALUES (?, ?)
    `)
      .bind(token, expiresAt)
      .run()

    const secure =
      url.protocol === 'https:' ? '; Secure' : ''

    return new Response(
      JSON.stringify({
        success: true,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie':
            `admin_session=${encodeURIComponent(token)}; ` +
            `HttpOnly; Path=/; SameSite=Strict; ` +
            `Max-Age=${maxAge}${secure}`,
        },
      }
    )
  } catch (error) {
    console.error('ADMIN LOGIN ERROR:', error)

    return Response.json(
      {
        success: false,
        error: 'Something went wrong.',
      },
      { status: 500 }
    )
  }
}


// =========================================================
// ADMIN SESSION
// =========================================================

if (
  request.method === 'GET' &&
  url.pathname === '/api/admin/me'
) {
  const authenticated =
    await isAdminAuthenticated(request, env)

  if (!authenticated) {
    return Response.json(
      {
        success: false,
        authenticated: false,
      },
      { status: 401 }
    )
  }

  return Response.json({
    success: true,
    authenticated: true,
  })
}


// =========================================================
// ADMIN LOGOUT
// =========================================================

if (
  request.method === 'POST' &&
  url.pathname === '/api/admin/logout'
) {
  const token =
    getCookie(request, 'admin_session')

  if (token) {
    await env.DB.prepare(`
      DELETE FROM admin_sessions
      WHERE token = ?
    `)
      .bind(token)
      .run()
  }

  return new Response(
    JSON.stringify({
      success: true,
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie':
          'admin_session=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0',
      },
    }
  )
}

// =========================================================
// ADMIN DASHBOARD
// =========================================================

if (
  request.method === 'GET' &&
  url.pathname === '/api/admin/dashboard'
) {
  const authenticated =
    await isAdminAuthenticated(request, env)

  if (!authenticated) {
    return Response.json(
      {
        success: false,
        error: 'Unauthorized.',
      },
      { status: 401 }
    )
  }

  try {
    const q = (url.searchParams.get('q') || '').trim()

    const stats = await env.DB.prepare(`
      SELECT
        COUNT(*) AS total_registered,

        COALESCE(
          SUM(CASE WHEN rsvp_status = 'confirmed' THEN 1 ELSE 0 END),
          0
        ) AS confirmed,

        COALESCE(
          SUM(CASE WHEN checked_in = 1 THEN 1 ELSE 0 END),
          0
        ) AS checked_in,

        COALESCE(
          SUM(CASE WHEN is_vip = 1 THEN 1 ELSE 0 END),
          0
        ) AS vip,

        COALESCE(
          SUM(
            CASE
              WHEN rsvp_status = 'confirmed'
              AND checked_in = 0
              THEN 1
              ELSE 0
            END
          ),
          0
        ) AS not_checked_in

      FROM guests
    `).first<{
      total_registered: number
      confirmed: number
      checked_in: number
      vip: number
      not_checked_in: number
    }>()

    let guests

    if (q) {
      const search = `%${q}%`

      guests = await env.DB.prepare(`
        SELECT
          id,
          invitation_code,
          full_name,
          phone,
          email,
          rsvp_status,
          is_vip,
          vip_level,
          table_number,
          seat_number,
          checked_in,
          checked_in_at,
          created_at
        FROM guests
        WHERE
          full_name LIKE ?
          OR phone LIKE ?
          OR email LIKE ?
          OR invitation_code LIKE ?
        ORDER BY
          is_vip DESC,
          full_name ASC
        LIMIT 200
      `)
        .bind(
          search,
          search,
          search,
          search
        )
        .all()
    } else {
      guests = await env.DB.prepare(`
        SELECT
          id,
          invitation_code,
          full_name,
          phone,
          email,
          rsvp_status,
          is_vip,
          vip_level,
          table_number,
          seat_number,
          checked_in,
          checked_in_at,
          created_at
        FROM guests
        ORDER BY
          is_vip DESC,
          full_name ASC
        LIMIT 1000
      `).all()
    }

    return Response.json({
      success: true,

      stats: {
        totalRegistered:
          Number(stats?.total_registered || 0),

        confirmed:
          Number(stats?.confirmed || 0),

        checkedIn:
          Number(stats?.checked_in || 0),

        vip:
          Number(stats?.vip || 0),

        notCheckedIn:
          Number(stats?.not_checked_in || 0),
      },

      guests: guests.results.map((guest: any) => ({
        id: guest.id,
        invitationCode: guest.invitation_code,
        fullName: guest.full_name,
        phone: guest.phone,
        email: guest.email,
        rsvpStatus: guest.rsvp_status,
        isVip: Boolean(guest.is_vip),
        vipLevel: guest.vip_level,
        tableNumber: guest.table_number,
        seatNumber: guest.seat_number,
        checkedIn: Boolean(guest.checked_in),
        checkedInAt: guest.checked_in_at,
        createdAt: guest.created_at,
      })),
    })

  } catch (error) {
    console.error(
      'ADMIN DASHBOARD ERROR:',
      error
    )

    return Response.json(
      {
        success: false,
        error: 'Unable to load dashboard.',
      },
      { status: 500 }
    )
  }
}


// =========================================================
// ADMIN CHECK-IN GUEST
// =========================================================

if (
  request.method === 'POST' &&
  url.pathname === '/api/admin/check-in'
) {
  const authenticated =
    await isAdminAuthenticated(request, env)

  if (!authenticated) {
    return Response.json(
      {
        success: false,
        error: 'Unauthorized.',
      },
      { status: 401 }
    )
  }

  try {
    const body = await request.json<{
      guestId?: number
    }>()

    const guestId = Number(body.guestId)

    if (
      !Number.isInteger(guestId) ||
      guestId <= 0
    ) {
      return Response.json(
        {
          success: false,
          error: 'Invalid guest ID.',
        },
        { status: 400 }
      )
    }

    const checkedInAt =
      new Date().toISOString()

    const result = await env.DB.prepare(`
      UPDATE guests
      SET
        checked_in = 1,
        checked_in_at = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
        AND rsvp_status = 'confirmed'
        AND checked_in = 0
    `)
      .bind(
        checkedInAt,
        guestId
      )
      .run()

    if (result.meta.changes > 0) {
      return Response.json({
        success: true,
        checkedInAt,
      })
    }

    const guest = await env.DB.prepare(`
      SELECT
        id,
        rsvp_status,
        checked_in,
        checked_in_at
      FROM guests
      WHERE id = ?
      LIMIT 1
    `)
      .bind(guestId)
      .first<{
        id: number
        rsvp_status: string
        checked_in: number
        checked_in_at: string | null
      }>()

    if (!guest) {
      return Response.json(
        {
          success: false,
          code: 'GUEST_NOT_FOUND',
          error: 'Guest not found.',
        },
        { status: 404 }
      )
    }

    if (guest.rsvp_status !== 'confirmed') {
      return Response.json(
        {
          success: false,
          code: 'NOT_CONFIRMED',
          error:
            'This guest has not confirmed attendance.',
        },
        { status: 409 }
      )
    }

    if (guest.checked_in) {
      return Response.json(
        {
          success: false,
          code: 'ALREADY_CHECKED_IN',
          error:
            'Guest has already checked in.',
          checkedInAt:
            guest.checked_in_at,
        },
        { status: 409 }
      )
    }

    return Response.json(
      {
        success: false,
        error: 'Unable to check in guest.',
      },
      { status: 500 }
    )

  } catch (error) {
    console.error(
      'ADMIN CHECK-IN ERROR:',
      error
    )

    return Response.json(
      {
        success: false,
        error: 'Something went wrong.',
      },
      { status: 500 }
    )
  }
}
    // =========================================================
// ADMIN UPDATE VIP
// =========================================================

if (
  request.method === 'POST' &&
  url.pathname === '/api/admin/guest/vip'
) {
  const authenticated =
    await isAdminAuthenticated(request, env)

  if (!authenticated) {
    return Response.json(
      {
        success: false,
        error: 'Unauthorized.',
      },
      { status: 401 }
    )
  }

  try {
    const body = await request.json<{
      guestId?: number
      isVip?: boolean
    }>()

    const guestId = Number(body.guestId)

    if (
      !Number.isInteger(guestId) ||
      guestId <= 0 ||
      typeof body.isVip !== 'boolean'
    ) {
      return Response.json(
        {
          success: false,
          error: 'Invalid request.',
        },
        { status: 400 }
      )
    }

    const result = await env.DB.prepare(`
      UPDATE guests
      SET
        is_vip = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
      .bind(
        body.isVip ? 1 : 0,
        guestId
      )
      .run()

    if (result.meta.changes === 0) {
      return Response.json(
        {
          success: false,
          error: 'Guest not found.',
        },
        { status: 404 }
      )
    }

    return Response.json({
      success: true,
      guestId,
      isVip: body.isVip,
    })
  } catch (error) {
    console.error('VIP UPDATE ERROR:', error)

    return Response.json(
      {
        success: false,
        error: 'Unable to update guest.',
      },
      { status: 500 }
    )
  }
}


// =========================================================
// ADMIN DELETE GUEST
// =========================================================

if (
  request.method === 'DELETE' &&
  url.pathname.startsWith('/api/admin/guest/')
) {
  const authenticated =
    await isAdminAuthenticated(request, env)

  if (!authenticated) {
    return Response.json(
      {
        success: false,
        error: 'Unauthorized.',
      },
      { status: 401 }
    )
  }

  try {
    const idPart =
      url.pathname.split('/').pop()

    const guestId = Number(idPart)

    if (
      !Number.isInteger(guestId) ||
      guestId <= 0
    ) {
      return Response.json(
        {
          success: false,
          error: 'Invalid guest ID.',
        },
        { status: 400 }
      )
    }

    const result = await env.DB.prepare(`
      DELETE FROM guests
      WHERE id = ?
    `)
      .bind(guestId)
      .run()

    if (result.meta.changes === 0) {
      return Response.json(
        {
          success: false,
          error: 'Guest not found.',
        },
        { status: 404 }
      )
    }

    return Response.json({
      success: true,
      deletedGuestId: guestId,
    })
  } catch (error) {
    console.error('DELETE GUEST ERROR:', error)

    return Response.json(
      {
        success: false,
        error: 'Unable to delete guest.',
      },
      { status: 500 }
    )
  }
}

// =========================================================
// ADMIN TABLES OVERVIEW
// =========================================================

if (
  request.method === 'GET' &&
  url.pathname === '/api/admin/tables'
) {
  const authenticated =
    await isAdminAuthenticated(
      request,
      env
    )

  if (!authenticated) {
    return Response.json(
      {
        success: false,
        error: 'Unauthorized.',
      },
      { status: 401 }
    )
  }

  try {
    const tables =
      await getTablesOverview(env)

    return Response.json({
      success: true,
      tables,
    })
  } catch (error) {
    console.error(
      'TABLES OVERVIEW ERROR:',
      error
    )

    return Response.json(
      {
        success: false,
        error:
          'Unable to load tables.',
      },
      { status: 500 }
    )
  }
}


// =========================================================
// ADMIN CHANGE TABLE TYPE
// =========================================================

if (
  request.method === 'POST' &&
  url.pathname ===
    '/api/admin/table/type'
) {
  const authenticated =
    await isAdminAuthenticated(
      request,
      env
    )

  if (!authenticated) {
    return Response.json(
      {
        success: false,
        error: 'Unauthorized.',
      },
      { status: 401 }
    )
  }

  try {
    const body =
      await request.json<{
        tableNumber?: number
        tableType?: string
      }>()

    const tableNumber =
      Number(body.tableNumber)

    if (
      !Number.isInteger(
        tableNumber
      ) ||
      tableNumber < 1 ||
      tableNumber > 95
    ) {
      return Response.json(
        {
          success: false,
          error:
            'Invalid table number.',
        },
        { status: 400 }
      )
    }

    if (
      body.tableType !==
        'regular' &&
      body.tableType !==
        'vip'
    ) {
      return Response.json(
        {
          success: false,
          error:
            'Invalid table type.',
        },
        { status: 400 }
      )
    }

    const updated =
      await setTableType(
        env,
        tableNumber,
        body.tableType
      )

    if (!updated) {
      return Response.json(
        {
          success: false,
          error:
            'Table not found.',
        },
        { status: 404 }
      )
    }

    return Response.json({
      success: true,
      tableNumber,
      tableType:
        body.tableType,
    })

  } catch (error) {
    console.error(
      'TABLE TYPE ERROR:',
      error
    )

    return Response.json(
      {
        success: false,
        error:
          'Unable to update table.',
      },
      { status: 500 }
    )
  }
}


// =========================================================
// ADMIN AUTO ASSIGN TABLES
// =========================================================

if (
  request.method === 'POST' &&
  url.pathname ===
    '/api/admin/tables/auto-assign'
) {
  const authenticated =
    await isAdminAuthenticated(
      request,
      env
    )

  if (!authenticated) {
    return Response.json(
      {
        success: false,
        error: 'Unauthorized.',
      },
      { status: 401 }
    )
  }

  try {
    const result =
      await autoAssignTables(env)

    if (!result.success) {
      return Response.json(
        result,
        { status: 409 }
      )
    }

    return Response.json(
      result
    )

  } catch (error) {
    console.error(
      'AUTO ASSIGN ERROR:',
      error
    )

    return Response.json(
      {
        success: false,
        error:
          'Unable to assign tables.',
      },
      { status: 500 }
    )
  }
}

// =========================================================
// ADMIN TABLE DETAILS
// =========================================================

if (
  request.method === 'GET' &&
  url.pathname.startsWith('/api/admin/table/')
) {
  const authenticated =
    await isAdminAuthenticated(request, env)

  if (!authenticated) {
    return Response.json(
      {
        success: false,
        error: 'Unauthorized.',
      },
      { status: 401 }
    )
  }

  try {
    const tableNumber =
      Number(
        url.pathname
          .split('/')
          .pop()
      )

    if (
      !Number.isInteger(tableNumber) ||
      tableNumber < 1 ||
      tableNumber > 95
    ) {
      return Response.json(
        {
          success: false,
          error: 'Invalid table number.',
        },
        { status: 400 }
      )
    }

    const table =
      await env.DB.prepare(`
        SELECT
          table_number,
          capacity,
          table_type,
          is_active

        FROM event_tables

        WHERE table_number = ?

        LIMIT 1
      `)
        .bind(tableNumber)
        .first<{
          table_number: number
          capacity: number
          table_type: string
          is_active: number
        }>()

    if (!table) {
      return Response.json(
        {
          success: false,
          error: 'Table not found.',
        },
        { status: 404 }
      )
    }

    const guests =
      await env.DB.prepare(`
        SELECT
          id,
          invitation_code,
          full_name,
          phone,
          email,
          is_vip,
          seat_number,
          checked_in

        FROM guests

        WHERE
          table_number = ?
          AND rsvp_status = 'confirmed'

        ORDER BY
          seat_number ASC
      `)
        .bind(tableNumber)
        .all()

    return Response.json({
      success: true,

      table: {
        tableNumber:
          table.table_number,

        capacity:
          table.capacity,

        tableType:
          table.table_type,

        isActive:
          Boolean(table.is_active),

        assigned:
          guests.results.length,

        available:
          table.capacity -
          guests.results.length,

        guests:
          guests.results.map(
            (guest: any) => ({
              id: guest.id,

              invitationCode:
                guest.invitation_code,

              fullName:
                guest.full_name,

              phone:
                guest.phone,

              email:
                guest.email,

              isVip:
                Boolean(guest.is_vip),

              seatNumber:
                guest.seat_number,

              checkedIn:
                Boolean(
                  guest.checked_in
                ),
            })
          ),
      },
    })

  } catch (error) {
    console.error(
      'TABLE DETAILS ERROR:',
      error
    )

    return Response.json(
      {
        success: false,
        error:
          'Unable to load table details.',
      },
      { status: 500 }
    )
  }
}

    return new Response('Not Found', {
      status: 404,
    })
  },
}