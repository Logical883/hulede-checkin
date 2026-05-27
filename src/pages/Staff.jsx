import { useState, useEffect } from 'react'
import { getAllStudents, verifyStudent, unverifyStudent } from '../lib/api'

export default function Staff() {
  const [students, setStudents]   = useState([])
  const [search, setSearch]       = useState('')
  const [loading, setLoading]     = useState(true)
  const [actionId, setActionId]   = useState(null)
  const [staffName, setStaffName] = useState(() => localStorage.getItem('hf_staff_name') || '')
  const [nameSet, setNameSet]     = useState(() => !!localStorage.getItem('hf_staff_name'))
  const [nameInput, setNameInput] = useState('')

  async function load() {
    setLoading(true)
    const { data } = await getAllStudents()
    setStudents(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  // Auto-refresh every 15 seconds
  useEffect(() => {
    const t = setInterval(load, 15000)
    return () => clearInterval(t)
  }, [])

  function setName() {
    if (!nameInput.trim()) return
    localStorage.setItem('hf_staff_name', nameInput.trim())
    setStaffName(nameInput.trim())
    setNameSet(true)
  }

  async function handleVerify(hfknustId) {
    setActionId(hfknustId)
    await verifyStudent(hfknustId, staffName)
    await load()
    setActionId(null)
  }

  async function handleUnverify(hfknustId) {
    setActionId(hfknustId)
    await unverifyStudent(hfknustId)
    await load()
    setActionId(null)
  }

  const filtered = students.filter(s =>
    s.full_name.toLowerCase().includes(search.toLowerCase()) ||
    s.hfknust_id.toLowerCase().includes(search.toLowerCase()) ||
    (s.student_id || '').includes(search)
  )

  const verifiedCount  = students.filter(s => s.verified).length
  const checkedInCount = students.filter(s => s.checked_in_at).length

  if (!nameSet) {
    return (
      <div className="page">
        <nav className="navbar">
          <div className="navbar-brand">
            <div className="navbar-logo">HF</div>
            <div>
              <div className="navbar-title">Staff Portal</div>
              <div className="navbar-sub">Hulede Foundation 2026</div>
            </div>
          </div>
        </nav>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '2rem 0' }}>
          <div className="container">
            <div className="card">
              <h2 style={{ fontSize: 18, marginBottom: 6 }}>Enter your name</h2>
              <p className="text-muted text-sm mb-md">This will be recorded with every verification you do.</p>
              <div className="field">
                <label>Your name</label>
                <input
                  type="text"
                  placeholder="e.g. Abena Asante"
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && setName()}
                />
              </div>
              <button className="btn btn-primary btn-block" onClick={setName}>Continue →</button>
            </div>
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
            <div className="navbar-title">Staff Portal</div>
            <div className="navbar-sub">Logged in as {staffName}</div>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load} style={{ marginLeft: 'auto' }}>
          ↻ Refresh
        </button>
      </nav>

      <div style={{ flex: 1, padding: '1.25rem 0', overflowY: 'auto' }}>
        <div className="container-wide">

          {/* Stats */}
          <div className="metrics" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
            <div className="metric">
              <div className="metric-val">{students.length}</div>
              <div className="metric-lbl">Total</div>
            </div>
            <div className="metric">
              <div className="metric-val" style={{ color: 'var(--hf-amber)' }}>{verifiedCount}</div>
              <div className="metric-lbl">Verified</div>
            </div>
            <div className="metric">
              <div className="metric-val" style={{ color: 'var(--hf-green)' }}>{checkedInCount}</div>
              <div className="metric-lbl">Checked in</div>
            </div>
          </div>

          <div className="alert alert-info mb-md">
            <span>🔒</span>
            <span>Only verify a student after physically checking their <strong>Student ID card</strong> and <strong>HFKNUST2026 card</strong>. Never verify on behalf of an absent student.</span>
          </div>

          {/* Search */}
          <div className="search-wrap mb-md">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by name, HFKNUST ID or student number..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--hf-muted)' }}>
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
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(s => {
                    const isCheckedIn = !!s.checked_in_at
                    return (
                      <tr key={s.hfknust_id}>
                        <td className="font-mono" style={{ fontSize: 12 }}>{s.hfknust_id}</td>
                        <td style={{ fontWeight: 500 }}>{s.full_name}</td>
                        <td className="text-muted font-mono" style={{ fontSize: 12 }}>{s.student_id}</td>
                        <td className="text-muted text-sm">{s.phone}</td>
                        <td>
                          {isCheckedIn
                            ? <span className="badge badge-green">✓ Present</span>
                            : s.verified
                            ? <span className="badge badge-amber">✓ Verified</span>
                            : <span className="badge badge-muted">Not verified</span>
                          }
                        </td>
                        <td>
                          {isCheckedIn ? (
                            <span className="text-muted text-xs">
                              {new Date(s.checked_in_at).toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          ) : s.verified ? (
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleUnverify(s.hfknust_id)}
                              disabled={actionId === s.hfknust_id}
                            >
                              {actionId === s.hfknust_id ? '...' : 'Undo'}
                            </button>
                          ) : (
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => handleVerify(s.hfknust_id)}
                              disabled={actionId === s.hfknust_id}
                            >
                              {actionId === s.hfknust_id ? '...' : '✓ Verify'}
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--hf-muted)' }}>
                  No students match your search.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
