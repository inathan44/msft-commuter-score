import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Home, 
  MapPin, 
  Route, 
  BarChart3, 
  Clock, 
  Car, 
  Bike, 
  Train,
  ArrowRight,
  CheckCircle
} from 'lucide-react';

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
            Find your perfect home location with intelligent commute analysis to Microsoft offices. 
            Get personalized scores based on travel time, distance, and transport options.
          </p>
          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <Button asChild size='lg' className='text-lg px-8 py-6'>
              <Link href='/commute-score' className='flex items-center'>
                <BarChart3 className='mr-2 h-5 w-5' />
                Analyze Your Commute
                <ArrowRight className='ml-2 h-5 w-5' />
              </Link>
            </Button>
            <Button asChild variant='outline' size='lg' className='text-lg px-8 py-6'>
              <Link href='/area-explorer' className='flex items-center'>
                <MapPin className='mr-2 h-5 w-5' />
                Explore Areas
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
                Get intelligent commute scores (0-100) that factor in travel time, distance, 
                and transport mode to help you make informed housing decisions.
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
                Compare driving, biking, walking, and transit options with real-time routing 
                data and interactive map visualization.
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
                Pre-loaded with all Microsoft office locations including Redmond campus, 
                Bellevue, and Seattle offices for accurate commute planning.
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
              <h3 className='text-xl font-semibold mb-3'>Enter Your Address</h3>
              <p className='text-gray-600'>
                Input your home address or potential location you&apos;re considering for your residence.
              </p>
            </div>
            <div className='text-center'>
              <div className='bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4'>
                <span className='text-2xl font-bold text-green-600'>2</span>
              </div>
              <h3 className='text-xl font-semibold mb-3'>Select Microsoft Office</h3>
              <p className='text-gray-600'>
                Choose your target Microsoft office from our comprehensive list of locations.
              </p>
            </div>
            <div className='text-center'>
              <div className='bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4'>
                <span className='text-2xl font-bold text-purple-600'>3</span>
              </div>
              <h3 className='text-xl font-semibold mb-3'>Get Your Score</h3>
              <p className='text-gray-600'>
                Receive detailed commute analysis with scores, routes, and recommendations.
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
          <h2 className='text-3xl font-bold text-center text-gray-900 mb-8'>Why Use Commute Score?</h2>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
            <div className='space-y-4'>
              <div className='flex items-start'>
                <CheckCircle className='h-6 w-6 text-green-500 mr-3 mt-1' />
                <div>
                  <h3 className='font-semibold mb-1'>Save Time & Money</h3>
                  <p className='text-gray-600'>Make informed decisions about housing based on actual commute data</p>
                </div>
              </div>
              <div className='flex items-start'>
                <CheckCircle className='h-6 w-6 text-green-500 mr-3 mt-1' />
                <div>
                  <h3 className='font-semibold mb-1'>Data-Driven Decisions</h3>
                  <p className='text-gray-600'>Objective scoring based on real routing algorithms and travel times</p>
                </div>
              </div>
              <div className='flex items-start'>
                <CheckCircle className='h-6 w-6 text-green-500 mr-3 mt-1' />
                <div>
                  <h3 className='font-semibold mb-1'>Multiple Scenarios</h3>
                  <p className='text-gray-600'>Compare different transport modes and see all options at once</p>
                </div>
              </div>
            </div>
            <div className='space-y-4'>
              <div className='flex items-start'>
                <CheckCircle className='h-6 w-6 text-green-500 mr-3 mt-1' />
                <div>
                  <h3 className='font-semibold mb-1'>Visual Mapping</h3>
                  <p className='text-gray-600'>Interactive maps showing all route options with color-coded paths</p>
                </div>
              </div>
              <div className='flex items-start'>
                <CheckCircle className='h-6 w-6 text-green-500 mr-3 mt-1' />
                <div>
                  <h3 className='font-semibold mb-1'>Microsoft-Specific</h3>
                  <p className='text-gray-600'>Tailored for Microsoft employees with accurate office locations</p>
                </div>
              </div>
              <div className='flex items-start'>
                <CheckCircle className='h-6 w-6 text-green-500 mr-3 mt-1' />
                <div>
                  <h3 className='font-semibold mb-1'>Free to Use</h3>
                  <p className='text-gray-600'>No cost, no registration required - just enter your address and go</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className='text-center'>
          <h2 className='text-3xl font-bold text-gray-900 mb-4'>Ready to Find Your Perfect Commute?</h2>
          <p className='text-xl text-gray-600 mb-8'>
            Start analyzing your commute in under 30 seconds
          </p>
          <Button asChild size='lg' className='text-lg px-8 py-6'>
            <Link href='/commute-score' className='flex items-center'>
              <Clock className='mr-2 h-5 w-5' />
              Get Started Now
              <ArrowRight className='ml-2 h-5 w-5' />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
