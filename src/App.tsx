import { NavLink, Route, Routes } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Notes from './pages/Notes';
import Flashcards from './pages/Flashcards';
import Quiz from './pages/Quiz';
import Exam from './pages/Exam';

const links = [
  ['/', 'Plan'], ['/notes', 'Notes'], ['/cards', 'Flashcards'], ['/quiz', 'Quiz'], ['/exam', 'Mock exam'],
] as const;

export default function App() {
  return (
    <div className="shell">
      <header className="top">
        <span className="brand">❄ SnowPro Core <small>COF-C03</small></span>
        <nav>
          {links.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === '/'}>{label}</NavLink>
          ))}
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/notes/:id" element={<Notes />} />
          <Route path="/cards" element={<Flashcards />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/exam" element={<Exam />} />
        </Routes>
      </main>
    </div>
  );
}
