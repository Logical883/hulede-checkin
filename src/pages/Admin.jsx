import { useState, useEffect, useRef } from 'react'
import * as XLSX from 'xlsx'
import { getAttendanceSummary, getStats, getEvents, bulkInsertStudents, createEvent } from '../lib/api'
import { applyTheme, getTheme } from '../lib/theme'
import Navbar from '../components/Navbar'

const ADMIN_PIN = '2026HF'

// Icons
const IconDownload = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
)
const IconUpload = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
)
const IconSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)
const IconRefresh = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
)
const IconCheck = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const IconX = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const IconLock = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
)
const IconFile = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
  </svg>
)

function ExcelUploadPanel({ onSuccess }) {
  const [events, setEvents]         = useState([])
  const [eventId, setEventId]       = useState('')
  const [newEventId, setNewEventId] = useState('')
  const [newLabel, setNewLabel]     = useState('')
  const [newDate, setNewDate]       = useState('')
  const [creating, setCreating]     = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [file, setFile]             = useState(null)
  const [preview, setPreview]       = useState([])
  const [uploading, setUploading]   = useState(false)
  const [result, setResult]         = useState(null)
  const fileRef = useRef()

  useEffect(() => {
    getEvents().then(data => {
      const arr = Array.isArray(data) ? data : []
      setEvents(arr)
      if (arr.length > 0) setEventId(arr[0].id)
    }).catch(console.error)
  }, [])

  function parseExcel(f) {
    const reader = new FileReader()
    reader.onload = e => {
      const wb = XLSX.read(e.target.result, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const raw = XLSX.utils.sheet_to_json(ws, { header: 1 })
      let headerIdx = raw.findIndex(row => row.some(cell => String(cell || '').includes('HFKNUST')))
      if (headerIdx === -1) headerIdx = 0
      const rows = []
      for (let i = headerIdx + 1; i < raw.length; i++) {
        const row = raw[i]
        const hfId = String(row[1] || '').trim()
        if (!hfId.startsWith('HFKNUST')) continue
        const phone = String(row[5] || '').replace('+233', '0').replace(/\s/g, '').split('.')[0]
        rows.push({
          hfknust_id: hfId,
          full_name:  String(row[2] || '').trim(),
          student_id: String(row[3] || '').split('.')[0],
          email:      String(row[4] || '').trim(),
          phone:      phone.length === 9 ? '0' + phone : phone,
          whatsapp:   String(row[6] || '').replace('+233', '0').replace(/\s/g, '').split('.')[0],
        })
      }
      setPreview(rows.slice(0, 5))
      setFile({ name: f.name, rows })
      setResult(null)
    }
    reader.readAsArrayBuffer(f)
  }

  async function handleCreateEvent() {
    if (!newEventId || !newLabel) return
    setCreating(true)
    const { error } = await createEvent(newEventId.trim().toUpperCase(), newLabel.trim(), newDate || null)
    if (!error) {
      const data = await getEvents()
      setEvents(Array.isArray(data) ? data : [])
      setEventId(newEventId.trim().toUpperCase())
      setNewEventId(''); setNewLabel(''); setNewDate('')
      setShowCreate(false)
    }
    setCreating(false)
  }

  async function handleUpload() {
    if (!file || !eventId) return
    setUploading(true)
    const { error } = await bulkInsertStudents(eventId, file.rows)
    setResult(error ? { ok: false, msg: error.message } : { ok: true, count: file.rows.length })
    setUploading(false)
    if (!error) onSuccess()
  }

  return (
    <div className="card">
      <div className="card-title">Upload Student List</div>

      {/* Create new event */}
      <div style={{ marginBottom: '1.1rem' }}>
        <button className="btn btn-outline btn-sm" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? <IconX /> : '+'} {showCreate ? 'Cancel' : 'Create New Event Year'}
        </button>
        {showCreate && (
          <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--surface2)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <div className="field">
              <label>Event ID (e.g. HFKNUST2027)</label>
              <input value={newEventId} onChange={e => setNewEventId(e.target.value)} placeholder="HFKNUST2027" />
            </div>
            <div className="field">
              <label>Label</label>
              <input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="2026/2027 Academic Year" />
            </div>
            <div className="field">
              <label>Event Date (optional)</label>
              <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} />
            </div>
            <button className="btn btn-primary btn-sm" onClick={handleCreateEvent} disabled={creating}>
              {creating ? <><div className="spinner" /> Creating...</> : 'Create Event'}
            </button>
          </div>
        )}
      </div>

      <div className="field">
        <label>Select Event Year {events.length === 0 && <span style={{ color: 'var(--gold)', fontWeight: 400 }}>— none found</span>}</label>
        <select value={eventId} onChange={e => setEventId(e.target.value)} style={{ color: 'var(--text)', background: 'var(--surface2)' }}>
          {events.length === 0 && <option value="">No events available</option>}
          {events.map(ev => (
            <option key={ev.id} value={ev.id}>{ev.id} — {ev.label}</option>
          ))}
        </select>
      </div>

      <div
        onClick={() => fileRef.current.click()}
        style={{
          border: `2px dashed ${file ? 'var(--accent)' : 'var(--border)'}`,
          borderRadius: 'var(--radius)',
          padding: '1.75rem',
          textAlign: 'center',
          cursor: 'pointer',
          background: file ? 'var(--accent-bg)' : 'var(--surface2)',
          marginBottom: '1.1rem',
          transition: 'all var(--transition)'
        }}
      >
        <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }}
          onChange={e => e.target.files[0] && parseExcel(e.target.files[0])} />
        <div style={{ color: file ? 'var(--accent)' : 'var(--text-muted)', display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
          {file ? <IconCheck /> : <IconFile />}
        </div>
        {file
          ? <><p style={{ fontSize: 14, fontWeight: 500, color: 'var(--accent)' }}>{file.name}</p>
              <p className="text-xs text-muted mt-sm">{file.rows.length} students parsed</p></>
          : <><p className="text-sm" style={{ fontWeight: 500 }}>Click to select Excel file</p>
              <p className="text-xs text-muted mt-sm">.xlsx or .xls format</p></>
        }
      </div>

      {preview.length > 0 && (
        <div style={{ marginBottom: '1.1rem' }}>
          <p className="text-xs text-muted mb-sm">Preview — first 5 rows</p>
          <div className="table-wrap">
            <table>
              <thead><tr><th>HFKNUST ID</th><th>Full Name</th><th>Student No.</th><th>Phone</th></tr></thead>
              <tbody>
                {preview.map(r => (
                  <tr key={r.hfknust_id}>
                    <td className="font-mono" style={{ fontSize: 11 }}>{r.hfknust_id}</td>
                    <td>{r.full_name}</td>
                    <td className="font-mono" style={{ fontSize: 11 }}>{r.student_id}</td>
                    <td style={{ fontSize: 12 }}>{r.phone}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {result && (
        <div className={`alert ${result.ok ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: '1rem' }}>
          {result.ok ? <IconCheck /> : <IconX />}
          <span>{result.ok ? `${result.count} students uploaded successfully.` : `Error: ${result.msg}`}</span>
        </div>
      )}

      <button className="btn btn-primary btn-block" onClick={handleUpload} disabled={uploading || !file || !eventId}>
        {uploading ? <><div className="spinner" /> Uploading...</> : <><IconUpload /> Upload to Supabase</>}
      </button>
    </div>
  )
}

export default function Admin() {
  const [pin, setPin]           = useState('')
  const [auth, setAuth]         = useState(() => sessionStorage.getItem('hf_admin') === '1')
  const [pinError, setPinError] = useState('')
  const [data, setData]         = useState([])
  const [stats, setStats]       = useState(null)
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [tab, setTab]           = useState('attendance')

  useState(() => { applyTheme(getTheme()) })

  async function load() {
    setLoading(true)
    const [{ data: rows }, { data: s }] = await Promise.all([getAttendanceSummary(), getStats()])
    setData(rows || [])
    setStats(s)
    setLoading(false)
  }

  useEffect(() => { if (auth) load() }, [auth])

  function handlePin() {
    if (pin === ADMIN_PIN) { sessionStorage.setItem('hf_admin', '1'); setAuth(true) }
    else setPinError('Incorrect PIN. Please try again.')
  }

  function exportCSV() {
    const header = ['HFKNUST ID','Full Name','Student No.','Email','Phone','Verified','Checked In','Time','Eligible','Status']
    const rows = data.map(r => [
      r.hfknust_id, r.full_name, r.student_id, r.email, r.phone,
      r.verified ? 'Yes' : 'No',
      r.checked_in_at ? 'Yes' : 'No',
      r.checked_in_at ? new Date(r.checked_in_at).toLocaleTimeString('en-GH') : '',
      r.eligible ? 'Yes' : 'No',
      r.status
    ])
    const csv = [header, ...rows].map(r => r.map(c => `"${c || ''}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'hulede_attendance_2026.csv'
    a.click()
  }

  const filtered = data.filter(r =>
    (r.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.student_id || '').includes(search) ||
    (r.hfknust_id || '').toLowerCase().includes(search.toLowerCase())
  )

  if (!auth) {
    return (
      <div className="page" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Navbar title="Admin Portal" subtitle="Hulede Foundation 2026" />
        <div className="main" style={{ display: 'flex', alignItems: 'center' }}>
          <div className="container">
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'var(--accent-bg)', border: '2px solid var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0.5rem auto 1.25rem', color: 'var(--accent)'
              }}><IconLock /></div>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Admin Access</h2>
              <p className="text-sm text-muted mb-md">Enter your PIN to access the dashboard.</p>
              {pinError && <div className="alert alert-error"><span>{pinError}</span></div>}
              <div className="field">
                <input
                  type="password" placeholder="Enter PIN"
                  value={pin} onChange={e => setPin(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handlePin()}
                  style={{ textAlign: 'center', letterSpacing: 6, fontSize: 20 }}
                  autoFocus
                />
              </div>
              <button className="btn btn-primary btn-block btn-lg" onClick={handlePin}>Unlock Dashboard</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <Navbar
        title="Admin Dashboard"
        subtitle="Hulede Foundation 2026"
        right={
          <div className="row gap-sm">
            <button className="btn btn-outline btn-sm" onClick={load} style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.1)' }}>
              <IconRefresh />
            </button>
            <button className="btn btn-outline btn-sm" onClick={exportCSV} style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.1)' }}>
              <IconDownload /> <span className="hide-mobile">Export CSV</span>
            </button>
          </div>
        }
      />

      <div className="main">
        <div className="container-wide">

          {/* Stats */}
          {stats && (
            <div className="metrics" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
              {[
                ['Total',    stats.total,    'var(--green-dark)'],
                ['Verified', stats.verified, 'var(--gold)'],
                ['Present',  stats.present,  'var(--green-mid)'],
                ['Eligible', stats.eligible, 'var(--green-mid)'],
              ].map(([lbl, val, color]) => (
                <div className="metric" key={lbl}>
                  <div className="metric-val" style={{ color }}>{val ?? '—'}</div>
                  <div className="metric-lbl">{lbl}</div>
                </div>
              ))}
            </div>
          )}

          {/* Progress */}
          {stats && (
            <div className="card mb-md">
              <div className="row-between mb-sm">
                <span className="text-sm text-muted font-bold">Attendance Rate</span>
                <span className="text-sm font-bold" style={{ color: 'var(--green-dark)' }}>
                  {stats.total > 0 ? Math.round(stats.present / stats.total * 100) : 0}%
                </span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${stats.total > 0 ? Math.round(stats.present / stats.total * 100) : 0}%` }} />
              </div>
              <p className="text-xs text-muted mt-sm">{stats.present} of {stats.total} students checked in</p>
            </div>
          )}

          {/* Tabs */}
          <div className="row mb-md gap-sm">
            {[['attendance','Attendance'], ['upload','Upload List']].map(([t, label]) => (
              <button key={t} className={`btn btn-sm ${tab === t ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab(t)}>
                {label}
              </button>
            ))}
          </div>

          {tab === 'upload' && <ExcelUploadPanel onSuccess={load} />}

          {tab === 'attendance' && (
            <>
              <div className="search-wrap mb-md">
                <span className="search-icon"><IconSearch /></span>
                <input
                  type="text"
                  placeholder="Search by name, HFKNUST ID or student number..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <div className="spinner" style={{ margin: '0 auto 12px' }} />
                  <p className="text-sm text-muted">Loading attendance data...</p>
                </div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>HFKNUST ID</th>
                        <th>Full Name</th>
                        <th className="hide-mobile">Student No.</th>
                        <th className="hide-mobile">Phone</th>
                        <th>Verified</th>
                        <th>Check-In</th>
                        <th>Eligible</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(r => (
                        <tr key={r.hfknust_id}>
                          <td className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.hfknust_id}</td>
                          <td style={{ fontWeight: 500 }}>{r.full_name}</td>
                          <td className="hide-mobile font-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.student_id}</td>
                          <td className="hide-mobile text-muted text-sm">{r.phone}</td>
                          <td>{r.verified ? <span className="badge badge-amber"><IconCheck /> Yes</span> : <span className="badge badge-muted">No</span>}</td>
                          <td className="text-muted text-sm">
                            {r.checked_in_at ? new Date(r.checked_in_at).toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit' }) : '—'}
                          </td>
                          <td>{r.eligible ? <span className="badge badge-green"><IconCheck /> Yes</span> : <span className="badge badge-muted">No</span>}</td>
                          <td>
                            <span className={`badge ${r.status === 'Present' ? 'badge-green' : r.status?.includes('Verified') ? 'badge-amber' : 'badge-muted'}`}>
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filtered.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                      <p className="text-sm">No records found.</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
