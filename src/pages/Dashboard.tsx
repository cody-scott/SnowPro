import { Link } from 'react-router-dom';
import { domains, hasContent, plan, flashcards } from '../lib/content';
import { exportState, importState, resetState, toggle, update, useStore } from '../lib/store';
import { domainMastery, pct, readiness } from '../lib/stats';

export default function Dashboard() {
  const s = useStore();
  const ready = readiness(s, domains);
  const due = flashcards.filter(c => (s.cards[c.id]?.due ?? 0) <= Date.now()).length;
  const daysLeft = s.examDate ? Math.ceil((new Date(s.examDate).getTime() - Date.now()) / 86_400_000) : null;

  return (
    <div className="stack">
      <section className="grid3">
        <div className="card stat"><span>Exam readiness</span><b>{pct(ready)}</b><small>weighted by domain %</small></div>
        <div className="card stat"><span>Flashcards due</span><b>{due}</b><Link to="/cards">Review →</Link></div>
        <div className="card stat">
          <span>Exam date</span>
          <input type="date" value={s.examDate ?? ''} onChange={e => update(st => ({ ...st, examDate: e.target.value }))} />
          <small>{daysLeft !== null ? `${daysLeft} days to go` : 'Set a target date'}</small>
        </div>
      </section>

      <section className="card">
        <h2>Domains</h2>
        <table className="domains">
          <thead><tr><th>Domain</th><th>Weight</th><th>Quiz</th><th>Cards</th><th>Mastery</th></tr></thead>
          <tbody>
            {domains.map(d => {
              const m = domainMastery(s, d);
              const live = hasContent(d);
              return (
                <tr key={d.id} className={live ? '' : 'muted'}>
                  <td><span className="dot" style={{ background: d.color }} />{d.num} {d.title}{!live && <em> (coming soon)</em>}</td>
                  <td>{d.weight}%</td>
                  <td>{live ? `${m.answered}/${m.total} · ${pct(m.quizAcc)}` : '—'}</td>
                  <td>{live ? `${m.cardsMastered}/${m.cardsTotal}` : '—'}</td>
                  <td><div className="bar"><div style={{ width: `${m.score * 100}%`, background: d.color }} /></div></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="card">
        <h2>6-week plan</h2>
        <div className="weeks">
          {plan.map(w => {
            const done = w.tasks.filter(t => s.tasks[t.id]).length;
            return (
              <div key={w.week} className="week">
                <h3>Week {w.week} <small>{done}/{w.tasks.length}</small></h3>
                <p className="muted">{w.focus}</p>
                {w.tasks.map(t => (
                  <label key={t.id} className="check">
                    <input type="checkbox" checked={!!s.tasks[t.id]} onChange={() => toggle('tasks', t.id)} />
                    <span>{t.text}</span>
                  </label>
                ))}
              </div>
            );
          })}
        </div>
      </section>

      <section className="card row">
        <span className="muted">Progress is saved in this browser.</span>
        <button onClick={() => {
          const blob = new Blob([exportState()], { type: 'application/json' });
          const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'snowpro-progress.json'; a.click();
        }}>Export</button>
        <label className="btn">Import<input hidden type="file" accept="application/json" onChange={async e => {
          const f = e.target.files?.[0]; if (f) { try { importState(await f.text()); } catch { alert('Invalid file'); } }
        }} /></label>
        <button className="danger" onClick={() => confirm('Reset all progress?') && resetState()}>Reset</button>
      </section>
    </div>
  );
}
