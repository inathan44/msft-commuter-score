import React from 'react';
import L from 'leaflet';
import { MapPin } from '../types/map';

// Constants for consistent styling
const COLORS = {
  pin: {
    connectorStopDefault: '#3B82F6',
    connectorStopMS: '#8B5CF6',
    microsoftBuilding: '#059669',
    other: '#6B7280',
  },
  route: {
    default: '#007bff',
    hover: '#0056b3',
  },
  radius: {
    primary: '#bf4040',
    secondary: '#4060bf',
  },
  markers: {
    routeStart: '#10B981',
    routeEnd: '#EF4f4d',
  },
};

// Create custom Leaflet icon
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

// Helper functions for pin styling
const getPinColor = (pin: MapPin): string => {
  switch (pin.type) {
    case 'connectorStop':
      return pin.isMSBuilding ? COLORS.pin.connectorStopMS : COLORS.pin.connectorStopDefault;
    case 'microsoftBuilding':
      return COLORS.pin.microsoftBuilding;
    case 'other':
      return COLORS.pin.other;
    default:
      return COLORS.pin.other;
  }
};

const getPinIconEmoji = (pin: MapPin): string => {
  switch (pin.type) {
    case 'connectorStop':
      return '🚌';
    case 'microsoftBuilding':
      return '🏢';
    case 'other':
      return '📍';
    default:
      return '📍';
  }
};

const createPinPopup = (pin: MapPin): string => {
  const baseInfo = `
    <div style="min-width: 200px;">
      <h3 style="margin: 0 0 8px 0; font-weight: bold; color: ${getPinColor(pin)};">
        ${getPinIconEmoji(pin)} ${pin.name}
      </h3>
  `;

  let specificInfo = '';
  switch (pin.type) {
    case 'connectorStop':
      specificInfo = `
        <p style="margin: 4px 0;"><strong>Type:</strong> Transit Stop</p>
        <p style="margin: 4px 0;"><strong>Description:</strong> ${pin.description}</p>
        <p style="margin: 4px 0;"><strong>Parking:</strong> ${pin.hasParking ? '✅ Available' : '❌ None'}</p>
        <p style="margin: 4px 0;"><strong>MS Building:</strong> ${pin.isMSBuilding ? '✅ Yes' : '❌ No'}</p>
      `;
      break;
    case 'microsoftBuilding':
      specificInfo = `
        <p style="margin: 4px 0;"><strong>Type:</strong> Microsoft Building</p>
        <p style="margin: 4px 0;"><strong>Building:</strong> ${pin.buildingName}</p>
      `;
      break;
    case 'other':
      specificInfo = `
        <p style="margin: 4px 0;"><strong>Type:</strong> Point of Interest</p>
      `;
      break;
  }

  const addressInfo = pin.address
    ? `
    <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0; font-size: 12px; color: #666;">
        ${pin.address.street ? pin.address.street + '<br/>' : ''}
        ${pin.address.city ? pin.address.city + ', ' : ''}
        ${pin.address.state ? pin.address.state + ' ' : ''}
        ${pin.address.zip || ''}
      </p>
    </div>
  `
    : '';

  return baseInfo + specificInfo + addressInfo + '</div>';
};

// Route styling helper
const getRouteStyle = () => ({
  default: {
    color: COLORS.route.default,
    weight: 4,
    opacity: 0.8,
  },
  hover: {
    color: COLORS.route.hover,
    weight: 6,
    opacity: 1.0,
  },
});

// Route popup helper
const createRoutePopup = (feature?: { properties?: { name?: string } }): string => {
  return `
    <div>
      <h3 style="margin: 0 0 8px 0; font-weight: bold;">Route Information</h3>
      <p style="margin: 4px 0;"><strong>Route:</strong> ${feature?.properties?.name || 'Driving Route'}</p>
      <p style="margin: 4px 0;"><strong>Type:</strong> Driving</p>
      <p style="margin: 4px 0;"><strong>Distance:</strong> ~5.5km</p>
      <p style="margin: 4px 0;"><strong>Est. Time:</strong> 8-10 minutes</p>
      <p style="margin: 4px 0; font-size: 12px; color: #666;">Click anywhere on the route for details</p>
    </div>
  `;
};

// Radius styling helper
const getRadiusStyle = (color: string) => ({
  color,
  fillColor: color,
  fillOpacity: 0.33,
  weight: 2,
});

// Radius popup helper
const createRadiusPopup = (address: string, travelTimeMinutes: number, transportMode: string): string => {
  return `
    <div>
      <strong>${address}</strong><br/>
      <em>${travelTimeMinutes} minute driving radius</em><br/>
      Transport: ${transportMode}
    </div>
  `;
};

// Route start/end marker helpers
const createRouteStartIcon = () => createCustomIcon(COLORS.markers.routeStart, '🚗');
const createRouteEndIcon = () => createCustomIcon(COLORS.markers.routeEnd, '🏁');

// Main hook for all map styling - this is what the Map component will use
export const useMapStyles = () => {
  // Pin-specific functions
  const getPinIcon = (pin: MapPin): L.DivIcon => {
    return createCustomIcon(getPinColor(pin), getPinIconEmoji(pin));
  };

  const getPinPopupContent = (pin: MapPin) => {
    return createPinPopup(pin);
  };

  // Route functions
  const getRouteStyles = () => getRouteStyle();

  const getRoutePopupContent = (feature?: { properties?: { name?: string } }) => createRoutePopup(feature);

  // Radius functions
  const getRadiusStyles = (color: string) => getRadiusStyle(color);

  const getRadiusPopupContent = (address: string, travelTimeMinutes: number, transportMode: string) =>
    createRadiusPopup(address, travelTimeMinutes, transportMode);

  const getRadiusIcon = (color: string) => createCustomIcon(color, '⭕');

  // Route marker functions
  const getRouteStartIcon = () => createRouteStartIcon();
  const getRouteEndIcon = () => createRouteEndIcon();

  // Color constants
  const getColors = () => COLORS;

  return {
    // Pin functions
    getPinIcon,
    getPinPopupContent,

    // Route functions
    getRouteStyles,
    getRoutePopupContent,

    // Radius functions
    getRadiusStyles,
    getRadiusPopupContent,
    getRadiusIcon,

    // Route marker functions
    getRouteStartIcon,
    getRouteEndIcon,

    // Colors
    getColors,
  };
};

// Legacy hook for backward compatibility
export const usePinStyles = () => {
  const { getPinIcon, getPinPopupContent } = useMapStyles();
  return {
    getIcon: getPinIcon,
    getPopupContent: getPinPopupContent,
  };
};

// Individual pin components for React rendering (not used for Leaflet map)
const ConnectorStopPinComponent: React.FC<{ pin: Extract<MapPin, { type: 'connectorStop' }> }> = ({ pin }) => (
  <div className='bg-blue-500 text-white p-3 rounded-lg shadow-lg min-w-48'>
    <div className='flex items-center gap-2 mb-2'>
      <span className='text-lg'>🚌</span>
      <h3 className='font-semibold'>{pin.name}</h3>
    </div>
    <p className='text-sm mb-2'>{pin.description}</p>
    <div className='space-y-1 text-xs'>
      <div className='flex justify-between'>
        <span>Parking:</span>
        <span>{pin.hasParking ? '✅ Available' : '❌ None'}</span>
      </div>
      <div className='flex justify-between'>
        <span>MS Building:</span>
        <span>{pin.isMSBuilding ? '✅ Yes' : '❌ No'}</span>
      </div>
      {pin.address && (
        <div className='mt-2 pt-2 border-t border-blue-400'>
          <p className='text-xs'>
            {pin.address.street && pin.address.street + ', '}
            {pin.address.city && pin.address.city + ', '}
            {pin.address.state && pin.address.state + ' '}
            {pin.address.zip}
          </p>
        </div>
      )}
    </div>
  </div>
);

const MicrosoftBuildingPinComponent: React.FC<{ pin: Extract<MapPin, { type: 'microsoftBuilding' }> }> = ({ pin }) => (
  <div className='bg-green-600 text-white p-3 rounded-lg shadow-lg min-w-48'>
    <div className='flex items-center gap-2 mb-2'>
      <span className='text-lg'>🏢</span>
      <h3 className='font-semibold'>{pin.name}</h3>
    </div>
    <div className='space-y-1 text-sm'>
      <div className='flex justify-between'>
        <span>Building:</span>
        <span className='font-mono'>{pin.buildingName}</span>
      </div>
      {pin.address && (
        <div className='mt-2 pt-2 border-t border-green-400'>
          <p className='text-xs'>
            {pin.address.street && pin.address.street + ', '}
            {pin.address.city && pin.address.city + ', '}
            {pin.address.state && pin.address.state + ' '}
            {pin.address.zip}
          </p>
        </div>
      )}
    </div>
  </div>
);

const OtherPinComponent: React.FC<{ pin: Extract<MapPin, { type: 'other' }> }> = ({ pin }) => (
  <div className='bg-gray-500 text-white p-3 rounded-lg shadow-lg min-w-48'>
    <div className='flex items-center gap-2 mb-2'>
      <span className='text-lg'>📍</span>
      <h3 className='font-semibold'>{pin.name}</h3>
    </div>
    {pin.address && (
      <div className='mt-2'>
        <p className='text-xs'>
          {pin.address.street && pin.address.street + ', '}
          {pin.address.city && pin.address.city + ', '}
          {pin.address.state && pin.address.state + ' '}
          {pin.address.zip}
        </p>
      </div>
    )}
  </div>
);

// Factory component that renders the appropriate pin component based on type
export const PinRenderer: React.FC<{ pin: MapPin }> = ({ pin }) => {
  switch (pin.type) {
    case 'connectorStop':
      return <ConnectorStopPinComponent pin={pin} />;
    case 'microsoftBuilding':
      return <MicrosoftBuildingPinComponent pin={pin} />;
    case 'other':
      return <OtherPinComponent pin={pin} />;
    default:
      return null;
  }
};
