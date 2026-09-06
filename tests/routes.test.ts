import test from 'node:test';
import assert from 'node:assert/strict';
import { GET as police } from '../app/api/police/route.ts';
import { GET as postcode } from '../app/api/postcode/route.ts';

test('rejects coordinates outside the supported bounds without fetching', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => {
    throw new Error('unexpected fetch');
  });
  const response = await police(
    new Request(
      'http://localhost/api/police?kind=crimes&lat=0&lng=0&date=2026-01',
    ),
  );
  assert.equal(response.status, 400);
  assert.equal(fetch.mock.callCount(), 0);
});

test('rejects malformed reporting months', async () => {
  const response = await police(
    new Request(
      'http://localhost/api/police?kind=crimes&lat=51.5&lng=-0.1&date=2026-13',
    ),
  );
  assert.equal(response.status, 400);
});

test('requests a fixed police endpoint and preserves records and cache policy', async (t) => {
  const records = [{ category: 'burglary', month: '2026-01' }];
  const fetch = t.mock.method(globalThis, 'fetch', async () =>
    Response.json(records),
  );
  const response = await police(
    new Request(
      'http://localhost/api/police?kind=crimes&lat=51.5&lng=-0.1&date=2026-01',
    ),
  );
  assert.equal(
    fetch.mock.calls[0].arguments[0],
    'https://data.police.uk/api/crimes-street/all-crime?lat=51.5&lng=-0.1&date=2026-01',
  );
  assert.deepEqual(await response.json(), records);
  assert.equal(response.headers.get('cache-control'), 'public, max-age=3600');
});

test('availability requests return upstream months', async (t) => {
  t.mock.method(globalThis, 'fetch', async () =>
    Response.json([{ date: '2026-01' }]),
  );
  const response = await police(
    new Request('http://localhost/api/police?kind=dates'),
  );
  assert.deepEqual(await response.json(), [{ date: '2026-01' }]);
});

test('upstream failure is an error, not an empty successful dataset', async (t) => {
  t.mock.method(
    globalThis,
    'fetch',
    async () => new Response('', { status: 503 }),
  );
  assert.equal(
    (await police(new Request('http://localhost/api/police?kind=dates')))
      .status,
    502,
  );
});

test('rejects a non-array police response', async (t) => {
  t.mock.method(globalThis, 'fetch', async () =>
    Response.json({ unexpected: true }),
  );
  assert.equal(
    (await police(new Request('http://localhost/api/police?kind=dates')))
      .status,
    502,
  );
});

test('rejects empty postcode input', async () => {
  assert.equal(
    (await postcode(new Request('http://localhost/api/postcode?code='))).status,
    400,
  );
});

test('encodes postcodes before forwarding them', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch', async () =>
    Response.json({ result: { postcode: 'SW1A 1AA' } }),
  );
  const response = await postcode(
    new Request('http://localhost/api/postcode?code=SW1A%201AA'),
  );
  assert.equal(
    fetch.mock.calls[0].arguments[0],
    'https://api.postcodes.io/postcodes/SW1A%201AA',
  );
  assert.equal(response.status, 200);
});

test('postcode transport failure returns an unavailable response', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => {
    throw new Error('network down');
  });
  assert.equal(
    (await postcode(new Request('http://localhost/api/postcode?code=SW1A1AA')))
      .status,
    502,
  );
});
