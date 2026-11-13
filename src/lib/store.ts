import { useEffect, useState } from 'react';

export interface QStat { seen: number; correct: number; lastCorrect: boolean }
export interface CardStat { box: number; due: number } // Leitner box 1-5, due = epoch ms
export interface ExamResult { date: number; score: number; total: number; byObjective: Record<string, [number, number]> }
export interface State {
  questions: Record<string, QStat>;
  cards: Record<string, CardStat>;
  tasks: Record<string, boolean>;
  notesRead: Record<string, boolean>;
  exams: ExamResult[];
  examDate?: string;
}

const KEY = 'snowpro-study-v1';
const empty: State = { questions: {}, cards: {}, tasks: {}, notesRead: {}, exams: [] };

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...empty, ...JSON.parse(raw) } : empty;
  } catch { return empty; }
}

let state = load();
const listeners = new Set<() => void>();

export function update(fn: (s: State) => State) {
  state = fn(state);
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage unavailable */ }
  listeners.forEach(l => l());
}

export function useStore(): State {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force(n => n + 1);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
  return state;
}

export function exportState() { return JSON.stringify(state, null, 1); }
export function importState(json: string) { update(() => ({ ...empty, ...JSON.parse(json) })); }
export function resetState() { update(() => empty); }

// Leitner spaced repetition: intervals in days per box.
const INTERVALS = [0, 1, 3, 7, 14, 30];
const DAY = 86_400_000;
export function gradeCard(id: string, knew: boolean) {
  update(s => {
    const cur = s.cards[id]?.box ?? 0;
    const box = knew ? Math.min(cur + 1, 5) : 1;
    return { ...s, cards: { ...s.cards, [id]: { box, due: Date.now() + INTERVALS[box] * DAY } } };
  });
}

export function recordAnswer(id: string, correct: boolean) {
  update(s => {
    const q = s.questions[id] ?? { seen: 0, correct: 0, lastCorrect: false };
    return { ...s, questions: { ...s.questions, [id]: { seen: q.seen + 1, correct: q.correct + (correct ? 1 : 0), lastCorrect: correct } } };
  });
}

export const toggle = (field: 'tasks' | 'notesRead', id: string) =>
  update(s => ({ ...s, [field]: { ...s[field], [id]: !s[field][id] } }));
