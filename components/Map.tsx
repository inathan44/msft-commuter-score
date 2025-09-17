'use client';

import { tileOptions } from '@/app/helpers/mapOptions';
import { addRadius } from '@/app/helpers/radiusHelpers';
import { addRoute, addRouteMarker } from '@/app/helpers/routeHelpers';
import { addPinDirect } from '@/app/helpers/pinHelpers';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { MapData } from '../types/map';
import 'leaflet/dist/leaflet.css';

interface MapProps {
  center: [number, number];
  zoom: number;
  height: string;
  className?: string;
  tileStyle?: 'light' | 'dark' | 'satellite' | 'terrain' | 'minimal' | 'colorful' | 'vintage' | 'modern';
  mapData: MapData;
}

export default function Map({
  center = [47.6062, -122.3321], // Seattle coordinates
  zoom = 13,
  height = '400px',
  className = '',
  tileStyle = 'colorful',
  mapData,
}: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize the map
    const map = L.map(mapRef.current).setView(center, zoom);

    // Add the selected tile layer
    const selectedTile = tileOptions[tileStyle];
    L.tileLayer(selectedTile.url, {
      attribution: selectedTile.attribution,
      maxZoom: 19,
    }).addTo(map);

    if (mapData.radii && mapData.radii.length > 0) {
      mapData.radii.forEach((radius) => {
        addRadius(radius, map);
      });
    }

    if (mapData.pins && mapData.pins.length > 0) {
      mapData.pins.forEach((pin) => {
        addPinDirect(pin, map);
      });
    }

    if (mapData.routes && mapData.routes.length > 0) {
      mapData.routes.forEach((route) => {
        addRoute(route, map);
      });
    }

    // Render route markers using helper
    if (mapData.routeMarkers && mapData.routeMarkers.length > 0) {
      mapData.routeMarkers.forEach((marker) => {
        addRouteMarker(marker, map);
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
  }, [center, zoom, tileStyle, mapData]);

  return <div ref={mapRef} style={{ height }} className={`w-full rounded-lg border ${className}`} />;
}
