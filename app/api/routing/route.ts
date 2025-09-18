import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const waypoints = searchParams.get('waypoints');
  const mode = searchParams.get('mode') || 'drive';

  if (!waypoints) {
    return NextResponse.json({ error: 'Waypoints parameter is required' }, { status: 400 });
  }

  // Map our mode names to Geoapify's expected values
  const modeMapping: Record<string, string> = {
    drive: 'drive',
    walk: 'walk',
    bike: 'bicycle', // Geoapify uses 'bicycle' not 'bike'
    transit: 'transit',
    truck: 'truck',
    taxi: 'taxi',
  };

  const geoapifyMode = modeMapping[mode] || mode;

  const apiKey = process.env.GEOAPIFY_API_KEY;

  if (!apiKey) {
    console.error('GEOAPIFY_API_KEY is not set in environment variables');
    return NextResponse.json({ error: 'API configuration error' }, { status: 500 });
  }

  try {
    const url = `https://api.geoapify.com/v1/routing?waypoints=${encodeURIComponent(
      waypoints
    )}&mode=${geoapifyMode}&apiKey=${apiKey}`;

    console.log('Making Geoapify routing request:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Geoapify API error response:', response.status, errorText);
      throw new Error(`Geoapify API responded with status: ${response.status}. Error: ${errorText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching routing data:', error);
    return NextResponse.json({ error: 'Failed to fetch routing data' }, { status: 500 });
  }
}
