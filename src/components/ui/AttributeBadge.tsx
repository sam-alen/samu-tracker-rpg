import { ATTRIBUTES, ATTRIBUTE_COLORS, ATTRIBUTE_ICONS, ATTRIBUTE_LABELS } from '../../lib/attributes';
import type { RPGAttribute } from '../../types';

export function AttributeBadge({ attr, size = 'sm' }: { attr: RPGAttribute; size?: 'sm' | 'md' }) {
  const color = ATTRIBUTE_COLORS[attr];
  const Icon = ATTRIBUTE_ICONS[attr];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md font-semibold border shrink-0 ${
        size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1'
      }`}
      style={{ color, borderColor: `${color}4D`, backgroundColor: `${color}1F` }}
      title={ATTRIBUTE_LABELS[attr]}
    >
      <Icon size={size === 'sm' ? 10 : 12} />
      {attr}
    </span>
  );
}

export function AttributePicker({ value, onChange }: { value: RPGAttribute; onChange: (a: RPGAttribute) => void }) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {ATTRIBUTES.map(a => {
        const color = ATTRIBUTE_COLORS[a];
        const active = value === a;
        const Icon = ATTRIBUTE_ICONS[a];
        return (
          <button
            key={a}
            type="button"
            onClick={() => onChange(a)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all"
            style={active
              ? { borderColor: color, backgroundColor: `${color}1F`, color }
              : { borderColor: 'rgba(148,163,184,0.15)', color: '#7E92B4', backgroundColor: 'transparent' }}
          >
            <Icon size={13} />
            {ATTRIBUTE_LABELS[a]}
          </button>
        );
      })}
    </div>
  );
}
