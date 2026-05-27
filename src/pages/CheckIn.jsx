import { useState } from 'react'
import { getStudent, getCheckin, submitCheckin } from '../lib/api'

const STEPS = ['Your ID', 'Confirm', 'Done']

function StepBar({ step }) {
  return (
    <div className="steps">
      {STEPS.map((label, i) => {
        const n = i + 1
        const state = n < step ? 'done' : n === step ? 'active' : 'idle'
        return (
          <div key={n} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'initial' }}>
            <div className={`step-dot ${state}`}>
              {state === 'done' ? '✓' : n}
            </div>
            {i < STEPS.length - 1 && <div className={`step-line ${state === 'done' ? 'done' : ''}`} />}
          </div>
        )
      })}
    </div>
  )
}

export default function CheckIn() {
  const [step, setStep]       = useState(1)
  const [hfId, setHfId]       = useState('')
  const [student, setStudent] = useState(null)
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [checkin, setCheckin] = useState(null)
  const [countdown, setCountdown] = useState(null)

  async function handleLookup() {
    if (!hfId.trim()) { setError('Please enter your HFKNUST ID.'); return }
    setLoading(true); setError('')
    const s = await getStudent(hfId)
    if (!s) {
      setError('ID not found. Check your HFKNUST2026-xxx number and try again.')
      setLoading(false); return
    }
    const existing = await getCheckin(hfId)
    if (existing) {
      setError('You have already checked in. Duplicate submissions are not allowed.')
      setLoading(false); return
    }
    if (!s.verified) {
      setError('Your ID has not been verified by staff yet. Please show your Student ID and HFKNUST card to a staff member at the entrance first.')
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
      if (err.code === '23505') {
        setError('Duplicate submission blocked. You are already checked in.')
      } else {
        setError('Something went wrong. Please try again or see a staff member.')
      }
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
          setStep(1); setHfId(''); setStudent(null); setCheckin(null); setError(''); setCountdown(null)
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
      <nav className="navbar">
        <div className="navbar-brand">
          <div className="navbar-logo">HF</div>
          <div>
            <div className="navbar-title">Hulede Foundation</div>
            <div className="navbar-sub">Attendance Check-In · 2026</div>
          </div>
        </div>
      </nav>

      <div style={{ flex: 1, padding: '1.5rem 0', overflowY: 'auto' }}>
        <div className="container">
          <StepBar step={step} />

          {/* ── Step 1: Enter ID ── */}
          {step === 1 && (
            <div className="card">
              <h2 style={{ fontSize: 18, marginBottom: 4 }}>Check in to today's event</h2>
              <p className="text-muted text-sm mb-md">
                Enter your HFKNUST reference number to get started.
              </p>

              {error && (
                <div className="alert alert-error">
                  <span>⚠</span> <span>{error}</span>
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
                />
              </div>

              <div className="alert alert-warning">
                <span>🔒</span>
                <span>You must have your Student ID verified by staff at the entrance before checking in.</span>
              </div>

              <button className="btn btn-primary btn-block" onClick={handleLookup} disabled={loading}>
                {loading ? <><div className="spinner" /> Checking...</> : <>Continue →</>}
              </button>
            </div>
          )}

          {/* ── Step 2: Confirm identity ── */}
          {step === 2 && student && (
            <div className="card">
              <h2 style={{ fontSize: 18, marginBottom: 4 }}>Confirm your details</h2>
              <p className="text-muted text-sm mb-md">
                Make sure this is you before submitting.
              </p>

              {error && (
                <div className="alert alert-error">
                  <span>⚠</span> <span>{error}</span>
                </div>
              )}

              <div style={{ background: 'var(--hf-surface2)', borderRadius: 'var(--radius)', padding: '1rem', marginBottom: '1rem' }}>
                {[
                  ['Name',       student.full_name],
                  ['HFKNUST ID', student.hfknust_id],
                  ['Student ID', student.student_id],
                  ['Phone',      student.phone],
                ].map(([label, val]) => (
                  <div key={label} className="row-between" style={{ padding: '6px 0', borderBottom: '1px solid var(--hf-border)' }}>
                    <span className="text-muted text-sm">{label}</span>
                    <span className="text-sm font-bold">{val}</span>
                  </div>
                ))}
                <div className="row-between" style={{ padding: '6px 0' }}>
                  <span className="text-muted text-sm">Staff verified</span>
                  <span className="badge badge-green">✓ Yes</span>
                </div>
              </div>

              <button className="btn btn-primary btn-block" onClick={handleConfirm} disabled={loading} style={{ marginBottom: 10 }}>
                {loading ? <><div className="spinner" /> Submitting...</> : <>✓ Confirm check-in</>}
              </button>
              <button className="btn btn-ghost btn-block" onClick={() => { setStep(1); setError('') }}>
                ← That's not me
              </button>
            </div>
          )}

          {/* ── Step 3: Success ── */}
          {step === 3 && student && (
            <div className="card center">
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'var(--hf-green-bg)', border: '2px solid var(--hf-green)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 32, color: 'var(--hf-green)', margin: '0 auto 1rem'
              }}>✓</div>
              <h2 style={{ fontSize: 20, marginBottom: 6 }}>Check-in complete!</h2>
              <p className="text-muted text-sm" style={{ marginBottom: '1.5rem' }}>{student.full_name}</p>

              <div style={{ textAlign: 'left', background: 'var(--hf-surface2)', borderRadius: 'var(--radius)', padding: '1rem', marginBottom: '1rem' }}>
                {[
                  ['HFKNUST ID', student.hfknust_id],
                  ['Student ID', student.student_id],
                  ['Check-in time', checkin ? formatTime(checkin.checked_in_at) : '—'],
                ].map(([label, val]) => (
                  <div key={label} className="row-between" style={{ padding: '6px 0', borderBottom: '1px solid var(--hf-border)' }}>
                    <span className="text-muted text-sm">{label}</span>
                    <span className="text-sm">{val}</span>
                  </div>
                ))}
                <div className="row-between" style={{ paddingTop: 10 }}>
                  <span className="text-muted text-sm">Fee eligibility</span>
                  <span className="badge badge-green">✓ Eligible for payment</span>
                </div>
              </div>

              <p className="text-muted text-xs">Your attendance is recorded. Thank you for attending!</p>
      {countdown && <p className="text-muted text-xs mt-sm" style={{color:'var(--hf-amber)'}}>Returning to home screen in {countdown}s...</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}