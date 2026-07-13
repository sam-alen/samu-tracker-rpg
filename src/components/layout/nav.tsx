import type { ReactNode } from 'react';
import {
  LayoutDashboard, CheckSquare, Target, BookOpen,
  Wallet, Store, CalendarCheck, Settings, FolderKanban, Compass, Link2, Trophy,
} from 'lucide-react';

export type NavSection =
  | 'dashboard' | 'missions' | 'habits' | 'achievements' | 'focus' | 'projects' | 'recommendations' | 'links'
  | 'finances' | 'rewards' | 'monthly-review' | 'settings';

interface NavItem {
  id: NavSection;
  label: string;
  icon: ReactNode;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    title: 'Aventura',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
      { id: 'missions', label: 'Misiones', icon: <Target size={18} /> },
      { id: 'habits', label: 'Hábitos', icon: <CheckSquare size={18} /> },
      { id: 'achievements', label: 'Logros', icon: <Trophy size={18} /> },
    ],
  },
  {
    title: 'Entrenamiento',
    items: [
      { id: 'focus', label: 'Enfoque', icon: <BookOpen size={18} /> },
      { id: 'projects', label: 'Proyectos', icon: <FolderKanban size={18} /> },
      { id: 'recommendations', label: 'Recomendaciones', icon: <Compass size={18} /> },
      { id: 'links', label: 'Enlaces', icon: <Link2 size={18} /> },
    ],
  },
  {
    title: 'Tesorería',
    items: [
      { id: 'finances', label: 'Finanzas', icon: <Wallet size={18} /> },
      { id: 'rewards', label: 'Tienda', icon: <Store size={18} /> },
      { id: 'monthly-review', label: 'Revisión mensual', icon: <CalendarCheck size={18} /> },
      { id: 'settings', label: 'Configuración', icon: <Settings size={18} /> },
    ],
  },
];
