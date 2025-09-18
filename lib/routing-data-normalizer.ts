import {
  NormalizedRoute,
  RoutingMapData,
  GeocodedAddress,
  Coordinate,
  TransportMode,
  transportModeColors,
  formatDistance,
  formatTime,
  generateRouteId,
} from '@/lib/routing-schema';

// Geoapify routing response interface
export interface GeoapifyRoutingResponse {
  features: Array<{
    geometry: {
      type: 'LineString' | 'MultiLineString';
      coordinates: number[][] | number[][][]; // LineString or MultiLineString
    };
    properties: {
      distance?: number;
      time?: number;
      way_points?: string[];
      [key: string]: unknown;
    };
  }>;
  [key: string]: unknown;
}

// Normalize Geoapify routing response for map display
export function normalizeRoutingResponse(
  routingData: GeoapifyRoutingResponse,
  geocodedAddresses: Array<{ address: string; lat: number; lng: number; formatted: string }>,
  mode: TransportMode,
  units: 'metric' | 'imperial' = 'metric'
): RoutingMapData {
  try {
    if (!routingData.features || routingData.features.length === 0) {
      throw new Error('No route found in response');
    }

    const feature = routingData.features[0];
    const properties = feature.properties;
    const geometry = feature.geometry;

    console.log('Processing Geoapify routing response:');
    console.log('Feature:', feature);
    console.log('Geometry type:', geometry.type);
    console.log('Coordinates count:', geometry.coordinates?.length);
    console.log('First few coordinates:', geometry.coordinates?.slice(0, 3));

    // Normalize addresses
    const [startGeocode, endGeocode] = geocodedAddresses;
    const startAddress: GeocodedAddress = {
      original: startGeocode.address,
      formatted: startGeocode.formatted,
      coordinates: { lat: startGeocode.lat, lng: startGeocode.lng },
    };

    const endAddress: GeocodedAddress = {
      original: endGeocode.address,
      formatted: endGeocode.formatted,
      coordinates: { lat: endGeocode.lat, lng: endGeocode.lng },
    };

    // Normalize route geometry for GeoJSON (lng, lat format)
    // Handle both LineString and MultiLineString geometries
    let coordinates: [number, number][] = [];

    if (geometry.type === 'LineString') {
      const lineStringCoords = geometry.coordinates as number[][];
      coordinates = lineStringCoords.map((coord: number[]) => [
        coord[0], // longitude
        coord[1], // latitude
      ]);
    } else if (geometry.type === 'MultiLineString') {
      // For MultiLineString, take the first linestring and flatten it
      const multiLineStringCoords = geometry.coordinates as number[][][];
      const firstLineString = multiLineStringCoords[0];
      coordinates = firstLineString.map((coord: number[]) => [
        coord[0], // longitude
        coord[1], // latitude
      ]);
    } else {
      throw new Error(`Unsupported geometry type: ${geometry.type}`);
    }

    console.log('Processed coordinates for map:');
    console.log('Original geometry type:', geometry.type);
    console.log('Coordinates count after processing:', coordinates.length);
    console.log('First few processed coordinates:', coordinates.slice(0, 3));

    // Create normalized route
    const route: NormalizedRoute = {
      id: generateRouteId(startAddress.original, endAddress.original, mode),
      geometry: {
        type: 'LineString',
        coordinates,
      },
      properties: {
        mode,
        distance: properties.distance || 0,
        time: properties.time || 0,
        distanceFormatted: formatDistance(properties.distance || 0, units),
        timeFormatted: formatTime(properties.time || 0),
        description: properties.way_points ? `Via ${properties.way_points.join(', ')}` : undefined,
        color: transportModeColors[mode],
      },
    };

    // Create waypoints (start and end coordinates)
    const waypoints: Coordinate[] = [startAddress.coordinates, endAddress.coordinates];

    return {
      startAddress,
      endAddress,
      route,
      waypoints,
      success: true,
    };
  } catch (error) {
    console.error('Error normalizing routing response:', error);

    // Return error state with minimal data
    const startAddress: GeocodedAddress = geocodedAddresses[0]
      ? {
          original: geocodedAddresses[0].address,
          formatted: geocodedAddresses[0].formatted,
          coordinates: { lat: geocodedAddresses[0].lat, lng: geocodedAddresses[0].lng },
        }
      : {
          original: 'Unknown',
          formatted: 'Unknown location',
          coordinates: { lat: 0, lng: 0 },
        };

    const endAddress: GeocodedAddress = geocodedAddresses[1]
      ? {
          original: geocodedAddresses[1].address,
          formatted: geocodedAddresses[1].formatted,
          coordinates: { lat: geocodedAddresses[1].lat, lng: geocodedAddresses[1].lng },
        }
      : {
          original: 'Unknown',
          formatted: 'Unknown location',
          coordinates: { lat: 0, lng: 0 },
        };

    return {
      startAddress,
      endAddress,
      route: {
        id: 'error-route',
        geometry: { type: 'LineString', coordinates: [] },
        properties: {
          mode,
          distance: 0,
          time: 0,
          distanceFormatted: '0 km',
          timeFormatted: '0 min',
          color: transportModeColors[mode],
        },
      },
      waypoints: [],
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

// Convert normalized data to MapData format for existing Map component
export function convertToMapData(routingMapData: RoutingMapData) {
  const { startAddress, endAddress, route } = routingMapData;

  return {
    pins: [
      {
        id: 'start',
        type: 'other' as const,
        coordinates: [startAddress.coordinates.lng, startAddress.coordinates.lat] as [number, number],
        name: 'Start',
        address: {
          street: startAddress.formatted.split(',')[0] || startAddress.formatted,
          city: startAddress.formatted.split(',')[1]?.trim() || '',
          state: startAddress.formatted.split(',')[2]?.trim() || '',
          zip: '',
        },
      },
      {
        id: 'end',
        type: 'other' as const,
        coordinates: [endAddress.coordinates.lng, endAddress.coordinates.lat] as [number, number],
        name: 'End',
        address: {
          street: endAddress.formatted.split(',')[0] || endAddress.formatted,
          city: endAddress.formatted.split(',')[1]?.trim() || '',
          state: endAddress.formatted.split(',')[2]?.trim() || '',
          zip: '',
        },
      },
    ],
    routes: [
      {
        id: route.id,
        name: `${route.properties.mode} route`,
        geometry: route.geometry,
        color: route.properties.color,
        description: route.properties.description || `${route.properties.mode} route`,
        distance: route.properties.distanceFormatted,
        estimatedTime: route.properties.timeFormatted,
      },
    ],
    radii: [], // No radii for routing results
  };
}

// Helper to extract center point for map focusing
export function getRouteCenter(routingMapData: RoutingMapData): Coordinate {
  const { startAddress, endAddress } = routingMapData;

  return {
    lat: (startAddress.coordinates.lat + endAddress.coordinates.lat) / 2,
    lng: (startAddress.coordinates.lng + endAddress.coordinates.lng) / 2,
  };
}

// Calculate appropriate zoom level based on route distance
export function calculateZoomLevel(distance: number): number {
  // Distance in meters, return appropriate zoom level
  if (distance < 1000) return 15; // < 1km: neighborhood level
  if (distance < 5000) return 13; // < 5km: city district level
  if (distance < 25000) return 11; // < 25km: city level
  if (distance < 100000) return 9; // < 100km: metro area level
  return 7; // > 100km: regional level
}
