import L from 'leaflet';
import { GeoJsonObject } from 'geojson';
import { MapRoute, RouteMarker } from '@/types/map';

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
