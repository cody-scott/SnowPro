import { domains, notes } from './lib/content';

/** Select for "all / domain / objective" scope; value format: "all" | "d1" | "1.4". */
export function ScopeSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}>
      <option value="all">All available content</option>
      {domains.filter(d => d.objectives.some(o => notes[o.id])).map(d => (
        <optgroup key={d.id} label={`${d.num} ${d.title}`}>
          <option value={d.id}>All of domain {d.num}</option>
          {d.objectives.filter(o => notes[o.id]).map(o => <option key={o.id} value={o.id}>{o.id} {o.title}</option>)}
        </optgroup>
      ))}
    </select>
  );
}

export function inScope(scope: string, objective: string) {
  if (scope === 'all') return true;
  if (scope.startsWith('d')) return domains.find(d => d.id === scope)!.objectives.some(o => o.id === objective);
  return objective === scope;
}
