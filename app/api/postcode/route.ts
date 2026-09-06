export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get('code') || '';
  if (code.length > 10 || !code.trim())
    return Response.json(
      { error: 'Enter a valid UK postcode.' },
      { status: 400 },
    );
  try {
    const r = await fetch(
      'https://api.postcodes.io/postcodes/' + encodeURIComponent(code),
      { signal: AbortSignal.timeout(10000) },
    );
    if (!r.ok)
      return Response.json({ error: 'Postcode not found.' }, { status: 404 });
    return Response.json(await r.json());
  } catch {
    return Response.json(
      { error: 'Postcode lookup is unavailable.' },
      { status: 502 },
    );
  }
}
