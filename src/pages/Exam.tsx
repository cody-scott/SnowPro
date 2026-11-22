import { useEffect, useRef, useState } from 'react';
import { Domain, Question, domainOf, domains, hasContent, questions } from '../lib/content';
import { update, useStore } from '../lib/store';
import { shuffle } from '../lib/util';
import { Answer, QuizRunner, Results } from '../QuizRunner';

const SIZES = [
  { n: 100, minutes: 115, label: 'Full (100 questions, 115 min)' },
  { n: 50, minutes: 58, label: 'Half (50 questions, 58 min)' },
  { n: 25, minutes: 29, label: 'Quick (25 questions, 29 min)' },
];

/** Picks questions in proportion to each domain's exam weight (largest-remainder rounding), capped by what's available. */
function buildExam(total: number, live: Domain[]): Question[] {
  const weightSum = live.reduce((a, d) => a + d.weight, 0);
  const raw = live.map(d => ({ d, exact: (total * d.weight) / weightSum }));
  const counts = new Map(raw.map(r => [r.d.id, Math.floor(r.exact)]));
  let left = total - [...counts.values()].reduce((a, b) => a + b, 0);
  for (const r of [...raw].sort((a, b) => (b.exact % 1) - (a.exact % 1))) {
    if (left-- <= 0) break;
    counts.set(r.d.id, counts.get(r.d.id)! + 1);
  }
  const picked = live.flatMap(d => shuffle(questions.filter(q => domainOf(q.objective).id === d.id)).slice(0, counts.get(d.id)));
  return shuffle(picked);
}

const fmt = (ms: number) => {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

export default function Exam() {
  const s = useStore();
  const live = domains.filter(hasContent);
  const [size, setSize] = useState(0);
  const [exam, setExam] = useState<{ qs: Question[]; endsAt: number } | null>(null);
  const [answers, setAnswers] = useState<Answer[] | null>(null);
  const [now, setNow] = useState(Date.now());
  const given = useRef<Answer[]>([]);

  const finish = (done: Answer[], qs: Question[]) => {
    // Questions left unanswered when time runs out count as wrong.
    const seen = new Set(done.map(a => a.q.id));
    const all = [...done, ...qs.filter(q => !seen.has(q.id)).map(q => ({ q, correct: false }))];
    const byObjective: Record<string, [number, number]> = {};
    all.forEach(a => { const r = (byObjective[a.q.objective] ??= [0, 0]); r[1]++; if (a.correct) r[0]++; });
    const score = all.filter(a => a.correct).length;
    update(st => ({ ...st, exams: [...st.exams, { date: Date.now(), score, total: all.length, byObjective }] }));
    setExam(null);
    setAnswers(all);
  };

  useEffect(() => {
    if (!exam) return;
    const t = setInterval(() => {
      setNow(Date.now());
      if (Date.now() >= exam.endsAt) finish(given.current, exam.qs);
    }, 1000);
    return () => clearInterval(t);
  }, [exam]);

  const start = () => {
    given.current = [];
    const { n, minutes } = SIZES[size];
    const qs = buildExam(n, live);
    setAnswers(null);
    setNow(Date.now());
    setExam({ qs, endsAt: Date.now() + minutes * 60_000 });
  };

  if (answers) {
    const byDomain = live.map(d => {
      const mine = answers.filter(a => domainOf(a.q.objective).id === d.id);
      return { d, right: mine.filter(a => a.correct).length, total: mine.length };
    });
    return (
      <div className="narrow stack">
        <section className="card">
          <h2>Mock exam result: {answers.filter(a => a.correct).length}/{answers.length} ({Math.round((answers.filter(a => a.correct).length / answers.length) * 100)}%)</h2>
          <table className="domains">
            <thead><tr><th>Domain</th><th>Weight</th><th>Score</th></tr></thead>
            <tbody>{byDomain.map(({ d, right, total }) => (
              <tr key={d.id} className={total && right / total < 0.75 ? 'weak' : ''}>
                <td><span className="dot" style={{ background: d.color }} />{d.num} {d.title}</td>
                <td>{d.weight}%</td>
                <td>{right}/{total} ({total ? Math.round((right / total) * 100) : 0}%)</td>
              </tr>
            ))}</tbody>
          </table>
          <p className="muted small">Rows in red are under 75%. Use <b>Quiz</b> on those objectives next.</p>
        </section>
        <Results answers={answers} onRestart={() => setAnswers(null)} restartLabel="Back to mock exam" />
      </div>
    );
  }

  if (exam) {
    const left = exam.endsAt - now;
    return (
      <div className="narrow stack">
        <div className="row between">
          <b className={left < 5 * 60_000 ? 'timer low' : 'timer'}>⏱ {fmt(left)}</b>
          <button className="link" onClick={() => { if (confirm('End the exam now? Unanswered questions count as wrong.')) finish(given.current, exam.qs); }}>
            End exam
          </button>
        </div>
        <QuizRunner questions={exam.qs} exam onAnswer={a => { given.current = [...given.current, a]; }} onDone={a => finish(a, exam.qs)} />
      </div>
    );
  }

  const history = [...s.exams].reverse().slice(0, 10);
  return (
    <div className="narrow stack">
      <section className="card stack">
        <h2>Mock exam</h2>
        <p>
          A timed exam drawn from all {questions.length} practice questions, in proportion to the official domain weights.
          No feedback until the end, then a breakdown by domain and objective.
        </p>
        <label>Length
          <select value={size} onChange={e => setSize(+e.target.value)}>
            {SIZES.map((x, i) => <option key={x.n} value={i}>{x.label}</option>)}
          </select>
        </label>
        <p className="muted small">
          The study guide doesn't state the question count, time limit or passing score. Check them on Snowflake's
          certification page when you register. The plan's target is <b>85%</b> or more on a full mock exam.
        </p>
        <button className="primary" disabled={live.length < domains.length} onClick={start}>Start exam</button>
      </section>
      {history.length > 0 && (
        <section className="card">
          <h2>Past attempts</h2>
          <table className="domains">
            <thead><tr><th>Date</th><th>Score</th></tr></thead>
            <tbody>{history.map(h => (
              <tr key={h.date} className={h.score / h.total < 0.85 ? '' : 'good'}>
                <td>{new Date(h.date).toLocaleString()}</td>
                <td>{h.score}/{h.total} ({Math.round((h.score / h.total) * 100)}%)</td>
              </tr>
            ))}</tbody>
          </table>
        </section>
      )}
    </div>
  );
}
