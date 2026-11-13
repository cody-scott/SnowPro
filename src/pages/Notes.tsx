import { useMemo } from 'react';
import { Link, NavLink, useParams } from 'react-router-dom';
import { marked } from 'marked';
import { domains, notes, objectiveTitle, questions, flashcards } from '../lib/content';
import { toggle, useStore } from '../lib/store';

marked.use({ gfm: true });

export default function Notes() {
  const { id } = useParams();
  const s = useStore();
  const first = domains.flatMap(d => d.objectives).find(o => notes[o.id])?.id;
  const current = id ?? first;
  const html = useMemo(() => {
    const md = current ? notes[current] : undefined;
    if (!md) return '';
    // Open doc links in a new tab.
    return (marked.parse(md) as string).replace(/<a href="http/g, '<a target="_blank" rel="noopener" href="http');
  }, [current]);

  return (
    <div className="split">
      <aside className="card side">
        {domains.map(d => (
          <div key={d.id}>
            <h4 style={{ borderColor: d.color }}>{d.num} {d.title}</h4>
            {d.objectives.map(o => notes[o.id]
              ? <NavLink key={o.id} to={`/notes/${o.id}`} className={current === o.id ? 'active' : ''}>
                  {s.notesRead[o.id] ? '✓ ' : ''}{o.id} {o.title}
                </NavLink>
              : <span key={o.id} className="muted small">{o.id} {o.title}</span>)}
          </div>
        ))}
      </aside>
      <article className="card prose">
        {current && html ? (
          <>
            <h1>{current} {objectiveTitle(current)}</h1>
            <div dangerouslySetInnerHTML={{ __html: html }} />
            <div className="row actions">
              <label className="check">
                <input type="checkbox" checked={!!s.notesRead[current]} onChange={() => toggle('notesRead', current)} />
                <span>Mark as reviewed</span>
              </label>
              <Link className="btn" to={`/quiz?obj=${current}`}>Quiz this objective ({questions.filter(q => q.objective === current).length})</Link>
              <Link className="btn" to={`/cards?obj=${current}`}>Flashcards ({flashcards.filter(c => c.objective === current).length})</Link>
            </div>
          </>
        ) : <p className="muted">Notes for this objective are coming soon.</p>}
      </article>
    </div>
  );
}
