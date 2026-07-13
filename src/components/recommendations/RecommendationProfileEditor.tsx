import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input, Select, TextArea } from '../ui/Input';
import { RECOMMENDATION_TYPE_LABELS } from '../../data/recommendations';
import type { RecommendationBucket, RecommendationGoal, RecommendationProfile, RecommendationType } from '../../types';

function genId() { return Math.random().toString(36).slice(2, 10); }

const BUCKET_LABELS: Record<RecommendationBucket, string> = {
  'desarrollo-profesional': 'Desarrollo profesional',
  salud: 'Salud (gym + nutrición)',
  ingles: 'Inglés',
  'habitos-crecimiento': 'Hábitos y crecimiento personal',
  'hobbies-entretenimiento': 'Hobbies y entretenimiento',
  exploratorio: 'Exploratorio',
};

const BUCKET_ORDER: RecommendationBucket[] = ['desarrollo-profesional', 'salud', 'ingles', 'habitos-crecimiento', 'hobbies-entretenimiento', 'exploratorio'];

function joinArr(a: string[]): string { return a.join(', '); }
function splitArr(s: string): string[] { return s.split(',').map(x => x.trim()).filter(Boolean); }

interface Props {
  open: boolean;
  profile: RecommendationProfile;
  onClose: () => void;
  onSave: (next: RecommendationProfile) => void;
}

export function RecommendationProfileEditor({ open, profile, onClose, onSave }: Props) {
  const [draft, setDraft] = useState<RecommendationProfile>(profile);
  // Re-seed the draft from the saved profile each time the modal transitions
  // to open, discarding any unsaved edits from a previous cancelled session
  // (React's documented pattern for resetting state on a prop change).
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setDraft(profile);
  }

  function set<K extends keyof RecommendationProfile>(key: K, value: RecommendationProfile[K]) {
    setDraft(prev => ({ ...prev, [key]: value }));
  }

  function addGoal() {
    const goal: RecommendationGoal = { id: genId(), label: 'Nueva meta' };
    set('goals', [...draft.goals, goal]);
  }

  function updateGoalLabel(id: string, label: string) {
    set('goals', draft.goals.map(g => g.id === id ? { ...g, label } : g));
  }

  function removeGoal(id: string) {
    set('goals', draft.goals.filter(g => g.id !== id));
    if (draft.primaryGoalId === id) set('primaryGoalId', draft.goals[0]?.id ?? '');
    set('secondaryGoalIds', draft.secondaryGoalIds.filter(g => g !== id));
  }

  function toggleSecondary(id: string) {
    if (id === draft.primaryGoalId) return;
    set('secondaryGoalIds', draft.secondaryGoalIds.includes(id)
      ? draft.secondaryGoalIds.filter(g => g !== id)
      : [...draft.secondaryGoalIds, id]);
  }

  function toggleFormat(type: RecommendationType) {
    set('preferredFormats', draft.preferredFormats.includes(type)
      ? draft.preferredFormats.filter(t => t !== type)
      : [...draft.preferredFormats, type]);
  }

  const weightSum = BUCKET_ORDER.reduce((sum, b) => sum + (draft.categoryWeights[b] ?? 0), 0);

  function save() {
    onSave(draft);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Mi perfil de recomendaciones" size="lg">
      <div className="space-y-6">
        <section className="space-y-3">
          <p className="text-xs font-semibold text-gold-200 uppercase tracking-wide">Perfil profesional</p>
          <Input label="Profesión" value={draft.profession} onChange={e => set('profession', e.target.value)} />
          <Select
            label="Nivel de experiencia"
            value={draft.experienceLevel}
            onChange={e => set('experienceLevel', e.target.value as RecommendationProfile['experienceLevel'])}
            options={[{ value: 'junior', label: 'Junior' }, { value: 'mid', label: 'Mid' }, { value: 'senior-track', label: 'Rumbo a Senior' }]}
          />
          <TextArea label="Habilidades actuales (separadas por coma)" value={joinArr(draft.currentSkills)} onChange={e => set('currentSkills', splitArr(e.target.value))} />
          <TextArea label="Habilidades que quiero aprender" value={joinArr(draft.skillsToLearn)} onChange={e => set('skillsToLearn', splitArr(e.target.value))} />
          <TextArea label="Certificaciones deseadas" value={joinArr(draft.desiredCertifications)} onChange={e => set('desiredCertifications', splitArr(e.target.value))} />
        </section>

        <section className="space-y-3">
          <p className="text-xs font-semibold text-gold-200 uppercase tracking-wide">Metas</p>
          <div className="space-y-1.5">
            {draft.goals.map(g => (
              <div key={g.id} className="flex items-center gap-2 bg-[#0F1830] border border-[#1B2A47] rounded-lg px-2.5 py-1.5">
                <input type="radio" name="primaryGoal" checked={draft.primaryGoalId === g.id} onChange={() => set('primaryGoalId', g.id)} title="Meta principal" />
                <input
                  type="checkbox"
                  checked={draft.secondaryGoalIds.includes(g.id)}
                  disabled={draft.primaryGoalId === g.id}
                  onChange={() => toggleSecondary(g.id)}
                  title="Meta secundaria"
                />
                <input value={g.label} onChange={e => updateGoalLabel(g.id, e.target.value)} className="flex-1 bg-transparent text-sm text-gray-200 focus:outline-none" />
                <button onClick={() => removeGoal(g.id)} className="text-gray-600 hover:text-red-400"><Trash2 size={13} /></button>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-600">Radio = meta principal · Checkbox = meta secundaria</p>
          <Button variant="ghost" size="sm" onClick={addGoal}><Plus size={13} className="mr-1 inline" />Agregar meta</Button>
        </section>

        <section className="space-y-3">
          <p className="text-xs font-semibold text-gold-200 uppercase tracking-wide">Hobbies e intereses</p>
          <TextArea label="Hobbies" value={joinArr(draft.hobbies)} onChange={e => set('hobbies', splitArr(e.target.value))} />
          <TextArea label="Géneros favoritos" value={joinArr(draft.favoriteGenres)} onChange={e => set('favoriteGenres', splitArr(e.target.value))} />
          <TextArea label="Autores favoritos" value={joinArr(draft.favoriteAuthors)} onChange={e => set('favoriteAuthors', splitArr(e.target.value))} />
        </section>

        <section className="space-y-3">
          <p className="text-xs font-semibold text-gold-200 uppercase tracking-wide">Entrenamiento y salud</p>
          <Input label="Tipo de entrenamiento" value={draft.trainingType} onChange={e => set('trainingType', e.target.value)} />
          <TextArea label="Objetivos físicos" value={joinArr(draft.physicalGoals)} onChange={e => set('physicalGoals', splitArr(e.target.value))} />
          <TextArea label="Restricciones alimenticias" value={joinArr(draft.dietaryRestrictions)} onChange={e => set('dietaryRestrictions', splitArr(e.target.value))} />
        </section>

        <section className="space-y-3">
          <p className="text-xs font-semibold text-gold-200 uppercase tracking-wide">Idiomas y presupuesto</p>
          <TextArea label="Idiomas" value={joinArr(draft.languages)} onChange={e => set('languages', splitArr(e.target.value))} />
          <Input label="Nivel de inglés" value={draft.englishLevel} onChange={e => set('englishLevel', e.target.value)} />
          <Select
            label="Presupuesto"
            value={draft.budget}
            onChange={e => set('budget', e.target.value as RecommendationProfile['budget'])}
            options={[{ value: 'gratis-only', label: 'Solo gratis' }, { value: 'pago-ocasional', label: 'Pago ocasional' }, { value: 'suscripciones-ok', label: 'Suscripciones están bien' }]}
          />
        </section>

        <section className="space-y-3">
          <p className="text-xs font-semibold text-gold-200 uppercase tracking-wide">Horario</p>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Trabajo desde" type="time" value={draft.schedule.workStart} onChange={e => set('schedule', { ...draft.schedule, workStart: e.target.value })} />
            <Input label="Trabajo hasta" type="time" value={draft.schedule.workEnd} onChange={e => set('schedule', { ...draft.schedule, workEnd: e.target.value })} />
            <Input label="Gimnasio desde" type="time" value={draft.schedule.gymStart} onChange={e => set('schedule', { ...draft.schedule, gymStart: e.target.value })} />
            <Input label="Gimnasio hasta" type="time" value={draft.schedule.gymEnd} onChange={e => set('schedule', { ...draft.schedule, gymEnd: e.target.value })} />
            <Input label="Minutos libres entre semana" type="number" value={draft.schedule.weekdayFreeMinutes} onChange={e => set('schedule', { ...draft.schedule, weekdayFreeMinutes: Number(e.target.value) })} />
            <Input label="Minutos libres en fin de semana" type="number" value={draft.schedule.weekendFreeMinutes} onChange={e => set('schedule', { ...draft.schedule, weekendFreeMinutes: Number(e.target.value) })} />
          </div>
        </section>

        <section className="space-y-3">
          <p className="text-xs font-semibold text-gold-200 uppercase tracking-wide">Formatos preferidos</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {(Object.keys(RECOMMENDATION_TYPE_LABELS) as RecommendationType[]).map(t => (
              <label key={t} className="flex items-center gap-1.5 text-xs text-gray-400">
                <input type="checkbox" checked={draft.preferredFormats.includes(t)} onChange={() => toggleFormat(t)} />
                {RECOMMENDATION_TYPE_LABELS[t]}
              </label>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <p className="text-xs font-semibold text-gold-200 uppercase tracking-wide">Otros</p>
          <TextArea label="Plataformas favoritas" value={joinArr(draft.favoritePlatforms)} onChange={e => set('favoritePlatforms', splitArr(e.target.value))} />
          <TextArea label="Temas que no quiero ver" value={joinArr(draft.excludedTopics)} onChange={e => set('excludedTopics', splitArr(e.target.value))} />
          <Select
            label="Intensidad de recomendaciones"
            value={draft.recommendationIntensity}
            onChange={e => set('recommendationIntensity', e.target.value as RecommendationProfile['recommendationIntensity'])}
            options={[{ value: 'bajo', label: 'Baja' }, { value: 'medio', label: 'Media' }, { value: 'alto', label: 'Alta' }]}
          />
          <Input label="Máximo de recomendaciones semanales" type="number" value={draft.maxWeeklyRecommendations} onChange={e => set('maxWeeklyRecommendations', Number(e.target.value))} />
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gold-200 uppercase tracking-wide">Pesos por categoría</p>
            <span className={`text-xs ${weightSum === 100 ? 'text-emerald-400' : 'text-gold-300'}`}>Suma: {weightSum}%</span>
          </div>
          {weightSum !== 100 && <p className="text-[10px] text-gray-600">Idealmente deberían sumar 100%, pero no es obligatorio.</p>}
          <div className="grid grid-cols-2 gap-3">
            {BUCKET_ORDER.map(b => (
              <Input
                key={b}
                label={`${BUCKET_LABELS[b]} (%)`}
                type="number"
                min={0}
                max={100}
                value={draft.categoryWeights[b] ?? 0}
                onChange={e => set('categoryWeights', { ...draft.categoryWeights, [b]: Number(e.target.value) })}
              />
            ))}
          </div>
        </section>

        <div className="flex gap-2 justify-end pt-2 border-t border-white/5">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={save}>Guardar perfil</Button>
        </div>
      </div>
    </Modal>
  );
}
