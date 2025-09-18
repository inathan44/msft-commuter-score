import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, MapPin, Route, BarChart3, Car, Bike, Train, ArrowRight, CheckCircle } from 'lucide-react';

export default function HomePage() {
  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100'>
      {/* Hero Section */}
      <div className='container mx-auto px-4 py-16'>
        <div className='text-center mb-16'>
          <div className='flex items-center justify-center mb-6'>
            <Home className='h-12 w-12 text-blue-600 mr-4' />
            <h1 className='text-5xl font-bold text-gray-900'>Microsoft Commute Score</h1>
          </div>
          <p className='text-xl text-gray-600 max-w-3xl mx-auto mb-8'>
            Explore neighborhoods and discover the perfect location for your home with comprehensive transportation analysis. 
            Visualize commute options, find nearby amenities, and make data-driven housing decisions.
          </p>
          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <Button asChild size='lg' className='text-lg px-8 py-6'>
              <Link href='/area-explorer' className='flex items-center'>
                <MapPin className='mr-2 h-5 w-5' />
                Explore Areas
                <ArrowRight className='ml-2 h-5 w-5' />
              </Link>
            </Button>
            <Button asChild variant='outline' size='lg' className='text-lg px-8 py-6'>
              <Link href='/commute-score' className='flex items-center'>
                <BarChart3 className='mr-2 h-5 w-5' />
                Analyze Your Commute
              </Link>
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16'>
          <Card className='hover:shadow-lg transition-shadow'>
            <CardHeader>
              <CardTitle className='flex items-center'>
                <BarChart3 className='h-6 w-6 mr-3 text-blue-600' />
                Smart Scoring
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className='text-base'>
                Get intelligent commute scores (0-100) that factor in travel time, distance, and transport mode to help
                you make informed housing decisions.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className='hover:shadow-lg transition-shadow'>
            <CardHeader>
              <CardTitle className='flex items-center'>
                <Route className='h-6 w-6 mr-3 text-green-600' />
                Multi-Modal Routes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className='text-base'>
                Compare driving, biking, walking, and transit options with real-time routing data and interactive map
                visualization.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className='hover:shadow-lg transition-shadow'>
            <CardHeader>
              <CardTitle className='flex items-center'>
                <MapPin className='h-6 w-6 mr-3 text-purple-600' />
                Microsoft Buildings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className='text-base'>
                Pre-loaded with all Microsoft office locations including Redmond campus, Bellevue, and Seattle offices
                for accurate commute planning.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* How It Works Section */}
        <div className='mb-16'>
          <h2 className='text-3xl font-bold text-center text-gray-900 mb-12'>How It Works</h2>
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
            <div className='text-center'>
              <div className='bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4'>
                <span className='text-2xl font-bold text-blue-600'>1</span>
              </div>
              <h3 className='text-xl font-semibold mb-3'>Choose Your Transport</h3>
              <p className='text-gray-600'>
                Select your preferred transportation methods - driving, biking, walking, or Microsoft Connector shuttle.
              </p>
            </div>
            <div className='text-center'>
              <div className='bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4'>
                <span className='text-2xl font-bold text-green-600'>2</span>
              </div>
              <h3 className='text-xl font-semibold mb-3'>Set Your Preferences</h3>
              <p className='text-gray-600'>
                Define your maximum commute time and select your target Microsoft office location.
              </p>
            </div>
            <div className='text-center'>
              <div className='bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4'>
                <span className='text-2xl font-bold text-purple-600'>3</span>
              </div>
              <h3 className='text-xl font-semibold mb-3'>Explore & Discover</h3>
              <p className='text-gray-600'>
                View interactive maps with commute zones, transportation options, and schedules for informed decisions.
              </p>
            </div>
          </div>
        </div>

        {/* Transport Options */}
        <div className='mb-16'>
          <h2 className='text-3xl font-bold text-center text-gray-900 mb-8'>Transport Options Analyzed</h2>
          <div className='grid grid-cols-2 lg:grid-cols-4 gap-6'>
            <div className='text-center p-6 bg-white rounded-lg shadow-md'>
              <Car className='h-8 w-8 text-blue-600 mx-auto mb-3' />
              <h3 className='font-semibold mb-2'>Driving</h3>
              <p className='text-sm text-gray-600'>Real-time traffic and route optimization</p>
            </div>
            <div className='text-center p-6 bg-white rounded-lg shadow-md'>
              <Bike className='h-8 w-8 text-yellow-600 mx-auto mb-3' />
              <h3 className='font-semibold mb-2'>Biking</h3>
              <p className='text-sm text-gray-600'>Bike-friendly routes and elevation</p>
            </div>
            <div className='text-center p-6 bg-white rounded-lg shadow-md'>
              <Route className='h-8 w-8 text-green-600 mx-auto mb-3' />
              <h3 className='font-semibold mb-2'>Walking</h3>
              <p className='text-sm text-gray-600'>Pedestrian paths and walkability</p>
            </div>
            <div className='text-center p-6 bg-white rounded-lg shadow-md'>
              <Train className='h-8 w-8 text-purple-600 mx-auto mb-3' />
              <h3 className='font-semibold mb-2'>Transit</h3>
              <p className='text-sm text-gray-600'>Public transportation and schedules</p>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className='bg-white rounded-lg shadow-lg p-8 mb-16'>
          <h2 className='text-3xl font-bold text-center text-gray-900 mb-8'>Why Use Area Explorer?</h2>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
            <div className='space-y-4'>
              <div className='flex items-start'>
                <CheckCircle className='h-6 w-6 text-green-500 mr-3 mt-1' />
                <div>
                  <h3 className='font-semibold mb-1'>Visual Area Discovery</h3>
                  <p className='text-gray-600'>Interactive maps showing transportation zones and commute radius areas</p>
                </div>
              </div>
              <div className='flex items-start'>
                <CheckCircle className='h-6 w-6 text-green-500 mr-3 mt-1' />
                <div>
                  <h3 className='font-semibold mb-1'>Real-Time Schedules</h3>
                  <p className='text-gray-600'>Live Microsoft Connector shuttle schedules and departure times</p>
                </div>
              </div>
              <div className='flex items-start'>
                <CheckCircle className='h-6 w-6 text-green-500 mr-3 mt-1' />
                <div>
                  <h3 className='font-semibold mb-1'>Multiple Transport Options</h3>
                  <p className='text-gray-600'>Compare driving, biking, walking, and shuttle options in one view</p>
                </div>
              </div>
            </div>
            <div className='space-y-4'>
              <div className='flex items-start'>
                <CheckCircle className='h-6 w-6 text-green-500 mr-3 mt-1' />
                <div>
                  <h3 className='font-semibold mb-1'>Comprehensive Coverage</h3>
                  <p className='text-gray-600'>Explore entire regions and discover new neighborhoods within your commute preferences</p>
                </div>
              </div>
              <div className='flex items-start'>
                <CheckCircle className='h-6 w-6 text-green-500 mr-3 mt-1' />
                <div>
                  <h3 className='font-semibold mb-1'>Microsoft-Optimized</h3>
                  <p className='text-gray-600'>Built specifically for Microsoft employees with accurate campus and shuttle data</p>
                </div>
              </div>
              <div className='flex items-start'>
                <CheckCircle className='h-6 w-6 text-green-500 mr-3 mt-1' />
                <div>
                  <h3 className='font-semibold mb-1'>Smart Filtering</h3>
                  <p className='text-gray-600'>Set your preferences and see only areas that match your commute requirements</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className='text-center'>
          <h2 className='text-3xl font-bold text-gray-900 mb-4'>Ready to Discover Your Ideal Location?</h2>
          <p className='text-xl text-gray-600 mb-8'>Start exploring neighborhoods and transportation options in under 30 seconds</p>
          <Button asChild size='lg' className='text-lg px-8 py-6'>
            <Link href='/area-explorer' className='flex items-center'>
              <MapPin className='mr-2 h-5 w-5' />
              Start Exploring
              <ArrowRight className='ml-2 h-5 w-5' />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
