import { useState } from 'react'
import { getStudent, getCheckin, submitCheckin } from '../lib/api'
import { applyTheme, getTheme } from '../lib/theme'
import Navbar from '../components/Navbar'

// Icons
const IconArrow = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
)
const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const IconAlert = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)
const IconLock = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
)
const IconUser = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
)

const STEPS = ['Reference ID', 'Confirm', 'Done']

function StepBar({ step }) {
  return (
    <div className="steps">
      {STEPS.map((label, i) => {
        const n = i + 1
        const s = n < step ? 'done' : n === step ? 'active' : 'idle'
        return (
          <div key={n} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'initial' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
              <div className={`step-dot ${s}`}>
                {s === 'done' ? <IconCheck /> : n}
              </div>
              <span style={{ fontSize: 10, color: s === 'active' ? 'var(--green-dark)' : 'var(--text-muted)', fontWeight: s === 'active' ? 600 : 400, whiteSpace: 'nowrap' }}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && <div className={`step-line ${s === 'done' ? 'done' : ''}`} style={{ marginBottom: 18 }} />}
          </div>
        )
      })}
    </div>
  )
}

export default function CheckIn() {
  const [step, setStep]         = useState(1)
  const [hfId, setHfId]         = useState('')
  const [student, setStudent]   = useState(null)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [checkin, setCheckin]   = useState(null)
  const [countdown, setCountdown] = useState(null)

  // Apply theme on mount
  useState(() => { applyTheme(getTheme()) })

  async function handleLookup() {
    if (!hfId.trim()) { setError('Please enter your HFKNUST reference number.'); return }
    setLoading(true); setError('')
    const s = await getStudent(hfId)
    if (!s) {
      setError('Reference number not found. Please check your HFKNUST2026-xxx number and try again.')
      setLoading(false); return
    }
    const existing = await getCheckin(hfId)
    if (existing) {
      setError('You have already checked in. Duplicate submissions are not permitted.')
      setLoading(false); return
    }
    if (!s.verified) {
      setError('Your ID has not been verified by staff yet. Please present your Student ID and HFKNUST card to a staff member at the entrance.')
      setLoading(false); return
    }
    setStudent(s)
    setStep(2)
    setLoading(false)
  }

  async function handleConfirm() {
    setLoading(true); setError('')
    const deviceHint = navigator.userAgent.slice(0, 120)
    const { data, error: err } = await submitCheckin(hfId, deviceHint)
    if (err) {
      setError(err.code === '23505'
        ? 'Duplicate submission blocked. You have already checked in.'
        : 'An error occurred. Please try again or contact a staff member.')
      setLoading(false); return
    }
    setCheckin(data)
    setStep(3)
    setLoading(false)
    setCountdown(5)
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          setStep(1); setHfId(''); setStudent(null)
          setCheckin(null); setError(''); setCountdown(null)
          return null
        }
        return prev - 1
      })
    }, 1000)
  }

  function formatTime(ts) {
    return new Date(ts).toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="page">
      <Navbar title="Hulede Foundation" subtitle="Attendance Check-In · 2026" />

      <div className="main">
        <div className="container">
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'var(--accent-bg)',
              border: '2px solid var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 12px', color: 'var(--accent)'
            }}>
              <IconUser />
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Event Check-In</h1>
            <p className="text-sm text-muted">2025/2026 Academic Year — April 2026</p>
          </div>

          <StepBar step={step} />

          {/* Step 1 */}
          {step === 1 && (
            <div className="card">
              <div className="card-title">Enter your details</div>

              {error && (
                <div className="alert alert-error">
                  <IconAlert /><span>{error}</span>
                </div>
              )}

              <div className="field">
                <label>HFKNUST Reference Number</label>
                <input
                  type="text"
                  placeholder="e.g. HFKNUST2026-42"
                  value={hfId}
                  onChange={e => setHfId(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && handleLookup()}
                  className="font-mono"
                  style={{ fontSize: 16, letterSpacing: 1 }}
                  autoComplete="off"
                  autoCapitalize="characters"
                />
              </div>

              <div className="alert alert-info" style={{ marginBottom: '1.25rem' }}>
                <IconLock />
                <span>You must have your Student ID verified by a staff member at the entrance before checking in.</span>
              </div>

              <button className="btn btn-primary btn-block btn-lg" onClick={handleLookup} disabled={loading}>
                {loading ? <><div className="spinner" /> Verifying...</> : <>Continue <IconArrow /></>}
              </button>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && student && (
            <div className="card">
              <div className="card-title">Confirm your identity</div>
              <p className="text-sm text-muted mb-md">Please confirm these details are correct before submitting.</p>

              {error && <div className="alert alert-error"><IconAlert /><span>{error}</span></div>}

              <div style={{
                background: 'var(--surface2)', borderRadius: 'var(--radius)',
                overflow: 'hidden', marginBottom: '1.25rem',
                border: '1px solid var(--border)'
              }}>
                {[
                  ['Full Name',      student.full_name],
                  ['HFKNUST ID',     student.hfknust_id],
                  ['Student Number', student.student_id],
                  ['Phone',          student.phone],
                ].map(([label, val], i, arr) => (
                  <div key={label} className="row-between" style={{
                    padding: '11px 14px',
                    borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none'
                  }}>
                    <span className="text-sm text-muted">{label}</span>
                    <span className="text-sm font-bold font-mono">{val}</span>
                  </div>
                ))}
                <div className="row-between" style={{ padding: '11px 14px', background: 'var(--accent-bg)' }}>
                  <span className="text-sm text-muted">Staff Verification</span>
                  <span className="badge badge-green"><IconCheck /> Verified</span>
                </div>
              </div>

              <button className="btn btn-primary btn-block btn-lg" onClick={handleConfirm} disabled={loading} style={{ marginBottom: 10 }}>
                {loading ? <><div className="spinner" /> Submitting...</> : <><IconCheck /> Confirm Check-In</>}
              </button>
              <button className="btn btn-ghost btn-block" onClick={() => { setStep(1); setError('') }}>
                That is not me — go back
              </button>
            </div>
          )}

          {/* Step 3 — Success */}
          {step === 3 && student && (
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: 'var(--accent-bg)',
                border: '2.5px solid var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0.5rem auto 1.25rem', color: 'var(--accent)'
              }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>

              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Check-In Successful</h2>
              <p className="text-muted text-sm" style={{ marginBottom: '1.5rem' }}>{student.full_name}</p>

              <div style={{
                background: 'var(--surface2)', borderRadius: 'var(--radius)',
                overflow: 'hidden', border: '1px solid var(--border)',
                marginBottom: '1.25rem', textAlign: 'left'
              }}>
                {[
                  ['HFKNUST ID',  student.hfknust_id],
                  ['Student No.', student.student_id],
                  ['Check-In Time', checkin ? formatTime(checkin.checked_in_at) : '—'],
                ].map(([label, val], i, arr) => (
                  <div key={label} className="row-between" style={{
                    padding: '10px 14px',
                    borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none'
                  }}>
                    <span className="text-sm text-muted">{label}</span>
                    <span className="text-sm font-mono">{val}</span>
                  </div>
                ))}
                <div className="row-between" style={{ padding: '10px 14px', background: 'var(--accent-bg)' }}>
                  <span className="text-sm text-muted">Fee Eligibility</span>
                  <span className="badge badge-green"><IconCheck /> Eligible for Payment</span>
                </div>
              </div>

              <p className="text-xs text-muted">Your attendance has been recorded successfully.</p>
              {countdown && (
                <p className="text-xs mt-sm" style={{ color: 'var(--gold)' }}>
                  Returning to home screen in {countdown}s...
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
