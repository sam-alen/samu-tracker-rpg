import { useState, useMemo } from 'react';
import {
  Plus, Trash2, ExternalLink, Link2, User, Gamepad2, TrendingUp, ShoppingCart,
} from 'lucide-react';
import { Card, SectionHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Tabs } from '../ui/Tabs';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { storage } from '../../lib/storage';
import { todayISO } from '../../lib/xp';
import type { SavedLink, LinkCategory } from '../../types';

function genId() { return Math.random().toString(36).slice(2, 10); }

/** Prefix a bare domain/path with https:// so saved links are always clickable */
function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function displayUrl(url: string): string {
  return url.replace(/^https?:\/\//i, '').replace(/\/$/, '');
}

const CATEGORIES: { id: LinkCategory; label: string; icon: React.ReactNode }[] = [
  { id: 'personal', label: 'Personal', icon: <User size={15} /> },
  { id: 'diversion', label: 'Diversión', icon: <Gamepad2 size={15} /> },
  { id: 'mejora', label: 'Mejora', icon: <TrendingUp size={15} /> },
  { id: 'compras', label: 'Compras', icon: <ShoppingCart size={15} /> },
];

function emptyForm(category: LinkCategory): Omit<SavedLink, 'id' | 'createdAt'> {
  return { title: '', url: '', category };
}

export function Links() {
  const [links, setLinks] = useLocalStorage<SavedLink[]>(storage.keys.savedLinks, []);
  const [tab, setTab] = useState<LinkCategory>('personal');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm(tab));

  const filtered = useMemo(
    () => [...links].filter(l => l.category === tab).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [links, tab],
  );

  const countByCategory = useMemo(() => {
    const map: Record<LinkCategory, number> = { personal: 0, diversion: 0, mejora: 0, compras: 0 };
    links.forEach(l => { map[l.category]++; });
    return map;
  }, [links]);

  function openAdd() {
    setForm(emptyForm(tab));
    setShowModal(true);
  }

  function save() {
    if (!form.title.trim() || !form.url.trim()) return;
    const link: SavedLink = {
      id: genId(),
      title: form.title.trim(),
      url: normalizeUrl(form.url),
      category: form.category,
      createdAt: todayISO(),
    };
    setLinks(prev => [link, ...prev]);
    setShowModal(false);
  }

  function remove(id: string) {
    setLinks(prev => prev.filter(l => l.id !== id));
  }

  const activeCat = CATEGORIES.find(c => c.id === tab)!;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Enlaces"
        subtitle="Guarda links interesantes por tema, listos para cuando tengas tiempo"
        action={<Button variant="primary" size="sm" onClick={openAdd}><Plus size={14} className="mr-1 inline" />Agregar</Button>}
      />

      <Tabs
        tabs={CATEGORIES.map(c => ({ id: c.id, label: `${c.label} (${countByCategory[c.id]})`, icon: c.icon }))}
        active={tab}
        onChange={setTab}
      />

      {filtered.length === 0 && (
        <Card className="text-center py-10">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gold-900/30 border border-gold-600/30 text-gold-300 mb-3">
            {activeCat.icon}
          </span>
          <p className="text-gray-500 text-sm">Sin enlaces en "{activeCat.label}" todavía.</p>
          <p className="text-gray-700 text-xs mt-1">Guarda el primero con el botón "Agregar".</p>
        </Card>
      )}

      <div className="space-y-2">
        {filtered.map(link => (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 bg-gradient-to-b from-[#0C1424] to-[#080D19] border border-[#1B2A47] hover:border-gold-400/30 transition-colors rounded-xl px-4 py-3"
          >
            <Link2 size={15} className="text-gold-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-200 truncate group-hover:text-gold-200 transition-colors">{link.title}</p>
              <p className="text-xs text-gray-600 truncate">{displayUrl(link.url)}</p>
            </div>
            <ExternalLink size={14} className="text-gray-600 group-hover:text-gold-300 transition-colors shrink-0" />
            <button
              onClick={e => { e.preventDefault(); e.stopPropagation(); remove(link.id); }}
              className="p-1.5 text-gray-600 hover:text-red-400 transition-colors shrink-0"
            >
              <Trash2 size={14} />
            </button>
          </a>
        ))}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Guardar enlace">
        <div className="space-y-4">
          <Input
            label="Título"
            value={form.title}
            onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            placeholder="Nombre para reconocerlo después"
            autoFocus
          />
          <Input
            label="URL"
            value={form.url}
            onChange={e => setForm(p => ({ ...p, url: e.target.value }))}
            placeholder="ejemplo.com/lo-que-sea"
          />
          <div>
            <p className="block text-xs font-medium text-gray-400 mb-1.5 tracking-wide">Categoría</p>
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, category: c.id }))}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                    form.category === c.id
                      ? 'bg-gold-900/40 border-gold-600/50 text-gold-200'
                      : 'bg-gray-800/40 border-gray-700/30 text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {c.icon}
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button variant="primary" onClick={save}>Guardar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
