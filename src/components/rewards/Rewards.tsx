import { useState } from 'react';
import { Plus, Edit2, Trash2, Gift, Coins, Lock } from 'lucide-react';
import { Card, SectionHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useXP } from '../../hooks/useXP';
import { storage } from '../../lib/storage';
import { fx } from '../../lib/fx';
import { checkAchievements } from '../../lib/achievements';
import { initialRewards } from '../../data/initial';
import type { Reward } from '../../types';

function genId() { return Math.random().toString(36).slice(2, 10); }

/** Cost in gold; migrates legacy XP-priced rewards (old xpCost ≈ 2× gold) */
function costOf(r: Reward): number {
  return r.goldCost ?? Math.round((r.xpCost ?? 0) / 2);
}

export function Rewards() {
  const [rewards, setRewards] = useLocalStorage<Reward[]>(storage.keys.rewards, initialRewards);
  const { xp, spendGold, refundGold } = useXP();

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Reward | null>(null);
  const [form, setForm] = useState({ title: '', goldCost: 50 });
  const [confirmClaim, setConfirmClaim] = useState<Reward | null>(null);

  function openNew() { setEditing(null); setForm({ title: '', goldCost: 50 }); setShowModal(true); }
  function openEdit(r: Reward) { setEditing(r); setForm({ title: r.title, goldCost: costOf(r) }); setShowModal(true); }

  function save() {
    if (!form.title.trim()) return;
    if (editing) {
      setRewards(prev => prev.map(r => r.id === editing.id ? { ...r, title: form.title, goldCost: form.goldCost, xpCost: undefined } : r));
    } else {
      setRewards(prev => [...prev, { id: genId(), title: form.title, goldCost: form.goldCost }]);
    }
    setShowModal(false);
  }

  function remove(id: string) { setRewards(prev => prev.filter(r => r.id !== id)); }

  function claim(reward: Reward, e?: React.MouseEvent) {
    const cost = costOf(reward);
    const ok = spendGold(cost);
    if (ok) {
      setRewards(prev => prev.map(r => r.id === reward.id ? { ...r, claimedAt: new Date().toISOString() } : r));
      fx.emit({
        kind: 'gold',
        x: e?.clientX ?? window.innerWidth / 2,
        y: e?.clientY ?? window.innerHeight * 0.4,
        amount: cost,
      });
      fx.emit({
        kind: 'banner',
        title: 'Recompensa canjeada',
        subtitle: `"${reward.title}" — disfrútala, te la ganaste`,
      });
      checkAchievements();
    }
    setConfirmClaim(null);
  }

  // Restoring a claimed reward refunds its gold — otherwise the shop leaks currency
  function unclaim(id: string) {
    const reward = rewards.find(r => r.id === id);
    setRewards(prev => prev.map(r => r.id === id ? { ...r, claimedAt: undefined } : r));
    if (reward?.claimedAt) refundGold(costOf(reward));
  }

  const available = rewards.filter(r => !r.claimedAt);
  const claimed = rewards.filter(r => r.claimedAt);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Tienda"
        subtitle="Gasta el oro que ganaste con tu esfuerzo. El XP nunca se pierde."
        action={<Button variant="primary" size="sm" onClick={openNew}><Plus size={14} className="mr-1 inline" />Nueva recompensa</Button>}
      />

      {/* Gold balance */}
      <div className="card-ornate rounded-xl p-4 flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-gradient-to-b from-gold-300 to-gold-600 flex items-center justify-center shadow-[0_0_14px_rgba(77,166,255,0.4)] border border-gold-200/60">
          <Coins size={20} className="text-[#03101F]" />
        </div>
        <div>
          <p className="text-xs text-gray-400">Oro disponible</p>
          <p className="font-display text-2xl font-bold text-gradient-gold leading-tight">{xp.gold.toLocaleString()}</p>
        </div>
        <p className="ml-auto text-xs text-gray-600 max-w-[180px] text-right">
          Ganas oro con cada hábito, misión y sesión completada
        </p>
      </div>

      {/* Available rewards */}
      <div>
        <p className="text-sm font-medium text-white mb-3">Disponibles</p>
        {available.length === 0 && (
          <Card className="text-center py-8">
            <Gift size={28} className="text-gray-600 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No hay recompensas. Crea algunas.</p>
          </Card>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {available.map(r => {
            const cost = costOf(r);
            const canAfford = xp.gold >= cost;
            return (
              <Card key={r.id} className={`${canAfford ? 'hover:border-gold-400/40' : ''}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${canAfford ? 'bg-gold-900/40 border border-gold-600/40' : 'bg-gray-800 border border-gray-700'}`}>
                    {canAfford ? <Gift size={16} className="text-gold-300" /> : <Lock size={16} className="text-gray-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-200">{r.title}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Coins size={11} className="text-gold-400" />
                      <span className={`text-xs font-semibold ${canAfford ? 'text-gold-300' : 'text-gray-500'}`}>{cost} oro</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(r)} className="p-1.5 text-gray-600 hover:text-gray-300"><Edit2 size={13} /></button>
                    <button onClick={() => remove(r.id)} className="p-1.5 text-gray-600 hover:text-red-400"><Trash2 size={13} /></button>
                  </div>
                </div>
                <Button
                  variant={canAfford ? 'primary' : 'secondary'}
                  size="sm"
                  fullWidth
                  className="mt-3"
                  disabled={!canAfford}
                  onClick={() => setConfirmClaim(r)}
                >
                  {canAfford ? 'Canjear' : `Faltan ${cost - xp.gold} de oro`}
                </Button>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Claimed */}
      {claimed.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-500 mb-3">Canjeadas</p>
          <div className="space-y-2">
            {claimed.map(r => (
              <div key={r.id} className="flex items-center gap-3 bg-[#04060B] border border-[#1B2A47] rounded-xl px-4 py-3 opacity-60">
                <Gift size={14} className="text-gray-500" />
                <p className="text-sm text-gray-400 line-through flex-1">{r.title}</p>
                <Badge color="gray">Canjeada</Badge>
                <button onClick={() => unclaim(r.id)} className="text-xs text-gray-600 hover:text-gray-400 transition-colors">Restaurar</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirm modal */}
      <Modal open={!!confirmClaim} onClose={() => setConfirmClaim(null)} title="Confirmar canje" size="sm">
        <div className="space-y-4 text-center">
          <Gift size={32} className="text-gold-300 mx-auto" />
          <div>
            <p className="text-white font-medium">{confirmClaim?.title}</p>
            <p className="text-gray-400 text-sm mt-1">
              Esto gastará <span className="text-gold-300 font-semibold">{confirmClaim ? costOf(confirmClaim) : 0} de oro</span>
            </p>
          </div>
          <div className="flex gap-2 justify-center">
            <Button variant="ghost" onClick={() => setConfirmClaim(null)}>Cancelar</Button>
            <Button variant="primary" onClick={e => confirmClaim && claim(confirmClaim, e)}>¡Canjear!</Button>
          </div>
        </div>
      </Modal>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Editar recompensa' : 'Nueva recompensa'}>
        <div className="space-y-4">
          <Input label="Nombre de la recompensa" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Ver una película" autoFocus />
          <Input label="Costo en oro" type="number" value={form.goldCost} onChange={e => setForm(p => ({ ...p, goldCost: Number(e.target.value) }))} />
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button variant="primary" onClick={save}>Guardar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
