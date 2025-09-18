'use client';

import { useState } from 'react';
import { ConnectorRoute } from '@/types/map';
import { getAllConnectorRoutes, getRoutesForStops } from '@/app/helpers/routeHelpers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Bus, MapPin } from 'lucide-react';

interface ScheduleDisplayProps {
  stopIds?: string[]; // Optional filter by specific stops
  className?: string;
}

interface RouteScheduleDisplay {
  routeId: string;
  routeName: string;
  schedules: Array<{
    stopName: string;
    departureTime: string;
    arrivalTime: string;
    isPickUp: boolean;
    isDropOff: boolean;
  }>;
}

function formatTimeOnly(isoDateTime: string): string {
  const date = new Date(isoDateTime);
  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function groupSchedulesByRoute(routes: ConnectorRoute[]): RouteScheduleDisplay[] {
  const routeSchedules: RouteScheduleDisplay[] = [];

  routes.forEach((route) => {
    // Get the first trip's schedules (assuming schedules are consistent across trips)
    if (route.trips.length > 0) {
      const firstTrip = route.trips[0];

      const schedules = firstTrip.routeSchedules.map((schedule) => ({
        stopName: schedule.name,
        departureTime: formatTimeOnly(schedule.departureTime),
        arrivalTime: formatTimeOnly(schedule.arrivalTime),
        isPickUp: schedule.isPickUp,
        isDropOff: schedule.isDropOff,
      }));

      routeSchedules.push({
        routeId: route.routeId,
        routeName: route.routeName,
        schedules,
      });
    }
  });

  return routeSchedules;
}

export default function ScheduleDisplay({ stopIds, className = '' }: ScheduleDisplayProps) {
  const [selectedRoute, setSelectedRoute] = useState<string>('all');

  // Get routes - either filtered by stops or all routes
  const allRoutes = stopIds && stopIds.length > 0 ? getRoutesForStops(stopIds) : getAllConnectorRoutes();

  const routeSchedules = groupSchedulesByRoute(allRoutes);

  // Filter by selected route if not 'all'
  const displaySchedules =
    selectedRoute === 'all' ? routeSchedules : routeSchedules.filter((rs) => rs.routeId === selectedRoute);

  if (routeSchedules.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Clock className='h-5 w-5' />
            Schedule Information
          </CardTitle>
          <CardDescription>No schedule data available for the selected area.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Clock className='h-5 w-5' />
          Microsoft Connector Schedules
        </CardTitle>
        <CardDescription>
          Departure and arrival times for connector routes
          {stopIds && stopIds.length > 0 && ' in the selected area'}
        </CardDescription>

        {/* Route Filter */}
        <div className='flex items-center gap-2 mt-2'>
          <label className='text-sm font-medium'>Route:</label>
          <Select value={selectedRoute} onValueChange={setSelectedRoute}>
            <SelectTrigger className='w-[300px]'>
              <SelectValue placeholder='Select a route' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Routes ({routeSchedules.length})</SelectItem>
              {routeSchedules.map((rs) => (
                <SelectItem key={rs.routeId} value={rs.routeId}>
                  {rs.routeName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        <div className='space-y-6'>
          {displaySchedules.map((routeSchedule) => (
            <div key={routeSchedule.routeId} className='border-b border-gray-200 last:border-b-0 pb-4 last:pb-0'>
              {/* Route Header */}
              <div className='flex items-center gap-2 mb-3'>
                <Bus className='h-4 w-4 text-blue-600' />
                <h3 className='font-semibold text-lg text-gray-900'>{routeSchedule.routeName}</h3>
              </div>

              {/* Schedule Table */}
              <div className='overflow-x-auto'>
                <table className='w-full text-sm'>
                  <thead>
                    <tr className='border-b border-gray-200'>
                      <th className='text-left py-2 pr-4 font-medium text-gray-700'>Stop</th>
                      <th className='text-left py-2 pr-4 font-medium text-gray-700'>Arrival</th>
                      <th className='text-left py-2 pr-4 font-medium text-gray-700'>Departure</th>
                      <th className='text-left py-2 font-medium text-gray-700'>Service</th>
                    </tr>
                  </thead>
                  <tbody>
                    {routeSchedule.schedules.map((schedule, index) => (
                      <tr key={index} className='border-b border-gray-100 last:border-b-0'>
                        <td className='py-2 pr-4'>
                          <div className='flex items-center gap-2'>
                            <MapPin className='h-3 w-3 text-gray-400' />
                            <span className='text-gray-900'>{schedule.stopName}</span>
                          </div>
                        </td>
                        <td className='py-2 pr-4 text-gray-700 font-mono'>{schedule.arrivalTime}</td>
                        <td className='py-2 pr-4 text-gray-700 font-mono'>{schedule.departureTime}</td>
                        <td className='py-2'>
                          <div className='flex gap-1'>
                            {schedule.isPickUp && (
                              <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700'>
                                Pick Up
                              </span>
                            )}
                            {schedule.isDropOff && (
                              <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700'>
                                Drop Off
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        {routeSchedules.length > 5 && selectedRoute === 'all' && (
          <div className='mt-4 p-3 bg-blue-50 rounded-md'>
            <p className='text-sm text-blue-700'>
              💡 <strong>Tip:</strong> Use the route filter above to view specific schedules. Showing{' '}
              {displaySchedules.length} of {routeSchedules.length} available routes.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
