import type { RecommendationCategory, RecommendationCost, RecommendationDifficulty, RecommendationItem, RecommendationType } from '../types';

export interface RecommendationFilters {
  category: RecommendationCategory | 'all';
  timeBlock: number | null;
  cost: RecommendationCost | 'all';
  difficulty: RecommendationDifficulty | 'all';
  type: RecommendationType | 'all';
}

export function defaultFilters(): RecommendationFilters {
  return { category: 'all', timeBlock: null, cost: 'all', difficulty: 'all', type: 'all' };
}

export function applyFilters(items: RecommendationItem[], filters: RecommendationFilters): RecommendationItem[] {
  return items.filter(item =>
    (filters.category === 'all' || item.category === filters.category) &&
    (filters.timeBlock === null || item.timeMinutes <= filters.timeBlock) &&
    (filters.cost === 'all' || item.cost === filters.cost) &&
    (filters.difficulty === 'all' || item.difficulty === filters.difficulty) &&
    (filters.type === 'all' || item.type === filters.type),
  );
}
