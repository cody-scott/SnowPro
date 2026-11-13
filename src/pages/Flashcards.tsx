import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { flashcards, objectiveTitle } from '../lib/content';
import { gradeCard, useStore } from '../lib/store';
import { shuffle } from '../lib/util';
import { ScopeSelect, inScope } from '../components';

export default function Flashcards() {
  const [params, setParams] = useSearchParams();
  const scope = params.get('obj') ?? 'all';
  const [dueOnly, setDueOnly] = useState(true);
  const s = useStore();
  const [round, setRound] = useState(0);

  // Build the deck once per scope/mode/round so grading doesn't reshuffle mid-session.
  const deck = useMemo(() => {
    const now = Date.now();
    return shuffle(flashcards.filter(c => inScope(scope, c.objective) && (!dueOnly || (s.cards[c.id]?.due ?? 0) <= now)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, dueOnly, round]);

  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  useEffect(() => { setI(0); setFlipped(false); }, [deck]);

  const card = deck[i];
  const grade = (knew: boolean) => { gradeCard(card.id, knew); setFlipped(false); setI(i + 1); };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (!card || (e.target as HTMLElement).tagName === 'SELECT') return;
      if (e.key === ' ') { e.preventDefault(); setFlipped(f => !f); }
      else if (flipped && e.key === '1') grade(false);
      else if (flipped && e.key === '2') grade(true);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  });

  return (
    <div className="stack narrow">
      <div className="card row">
        <ScopeSelect value={scope} onChange={v => setParams(v === 'all' ? {} : { obj: v })} />
        <label className="check"><input type="checkbox" checked={dueOnly} onChange={e => setDueOnly(e.target.checked)} /><span>Due only</span></label>
        <span className="muted">{deck.length ? `${Math.min(i + 1, deck.length)} / ${deck.length}` : ''}</span>
      </div>

      {card ? (
        <>
          <button className={`flash ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped(f => !f)}>
            <small>{card.objective} · {objectiveTitle(card.objective)} · box {s.cards[card.id]?.box ?? 0}</small>
            <div className="face">{flipped ? card.back : card.front}</div>
            <small className="muted">{flipped ? 'Answer' : 'Click or press Space to flip'}</small>
          </button>
          {flipped && (
            <div className="row center">
              <button className="danger" onClick={() => grade(false)}>Again <kbd>1</kbd></button>
              <button className="primary" onClick={() => grade(true)}>Got it <kbd>2</kbd></button>
            </div>
          )}
        </>
      ) : (
        <div className="card center-text">
          <p>{deck.length ? 'Session complete 🎉' : dueOnly ? 'No cards due in this scope.' : 'No cards in this scope yet.'}</p>
          <div className="row center">
            {dueOnly && <button onClick={() => setDueOnly(false)}>Study all cards</button>}
            <button onClick={() => setRound(r => r + 1)}>Restart</button>
          </div>
        </div>
      )}
    </div>
  );
}
