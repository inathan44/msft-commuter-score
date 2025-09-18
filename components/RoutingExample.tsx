import { useState } from 'react';
import { getRoutingData, formatWaypoints } from '@/app/helpers/routingApi';

export function RoutingExample() {
  const [routingData, setRoutingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRoute = async () => {
    setLoading(true);
    setError(null);

    try {
      // Example coordinates: Brussels to Namur
      const coordinates: [number, number][] = [
        [50.96209827745463, 4.414458883409225], // Brussels
        [50.429137079078345, 5.00088081232559], // Namur
      ];

      const waypoints = formatWaypoints(coordinates);
      const data = await getRoutingData(waypoints, 'drive');

      setRoutingData(data);
      console.log('Routing data received:', data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='p-4'>
      <h3 className='text-lg font-semibold mb-4'>Secure Routing API Example</h3>

      <button
        onClick={fetchRoute}
        disabled={loading}
        className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50'
      >
        {loading ? 'Fetching Route...' : 'Get Route Data'}
      </button>

      {error && <div className='mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded'>Error: {error}</div>}

      {routingData && (
        <div className='mt-4 p-3 bg-green-100 border border-green-400 rounded'>
          <h4 className='font-semibold'>Route data received successfully!</h4>
          <details className='mt-2'>
            <summary className='cursor-pointer'>View raw data</summary>
            <pre className='mt-2 text-xs overflow-auto'>{JSON.stringify(routingData, null, 2)}</pre>
          </details>
        </div>
      )}
    </div>
  );
}
