import { useState, useMemo } from 'react';
import { FolderKanban, Plus, Check, X, ChevronDown, ChevronUp, Trash2, Edit2, Circle, CheckCircle2 } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { storage } from '../../lib/storage';
import { checkAchievements } from '../../lib/achievements';
import type { Project, ProjectTask, ProjectStatus } from '../../types';

const STATUS_LABELS: Record<ProjectStatus, string> = {
  idea: 'Idea',
  active: 'Activo',
  paused: 'Pausado',
  done: 'Terminado',
};

const STATUS_COLORS: Record<ProjectStatus, 'gray' | 'blue' | 'gold' | 'green'> = {
  idea: 'gray',
  active: 'blue',
  paused: 'gold',
  done: 'green',
};

const STATUS_ORDER: ProjectStatus[] = ['active', 'paused', 'idea', 'done'];

const EMPTY_FORM = {
  name: '',
  description: '',
  status: 'idea' as ProjectStatus,
  priority: 'medium' as Project['priority'],
  tags: [] as string[],
};

export function Projects() {
  const [projects, setProjects] = useLocalStorage<Project[]>(storage.keys.projects, []);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [tagInput, setTagInput] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newTaskName, setNewTaskName] = useState('');
  const [filterStatus, setFilterStatus] = useState<ProjectStatus | 'all'>('all');

  const counts = useMemo(() => {
    const c: Record<ProjectStatus, number> = { idea: 0, active: 0, paused: 0, done: 0 };
    projects.forEach(p => c[p.status]++);
    return c;
  }, [projects]);

  const filtered = useMemo(() => {
    const list = filterStatus === 'all' ? projects : projects.filter(p => p.status === filterStatus);
    return [...list].sort((a, b) => {
      const pi = STATUS_ORDER.indexOf(a.status);
      const pj = STATUS_ORDER.indexOf(b.status);
      if (pi !== pj) return pi - pj;
      const prioOrd = { high: 0, medium: 1, low: 2 };
      return prioOrd[a.priority] - prioOrd[b.priority];
    });
  }, [projects, filterStatus]);

  function openAdd() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setTagInput('');
    setShowModal(true);
  }

  function openEdit(p: Project) {
    setEditId(p.id);
    setForm({ name: p.name, description: p.description, status: p.status, priority: p.priority, tags: [...p.tags] });
    setTagInput('');
    setShowModal(true);
  }

  function save() {
    if (!form.name.trim()) return;
    if (editId) {
      setProjects(projects.map(p =>
        p.id === editId ? { ...p, ...form, name: form.name.trim() } : p
      ));
    } else {
      const project: Project = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        tasks: [],
        ...form,
        name: form.name.trim(),
      };
      setProjects([...projects, project]);
    }
    setShowModal(false);
    checkAchievements();
  }

  function deleteProject(id: string) {
    setProjects(projects.filter(p => p.id !== id));
    if (expandedId === id) setExpandedId(null);
  }

  function addTask(projectId: string) {
    if (!newTaskName.trim()) return;
    const task: ProjectTask = {
      id: crypto.randomUUID(),
      name: newTaskName.trim(),
      done: false,
      createdAt: new Date().toISOString(),
    };
    setProjects(projects.map(p =>
      p.id === projectId ? { ...p, tasks: [...p.tasks, task] } : p
    ));
    setNewTaskName('');
  }

  function toggleTask(projectId: string, taskId: string) {
    setProjects(projects.map(p =>
      p.id === projectId
        ? { ...p, tasks: p.tasks.map(t => t.id === taskId ? { ...t, done: !t.done } : t) }
        : p
    ));
    checkAchievements();
  }

  function deleteTask(projectId: string, taskId: string) {
    setProjects(projects.map(p =>
      p.id === projectId ? { ...p, tasks: p.tasks.filter(t => t.id !== taskId) } : p
    ));
  }

  function addTag() {
    const tag = tagInput.trim();
    if (tag && !form.tags.includes(tag)) {
      setForm(f => ({ ...f, tags: [...f.tags, tag] }));
    }
    setTagInput('');
  }

  function removeTag(tag: string) {
    setForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }));
  }

  function taskProgress(project: Project) {
    if (project.tasks.length === 0) return null;
    const done = project.tasks.filter(t => t.done).length;
    return { done, total: project.tasks.length, pct: Math.round((done / project.tasks.length) * 100) };
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FolderKanban size={20} className="text-purple-400" />
            Proyectos
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">{projects.length} proyectos · {counts.active} activos</p>
        </div>
        <Button onClick={openAdd} size="sm">
          <Plus size={14} /> Nuevo
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
                ? 'bg-purple-600/20 border-purple-600/40 text-purple-300'
                : 'bg-gray-800/40 border-gray-700/30 text-gray-500 hover:text-gray-300'
            }`}
          >
            {s === 'all' ? `Todos (${projects.length})` : `${STATUS_LABELS[s]} (${counts[s]})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <Card className="text-center py-10">
          <FolderKanban size={32} className="text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Sin proyectos en esta categoría</p>
        </Card>
      )}

      <div className="space-y-3">
        {filtered.map(project => {
          const progress = taskProgress(project);
          const isExpanded = expandedId === project.id;

          return (
            <Card key={project.id}>
              <div
                className="flex items-start gap-3 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : project.id)}
              >
                {/* Priority indicator */}
                <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                  project.priority === 'high' ? 'bg-red-500' : project.priority === 'medium' ? 'bg-yellow-500' : 'bg-gray-600'
                }`} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-white text-sm leading-tight">{project.name}</h3>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge color={STATUS_COLORS[project.status]}>{STATUS_LABELS[project.status]}</Badge>
                      {isExpanded ? <ChevronUp size={14} className="text-gray-600" /> : <ChevronDown size={14} className="text-gray-600" />}
                    </div>
                  </div>

                  {project.description && (
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2">{project.description}</p>
                  )}

                  {project.tags.length > 0 && (
                    <div className="flex gap-1 flex-wrap mt-2">
                      {project.tags.map(tag => (
                        <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-purple-900/20 border border-purple-800/30 text-purple-400">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {progress !== null && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>{progress.done}/{progress.total} tareas</span>
                        <span>{progress.pct}%</span>
                      </div>
                      <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${progress.pct}%`,
                            background: progress.pct === 100 ? '#10B981' : '#8B5CF6',
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Expanded: tasks */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-[#1B2A47] space-y-4">
                  {/* Task list */}
                  <div>
                    <p className="text-xs text-gray-600 mb-2 font-medium">Tareas</p>
                    <div className="space-y-1.5">
                      {project.tasks.length === 0 && (
                        <p className="text-xs text-gray-700">Sin tareas aún</p>
                      )}
                      {project.tasks.map(task => (
                        <div key={task.id} className="flex items-center gap-2 group">
                          <button
                            onClick={() => toggleTask(project.id, task.id)}
                            className="shrink-0 text-gray-600 hover:text-emerald-400 transition-colors"
                          >
                            {task.done
                              ? <CheckCircle2 size={15} className="text-emerald-500" />
                              : <Circle size={15} />
                            }
                          </button>
                          <span className={`flex-1 text-sm ${task.done ? 'line-through text-gray-600' : 'text-gray-300'}`}>
                            {task.name}
                          </span>
                          <button
                            onClick={() => deleteTask(project.id, task.id)}
                            className="opacity-0 group-hover:opacity-100 text-gray-700 hover:text-red-400 transition-all"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add task inline */}
                    <div className="flex gap-2 mt-3">
                      <Input
                        value={newTaskName}
                        onChange={e => setNewTaskName(e.target.value)}
                        placeholder="Nueva tarea..."
                        onKeyDown={e => e.key === 'Enter' && addTask(project.id)}
                        className="flex-1 text-xs"
                      />
                      <Button size="sm" onClick={() => addTask(project.id)} disabled={!newTaskName.trim()}>
                        <Plus size={13} />
                      </Button>
                    </div>
                  </div>

                  {/* Project actions */}
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(project)}>
                      <Edit2 size={12} /> Editar
                    </Button>
                    <button
                      onClick={() => deleteProject(project.id)}
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
        title={editId ? 'Editar proyecto' : 'Nuevo proyecto'}
      >
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Nombre *</label>
            <Input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Nombre del proyecto"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Descripción</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="¿De qué trata este proyecto?"
              rows={2}
              className="w-full bg-[#04060B] border border-[#1B2A47] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gold-400/60 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Estado</label>
              <select
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value as ProjectStatus }))}
                className="w-full bg-[#04060B] border border-[#1B2A47] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gold-400/60"
              >
                {STATUS_ORDER.map(s => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Prioridad</label>
              <select
                value={form.priority}
                onChange={e => setForm(f => ({ ...f, priority: e.target.value as Project['priority'] }))}
                className="w-full bg-[#04060B] border border-[#1B2A47] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gold-400/60"
              >
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Etiquetas</label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                placeholder="ej. Salesforce, Web..."
                onKeyDown={e => e.key === 'Enter' && addTag()}
                className="flex-1"
              />
              <Button size="sm" variant="ghost" onClick={addTag}>+ Tag</Button>
            </div>
            {form.tags.length > 0 && (
              <div className="flex gap-1.5 flex-wrap mt-2">
                {form.tags.map(tag => (
                  <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-purple-900/20 border border-purple-800/30 text-purple-400 flex items-center gap-1">
                    {tag}
                    <button onClick={() => removeTag(tag)} className="hover:text-red-400 transition-colors">
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2 pt-1">
            <Button onClick={save} disabled={!form.name.trim()} className="flex-1">
              <Check size={14} /> {editId ? 'Guardar' : 'Crear'}
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
