'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Route, AlertCircle, CheckCircle } from 'lucide-react';
import { getRoutingFromAddresses } from '@/app/helpers/routingApi';
import { AddressAutocomplete } from '@/components/AddressAutocomplete';
import { type TransportMode, type RoutingMapData } from '@/lib/routing-schema';
import { getMicrosoftBuildingOptions } from '@/app/helpers/search';
import { microsoftBuildings } from '@/app/data/microsoftBuildings';
import {
  normalizeRoutingResponse,
  type GeoapifyRoutingResponse,
  convertToMapData,
  getRouteCenter,
  calculateZoomLevel,
} from '@/lib/routing-data-normalizer';
import { MapData } from '@/types/map';

// Dynamically import Map component to prevent SSR issues
const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className='w-full h-full bg-gray-100 rounded-lg flex items-center justify-center'>Loading map...</div>
  ),
});

export default function PlaygroundPage() {
  const [startAddress, setStartAddress] = useState('123 Capitol Hill, Seattle, WA');
  const [endAddress, setEndAddress] = useState('BUILDING 17');
  const [startCoords, setStartCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [endCoords, setEndCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [mode, setMode] = useState<TransportMode>('drive');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeoapifyRoutingResponse | null>(null);
  const [normalizedData, setNormalizedData] = useState<RoutingMapData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [geocodedAddresses, setGeocodedAddresses] = useState<
    Array<{ address: string; lat: number; lng: number; formatted: string }>
  >([]);
  const [mapData, setMapData] = useState<MapData | null>(null);

  // Helper function to get Microsoft building coordinates
  const getMicrosoftBuildingCoords = (buildingName: string): { lat: number; lng: number } | null => {
    const building = microsoftBuildings.find((b) => b.name === buildingName);
    if (building) {
      return { lat: building.coordinates[1], lng: building.coordinates[0] };
    }
    return null;
  };
  const presets = {
    'Capitol Hill to Redmond': {
      start: '123 Capitol Hill, Seattle, WA',
      end: 'One Microsoft Way, Redmond, WA',
    },
    'Brussels to Namur': {
      start: 'Brussels, Belgium',
      end: 'Namur, Belgium',
    },
    'Seattle to Bellevue': {
      start: 'Seattle, WA',
      end: 'Bellevue, WA',
    },
    'Downtown Seattle to UW': {
      start: 'Pike Place Market, Seattle, WA',
      end: 'University of Washington, Seattle, WA',
    },
  };

  const loadPreset = (presetName: keyof typeof presets) => {
    const preset = presets[presetName];
    setStartAddress(preset.start);
    setEndAddress(preset.end);
    // Reset coordinates when loading preset
    setStartCoords(null);
    setEndCoords(null);
  };

  const testRouting = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setGeocodedAddresses([]);
    setMapData(null);

    try {
      console.log('Getting route from addresses:', startAddress, 'to', endAddress, 'via', mode);

      let routingData: GeoapifyRoutingResponse;
      let finalGeocodedAddresses: Array<{ address: string; lat: number; lng: number; formatted: string }>;

      // Use direct coordinates if available
      const startLatLng = startCoords;
      const endLatLng = endCoords;

      if (startLatLng && endLatLng) {
        // Use the coordinates directly
        const waypoints = `${startLatLng.lat},${startLatLng.lng}|${endLatLng.lat},${endLatLng.lng}`;
        const params = new URLSearchParams({
          waypoints,
          mode,
        });

        const response = await fetch(`/api/routing?${params}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        routingData = await response.json();
        finalGeocodedAddresses = [
          { address: startAddress, lat: startLatLng.lat, lng: startLatLng.lng, formatted: startAddress },
          { address: endAddress, lat: endLatLng.lat, lng: endLatLng.lng, formatted: endAddress },
        ];

        console.log('Used cached/building coordinates');
      } else {
        // Fall back to full geocoding + routing
        const data = await getRoutingFromAddresses([startAddress, endAddress], mode);
        routingData = data.routingData;
        finalGeocodedAddresses = data.geocodedAddresses;

        console.log('Used full geocoding workflow');
      }

      setResult(routingData);
      setGeocodedAddresses(finalGeocodedAddresses);

      // Normalize the data and create map visualization
      const normalizedData = normalizeRoutingResponse(routingData, finalGeocodedAddresses, mode, 'metric');

      setNormalizedData(normalizedData);

      if (normalizedData.success) {
        const mapDataForMap = convertToMapData(normalizedData);
        setMapData(mapDataForMap);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Routing API error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='container mx-auto p-6 max-w-6xl'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold mb-2'>Routing API Playground</h1>
        <p className='text-gray-600'>Test the secure Geoapify routing API without exposing your API key</p>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Input Section */}
        <div className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <MapPin className='h-5 w-5' />
                Route Configuration
              </CardTitle>
              <CardDescription>Set your start and end points, then test the routing API</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              {/* Preset Buttons */}
              <div className='space-y-2'>
                <Label className='text-sm font-medium'>Quick Presets</Label>
                <div className='flex flex-wrap gap-2'>
                  {Object.keys(presets).map((presetName) => (
                    <Button
                      key={presetName}
                      variant='outline'
                      size='sm'
                      onClick={() => loadPreset(presetName as keyof typeof presets)}
                    >
                      {presetName}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Start Address */}
              <AddressAutocomplete
                value={startAddress}
                onChange={setStartAddress}
                onSelect={(result) => {
                  console.log('Start address selected:', result);
                  setStartAddress(result.formatted);
                  setStartCoords({ lat: result.lat, lng: result.lon });
                }}
                label='Start Address'
                placeholder='123 Capitol Hill, Seattle, WA'
              />

              {/* End Address */}
              <div className='space-y-2'>
                <Label className='text-sm font-medium'>End Address (Microsoft Building)</Label>
                <Select
                  value={endAddress}
                  onValueChange={(value: string) => {
                    setEndAddress(value);
                    // Get and set the coordinates for the Microsoft building immediately
                    const coords = getMicrosoftBuildingCoords(value);
                    if (coords) {
                      setEndCoords(coords);
                      console.log('Microsoft building coordinates set:', coords);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select Microsoft Building' />
                  </SelectTrigger>
                  <SelectContent>
                    {getMicrosoftBuildingOptions().map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Selected Coordinates Display */}
              {(startCoords || endCoords) && (
                <div className='space-y-2'>
                  <Label className='text-sm font-medium'>Selected Coordinates</Label>
                  <div className='bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm'>
                    {startCoords && (
                      <div>
                        <strong>Start:</strong> {startCoords.lat.toFixed(6)}, {startCoords.lng.toFixed(6)}
                      </div>
                    )}
                    {endCoords && (
                      <div>
                        <strong>End:</strong> {endCoords.lat.toFixed(6)}, {endCoords.lng.toFixed(6)}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Transport Mode */}
              <div className='space-y-2'>
                <Label className='text-sm font-medium'>Transport Mode</Label>
                <Select value={mode} onValueChange={(value: string) => setMode(value as typeof mode)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='drive'>🚗 Driving</SelectItem>
                    <SelectItem value='transit'>🚌 Transit</SelectItem>
                    <SelectItem value='walk'>🚶 Walking</SelectItem>
                    <SelectItem value='bike'>🚴 Biking</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Test Button */}
              <Button onClick={testRouting} disabled={loading} className='w-full' size='lg'>
                <Route className='h-4 w-4 mr-2' />
                {loading ? 'Fetching Route...' : 'Test Routing API'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        <div>
          <Card className='h-fit'>
            <CardHeader>
              <CardTitle>API Response</CardTitle>
              <CardDescription>Results from the secure routing API call</CardDescription>
            </CardHeader>
            <CardContent>
              {loading && (
                <div className='flex items-center justify-center py-8'>
                  <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
                  <span className='ml-2'>Fetching route data...</span>
                </div>
              )}

              {error && (
                <div className='flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg'>
                  <AlertCircle className='h-5 w-5 text-red-600 mt-0.5 flex-shrink-0' />
                  <div>
                    <h4 className='font-medium text-red-800'>Error</h4>
                    <p className='text-sm text-red-700 mt-1'>{error}</p>
                  </div>
                </div>
              )}

              {result && (
                <div className='space-y-4'>
                  <div className='flex items-center gap-2 text-green-700'>
                    <CheckCircle className='h-5 w-5' />
                    <span className='font-medium'>Success! Route data received</span>
                  </div>

                  {/* Geocoded Addresses */}
                  {geocodedAddresses.length > 0 && (
                    <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                      <h4 className='font-medium mb-2'>Geocoded Addresses</h4>
                      <div className='text-sm space-y-2'>
                        {geocodedAddresses.map((addr, index) => (
                          <div key={index} className='flex flex-col'>
                            <strong>{index === 0 ? 'Start:' : 'End:'}</strong>
                            <span className='text-blue-700'>{addr.formatted}</span>
                            <span className='text-gray-600 text-xs'>
                              {addr.lat.toFixed(6)}, {addr.lng.toFixed(6)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Route Summary */}
                  {result.features && result.features[0] && (
                    <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
                      <h4 className='font-medium mb-2'>Route Summary</h4>
                      <div className='text-sm space-y-1'>
                        <p>
                          <strong>Distance:</strong>{' '}
                          {result.features[0]?.properties?.distance
                            ? (result.features[0].properties.distance / 1000).toFixed(2)
                            : 'N/A'}{' '}
                          km
                        </p>
                        <p>
                          <strong>Time:</strong>{' '}
                          {result.features[0]?.properties?.time
                            ? Math.round(result.features[0].properties.time / 60)
                            : 'N/A'}{' '}
                          minutes
                        </p>
                        <p>
                          <strong>Mode:</strong> {mode}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Map Visualization */}
                  {mapData && normalizedData && (
                    <div className='border rounded-lg p-4'>
                      <h4 className='font-medium mb-2'>Route Visualization</h4>
                      <div className='h-96 rounded border overflow-hidden'>
                        <Map
                          mapData={mapData}
                          center={[getRouteCenter(normalizedData).lat, getRouteCenter(normalizedData).lng]}
                          zoom={calculateZoomLevel(normalizedData.route.properties.distance)}
                          height='100%'
                        />
                      </div>
                    </div>
                  )}

                  {/* Raw JSON Response */}
                  <details className='bg-gray-50 border rounded-lg'>
                    <summary className='p-3 cursor-pointer font-medium'>View Full JSON Response</summary>
                    <div className='p-3 border-t'>
                      <pre className='text-xs overflow-auto max-h-96 bg-white p-3 rounded border'>
                        {JSON.stringify(result, null, 2)}
                      </pre>
                    </div>
                  </details>
                </div>
              )}

              {!loading && !error && !result && (
                <div className='text-center py-8 text-gray-500'>
                  <Route className='h-12 w-12 mx-auto mb-3 opacity-50' />
                  <p>Click &ldquo;Test Routing API&rdquo; to see results here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Security & Optimization Info */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-6'>
        <Card className='border-blue-200 bg-blue-50'>
          <CardContent className='pt-6'>
            <div className='flex items-start gap-3'>
              <div className='h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5'>
                <span className='text-white text-xs font-bold'>🔒</span>
              </div>
              <div>
                <h4 className='font-medium text-blue-900'>API Key Security</h4>
                <p className='text-sm text-blue-800 mt-1'>
                  Your Geoapify API key is safely stored on the server and never exposed to the client. All requests go
                  through secure API endpoints that act as proxies.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='border-green-200 bg-green-50'>
          <CardContent className='pt-6'>
            <div className='flex items-start gap-3'>
              <div className='h-6 w-6 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0 mt-0.5'>
                <span className='text-white text-xs font-bold'>⚡</span>
              </div>
              <div>
                <h4 className='font-medium text-green-900'>API Optimization</h4>
                <p className='text-sm text-green-800 mt-1'>
                  Address autocomplete uses 500ms debouncing to minimize API calls. Selected coordinates are cached and
                  reused for routing requests.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
