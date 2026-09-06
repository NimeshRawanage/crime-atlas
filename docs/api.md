# API reference

Both endpoints are read-only GET routes returning JSON. No application credentials are required. The upstream host is fixed by each route.

## `GET /api/police?kind=dates`

Returns the Police.uk list of available datasets. Each object includes a `date` in `YYYY-MM` form; additional upstream fields are retained. The client sorts dates in descending order.

## `GET /api/police?kind=crimes&lat=51.5074&lng=-0.1278&date=2026-01`

| Parameter | Constraint                                         |
| --------- | -------------------------------------------------- |
| `lat`     | Required finite number between 49 and 61           |
| `lng`     | Required finite number between -9 and 2            |
| `date`    | Required `YYYY-MM`, with a month between 01 and 12 |

Returns the upstream array of local reports. The interface uses `category`, `location.latitude`, `location.longitude` and `month`. Additional fields are passed through. Valid format does not guarantee that a reporting month is available; choose dates from the availability route.

The police fetch times out after 25 seconds. Successful responses send `Cache-Control: public, max-age=3600`.

## `GET /api/postcode?code=SW1A%201AA`

Accepts a non-empty postcode of at most ten characters, URL-encodes it and returns the Postcodes.io JSON envelope. The client uses `result.postcode`, `result.country`, `result.latitude` and `result.longitude`.

The lookup times out after ten seconds. Scotland's unsupported status is presented in the client after a successful lookup, rather than as an API error.

## Error responses

Errors have an `error` string. The police route returns 400 for invalid coordinate/month parameters and 502 for unavailable or invalid upstream responses. The postcode route returns 400 for empty/overlong input, 404 when its upstream returns a non-success status, and 502 on a thrown request failure. Consequently, a postcode upstream outage may sometimes be presented as “not found”; this is a known limitation.

For compatibility, missing or unrecognised police `kind` values currently select the availability endpoint. There is no pagination, API authentication or application-level rate limiter. Do not expose the service at scale without appropriate host-level controls.
