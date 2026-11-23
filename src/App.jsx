import { useState, useEffect } from 'react'

const iso = off => { const d = new Date(); d.setDate(d.getDate() - off); return d.toISOString().slice(0, 10) }
const fmt = d => new Date(d + 'T00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
const ST = { P: ['Present', 'success', '✅'], L: ['Late', 'warning', '⏰'], A: ['Absent', 'danger', '❌'] }
const initial = n => n.split(' ').map(w => w[0]).join('').slice(0, 2)

const seedStudents = ['Asha Rao', 'Ravi Kumar', 'Meena Shetty', 'Karthik Gowda', 'Divya Nair', 'Imran Khan']
  .map((name, i) => ({ id: i + 1, name, roll: String(101 + i) }))
const seedRecords = () => {
  const r = {}
  for (let o = 1; o <= 24; o++) {
    if ([0, 6].includes(new Date(iso(o)).getDay())) continue
    r[iso(o)] = {}
    seedStudents.forEach(s => {
      const v = (s.id * 7 + o * 3 + s.id * o) % 10, t = [8, 7, 5][s.id % 3]
      r[iso(o)][s.id] = v < t ? 'P' : v === t ? 'L' : 'A'
    })
  }
  return r
}

export default function App() {
  const [view, setView] = useState('teacher')
  const [students, setStudents] = useState(seedStudents)
  const [records, setRecords] = useState(seedRecords)
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 2200)
    return () => clearTimeout(t)
  }, [toast])

  const stats = id => {
    const c = { P: 0, A: 0, L: 0 }
    Object.values(records).forEach(r => r[id] && c[r[id]]++)
    const total = c.P + c.A + c.L
    return { ...c, total, pct: total ? Math.round(((c.P + c.L) / total) * 100) : 0 }
  }
  const props = { students, setStudents, records, setRecords, stats, notify: setToast }

  return (
    <div>
      <header className="hero mb-4">
        <div className="container d-flex flex-wrap gap-2 justify-content-between align-items-center">
          <div>
            <div className="h4 mb-0">🎓 Student Attendance System</div>
            <div className="small opacity-75">Track, review and improve attendance</div>
          </div>
          <div className="d-flex gap-2">
            <button className={`pill ${view === 'teacher' ? 'on' : ''}`} onClick={() => setView('teacher')}>👩‍🏫 Teacher</button>
            <button className={`pill ${view === 'student' ? 'on' : ''}`} onClick={() => setView('student')}>🧑‍🎓 Student</button>
          </div>
        </div>
      </header>
      <main className="container pb-5 fade" key={view}>
        {view === 'teacher' ? <Teacher {...props} /> : <Student {...props} />}
      </main>
      {toast && <div className="toastbox">{toast}</div>}
    </div>
  )
}

function Teacher({ students, setStudents, records, setRecords, stats, notify }) {
  const [date, setDate] = useState(iso(0))
  const [q, setQ] = useState('')
  const [show, setShow] = useState(false)
  const [form, setForm] = useState({ name: '', roll: '' })
  const day = records[date] || {}
  const count = st => students.filter(s => day[s.id] === st).length
  const marked = count('P') + count('L') + count('A')

  const set = (id, st) => setRecords(r => ({ ...r, [date]: { ...(r[date] || {}), [id]: st } }))
  const all = st => {
    setRecords(r => ({ ...r, [date]: Object.fromEntries(students.map(s => [s.id, st])) }))
    notify(`Everyone marked ${ST[st][0].toLowerCase()}`)
  }
  const add = () => {
    if (!form.name.trim() || !form.roll.trim()) return notify('Enter name and roll number')
    setStudents(s => [...s, { id: Date.now(), name: form.name.trim(), roll: form.roll.trim() }])
    notify(`${form.name.trim()} added`)
    setForm({ name: '', roll: '' }); setShow(false)
  }
  const remove = s => { setStudents(l => l.filter(x => x.id !== s.id)); notify(`${s.name} removed`) }
  const list = students.filter(s => (s.name + s.roll).toLowerCase().includes(q.toLowerCase()))

  return (
    <>
      <div className="row g-3 mb-3">
        {[['total', 'Students', students.length, '👥'], ['P', 'Present', count('P'), '✅'], ['L', 'Late', count('L'), '⏰'], ['A', 'Absent', count('A'), '❌']].map(([k, l, n, e]) => (
          <div className="col-6 col-md-3" key={k}>
            <div className={`stat s-${k}`}>
              <div className="small opacity-75">{e} {l}</div>
              <div className="fs-2 fw-bold">{n}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card mb-3"><div className="card-body">
        <div className="d-flex justify-content-between small mb-1">
          <span>Marked for {fmt(date)}</span><span>{marked} / {students.length}</span>
        </div>
        <div className="progress"><div className="progress-bar bg-primary" style={{ width: `${students.length ? (marked / students.length) * 100 : 0}%` }} /></div>
      </div></div>

      <div className="card"><div className="card-body">
        <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
          <input type="date" className="form-control w-auto" value={date} max={iso(0)} onChange={e => setDate(e.target.value)} />
          <input className="form-control w-auto" placeholder="🔍 Search name or roll" value={q} onChange={e => setQ(e.target.value)} />
          <div className="ms-auto d-flex gap-2">
            <button className="btn btn-outline-success btn-sm" onClick={() => all('P')}>All present</button>
            <button className="btn btn-outline-danger btn-sm" onClick={() => all('A')}>All absent</button>
            <button className="btn btn-primary btn-sm" onClick={() => setShow(!show)}>{show ? 'Close' : '＋ Add student'}</button>
          </div>
        </div>

        {show && (
          <div className="d-flex flex-wrap gap-2 mb-3 p-3 rounded bg-light fade">
            <input className="form-control w-auto" placeholder="Full name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <input className="form-control w-auto" placeholder="Roll no." value={form.roll} onChange={e => setForm({ ...form, roll: e.target.value })} />
            <button className="btn btn-success" onClick={add}>Save</button>
          </div>
        )}

        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead><tr><th>Student</th><th>Mark attendance</th><th style={{ minWidth: 140 }}>Overall</th><th></th></tr></thead>
            <tbody>
              {list.map(s => {
                const p = stats(s.id).pct
                return (
                  <tr key={s.id}>
                    <td><span className="avatar">{initial(s.name)}</span>{s.name} <span className="text-muted small">#{s.roll}</span></td>
                    <td>
                      <div className="btn-group btn-group-sm">
                        {Object.entries(ST).map(([k, [label, c]]) => (
                          <button key={k} className={`btn ${day[s.id] === k ? `btn-${c}` : `btn-outline-${c}`}`} onClick={() => set(s.id, k)}>{label}</button>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div className="progress" title={`${p}%`}><div className={`progress-bar bg-${p >= 75 ? 'success' : p >= 60 ? 'warning' : 'danger'}`} style={{ width: `${p}%` }} /></div>
                      <span className="small text-muted">{p}%</span>
                    </td>
                    <td><button className="btn btn-sm text-danger" onClick={() => remove(s)}>🗑</button></td>
                  </tr>
                )
              })}
              {!list.length && <tr><td colSpan="4" className="text-center text-muted py-4">No students found</td></tr>}
            </tbody>
          </table>
        </div>
      </div></div>
    </>
  )
}

function Student({ students, records, stats }) {
  const [id, setId] = useState(students[0]?.id)
  const [f, setF] = useState('ALL')
  const s = students.find(x => x.id === id) || students[0]
  if (!s) return <p className="text-center text-muted">No students yet.</p>

  const st = stats(s.id)
  const rows = Object.keys(records).sort().reverse().filter(d => records[d][s.id]).map(d => ({ d, v: records[d][s.id] }))
  const shown = f === 'ALL' ? rows : rows.filter(r => r.v === f)
  const tone = st.pct >= 75 ? 'success' : st.pct >= 60 ? 'warning' : 'danger'
  const need = Math.max(0, 3 * st.total - 4 * (st.P + st.L))

  return (
    <>
      <div className="card mb-3"><div className="card-body d-flex flex-wrap gap-3 align-items-center">
        <span className="avatar">{initial(s.name)}</span>
        <div><div className="fw-bold">{s.name}</div><div className="small text-muted">Roll #{s.roll}</div></div>
        <select className="form-select w-auto ms-auto" value={s.id} onChange={e => setId(Number(e.target.value))}>
          {students.map(x => <option key={x.id} value={x.id}>{x.name} (#{x.roll})</option>)}
        </select>
      </div></div>

      <div className="row g-3 mb-3">
        <div className="col-md-4"><div className="card h-100"><div className="card-body text-center">
          <div className={`big border border-4 border-${tone} text-${tone}`}>{st.pct}%</div>
          <div className="mt-2 text-muted small">Overall attendance</div>
        </div></div></div>
        <div className="col-md-8"><div className="card h-100"><div className="card-body">
          <div className="row g-3 text-center mb-3">
            {[['P', st.P], ['L', st.L], ['A', st.A], ['total', st.total]].map(([k, n]) => (
              <div className="col-3" key={k}><div className={`stat s-${k}`}><div className="fs-4 fw-bold">{n}</div><div className="small">{k === 'total' ? 'Classes' : ST[k][0]}</div></div></div>
            ))}
          </div>
          {need > 0
            ? <div className="alert alert-warning mb-0">⚠️ Below 75%. Attend the next <b>{need}</b> classes in a row to get back on track.</div>
            : <div className="alert alert-success mb-0">🎉 Great job! You meet the 75% attendance requirement.</div>}
        </div></div></div>
      </div>

      <div className="card mb-3"><div className="card-body">
        <div className="fw-bold mb-2">Last 4 weeks</div>
        <div className="dots">
          {rows.slice(0, 20).reverse().map(r => <div key={r.d} className={`dot dot-${r.v}`} title={`${fmt(r.d)} – ${ST[r.v][0]}`} />)}
        </div>
        <div className="small text-muted mt-2">🟩 Present &nbsp; 🟨 Late &nbsp; 🟥 Absent</div>
      </div></div>

      <div className="card"><div className="card-body">
        <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-3">
          <div className="fw-bold">Attendance records</div>
          <div className="btn-group btn-group-sm">
            {['ALL', 'P', 'L', 'A'].map(k => (
              <button key={k} className={`btn ${f === k ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setF(k)}>{k === 'ALL' ? 'All' : ST[k][0]}</button>
            ))}
          </div>
        </div>
        <div className="table-responsive">
          <table className="table mb-0">
            <thead><tr><th>Date</th><th>Status</th></tr></thead>
            <tbody>
              {shown.map(r => (
                <tr key={r.d}><td>{fmt(r.d)}</td><td><span className={`badge bg-${ST[r.v][1]} ${r.v === 'L' ? 'text-dark' : ''}`}>{ST[r.v][2]} {ST[r.v][0]}</span></td></tr>
              ))}
              {!shown.length && <tr><td colSpan="2" className="text-center text-muted py-3">No records</td></tr>}
            </tbody>
          </table>
        </div>
      </div></div>
    </>
  )
}
