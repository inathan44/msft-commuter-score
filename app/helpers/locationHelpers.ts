import { connectorStopsWithRadii } from '@/app/data/connectorStopsWithRadii';
import { ConnectorStopPin } from '@/types/map';

/**
 * Calculate the distance between two geographic coordinates using the Haversine formula
 * @param lat1 Latitude of first point
 * @param lng1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lng2 Longitude of second point
 * @returns Distance in kilometers
 */
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

/**
 * Find nearby Microsoft Connector stops within a specified radius
 * @param userLat User's latitude
 * @param userLng User's longitude
 * @param radiusKm Search radius in kilometers (default: 2km)
 * @param maxResults Maximum number of results to return (default: 5)
 * @returns Array of nearby connector stops with distance information
 */
export function findNearbyConnectorStops(
  userLat: number,
  userLng: number,
  radiusKm: number = 2,
  maxResults: number = 5
): Array<ConnectorStopPin & { distanceKm: number; distanceFormatted: string }> {
  const nearbyStops: Array<ConnectorStopPin & { distanceKm: number; distanceFormatted: string }> = [];

  for (const stop of connectorStopsWithRadii) {
    const distance = calculateDistance(userLat, userLng, stop.coordinates[1], stop.coordinates[0]);

    if (distance <= radiusKm) {
      nearbyStops.push({
        type: 'connectorStop' as const,
        id: stop.id,
        name: stop.name,
        coordinates: [stop.coordinates[0], stop.coordinates[1]],
        description: stop.description,
        hasParking: stop.hasParking,
        isMSBuilding: stop.isMSBuilding,
        commuteTimeToOfficeMinutes: stop.commuteTimeToOfficeMinutes || undefined,
        address: {
          street: stop.address.street || undefined,
          city: stop.address.city || undefined,
          state: stop.address.state || undefined,
          zip: stop.address.zip || undefined,
        },
        distanceKm: distance,
        distanceFormatted: distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`,
      });
    }
  }

  // Sort by distance and limit results
  return nearbyStops.sort((a, b) => a.distanceKm - b.distanceKm).slice(0, maxResults);
}

/**
 * Convert nearby connector stops to map pins for rendering
 * @param userLat User's latitude
 * @param userLng User's longitude
 * @param radiusKm Search radius in kilometers (default: 2km)
 * @param maxResults Maximum number of results to return (default: 5)
 * @returns Array of map pins ready for map rendering
 */
export function getNearbyConnectorPins(
  userLat: number,
  userLng: number,
  radiusKm: number = 2,
  maxResults: number = 5
): ConnectorStopPin[] {
  const nearbyStops = findNearbyConnectorStops(userLat, userLng, radiusKm, maxResults);

  return nearbyStops.map((stop) => ({
    type: 'connectorStop' as const,
    id: stop.id,
    name: stop.name,
    coordinates: stop.coordinates,
    description: `${stop.description}\n\nDistance: ${stop.distanceFormatted} from your location`,
    hasParking: stop.hasParking,
    isMSBuilding: stop.isMSBuilding,
    commuteTimeToOfficeMinutes: stop.commuteTimeToOfficeMinutes,
    address: stop.address,
  }));
}

/**
 * Check if there are any connector stops within walking distance
 * @param userLat User's latitude
 * @param userLng User's longitude
 * @param walkingDistanceKm Maximum walking distance in km (default: 1km = ~12 min walk)
 * @returns Boolean indicating if connector stops are within walking distance
 */
export function hasNearbyConnectorStops(userLat: number, userLng: number, walkingDistanceKm: number = 1): boolean {
  return findNearbyConnectorStops(userLat, userLng, walkingDistanceKm, 1).length > 0;
}

/**
 * Get a summary of nearby connector stops for UI display
 * @param userLat User's latitude
 * @param userLng User's longitude
 * @param radiusKm Search radius in kilometers (default: 2km)
 * @returns Summary object with count and closest stop info
 */
export function getNearbyConnectorSummary(
  userLat: number,
  userLng: number,
  radiusKm: number = 2
): {
  count: number;
  closestDistance: string | null;
  closestStopName: string | null;
  hasWalkableStops: boolean;
} {
  const nearbyStops = findNearbyConnectorStops(userLat, userLng, radiusKm);
  const walkableStops = findNearbyConnectorStops(userLat, userLng, 1); // Within 1km

  return {
    count: nearbyStops.length,
    closestDistance: nearbyStops.length > 0 ? nearbyStops[0].distanceFormatted : null,
    closestStopName: nearbyStops.length > 0 ? nearbyStops[0].name : null,
    hasWalkableStops: walkableStops.length > 0,
  };
}
