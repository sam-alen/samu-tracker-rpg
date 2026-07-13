import { useState } from 'react';
import { BookOpen, Timer, Library } from 'lucide-react';
import { SectionHeader } from '../ui/Card';
import { Tabs } from '../ui/Tabs';
import { Study } from '../study/Study';
import { Pomodoro } from '../pomodoro/Pomodoro';
import { Books } from '../books/Books';

type FocusTab = 'study' | 'pomodoro' | 'books';

export function Focus() {
  const [tab, setTab] = useState<FocusTab>('study');

  return (
    <div>
      <SectionHeader
        title="Enfoque"
        subtitle="Entrena tu mente: estudio, sesiones profundas y lectura"
      />

      <Tabs
        tabs={[
          { id: 'study', label: 'Estudio', icon: <BookOpen size={15} /> },
          { id: 'pomodoro', label: 'Pomodoro', icon: <Timer size={15} /> },
          { id: 'books', label: 'Libros', icon: <Library size={15} /> },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'study' && <Study />}
      {tab === 'pomodoro' && <Pomodoro />}
      {tab === 'books' && <Books />}
    </div>
  );
}
