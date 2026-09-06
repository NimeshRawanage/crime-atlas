# Contributing

Open an issue describing a reproducible problem or proposed improvement before making a large change. For bugs, include the reporting month, selected area and browser, but do not include sensitive personal locations or credentials.

Install the pinned dependencies, create a focused branch and run `pnpm check` before proposing a change. Use `pnpm format` for source and documentation formatting. Keep tests independent of live APIs where practical.

Preserve data attribution, approximate-location notes and coverage limitations. Avoid presenting report density as a safety rating. Update the API and architecture documentation when behaviour changes.

Potential future work includes extracting the map and data hooks into smaller modules, validating upstream object schemas, improving postcode outage classification, and adding browser interaction tests. These are proposed improvements, not existing features.
