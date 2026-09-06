# Architecture

## Repository layout

```text
app/
  layout.tsx            Document metadata and fonts
  page.tsx              Dashboard, filters, summaries and Leaflet lifecycle
  globals.css           Theme and responsive layout
  api/police/route.ts    Available-month and local-report proxy
  api/postcode/route.ts  Postcode lookup proxy
components/ui/select.tsx  Shared accessible select primitive
lib/utils.ts            Class-name composition helper
public/favicon.svg      Crime Atlas map/radar icon
tests/                  Isolated server route tests
docs/                   Architecture, API, data and operations guides
.github/workflows/       Continuous integration
```

## Request and state flow

On mount, the dashboard retrieves available months and selects the newest one. A month or location change clears previous reports, sets a loading state and makes a report request. An AbortController prevents an obsolete response from overwriting a newer selection. Category filtering and summary calculations happen locally after the response arrives.

Leaflet is imported in a browser effect because it requires browser globals. The heat plugin attaches to the same Leaflet instance. The map is removed on component cleanup, while subsequent data changes replace the heat layer without recreating the map. A separate circle marks the 1,609.344-metre search radius. Map panning is independent of query selection; clicking requests a new area.

## Why server routes?

The two routes provide a stable same-origin interface, validate query parameters and bound time spent waiting for external services. Upstream hosts are fixed in code; callers cannot use the routes as a general URL proxy. There is no database or persistence layer.

The police response advertises a one-hour public cache lifetime. This is an HTTP caching instruction, not an application cache: behaviour depends on the browser and hosting proxy. Postcode responses are not given an application cache policy. Deployment logs may contain URLs and postcode query strings.

## Design tradeoffs

- A one-mile query avoids downloading a national dataset and keeps exploration local. It cannot compare complete cities.
- Reports are counted equally. Heat intensity indicates overlapping records, not severity, likelihood or individual risk.
- Category summaries are computed from the complete response, while the map can show a selected category.
- Native route handlers keep the backend small. A widely used public service would need rate limiting, monitoring and stronger upstream schema validation.
- The current dashboard remains in one component. Splitting map lifecycle, request state and controls into smaller modules would be useful if the interface grows.

## Known technical constraints

The runtime is a pinned Vinext beta. Map tiles, font resources and APIs require a network connection. The interface reports tile failures, but does not implement offline maps. The server validates broad UK coordinate bounds, not a precise coastline or national boundary. The crime response is checked to be an array, but individual upstream objects are trusted to match the documented schema.
