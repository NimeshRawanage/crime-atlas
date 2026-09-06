export async function GET(request: Request) {
  const p = new URL(request.url).searchParams;
  let url = 'https://data.police.uk/api/crimes-street-dates';
  if (p.get('kind') === 'crimes') {
    const lat = Number(p.get('lat')),
      lng = Number(p.get('lng')),
      date = p.get('date') || '';
    if (
      !p.has('lat') ||
      !p.has('lng') ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < 49 ||
      lat > 61 ||
      lng < -9 ||
      lng > 2 ||
      !/^\d{4}-(0[1-9]|1[0-2])$/.test(date)
    )
      return Response.json(
        { error: 'Select a point within the UK and a valid month.' },
        { status: 400 },
      );
    url = `https://data.police.uk/api/crimes-street/all-crime?lat=${lat}&lng=${lng}&date=${date}`;
  }
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(25000) });
    if (!r.ok)
      return Response.json(
        { error: 'Police data is temporarily unavailable.' },
        { status: 502 },
      );
    const data = await r.json();
    if (!Array.isArray(data)) throw new Error('Invalid response');
    return Response.json(data, {
      headers: { 'Cache-Control': 'public, max-age=3600' },
    });
  } catch {
    return Response.json(
      { error: 'Police data request timed out. Please try again.' },
      { status: 502 },
    );
  }
}
