'use client';

import Map from '@/components/Map';
import Link from 'next/link';

export default function ExamplePage() {
  return (
    <div className='container mx-auto p-4'>
      <h1 className='text-3xl font-bold mb-6'>Example: Driving Radius Visualization</h1>
      <p className='mb-6'>Interactive map showing Microsoft&apos;s 5-minute driving radius</p>

      {/* Main Driving Radius Map */}
      <div className='mb-8'>
        <h2 className='text-xl font-semibold mb-4'>🚗 Microsoft 5-Minute Driving Radius</h2>
        <Map
          center={[47.640606, -122.127912]} // Microsoft headquarters coordinates
          zoom={13}
          height='700px'
          className='shadow-lg border-2 border-gray-200'
          tileStyle='colorful'
          showDriveRadius={true}
        />
        <div className='mt-4 p-4 bg-gray-50 rounded-lg'>
          <h3 className='font-semibold mb-2'>Driving Radius Information:</h3>
          <div className='text-sm text-gray-700'>
            <p>
              <strong>📍 Center:</strong> Microsoft Headquarters, Redmond, WA
            </p>
            <p>
              <strong>🚗 Travel Time:</strong> 5 minutes driving
            </p>
            <p>
              <strong>🎨 Red Area:</strong> All locations reachable within 5 minutes by car
            </p>
            <p>
              <strong>📊 Use Case:</strong> Commuter accessibility analysis, delivery zones, service areas
            </p>
          </div>
        </div>
      </div>

      {/* Navigation back */}
      <div className='mt-8'>
        <Link
          href='/'
          className='inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors'
        >
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}
