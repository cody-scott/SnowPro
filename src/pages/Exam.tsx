import { domains, hasContent } from '../lib/content';

export default function Exam() {
  const ready = domains.filter(hasContent);
  return (
    <div className="narrow card stack">
      <h2>Mock exam</h2>
      <p>A timed, 100-question exam that follows the real domain weights and ends with a weak-area breakdown.</p>
      <p className="muted">It unlocks once all five domains have content ({ready.length}/5 ready). Until then, use <b>Quiz</b> with scope “All available content” for mixed practice.</p>
    </div>
  );
}
