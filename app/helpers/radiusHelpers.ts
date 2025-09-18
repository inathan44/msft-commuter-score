import L from 'leaflet';
import { GeoJsonObject } from 'geojson';
import { MapRadius } from '@/types/map';

export const addRadius = (radius: MapRadius, map: L.Map) => {
  // Determine color based on transportation mode and type
  let color: string;

  if (radius.type === 'connectorStopRadius') {
    color = '#06b6d4'; // Teal for connector stops
  } else {
    // For otherRadius type, use transport mode to determine color
    switch (radius.transportMode.toLowerCase()) {
      case 'drive':
      case 'driving':
        color = '#3b82f6'; // Blue for driving
        break;
      case 'cycle':
      case 'cycling':
        color = '#10b981'; // Green for cycling
        break;
      case 'walk':
      case 'walking':
        color = '#8b5cf6'; // Purple for walking
        break;
      default:
        color = '#6b7280'; // Gray fallback
    }
  }

  L.geoJSON(radius.geometry as GeoJsonObject, {
    style: {
      color,
      fillColor: color,
      fillOpacity: 0.33,
      weight: 2,
    },
  }).addTo(map).bindPopup(`
      <div>
        <strong>${radius.address}</strong><br/>
        <em>${radius.travelTimeMinutes} minute ${radius.transportMode} radius</em><br/>
        Transport: ${radius.transportMode}
      </div>
    `);
};
