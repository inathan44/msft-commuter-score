import { FormInputType } from '@/lib/schemas';
import { ConnectorStopPin, MapData, MapPin, MapRadius, Coordinate } from '@/types/map';
import { connectorStopsWithRadii } from '../data/connectorStopsWithRadii';
import { microsoftBuildings } from '../data/microsoftBuildings';
import { driveRadii } from '../data/exampleDriveRadii';
import { cycleRadii } from '../data/exampleCycleRadii';
import { walkRadii } from '../data/exampleWalkRadii';

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

function createRedmondTechStationPin(): MapPin {
  // Redmond Technology Station - where Microsoft Connector drops off
  return {
    type: 'microsoftBuilding' as const,
    id: 'redmond-tech-station',
    name: 'Microsoft Redmond Campus',
    coordinates: [-122.126928, 47.641986],
    buildingName: 'Microsoft Redmond',
    logo: '/microsoft-logo.svg', // Microsoft logo
    address: {
      street: '15635 NE 40th St',
      city: 'Redmond',
      state: 'WA',
      zip: '98052',
    },
  };
}

export function getMicrosoftBuildingOptions(): { value: string; label: string }[] {
  return microsoftBuildings
    .map((building) => ({ value: building.name, label: building.name }))
    .sort((a, b) => {
      // Extract building numbers if they exist
      const aMatch = a.label.match(/^BUILDING (\d+)$/);
      const bMatch = b.label.match(/^BUILDING (\d+)$/);

      // Both are numbered buildings - sort by number
      if (aMatch && bMatch) {
        return parseInt(aMatch[1]) - parseInt(bMatch[1]);
      }

      // Only a is numbered - numbered buildings come first¡
      if (aMatch && !bMatch) {
        return -1;
      }

      // Only b is numbered - numbered buildings come first
      if (!aMatch && bMatch) {
        return 1;
      }

      // Both are named buildings - sort alphabetically
      return a.label.localeCompare(b.label);
    });
}

export function getMapCenter(mapData: MapData, transportationMethods?: string[]): [number, number] {
  // For connector routes, use a fixed center that shows all connector stops in the Seattle area
  if (transportationMethods?.includes('connector')) {
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

  if (!query.transportationMethods || query.transportationMethods.length === 0) {
    return {
      pins: [...connectorPins, ...buildingPins],
      routes: [],
      radii: [],
    };
  }

  const allRadii: MapRadius[] = [];
  const allPins: MapPin[] = [];

  // Process each selected transportation method
  for (const transportationMethod of query.transportationMethods) {
    if (transportationMethod === 'drive') {
      // If a specific building is selected, filter to that building only
      // If no building is selected, show all buildings for exploration
      const filteredBuildings = query.microsoftBuilding
        ? buildingPins.filter((building) => building.name === query.microsoftBuilding)
        : buildingPins;
      allPins.push(...filteredBuildings);

      // Add drive radius based on selected time if both building and time are specified
      if (query.microsoftBuilding && query.totalTimeToOffice) {
        const selectedRadius = driveRadii.find((radius) => radius.travelTimeMinutes === query.totalTimeToOffice);

        if (selectedRadius) {
          allRadii.push({
            ...selectedRadius,
            centerPoint: [selectedRadius.centerPoint[0], selectedRadius.centerPoint[1]] as Coordinate,
            type: selectedRadius.type as 'connectorStopRadius' | 'otherRadius',
            geometry: selectedRadius.geometry as import('geojson').GeoJsonObject,
            color: selectedRadius.color ?? undefined,
          });
        }
      }
    }

    if (transportationMethod === 'cycle') {
      // If a specific building is selected, filter to that building only
      // If no building is selected, show all buildings for exploration
      const filteredBuildings = query.microsoftBuilding
        ? buildingPins.filter((building) => building.name === query.microsoftBuilding)
        : buildingPins;
      allPins.push(...filteredBuildings);

      // Add cycle radius based on selected time if both building and time are specified
      if (query.microsoftBuilding && query.totalTimeToOffice) {
        const selectedRadius = cycleRadii.find((radius) => radius.travelTimeMinutes === query.totalTimeToOffice);

        if (selectedRadius) {
          allRadii.push({
            ...selectedRadius,
            centerPoint: [selectedRadius.centerPoint[0], selectedRadius.centerPoint[1]] as Coordinate,
            type: selectedRadius.type as 'connectorStopRadius' | 'otherRadius',
            geometry: selectedRadius.geometry as import('geojson').GeoJsonObject,
            color: selectedRadius.color ?? undefined,
          });
        }
      }
    }

    if (transportationMethod === 'walk') {
      // If a specific building is selected, filter to that building only
      // If no building is selected, show all buildings for exploration
      const filteredBuildings = query.microsoftBuilding
        ? buildingPins.filter((building) => building.name === query.microsoftBuilding)
        : buildingPins;
      allPins.push(...filteredBuildings);

      // Add walk radius based on selected time if both building and time are specified
      if (query.microsoftBuilding && query.totalTimeToOffice) {
        const selectedRadius = walkRadii.find((radius) => radius.travelTimeMinutes === query.totalTimeToOffice);

        if (selectedRadius) {
          allRadii.push({
            ...selectedRadius,
            centerPoint: [selectedRadius.centerPoint[0], selectedRadius.centerPoint[1]] as Coordinate,
            type: selectedRadius.type as 'connectorStopRadius' | 'otherRadius',
            geometry: selectedRadius.geometry as import('geojson').GeoJsonObject,
            color: selectedRadius.color ?? undefined,
          });
        }
      }
    }

    if (transportationMethod === 'connector') {
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

      allPins.push(...filteredConnectorPins);

      // Always include the Redmond Technology Station as the endpoint when connector is selected
      const redmondTechStation = createRedmondTechStationPin();
      allPins.push(redmondTechStation);

      // Create radius data from the filtered connector stops
      const connectorRadii = filteredConnectorPins
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
                },
              ];
            }
          }
          return [];
        })
        .flat();

      allRadii.push(...connectorRadii);
    }
  }

  // Remove duplicate pins (e.g., if building was added multiple times for different transport modes)
  const uniquePins = allPins.filter((pin, index, self) => index === self.findIndex((p) => p.id === pin.id));

  return {
    pins: uniquePins,
    routes: [],
    radii: allRadii,
  };
}
