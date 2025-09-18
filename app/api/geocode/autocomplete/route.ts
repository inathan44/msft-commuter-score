import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const text = searchParams.get('text');
  const type = searchParams.get('type'); // country, state, city, postcode, street, amenity, locality
  const lang = searchParams.get('lang') || 'en';
  const filter = searchParams.get('filter'); // country code, boundaries, etc.
  const bias = searchParams.get('bias'); // proximity bias
  const limit = searchParams.get('limit') || '5';
  const format = searchParams.get('format') || 'json';

  if (!text) {
    return NextResponse.json({ error: 'Text parameter is required' }, { status: 400 });
  }

  const apiKey = process.env.GEOAPIFY_API_KEY;

  if (!apiKey) {
    console.error('GEOAPIFY_API_KEY is not set in environment variables');
    return NextResponse.json({ error: 'API configuration error' }, { status: 500 });
  }

  try {
    const params = new URLSearchParams({
      text: text,
      apiKey: apiKey,
      format: format,
      lang: lang,
      limit: limit,
    });

    if (type) params.append('type', type);
    if (filter) params.append('filter', filter);
    if (bias) params.append('bias', bias);

    const url = `https://api.geoapify.com/v1/geocode/autocomplete?${params}`;

    console.log('Geoapify URL:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    console.log('Geoapify response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Geoapify error response:', errorText);
      throw new Error(`Geoapify Autocomplete API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching autocomplete data:', error);
    return NextResponse.json({ error: 'Failed to fetch autocomplete data' }, { status: 500 });
  }
}
