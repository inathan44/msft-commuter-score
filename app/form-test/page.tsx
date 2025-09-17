'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { formInputSchema, FormInputType } from '@/lib/schemas';
import { search, getMapCenter, getMicrosoftBuildingOptions } from '@/app/helpers/search';
import { MapData } from '@/types/map';
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

  const form = useForm<FormInputType>({
    resolver: zodResolver(formInputSchema),
    defaultValues: {
      transportationMethod: undefined,
      totalTimeToOffice: 0,
      microsoftBuilding: '',
      radiusTimeMinutes: undefined,
    },
    mode: 'onSubmit',
  });

  const watchedTransportationMethod = form.watch('transportationMethod');

  // Get map data using search function with submitted form values only
  const mapData: MapData = search(submittedData || {});

  // Calculate map center using search utility function
  const mapCenter = getMapCenter(mapData, submittedData?.transportationMethod);

  // Set zoom level based on transportation method from submitted data
  const mapZoom = submittedData?.transportationMethod === 'connector' ? 11 : 13;

  function onSubmit(values: FormInputType) {
    console.log('Form submitted:', values);
    setSubmittedData(values);
  }

  return (
    <div className='container mx-auto py-8 px-4 max-w-6xl'>
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
        {/* Form Section */}
        <div>
          <div className='mb-8'>
            <h1 className='text-3xl font-bold mb-2'>Commute Form</h1>
            <p className='text-gray-600'>Enter your commute details to calculate your score.</p>
          </div>

          <Card>
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
                        <FormLabel>
                          Transportation Method
                          <span className='text-red-500 ml-1'>*</span>
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Select transportation method' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value='drive'>Drive</SelectItem>
                            <SelectItem value='walk'>Walk</SelectItem>
                            <SelectItem value='connector'>Connector</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>How do you commute to the office?</FormDescription>
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
                          Total Time to Office (minutes)
                          <span className='text-red-500 ml-1'>*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            placeholder='Enter time in minutes'
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormDescription>Total commute time from your home to the office.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Conditionally render Microsoft Building selector for drive and walk methods */}
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
                              {getMicrosoftBuildingOptions().map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
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
            <Card className='mt-8'>
              <CardHeader>
                <CardTitle className='text-green-600'>Form Submitted Successfully!</CardTitle>
                <CardDescription>Here&apos;s the JSON data you submitted:</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
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
                      <p className='text-sm font-medium text-gray-500'>Radius Time:</p>
                      <p className='text-lg'>{submittedData.radiusTimeMinutes} minutes</p>
                    </div>
                  )}

                  <div>
                    <p className='text-sm font-medium text-gray-500 mb-2'>Full JSON Response:</p>
                    <pre className='bg-gray-100 p-3 rounded text-xs overflow-x-auto'>
                      {JSON.stringify(submittedData, null, 2)}
                    </pre>
                  </div>

                  <Button onClick={() => setSubmittedData(null)} variant='outline' className='w-full'>
                    Clear Results
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Map Section */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Location Map</CardTitle>
              <CardDescription>
                {submittedData
                  ? 'Interactive map showing locations based on your selection.'
                  : 'Submit the form to see locations on the map.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='h-[500px] w-full'>
                <Map center={mapCenter} zoom={mapZoom} height='500px' mapData={mapData} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
