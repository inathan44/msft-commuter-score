'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { formInputSchema, FormInputType } from '@/lib/schemas';
import { filterMapData, getAllMapData, getMicrosoftBuildingsForDropdown, SearchFilters } from '@/app/helpers/search';
import { MapPin, ConnectorStopPin, MicrosoftBuildingPin, MapData } from '@/types/map';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Dynamically import Map component to avoid SSR issues with Leaflet
const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className='w-full h-[500px] bg-gray-100 rounded-lg flex items-center justify-center'>
      <p className='text-gray-500'>Loading map...</p>
    </div>
  ),
});

export default function FormTestPage() {
  const [submittedData, setSubmittedData] = useState<FormInputType | null>(null);

  // Get all map data using centralized search method
  const allMapData = getAllMapData(); // Initialize with all data using search method
  const [filteredPins, setFilteredPins] = useState<MapPin[]>(() => {
    const initialData = filterMapData(allMapData, {
      pins: {
        types: ['connectorStop', 'microsoftBuilding'],
      },
    });
    return initialData.pins;
  });

  // State for filtered radii - empty by default, only populated when connector method is submitted
  const [filteredRadii, setFilteredRadii] = useState<typeof allMapData.radii>([]);

  const form = useForm<FormInputType>({
    resolver: zodResolver(formInputSchema),
    defaultValues: {
      transportationMethod: undefined,
      totalTimeToOffice: 0,
      microsoftBuilding: '',
      radiusTimeMinutes: undefined,
    },
  });

  const watchedTransportationMethod = form.watch('transportationMethod');

  // Create MapData object for the Map component
  const mapData: MapData = {
    pins: filteredPins,
    routes: [],
    radii: filteredRadii,
  };

  function onSubmit(values: FormInputType) {
    console.log('Form submitted:', values);
    setSubmittedData(values);

    // Filter data using centralized search method
    if (values.transportationMethod === 'drive' || values.transportationMethod === 'walk') {
      // For drive/walk, show the selected Microsoft building if one is chosen
      if (values.microsoftBuilding) {
        const filteredData = filterMapData(allMapData, {
          pins: {
            types: ['microsoftBuilding'],
            query: values.microsoftBuilding,
          },
        });
        setFilteredPins(filteredData.pins);
        setFilteredRadii([]); // Don't show radii for drive/walk
      } else {
        setFilteredPins([]);
        setFilteredRadii([]);
      }
    } else if (values.transportationMethod === 'connector') {
      // For connector, show only connector stops and filtered radii
      const searchFilters: SearchFilters = {
        pins: {
          types: ['connectorStop'],
        },
      };

      // Add radius time filter if specified
      if (values.radiusTimeMinutes) {
        searchFilters.radii = {
          travelTimeMinutes: parseInt(values.radiusTimeMinutes),
        };
      }

      const filteredData = filterMapData(allMapData, searchFilters);
      setFilteredPins(filteredData.pins);
      setFilteredRadii(filteredData.radii);
    }
  }

  return (
    <div className='container mx-auto py-8 px-4 max-w-2xl'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold mb-2'>Commute Form</h1>
        <p className='text-gray-600'>Enter your commute details to calculate your score.</p>
      </div>

      <Card className='mb-8'>
        <CardHeader>
          <CardTitle>Transportation Details</CardTitle>
          <CardDescription>Please fill out your transportation method and commute time.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
              <FormField
                control={form.control}
                name='transportationMethod'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transportation Method</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select your transportation method' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='drive'>Drive</SelectItem>
                        <SelectItem value='connector'>Connector</SelectItem>
                        <SelectItem value='walk'>Walk</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>Choose how you plan to commute to the office.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='totalTimeToOffice'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Time to Office (minutes)</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        placeholder='Enter time in minutes'
                        {...field}
                        value={field.value || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const value = e.target.value;
                          field.onChange(value === '' ? 0 : Number(value));
                        }}
                        min='1'
                        max='180'
                      />
                    </FormControl>
                    <FormDescription>How long does it take to get to the office? (1-180 minutes)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Conditionally render Microsoft Building field */}
              {(watchedTransportationMethod === 'drive' || watchedTransportationMethod === 'walk') && (
                <FormField
                  control={form.control}
                  name='microsoftBuilding'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Microsoft Building
                        <span className='text-red-500 ml-1'>*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select a Microsoft building' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {getMicrosoftBuildingsForDropdown().map((building) => (
                            <SelectItem key={building.id} value={building.name}>
                              {building.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>Which Microsoft building is your destination?</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Conditionally render Radius Time selector for connector method */}
              {watchedTransportationMethod === 'connector' && (
                <FormField
                  control={form.control}
                  name='radiusTimeMinutes'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Radius Time
                        <span className='text-red-500 ml-1'>*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select radius time in minutes' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='5'>5 minutes</SelectItem>
                          <SelectItem value='10'>10 minutes</SelectItem>
                          <SelectItem value='15'>15 minutes</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>Select which radius time range to display on the map.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <Button type='submit' className='w-full'>
                Submit Commute Details
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Display submitted data */}
      {submittedData && (
        <Card>
          <CardHeader>
            <CardTitle className='text-green-600'>Form Submitted Successfully!</CardTitle>
            <CardDescription>Here&apos;s the data you submitted:</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <p className='text-sm font-medium text-gray-500'>Transportation Method:</p>
                  <p className='text-lg capitalize'>{submittedData.transportationMethod}</p>
                </div>
                <div>
                  <p className='text-sm font-medium text-gray-500'>Total Time to Office:</p>
                  <p className='text-lg'>{submittedData.totalTimeToOffice} minutes</p>
                </div>
              </div>

              {submittedData.microsoftBuilding && (
                <div>
                  <p className='text-sm font-medium text-gray-500'>Microsoft Building:</p>
                  <p className='text-lg'>{submittedData.microsoftBuilding}</p>
                </div>
              )}

              {submittedData.radiusTimeMinutes && (
                <div>
                  <p className='text-sm font-medium text-gray-500'>Radius Time Filter:</p>
                  <p className='text-lg'>{submittedData.radiusTimeMinutes} minutes</p>
                </div>
              )}
            </div>

            <div className='mt-6 p-4 bg-gray-50 rounded-lg'>
              <p className='text-sm font-medium text-gray-500 mb-2'>Raw JSON Data:</p>
              <pre className='text-xs overflow-x-auto'>{JSON.stringify(submittedData, null, 2)}</pre>
            </div>

            <Button
              onClick={() => {
                setSubmittedData(null);
                // Reset to show all connector stops and Microsoft buildings using search method
                const resetMapData = filterMapData(allMapData, {
                  pins: {
                    types: ['connectorStop', 'microsoftBuilding'],
                  },
                });
                setFilteredPins(resetMapData.pins);
                setFilteredRadii([]); // Clear radii on reset
              }}
              variant='outline'
              className='mt-4'
            >
              Reset Form
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Map Display */}
      <Card className='mb-8'>
        <CardHeader>
          <CardTitle>Map View</CardTitle>
          <CardDescription>Interactive map showing {filteredPins.length} locations</CardDescription>
        </CardHeader>
        <CardContent className='p-0'>
          <div className='w-full'>
            <Map
              mapData={mapData}
              height='500px'
              center={[47.64, -122.127]} // Redmond, WA (Microsoft campus area)
              zoom={11}
              className='rounded-b-lg'
            />
          </div>
        </CardContent>
      </Card>

      {/* Display filtered pins */}
      <Card>
        <CardHeader>
          <CardTitle>Available Locations</CardTitle>
          <CardDescription>
            {submittedData
              ? `Filtered results for ${submittedData.transportationMethod} transportation (${filteredPins.length} locations)`
              : `Showing all connector stops and Microsoft buildings (${filteredPins.length} locations)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-3 max-h-96 overflow-y-auto'>
            {filteredPins.map((pin) => (
              <div key={pin.id} className='border rounded-lg p-4 hover:bg-gray-50'>
                <div className='flex items-start justify-between'>
                  <div className='flex-1'>
                    <div className='flex items-center gap-2 mb-2'>
                      <span className='text-lg'>{pin.type === 'connectorStop' ? '🚌' : '🏢'}</span>
                      <h3 className='font-semibold text-sm'>{pin.name}</h3>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          pin.type === 'connectorStop' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {pin.type === 'connectorStop' ? 'Connector Stop' : 'Microsoft Building'}
                      </span>
                    </div>

                    {pin.address && (
                      <p className='text-xs text-gray-600 mb-2'>
                        {pin.address.street && `${pin.address.street}, `}
                        {pin.address.city && `${pin.address.city}, `}
                        {pin.address.state && `${pin.address.state} `}
                        {pin.address.zip}
                      </p>
                    )}

                    {pin.type === 'connectorStop' && (
                      <div className='text-xs text-gray-500 space-y-1'>
                        <p>{(pin as ConnectorStopPin).description}</p>
                        <div className='flex gap-4'>
                          <span>Parking: {(pin as ConnectorStopPin).hasParking ? '✅' : '❌'}</span>
                          <span>MS Building: {(pin as ConnectorStopPin).isMSBuilding ? '✅' : '❌'}</span>
                          {(pin as ConnectorStopPin).commuteTimeToOfficeMinutes && (
                            <span className='font-medium text-blue-600'>
                              🕒 {(pin as ConnectorStopPin).commuteTimeToOfficeMinutes} min to office
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {pin.type === 'microsoftBuilding' && (
                      <p className='text-xs text-gray-500'>Building: {(pin as MicrosoftBuildingPin).buildingName}</p>
                    )}
                  </div>

                  <div className='text-xs text-gray-400 ml-4'>
                    <p>Lat: {pin.coordinates[1].toFixed(4)}</p>
                    <p>Lng: {pin.coordinates[0].toFixed(4)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredPins.length === 0 && (
            <div className='text-center py-8 text-gray-500'>
              <p>No locations match your criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
