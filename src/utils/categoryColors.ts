/**
 * Couleurs pour les catégories d'événements
 */

export const getCategoryColor = (category: string): { backgroundColor: string; textColor: string } => {
  const normalized = category.toLowerCase();
  
  switch (normalized) {
    case 'culture':
    case 'culturel':
      return { backgroundColor: '#6B7280', textColor: '#FFFFFF' }; // Gris
    
    case 'restaurants':
    case 'gastronomie':
      return { backgroundColor: '#1E3A8A', textColor: '#FFFFFF' }; // Bleu roi
    
    case 'festivals':
    case 'festival':
      return { backgroundColor: '#FBBF24', textColor: '#000000' }; // Jaune
    
    case 'soirée':
    case 'soirées':
    case 'nocturne':
      return { backgroundColor: '#DC2626', textColor: '#FFFFFF' }; // Rouge
    
    case 'bien-être':
    case 'bien-etre':
      return { backgroundColor: '#9333EA', textColor: '#FFFFFF' }; // Mauve
    
    case 'divers':
    default:
      return { backgroundColor: '#F97316', textColor: '#FFFFFF' }; // Orange
  }
};
