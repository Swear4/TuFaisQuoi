import { Event, EventCategory } from '../types';

function normalizeCategoryString(value: string): string[] {
  return value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

export function getEventCategories(event: Partial<Event> & { category?: any; categories?: any }): EventCategory[] {
  const rawCategories = (event as any)?.categories;
  if (Array.isArray(rawCategories)) {
    return rawCategories.filter(Boolean) as EventCategory[];
  }

  const rawCategory = (event as any)?.category;
  if (typeof rawCategory === 'string') {
    const normalized = normalizeCategoryString(rawCategory);
    return (normalized.length ? normalized : []) as EventCategory[];
  }

  return [];
}

export function getPrimaryCategory(event: Partial<Event> & { category?: any; categories?: any }): EventCategory {
  const categories = getEventCategories(event);
  if (categories.length > 0) return categories[0];
  return ((event as any)?.category || 'culturel') as EventCategory;
}
