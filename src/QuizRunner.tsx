import { useEffect, useMemo, useState } from 'react';
import { Question, objectiveTitle } from './lib/content';
import { recordAnswer } from './lib/store';
import { shuffle } from './lib/util';

export interface Answer { q: Question; correct: boolean }

/** Runs a list of questions one at a time. In practice mode it shows feedback after each answer; in exam mode it doesn't. */
export function QuizRunner({ questions, exam = false, onDone }: { questions: Question[]; exam?: boolean; onDone: (a: Answer[]) => void }) {
  // Shuffle option order per question, keeping track of the original index.
  const items = useMemo(() => questions.map(q => ({ q, order: shuffle(q.options.map((_, i) => i)) })), [questions]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [answers, setAnswers] = useState<Answer[]>([]);
  useEffect(() => { setI(0); setPicked([]); setSubmitted(false); setAnswers([]); }, [items]);

  const item = items[i];
  if (!item) return null;
  const { q, order } = item;
  const multi = q.answer.length > 1;
  const isCorrect = picked.length === q.answer.length && picked.every(p => q.answer.includes(p));

  const pick = (orig: number) => {
    if (submitted) return;
    if (!multi) setPicked([orig]);
    else setPicked(p => p.includes(orig) ? p.filter(x => x !== orig) : p.length < q.answer.length ? [...p, orig] : p);
  };

  const submit = () => {
    recordAnswer(q.id, isCorrect);
    const next = [...answers, { q, correct: isCorrect }];
    setAnswers(next);
    if (exam) advance(next); else setSubmitted(true);
  };
  const advance = (a = answers) => {
    if (i + 1 >= items.length) { onDone(a); return; }
    setI(i + 1); setPicked([]); setSubmitted(false);
  };

  return (
    <div className="card quiz">
      <div className="row between muted small">
        <span>Question {i + 1} of {items.length}</span>
        <span>{q.objective} · {objectiveTitle(q.objective)}</span>
      </div>
      <div className="progress"><div style={{ width: `${(i / items.length) * 100}%` }} /></div>
      <h3>{q.question}</h3>
      {multi && <p className="muted small">Select {q.answer.length}.</p>}
      <div className="options">
        {order.map((orig, k) => {
          const chosen = picked.includes(orig);
          const cls = submitted ? (q.answer.includes(orig) ? 'right' : chosen ? 'wrong' : '') : chosen ? 'chosen' : '';
          return (
            <button key={orig} className={`option ${cls}`} onClick={() => pick(orig)}>
              <b>{String.fromCharCode(65 + k)}.</b> {q.options[orig]}
            </button>
          );
        })}
      </div>
      {submitted && (
        <div className={`feedback ${isCorrect ? 'ok' : 'bad'}`}>
          <b>{isCorrect ? 'Correct' : 'Incorrect'}.</b> {q.explanation}
          {q.ref && <> <a href={q.ref} target="_blank" rel="noopener">Docs ↗</a></>}
        </div>
      )}
      <div className="row end">
        {!submitted
          ? <button className="primary" disabled={picked.length !== q.answer.length} onClick={submit}>{exam ? 'Next' : 'Submit'}</button>
          : <button className="primary" onClick={() => advance()}>{i + 1 >= items.length ? 'See results' : 'Next →'}</button>}
      </div>
    </div>
  );
}

export function Results({ answers, onRetry, onRestart }: { answers: Answer[]; onRetry?: () => void; onRestart: () => void }) {
  const right = answers.filter(a => a.correct).length;
  const byObj: Record<string, [number, number]> = {};
  answers.forEach(a => { const r = (byObj[a.q.objective] ??= [0, 0]); r[1]++; if (a.correct) r[0]++; });
  const missed = answers.filter(a => !a.correct);
  return (
    <div className="card stack">
      <h2>Score: {right}/{answers.length} ({Math.round((right / answers.length) * 100)}%)</h2>
      <table className="domains">
        <thead><tr><th>Objective</th><th>Score</th></tr></thead>
        <tbody>{Object.entries(byObj).sort().map(([o, [r, t]]) => (
          <tr key={o} className={r / t < 0.75 ? 'weak' : ''}><td>{o} {objectiveTitle(o)}</td><td>{r}/{t}</td></tr>
        ))}</tbody>
      </table>
      {missed.length > 0 && (
        <details>
          <summary>Review {missed.length} missed</summary>
          {missed.map(({ q }) => (
            <div key={q.id} className="review">
              <p><b>{q.question}</b></p>
              <p>✓ {q.answer.map(a => q.options[a]).join(' · ')}</p>
              <p className="muted">{q.explanation}</p>
            </div>
          ))}
        </details>
      )}
      <div className="row">
        {onRetry && missed.length > 0 && <button className="primary" onClick={onRetry}>Retry missed</button>}
        <button onClick={onRestart}>New quiz</button>
      </div>
    </div>
  );
}
