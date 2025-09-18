import L from 'leaflet';
import { MapPin } from '@/types/map';
import { getStopScheduleSummary, formatDepartureTime } from './routeHelpers';

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
    // Check if it's a Microsoft building with a logo
    if (pin.type === 'microsoftBuilding' && 'logo' in pin && pin.logo) {
      return `<img src="${pin.logo}" alt="Microsoft" style="width: 16px; height: 16px;" />`;
    }

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
    emoji = pin.isMSBuilding
      ? `<img src="/microsoft-logo.svg" alt="Microsoft" style="width: 20px; height: 20px; vertical-align: middle;" />`
      : '🚌';
  } else if (pin.type === 'microsoftBuilding') {
    color = '#059669';
    // Check if this Microsoft building has a logo
    if ('logo' in pin && pin.logo) {
      emoji = `<img src="${pin.logo}" alt="Microsoft" style="width: 20px; height: 20px; vertical-align: middle;" />`;
    } else {
      emoji = '🏢';
    }
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

      // Get schedule information for this connector stop
      let scheduleInfo = '';
      try {
        const schedule = getStopScheduleSummary(pin.id);

        if (schedule.routeCount > 0) {
          scheduleInfo = `
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 4px 0; font-weight: bold; color: #3B82F6;">📅 Schedule Information</p>
              <p style="margin: 4px 0; font-size: 12px;"><strong>Routes:</strong> ${schedule.routeCount} route${
            schedule.routeCount > 1 ? 's' : ''
          }</p>
              <p style="margin: 4px 0; font-size: 12px;">${schedule.routeNames
                .map((name) => `• ${name}`)
                .join('<br/>')}</p>
              
              ${
                schedule.nextDeparture
                  ? `
                <div style="margin-top: 6px; padding: 4px 8px; background-color: #eff6ff; border-radius: 4px; border-left: 3px solid #3B82F6;">
                  <p style="margin: 0; font-size: 12px; font-weight: bold;">Next Departure:</p>
                  <p style="margin: 2px 0 0 0; font-size: 11px;">${schedule.nextDeparture.routeName}</p>
                  <p style="margin: 2px 0 0 0; font-size: 11px; color: #3B82F6;">${formatDepartureTime(
                    schedule.nextDeparture.departureTime
                  )}</p>
                </div>
              `
                  : `
                <p style="margin: 4px 0; font-size: 12px; color: #666;">No upcoming departures today</p>
              `
              }
              
              ${
                schedule.upcomingDepartures.length > 1
                  ? `
                <details style="margin-top: 6px; font-size: 12px;">
                  <summary style="cursor: pointer; color: #3B82F6;">View more departures</summary>
                  <div style="margin-top: 4px;">
                    ${schedule.upcomingDepartures
                      .slice(1)
                      .map(
                        (dep) => `
                      <p style="margin: 2px 0; font-size: 11px;">
                        ${dep.routeName} - ${formatDepartureTime(dep.departureTime)}
                      </p>
                    `
                      )
                      .join('')}
                  </div>
                </details>
              `
                  : ''
              }
            </div>
          `;
        } else {
          scheduleInfo = `
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 4px 0; font-size: 12px; color: #666;">No schedule data available</p>
            </div>
          `;
        }
      } catch (error) {
        console.warn('Error fetching schedule for stop:', pin.id, error);
        scheduleInfo = '';
      }

      specificInfo = `
        <p style="margin: 4px 0;"><strong>Type:</strong> Connector Stop</p>
        <p style="margin: 4px 0;"><strong>Description:</strong> ${pin.description}</p>
        <p style="margin: 4px 0;"><strong>Parking:</strong> ${parkingStatus}</p>
        ${
          pin.commuteTimeToOfficeMinutes
            ? `
          <div style="margin-top: 6px; padding: 4px 8px; background-color: #f0f9ff; border-radius: 4px; border-left: 3px solid #0ea5e9;">
            <p style="margin: 0; font-size: 12px; font-weight: bold; color: #0ea5e9;">🏢 Commute to Office</p>
            <p style="margin: 2px 0 0 0; font-size: 12px; color: #0369a1;">${pin.commuteTimeToOfficeMinutes} minutes via Microsoft Connector</p>
          </div>
        `
            : ''
        }
        ${scheduleInfo}
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
