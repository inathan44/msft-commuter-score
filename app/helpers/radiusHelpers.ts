import L from 'leaflet';
import { GeoJsonObject } from 'geojson';
import { MapRadius } from '@/types/map';

export const addRadius = (radius: MapRadius, map: L.Map) => {
  const color = radius.color || '#bf4040';

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
