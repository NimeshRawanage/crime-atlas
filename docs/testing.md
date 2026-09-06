# Testing

`pnpm check` runs TypeScript, isolated route tests, lint and a production build. GitHub Actions runs the same checks on pushes and pull requests using the committed lockfile.

The route tests use Node's built-in test runner and mocked fetch responses. They exercise input rejection, fixed upstream URLs, JSON pass-through, cache headers and unavailable-service handling without depending on mutable external data. Native TypeScript stripping requires the documented Node.js version.

## Manual release checks

1. Open the dashboard and confirm that an available month appears and data finishes loading.
2. Choose two cities in quick succession; confirm the later city's reports win.
3. Choose a different month and crime type; verify the map and matching count change together.
4. Resolve a valid postcode, an invalid postcode and a Scottish postcode.
5. Click a map point, then pan without clicking. Only the click should change the query centre.
6. Navigate selectors with the keyboard and inspect a narrow viewport and enlarged text.
7. Block an upstream request and verify that an error is shown instead of a zero count.

These manual checks are a checklist, not a claim that every browser and viewport has been tested. Automated tests do not verify map rendering, third-party service uptime or statistical correctness of upstream records.
