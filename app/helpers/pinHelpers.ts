import L from 'leaflet';
import { MapPin } from '@/types/map';

export const addPin = (pin: MapPin, map: L.Map) => {
  const [lng, lat] = pin.coordinates;
  const marker = L.marker([lat, lng]).addTo(map);
  return marker;
};

export const addPinWithStyling = (
  pin: MapPin,
  map: L.Map,
  getIcon: (pin: MapPin) => L.DivIcon,
  getPopupContent: (pin: MapPin) => string
) => {
  const [lng, lat] = pin.coordinates;

  L.marker([lat, lng], {
    icon: getIcon(pin),
  })
    .addTo(map)
    .bindPopup(getPopupContent(pin));
};

export const createPinIcon = (pin: MapPin): L.DivIcon => {
  const getPinColor = (pin: MapPin): string => {
    switch (pin.type) {
      case 'connectorStop':
        return pin.isMSBuilding ? '#8B5CF6' : '#3B82F6';
      case 'microsoftBuilding':
        return '#059669';
      case 'other':
        return '#6B7280';
      default:
        return '#6B7280';
    }
  };

  const getPinEmoji = (pin: MapPin): string => {
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

  const color = getPinColor(pin);
  const emoji = getPinEmoji(pin);

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

export const createPinPopupContent = (pin: MapPin): string => {
  let color: string;
  let emoji: string;

  if (pin.type === 'connectorStop') {
    color = pin.isMSBuilding ? '#8B5CF6' : '#3B82F6';
    emoji = '🚌';
  } else if (pin.type === 'microsoftBuilding') {
    color = '#059669';
    emoji = '🏢';
  } else {
    color = '#6B7280';
    emoji = '📍';
  }

  const baseInfo = `
    <div style="min-width: 200px;">
      <h3 style="margin: 0 0 8px 0; font-weight: bold; color: ${color};">
        ${emoji} ${pin.name}
      </h3>
  `;

  let specificInfo = '';
  switch (pin.type) {
    case 'connectorStop':
      const parkingStatus = pin.hasParking ? '✅ Available' : '❌ None';
      const msBuildingStatus = pin.isMSBuilding ? '✅ Yes' : '❌ No';

      specificInfo = `
        <p style="margin: 4px 0;"><strong>Type:</strong> Transit Stop</p>
        <p style="margin: 4px 0;"><strong>Description:</strong> ${pin.description}</p>
        <p style="margin: 4px 0;"><strong>Parking:</strong> ${parkingStatus}</p>
        <p style="margin: 4px 0;"><strong>MS Building:</strong> ${msBuildingStatus}</p>
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

  let addressInfo = '';
  if (pin.address) {
    const addressParts: string[] = [];

    if (pin.address.street) {
      addressParts.push(pin.address.street);
    }

    let cityStateZip = '';
    if (pin.address.city) {
      cityStateZip += pin.address.city;
    }
    if (pin.address.state) {
      cityStateZip += (cityStateZip ? ', ' : '') + pin.address.state;
    }
    if (pin.address.zip) {
      cityStateZip += (cityStateZip ? ' ' : '') + pin.address.zip;
    }

    if (cityStateZip) {
      addressParts.push(cityStateZip);
    }

    if (addressParts.length > 0) {
      addressInfo = `
        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; font-size: 12px; color: #666;">
            ${addressParts.join('<br/>')}
          </p>
        </div>
      `;
    }
  }

  return baseInfo + specificInfo + addressInfo + '</div>';
};

export const addPinDirect = (pin: MapPin, map: L.Map) => {
  const [lng, lat] = pin.coordinates;

  L.marker([lat, lng], {
    icon: createPinIcon(pin),
  })
    .addTo(map)
    .bindPopup(createPinPopupContent(pin));
};
