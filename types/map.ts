import { GeoJsonObject } from 'geojson';

type Longitude = number;
type Latitude = number;
// Base coordinate type
export type Coordinate = [Longitude, Latitude]; // [longitude, latitude]

export type Address = {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
};

// Base pin interface
interface BaseMapPin {
  id: string;
  coordinates: Coordinate;
  name: string;
  address?: Address;
}

// Specific pin types with additional fields
export interface ConnectorStopPin extends BaseMapPin {
  type: 'connectorStop';
  description: string;
  hasParking: boolean;
  isMSBuilding: boolean;
  commuteTimeToOfficeMinutes?: number;
  radii?: MapRadius[];
}

export interface MicrosoftBuildingPin extends BaseMapPin {
  type: 'microsoftBuilding';
  buildingName: string;
  logo?: string; // Optional logo URL or path
}

interface OtherPin extends BaseMapPin {
  type: 'other';
}

// Discriminated union
export type MapPin = ConnectorStopPin | MicrosoftBuildingPin | OtherPin;

// Simple Route
export interface MapRoute {
  id: string;
  name: string;
  geometry: GeoJsonObject; // GeoJSON LineString
  color?: string;
  description?: string;
  distance?: string;
  estimatedTime?: string;
}

// Simple Radius/Area
export interface MapRadius {
  id: string;
  name: string;
  type: 'connectorStopRadius' | 'otherRadius';
  address: string;
  centerPoint: Coordinate;
  geometry: GeoJsonObject; // GeoJSON Polygon
  color?: string;
  travelTimeMinutes: number;
  transportMode: string;
}

// Route Marker types (start/end points)
export interface RouteMarker {
  id: string;
  type: 'start' | 'end';
  coordinates: Coordinate;
  label: string;
}

// Complete Map Data
export interface MapData {
  pins: MapPin[];
  routes: MapRoute[];
  radii: MapRadius[];
}

// Route Schedule Types
export interface RouteSchedule {
  arrivalTime: string; // ISO 8601 datetime string
  departureTime: string; // ISO 8601 datetime string
  isPickUp: boolean;
  isDropOff: boolean;
  stopId: string;
  name: string;
}

export interface RouteTrip {
  id: string;
  routeSchedules: RouteSchedule[];
}

export interface RouteStop {
  stopId: string;
  name: string;
}

export interface ConnectorRoute {
  routeId: string;
  routeName: string;
  date: string; // Date string in YYYY-MM-DD format
  orderedStops: RouteStop[];
  trips: RouteTrip[];
}

// Type for driving radius data
// interface DriveRadiusData {
//   id: number;
//   address: string;
//   travelTimeMinutes: number;
//   transportMode: string;
//   coordinates: [number, number];
//   boundaryGeojson: GeoJsonObject;
// }
