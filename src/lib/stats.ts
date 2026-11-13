import { Domain, flashcards, questions } from './content';
import { State } from './store';

export interface Mastery { quizAcc: number | null; answered: number; total: number; cardsMastered: number; cardsTotal: number; score: number }

// Mastery of a set of objectives: blends quiz accuracy (by last answer) and flashcards in box ≥ 3.
export function mastery(s: State, objectiveIds: string[]): Mastery {
  const qs = questions.filter(q => objectiveIds.includes(q.objective));
  const cs = flashcards.filter(c => objectiveIds.includes(c.objective));
  const answered = qs.filter(q => s.questions[q.id]);
  const right = answered.filter(q => s.questions[q.id].lastCorrect).length;
  const mastered = cs.filter(c => (s.cards[c.id]?.box ?? 0) >= 3).length;
  const quizPart = qs.length ? right / qs.length : 0;
  const cardPart = cs.length ? mastered / cs.length : 0;
  const wq = qs.length ? 0.7 : 0, wc = cs.length ? 0.3 : 0;
  return {
    quizAcc: answered.length ? right / answered.length : null,
    answered: answered.length, total: qs.length,
    cardsMastered: mastered, cardsTotal: cs.length,
    score: wq + wc ? (quizPart * wq + cardPart * wc) / (wq + wc) : 0,
  };
}

export const domainMastery = (s: State, d: Domain) => mastery(s, d.objectives.map(o => o.id));

export function readiness(s: State, ds: Domain[]) {
  return ds.reduce((acc, d) => acc + domainMastery(s, d).score * d.weight, 0) / 100;
}

export const pct = (x: number | null) => (x === null ? '—' : `${Math.round(x * 100)}%`);
