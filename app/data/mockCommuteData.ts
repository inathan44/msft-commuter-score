import { MapData } from '@/types/map';
import { LineString, Polygon } from 'geojson';

// Mock commute route data with realistic Seattle coordinates
export const mockCommuteMapData: MapData = {
  pins: [
    // Home location (Capitol Hill)
    {
      id: 'home',
      type: 'other',
      coordinates: [-122.3193, 47.6205],
      name: 'Home',
      address: {
        street: '123 Capitol Hill',
        city: 'Seattle',
        state: 'WA',
        zip: '98102',
      },
    },
    // Microsoft office - Redmond campus only
    {
      id: 'msft-redmond',
      type: 'microsoftBuilding',
      coordinates: [-122.1213, 47.6394],
      name: 'Microsoft Redmond Campus',
      buildingName: 'One Microsoft Way',
      address: {
        street: 'One Microsoft Way',
        city: 'Redmond',
        state: 'WA',
      },
    },
    // Transit stops
    {
      id: 'capitol-hill-station',
      type: 'connectorStop',
      coordinates: [-122.3193, 47.6191],
      name: 'Capitol Hill Station',
      description: 'Light Rail Station',
      hasParking: false,
      isMSBuilding: false,
    },
  ],
  routes: [
    // Driving route to Redmond
    {
      id: 'drive-to-redmond',
      name: 'Drive to Redmond',
      geometry: {
        type: 'LineString',
        coordinates: [
          [-122.3193, 47.6205], // Home
          [-122.3, 47.63], // I-520 entrance
          [-122.25, 47.64], // On I-520
          [-122.2, 47.64], // Redmond exit
          [-122.1213, 47.6394], // Microsoft Redmond
        ],
      } as LineString,
      color: '#3b82f6',
      description: 'Via I-520 E',
      distance: '18.2 miles',
      estimatedTime: '32 min',
    },
    // Transit route to Redmond
    {
      id: 'transit-to-redmond',
      name: 'Transit to Redmond',
      geometry: {
        type: 'LineString',
        coordinates: [
          [-122.3193, 47.6205], // Home
          [-122.3193, 47.6191], // Capitol Hill Station
          [-122.29, 47.62], // University Street
          [-122.26, 47.635], // UW
          [-122.2, 47.645], // Overlake
          [-122.1213, 47.6394], // Microsoft Redmond
        ],
      } as LineString,
      color: '#10b981',
      description: 'Light Rail + Connector',
      distance: 'Walk + Transit',
      estimatedTime: '58 min',
    },
    // Bike route to Redmond
    {
      id: 'bike-to-redmond',
      name: 'Bike to Redmond',
      geometry: {
        type: 'LineString',
        coordinates: [
          [-122.3193, 47.6205], // Home
          [-122.31, 47.64], // Burke-Gilman Trail
          [-122.28, 47.65], // Through UW
          [-122.23, 47.66], // Kirkland
          [-122.17, 47.65], // Redmond trail
          [-122.1213, 47.6394], // Microsoft Redmond
        ],
      } as LineString,
      color: '#f59e0b',
      description: 'Burke-Gilman Trail',
      distance: '18.2 miles',
      estimatedTime: '1h 45min',
    },
  ],
  radii: [
    // 30-minute driving radius from home
    {
      id: 'drive-30min',
      name: '30-minute drive',
      type: 'otherRadius',
      address: '123 Capitol Hill, Seattle, WA',
      centerPoint: [-122.3193, 47.6205],
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-122.4, 47.58],
            [-122.4, 47.66],
            [-122.2, 47.66],
            [-122.2, 47.58],
            [-122.4, 47.58],
          ],
        ],
      } as Polygon,
      color: '#3b82f620',
      travelTimeMinutes: 30,
      transportMode: 'driving',
    },
  ],
};

export const routeColors = {
  drive: '#3b82f6',
  transit: '#10b981',
  bike: '#f59e0b',
  walk: '#8b5cf6',
};

export const transportModes = {
  drive: { icon: 'Car', color: routeColors.drive, name: 'Driving' },
  transit: { icon: 'Train', color: routeColors.transit, name: 'Transit/Connector' },
  bike: { icon: 'Bike', color: routeColors.bike, name: 'Bike' },
  walk: { icon: 'Walk', color: routeColors.walk, name: 'Walking' },
};
