import { MapData, MapPin, MapRoute, MapRadius } from '@/types/map';

// Helper function to create route map data with optional radius inclusion
export function createRouteMapData(pins: MapPin[], routes: MapRoute[] = [], includeRadius: boolean = false): MapData {
  return {
    pins,
    routes,
    radii: includeRadius ? [] : [], // No radii data available without external source
  };
}

// Helper function to create basic map data structure
export function createMapData(pins: MapPin[] = [], routes: MapRoute[] = [], radii: MapRadius[] = []): MapData {
  return {
    pins,
    routes,
    radii,
  };
}
