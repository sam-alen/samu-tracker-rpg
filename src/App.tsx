import { useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { BottomNav } from './components/layout/BottomNav';
import { FxLayer } from './components/fx/FxLayer';
import { Dashboard } from './components/dashboard/Dashboard';
import { Habits } from './components/habits/Habits';
import { Missions } from './components/missions/Missions';
import { Achievements } from './components/achievements/Achievements';
import { Focus } from './components/focus/Focus';
import { Recommendations } from './components/recommendations/Recommendations';
import { Links } from './components/links/Links';
import { Finances } from './components/finances/Finances';
import { Rewards } from './components/rewards/Rewards';
import { MonthlyReview } from './components/monthly-review/MonthlyReview';
import { Settings } from './components/settings/Settings';
import { Projects } from './components/projects/Projects';
import type { NavSection } from './components/layout/Sidebar';

export default function App() {
  const [active, setActive] = useState<NavSection>('dashboard');

  const SECTIONS: Record<NavSection, React.ReactNode> = {
    dashboard: <Dashboard onNavigate={setActive} />,
    missions: <Missions />,
    habits: <Habits />,
    achievements: <Achievements />,
    focus: <Focus />,
    projects: <Projects />,
    recommendations: <Recommendations />,
    links: <Links />,
    finances: <Finances />,
    rewards: <Rewards />,
    'monthly-review': <MonthlyReview />,
    settings: <Settings />,
  };

  return (
    <div className="app-bg flex h-screen overflow-hidden">
      <Sidebar active={active} onChange={setActive} />

      <main className="flex-1 overflow-y-auto">
        {/* key re-mounts the wrapper per section so the entrance animation replays */}
        <div key={active} className="rise-in max-w-3xl mx-auto px-4 pt-6 pb-24 md:pb-8">
          {SECTIONS[active]}
        </div>
      </main>

      <BottomNav active={active} onChange={setActive} />
      <FxLayer />
    </div>
  );
}
