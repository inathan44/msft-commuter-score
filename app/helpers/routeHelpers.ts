import L from 'leaflet';
import { GeoJsonObject } from 'geojson';
import { MapRoute, RouteMarker, ConnectorRoute, RouteSchedule } from '@/types/map';
import { allRoutes } from '@/app/data/allRoutes';

const createCustomIcon = (color: string, emoji: string) => {
  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        border: 2px solid white;
        border-radius: 50%;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      ">
        ${emoji}
      </div>
    `,
    className: 'custom-marker',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  });
};

export const addRoute = (route: MapRoute, map: L.Map) => {
  const color = route.color || '#007bff';

  console.log('Adding route:', route);
  console.log('Route geometry:', route.geometry);

  // Type check for LineString geometry
  if (route.geometry.type === 'LineString') {
    const lineString = route.geometry as { type: 'LineString'; coordinates: [number, number][] };
    console.log('Route coordinates sample:', lineString.coordinates?.slice(0, 3));
  }

  try {
    L.geoJSON(route.geometry as GeoJsonObject, {
      style: {
        color,
        weight: 4,
        opacity: 0.8,
      },
      onEachFeature: (feature, layer) => {
        layer.bindPopup(`
          <div>
            <h3 style="margin: 0 0 8px 0; font-weight: bold;">Route Information</h3>
            <p style="margin: 4px 0;"><strong>Route:</strong> ${route.name}</p>
            <p style="margin: 4px 0;"><strong>Type:</strong> Driving</p>
            <p style="margin: 4px 0;"><strong>Distance:</strong> ${route.distance || '~5.5km'}</p>
            <p style="margin: 4px 0;"><strong>Est. Time:</strong> ${route.estimatedTime || '8-10 minutes'}</p>
            <p style="margin: 4px 0; font-size: 12px; color: #666;">Click anywhere on the route for details</p>
          </div>
        `);

        layer.on('mouseover', () => {
          (layer as L.Path).setStyle({ color, weight: 6, opacity: 1.0 });
        });

        layer.on('mouseout', () => {
          (layer as L.Path).setStyle({ color, weight: 4, opacity: 0.8 });
        });
      },
    }).addTo(map);
  } catch (error) {
    console.error('Error adding route to map:', error);
    console.error('Problematic route geometry:', route.geometry);
  }
};

export const addRouteMarker = (marker: RouteMarker, map: L.Map) => {
  const [lng, lat] = marker.coordinates;
  const isStart = marker.type === 'start';
  const color = isStart ? '#10B981' : '#EF4444';
  const emoji = isStart ? '🚗' : '🏁';

  const leafletMarker = L.marker([lat, lng], {
    icon: createCustomIcon(color, emoji),
  })
    .addTo(map)
    .bindPopup(marker.label);

  // Auto-open popup for start marker
  if (isStart) {
    leafletMarker.openPopup();
  }
};

// ============================================================================
// Schedule Helper Functions
// ============================================================================

/**
 * Get all available connector routes
 */
export function getAllConnectorRoutes(): ConnectorRoute[] {
  return allRoutes;
}

/**
 * Find routes that serve a specific connector stop
 * @param stopId The connector stop ID to search for
 * @returns Array of routes that include this stop
 */
export function getRoutesForStop(stopId: string): ConnectorRoute[] {
  return allRoutes.filter((route) => route.orderedStops.some((stop) => stop.stopId === stopId));
}

/**
 * Find routes that serve multiple connector stops (for area coverage)
 * @param stopIds Array of connector stop IDs
 * @returns Array of routes that serve any of the provided stops
 */
export function getRoutesForStops(stopIds: string[]): ConnectorRoute[] {
  const uniqueRoutes = new Map<string, ConnectorRoute>();

  allRoutes.forEach((route) => {
    const hasMatchingStop = route.orderedStops.some((stop) => stopIds.includes(stop.stopId));

    if (hasMatchingStop) {
      uniqueRoutes.set(route.routeId, route);
    }
  });

  return Array.from(uniqueRoutes.values());
}

/**
 * Get next departure times for a specific stop
 * @param stopId The connector stop ID
 * @param currentTime Current time as ISO string (defaults to now)
 * @param maxResults Maximum number of upcoming departures to return
 * @returns Array of upcoming departure schedules
 */
export function getNextDepartures(
  stopId: string,
  currentTime?: string,
  maxResults: number = 5
): Array<RouteSchedule & { routeName: string; routeId: string }> {
  const now = currentTime ? new Date(currentTime) : new Date();
  const upcomingDepartures: Array<RouteSchedule & { routeName: string; routeId: string }> = [];

  // Find all routes that serve this stop
  const relevantRoutes = getRoutesForStop(stopId);

  relevantRoutes.forEach((route) => {
    route.trips.forEach((trip) => {
      trip.routeSchedules.forEach((schedule) => {
        if (schedule.stopId === stopId && schedule.isPickUp) {
          const departureTime = new Date(schedule.departureTime);

          // Only include future departures
          if (departureTime > now) {
            upcomingDepartures.push({
              ...schedule,
              routeName: route.routeName,
              routeId: route.routeId,
            });
          }
        }
      });
    });
  });

  // Sort by departure time and limit results
  return upcomingDepartures
    .sort((a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime())
    .slice(0, maxResults);
}

/**
 * Get schedule summary for a connector stop
 * @param stopId The connector stop ID
 * @param currentTime Current time as ISO string (defaults to now)
 * @returns Summary of schedule information for the stop
 */
export function getStopScheduleSummary(
  stopId: string,
  currentTime?: string
): {
  stopId: string;
  routeCount: number;
  nextDeparture: (RouteSchedule & { routeName: string; routeId: string }) | null;
  upcomingDepartures: Array<RouteSchedule & { routeName: string; routeId: string }>;
  routeNames: string[];
} {
  const routes = getRoutesForStop(stopId);
  const upcomingDepartures = getNextDepartures(stopId, currentTime, 3);

  return {
    stopId,
    routeCount: routes.length,
    nextDeparture: upcomingDepartures.length > 0 ? upcomingDepartures[0] : null,
    upcomingDepartures,
    routeNames: routes.map((route) => route.routeName),
  };
}

/**
 * Format departure time for display
 * @param departureTime ISO datetime string
 * @param currentTime Current time as ISO string (defaults to now)
 * @returns Formatted time string (e.g., "in 15 min" or "2:30 PM")
 */
export function formatDepartureTime(departureTime: string, currentTime?: string): string {
  const departure = new Date(departureTime);
  const now = currentTime ? new Date(currentTime) : new Date();
  const diffMinutes = Math.round((departure.getTime() - now.getTime()) / (1000 * 60));

  if (diffMinutes < 0) {
    return 'Departed';
  } else if (diffMinutes < 60) {
    return `in ${diffMinutes} min`;
  } else {
    return departure.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }
}
