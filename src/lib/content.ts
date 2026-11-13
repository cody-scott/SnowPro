import domainsData from '../../content/domains.json';
import planData from '../../content/plan.json';

export interface Objective { id: string; title: string }
export interface Domain { id: string; num: string; title: string; weight: number; color: string; objectives: Objective[] }
export interface Question {
  id: string; objective: string; question: string; options: string[];
  answer: number[]; explanation: string; ref?: string;
}
export interface Flashcard { id: string; objective: string; front: string; back: string }
export interface PlanWeek { week: number; focus: string; tasks: { id: string; text: string }[] }

export const domains = domainsData as Domain[];
export const plan = planData as PlanWeek[];

// Content is discovered by folder: content/<domainId>/{questions.json, flashcards.json, <objective>.md}
const qMods = import.meta.glob('../../content/*/questions.json', { eager: true, import: 'default' });
const fMods = import.meta.glob('../../content/*/flashcards.json', { eager: true, import: 'default' });
const noteMods = import.meta.glob('../../content/*/*.md', { eager: true, query: '?raw', import: 'default' });

export const questions: Question[] = Object.values(qMods).flat() as Question[];
export const flashcards: Flashcard[] = Object.values(fMods).flat() as Flashcard[];

export const notes: Record<string, string> = {};
for (const [path, md] of Object.entries(noteMods)) {
  const id = path.split('/').pop()!.replace(/\.md$/, '');
  notes[id] = md as string;
}

export const domainOf = (objectiveId: string) => domains.find(d => objectiveId.startsWith(d.num.split('.')[0] + '.'))!;
export const objectiveTitle = (id: string) =>
  domains.flatMap(d => d.objectives).find(o => o.id === id)?.title ?? id;
export const hasContent = (d: Domain) => d.objectives.some(o => notes[o.id]);
