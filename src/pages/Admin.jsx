import { useState, useEffect, useRef } from 'react'
import * as XLSX from 'xlsx'
import { getAttendanceSummary, getStats, getEvents, bulkInsertStudents, createEvent } from '../lib/api'

const ADMIN_PIN = '2026HF'   // Change this before deployment

function ExcelUploadPanel({ onSuccess }) {
  const [events, setEvents]         = useState([])
  const [eventId, setEventId]       = useState('')
  const [newEventId, setNewEventId] = useState('')
  const [newLabel, setNewLabel]     = useState('')
  const [newDate, setNewDate]       = useState('')
  const [creating, setCreating]     = useState(false)
  const [file, setFile]             = useState(null)
  const [preview, setPreview]       = useState([])
  const [uploading, setUploading]   = useState(false)
  const [result, setResult]         = useState(null)
  const fileRef = useRef()

  useEffect(() => {
    getEvents().then(data => {
      setEvents(data)
      if (data.length > 0) setEventId(data[0].id)
    })
  }, [])

  function parseExcel(file) {
    const reader = new FileReader()
    reader.onload = e => {
      const wb = XLSX.read(e.target.result, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const raw = XLSX.utils.sheet_to_json(ws, { header: 1 })

      // Find header row (contains 'HFKNUST')
      let headerIdx = raw.findIndex(row =>
        row.some(cell => String(cell || '').includes('HFKNUST'))
      )
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
      setFile({ name: file.name, rows })
    }
    reader.readAsArrayBuffer(file)
  }

  async function handleCreateEvent() {
    if (!newEventId || !newLabel) return
    setCreating(true)
    const { error } = await createEvent(newEventId.trim().toUpperCase(), newLabel.trim(), newDate || null)
    if (!error) {
      const data = await getEvents()
      setEvents(data)
      setEventId(newEventId.trim().toUpperCase())
      setNewEventId(''); setNewLabel(''); setNewDate('')
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
      <h3 style={{ fontSize: 15, marginBottom: '1rem' }}>📤 Upload Student List (Excel)</h3>

      {/* Create new event */}
      <details style={{ marginBottom: '1rem' }}>
        <summary className="text-sm" style={{ cursor: 'pointer', color: 'var(--hf-gold)', marginBottom: 8 }}>
          + Create new event year
        </summary>
        <div style={{ marginTop: 10 }}>
          <div className="field">
            <label>Event ID (e.g. HFKNUST2027)</label>
            <input value={newEventId} onChange={e => setNewEventId(e.target.value)} placeholder="HFKNUST2027" />
          </div>
          <div className="field">
            <label>Label (e.g. 2026/2027 Academic Year)</label>
            <input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="2026/2027 Academic Year" />
          </div>
          <div className="field">
            <label>Event date (optional)</label>
            <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} />
          </div>
          <button className="btn btn-primary btn-sm" onClick={handleCreateEvent} disabled={creating}>
            {creating ? 'Creating...' : 'Create event'}
          </button>
        </div>
      </details>

      {/* Select event */}
      <div className="field">
        <label>Select event year</label>
        <select value={eventId} onChange={e => setEventId(e.target.value)}>
          {events.map(ev => <option key={ev.id} value={ev.id}>{ev.id} — {ev.label}</option>)}
        </select>
      </div>

      {/* File input */}
      <div
        onClick={() => fileRef.current.click()}
        style={{
          border: '2px dashed var(--hf-border)', borderRadius: 'var(--radius)',
          padding: '1.5rem', textAlign: 'center', cursor: 'pointer',
          background: file ? 'var(--hf-green-bg)' : 'var(--hf-surface)',
          marginBottom: '1rem', transition: 'all 0.15s'
        }}
      >
        <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }}
          onChange={e => e.target.files[0] && parseExcel(e.target.files[0])} />
        {file
          ? <><div style={{ fontSize: 24 }}>✅</div><p style={{ fontSize: 13 }}>{file.name} — {file.rows.length} students found</p></>
          : <><div style={{ fontSize: 24 }}>📁</div><p className="text-muted text-sm">Click to select Excel file (.xlsx)</p></>
        }
      </div>

      {/* Preview */}
      {preview.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <p className="text-muted text-xs mb-sm">Preview (first 5 rows):</p>
          <div className="table-wrap" style={{ fontSize: 12 }}>
            <table>
              <thead><tr><th>HFKNUST ID</th><th>Name</th><th>Student No.</th><th>Phone</th></tr></thead>
              <tbody>
                {preview.map(r => (
                  <tr key={r.hfknust_id}>
                    <td className="font-mono">{r.hfknust_id}</td>
                    <td>{r.full_name}</td>
                    <td className="font-mono">{r.student_id}</td>
                    <td>{r.phone}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {result && (
        <div className={`alert ${result.ok ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: '1rem' }}>
          {result.ok ? `✓ ${result.count} students uploaded successfully.` : `Error: ${result.msg}`}
        </div>
      )}

      <button className="btn btn-primary btn-block" onClick={handleUpload}
        disabled={uploading || !file || !eventId}>
        {uploading ? <><div className="spinner" /> Uploading...</> : '⬆ Upload to Supabase'}
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
  const [tab, setTab]           = useState('attendance') // 'attendance' | 'upload'

  async function load() {
    setLoading(true)
    const [{ data: rows }, { data: s }] = await Promise.all([getAttendanceSummary(), getStats()])
    setData(rows || [])
    setStats(s)
    setLoading(false)
  }

  useEffect(() => { if (auth) load() }, [auth])

  function handlePin() {
    if (pin === ADMIN_PIN) {
      sessionStorage.setItem('hf_admin', '1')
      setAuth(true)
    } else {
      setPinError('Incorrect PIN. Try again.')
    }
  }

  function exportCSV() {
    const header = ['HFKNUST ID','Full Name','Student No.','Email','Phone','Verified','Checked In','Time','Eligible','Status']
    const rows = data.map(r => [
      r.student_id, r.full_name, r.student_id, r.email, r.phone,
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
    r.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (r.student_id || '').includes(search) ||
    r.status.toLowerCase().includes(search.toLowerCase())
  )

  if (!auth) {
    return (
      <div className="page" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className="container">
          <div className="card center">
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔐</div>
            <h2 style={{ fontSize: 18, marginBottom: 6 }}>Admin Access</h2>
            <p className="text-muted text-sm mb-md">Enter your admin PIN to continue.</p>
            {pinError && <div className="alert alert-error">{pinError}</div>}
            <div className="field">
              <input
                type="password" placeholder="PIN"
                value={pin} onChange={e => setPin(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handlePin()}
                style={{ textAlign: 'center', letterSpacing: 4, fontSize: 18 }}
              />
            </div>
            <button className="btn btn-primary btn-block" onClick={handlePin}>Enter</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <nav className="navbar">
        <div className="navbar-brand">
          <div className="navbar-logo">HF</div>
          <div>
            <div className="navbar-title">Admin Dashboard</div>
            <div className="navbar-sub">Hulede Foundation 2026</div>
          </div>
        </div>
        <div className="row" style={{ marginLeft: 'auto', gap: 6 }}>
          <button className="btn btn-ghost btn-sm" onClick={load}>↻</button>
          <button className="btn btn-outline btn-sm" onClick={exportCSV}>⬇ CSV</button>
        </div>
      </nav>

      <div style={{ flex: 1, padding: '1.25rem 0', overflowY: 'auto' }}>
        <div className="container-wide">

          {/* Stats */}
          {stats && (
            <div className="metrics" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
              {[
                ['Total', stats.total, 'var(--hf-gold)'],
                ['Verified', stats.verified, 'var(--hf-amber)'],
                ['Present', stats.present, 'var(--hf-green)'],
                ['Eligible', stats.eligible, 'var(--hf-green)'],
              ].map(([lbl, val, color]) => (
                <div className="metric" key={lbl}>
                  <div className="metric-val" style={{ color }}>{val ?? '—'}</div>
                  <div className="metric-lbl">{lbl}</div>
                </div>
              ))}
            </div>
          )}

          {/* Progress bar */}
          {stats && (
            <div className="card mb-md">
              <div className="row-between mb-sm">
                <span className="text-muted text-sm">Attendance rate</span>
                <span className="text-sm font-bold">
                  {stats.total > 0 ? Math.round(stats.present / stats.total * 100) : 0}%
                </span>
              </div>
              <div style={{ height: 8, background: 'var(--hf-surface2)', borderRadius: 4 }}>
                <div style={{
                  height: '100%', borderRadius: 4, background: 'var(--hf-gold)',
                  width: `${stats.total > 0 ? Math.round(stats.present / stats.total * 100) : 0}%`,
                  transition: 'width 0.6s ease'
                }} />
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="row mb-md" style={{ gap: 6 }}>
            {['attendance', 'upload'].map(t => (
              <button key={t} className={`btn btn-sm ${tab === t ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setTab(t)}>
                {t === 'attendance' ? '📋 Attendance' : '📤 Upload List'}
              </button>
            ))}
          </div>

          {tab === 'upload' && <ExcelUploadPanel onSuccess={load} />}

          {tab === 'attendance' && (
            <>
              <div className="search-wrap mb-md">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search by name, student number or status..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <div className="spinner" style={{ margin: '0 auto' }} />
                </div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>HFKNUST ID</th>
                        <th>Full Name</th>
                        <th>Student No.</th>
                        <th>Phone</th>
                        <th>Verified</th>
                        <th>Check-in</th>
                        <th>Eligible</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(r => (
                        <tr key={r.student_id}>
                          <td className="font-mono" style={{ fontSize: 11 }}>{r.student_id}</td>
                          <td style={{ fontWeight: 500 }}>{r.full_name}</td>
                          <td className="font-mono text-muted" style={{ fontSize: 11 }}>{r.student_id}</td>
                          <td className="text-muted text-sm">{r.phone}</td>
                          <td>{r.verified
                            ? <span className="badge badge-amber">✓ Yes</span>
                            : <span className="badge badge-muted">No</span>}
                          </td>
                          <td className="text-muted text-sm">
                            {r.checked_in_at
                              ? new Date(r.checked_in_at).toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit' })
                              : '—'}
                          </td>
                          <td>{r.eligible
                            ? <span className="badge badge-green">✓ Yes</span>
                            : <span className="badge badge-muted">No</span>}
                          </td>
                          <td>
                            <span className={`badge ${
                              r.status === 'Present' ? 'badge-green' :
                              r.status.includes('Verified') ? 'badge-amber' : 'badge-muted'
                            }`}>{r.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filtered.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--hf-muted)' }}>
                      No records found.
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
