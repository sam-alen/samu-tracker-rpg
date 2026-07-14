// Curated, habit-relevant set — not a full emoji keyboard dump, just enough
// variety to cover the common categories (rutina, fitness, salud, estudio,
// dinero, ánimo/social) so most habits find a fitting icon with one click.
const HABIT_EMOJI_OPTIONS = [
  '✅', '🌅', '🌙', '⏰', '🪥', '🚿', '🛏️', '🧹',
  '💪', '🏋️', '🏃', '🚴', '🧘', '🤸', '⚽', '🥗',
  '💧', '😴', '🚭', '🩹',
  '📚', '📖', '✍️', '💻', '🎯', '📝', '🧠', '🔬', '🗣️',
  '💰', '💵', '🏦',
  '🙏', '❤️', '🎨', '🎸', '🎮', '📷', '✈️', '🌱', '📞',
];

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
  options?: string[];
}

export function EmojiPicker({ value, onChange, options = HABIT_EMOJI_OPTIONS }: EmojiPickerProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(e => (
        <button
          key={e}
          type="button"
          onClick={() => onChange(e)}
          className={`text-xl w-9 h-9 flex items-center justify-center rounded-lg border shrink-0 transition-all
            ${value === e ? 'border-gold-400 bg-gold-900/30' : 'border-[#1B2A47] bg-gray-800/30 hover:border-gray-500'}`}
        >
          {e}
        </button>
      ))}
    </div>
  );
}
