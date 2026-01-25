/**
 * Service de Géocodage
 * Convertit les adresses en coordonnées GPS
 */

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

export interface GeocodingResult {
  lat: number;
  lng: number;
  display_name: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    postcode?: string;
  };
}

/**
 * Rechercher des suggestions de villes (autocomplétion simplifiée)
 * Utilisé pour sélectionner la ville où placer le pin sur la carte
 */
export async function searchCitySuggestions(query: string): Promise<GeocodingResult[]> {
  if (query.length < 2) {
    return []; // Attendre au moins 2 caractères
  }

  try {
    // Bounding box pour le Pays de la Loire
    const viewbox = '-2.5,46.8,-0.8,47.8';
    
    const params = new URLSearchParams({
      city: query,
      format: 'json',
      addressdetails: '1',
      limit: '15',
      countrycodes: 'fr',
      viewbox: viewbox,
      bounded: '1',
    });

    const response = await fetch(
      `${NOMINATIM_BASE_URL}/search?${params.toString()}`,
      {
        headers: {
          'User-Agent': 'EventLink-App/1.0',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Erreur lors de la recherche');
    }

    const data = await response.json();

    // Dédupliquer les villes et ne garder que les noms de ville
    const citiesMap = new Map<string, GeocodingResult>();
    
    data.forEach((result: any) => {
      if (result.address) {
        const cityName = result.address.city || 
                        result.address.town || 
                        result.address.village || 
                        result.address.municipality;
        
        if (cityName && !citiesMap.has(cityName.toLowerCase())) {
          citiesMap.set(cityName.toLowerCase(), {
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon),
            display_name: cityName,
            address: result.address,
          });
        }
      }
    });

    return Array.from(citiesMap.values()).slice(0, 8);
  } catch (error) {
    console.error('Erreur de recherche de villes:', error);
    return [];
  }
}

/**
 * Géocoder une adresse (convertir en coordonnées GPS)
 * Limite la recherche au Pays de Retz et Pays de la Loire
 */
export async function geocodeAddress(address: string): Promise<GeocodingResult | null> {
  try {
    // Bounding box pour le Pays de la Loire (sud-ouest: lon,lat nord-est: lon,lat)
    const viewbox = '-2.5,46.8,-0.8,47.8'; // Couvre le Pays de Retz et Pays de la Loire
    
    const params = new URLSearchParams({
      q: address,
      format: 'json',
      addressdetails: '1',
      limit: '1',
      countrycodes: 'fr',
      viewbox: viewbox,
      bounded: '1', // Limite strictement à la viewbox
    });

    const response = await fetch(
      `${NOMINATIM_BASE_URL}/search?${params.toString()}`,
      {
        headers: {
          'User-Agent': 'EventLink-App/1.0', // Requis par Nominatim
        },
      }
    );

    if (!response.ok) {
      throw new Error('Erreur lors du géocodage');
    }

    const data = await response.json();

    if (data.length === 0) {
      return null;
    }

    const result = data[0];
    return {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      display_name: result.display_name,
      address: result.address || {},
    };
  } catch (error) {
    console.error('Erreur de géocodage:', error);
    return null;
  }
}

/**
 * Valider qu'une adresse est dans le Pays de Retz ou environs
 */
export function isAddressInRegion(result: GeocodingResult): boolean {
  const { lat, lng } = result;
  
  // Vérifier que les coordonnées sont dans la région Pays de la Loire
  // Latitude: entre 46.8 et 47.8
  // Longitude: entre -2.5 et -0.8
  const isInBounds = 
    lat >= 46.8 && lat <= 47.8 &&
    lng >= -2.5 && lng <= -0.8;

  return isInBounds;
}

/**
 * Obtenir le nom de la ville depuis le résultat de géocodage
 */
export function getCityFromResult(result: GeocodingResult): string {
  const { address } = result;
  return address.city || address.town || address.village || address.municipality || '';
}
