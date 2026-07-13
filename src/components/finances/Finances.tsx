import { useState, useMemo } from 'react';
import {
  Plus, Trash2, TrendingUp, TrendingDown, Wallet, Landmark,
  PiggyBank, ArrowLeftRight, Pencil, Repeat, Check,
} from 'lucide-react';
import { Card, SectionHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input, Select } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { storage } from '../../lib/storage';
import { todayISO } from '../../lib/xp';
import { checkAchievements } from '../../lib/achievements';
import type {
  Transaction, TransactionType, FinanceCategory,
  RecurringExpense, FinanceAccounts,
} from '../../types';

const CATEGORIES: FinanceCategory[] = [
  'Comida', 'Transporte', 'Familia', 'Suscripciones',
  'Herramientas dev', 'Educación', 'Gym / salud', 'Otros',
];

// Series colors validated for the dark card surface (#0B1120):
// income/expense pair and account/savings pair each pass the palette checks.
const C_INCOME = '#16A374';
const C_EXPENSE = '#E5484D';
const C_ACCOUNT = '#2E86E0';
const C_SAVINGS = '#8B5CF6';

function genId() { return Math.random().toString(36).slice(2, 10); }

function fmt(n: number): string {
  return '$' + Math.round(n).toLocaleString();
}

function fmtShort(n: number): string {
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return '$' + (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
  return '$' + Math.round(n);
}

/** Round up to a "nice" axis maximum (1/2/5 × 10^n) */
function niceCeil(v: number): number {
  if (v <= 0) return 100;
  const exp = Math.pow(10, Math.floor(Math.log10(v)));
  const f = v / exp;
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return nice * exp;
}

function emptyForm(): Omit<Transaction, 'id'> {
  return { date: todayISO(), type: 'expense', amount: 0, category: 'Otros', note: '' };
}

/** Record new balances, keeping one history point per day (max 180) */
function withSnapshot(prev: FinanceAccounts, account: number, savings: number): FinanceAccounts {
  const date = todayISO();
  const history = prev.history.filter(h => h.date !== date);
  return { account, savings, history: [...history, { date, account, savings }].slice(-180) };
}

export function Finances() {
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>(storage.keys.transactions, []);
  const [recurring, setRecurring] = useLocalStorage<RecurringExpense[]>(storage.keys.recurringExpenses, []);
  const [accounts, setAccounts] = useLocalStorage<FinanceAccounts>(
    storage.keys.financeAccounts, { account: 0, savings: 0, history: [] });

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [applyToBalance, setApplyToBalance] = useState(true);

  const [showAdjust, setShowAdjust] = useState(false);
  const [adjustForm, setAdjustForm] = useState({ account: 0, savings: 0 });

  const [showTransfer, setShowTransfer] = useState(false);
  const [transferForm, setTransferForm] = useState({ amount: 0, direction: 'toSavings' as 'toSavings' | 'toAccount' });

  const [showRecurring, setShowRecurring] = useState(false);
  const [recurringForm, setRecurringForm] = useState({ name: '', amount: 0, category: 'Suscripciones' as FinanceCategory });

  const today = todayISO();
  const thisMonth = useMemo(() => today.slice(0, 7), [today]);

  // ─── Aggregations ──────────────────────────────────────────────────────────
  const monthlyData = useMemo(() => {
    const monthly = transactions.filter(t => t.date.startsWith(thisMonth));
    const income = monthly.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0);
    const expense = monthly.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
    return { income, expense, balance: income - expense };
  }, [transactions, thisMonth]);

  const recurringTotal = useMemo(() => recurring.reduce((a, r) => a + r.amount, 0), [recurring]);

  // Last 6 months, oldest first
  const last6Months = useMemo(() => {
    const months: { key: string; label: string; income: number; expense: number }[] = [];
    const d = new Date();
    d.setDate(1);
    for (let i = 5; i >= 0; i--) {
      const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
      const key = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`;
      months.push({
        key,
        label: m.toLocaleDateString('es-ES', { month: 'short' }).replace('.', ''),
        income: 0,
        expense: 0,
      });
    }
    for (const t of transactions) {
      const bucket = months.find(m => t.date.startsWith(m.key));
      if (bucket) bucket[t.type === 'income' ? 'income' : 'expense'] += t.amount;
    }
    return months;
  }, [transactions]);

  const byCategory = useMemo(() => {
    const monthly = transactions.filter(t => t.date.startsWith(thisMonth) && t.type === 'expense');
    const map: Record<string, number> = {};
    monthly.forEach(t => { map[t.category] = (map[t.category] || 0) + t.amount; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [transactions, thisMonth]);

  // ─── Actions ───────────────────────────────────────────────────────────────
  function saveTransaction() {
    if (form.amount <= 0) return;
    const t: Transaction = { ...form, id: genId(), appliedToBalance: applyToBalance };
    setTransactions(prev => [t, ...prev]);
    if (applyToBalance) {
      const delta = t.type === 'income' ? t.amount : -t.amount;
      setAccounts(prev => withSnapshot(prev, prev.account + delta, prev.savings));
    }
    setShowModal(false);
    checkAchievements();
  }

  function removeTransaction(id: string) {
    const t = transactions.find(x => x.id === id);
    setTransactions(prev => prev.filter(x => x.id !== id));
    if (t?.appliedToBalance) {
      const delta = t.type === 'income' ? -t.amount : t.amount;
      setAccounts(prev => withSnapshot(prev, prev.account + delta, prev.savings));
    }
  }

  function openAdjust() {
    setAdjustForm({ account: accounts.account, savings: accounts.savings });
    setShowAdjust(true);
  }

  function saveAdjust() {
    setAccounts(prev => withSnapshot(prev, adjustForm.account, adjustForm.savings));
    setShowAdjust(false);
    checkAchievements();
  }

  function saveTransfer() {
    const amt = transferForm.amount;
    if (amt <= 0) return;
    setAccounts(prev => {
      const toSavings = transferForm.direction === 'toSavings';
      return withSnapshot(
        prev,
        prev.account + (toSavings ? -amt : amt),
        prev.savings + (toSavings ? amt : -amt),
      );
    });
    setShowTransfer(false);
    checkAchievements();
  }

  function saveRecurring() {
    if (!recurringForm.name.trim() || recurringForm.amount <= 0) return;
    setRecurring(prev => [...prev, { id: genId(), paidMonths: [], ...recurringForm }]);
    setShowRecurring(false);
    setRecurringForm({ name: '', amount: 0, category: 'Suscripciones' });
  }

  function payRecurring(r: RecurringExpense) {
    if (r.paidMonths.includes(thisMonth)) return;
    setRecurring(prev => prev.map(x => x.id === r.id ? { ...x, paidMonths: [...x.paidMonths, thisMonth] } : x));
    const t: Transaction = {
      id: genId(), date: today, type: 'expense', amount: r.amount,
      category: r.category, note: r.name, appliedToBalance: true,
    };
    setTransactions(prev => [t, ...prev]);
    setAccounts(prev => withSnapshot(prev, prev.account - r.amount, prev.savings));
  }

  function unpayRecurring(r: RecurringExpense) {
    setRecurring(prev => prev.map(x => x.id === r.id
      ? { ...x, paidMonths: x.paidMonths.filter(m => m !== thisMonth) }
      : x));
  }

  function removeRecurring(id: string) {
    setRecurring(prev => prev.filter(r => r.id !== id));
  }

  const recent = [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20);
  const hasChartData = last6Months.some(m => m.income > 0 || m.expense > 0);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Finanzas"
        subtitle="Tu tesorería: cuenta, ahorros, flujo del mes y gastos fijos"
        action={<Button variant="primary" size="sm" onClick={() => { setForm(emptyForm()); setApplyToBalance(true); setShowModal(true); }}><Plus size={14} className="mr-1 inline" />Movimiento</Button>}
      />

      {/* ── Balances: cuenta + ahorros ─────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card-ornate rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Landmark size={14} style={{ color: C_ACCOUNT }} />
            <p className="text-xs text-gray-400">En cuenta</p>
          </div>
          <p className="font-display text-2xl font-bold text-gradient-gold">{fmt(accounts.account)}</p>
        </div>
        <div className="card-ornate rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <PiggyBank size={14} style={{ color: C_SAVINGS }} />
            <p className="text-xs text-gray-400">Ahorros</p>
          </div>
          <p className="font-display text-2xl font-bold text-arcane-300">{fmt(accounts.savings)}</p>
        </div>
      </div>
      <div className="flex gap-2 -mt-3">
        <Button variant="secondary" size="sm" onClick={openAdjust}>
          <Pencil size={12} className="mr-1.5 inline" />Ajustar saldos
        </Button>
        <Button variant="secondary" size="sm" onClick={() => { setTransferForm({ amount: 0, direction: 'toSavings' }); setShowTransfer(true); }}>
          <ArrowLeftRight size={12} className="mr-1.5 inline" />Transferir
        </Button>
      </div>

      {/* ── Month stat tiles ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="text-center">
          <TrendingUp size={15} className="mx-auto mb-1" style={{ color: C_INCOME }} />
          <p className="text-lg font-bold text-gray-100">{fmt(monthlyData.income)}</p>
          <p className="text-xs text-gray-500 mt-0.5">Ingresos del mes</p>
        </Card>
        <Card className="text-center">
          <TrendingDown size={15} className="mx-auto mb-1" style={{ color: C_EXPENSE }} />
          <p className="text-lg font-bold text-gray-100">{fmt(monthlyData.expense)}</p>
          <p className="text-xs text-gray-500 mt-0.5">Gastos del mes</p>
        </Card>
        <Card className="text-center">
          <Wallet size={15} className={`mx-auto mb-1 ${monthlyData.balance >= 0 ? 'text-gold-300' : 'text-orange-400'}`} />
          <p className={`text-lg font-bold ${monthlyData.balance >= 0 ? 'text-gray-100' : 'text-orange-300'}`}>
            {monthlyData.balance < 0 ? '-' : ''}{fmt(Math.abs(monthlyData.balance))}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">Flujo neto</p>
        </Card>
        <Card className="text-center">
          <Repeat size={15} className="text-gray-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-gray-100">{fmt(recurringTotal)}</p>
          <p className="text-xs text-gray-500 mt-0.5">Fijos / mes</p>
        </Card>
      </div>

      {/* ── Chart: ingresos vs gastos (6 meses) ────────────────────────── */}
      <Card>
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-medium text-white">Ingresos vs gastos · últimos 6 meses</p>
          <div className="flex items-center gap-3">
            <LegendChip color={C_INCOME} label="Ingresos" />
            <LegendChip color={C_EXPENSE} label="Gastos" />
          </div>
        </div>
        {hasChartData
          ? <MonthlyBars data={last6Months} />
          : <p className="text-xs text-gray-600 py-8 text-center">Registra movimientos para ver la gráfica.</p>}
      </Card>

      {/* ── Chart: evolución de saldos ─────────────────────────────────── */}
      <Card>
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-medium text-white">Evolución de tu dinero</p>
          <div className="flex items-center gap-3">
            <LegendChip color={C_ACCOUNT} label="Cuenta" />
            <LegendChip color={C_SAVINGS} label="Ahorros" />
          </div>
        </div>
        {accounts.history.length >= 2
          ? <BalanceLines history={accounts.history} />
          : <p className="text-xs text-gray-600 py-8 text-center">
              El historial se dibuja conforme cambien tus saldos. Ajusta tus saldos o registra movimientos para empezar.
            </p>}
      </Card>

      {/* ── Gastos fijos del mes ───────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-white">Gastos fijos del mes</p>
          <Button variant="secondary" size="sm" onClick={() => setShowRecurring(true)}>
            <Plus size={12} className="mr-1 inline" />Gasto fijo
          </Button>
        </div>
        {recurring.length === 0 && (
          <Card className="text-center py-6">
            <Repeat size={22} className="text-gray-600 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">Registra tus gastos pasivos (renta, suscripciones...) para no perderlos de vista.</p>
          </Card>
        )}
        <div className="space-y-1.5">
          {recurring.map(r => {
            const paid = r.paidMonths.includes(thisMonth);
            return (
              <div key={r.id} className={`flex items-center gap-3 rounded-xl px-4 py-3 border transition-colors
                ${paid
                  ? 'bg-emerald-950/20 border-emerald-800/30'
                  : 'bg-gradient-to-b from-[#0C1424] to-[#080D19] border-[#1B2A47] hover:border-gold-400/20'}`}
              >
                <Repeat size={14} className={paid ? 'text-emerald-500' : 'text-gray-500'} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm truncate ${paid ? 'text-emerald-300' : 'text-gray-200'}`}>{r.name}</p>
                  <p className="text-xs text-gray-500">{r.category}</p>
                </div>
                <p className="text-sm font-semibold text-gray-200">{fmt(r.amount)}</p>
                {paid
                  ? <button onClick={() => unpayRecurring(r)} title="Deshacer estado pagado">
                      <Badge color="green"><Check size={10} className="inline mr-1" />Pagado</Badge>
                    </button>
                  : <Button variant="secondary" size="sm" onClick={() => payRecurring(r)}>Pagar</Button>}
                <button onClick={() => removeRecurring(r.id)} className="p-1.5 text-gray-600 hover:text-red-400 transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
        </div>
        {recurring.length > 0 && (
          <p className="text-xs text-gray-600 mt-2 text-right">
            Total comprometido: <span className="text-gray-300 font-medium">{fmt(recurringTotal)}</span> / mes
            · Pagado: <span className="text-emerald-400 font-medium">
              {fmt(recurring.filter(r => r.paidMonths.includes(thisMonth)).reduce((a, r) => a + r.amount, 0))}
            </span>
          </p>
        )}
      </div>

      {/* ── Categorías del mes ─────────────────────────────────────────── */}
      {byCategory.length > 0 && (
        <Card>
          <p className="text-sm font-medium text-white mb-3">Gastos por categoría (mes)</p>
          <div className="space-y-2.5">
            {byCategory.map(([cat, amount]) => {
              const pct = Math.min(100, (amount / Math.max(1, byCategory[0][1])) * 100);
              return (
                <div key={cat} className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-28 shrink-0 truncate">{cat}</span>
                  <div className="flex-1 h-2 bg-black/40 border border-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: C_EXPENSE }}
                    />
                  </div>
                  <span className="text-xs text-gray-300 w-16 text-right font-medium">{fmt(amount)}</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ── Últimos movimientos ────────────────────────────────────────── */}
      <div>
        <p className="text-sm font-medium text-white mb-3">Últimos movimientos</p>
        {recent.length === 0 && (
          <Card className="text-center py-8">
            <p className="text-gray-500 text-sm">Sin movimientos registrados.</p>
          </Card>
        )}
        <div className="space-y-1.5">
          {recent.map(t => (
            <div key={t.id} className="flex items-center gap-3 bg-gradient-to-b from-[#0C1424] to-[#080D19] border border-[#1B2A47] hover:border-gold-400/20 transition-colors rounded-xl px-4 py-3">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: t.type === 'income' ? C_INCOME : C_EXPENSE }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-200 truncate">{t.note || t.category}</p>
                <p className="text-xs text-gray-500">{t.date} · {t.category}</p>
              </div>
              <Badge color={t.type === 'income' ? 'green' : 'red'}>{t.type === 'income' ? 'Ingreso' : 'Gasto'}</Badge>
              <p className={`text-sm font-semibold min-w-[60px] text-right ${t.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
              </p>
              <button onClick={() => removeTransaction(t.id)} className="p-1.5 text-gray-600 hover:text-red-400 transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Modal: movimiento ──────────────────────────────────────────── */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nuevo movimiento">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Tipo"
              value={form.type}
              onChange={e => setForm(p => ({ ...p, type: e.target.value as TransactionType }))}
              options={[{ value: 'expense', label: 'Gasto' }, { value: 'income', label: 'Ingreso' }]}
            />
            <Input label="Fecha" type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
          </div>
          <Input label="Monto ($)" type="number" value={form.amount || ''} onChange={e => setForm(p => ({ ...p, amount: Number(e.target.value) }))} placeholder="0" autoFocus />
          <Select
            label="Categoría"
            value={form.category}
            onChange={e => setForm(p => ({ ...p, category: e.target.value as FinanceCategory }))}
            options={CATEGORIES.map(c => ({ value: c, label: c }))}
          />
          <Input label="Nota" value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))} placeholder="Descripción opcional..." />
          <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={applyToBalance}
              onChange={e => setApplyToBalance(e.target.checked)}
              className="accent-[#4DA6FF]"
            />
            Afectar el saldo de la cuenta ({form.type === 'income' ? 'suma' : 'resta'} el monto)
          </label>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button variant="primary" onClick={saveTransaction}>Guardar</Button>
          </div>
        </div>
      </Modal>

      {/* ── Modal: ajustar saldos ──────────────────────────────────────── */}
      <Modal open={showAdjust} onClose={() => setShowAdjust(false)} title="Ajustar saldos" size="sm">
        <div className="space-y-4">
          <Input label="Dinero en cuenta ($)" type="number" value={adjustForm.account || ''} onChange={e => setAdjustForm(p => ({ ...p, account: Number(e.target.value) }))} autoFocus />
          <Input label="Dinero en ahorros ($)" type="number" value={adjustForm.savings || ''} onChange={e => setAdjustForm(p => ({ ...p, savings: Number(e.target.value) }))} />
          <p className="text-xs text-gray-600">Define aquí cuánto tienes realmente; el historial guarda cada cambio para la gráfica de evolución.</p>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="ghost" onClick={() => setShowAdjust(false)}>Cancelar</Button>
            <Button variant="primary" onClick={saveAdjust}>Guardar</Button>
          </div>
        </div>
      </Modal>

      {/* ── Modal: transferir ──────────────────────────────────────────── */}
      <Modal open={showTransfer} onClose={() => setShowTransfer(false)} title="Transferir" size="sm">
        <div className="space-y-4">
          <Select
            label="Dirección"
            value={transferForm.direction}
            onChange={e => setTransferForm(p => ({ ...p, direction: e.target.value as 'toSavings' | 'toAccount' }))}
            options={[
              { value: 'toSavings', label: 'Cuenta → Ahorros' },
              { value: 'toAccount', label: 'Ahorros → Cuenta' },
            ]}
          />
          <Input label="Monto ($)" type="number" value={transferForm.amount || ''} onChange={e => setTransferForm(p => ({ ...p, amount: Number(e.target.value) }))} autoFocus />
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="ghost" onClick={() => setShowTransfer(false)}>Cancelar</Button>
            <Button variant="primary" onClick={saveTransfer}>Transferir</Button>
          </div>
        </div>
      </Modal>

      {/* ── Modal: gasto fijo ──────────────────────────────────────────── */}
      <Modal open={showRecurring} onClose={() => setShowRecurring(false)} title="Nuevo gasto fijo" size="sm">
        <div className="space-y-4">
          <Input label="Nombre" value={recurringForm.name} onChange={e => setRecurringForm(p => ({ ...p, name: e.target.value }))} placeholder="Renta, Spotify, Internet..." autoFocus />
          <Input label="Monto mensual ($)" type="number" value={recurringForm.amount || ''} onChange={e => setRecurringForm(p => ({ ...p, amount: Number(e.target.value) }))} />
          <Select
            label="Categoría"
            value={recurringForm.category}
            onChange={e => setRecurringForm(p => ({ ...p, category: e.target.value as FinanceCategory }))}
            options={CATEGORIES.map(c => ({ value: c, label: c }))}
          />
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="ghost" onClick={() => setShowRecurring(false)}>Cancelar</Button>
            <Button variant="primary" onClick={saveRecurring}>Guardar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── Legend chip ──────────────────────────────────────────────────────────────

function LegendChip({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-gray-400">
      <span className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
      {label}
    </span>
  );
}

// ─── Grouped bars: income vs expense per month ───────────────────────────────

const BAR_W = 560, BAR_H = 190, PAD_T = 12, PAD_B = 26, PAD_L = 40, PAD_R = 8;

function MonthlyBars({ data }: { data: { label: string; income: number; expense: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);

  const plotW = BAR_W - PAD_L - PAD_R;
  const plotH = BAR_H - PAD_T - PAD_B;
  const max = niceCeil(Math.max(...data.flatMap(d => [d.income, d.expense]), 1));
  const y = (v: number) => PAD_T + plotH * (1 - v / max);
  const groupW = plotW / data.length;
  const barW = Math.min(18, groupW / 3);

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${BAR_W} ${BAR_H}`} className="w-full" role="img" aria-label="Ingresos y gastos por mes">
        {/* recessive gridlines + axis labels */}
        {[0, 0.5, 1].map(f => (
          <g key={f}>
            <line x1={PAD_L} x2={BAR_W - PAD_R} y1={y(max * f)} y2={y(max * f)} stroke="#1B2A47" strokeWidth="1" />
            <text x={PAD_L - 6} y={y(max * f) + 3} textAnchor="end" fontSize="9" fill="#776C8E">{fmtShort(max * f)}</text>
          </g>
        ))}

        {data.map((d, i) => {
          const cx = PAD_L + groupW * i + groupW / 2;
          const hIn = plotH * (d.income / max);
          const hEx = plotH * (d.expense / max);
          const dim = hover !== null && hover !== i;
          return (
            // 2px gap between the paired bars; rounded data-ends via clipped rect
            <g key={d.label} opacity={dim ? 0.45 : 1}
              onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              {/* oversized hover target */}
              <rect x={PAD_L + groupW * i} y={PAD_T} width={groupW} height={plotH} fill="transparent" />
              {d.income > 0 && (
                <rect x={cx - barW - 1} y={y(d.income)} width={barW} height={Math.max(2, hIn)} rx="3" fill={C_INCOME} />
              )}
              {d.expense > 0 && (
                <rect x={cx + 1} y={y(d.expense)} width={barW} height={Math.max(2, hEx)} rx="3" fill={C_EXPENSE} />
              )}
              <text x={cx} y={BAR_H - 8} textAnchor="middle" fontSize="10" fill={hover === i ? '#B8AFCB' : '#776C8E'} className="capitalize">
                {d.label}
              </text>
            </g>
          );
        })}
        {/* baseline */}
        <line x1={PAD_L} x2={BAR_W - PAD_R} y1={y(0)} y2={y(0)} stroke="#2B4066" strokeWidth="1" />
      </svg>

      {hover !== null && (
        <div
          className="absolute -top-1 pointer-events-none bg-[#04060B] border border-[#2B4066] rounded-lg px-3 py-2 shadow-xl z-10 -translate-x-1/2"
          style={{ left: `${((PAD_L + (plotW / data.length) * (hover + 0.5)) / BAR_W) * 100}%` }}
        >
          <p className="text-xs text-gray-300 font-medium capitalize mb-1">{data[hover].label}</p>
          <p className="text-xs whitespace-nowrap"><span className="inline-block w-2 h-2 rounded-sm mr-1.5" style={{ background: C_INCOME }} /><span className="text-gray-400">Ingresos </span><span className="text-gray-200 font-medium">{fmt(data[hover].income)}</span></p>
          <p className="text-xs whitespace-nowrap"><span className="inline-block w-2 h-2 rounded-sm mr-1.5" style={{ background: C_EXPENSE }} /><span className="text-gray-400">Gastos </span><span className="text-gray-200 font-medium">{fmt(data[hover].expense)}</span></p>
        </div>
      )}
    </div>
  );
}

// ─── Line chart: account & savings balance over time ────────────────────────

function BalanceLines({ history }: { history: { date: string; account: number; savings: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);

  const plotW = BAR_W - PAD_L - PAD_R;
  const plotH = BAR_H - PAD_T - PAD_B;
  const max = niceCeil(Math.max(...history.flatMap(h => [h.account, h.savings]), 1));
  const x = (i: number) => PAD_L + (history.length === 1 ? plotW / 2 : (plotW * i) / (history.length - 1));
  const y = (v: number) => PAD_T + plotH * (1 - v / max);

  const path = (key: 'account' | 'savings') =>
    history.map((h, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(h[key]).toFixed(1)}`).join(' ');

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${BAR_W} ${BAR_H}`}
        className="w-full"
        role="img"
        aria-label="Evolución de saldos de cuenta y ahorros"
        onMouseLeave={() => setHover(null)}
        onMouseMove={e => {
          const rect = e.currentTarget.getBoundingClientRect();
          const px = ((e.clientX - rect.left) / rect.width) * BAR_W;
          const i = Math.round(((px - PAD_L) / plotW) * (history.length - 1));
          setHover(Math.max(0, Math.min(history.length - 1, i)));
        }}
      >
        {[0, 0.5, 1].map(f => (
          <g key={f}>
            <line x1={PAD_L} x2={BAR_W - PAD_R} y1={y(max * f)} y2={y(max * f)} stroke="#1B2A47" strokeWidth="1" />
            <text x={PAD_L - 6} y={y(max * f) + 3} textAnchor="end" fontSize="9" fill="#776C8E">{fmtShort(max * f)}</text>
          </g>
        ))}

        {/* crosshair */}
        {hover !== null && (
          <line x1={x(hover)} x2={x(hover)} y1={PAD_T} y2={PAD_T + plotH} stroke="#2B4066" strokeWidth="1" strokeDasharray="3 3" />
        )}

        <path d={path('account')} fill="none" stroke={C_ACCOUNT} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        <path d={path('savings')} fill="none" stroke={C_SAVINGS} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {/* hover markers with 2px surface ring */}
        {hover !== null && (
          <>
            <circle cx={x(hover)} cy={y(history[hover].account)} r="4" fill={C_ACCOUNT} stroke="#0B1120" strokeWidth="2" />
            <circle cx={x(hover)} cy={y(history[hover].savings)} r="4" fill={C_SAVINGS} stroke="#0B1120" strokeWidth="2" />
          </>
        )}

        {/* first/last date labels */}
        <text x={PAD_L} y={BAR_H - 8} fontSize="9" fill="#776C8E">{history[0].date.slice(5)}</text>
        <text x={BAR_W - PAD_R} y={BAR_H - 8} textAnchor="end" fontSize="9" fill="#776C8E">{history[history.length - 1].date.slice(5)}</text>
      </svg>

      {hover !== null && (
        <div
          className="absolute -top-1 pointer-events-none bg-[#04060B] border border-[#2B4066] rounded-lg px-3 py-2 shadow-xl z-10 -translate-x-1/2"
          style={{ left: `${(x(hover) / BAR_W) * 100}%` }}
        >
          <p className="text-xs text-gray-300 font-medium mb-1">{history[hover].date}</p>
          <p className="text-xs whitespace-nowrap"><span className="inline-block w-2 h-2 rounded-sm mr-1.5" style={{ background: C_ACCOUNT }} /><span className="text-gray-400">Cuenta </span><span className="text-gray-200 font-medium">{fmt(history[hover].account)}</span></p>
          <p className="text-xs whitespace-nowrap"><span className="inline-block w-2 h-2 rounded-sm mr-1.5" style={{ background: C_SAVINGS }} /><span className="text-gray-400">Ahorros </span><span className="text-gray-200 font-medium">{fmt(history[hover].savings)}</span></p>
        </div>
      )}
    </div>
  );
}
