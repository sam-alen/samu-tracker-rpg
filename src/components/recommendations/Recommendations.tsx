import { useMemo, useState } from 'react';
import { UserCog, Trophy, Bookmark, History, Link2, Compass, FileJson } from 'lucide-react';
import { SectionHeader, Card } from '../ui/Card';
import { Tabs, type TabDef } from '../ui/Tabs';
import { Badge } from '../ui/Badge';
import { useRecommendationEngine } from '../../hooks/useRecommendationEngine';
import { scoreItem, composeReason } from '../../lib/recommendations';
import type { RecommendationCategory } from '../../types';
import { RecommendationCard } from './RecommendationCard';
import { RecommendationCarousel } from './RecommendationCarousel';
import { RecommendationDetailModal } from './RecommendationDetailModal';
import { RecommendationFilterBar } from './RecommendationFilterBar';
import { defaultFilters, applyFilters, type RecommendationFilters } from '../../lib/recommendationFilters';
import { RecommendationProfileEditor } from './RecommendationProfileEditor';
import { WeeklyPlanPanel } from './WeeklyPlanPanel';
import { LegacyLinksTab } from './LegacyLinksTab';
import { RecommendationJsonImportTab } from './RecommendationJsonImportTab';

type TabId = 'para-ti' | 'guardados' | 'historial' | 'mis-enlaces' | 'json';

const TABS: TabDef<TabId>[] = [
  { id: 'para-ti', label: 'Para ti', icon: <Compass size={14} /> },
  { id: 'guardados', label: 'Guardados', icon: <Bookmark size={14} /> },
  { id: 'historial', label: 'Historial', icon: <History size={14} /> },
  { id: 'mis-enlaces', label: 'Mis enlaces', icon: <Link2 size={14} /> },
  { id: 'json', label: 'Mi catálogo (JSON)', icon: <FileJson size={14} /> },
];

function isDefaultFilters(f: RecommendationFilters): boolean {
  const d = defaultFilters();
  return f.category === d.category && f.timeBlock === d.timeBlock && f.cost === d.cost && f.difficulty === d.difficulty && f.type === d.type;
}

export function Recommendations() {
  const engine = useRecommendationEngine();
  const [tab, setTab] = useState<TabId>('para-ti');
  const [historySub, setHistorySub] = useState<'completados' | 'descartados'>('completados');
  const [filters, setFilters] = useState<RecommendationFilters>(defaultFilters());
  const [openItemId, setOpenItemId] = useState<string | null>(null);
  const [profileEditorOpen, setProfileEditorOpen] = useState(false);

  const primaryGoal = engine.profile.goals.find(g => g.id === engine.profile.primaryGoalId);
  const doneInPlan = engine.weeklyPlan.slots.filter(s => engine.interactions[s.itemId]?.status === 'completed').length;

  const openItem = openItemId ? engine.catalog.find(i => i.id === openItemId) ?? null : null;
  const openScored = openItem ? scoreItem(openItem, engine.profile, engine.affinity, { now: new Date() }) : undefined;

  function openDetail(id: string) {
    engine.markViewed(id);
    setOpenItemId(id);
  }

  function similarTo(category: RecommendationCategory) {
    setFilters({ ...defaultFilters(), category });
    setOpenItemId(null);
  }

  const filtersActive = !isDefaultFilters(filters);
  const filteredGrid = useMemo(() => {
    if (!filtersActive) return [];
    return applyFilters(engine.scoredCatalog.map(s => s.item), filters);
  }, [filtersActive, filters, engine.scoredCatalog]);

  function renderCard(item: (typeof engine.catalog)[number], widthFull = false) {
    const scored = scoreItem(item, engine.profile, engine.affinity, { now: new Date() });
    return (
      <RecommendationCard
        key={item.id}
        item={item}
        interaction={engine.interactions[item.id]}
        reason={composeReason(scored, engine.profile)}
        width={widthFull ? 'full' : 'fixed'}
        onOpen={() => openDetail(item.id)}
        onToggleSaved={() => engine.toggleSaved(item.id)}
        onComplete={e => {
          if (engine.interactions[item.id]?.status === 'completed') engine.undoComplete(item.id);
          else engine.markCompleted(item.id, e);
        }}
        onDismiss={() => engine.dismiss(item.id)}
        onSimilar={() => similarTo(item.category)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Recomendado para ti"
        subtitle={primaryGoal ? `Meta actual: ${primaryGoal.label}` : 'Contenido curado y personalizado'}
        action={
          <button
            onClick={() => setProfileEditorOpen(true)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-[#1B2A47] bg-[#0F1830] text-gray-400 hover:text-gold-200 hover:border-gold-400/40 transition-colors"
          >
            <UserCog size={13} />Editar mi perfil
          </button>
        }
      />

      <Card className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy size={15} className="text-gold-300" />
          <p className="text-sm text-gray-300">Progreso del plan semanal</p>
        </div>
        <Badge color={doneInPlan === engine.weeklyPlan.slots.length ? 'green' : 'gold'}>{doneInPlan}/{engine.weeklyPlan.slots.length}</Badge>
      </Card>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === 'para-ti' && (
        <div className="space-y-6">
          <WeeklyPlanPanel
            plan={engine.weeklyPlan}
            catalog={engine.catalog}
            interactions={engine.interactions}
            regenCap={engine.regenCap}
            onOpenItem={openDetail}
            onRegenerate={engine.regenerateWeeklyPlan}
          />
          <RecommendationFilterBar filters={filters} onChange={setFilters} />

          {filtersActive ? (
            filteredGrid.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredGrid.map(item => renderCard(item, true))}
              </div>
            ) : (
              <Card className="text-center py-8"><p className="text-gray-500 text-sm">Nada coincide con estos filtros todavía.</p></Card>
            )
          ) : (
            <div className="space-y-6">
              {engine.sections.map(section => (
                <RecommendationCarousel key={section.id} title={section.title} items={section.items} renderCard={item => renderCard(item)} />
              ))}
              {engine.sections.length === 0 && (
                <Card className="text-center py-8"><p className="text-gray-500 text-sm">Interactúa con algunas recomendaciones para que esta sección cobre forma.</p></Card>
              )}
            </div>
          )}
        </div>
      )}

      {tab === 'guardados' && (
        engine.savedItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {engine.savedItems.map(item => renderCard(item, true))}
          </div>
        ) : (
          <Card className="text-center py-8"><p className="text-gray-500 text-sm">Nada guardado todavía.</p></Card>
        )
      )}

      {tab === 'historial' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <button
              onClick={() => setHistorySub('completados')}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${historySub === 'completados' ? 'bg-gold-900/40 border-gold-600/50 text-gold-200' : 'bg-gray-800/40 border-gray-700/30 text-gray-500'}`}
            >
              Completados ({engine.completedItems.length})
            </button>
            <button
              onClick={() => setHistorySub('descartados')}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${historySub === 'descartados' ? 'bg-gold-900/40 border-gold-600/50 text-gold-200' : 'bg-gray-800/40 border-gray-700/30 text-gray-500'}`}
            >
              Descartados ({engine.dismissedItems.length})
            </button>
          </div>
          {(historySub === 'completados' ? engine.completedItems : engine.dismissedItems).length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(historySub === 'completados' ? engine.completedItems : engine.dismissedItems).map(item => renderCard(item, true))}
            </div>
          ) : (
            <Card className="text-center py-8"><p className="text-gray-500 text-sm">Nada por aquí todavía.</p></Card>
          )}
        </div>
      )}

      {tab === 'mis-enlaces' && <LegacyLinksTab />}

      {tab === 'json' && (
        <RecommendationJsonImportTab
          customItems={engine.customItems}
          onImport={engine.importCustomItemsFromJson}
          onRemove={engine.removeCustomItem}
        />
      )}

      <RecommendationDetailModal
        item={openItem}
        scored={openScored}
        profile={engine.profile}
        interaction={openItem ? engine.interactions[openItem.id] : undefined}
        onClose={() => setOpenItemId(null)}
        onToggleSaved={() => openItem && engine.toggleSaved(openItem.id)}
        onComplete={e => openItem && engine.markCompleted(openItem.id, e)}
        onUndoComplete={() => openItem && engine.undoComplete(openItem.id)}
        onDismiss={() => openItem && engine.dismiss(openItem.id)}
        onUndoDismiss={() => openItem && engine.undoDismiss(openItem.id)}
        onRate={stars => openItem && engine.rate(openItem.id, stars)}
        onFeedback={flag => openItem && engine.addFeedback(openItem.id, flag)}
      />

      <RecommendationProfileEditor
        open={profileEditorOpen}
        profile={engine.profile}
        onClose={() => setProfileEditorOpen(false)}
        onSave={engine.updateProfile}
      />
    </div>
  );
}
