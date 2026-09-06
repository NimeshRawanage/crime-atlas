# Deployment and operations

## Node.js deployment

The repository runs independently on a Node.js host; it does not need a vendor-specific hosting account or API key.

1. Install Node.js 22.13 or later and pnpm 11.19.0.
2. Check out the repository and run `pnpm install --frozen-lockfile`.
3. Run `pnpm check`.
4. Start the built application with pnpm exec vinext start --hostname 0.0.0.0 --port 3000.
5. Put a TLS reverse proxy or your hosting platform's HTTPS frontend in front of the process.

The server needs outbound HTTPS access to `data.police.uk` and `api.postcodes.io`. Visitors' browsers need access to OpenStreetMap map tiles, attribution links and font resources. Install development dependencies during the build: TypeScript, Vite and CSS tooling are required.

This is a server application. GitHub Pages cannot execute its API routes. Publishing the repository does not automatically host a working demo.

## Before a public demo

Configure host-level rate limiting, request timeouts, process supervision and appropriate logging retention. Check tile-provider usage terms. No automated deployment workflow is included because hosting credentials and a target platform have not been selected.

Keep `.env` files, credentials, runtime caches and generated build output out of Git. There are no required environment secrets for the default configuration.

## Troubleshooting

| Symptom                         | Check                                                                |
| ------------------------------- | -------------------------------------------------------------------- |
| Months fail to load             | Police.uk availability, outbound HTTPS and proxy timeouts            |
| No reports                      | Selected month, radius and source coverage; do not assume zero crime |
| Basemap missing                 | Browser network access to OpenStreetMap; report summaries may still work     |
| Postcode not found              | Full postcode and Postcodes.io availability                          |
| Old data after Refresh          | Browser/proxy caching and latest available reporting month           |
| Dependency installation blocked | Node/pnpm versions and your organisation's package policy            |

The workspace configuration explicitly disables dependency lifecycle scripts. The checked build uses packaged binaries. Do not enable unrelated lifecycle scripts merely to silence a warning; investigate the dependency and platform requirement first.

