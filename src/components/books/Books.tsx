import { useState, useMemo } from 'react';
import { BookOpen, Plus, Star, ChevronDown, ChevronUp, Trash2, Edit2, Check, X } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useAttributes } from '../../hooks/useAttributes';
import { BOOK_FINISH_ATTRIBUTE_XP } from '../../lib/attributes';
import { checkAchievements } from '../../lib/achievements';
import { storage } from '../../lib/storage';
import type { Book, BookStatus } from '../../types';

const STATUS_LABELS: Record<BookStatus, string> = {
  'want-to-read': 'Por leer',
  reading: 'Leyendo',
  done: 'Terminado',
  dropped: 'Abandonado',
};

const STATUS_COLORS: Record<BookStatus, 'gray' | 'blue' | 'green' | 'red'> = {
  'want-to-read': 'gray',
  reading: 'blue',
  done: 'green',
  dropped: 'red',
};

const STATUS_ORDER: BookStatus[] = ['reading', 'want-to-read', 'done', 'dropped'];

const EMPTY_BOOK: Omit<Book, 'id' | 'createdAt'> = {
  title: '',
  author: '',
  status: 'want-to-read',
  rating: 0,
  notes: '',
  startDate: '',
  finishDate: '',
  totalPages: 0,
  currentPage: 0,
};

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange?.(n === value ? 0 : n)}
          className={`transition-colors ${n <= value ? 'text-amber-400' : 'text-gray-700'} ${onChange ? 'hover:text-amber-300' : 'cursor-default'}`}
        >
          <Star size={14} fill={n <= value ? 'currentColor' : 'none'} />
        </button>
      ))}
    </div>
  );
}

export function Books() {
  const [books, setBooks] = useLocalStorage<Book[]>(storage.keys.books, []);
  const { gainAttribute, loseAttribute } = useAttributes();
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Book, 'id' | 'createdAt'>>(EMPTY_BOOK);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<BookStatus | 'all'>('all');

  const counts = useMemo(() => {
    const c: Record<BookStatus, number> = { 'want-to-read': 0, reading: 0, done: 0, dropped: 0 };
    books.forEach(b => c[b.status]++);
    return c;
  }, [books]);

  const filtered = useMemo(() => {
    const list = filterStatus === 'all' ? books : books.filter(b => b.status === filterStatus);
    return [...list].sort((a, b) => {
      const oi = STATUS_ORDER.indexOf(a.status);
      const oj = STATUS_ORDER.indexOf(b.status);
      if (oi !== oj) return oi - oj;
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [books, filterStatus]);

  function openAdd() {
    setEditId(null);
    setForm(EMPTY_BOOK);
    setShowModal(true);
  }

  function openEdit(book: Book) {
    setEditId(book.id);
    const { id: _id, createdAt: _ca, ...rest } = book;
    setForm(rest);
    setShowModal(true);
  }

  // gainAttribute outside the updater: StrictMode re-runs updaters, doubling side effects.
  // Un-finishing a book reverts the WIS point so it can't be farmed by re-toggling.
  function save() {
    if (!form.title.trim()) return;
    const wasDone = editId ? books.find(b => b.id === editId)?.status === 'done' : false;
    const justFinished = !wasDone && form.status === 'done';
    const justUnfinished = wasDone && form.status !== 'done';

    if (editId) {
      setBooks(books.map(b => b.id === editId ? { ...b, ...form } : b));
    } else {
      const book: Book = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        ...form,
        title: form.title.trim(),
        author: form.author.trim(),
      };
      setBooks([...books, book]);
    }
    if (justFinished) { gainAttribute('WIS', BOOK_FINISH_ATTRIBUTE_XP); checkAchievements(); }
    if (justUnfinished) loseAttribute('WIS', BOOK_FINISH_ATTRIBUTE_XP);
    setShowModal(false);
  }

  function deleteBook(id: string) {
    setBooks(books.filter(b => b.id !== id));
  }

  function readPct(book: Book) {
    if (!book.totalPages || book.status === 'want-to-read') return null;
    if (book.status === 'done') return 100;
    if (!book.currentPage) return 0;
    return Math.min(Math.round((book.currentPage / book.totalPages) * 100), 100);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">{books.length} libros registrados · {counts.done} terminados</p>
        <Button onClick={openAdd} size="sm">
          <Plus size={14} /> Agregar
        </Button>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['all', ...STATUS_ORDER] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              filterStatus === s
                ? 'bg-gold-900/40 border-gold-600/50 text-gold-200'
                : 'bg-gray-800/40 border-gray-700/30 text-gray-500 hover:text-gray-300'
            }`}
          >
            {s === 'all' ? `Todos (${books.length})` : `${STATUS_LABELS[s]} (${counts[s]})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <Card className="text-center py-10">
          <BookOpen size={32} className="text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Sin libros en esta lista</p>
        </Card>
      )}

      <div className="space-y-2">
        {filtered.map(book => {
          const pct = readPct(book);
          const isExpanded = expandedId === book.id;

          return (
            <Card key={book.id} className="transition-all">
              <div
                className="flex items-start gap-3 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : book.id)}
              >
                {/* Book icon / cover placeholder */}
                <div className="w-10 h-14 rounded bg-gradient-to-b from-arcane-800/50 to-[#101B31] border border-[#1B2A47] flex items-center justify-center shrink-0">
                  <BookOpen size={16} className="text-gold-300" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white text-sm leading-tight">{book.title}</h3>
                      {book.author && <p className="text-xs text-gray-500 mt-0.5">{book.author}</p>}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Badge color={STATUS_COLORS[book.status]}>{STATUS_LABELS[book.status]}</Badge>
                      {isExpanded ? <ChevronUp size={14} className="text-gray-600" /> : <ChevronDown size={14} className="text-gray-600" />}
                    </div>
                  </div>

                  {book.rating > 0 && (
                    <div className="mt-1">
                      <StarRating value={book.rating} />
                    </div>
                  )}

                  {pct !== null && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>{book.currentPage || 0} / {book.totalPages} págs</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-gold-600 to-gold-300 transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-[#1B2A47] space-y-3">
                  {book.notes && (
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Notas</p>
                      <p className="text-sm text-gray-300 whitespace-pre-wrap">{book.notes}</p>
                    </div>
                  )}
                  <div className="flex gap-4 text-xs text-gray-600">
                    {book.startDate && <span>Inicio: {book.startDate}</span>}
                    {book.finishDate && <span>Fin: {book.finishDate}</span>}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(book)}>
                      <Edit2 size={12} /> Editar
                    </Button>
                    <button
                      onClick={() => deleteBook(book.id)}
                      className="text-xs px-2 py-1 rounded-lg text-gray-600 hover:text-red-400 transition-colors flex items-center gap-1"
                    >
                      <Trash2 size={12} /> Eliminar
                    </button>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Add / Edit modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editId ? 'Editar libro' : 'Agregar libro'}
      >
        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-gray-400 block mb-1">Título *</label>
              <Input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Título del libro"
                autoFocus
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-400 block mb-1">Autor</label>
              <Input
                value={form.author}
                onChange={e => setForm(f => ({ ...f, author: e.target.value }))}
                placeholder="Nombre del autor"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Estado</label>
              <select
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value as BookStatus }))}
                className="w-full bg-[#04060B] border border-[#1B2A47] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gold-400/60"
              >
                {STATUS_ORDER.map(s => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Rating</label>
              <div className="flex items-center h-[38px]">
                <StarRating value={form.rating} onChange={v => setForm(f => ({ ...f, rating: v }))} />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Total páginas</label>
              <Input
                type="number"
                value={form.totalPages || ''}
                onChange={e => setForm(f => ({ ...f, totalPages: Number(e.target.value) }))}
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Página actual</label>
              <Input
                type="number"
                value={form.currentPage || ''}
                onChange={e => setForm(f => ({ ...f, currentPage: Number(e.target.value) }))}
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Fecha inicio</label>
              <Input
                type="date"
                value={form.startDate}
                onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Fecha fin</label>
              <Input
                type="date"
                value={form.finishDate}
                onChange={e => setForm(f => ({ ...f, finishDate: e.target.value }))}
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-400 block mb-1">Notas</label>
              <textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Resumen, aprendizajes, citas..."
                rows={3}
                className="w-full bg-[#04060B] border border-[#1B2A47] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gold-400/60 resize-none"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button onClick={save} disabled={!form.title.trim()} className="flex-1">
              <Check size={14} /> {editId ? 'Guardar' : 'Agregar'}
            </Button>
            <Button variant="ghost" onClick={() => setShowModal(false)}>
              <X size={14} />
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
