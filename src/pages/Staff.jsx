import { useState, useEffect } from 'react'
import { getAttendanceSummary, verifyStudent, unverifyStudent } from '../lib/api'
import { applyTheme, getTheme } from '../lib/theme'
import Navbar from '../components/Navbar'

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
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const IconX = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const IconShield = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
)

export default function Staff() {
  const [students, setStudents]   = useState([])
  const [search, setSearch]       = useState('')
  const [loading, setLoading]     = useState(true)
  const [actionId, setActionId]   = useState(null)
  const [staffName, setStaffName] = useState(() => localStorage.getItem('hf_staff_name') || '')
  const [nameSet, setNameSet]     = useState(() => !!localStorage.getItem('hf_staff_name'))
  const [nameInput, setNameInput] = useState('')

  useState(() => { applyTheme(getTheme()) })

  async function load() {
    setLoading(true)
    const { data } = await getAttendanceSummary()
    setStudents(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])
  useEffect(() => {
    const t = setInterval(load, 900000)
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
    (s.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.hfknust_id || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.student_id || '').includes(search)
  )

  const verifiedCount  = students.filter(s => s.verified).length
  const checkedInCount = students.filter(s => s.checked_in_at).length

  if (!nameSet) {
    return (
      <div className="page">
        <Navbar title="Staff Portal" subtitle="Hulede Foundation 2026" />
        <div className="main" style={{ display: 'flex', alignItems: 'center' }}>
          <div className="container">
            <div className="card">
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{
                  width: 52, height: 52, borderRadius: '50%',
                  background: 'var(--accent-bg)', border: '2px solid var(--accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 12px', color: 'var(--accent)'
                }}>
                  <IconShield />
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Staff Identification</h2>
                <p className="text-sm text-muted">Your name will be recorded against every verification you perform.</p>
              </div>
              <div className="field">
                <label>Your Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Abena Asante"
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && setName()}
                  autoFocus
                />
              </div>
              <button className="btn btn-primary btn-block btn-lg" onClick={setName}>
                Continue <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <Navbar
        title="Staff Portal"
        subtitle={`Logged in as ${staffName}`}
        right={
          <button className="btn btn-outline btn-sm" onClick={load} style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.1)' }}>
            <IconRefresh /> Refresh
          </button>
        }
      />

      <div className="main">
        <div className="container-wide">
          {/* Metrics */}
          <div className="metrics" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
            <div className="metric">
              <div className="metric-val">{students.length}</div>
              <div className="metric-lbl">Total</div>
            </div>
            <div className="metric">
              <div className="metric-val" style={{ color: 'var(--gold)' }}>{verifiedCount}</div>
              <div className="metric-lbl">Verified</div>
            </div>
            <div className="metric">
              <div className="metric-val" style={{ color: 'var(--green-mid)' }}>{checkedInCount}</div>
              <div className="metric-lbl">Checked In</div>
            </div>
          </div>

          {/* Instruction */}
          <div className="alert alert-info mb-md">
            <IconShield />
            <span>Only verify a student after physically checking their <strong>Student ID card</strong> and <strong>HFKNUST2026 card</strong>. Never verify on behalf of an absent student.</span>
          </div>

          {/* Search */}
          <div style={{ position: 'relative', marginBottom: '1rem' }}>
            <div style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
              <IconSearch />
            </div>
            <input
              type="text"
              placeholder="Search by name, HFKNUST ID or student number..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 40 }}
            />
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <div className="spinner" style={{ margin: '0 auto 12px' }} />
              <p className="text-sm">Loading student list...</p>
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
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(s => {
                    const isCheckedIn = !!s.checked_in_at
                    return (
                      <tr key={s.hfknust_id}>
                        <td className="font-mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.hfknust_id}</td>
                        <td style={{ fontWeight: 500 }}>{s.full_name}</td>
                        <td className="hide-mobile font-mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.student_id}</td>
                        <td className="hide-mobile text-muted text-sm">{s.phone}</td>
                        <td>
                          {isCheckedIn
                            ? <span className="badge badge-green"><IconCheck /> Present</span>
                            : s.verified
                            ? <span className="badge badge-amber"><IconCheck /> Verified</span>
                            : <span className="badge badge-muted">Not Verified</span>
                          }
                        </td>
                        <td>
                          {isCheckedIn ? (
                            <span className="text-muted text-xs">
                              {new Date(s.checked_in_at).toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          ) : s.verified ? (
                            <button className="btn btn-danger btn-sm" onClick={() => handleUnverify(s.hfknust_id)} disabled={actionId === s.hfknust_id}>
                              {actionId === s.hfknust_id ? <div className="spinner" /> : <><IconX /> Undo</>}
                            </button>
                          ) : (
                            <button className="btn btn-success btn-sm" onClick={() => handleVerify(s.hfknust_id)} disabled={actionId === s.hfknust_id}>
                              {actionId === s.hfknust_id ? <div className="spinner" /> : <><IconCheck /> Verify</>}
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  <p className="text-sm">No students match your search.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}