'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { GeoJsonObject } from 'geojson';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Leaflet with Webpack
delete (L.Icon.Default.prototype as unknown as { _getIconUrl: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface MapProps {
  center?: [number, number];
  zoom?: number;
  height?: string;
  className?: string;
  tileStyle?: 'light' | 'dark' | 'satellite' | 'terrain' | 'minimal' | 'colorful' | 'vintage' | 'modern';
  showDriveRadius?: boolean;
}

export default function Map({
  center = [47.6062, -122.3321], // Seattle coordinates
  zoom = 13,
  height = '400px',
  className = '',
  tileStyle = 'dark',
  showDriveRadius = false,
}: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize the map
    const map = L.map(mapRef.current).setView(center, zoom);

    // Define tile layer options
    const tileOptions = {
      light: {
        url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      },
      dark: {
        url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      },
      satellite: {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution:
          'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      },
      terrain: {
        url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
        attribution:
          'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
      },
      minimal: {
        url: 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      },
      colorful: {
        url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      },
      vintage: {
        url: 'https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.jpg',
        attribution:
          'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      },
      modern: {
        url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png',
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      },
    };

    // Add the selected tile layer
    const selectedTile = tileOptions[tileStyle];
    L.tileLayer(selectedTile.url, {
      attribution: selectedTile.attribution,
      maxZoom: 19,
    }).addTo(map);

    // Add driving radius if enabled
    if (showDriveRadius) {
      // Load and display the driving radius data
      import('../app/data/exampleDriveRadius.json')
        .then((driveData) => {
          // Check if map still exists and hasn't been unmounted
          if (!mapInstanceRef.current) return;

          // Add the driving radius polygon
          L.geoJSON(driveData.boundaryGeojson as GeoJsonObject, {
            style: {
              color: '#bf4040',
              fillColor: '#bf4040',
              fillOpacity: 0.33,
              weight: 2,
            },
          }).addTo(mapInstanceRef.current);

          // Add a marker at the center point (Microsoft headquarters)
          const centerCoords = driveData.coordinates;
          L.marker([centerCoords[1], centerCoords[0]]) // Note: Leaflet uses [lat, lng]
            .addTo(mapInstanceRef.current)
            .bindPopup(
              `
            <div>
              <strong>${driveData.address}</strong><br/>
              <em>${driveData.travelTimeMinutes} minute driving radius</em><br/>
              Transport: ${driveData.transportMode}
            </div>
          `
            )
            .openPopup();
        })
        .catch((error) => {
          console.error('Failed to load driving radius data:', error);
        });
    }

    mapInstanceRef.current = map;

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [center, zoom, tileStyle, showDriveRadius]);

  return <div ref={mapRef} style={{ height }} className={`w-full rounded-lg border ${className}`} />;
}
