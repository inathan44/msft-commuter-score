import { FormInputType } from '@/lib/schemas';
import { ConnectorStopPin, MapData, MapPin } from '@/types/map';
import { connectorStopsWithRadii } from '../data/connectorStopsWithRadii';
import { microsoftBuildings } from '../data/microsoftBuildings';

function createConnectorPins(): ConnectorStopPin[] {
  return connectorStopsWithRadii.map((stop) => ({
    type: 'connectorStop' as const,
    id: stop.id,
    name: stop.name,
    coordinates: [stop.coordinates[0], stop.coordinates[1]],
    description: stop.description,
    hasParking: stop.hasParking,
    isMSBuilding: stop.isMSBuilding,
    commuteTimeToOfficeMinutes: stop.commuteTimeToOfficeMinutes || undefined,
    address: {
      street: stop.address.street || undefined,
      city: stop.address.city || undefined,
      state: stop.address.state || undefined,
      zip: stop.address.zip || undefined,
    },
  }));
}

function createMicrosoftBuildingPins(): MapPin[] {
  return microsoftBuildings.map((building) => ({
    type: 'microsoftBuilding' as const,
    id: building.id,
    name: building.name,
    coordinates: [building.coordinates[0], building.coordinates[1]],
    buildingName: building.buildingName,
    address: {
      street: building.address.street || undefined,
      city: building.address.city || undefined,
      state: building.address.state || undefined,
      zip: building.address.zip || undefined,
    },
  }));
}

export function getMicrosoftBuildingOptions() {
  return [
    { value: 'BEAR CREEK A', label: 'BEAR CREEK A' },
    { value: 'BUILDING 109', label: 'BUILDING 109' },
    { value: 'BUILDING 111', label: 'BUILDING 111' },
  ];
}

export function getMapCenter(mapData: MapData, transportationMethod?: string): [number, number] {
  // For connector routes, use a fixed center that shows all connector stops in the Seattle area
  if (transportationMethod === 'connector') {
    return [47.6205, -122.3493]; // Seattle area center that encompasses most connector stops
  }

  if (mapData.pins.length === 1) {
    // If there's only one pin (selected building), center on it
    const pin = mapData.pins[0];
    return [pin.coordinates[1], pin.coordinates[0]]; // [lat, lng] for Leaflet
  } else if (mapData.pins.length > 1) {
    // If multiple pins, calculate center of all pins
    const avgLat = mapData.pins.reduce((sum, pin) => sum + pin.coordinates[1], 0) / mapData.pins.length;
    const avgLng = mapData.pins.reduce((sum, pin) => sum + pin.coordinates[0], 0) / mapData.pins.length;
    return [avgLat, avgLng];
  }
  // Default to Seattle coordinates
  return [47.6062, -122.3321];
}

export function search(query: Partial<FormInputType>): MapData {
  // Create pin constants globally available within the function
  const connectorPins = createConnectorPins();
  const buildingPins = createMicrosoftBuildingPins();

  if (!query.transportationMethod) {
    return {
      pins: [...connectorPins, ...buildingPins],
      routes: [],
      radii: [],
    };
  }

  if (query.transportationMethod === 'drive') {
    return {
      pins: buildingPins.filter((building) => building.name === query.microsoftBuilding),
      routes: [],
      radii: [],
    };
  }

  if (query.transportationMethod === 'connector') {
    // Filter connector stops based on commute time if radiusTimeMinutes and totalTimeToOffice are provided
    let filteredConnectorPins = connectorPins;

    if (query.radiusTimeMinutes && query.totalTimeToOffice) {
      const radiusTimeNumber = parseInt(query.radiusTimeMinutes);
      filteredConnectorPins = connectorPins.filter((connectorStop) => {
        const commuteTime = connectorStop.commuteTimeToOfficeMinutes || 999999;
        const totalCommuteTime = commuteTime + radiusTimeNumber;
        // Show connector stops where (connector commute time + radius walk time) <= total time to office
        console.log('totalCommuteTime', totalCommuteTime, 'query.totalTimeToOffice', query.totalTimeToOffice);
        return totalCommuteTime <= query.totalTimeToOffice!;
      });
    }

    // Create radius data from the filtered connector stops
    const radiiData = filteredConnectorPins
      .map((connectorStop) => {
        // Find the original connector stop data to get radius info
        const originalStop = connectorStopsWithRadii.find((stop) => stop.id === connectorStop.id);
        if (!originalStop?.radii) return [];

        // If radiusTimeMinutes is specified, only show that specific radius
        if (query.radiusTimeMinutes) {
          const radiusData = originalStop.radii[query.radiusTimeMinutes];
          if (radiusData) {
            return [
              {
                id: `${connectorStop.id}-${query.radiusTimeMinutes}`,
                name: `${connectorStop.name} - ${query.radiusTimeMinutes} min radius`,
                type: 'connectorStopRadius' as const,
                address: radiusData.address,
                centerPoint: radiusData.coordinates as [number, number],
                geometry: radiusData.boundaryGeojson as import('geojson').GeoJsonObject,
                color: undefined,
                travelTimeMinutes: radiusData.travelTimeMinutes,
                transportMode: radiusData.transportMode,
                commuteTimeToOfficeMinutes: undefined,
              },
            ];
          }
        }
        return [];
      })
      .flat();

    return {
      pins: filteredConnectorPins,
      routes: [],
      radii: radiiData,
    };
  }

  // Default return for other transportation methods
  return {
    pins: [],
    routes: [],
    radii: [],
  };
}
