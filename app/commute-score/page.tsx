'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Home, MapPin, Clock, Car, Bike, Train, Route, AlertCircle, PersonStanding, Bus } from 'lucide-react';
import { AddressAutocomplete } from '@/components/AddressAutocomplete';
import { getMicrosoftBuildingOptions } from '@/app/helpers/search';
import { microsoftBuildings } from '@/app/data/microsoftBuildings';
import { type TransportMode } from '@/lib/routing-schema';
import { normalizeRoutingResponse, convertToMapData } from '@/lib/routing-data-normalizer';
import { MapData, MapRoute, MapPin as MapPinType } from '@/types/map';
import {
  CommuteScore,
  calculateCommuteScore,
  calculateOverallScore,
  getScoreColor,
  getScoreRingColor,
  getTransportModeName,
} from '@/app/helpers/scoreHelpers';
import {
  getNearbyConnectorPins,
  findNearbyConnectorStops,
  getNearbyConnectorSummary,
} from '@/app/helpers/locationHelpers';

// Dynamically import Map component to prevent SSR issues
const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className='w-full h-full bg-gray-100 rounded-lg flex items-center justify-center'>Loading map...</div>
  ),
});

const CircularScore = ({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' }) => {
  const radius = size === 'sm' ? 20 : size === 'lg' ? 35 : 28;
  const strokeWidth = size === 'sm' ? 3 : size === 'lg' ? 5 : 4;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDasharray = `${(score / 100) * circumference} ${circumference}`;
  const strokeColor = getScoreRingColor(score);

  const containerSize = size === 'sm' ? 'h-12 w-12' : size === 'lg' ? 'h-20 w-20' : 'h-16 w-16';
  const textSize = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-lg' : 'text-sm';

  return (
    <div className={`relative ${containerSize} flex items-center justify-center`}>
      <svg height={radius * 2} width={radius * 2} className='transform -rotate-90'>
        <circle
          stroke='#e5e7eb'
          fill='transparent'
          strokeWidth={strokeWidth}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke={strokeColor}
          fill='transparent'
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          strokeLinecap='round'
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className='transition-all duration-1000 ease-out'
        />
      </svg>
      <div
        className={`absolute inset-0 flex items-center justify-center ${textSize} font-bold ${getScoreColor(score)}`}
      >
        {score}
      </div>
    </div>
  );
};

export default function CommuteScorePage() {
  const [showResults, setShowResults] = useState(false); // Start with form
  const [homeAddress, setHomeAddress] = useState('');
  const [homeCoords, setHomeCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState('BUILDING 17');
  const [buildingCoords, setBuildingCoords] = useState<{ lat: number; lng: number } | null>(() => {
    // Initialize with Building 17 coordinates
    const building = microsoftBuildings.find((b) => b.name === 'BUILDING 17');
    return building ? { lat: building.coordinates[1], lng: building.coordinates[0] } : null;
  });

  // Transport mode selections - driving is always enabled, others are opt-in
  const [enableBiking, setEnableBiking] = useState(true);
  const [enableWalking, setEnableWalking] = useState(true);
  const [enableConnector, setEnableConnector] = useState(false);

  // Loading and results
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [commuteScores, setCommuteScores] = useState<CommuteScore[]>([]);
  const [scoringConnectorStop, setScoringConnectorStop] = useState<{
    name: string;
    walkingTimeMinutes: number;
    commuteTimeToOfficeMinutes?: number;
  } | null>(null);

  // Placeholder function for Microsoft Connector routing logic
  const getMicrosoftConnectorRoute = async (
    homeCoords: { lat: number; lng: number },
    buildingCoords: { lat: number; lng: number },
    homeAddress: string,
    selectedBuilding: string
  ): Promise<CommuteScore | null> => {
    console.log('Microsoft Connector routing called with:', {
      from: { lat: homeCoords.lat, lng: homeCoords.lng, address: homeAddress },
      to: { lat: buildingCoords.lat, lng: buildingCoords.lng, building: selectedBuilding },
    });

    // TODO: Implement Microsoft Connector routing logic here
    // This should integrate with internal Microsoft transportation systems
    // to provide actual connector route data, timing, and scoring

    return null; // Return null for now until logic is implemented
  };

  // Helper function to get Microsoft building coordinates
  const getMicrosoftBuildingCoords = (buildingName: string): { lat: number; lng: number } | null => {
    const building = microsoftBuildings.find((b) => b.name === buildingName);
    if (building) {
      return { lat: building.coordinates[1], lng: building.coordinates[0] };
    }
    return null;
  };

  const handleAnalyze = async () => {
    if (!homeAddress.trim() || !homeCoords || !buildingCoords) {
      setError('Please select both a home address and Microsoft building');
      return;
    }

    setLoading(true);
    setError(null);
    setMapData(null);

    try {
      // Collect selected transport modes
      const modes: TransportMode[] = ['drive']; // Always include driving
      if (enableBiking) modes.push('bike');
      if (enableWalking) modes.push('walk');

      console.log('Getting routes for modes:', modes);

      // Get routes for each enabled mode via Geoapify API
      const allResults = [];
      for (const mode of modes) {
        const waypoints = `${homeCoords.lat},${homeCoords.lng}|${buildingCoords.lat},${buildingCoords.lng}`;
        const params = new URLSearchParams({
          waypoints,
          mode,
        });

        const response = await fetch(`/api/routing?${params}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const routingData = await response.json();
        allResults.push({ mode, data: routingData });
      }

      // Handle Microsoft Connector routing separately if enabled
      if (enableConnector) {
        console.log('Microsoft Connector is enabled, calling connector routing...');
        const connectorRoute = await getMicrosoftConnectorRoute(
          homeCoords,
          buildingCoords,
          homeAddress,
          selectedBuilding
        );
        // If connector route is implemented, it would be added to results here
        if (connectorRoute) {
          // This will be used when connector logic is implemented
          console.log('Microsoft Connector route result:', connectorRoute);
        } else {
          console.log('Microsoft Connector function returned null (expected until implemented)');
        }
      } else {
        console.log('Microsoft Connector is disabled');
      }

      // Create map data from all results
      if (allResults.length > 0) {
        const allRoutes: MapRoute[] = [];
        const scores: CommuteScore[] = [];

        const pins: MapPinType[] = [
          {
            id: 'start',
            type: 'other',
            coordinates: [homeCoords.lng, homeCoords.lat],
            name: 'Home',
            address: { street: homeAddress },
          },
          {
            id: 'end',
            type: 'microsoftBuilding',
            coordinates: [buildingCoords.lng, buildingCoords.lat],
            name: selectedBuilding,
            buildingName: selectedBuilding,
          },
        ];

        // Add nearby Connector stops to the map only if connector is enabled
        if (enableConnector) {
          const nearbyConnectorStops = getNearbyConnectorPins(homeCoords.lat, homeCoords.lng, 3, 8); // 3km radius, up to 8 stops
          pins.push(...nearbyConnectorStops);
        }

        // Process each route result and add to allRoutes
        allResults.forEach((result) => {
          console.log(`Processing route for mode: ${result.mode}`);
          const normalizedData = normalizeRoutingResponse(
            result.data,
            [
              { address: homeAddress, lat: homeCoords.lat, lng: homeCoords.lng, formatted: homeAddress },
              {
                address: selectedBuilding,
                lat: buildingCoords.lat,
                lng: buildingCoords.lng,
                formatted: selectedBuilding,
              },
            ],
            result.mode,
            'metric'
          );

          if (normalizedData.success && normalizedData.route) {
            const mapDataForRoute = convertToMapData(normalizedData);
            console.log(`Routes for ${result.mode}:`, mapDataForRoute.routes);
            // Add all routes from this mode to our collection
            allRoutes.push(...mapDataForRoute.routes);

            // Calculate score for this route
            const route = normalizedData.route;
            const score = calculateCommuteScore(route.properties.time, route.properties.distance, result.mode);

            scores.push({
              mode: result.mode,
              time: route.properties.time,
              distance: route.properties.distance,
              timeFormatted: route.properties.timeFormatted,
              distanceFormatted: route.properties.distanceFormatted,
              score,
            });
          } else {
            console.error(`Failed to normalize route data for ${result.mode}:`, normalizedData);
          }
        });

        // Add Microsoft Connector score if enabled
        if (enableConnector) {
          const nearbyConnectorStops = findNearbyConnectorStops(homeCoords.lat, homeCoords.lng, 2, 5); // 2km radius, up to 5 stops

          if (nearbyConnectorStops.length > 0) {
            // Find the closest connector stop (first one in the sorted array)
            const closestStop = nearbyConnectorStops[0];

            // Calculate walking time based on distance (average walking speed: 5 km/h)
            const walkingTimeMinutes = Math.round((closestStop.distanceKm / 5) * 60);

            // Store the connector stop used for scoring
            setScoringConnectorStop({
              name: closestStop.name,
              walkingTimeMinutes: walkingTimeMinutes,
              commuteTimeToOfficeMinutes: closestStop.commuteTimeToOfficeMinutes,
            });

            // Calculate total commute time: walking time to stop + connector ride time
            const connectorRideMinutes = closestStop.commuteTimeToOfficeMinutes || 30; // Default 30 min if not specified
            const totalTimeMinutes = walkingTimeMinutes + connectorRideMinutes;
            const totalTimeSeconds = totalTimeMinutes * 60;

            // Estimate distance (walking distance to stop + approximate connector route distance)
            const walkingDistanceMeters = closestStop.distanceKm * 1000;
            const connectorDistanceMeters = connectorRideMinutes * 500; // Assume 30 km/h average speed = 500m/min
            const totalDistanceMeters = walkingDistanceMeters + connectorDistanceMeters;

            // Calculate connector score
            const connectorScore = calculateCommuteScore(totalTimeSeconds, totalDistanceMeters, 'transit');

            scores.push({
              mode: 'transit' as const,
              time: totalTimeSeconds,
              distance: totalDistanceMeters,
              timeFormatted: `${totalTimeMinutes} min`,
              distanceFormatted: `${(totalDistanceMeters / 1000).toFixed(1)} km`,
              score: connectorScore,
            });

            console.log('Added connector score:', {
              stopName: closestStop.name,
              walkingTime: walkingTimeMinutes,
              connectorTime: connectorRideMinutes,
              totalTime: totalTimeMinutes,
              score: connectorScore,
            });
          } else {
            setScoringConnectorStop(null);
          }
        } else {
          setScoringConnectorStop(null);
        }

        // Store the scores
        setCommuteScores(scores);

        const combinedMapData: MapData = {
          pins,
          routes: allRoutes,
          radii: [],
        };

        console.log('Combined map data with all routes:', combinedMapData);
        console.log('Total routes:', allRoutes.length);
        setMapData(combinedMapData);
      }

      setShowResults(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Routing API error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (showResults) {
    return (
      <div className='min-h-screen bg-gray-50'>
        <div className='container mx-auto px-4 py-8'>
          {/* Header */}
          <div className='mb-8'>
            <div className='flex items-center justify-between mb-4'>
              <div>
                <h1 className='text-3xl font-bold text-gray-900'>Your Commute Analysis</h1>
                <p className='text-gray-600 mt-1'>
                  From: {homeAddress} → To: {selectedBuilding}
                </p>
              </div>
              <Button onClick={() => setShowResults(false)}>New Analysis</Button>
            </div>
          </div>

          <div className='grid grid-cols-1 xl:grid-cols-3 gap-8'>
            {/* Map Section */}
            <div className='xl:col-span-2'>
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center'>
                    <Route className='h-5 w-5 mr-2' />
                    Route Overview
                  </CardTitle>
                  <CardDescription>
                    {mapData ? 'Interactive map showing your route' : 'Route visualization will appear here'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='h-96 rounded-lg overflow-hidden'>
                    {mapData && homeCoords && buildingCoords ? (
                      <Map
                        center={[(homeCoords.lat + buildingCoords.lat) / 2, (homeCoords.lng + buildingCoords.lng) / 2]}
                        zoom={11}
                        height='100%'
                        className='w-full h-full'
                        mapData={mapData}
                      />
                    ) : (
                      <div className='w-full h-full bg-gray-100 rounded-lg flex items-center justify-center'>
                        <div className='text-center text-gray-500'>
                          <Route className='h-12 w-12 mx-auto mb-3 opacity-50' />
                          <p>Route map will appear here after analysis</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className='mt-4 flex flex-wrap gap-2'>
                    <div className='flex items-center space-x-2'>
                      <div className='w-3 h-3 rounded' style={{ backgroundColor: '#10b981' }}></div>
                      <span className='text-sm'>Driving Routes</span>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <div className='w-3 h-3 rounded' style={{ backgroundColor: '#3b82f6' }}></div>
                      <span className='text-sm'>Transit/Connector</span>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <div className='w-3 h-3 rounded' style={{ backgroundColor: '#f59e0b' }}></div>
                      <span className='text-sm'>Bike Routes</span>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <div className='w-3 h-3 rounded' style={{ backgroundColor: '#8b5cf6' }}></div>
                      <span className='text-sm'>Walking Routes</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Score Section */}
            <div className='space-y-6'>
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center'>
                    <Clock className='h-5 w-5 mr-2' />
                    Commute Scores
                  </CardTitle>
                  <CardDescription>Analysis based on time, distance, and transport mode</CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                  {commuteScores.length > 0 ? (
                    <>
                      {commuteScores
                        .sort((a, b) => b.score - a.score) // Sort by score, highest first
                        .map((scoreData) => (
                          <div
                            key={scoreData.mode}
                            className='flex items-center justify-between p-3 rounded-lg bg-gray-50'
                          >
                            <div className='flex items-center space-x-3'>
                              <div className='flex items-center space-x-2'>
                                {scoreData.mode === 'drive' && <Car className='h-5 w-5' style={{ color: '#10b981' }} />}
                                {scoreData.mode === 'bike' && <Bike className='h-5 w-5' style={{ color: '#f59e0b' }} />}
                                {scoreData.mode === 'walk' && (
                                  <PersonStanding className='h-5 w-5' style={{ color: '#8b5cf6' }} />
                                )}
                                {scoreData.mode === 'transit' && (
                                  <Train className='h-5 w-5' style={{ color: '#3b82f6' }} />
                                )}
                                <div>
                                  <h4 className='font-semibold text-sm capitalize'>
                                    {getTransportModeName(scoreData.mode)}
                                  </h4>
                                  <p className='text-xs text-gray-600'>
                                    {scoreData.timeFormatted} • {scoreData.distanceFormatted}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <CircularScore score={scoreData.score} size='md' />
                          </div>
                        ))}

                      {/* Overall Combined Score */}
                      {commuteScores.length > 0 && (
                        <div className='mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg'>
                          <div className='flex items-center justify-between'>
                            <div>
                              <h3 className='font-semibold text-blue-900'>Overall Commute Score</h3>
                              <p className='text-sm text-blue-700'>
                                Combined score from all {commuteScores.length} transport option
                                {commuteScores.length !== 1 ? 's' : ''}
                              </p>
                            </div>
                            <CircularScore score={calculateOverallScore(commuteScores)} size='lg' />
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className='text-center py-8 text-gray-500'>
                      <Clock className='h-12 w-12 mx-auto mb-3 opacity-50' />
                      <p>Commute scores will appear here after analysis</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Nearby Connector Stops Card */}
              {homeCoords && (
                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center'>
                      <Bus className='h-5 w-5 mr-2' />
                      Nearby Microsoft Connector
                    </CardTitle>
                    <CardDescription>Microsoft shuttle stops within 3km of your location</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const summary = getNearbyConnectorSummary(homeCoords.lat, homeCoords.lng, 3);
                      if (summary.count === 0) {
                        return (
                          <div className='text-center py-6 text-gray-500'>
                            <Bus className='h-8 w-8 mx-auto mb-2 opacity-50' />
                            <p className='text-sm'>No Microsoft Connector stops within 3km</p>
                            <p className='text-xs text-gray-400 mt-1'>Consider driving or other transport options</p>
                          </div>
                        );
                      }

                      return (
                        <div className='space-y-3'>
                          <div className='bg-green-50 border border-green-200 rounded-lg p-3'>
                            <div className='flex items-center gap-2 mb-1'>
                              <Bus className='h-4 w-4 text-green-600' />
                              <span className='text-sm font-medium text-green-900'>
                                {summary.count} Connector stop{summary.count !== 1 ? 's' : ''} found
                              </span>
                            </div>
                            <p className='text-xs text-green-700'>
                              Closest: {summary.closestStopName} ({summary.closestDistance})
                            </p>
                            {summary.hasWalkableStops && (
                              <p className='text-xs text-green-600 mt-1 font-medium'>
                                ✓ Walking distance options available
                              </p>
                            )}
                          </div>

                          {/* Show which stop was used for scoring if connector is enabled */}
                          {enableConnector && scoringConnectorStop && (
                            <div className='bg-blue-50 border border-blue-200 rounded-lg p-3'>
                              <div className='flex items-center gap-2 mb-1'>
                                <Bus className='h-4 w-4 text-blue-600' />
                                <span className='text-sm font-medium text-blue-900'>Used for Commute Score</span>
                              </div>
                              <p className='text-xs text-blue-700'>
                                <strong>{scoringConnectorStop.name}</strong>
                              </p>
                              <p className='text-xs text-blue-600 mt-1'>
                                {scoringConnectorStop.walkingTimeMinutes} min walk +{' '}
                                {scoringConnectorStop.commuteTimeToOfficeMinutes || 30} min ride
                              </p>
                            </div>
                          )}

                          <div className='text-xs text-gray-600'>
                            <p>
                              🗺️ <strong>Map pins:</strong> Blue shuttle icons show nearby connector stops
                            </p>
                            <p>
                              🚌 <strong>Tip:</strong> Click pins for stop details and walking distance
                            </p>
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100'>
      <div className='container mx-auto px-4 py-8'>
        {/* Header Section */}
        <div className='text-center mb-8'>
          <div className='flex items-center justify-center mb-4'>
            <Home className='h-8 w-8 text-blue-600 mr-2' />
            <h1 className='text-4xl font-bold text-gray-900'>Commute Score Analyzer</h1>
          </div>
          <p className='text-xl text-gray-600 max-w-2xl mx-auto'>
            Get a comprehensive analysis of your commute from your home address to all Microsoft offices
          </p>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
          {/* Input Section */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center'>
                <MapPin className='h-5 w-5 mr-2' />
                Your Commute Details
              </CardTitle>
              <CardDescription>Enter your home address and select your Microsoft office destination</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              {/* Home Address */}
              <AddressAutocomplete
                value={homeAddress}
                onChange={setHomeAddress}
                onSelect={(result) => {
                  setHomeAddress(result.formatted);
                  setHomeCoords({ lat: result.lat, lng: result.lon });
                  console.log('Home address selected:', result);
                }}
                label='Home Address'
                placeholder='123 Capitol Hill, Seattle, WA'
              />

              {/* Microsoft Building Selection */}
              <div className='space-y-2'>
                <Label className='text-sm font-medium'>Microsoft Office</Label>
                <Select
                  value={selectedBuilding}
                  onValueChange={(value: string) => {
                    setSelectedBuilding(value);
                    const coords = getMicrosoftBuildingCoords(value);
                    if (coords) {
                      setBuildingCoords(coords);
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

              {/* Transport Mode Options */}
              <div className='space-y-3'>
                <Label className='text-sm font-medium'>Transport Options</Label>
                <div className='bg-blue-50 border border-blue-200 rounded-lg p-3'>
                  <div className='flex items-center gap-2 mb-2'>
                    <Car className='h-4 w-4 text-blue-600' />
                    <span className='text-sm font-medium text-blue-900'>Driving (Always included)</span>
                  </div>
                  <p className='text-xs text-blue-700'>Primary commute analysis via car</p>
                </div>

                <div className='space-y-2'>
                  <div className='flex items-center space-x-2'>
                    <Checkbox
                      id='biking'
                      checked={enableBiking}
                      onCheckedChange={(checked) => setEnableBiking(checked === true)}
                    />
                    <label htmlFor='biking' className='text-sm flex items-center gap-2'>
                      <Bike className='h-4 w-4' />
                      Include biking analysis
                    </label>
                  </div>

                  <div className='flex items-center space-x-2'>
                    <Checkbox
                      id='walking'
                      checked={enableWalking}
                      onCheckedChange={(checked) => setEnableWalking(checked === true)}
                    />
                    <label htmlFor='walking' className='text-sm flex items-center gap-2'>
                      <Route className='h-4 w-4' />
                      Include walking analysis
                    </label>
                  </div>

                  <div className='flex items-center space-x-2'>
                    <Checkbox
                      id='connector'
                      checked={enableConnector}
                      onCheckedChange={(checked) => setEnableConnector(checked === true)}
                    />
                    <label htmlFor='connector' className='text-sm flex items-center gap-2'>
                      <Train className='h-4 w-4' />
                      Include Microsoft Connector analysis
                    </label>
                  </div>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className='flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg'>
                  <AlertCircle className='h-5 w-5 text-red-600 mt-0.5 flex-shrink-0' />
                  <div>
                    <h4 className='font-medium text-red-800'>Error</h4>
                    <p className='text-sm text-red-700 mt-1'>{error}</p>
                  </div>
                </div>
              )}

              <Button
                className='w-full'
                size='lg'
                onClick={handleAnalyze}
                disabled={!homeAddress.trim() || !homeCoords || !buildingCoords || loading}
              >
                {loading ? 'Analyzing Routes...' : 'Analyze My Commute'}
              </Button>
            </CardContent>
          </Card>

          {/* Preview Section */}
          <Card>
            <CardHeader>
              <CardTitle>What You&apos;ll Get</CardTitle>
              <CardDescription>
                Comprehensive commute analysis with intelligent scoring and visualization
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-start space-x-3'>
                <Clock className='h-5 w-5 text-blue-600 mt-0.5' />
                <div>
                  <h4 className='font-semibold'>Multi-Modal Travel Analysis</h4>
                  <p className='text-sm text-gray-600'>
                    Detailed timing for driving, biking, walking, and Microsoft Connector shuttle
                  </p>
                </div>
              </div>
              <div className='flex items-start space-x-3'>
                <div className='h-5 w-5 bg-gradient-to-r from-green-400 to-blue-500 rounded mt-0.5' />
                <div>
                  <h4 className='font-semibold'>Intelligent Scoring System</h4>
                  <p className='text-sm text-gray-600'>
                    Weighted 0-100 scores combining all transport options for comprehensive assessment
                  </p>
                </div>
              </div>
              <div className='flex items-start space-x-3'>
                <MapPin className='h-5 w-5 text-purple-600 mt-0.5' />
                <div>
                  <h4 className='font-semibold'>Interactive Map Visualization</h4>
                  <p className='text-sm text-gray-600'>
                    Visual routes, nearby connector stops, and real-time schedule information
                  </p>
                </div>
              </div>
              <div className='flex items-start space-x-3'>
                <Bus className='h-5 w-5 text-blue-600 mt-0.5' />
                <div>
                  <h4 className='font-semibold'>Microsoft Connector Integration</h4>
                  <p className='text-sm text-gray-600'>
                    Live shuttle schedules, stop locations, and combined walking + ride time analysis
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
