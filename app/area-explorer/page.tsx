'use client';

import { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { formInputSchema, FormInputType } from '@/lib/schemas';
import { search, getMapCenter, getMicrosoftBuildingOptions } from '@/app/helpers/search';
import { MapData } from '@/types/map';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MultiSelect } from '@/components/ui/multi-select';
import { Car, Bike, PersonStanding, Bus, Settings, X } from 'lucide-react';

// Dynamically import Map component to avoid SSR issues with Leaflet
const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className='w-full h-[500px] bg-gray-100 rounded-lg flex items-center justify-center'>
      <p className='text-gray-500'>Loading map...</p>
    </div>
  ),
});

// Dynamically import ScheduleDisplay to avoid SSR issues
const ScheduleDisplay = dynamic(() => import('@/components/ScheduleDisplay'), {
  ssr: false,
  loading: () => (
    <div className='w-full h-[200px] bg-gray-100 rounded-lg flex items-center justify-center'>
      <p className='text-gray-500'>Loading schedules...</p>
    </div>
  ),
});

export default function AreaExplorerPage() {
  const [submittedData, setSubmittedData] = useState<FormInputType | null>(null);
  const [mapZoom, setMapZoom] = useState(6);
  const [isSearching, setIsSearching] = useState(false);
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);

  const form = useForm<FormInputType>({
    resolver: zodResolver(formInputSchema),
    defaultValues: {
      transportationMethods: [],
      totalTimeToOffice: undefined,
      microsoftBuilding: '',
      radiusTimeMinutes: undefined,
    },
    mode: 'onSubmit',
  });

  const watchedTransportationMethods = form.watch('transportationMethods');

  // Get map data using search function with submitted form values only
  const mapData: MapData = useMemo(() => {
    return search(submittedData || {});
  }, [submittedData]);

  // Calculate map center using search utility function
  const mapCenter = useMemo(() => {
    return getMapCenter(mapData, submittedData?.transportationMethods);
  }, [mapData, submittedData?.transportationMethods]);

  useEffect(() => {
    // Set zoom level based on transportation method from submitted data
    console.log('Changing');
    const zoom = submittedData?.transportationMethods?.includes('connector') ? 11 : 11;
    setMapZoom(zoom);
  }, [submittedData]);

  function onSubmit(values: FormInputType) {
    console.log('Form submitted:', values);
    setIsSearching(true);

    // Simulate loading for better UX - longer duration for better experience
    setTimeout(() => {
      setSubmittedData(values);
      setIsSearching(false);
      setIsFormCollapsed(true); // Collapse form after successful submission
    }, 2500);
  }

  return (
    <div className='container mx-auto py-8 px-4 max-w-6xl'>
      {/* Header Section */}
      <div className='mb-8 text-center'>
        <h1 className='text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
          Microsoft Commute Analyzer
        </h1>
        <p className='text-lg text-muted-foreground leading-relaxed max-w-3xl mx-auto'>
          Explore commute options and travel times to Microsoft offices. See transportation radius zones, shuttle stops,
          and discover the most convenient areas based on your preferred commute method.
        </p>
        <div className='mt-4 p-3 bg-blue-50/50 border border-blue-200/50 rounded-md max-w-2xl mx-auto'>
          <p className='text-xs text-blue-700 flex items-start gap-2'>
            <span className='text-blue-500 mt-0.5'>ℹ️</span>
            <span>
              <strong>Demo Version:</strong> Explore and test all features! Note that Microsoft Connector shuttle times
              are simulated for demonstration purposes to showcase the tool&apos;s capabilities.
            </span>
          </p>
        </div>
      </div>

      <div className={`${isFormCollapsed ? 'block' : 'grid grid-cols-1 lg:grid-cols-2'} gap-8`}>
        {/* Form Section */}
        <div className={isFormCollapsed ? 'mb-4' : ''}>
          {isFormCollapsed ? (
            // Collapsed form - show only a toggle button and quick summary
            <Card>
              <CardContent className='p-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-4'>
                    <Button
                      onClick={() => setIsFormCollapsed(false)}
                      variant='outline'
                      size='sm'
                      className='flex items-center gap-2'
                    >
                      <Settings className='h-4 w-4' />
                      Modify Search
                    </Button>
                    {submittedData && (
                      <div className='text-sm text-muted-foreground'>
                        <span className='font-medium'>
                          {submittedData.transportationMethods.join(', ')} · {submittedData.totalTimeToOffice}min
                        </span>
                        {submittedData.microsoftBuilding && <span> · {submittedData.microsoftBuilding}</span>}
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={() => {
                      setSubmittedData(null);
                      setIsFormCollapsed(false);
                    }}
                    variant='outline'
                    size='sm'
                  >
                    <X className='h-4 w-4' />
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            // Full form with results
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Commute Preferences</CardTitle>
                  <CardDescription>
                    Set your transportation preferences and commute limits to see relevant areas and travel options.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
                      <FormField
                        control={form.control}
                        name='transportationMethods'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Transportation Methods <span className='text-destructive'>*</span>
                            </FormLabel>
                            <FormControl>
                              <MultiSelect
                                options={[
                                  { value: 'drive', label: 'Drive', icon: <Car className='h-4 w-4' /> },
                                  {
                                    value: 'walk',
                                    label: 'Walk',
                                    icon: <PersonStanding className='h-4 w-4' />,
                                  },
                                  { value: 'cycle', label: 'Cycle', icon: <Bike className='h-4 w-4' /> },
                                  {
                                    value: 'connector',
                                    label: 'Microsoft Connector',
                                    icon: <Bus className='h-4 w-4' />,
                                  },
                                ]}
                                selected={field.value || []}
                                onChange={field.onChange}
                                placeholder='Choose your transportation methods'
                              />
                            </FormControl>
                            <FormDescription>
                              Select one or more transportation methods to see overlapping commute zones and options.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name='totalTimeToOffice'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Maximum Commute Time <span className='text-destructive'>*</span>
                            </FormLabel>
                            <FormControl>
                              <Select
                                onValueChange={(value) => field.onChange(Number(value))}
                                value={field.value ? field.value.toString() : ''}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder='Choose your maximum commute time' />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value='20'>20 minutes</SelectItem>
                                  <SelectItem value='40'>40 minutes</SelectItem>
                                  <SelectItem value='60'>60 minutes</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormDescription>
                              Set your maximum acceptable commute time to filter relevant areas.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Conditionally render Microsoft Building selector for drive, walk, and cycle methods */}
                      {(watchedTransportationMethods?.includes('drive') ||
                        watchedTransportationMethods?.includes('walk') ||
                        watchedTransportationMethods?.includes('cycle')) && (
                        <FormField
                          control={form.control}
                          name='microsoftBuilding'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Microsoft Building <span className='text-destructive'>*</span>
                              </FormLabel>
                              <Select onValueChange={field.onChange} value={field.value || ''}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder='Select your Microsoft building' />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {getMicrosoftBuildingOptions().map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Select your specific work location for accurate commute time calculations.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {/* Conditionally render Radius Time selector for connector method */}
                      {watchedTransportationMethods?.includes('connector') && (
                        <FormField
                          control={form.control}
                          name='radiusTimeMinutes'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Walking Distance to Connector Stop <span className='text-destructive'>*</span>
                              </FormLabel>
                              <Select onValueChange={field.onChange} value={field.value || ''}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder='Choose your walking comfort zone' />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value='5'>5 minutes (close and convenient)</SelectItem>
                                  <SelectItem value='10'>10 minutes (comfortable walk)</SelectItem>
                                  <SelectItem value='15'>15 minutes (don&apos;t mind a longer walk)</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Set how far you&apos;re willing to walk to reach a Microsoft Connector shuttle stop.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      <Button type='submit' className='w-full' disabled={isSearching}>
                        {isSearching ? (
                          <div className='flex items-center gap-2'>
                            <div className='relative'>
                              <svg className='animate-spin h-4 w-4 text-current' fill='none' viewBox='0 0 24 24'>
                                <circle
                                  className='opacity-25'
                                  cx='12'
                                  cy='12'
                                  r='10'
                                  stroke='currentColor'
                                  strokeWidth='4'
                                ></circle>
                                <path
                                  className='opacity-75'
                                  fill='currentColor'
                                  d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                                ></path>
                              </svg>
                            </div>
                            Finding neighborhoods...
                          </div>
                        ) : (
                          'Analyze Commute Options'
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              {submittedData && !isSearching && !isFormCollapsed && (
                <Card className='mt-6'>
                  <CardHeader>
                    <CardTitle>Commute Analysis Results</CardTitle>
                    <CardDescription>
                      Here&apos;s your commute analysis based on the selected transportation preferences and time
                      limits.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-4'>
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div className='bg-muted p-3 rounded-md'>
                          <p className='text-xs font-medium text-muted-foreground mb-1'>Transportation Methods:</p>
                          <p className='text-sm font-medium capitalize'>
                            {submittedData.transportationMethods.join(', ')}
                          </p>
                        </div>
                        <div className='bg-muted p-3 rounded-md'>
                          <p className='text-xs font-medium text-muted-foreground mb-1'>Max Commute Time:</p>
                          <p className='text-sm font-medium'>{submittedData.totalTimeToOffice} minutes</p>
                        </div>
                      </div>

                      {submittedData.microsoftBuilding && (
                        <div className='bg-muted p-3 rounded-md'>
                          <p className='text-xs font-medium text-muted-foreground mb-1'>Your Workplace:</p>
                          <p className='text-sm font-medium'>{submittedData.microsoftBuilding}</p>
                        </div>
                      )}

                      {submittedData.radiusTimeMinutes && (
                        <div className='bg-muted p-3 rounded-md'>
                          <p className='text-xs font-medium text-muted-foreground mb-1'>Max Walk to Connector:</p>
                          <p className='text-sm font-medium'>{submittedData.radiusTimeMinutes} minutes</p>
                        </div>
                      )}

                      <div className='border-t pt-4'>
                        <details className='group'>
                          <summary className='text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors'>
                            Technical Details (for developers)
                          </summary>
                          <pre className='mt-2 bg-muted p-3 rounded text-xs overflow-x-auto'>
                            {JSON.stringify(submittedData, null, 2)}
                          </pre>
                        </details>
                      </div>

                      <Button onClick={() => setSubmittedData(null)} variant='outline' className='w-full'>
                        Run New Analysis
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* Map Section */}
        <div className={isFormCollapsed ? 'w-full' : ''}>
          <Card>
            <CardHeader>
              <CardTitle>Commute Zone Visualization</CardTitle>
              <CardDescription>
                {submittedData
                  ? 'Explore commute zones and transportation options. Each colored area shows reachable locations within your time limits.'
                  : 'Configure your commute preferences above to see transportation zones and available options.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isSearching ? (
                <div className='h-[500px] w-full bg-muted rounded-lg flex flex-col items-center justify-center'>
                  <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3'></div>
                  <p className='text-sm font-medium mb-1'>Analyzing commute zones...</p>
                  <p className='text-xs text-muted-foreground'>Calculating transportation options and travel times</p>
                </div>
              ) : (
                <div className='space-y-4'>
                  <div
                    className={`${isFormCollapsed ? 'h-[75vh]' : 'h-[500px]'} w-full rounded-lg overflow-hidden border`}
                  >
                    <Map
                      center={mapCenter}
                      zoom={mapZoom}
                      height={isFormCollapsed ? '75vh' : '500px'}
                      mapData={mapData}
                    />
                  </div>

                  {/* Map Legend */}
                  {submittedData && (
                    <Card className='bg-muted/30'>
                      <CardHeader>
                        <CardTitle className='text-sm font-medium'>Map Legend</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                          {/* Transportation Methods */}
                          <div>
                            <h4 className='font-medium text-gray-700 mb-3 flex items-center gap-2'>
                              Transportation Radius:
                            </h4>
                            <div className='space-y-2'>
                              {submittedData.transportationMethods.includes('drive') && (
                                <div className='flex items-center gap-3'>
                                  <div
                                    className='w-4 h-4 rounded-full border-2'
                                    style={{ backgroundColor: '#10b981', borderColor: '#10b981' }}
                                  ></div>
                                  <Car className='w-4 h-4 text-gray-600' />
                                  <span className='text-sm text-gray-700'>
                                    Drive - {submittedData.totalTimeToOffice} min radius
                                  </span>
                                </div>
                              )}
                              {submittedData.transportationMethods.includes('walk') && (
                                <div className='flex items-center gap-3'>
                                  <div
                                    className='w-4 h-4 rounded-full border-2'
                                    style={{ backgroundColor: '#8b5cf6', borderColor: '#8b5cf6' }}
                                  ></div>
                                  <PersonStanding className='w-4 h-4 text-gray-600' />
                                  <span className='text-sm text-gray-700'>
                                    Walk - {submittedData.totalTimeToOffice} min radius
                                  </span>
                                </div>
                              )}
                              {submittedData.transportationMethods.includes('cycle') && (
                                <div className='flex items-center gap-3'>
                                  <div
                                    className='w-4 h-4 rounded-full border-2'
                                    style={{ backgroundColor: '#f59e0b', borderColor: '#f59e0b' }}
                                  ></div>
                                  <Bike className='w-4 h-4 text-gray-600' />
                                  <span className='text-sm text-gray-700'>
                                    Cycle - {submittedData.totalTimeToOffice} min radius
                                  </span>
                                </div>
                              )}
                              {submittedData.transportationMethods.includes('connector') && (
                                <div className='flex items-center gap-3'>
                                  <div
                                    className='w-4 h-4 rounded-full border-2'
                                    style={{ backgroundColor: '#3b82f6', borderColor: '#3b82f6' }}
                                  ></div>
                                  <Bus className='w-4 h-4 text-gray-600' />
                                  <span className='text-sm text-gray-700'>
                                    Connector - {submittedData.radiusTimeMinutes} min walk to stops
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Map Pins */}
                          <div>
                            <h4 className='font-medium text-gray-700 mb-3 flex items-center gap-2'>Map Pins:</h4>
                            <div className='space-y-2'>
                              <div className='flex items-center gap-3'>
                                <div
                                  className='w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-sm shadow-sm'
                                  style={{ backgroundColor: '#059669' }}
                                >
                                  🏢
                                </div>
                                <span className='text-sm text-gray-700'>Microsoft Office Buildings</span>
                              </div>
                              <div className='flex items-center gap-3'>
                                <div
                                  className='w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-sm shadow-sm'
                                  style={{ backgroundColor: '#3B82F6' }}
                                >
                                  🚌
                                </div>
                                <span className='text-sm text-gray-700'>Microsoft Connector Shuttle Stops</span>
                              </div>
                              <div className='flex items-center gap-3'>
                                <div
                                  className='w-7 h-7 rounded-full border-2 border-white flex items-center justify-center shadow-sm'
                                  style={{ backgroundColor: '#059669' }}
                                >
                                  <Image
                                    src='/microsoft-logo.svg'
                                    alt='MS'
                                    width={14}
                                    height={14}
                                    className='w-3.5 h-3.5'
                                  />
                                </div>
                                <span className='text-sm text-gray-700'>Microsoft Connector Stops (MS Buildings)</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className='mt-4 pt-3 border-t border-gray-200'>
                          <p className='text-xs text-gray-500 leading-relaxed'>
                            💡 <strong>Tip:</strong> Colored areas show commute radius zones for each transportation
                            method. Overlapping areas indicate multiple commute options available. Click any pin for
                            location details including parking and commute times.
                          </p>
                        </div>

                        {/* Route Schedule Information */}
                        {submittedData?.transportationMethods?.includes('connector') && (
                          <div className='mt-4 pt-3 border-t border-gray-200'>
                            <h4 className='text-sm font-medium text-gray-900 mb-2'>📅 Schedule Information</h4>
                            <p className='text-xs text-gray-600 leading-relaxed'>
                              Schedule data is available for all Microsoft Connector stops. Click any connector stop pin
                              on the map to view:
                            </p>
                            <ul className='text-xs text-gray-600 mt-2 space-y-1'>
                              <li>• Available routes and schedules</li>
                              <li>• Next departure times</li>
                              <li>• Upcoming trip information</li>
                            </ul>
                            <p className='text-xs text-blue-600 mt-2'>
                              Real-time schedule data helps you plan your commute with accurate departure times.
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Schedule Display - positioned after legend to avoid interference */}
                  {submittedData?.transportationMethods?.includes('connector') && (
                    <ScheduleDisplay
                      stopIds={mapData.pins.filter((pin) => pin.type === 'connectorStop').map((pin) => pin.id)}
                      className='mt-4'
                    />
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
