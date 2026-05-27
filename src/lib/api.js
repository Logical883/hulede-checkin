import { supabase, ACTIVE_EVENT_ID } from './supabase'

// ── STUDENT ──────────────────────────────────────────────────

/**
 * Look up a student by their HFKNUST ID for the active event.
 * Returns null if not found.
 */
export async function getStudent(hfknustId) {
  const { data, error } = await supabase
    .from('event_students')
    .select('*')
    .eq('hfknust_id', hfknustId.trim().toUpperCase())
    .eq('event_id', ACTIVE_EVENT_ID)
    .single()

  if (error) return null
  return data
}

/**
 * Check if a student has already checked in.
 */
export async function getCheckin(hfknustId) {
  const { data } = await supabase
    .from('checkins')
    .select('*')
    .eq('hfknust_id', hfknustId.trim().toUpperCase())
    .eq('event_id', ACTIVE_EVENT_ID)
    .single()

  return data || null
}

/**
 * Submit a student check-in.
 * Fails at DB level if student is not verified or already checked in.
 */
export async function submitCheckin(hfknustId, deviceHint) {
  const { data, error } = await supabase
    .from('checkins')
    .insert({
      hfknust_id: hfknustId.trim().toUpperCase(),
      event_id: ACTIVE_EVENT_ID,
      device_hint: deviceHint,
      eligible: true,
    })
    .select()
    .single()

  return { data, error }
}


// ── STAFF ────────────────────────────────────────────────────

/**
 * Get all students for the active event (for staff list).
 */
export async function getAllStudents() {
  const { data, error } = await supabase
    .from('event_students')
    .select('*')
    .eq('event_id', ACTIVE_EVENT_ID)
    .order('hfknust_id', { ascending: true })

  return { data: data || [], error }
}

/**
 * Mark a student as physically verified by staff.
 */
export async function verifyStudent(hfknustId, staffName) {
  const { data, error } = await supabase
    .from('event_students')
    .update({
      verified: true,
      verified_at: new Date().toISOString(),
      verified_by: staffName || 'Staff',
    })
    .eq('hfknust_id', hfknustId)
    .eq('event_id', ACTIVE_EVENT_ID)
    .select()
    .single()

  return { data, error }
}

/**
 * Unverify a student (undo accidental verification).
 */
export async function unverifyStudent(hfknustId) {
  const { error } = await supabase
    .from('event_students')
    .update({ verified: false, verified_at: null, verified_by: null })
    .eq('hfknust_id', hfknustId)
    .eq('event_id', ACTIVE_EVENT_ID)

  return { error }
}


// ── ADMIN ────────────────────────────────────────────────────

/**
 * Full attendance summary (uses the view we created in Supabase).
 */
export async function getAttendanceSummary() {
  const { data, error } = await supabase
    .from('attendance_summary')
    .select('*')
    .eq('event_id', ACTIVE_EVENT_ID)

  return { data: data || [], error }
}

/**
 * Attendance stats for the active event.
 */
export async function getStats() {
  const { data, error } = await supabase
    .rpc('get_attendance_stats', { p_event_id: ACTIVE_EVENT_ID })

  return { data, error }
}

/**
 * Get all events (for year switcher).
 */
export async function getEvents() {
  const { data } = await supabase
    .from('events')
    .select('*')
    .order('created_at', { ascending: false })

  return data || []
}

/**
 * Upload students from parsed Excel rows for a given event.
 * Used by the admin Excel upload feature.
 */
export async function bulkInsertStudents(eventId, rows) {
  const { data, error } = await supabase
    .from('event_students')
    .upsert(rows.map(r => ({ ...r, event_id: eventId })), {
      onConflict: 'hfknust_id,event_id',
    })

  return { data, error }
}

/**
 * Create a new event year.
 */
export async function createEvent(id, label, eventDate) {
  const { data, error } = await supabase
    .from('events')
    .insert({ id, label, event_date: eventDate })
    .select()
    .single()

  return { data, error }
}
