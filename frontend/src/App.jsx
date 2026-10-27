import { useEffect, useMemo, useState } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const STATUSES = ['Wishlist', 'Applied', 'Interview', 'Offer', 'Rejected'];
const blank = { company: '', role: '', status: 'Applied', applied_date: new Date().toISOString().slice(0, 10), job_url: '', notes: '' };

export default function App() {
  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState(blank);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const r = await fetch(`${API}/applications`);
      if (!r.ok) throw new Error('Could not load applications');
      setJobs(await r.json()); setError('');
    } catch { setError('Cannot connect to backend. Start the backend on port 4000.'); }
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return jobs.filter(j => [j.company, j.role, j.notes, j.status].some(v => String(v || '').toLowerCase().includes(q)));
  }, [jobs, query]);
  const counts = Object.fromEntries(STATUSES.map(s => [s, jobs.filter(j => j.status === s).length]));

  function change(e) { setForm({ ...form, [e.target.name]: e.target.value }); }
  async function submit(e) {
    e.preventDefault(); setBusy(true); setError('');
    try {
      const r = await fetch(`${API}/applications`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Could not save application');
      setForm(blank); await load();
    } catch (err) { setError(err.message || 'Could not save application'); }
    finally { setBusy(false); }
  }
  async function updateStatus(job, status) {
    const r = await fetch(`${API}/applications/${job.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    if (r.ok) load(); else setError('Could not update status.');
  }
  async function remove(job) {
    if (!confirm(`Delete ${job.role} at ${job.company}?`)) return;
    const r = await fetch(`${API}/applications/${job.id}`, { method: 'DELETE' });
    if (r.ok) load(); else setError('Could not delete application.');
  }

  return <main className="shell">
    <header className="hero">
      <div><div className="eyebrow">CAREER DASHBOARD</div><h1>Your job search,<br /><span>under control.</span></h1>
        <p>Keep every application, interview, and opportunity in one place.</p></div>
      <div className="hero-mark" aria-hidden="true">↗</div>
    </header>
    {error && <div className="notice">{error}</div>}
    <section className="stats">
      <div className="stat total"><span>Total applications</span><strong>{jobs.length}</strong><small>All opportunities</small></div>
      {STATUSES.map(s => <div className="stat" key={s}><span>{s}</span><strong>{counts[s]}</strong><small>{s === 'Interview' ? 'Keep preparing' : s === 'Offer' ? 'Great progress' : s === 'Rejected' ? 'Keep going' : 'Applications'}</small></div>)}
    </section>
    <div className="columns">
      <section className="panel form-panel">
        <div className="panel-heading"><div><span className="eyebrow">NEW OPPORTUNITY</span><h2>Add application</h2></div><span className="plus">＋</span></div>
        <form onSubmit={submit}>
          <label>Company name<input name="company" value={form.company} onChange={change} placeholder="e.g. Acme Inc." required /></label>
          <label>Job title<input name="role" value={form.role} onChange={change} placeholder="e.g. Frontend Developer" required /></label>
          <div className="form-row">
            <label>Status<select name="status" value={form.status} onChange={change}>{STATUSES.map(s => <option key={s}>{s}</option>)}</select></label>
            <label>Date applied<input type="date" name="applied_date" value={form.applied_date} onChange={change} required /></label>
          </div>
          <label>Job posting URL <span className="optional">OPTIONAL</span><input type="url" name="job_url" value={form.job_url} onChange={change} placeholder="https://..." /></label>
          <label>Notes <span className="optional">OPTIONAL</span><textarea name="notes" value={form.notes} onChange={change} placeholder="Recruiter, next steps, interview notes..." rows="3" /></label>
          <button className="primary" disabled={busy}>{busy ? 'Saving…' : '＋  Save application'}</button>
        </form>
      </section>
      <section className="panel list-panel">
        <div className="panel-heading list-heading"><div><span className="eyebrow">YOUR PIPELINE</span><h2>Applications <span className="count">{filtered.length}</span></h2></div>
          <input className="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="⌕  Search applications" aria-label="Search applications" /></div>
        {filtered.length === 0 ? <div className="empty"><div className="empty-icon">▤</div><h3>{jobs.length ? 'No matching applications' : 'Your next chapter starts here'}</h3><p>{jobs.length ? 'Try another search term.' : 'Add your first application using the form.'}</p></div> :
          <div className="job-list">{filtered.map(job => <article className="job" key={job.id}>
            <div className="company-icon">{job.company.slice(0, 1).toUpperCase()}</div>
            <div className="job-info"><h3>{job.role}</h3><div className="company">{job.company}</div><div className="job-meta"><span>◷ {job.applied_date}</span>{job.job_url && <a href={job.job_url} target="_blank" rel="noreferrer">View posting ↗</a>}</div>{job.notes && <p className="notes">{job.notes}</p>}</div>
            <div className="job-actions"><select aria-label={`Status for ${job.company}`} className={`status status-${job.status.toLowerCase()}`} value={job.status} onChange={e => updateStatus(job, e.target.value)}>{STATUSES.map(s => <option key={s}>{s}</option>)}</select><button className="delete" onClick={() => remove(job)} title="Delete application" aria-label="Delete application">×</button></div>
          </article>)}</div>}
      </section>
    </div>
    <footer>JOB TRACKER <span>·</span> One step closer to your next role.</footer>
  </main>;
}
