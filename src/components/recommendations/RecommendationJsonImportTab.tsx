import { useState } from 'react';
import { Copy, Check, Trash2, AlertTriangle, Sparkles } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { RECOMMENDATION_CATEGORIES, RECOMMENDATION_TYPE_LABELS } from '../../data/recommendations';
import { RECOMMENDATION_JSON_EXAMPLE, type ImportResult } from '../../lib/recommendationImport';
import type { RecommendationItem } from '../../types';

interface Props {
  customItems: RecommendationItem[];
  onImport: (raw: string) => ImportResult;
  onRemove: (id: string) => void;
}

export function RecommendationJsonImportTab({ customItems, onImport, onRemove }: Props) {
  const [raw, setRaw] = useState('');
  const [lastResult, setLastResult] = useState<ImportResult | null>(null);
  const [showExample, setShowExample] = useState(false);
  const [copied, setCopied] = useState(false);

  function handleImport() {
    if (!raw.trim()) return;
    const result = onImport(raw);
    setLastResult(result);
    if (result.items.length > 0 && result.errors.length === 0) setRaw('');
  }

  function copyExample() {
    navigator.clipboard.writeText(RECOMMENDATION_JSON_EXAMPLE).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={15} className="text-arcane-300" />
          <p className="text-sm font-medium text-white">Agrega tus propias recomendaciones</p>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed">
          Pega un objeto o un arreglo de objetos JSON con lo que vayas encontrando. Se suman al mismo motor de puntuación
          que el catálogo integrado — aparecen en "Para ti", el plan semanal y las secciones, con la misma lógica de
          dificultad, tiempo y categoría. Solo <code className="text-gold-300 bg-black/30 px-1 rounded">title</code>, {' '}
          <code className="text-gold-300 bg-black/30 px-1 rounded">category</code> y <code className="text-gold-300 bg-black/30 px-1 rounded">link</code>{' '}
          son obligatorios — todo lo demás tiene un valor por defecto razonable.
        </p>

        <button
          onClick={() => setShowExample(s => !s)}
          className="text-xs text-arcane-300 hover:text-arcane-200 mt-3 transition-colors"
        >
          {showExample ? 'Ocultar' : 'Ver'} formato de ejemplo
        </button>

        {showExample && (
          <div className="relative mt-2">
            <pre className="text-[11px] text-gray-400 bg-black/40 border border-[#1B2A47] rounded-lg p-3 overflow-x-auto whitespace-pre">{RECOMMENDATION_JSON_EXAMPLE}</pre>
            <button
              onClick={copyExample}
              title="Copiar ejemplo"
              className="absolute top-2 right-2 p-1.5 rounded-md bg-[#0F1830] border border-[#1B2A47] text-gray-500 hover:text-gold-200 transition-colors"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
            </button>
            <p className="text-[10px] text-gray-600 mt-1.5">
              Categorías válidas: {RECOMMENDATION_CATEGORIES.map(c => c.id).join(', ')}
            </p>
            <p className="text-[10px] text-gray-600">
              Tipos válidos: {Object.keys(RECOMMENDATION_TYPE_LABELS).join(', ')}
            </p>
          </div>
        )}

        <textarea
          value={raw}
          onChange={e => setRaw(e.target.value)}
          placeholder="Pega aquí tu JSON..."
          rows={8}
          className="w-full mt-3 bg-[#05070D] border border-[#1B2A47] rounded-lg px-3 py-2 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gold-400/60 font-mono resize-y"
        />

        <div className="flex justify-end mt-2">
          <Button variant="primary" size="sm" onClick={handleImport}>Agregar al catálogo</Button>
        </div>

        {lastResult && (
          <div className="mt-3 space-y-1.5">
            {lastResult.items.length > 0 && (
              <p className="text-xs text-emerald-400 flex items-center gap-1.5">
                <Check size={13} />{lastResult.items.length} ítem{lastResult.items.length !== 1 ? 's' : ''} agregado{lastResult.items.length !== 1 ? 's' : ''} o actualizado{lastResult.items.length !== 1 ? 's' : ''}.
              </p>
            )}
            {lastResult.errors.map((err, i) => (
              <p key={i} className="text-xs text-amber-400 flex items-start gap-1.5">
                <AlertTriangle size={13} className="shrink-0 mt-0.5" /><span>{err}</span>
              </p>
            ))}
          </div>
        )}
      </Card>

      <div>
        <p className="text-sm font-medium text-white mb-3">Tu catálogo ({customItems.length})</p>
        {customItems.length === 0 ? (
          <Card className="text-center py-8"><p className="text-gray-500 text-sm">Aún no agregas nada por JSON.</p></Card>
        ) : (
          <div className="space-y-1.5">
            {customItems.map(item => {
              const cat = RECOMMENDATION_CATEGORIES.find(c => c.id === item.category);
              return (
                <div key={item.id} className="flex items-center gap-3 bg-gradient-to-b from-[#0C1424] to-[#080D19] border border-[#1B2A47] rounded-xl px-4 py-2.5">
                  {cat && <cat.icon size={15} style={{ color: cat.color }} className="shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200 truncate">{item.title}</p>
                    <p className="text-xs text-gray-600 truncate">{item.creator}</p>
                  </div>
                  <Badge color="gray">{RECOMMENDATION_TYPE_LABELS[item.type]}</Badge>
                  <button onClick={() => onRemove(item.id)} className="p-1.5 text-gray-600 hover:text-red-400 transition-colors shrink-0">
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
