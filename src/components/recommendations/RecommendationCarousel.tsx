import { type ReactNode } from 'react';
import type { RecommendationItem } from '../../types';

interface RecommendationCarouselProps {
  title: string;
  items: RecommendationItem[];
  renderCard: (item: RecommendationItem) => ReactNode;
}

export function RecommendationCarousel({ title, items, renderCard }: RecommendationCarouselProps) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="text-sm font-semibold text-white mb-2.5">{title}</p>
      <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-1 snap-x snap-mandatory">
        {items.map(item => <div key={item.id} className="snap-start">{renderCard(item)}</div>)}
      </div>
    </div>
  );
}
