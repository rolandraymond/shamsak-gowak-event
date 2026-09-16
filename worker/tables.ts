export interface TableEnv {
  DB: D1Database
}

type GuestRow = {
  id: number
  group_id: string | null
  is_vip: number
  table_locked: number
  table_number: number | null
  seat_number: number | null
}

type TableRow = {
  table_number: number
  capacity: number
  table_type: 'regular' | 'vip'
  is_active: number
}


// =========================================================
// TABLE OVERVIEW
// =========================================================

export async function getTablesOverview(
  env: TableEnv
) {
  const result = await env.DB.prepare(`
    SELECT
      t.table_number,
      t.capacity,
      t.table_type,
      t.is_active,

      COUNT(g.id) AS assigned,

      COALESCE(
        SUM(
          CASE
            WHEN g.checked_in = 1
            THEN 1
            ELSE 0
          END
        ),
        0
      ) AS checked_in

    FROM event_tables t

    LEFT JOIN guests g
      ON g.table_number = t.table_number
      AND g.rsvp_status = 'confirmed'

    GROUP BY
      t.table_number,
      t.capacity,
      t.table_type,
      t.is_active

    ORDER BY
      t.table_number ASC
  `).all()

  return result.results.map(
    (row: any) => ({
      tableNumber: row.table_number,
      capacity: Number(row.capacity),
      tableType: row.table_type,
      isActive: Boolean(row.is_active),

      assigned: Number(row.assigned),

      available:
        Number(row.capacity) -
        Number(row.assigned),

      checkedIn:
        Number(row.checked_in),
    })
  )
}


// =========================================================
// CHANGE TABLE TYPE
// =========================================================

export async function setTableType(
  env: TableEnv,
  tableNumber: number,
  tableType: 'regular' | 'vip'
) {
  const result = await env.DB.prepare(`
    UPDATE event_tables

    SET
      table_type = ?,
      updated_at = CURRENT_TIMESTAMP

    WHERE table_number = ?
  `)
    .bind(
      tableType,
      tableNumber
    )
    .run()

  return result.meta.changes > 0
}


// =========================================================
// AUTO ASSIGN
// =========================================================

export async function autoAssignTables(
  env: TableEnv
) {
  const tablesResult =
    await env.DB.prepare(`
      SELECT
        table_number,
        capacity,
        table_type,
        is_active

      FROM event_tables

      WHERE is_active = 1

      ORDER BY table_number ASC
    `).all<TableRow>()

  const guestsResult =
    await env.DB.prepare(`
      SELECT
        id,
        group_id,
        is_vip,
        table_locked,
        table_number,
        seat_number

      FROM guests

      WHERE rsvp_status = 'confirmed'

      ORDER BY id ASC
    `).all<GuestRow>()

  const tables = tablesResult.results
  const guests = guestsResult.results


  // =====================================================
  // TABLE STATE
  // =====================================================

  const tableState = new Map<
    number,
    {
      tableNumber: number
      capacity: number
      type: 'regular' | 'vip'
      occupiedSeats: Set<number>
    }
  >()

  for (const table of tables) {
    tableState.set(
      table.table_number,
      {
        tableNumber:
          table.table_number,

        capacity:
          table.capacity,

        type:
          table.table_type,

        occupiedSeats:
          new Set<number>(),
      }
    )
  }


  // =====================================================
  // KEEP LOCKED GUESTS
  // =====================================================

  for (const guest of guests) {
    if (
      !guest.table_locked ||
      guest.table_number === null ||
      guest.seat_number === null
    ) {
      continue
    }

    const table =
      tableState.get(
        guest.table_number
      )

    if (!table) {
      return {
        success: false,
        code: 'INVALID_LOCKED_TABLE',
        error:
          `Guest ${guest.id} is locked to an invalid table.`,
      }
    }

    if (
      guest.seat_number < 1 ||
      guest.seat_number >
        table.capacity
    ) {
      return {
        success: false,
        code: 'INVALID_LOCKED_SEAT',
        error:
          `Guest ${guest.id} has an invalid locked seat.`,
      }
    }

    table.occupiedSeats.add(
      guest.seat_number
    )
  }


  // =====================================================
  // BUILD GROUPS
  // =====================================================

  const groups = new Map<
    string,
    {
      key: string
      guests: GuestRow[]
      isVip: boolean
    }
  >()

  for (const guest of guests) {
    if (guest.table_locked) {
      continue
    }

    const key =
      guest.group_id
        ? `group:${guest.group_id}`
        : `guest:${guest.id}`

    if (!groups.has(key)) {
      groups.set(
        key,
        {
          key,
          guests: [],
          isVip: false,
        }
      )
    }

    const group =
      groups.get(key)!

    group.guests.push(guest)

    if (guest.is_vip) {
      group.isVip = true
    }
  }


  // =====================================================
  // SORT GROUPS
  //
  // BIG GROUPS FIRST
  // =====================================================

  const sortedGroups =
    Array.from(groups.values())
      .sort((a, b) => {

        if (
          b.guests.length !==
          a.guests.length
        ) {
          return (
            b.guests.length -
            a.guests.length
          )
        }

        return a.key.localeCompare(
          b.key
        )
      })


  const assignments: {
    guestId: number
    tableNumber: number
    seatNumber: number
  }[] = []


  // =====================================================
  // ASSIGN GROUPS
  // =====================================================

  for (const group of sortedGroups) {
    const groupSize =
      group.guests.length

    if (groupSize > 7) {
      return {
        success: false,
        code: 'GROUP_TOO_LARGE',
        error:
          `Group ${group.key} has ${groupSize} guests and cannot fit at one table.`,
      }
    }

    const requiredType:
      'vip' | 'regular' =
        group.isVip
          ? 'vip'
          : 'regular'


    const candidates =
      Array.from(
        tableState.values()
      )
        .filter(table => {

          if (
            table.type !==
            requiredType
          ) {
            return false
          }

          const available =
            table.capacity -
            table.occupiedSeats.size

          return (
            available >=
            groupSize
          )
        })

        // BEST FIT
        .sort((a, b) => {

          const aAvailable =
            a.capacity -
            a.occupiedSeats.size

          const bAvailable =
            b.capacity -
            b.occupiedSeats.size

          if (
            aAvailable !==
            bAvailable
          ) {
            return (
              aAvailable -
              bAvailable
            )
          }

          return (
            a.tableNumber -
            b.tableNumber
          )
        })


    const table =
      candidates[0]

    if (!table) {
      return {
        success: false,
        code:
          group.isVip
            ? 'NO_VIP_TABLE_SPACE'
            : 'NO_REGULAR_TABLE_SPACE',

        error:
          group.isVip
            ? `No VIP table has ${groupSize} seats available for ${group.key}.`
            : `No regular table has ${groupSize} seats available for ${group.key}.`,
      }
    }


    // ---------------------------------------------
    // FIND FREE SEATS
    // ---------------------------------------------

    const freeSeats: number[] = []

    for (
      let seat = 1;
      seat <= table.capacity;
      seat++
    ) {
      if (
        !table.occupiedSeats.has(
          seat
        )
      ) {
        freeSeats.push(seat)
      }
    }


    group.guests.forEach(
      (guest, index) => {

        const seatNumber =
          freeSeats[index]

        table.occupiedSeats.add(
          seatNumber
        )

        assignments.push({
          guestId: guest.id,
          tableNumber:
            table.tableNumber,
          seatNumber,
        })
      }
    )
  }


  // =====================================================
  // DATABASE UPDATE
  //
  // REMOVE OLD AUTO ASSIGNMENTS
  // KEEP LOCKED ASSIGNMENTS
  // THEN WRITE NEW ASSIGNMENTS
  // =====================================================

  const statements = [

    env.DB.prepare(`
      UPDATE guests

      SET
        table_number = NULL,
        seat_number = NULL,
        updated_at = CURRENT_TIMESTAMP

      WHERE
        rsvp_status = 'confirmed'
        AND table_locked = 0
    `),

    ...assignments.map(
      assignment =>

        env.DB.prepare(`
          UPDATE guests

          SET
            table_number = ?,
            seat_number = ?,
            updated_at = CURRENT_TIMESTAMP

          WHERE id = ?
        `)
          .bind(
            assignment.tableNumber,
            assignment.seatNumber,
            assignment.guestId
          )
    ),
  ]

  await env.DB.batch(statements)


  return {
    success: true,
    assigned:
      assignments.length,

    groups:
      sortedGroups.length,
  }
}


type AutoSeatEnv = {
  DB: D1Database
}

export async function assignGuestToTable(
  env: AutoSeatEnv,
  guestId: number
): Promise<
  | {
      success: true
      tableNumber: number
      seatNumber: number
      alreadyAssigned?: boolean
    }
  | {
      success: false
      code: string
      error: string
    }
> {
  // ---------------------------------------------------------
  // Get guest
  // ---------------------------------------------------------

  const guest = await env.DB.prepare(`
    SELECT
      id,
      is_vip,
      rsvp_status,
      table_number,
      seat_number,
      table_locked
    FROM guests
    WHERE id = ?
    LIMIT 1
  `)
    .bind(guestId)
    .first<{
      id: number
      is_vip: number
      rsvp_status: string
      table_number: number | null
      seat_number: number | null
      table_locked: number
    }>()

  if (!guest) {
    return {
      success: false,
      code: 'GUEST_NOT_FOUND',
      error: 'Guest not found.',
    }
  }

  // ---------------------------------------------------------
  // Only confirmed guests get seats
  // ---------------------------------------------------------

  if (guest.rsvp_status !== 'confirmed') {
    return {
      success: false,
      code: 'GUEST_NOT_CONFIRMED',
      error: 'Guest is not confirmed.',
    }
  }

  // ---------------------------------------------------------
  // Already has a complete seat assignment
  // Do NOT change it
  // ---------------------------------------------------------

  if (
    guest.table_number !== null &&
    guest.seat_number !== null
  ) {
    return {
      success: true,
      tableNumber: guest.table_number,
      seatNumber: guest.seat_number,
      alreadyAssigned: true,
    }
  }

  // Protect against inconsistent data
  if (
    (guest.table_number !== null &&
      guest.seat_number === null) ||
    (guest.table_number === null &&
      guest.seat_number !== null)
  ) {
    return {
      success: false,
      code: 'PARTIAL_SEAT_ASSIGNMENT',
      error: 'Guest has an incomplete seat assignment.',
    }
  }

  const tableType =
    guest.is_vip === 1 ? 'vip' : 'regular'

  // ---------------------------------------------------------
  // Atomically find first available seat + assign it
  //
  // Example:
  // Table 1 seats 1-7
  // then Table 2 seats 1-7
  // etc.
  //
  // VIP guests only go to VIP tables.
  // Regular guests only go to regular tables.
  // ---------------------------------------------------------

  const assigned = await env.DB.prepare(`
    WITH RECURSIVE seat_numbers(seat_number) AS (
      SELECT 1

      UNION ALL

      SELECT seat_number + 1
      FROM seat_numbers
      WHERE seat_number < 7
    ),

    chosen_seat AS (
      SELECT
        t.table_number,
        s.seat_number

      FROM event_tables t

      JOIN seat_numbers s
        ON s.seat_number <= t.capacity

      LEFT JOIN guests occupied
        ON occupied.table_number = t.table_number
        AND occupied.seat_number = s.seat_number

      WHERE
        t.is_active = 1
        AND t.table_type = ?
        AND occupied.id IS NULL

      ORDER BY
        t.table_number ASC,
        s.seat_number ASC

      LIMIT 1
    )

    UPDATE guests

    SET
      table_number = (
        SELECT table_number
        FROM chosen_seat
      ),

      seat_number = (
        SELECT seat_number
        FROM chosen_seat
      ),

      updated_at = CURRENT_TIMESTAMP

    WHERE
      id = ?
      AND rsvp_status = 'confirmed'
      AND table_number IS NULL
      AND seat_number IS NULL
      AND EXISTS (
        SELECT 1
        FROM chosen_seat
      )

    RETURNING
      table_number,
      seat_number
  `)
    .bind(
      tableType,
      guestId
    )
    .first<{
      table_number: number
      seat_number: number
    }>()

  if (!assigned) {
    return {
      success: false,
      code: 'NO_AVAILABLE_SEAT',
      error:
        tableType === 'vip'
          ? 'No VIP seats are currently available.'
          : 'No regular seats are currently available.',
    }
  }

  return {
    success: true,
    tableNumber: assigned.table_number,
    seatNumber: assigned.seat_number,
  }
}