import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Question, questions } from '../lib/content';
import { useStore } from '../lib/store';
import { shuffle } from '../lib/util';
import { ScopeSelect, inScope } from '../components';
import { Answer, QuizRunner, Results } from '../QuizRunner';

type Mode = 'all' | 'unseen' | 'missed';

export default function Quiz() {
  const [params, setParams] = useSearchParams();
  const scope = params.get('obj') ?? 'all';
  const s = useStore();
  const [mode, setMode] = useState<Mode>('all');
  const [count, setCount] = useState(10);
  const [active, setActive] = useState<Question[] | null>(null);
  const [answers, setAnswers] = useState<Answer[] | null>(null);

  const pool = questions.filter(q => inScope(scope, q.objective) && (
    mode === 'all' || (mode === 'unseen' ? !s.questions[q.id] : s.questions[q.id] && !s.questions[q.id].lastCorrect)));

  const start = (qs: Question[]) => { setAnswers(null); setActive(qs); };

  if (answers) return (
    <div className="narrow">
      <Results answers={answers}
        onRetry={() => start(shuffle(answers.filter(a => !a.correct).map(a => a.q)))}
        onRestart={() => { setAnswers(null); setActive(null); }} />
    </div>
  );

  if (active) return (
    <div className="narrow stack">
      <QuizRunner questions={active} onDone={setAnswers} />
      <button className="link" onClick={() => setActive(null)}>← Quit quiz</button>
    </div>
  );

  return (
    <div className="narrow card stack">
      <h2>Practice quiz</h2>
      <label>Scope <ScopeSelect value={scope} onChange={v => setParams(v === 'all' ? {} : { obj: v })} /></label>
      <label>Questions
        <select value={mode} onChange={e => setMode(e.target.value as Mode)}>
          <option value="all">All</option>
          <option value="unseen">Not yet answered</option>
          <option value="missed">Last answered wrong</option>
        </select>
      </label>
      <label>How many
        <select value={count} onChange={e => setCount(+e.target.value)}>
          {[5, 10, 20, 40, 9999].map(n => <option key={n} value={n}>{n === 9999 ? 'All' : n}</option>)}
        </select>
      </label>
      <p className="muted">{pool.length} questions match. Explanations are shown after each answer.</p>
      <button className="primary" disabled={!pool.length} onClick={() => start(shuffle(pool).slice(0, count))}>Start</button>
    </div>
  );
}
