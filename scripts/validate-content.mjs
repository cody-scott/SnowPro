// Validates content/ so a bad edit fails the build instead of breaking the site.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
const root = new URL('../content/', import.meta.url);
const read = p => JSON.parse(readFileSync(new URL(p, root), 'utf8'));
const domains = read('domains.json');
const objectives = new Set(domains.flatMap(d => d.objectives.map(o => o.id)));
const errors = []; const ids = new Set();
const err = (where, msg) => errors.push(`${where}: ${msg}`);
let nq = 0, nf = 0;
for (const d of domains) {
  if (!existsSync(new URL(`${d.id}/`, root))) continue;
  for (const f of readdirSync(new URL(`${d.id}/`, root))) {
    if (f.endsWith('.md') && !objectives.has(f.replace('.md', ''))) err(`${d.id}/${f}`, 'note file does not match an objective id');
  }
  const qp = `${d.id}/questions.json`, fp = `${d.id}/flashcards.json`;
  if (existsSync(new URL(qp, root))) for (const q of read(qp)) {
    nq++; const w = `${qp} ${q.id}`;
    if (ids.has(q.id)) err(w, 'duplicate id'); ids.add(q.id);
    if (!objectives.has(q.objective)) err(w, `unknown objective ${q.objective}`);
    if (!q.question || !Array.isArray(q.options) || q.options.length < 2) err(w, 'needs question and ≥2 options');
    if (!Array.isArray(q.answer) || !q.answer.length || q.answer.some(a => a < 0 || a >= q.options.length)) err(w, 'answer index out of range');
    if (new Set(q.answer).size !== q.answer.length) err(w, 'duplicate answer index');
    if (!q.explanation) err(w, 'missing explanation');
  }
  if (existsSync(new URL(fp, root))) for (const c of read(fp)) {
    nf++; const w = `${fp} ${c.id}`;
    if (ids.has(c.id)) err(w, 'duplicate id'); ids.add(c.id);
    if (!objectives.has(c.objective)) err(w, `unknown objective ${c.objective}`);
    if (!c.front || !c.back) err(w, 'needs front and back');
  }
}
const plan = read('plan.json');
for (const w of plan) for (const t of w.tasks) { if (ids.has(t.id)) err(`plan ${t.id}`, 'duplicate id'); ids.add(t.id); }
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`content ok: ${nq} questions, ${nf} flashcards, ${domains.length} domains`);
