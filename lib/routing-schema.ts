import { z } from 'zod';

// Transportation modes supported by Geoapify
export const transportModes = ['drive', 'transit', 'walk', 'bike', 'truck', 'taxi'] as const;

export type TransportMode = (typeof transportModes)[number];

// Form schema for routing requests
export const routingFormSchema = z.object({
  startAddress: z.string().min(3, 'Start address must be at least 3 characters').max(200, 'Start address too long'),

  endAddress: z.string().min(3, 'End address must be at least 3 characters').max(200, 'End address too long'),

  mode: z.enum(transportModes).refine((val) => val !== undefined, { message: 'Please select a transportation mode' }),

  // Optional routing preferences
  type: z.enum(['balanced', 'short', 'less_maneuvers']).optional(),
  units: z.enum(['metric', 'imperial']).optional(),
  avoidTolls: z.boolean().optional(),
  avoidFerries: z.boolean().optional(),
});

export type RoutingFormData = z.infer<typeof routingFormSchema>;

// Normalized coordinate type for consistent usage
export interface Coordinate {
  lat: number;
  lng: number;
}

// Normalized address with coordinates
export interface GeocodedAddress {
  original: string;
  formatted: string;
  coordinates: Coordinate;
  placeId?: string;
}

// Normalized route geometry for map rendering
export interface RouteGeometry {
  type: 'LineString';
  coordinates: [number, number][]; // [lng, lat] format for GeoJSON
}

// Normalized route data for map display
export interface NormalizedRoute {
  id: string;
  geometry: RouteGeometry;
  properties: {
    mode: TransportMode;
    distance: number; // meters
    time: number; // seconds
    distanceFormatted: string; // "5.2 km" or "3.2 miles"
    timeFormatted: string; // "25 min"
    description?: string;
    color: string;
  };
}

// Complete routing response with all data needed for map
export interface RoutingMapData {
  startAddress: GeocodedAddress;
  endAddress: GeocodedAddress;
  route: NormalizedRoute;
  waypoints: Coordinate[];
  success: boolean;
  error?: string;
}

// Color scheme for different transport modes
export const transportModeColors: Record<TransportMode, string> = {
  drive: '#3b82f6', // blue
  transit: '#10b981', // green
  walk: '#8b5cf6', // purple
  bike: '#f59e0b', // amber
  truck: '#ef4444', // red
  taxi: '#06b6d4', // cyan
};

// Icons for transport modes (Lucide React icon names)
export const transportModeIcons: Record<TransportMode, string> = {
  drive: 'Car',
  transit: 'Train',
  walk: 'PersonStanding',
  bike: 'Bike',
  truck: 'Truck',
  taxi: 'Car',
};

// Helper function to format distance
export function formatDistance(meters: number, units: 'metric' | 'imperial' = 'metric'): string {
  if (units === 'imperial') {
    const miles = meters * 0.000621371;
    return miles >= 1 ? `${miles.toFixed(1)} miles` : `${(miles * 5280).toFixed(0)} ft`;
  } else {
    return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${meters.toFixed(0)} m`;
  }
}

// Helper function to format time
export function formatTime(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  }
  return `${minutes} min`;
}

// Helper to generate unique route ID
export function generateRouteId(start: string, end: string, mode: TransportMode): string {
  const hash = btoa(`${start}-${end}-${mode}`).slice(0, 8);
  return `route-${mode}-${hash}`;
}
