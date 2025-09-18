import { TransportMode } from '@/lib/routing-schema';

/**
 * Fetch routing data using our secure API proxy
 * This avoids exposing the API key on the client side
 */
export async function getRoutingData(waypoints: string, mode: TransportMode = 'drive') {
  try {
    const params = new URLSearchParams({
      waypoints,
      mode,
    });

    const response = await fetch(`/api/routing?${params}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching routing data:', error);
    throw error;
  }
}

/**
 * Fetch address autocomplete suggestions using our secure API proxy
 */
export async function getAutocompleteData(
  text: string,
  options: {
    type?: 'country' | 'state' | 'city' | 'postcode' | 'street' | 'amenity' | 'locality';
    filter?: string;
    bias?: string;
    limit?: number;
  } = {}
) {
  try {
    const params = new URLSearchParams({
      text,
      format: 'json',
    });

    if (options.type) params.append('type', options.type);
    if (options.filter) params.append('filter', options.filter);
    if (options.bias) params.append('bias', options.bias);
    if (options.limit) params.append('limit', options.limit.toString());

    const response = await fetch(`/api/geocode/autocomplete?${params}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching autocomplete data:', error);
    throw error;
  }
}

/**
 * Convert an address to coordinates using the autocomplete API
 * Returns the first (best) match
 */
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number; formatted: string } | null> {
  try {
    const data = await getAutocompleteData(address, { limit: 1 });

    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      return {
        lat: result.lat,
        lng: result.lon,
        formatted: result.formatted,
      };
    }

    return null;
  } catch (error) {
    console.error('Error geocoding address:', error);
    throw error;
  }
}

/**
 * Helper function to format coordinates for the Geoapify API
 * @param coordinates Array of [lat, lng] pairs
 * @returns Formatted waypoints string
 */
export function formatWaypoints(coordinates: [number, number][]): string {
  return coordinates.map(([lat, lng]) => `${lat},${lng}`).join('|');
}

/**
 * Convert addresses to coordinates and then get routing data
 * @param addresses Array of address strings
 * @param mode Transportation mode
 * @returns Routing data with geocoded addresses
 */
export async function getRoutingFromAddresses(addresses: string[], mode: TransportMode = 'drive') {
  try {
    // Geocode all addresses
    const geocodedAddresses = await Promise.all(
      addresses.map(async (address) => {
        const coords = await geocodeAddress(address);
        if (!coords) {
          throw new Error(`Could not geocode address: ${address}`);
        }
        return { address, ...coords };
      })
    );

    // Extract coordinates for routing
    const coordinates: [number, number][] = geocodedAddresses.map(({ lat, lng }) => [lat, lng]);
    const waypoints = formatWaypoints(coordinates);

    // Get routing data
    const routingData = await getRoutingData(waypoints, mode);

    // Return combined data
    return {
      routingData,
      geocodedAddresses,
    };
  } catch (error) {
    console.error('Error getting routing from addresses:', error);
    throw error;
  }
}

/**
 * Example usage:
 *
 * // Basic routing with coordinates
 * const waypoints = formatWaypoints([
 *   [50.96209827745463, 4.414458883409225],
 *   [50.429137079078345, 5.00088081232559]
 * ])
 * const routingData = await getRoutingData(waypoints, 'drive')
 *
 * // Address autocomplete
 * const suggestions = await getAutocompleteData('123 Main St', { limit: 5 })
 *
 * // Geocode single address
 * const coords = await geocodeAddress('123 Main Street, Seattle, WA')
 *
 * // Route between addresses
 * const result = await getRoutingFromAddresses([
 *   '123 Capitol Hill, Seattle, WA',
 *   'One Microsoft Way, Redmond, WA'
 * ], 'drive')
 */
